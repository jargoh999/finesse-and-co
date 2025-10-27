import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import dbConnect from '@/lib/mongodb';
import { Message, Conversation, PrivateUser } from '@/lib/models';
import { Types } from 'mongoose';

export async function GET(request: Request) {
  try {
      // Get the authenticated user
      //@ts-ignore
    const user = await getAuthenticatedUser(request);

    if (!user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Use a fixed ObjectId for the general chat conversation
    const GENERAL_CHAT_ID = new Types.ObjectId('507f1f77bcf86cd799439011');

    // Check for 'since' parameter for polling
    const url = new URL(request.url);
    const sinceParam = url.searchParams.get('since');

    let query: any = { conversation: GENERAL_CHAT_ID };
    if (sinceParam) {
      query.createdAt = { $gt: new Date(sinceParam) };
    }

    // Find or create the general chat conversation
    let conversation = await Conversation.findById(GENERAL_CHAT_ID);

    if (!conversation) {
      // Create the general chat conversation
      conversation = new Conversation({
        _id: GENERAL_CHAT_ID,
        participants: [], // General chat is open to all
        isGroup: true,
        groupName: 'General Chat'
      });
      await conversation.save();
    }

    // Get messages based on query
    const messages = await Message.find(query)
      .populate('sender', 'name email image')
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

      // Transform messages to match the expected format
      //@ts-ignore
    const transformedMessages = messages.map(msg => ({
      id: msg._id.toString(),
      content: msg.content,
      senderId: msg.sender._id.toString(),
      senderName: msg.sender.name,
      senderImage: msg.sender.image,
      timestamp: msg.createdAt,
      type: msg.type || 'text'
    }));

    return NextResponse.json({
      messages: transformedMessages
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
      // Get the authenticated user
      //@ts-ignore
    const user = await getAuthenticatedUser(request);

    if (!user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { content, type = 'text' } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find the user by email to get their ObjectId
    const senderUser = await PrivateUser.findOne({ email: user.email });
    if (!senderUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Use a fixed ObjectId for the general chat conversation
    const GENERAL_CHAT_ID = new Types.ObjectId('507f1f77bcf86cd799439011');

    // Find or create the general chat conversation
    let conversation = await Conversation.findById(GENERAL_CHAT_ID);

    if (!conversation) {
      // Create the general chat conversation
      conversation = new Conversation({
        _id: GENERAL_CHAT_ID,
        participants: [senderUser._id], // Add current user as participant
        isGroup: true,
        groupName: 'General Chat'
      });
      await conversation.save();
    }

    // Create new message with proper ObjectIds
    const newMessage = new Message({
      conversation: GENERAL_CHAT_ID,
      sender: senderUser._id,
      content: content.trim(),
      type,
      status: 'sent'
    });

    await newMessage.save();

    // Populate the sender information for the response
    await newMessage.populate('sender', 'name email image');

    return NextResponse.json({
      message: 'Message sent successfully',
      messageId: newMessage._id
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
