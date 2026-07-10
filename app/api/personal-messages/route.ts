import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import dbConnect from '@/lib/mongodb';
import { Message, Conversation, PrivateUser } from '@/lib/models';
import { chatEmitter } from '@/lib/chat-emitter';
import { memoryCache } from '@/lib/cache';

// Send a new personal message (supports text and media <2MB)
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

    // Verify the conversation exists and user is a participant using cache
    const cacheKey = `conv-participants:${conversationId}`;
    let participants = memoryCache.get(cacheKey);
    if (!participants) {
      const conversation = await Conversation.findById(conversationId).select('participants').lean();
      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }
      participants = conversation.participants.map((p: any) => p.toString());
      memoryCache.set(cacheKey, participants, 60000); // cache for 60s
    }

    // Check if user is a participant in this conversation
    const isParticipant = participants.includes(user.id);

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'You are not a participant in this conversation' },
        { status: 403 }
      );
    }

    // Create the message
    const messageData: any = {
      conversation: conversationId,
      sender: user.id,
      content: content.trim(),
      type,
      status: 'sent'
    };

    const message = new Message(messageData);
    await message.save();

    // Identify the recipient (the other participant)
    const recipientId = participants.find((p: string) => p !== user.id);

    // Update conversation's last message + update both participants' lastMessageAt
    // and increment unreadCount for the recipient — all in parallel
    await Promise.all([
      Conversation.updateOne(
        { _id: conversationId },
        { $set: { lastMessage: message._id } }
      ),
      // Update sender: reset their unreadCount to 0 (they're actively chatting), update lastMessageAt
      PrivateUser.updateOne(
        { _id: user.id, 'conversations.conversationId': conversationId },
        {
          $set: {
            'conversations.$.lastMessageAt': new Date(),
            'conversations.$.unreadCount': 0
          }
        }
      ),
      // Update recipient: increment unreadCount + update lastMessageAt
      recipientId
        ? PrivateUser.updateOne(
            { _id: recipientId, 'conversations.conversationId': conversationId },
            {
              $inc: { 'conversations.$.unreadCount': 1 },
              $set: { 'conversations.$.lastMessageAt': new Date() }
            }
          )
        : Promise.resolve()
    ]);

    // Construct response manually to save another DB call
    const populatedMessage = {
      _id: message._id.toString(),
      content: message.content,
      sender: {
        _id: user.id,
        name: user.name,
        email: user.email
      },
      timestamp: message.createdAt || new Date(),
      type: message.type,
    };

    // Emit event for real-time SSE listener (0 DB queries for streaming!)
    chatEmitter.emit(`message:${conversationId}`, {
      type: 'new_message',
      message: populatedMessage,
      conversationId
    });

    return NextResponse.json({
      success: true,
      message: populatedMessage
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
    const limit = parseInt(searchParams.get('limit') || '80');

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
      .populate('sender', 'name email')
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();

    // Convert to frontend format
    const formattedMessages = messages.map((msg: any) => ({
      _id: msg._id,
      content: msg.content,
      sender: msg.sender,
      timestamp: msg.createdAt,
      type: msg.type,
      isEdited: msg.isEdited || false,
      editedAt: msg.editedAt,
      systemData: msg.systemData,
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

// PATCH - Edit a message (only the sender can edit their own messages)
export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();

    const user = await getAuthenticatedUser(request);
    if (!user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { messageId, content } = await request.json();

    if (!messageId || !content?.trim()) {
      return NextResponse.json({ error: 'Message ID and content are required' }, { status: 400 });
    }

    // Find the message and verify ownership
    const message = await Message.findById(messageId).populate('sender', '_id');
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const senderId = typeof message.sender === 'object' ? message.sender._id?.toString() : message.sender?.toString();
    if (senderId !== user.id) {
      return NextResponse.json({ error: 'You can only edit your own messages' }, { status: 403 });
    }

    // Update the message
    message.content = content.trim();
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    const populated = await Message.findById(messageId)
      .populate('sender', 'name email')
      .lean() as any;

    return NextResponse.json({
      success: true,
      message: {
        _id: populated._id,
        content: populated.content,
        sender: populated.sender,
        timestamp: populated.createdAt,
        type: populated.type,
        isEdited: populated.isEdited,
        editedAt: populated.editedAt,
      }
    });

  } catch (error) {
    console.error('Error editing message:', error);
    return NextResponse.json({ error: 'Failed to edit message' }, { status: 500 });
  }
}

// DELETE - Bulk delete messages (only the sender can delete their own messages)
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const user = await getAuthenticatedUser(request);
    if (!user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { messageIds } = await request.json();

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json({ error: 'Message IDs array is required' }, { status: 400 });
    }

    // Only delete messages where sender is the current user
    const result = await Message.deleteMany({
      _id: { $in: messageIds },
      sender: user.id,
    });

    return NextResponse.json({
      success: true,
      deleted: result.deletedCount,
    });

  } catch (error) {
    console.error('Error deleting messages:', error);
    return NextResponse.json({ error: 'Failed to delete messages' }, { status: 500 });
  }
}