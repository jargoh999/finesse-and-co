import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

const AnonymousAnswerSchema = new mongoose.Schema({
  questionPublicId: { type: String, required: true },
  answer: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const AnonymousQuestionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  question: { type: String, required: true },
  publicId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

const AnonymousAnswer = mongoose.models.AnonymousAnswer || mongoose.model('AnonymousAnswer', AnonymousAnswerSchema);
const AnonymousQuestion = mongoose.models.AnonymousQuestion || mongoose.model('AnonymousQuestion', AnonymousQuestionSchema);

// POST - Submit an anonymous answer (public endpoint, no auth required)
export async function POST(req: NextRequest) {
  try {
    const { publicId, answer } = await req.json();
    
    if (!publicId || !answer || answer.trim().length === 0) {
      return NextResponse.json({ error: 'Public ID and answer are required' }, { status: 400 });
    }

    await dbConnect();
    
    // Verify the question exists and is active
    const question = await AnonymousQuestion.findOne({ publicId, isActive: true });
    
    if (!question) {
      return NextResponse.json({ error: 'Question not found or inactive' }, { status: 404 });
    }
    
    // Create the answer
    const newAnswer = await AnonymousAnswer.create({
      questionPublicId: publicId,
      answer: answer.trim(),
    });
    
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error submitting anonymous answer:', error);
    return NextResponse.json({ error: 'Failed to submit answer' }, { status: 500 });
  }
}
