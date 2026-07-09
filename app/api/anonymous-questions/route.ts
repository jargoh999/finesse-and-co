import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { PrivateUser, Conversation, Message } from '@/lib/models';
import mongoose from 'mongoose';

const AnonymousQuestionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  question: { type: String, required: true },
  publicId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

const AnonymousQuestion = mongoose.models.AnonymousQuestion || mongoose.model('AnonymousQuestion', AnonymousQuestionSchema);

// IMPORTANT: Anonymous DM Schema for Q&A notifications
const AnonymousDMSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  isSystemMessage: { type: Boolean, default: false },
  systemData: { type: Object }, // For Q&A links, etc.
});

const AnonymousDM = mongoose.models.AnonymousDM || mongoose.model('AnonymousDM', AnonymousDMSchema);

// GET - Get all anonymous questions for current user, or single question by publicId
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const publicId = searchParams.get('publicId');
    
    // IMPORTANT: If publicId is provided, fetch single question for answer page
    if (publicId) {
      const question = await AnonymousQuestion.findOne({ publicId });
      if (!question) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      }
      return NextResponse.json({ question });
    }
    
    // Otherwise, return all questions for current user
    const questions = await AnonymousQuestion.find({ userId: user.id }).sort({ createdAt: -1 });
    
    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error fetching anonymous questions:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

// POST - Create a new anonymous question
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { question } = await req.json();
    
    if (!question || question.trim().length === 0) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    await dbConnect();
    
    // Generate unique public ID
    const publicId = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    
    const newQuestion = await AnonymousQuestion.create({
      userId: user.id,
      question: question.trim(),
      publicId,
    });
    
    // IMPORTANT: Only send Q&A notifications to contacts with existing conversations
    // Find all conversations where the current user is a participant
    const existingConversations = await Conversation.find({
      participants: { $in: [user.id] }
    });
    
    // Extract unique user IDs from these conversations (excluding the sender)
    const contactUserIds = new Set<string>();
    existingConversations.forEach((conv: any) => {
      conv.participants.forEach((participantId: string) => {
        if (participantId !== user.id) {
          contactUserIds.add(participantId);
        }
      });
    });
    
    // Get the actual user objects for these contacts
    const contactUsers = await PrivateUser.find({ _id: { $in: Array.from(contactUserIds) } });
    
    // IMPORTANT: Send system message to Anonymous DM only for contacts with existing conversations
    // This sends Q&A notifications to users who have chatted with the sender before
    const dms = contactUsers.map((u: { _id: { toString: () => any; }; }) => ({
      senderId: user.id,
      receiverId: u._id.toString(),
      content: `${user.name || user.email} started a new Q&A: "${question.trim()}"`,
      isSystemMessage: true,
      systemData: {
        type: 'qa_started',
        publicId: newQuestion.publicId,
        question: question.trim(),
        senderName: user.name || user.email
      }
    }));
    
    await AnonymousDM.insertMany(dms);
    
    return NextResponse.json({ question: newQuestion }, { status: 201 });
  } catch (error) {
    console.error('Error creating anonymous question:', error);
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}

// DELETE - Delete an anonymous question
export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const publicId = searchParams.get('publicId');
    
    if (!publicId) {
      return NextResponse.json({ error: 'Public ID is required' }, { status: 400 });
    }

    await dbConnect();
    
    const question = await AnonymousQuestion.findOne({ publicId, userId: user.id });
    
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    
    await AnonymousQuestion.deleteOne({ _id: question._id });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting anonymous question:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}
