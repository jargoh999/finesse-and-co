import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import dbConnect from '@/lib/mongodb';
import { Conversation, Message, PrivateUser } from '@/lib/models';

// Create or get existing conversation
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

    const { participantId } = await request.json();

    if (!participantId) {
      return NextResponse.json(
        { error: 'Participant ID is required' },
        { status: 400 }
      );
    }

    // Get both users
    const [currentUser, participant] = await Promise.all([
      PrivateUser.findById(user.id),
      PrivateUser.findById(participantId)
    ]);

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Current user not found' },
        { status: 404 }
      );
    }

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    // Check if conversation already exists between these users
    let conversation = await Conversation.findOne({
      participants: { $all: [user.id, participantId] }
    });

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        participants: [user.id, participantId]
      });
      await conversation.save();

      // Update both users' conversations lists
      await Promise.all([
        PrivateUser.findByIdAndUpdate(user.id, {
          $push: {
            conversations: {
              participant: participantId,
              conversationId: conversation._id,
              lastMessageAt: new Date()
            }
          }
        }),
        PrivateUser.findByIdAndUpdate(participantId, {
          $push: {
            conversations: {
              participant: user.id,
              conversationId: conversation._id,
              lastMessageAt: new Date()
            }
          }
        })
      ]);
    }

    // Get recent messages for this conversation
    const messages = await Message.find({ conversation: conversation._id })
      .populate('sender', 'name email image')
      .sort({ createdAt: 1 })
      .limit(50)
      .lean();

    // Convert messages to frontend format
    const formattedMessages = messages.map((msg: any) => ({
      _id: msg._id,
      content: msg.content,
      sender: msg.sender,
      timestamp: msg.createdAt,
      type: msg.type
    }));

    return NextResponse.json({
      success: true,
      conversation: {
        _id: conversation._id,
        participants: conversation.participants,
        lastMessage: conversation.lastMessage,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      },
      messages: formattedMessages
    });

  } catch (error) {
    console.error('Error creating/getting conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}

// Get user's conversations
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

    // Get user's conversations with populated data
    const userWithConversations = await PrivateUser.findById(user.id)
      .populate('conversations.participant', 'name email image status')
      .populate('conversations.conversationId');

    if (!userWithConversations) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Debug: Log the conversations structure
    console.log('User conversations:', JSON.stringify(userWithConversations.conversations, null, 2));

    // Get conversations with their latest messages
    const conversationsWithMessages = await Promise.all(
      userWithConversations.conversations.map(async (conv: any) => {
        // Skip if conversationId is null or not populated
        if (!conv.conversationId || !conv.conversationId._id) {
          console.warn('Invalid conversation found:', {
            conversationId: conv.conversationId,
            participant: conv.participant,
            lastMessageAt: conv.lastMessageAt
          });

          // Clean up invalid conversation reference
          try {
            await PrivateUser.findByIdAndUpdate(user.id, {
              $pull: {
                conversations: { conversationId: conv.conversationId }
              }
            });
            console.log('Removed invalid conversation reference');
          } catch (cleanupError) {
            console.error('Error cleaning up invalid conversation:', cleanupError);
          }

          return {
            _id: null, // or handle this case appropriately
            participants: [],
            participant: conv.participant,
            lastMessage: null,
            lastMessageAt: conv.lastMessageAt,
            unreadCount: conv.unreadCount,
            createdAt: null,
            error: 'Invalid conversation'
          };
        }

        const messages = await Message.find({ conversation: conv.conversationId._id })
          .sort({ createdAt: -1 })
          .limit(1)
          .populate('sender', 'name email image')
          .lean();

        return {
          _id: conv.conversationId._id,
          participants: conv.conversationId.participants,
          participant: conv.participant,
          lastMessage: messages[0] || null,
          lastMessageAt: conv.lastMessageAt,
          unreadCount: conv.unreadCount,
          createdAt: conv.conversationId.createdAt
        };
      })
    );

    // Filter out invalid conversations and log warnings
    const validConversations = conversationsWithMessages.filter(conv => {
      if (!conv._id) {
        console.warn('Skipping invalid conversation:', conv);
        return false;
      }
      return true;
    });

    return NextResponse.json({
      success: true,
      conversations: validConversations
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}