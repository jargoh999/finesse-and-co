import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import dbConnect from '@/lib/mongodb';
import { Message, Conversation, PrivateUser } from '@/lib/models';

// Send a new personal message
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Get authenticated user from cookie
    const user = await getAuthenticatedUser(request);

    if (!user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { conversationId, content, type = 'text' } = await request.json();

    if (!conversationId || !content) {
      return NextResponse.json(
        { error: 'Conversation ID and content are required' },
        { status: 400 }
      );
    }

    // Verify the conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Check if user is a participant in this conversation
    const isParticipant = conversation.participants.some((p: any) =>
      p.toString() === user.id
    );

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'You are not a participant in this conversation' },
        { status: 403 }
      );
    }

    // Get the PrivateUser document for the sender
    const senderUser = await PrivateUser.findById(user.id);
    if (!senderUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create the message
    const message = new Message({
      conversation: conversationId,
      sender: user.id,
      content: content.trim(),
      type,
      status: 'sent'
    });

    await message.save();

    // Update conversation's last message
    conversation.lastMessage = message._id;
    await conversation.save();

    // Populate the message with sender details
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email image')
      .lean();

    return NextResponse.json({
      success: true,
      message: {
        _id: populatedMessage._id,
        content: populatedMessage.content,
        sender: populatedMessage.sender,
        timestamp: populatedMessage.createdAt,
        type: populatedMessage.type
      }
    });

  } catch (error) {
    console.error('Error sending personal message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// Get personal messages for a conversation
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Get authenticated user from cookie
    const user = await getAuthenticatedUser(request);

    if (!user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const since = searchParams.get('since');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    // Verify the conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Check if user is a participant in this conversation
    const isParticipant = conversation.participants.some((p: any) =>
      p.toString() === user.id
    );

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'You are not a participant in this conversation' },
        { status: 403 }
      );
    }

    // Build query
    const query: any = { conversation: conversationId };

    if (since) {
      query.createdAt = { $gt: new Date(since) };
    }

    // Get messages
    const messages = await Message.find(query)
      .populate('sender', 'name email image')
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();

    // Convert to frontend format
    const formattedMessages = messages.map((msg: any) => ({
      _id: msg._id,
      content: msg.content,
      sender: msg.sender,
      timestamp: msg.createdAt,
      type: msg.type
    }));

    return NextResponse.json({
      success: true,
      messages: formattedMessages
    });

  } catch (error) {
    console.error('Error fetching personal messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}