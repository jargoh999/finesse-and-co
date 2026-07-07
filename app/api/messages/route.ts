import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import dbConnect from '@/lib/mongodb';
import { Message } from '@/lib/models';

// Helper function to get user ID from authenticated user
const getUserId = (user: any): string => {
  return user?.email || '';
};

// Send a new message
export async function POST(request: Request) {
  try {
    await dbConnect();
    //@ts-ignore
    const user = await getAuthenticatedUser(request);

    if (!user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { conversationId, content, type = 'text', metadata = {}, tempId } = await request.json();
    const senderId = getUserId(user);

    if (!conversationId || !content) {
      return NextResponse.json(
        { error: 'Conversation ID and content are required' },
        { error: 'Missing required fields' },
                //@ts-ignore

        { status: 400 }
      );
    }

    // Create and save the message
    const message = new Message({
      conversationId,
      sender: senderId,
      content,
      type,
      metadata,
    });

    await message.save();
    
    // Get the populated message with user details
    const savedMessage = await Message.findById(message._id)
      .populate('sender', 'name email image')
      .lean();

    return NextResponse.json({
      success: true,
      message: savedMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// Get messages for a conversation
export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      );
    }

    const query: any = { conversationId };
    
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    if (unreadOnly) {
      query.read = false;
    }

    const messages = await Message.find(query)
      .populate('sender', 'name email image')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // IMPORTANT: Ensure systemData is included in response for Q&A link button rendering
    // Transform messages to include all necessary fields including systemData
    const transformedMessages = messages.map((msg: any) => ({
      ...msg,
      systemData: msg.systemData || null
    }));

    // If this is not a pagination request, mark messages as read
    if (!before) {
      //@ts-ignore

      const messageIds = messages.map(m => m._id);
      if (messageIds.length > 0) {
        await Message.updateMany(
          { _id: { $in: messageIds }, read: false },
          { $set: { read: true } }
        );
      }
    }

    return NextResponse.json({
      success: true,
      messages: transformedMessages.reverse() // Return in chronological order
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// Mark messages as read
export async function PATCH(request: Request) {
  try {
    await dbConnect();
    //@ts-ignore

    const user = await getAuthenticatedUser(request);

    if (!user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { messageIds, conversationId } = await request.json();

    if (!messageIds?.length || !conversationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update messages as read
    const result = await Message.updateMany(
      { _id: { $in: messageIds }, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    return NextResponse.json({
      success: true,
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
