import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import dbConnect from '@/lib/dbConnect';
import { PrivateUser, ChatRequest } from '@/lib/models';
import { Types } from 'mongoose';

export async function POST(request: Request) {
  try {
      // Get the authenticated user using custom token
      //@ts-ignore
    const user = await getAuthenticatedUser(request);

    if (!user?.email) {
      console.log('No authenticated user found in chat request API');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('Authenticated user in chat request:', user.email);

    const { recipientId, message } = await request.json();

    if (!recipientId) {
      return NextResponse.json(
        { error: 'Recipient ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Get sender and recipient
    const [sender, recipient] = await Promise.all([
      PrivateUser.findOne({ email: user.email }),
      PrivateUser.findById(recipientId)
    ]);

    if (!sender || !recipient) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('Sender found:', sender.email, 'conversations before:', sender.conversations?.length || 0);

    // Check if there's an existing request
    const existingRequest = await ChatRequest.findOne({
      sender: sender._id,
      recipient: recipient._id,
      status: 'pending'
    });

    if (existingRequest) {
      return NextResponse.json({
        message: 'Chat request already sent',
        requestId: existingRequest._id,
        existing: true
      });
    }

    // Create a new chat request
    const newRequest = new ChatRequest({
      sender: sender._id,
      recipient: recipient._id,
      message: message || `New chat request from ${sender.name}`,
      status: 'pending'
    });

    await newRequest.save();

    // Add the request to the recipient's chatRequests array
    await PrivateUser.findByIdAndUpdate(recipient._id, {
      $push: { chatRequests: newRequest._id }
    });

    // Create a conversation between users
    const conversationId = new Types.ObjectId();

    // Add conversation to both users
    await Promise.all([
      PrivateUser.findByIdAndUpdate(sender._id, {
        $push: {
          conversations: {
            participant: recipient._id,
            conversationId,
            lastMessageAt: new Date()
          }
        }
      }),
      PrivateUser.findByIdAndUpdate(recipient._id, {
        $push: {
          conversations: {
            participant: sender._id,
            conversationId,
            lastMessageAt: new Date()
          }
        }
      })
    ]);

    // Verify conversations were added
    const updatedSender = await PrivateUser.findById(sender._id);
    console.log('Sender conversations after update:', updatedSender?.conversations?.length || 0);

    return NextResponse.json({
      message: 'Chat request sent successfully',
      requestId: newRequest._id,
      conversationId
    });

  } catch (error) {
    console.error('Error sending chat request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
