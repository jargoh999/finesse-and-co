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

    // Get conversations with their latest messages in one aggregation
    const validConvs = userWithConversations.conversations.filter((conv: any) => conv.conversationId?._id);
    const conversationIds = validConvs.map((conv: any) => conv.conversationId._id);

    const latestMessages = conversationIds.length > 0 ? await Message.aggregate([
      { $match: { conversation: { $in: conversationIds } } },
      { $sort: { createdAt: -1 } },
      { $group: {
        _id: '$conversation',
        latestMessage: { $first: '$$ROOT' }
      }},
      { $lookup: {
        from: 'privateusers',
        localField: 'latestMessage.sender',
        foreignField: '_id',
        as: 'sender'
      }},
      { $unwind: '$sender' },
      { $project: {
        _id: '$latestMessage._id',
        content: '$latestMessage.content',
        sender: {
          _id: '$sender._id',
          name: '$sender.name',
          email: '$sender.email',
          image: '$sender.image'
        },
        timestamp: '$latestMessage.createdAt',
        type: '$latestMessage.type',
        isEdited: '$latestMessage.isEdited',
        editedAt: '$latestMessage.editedAt',
        systemData: '$latestMessage.systemData',
        conversationId: '$_id'
      }}
    ]) : [];

    const conversationsWithMessages = validConvs.map((conv: any) => {
      const latest = latestMessages.find((m: any) => m.conversationId.toString() === conv.conversationId._id.toString());
      return {
        _id: conv.conversationId._id,
        participants: conv.conversationId.participants,
        participant: conv.participant,
        lastMessage: latest || null,
        lastMessageAt: conv.lastMessageAt,
        unreadCount: conv.unreadCount,
        createdAt: conv.conversationId.createdAt
      };
    });

    return NextResponse.json({
      success: true,
      conversations: conversationsWithMessages
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}