import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import dbConnect from '@/lib/mongodb';
import { Message, Conversation } from '@/lib/models';
import { Types } from 'mongoose';

export async function GET(request: Request) {
  try {
    // Get the authenticated user
    //@ts-ignore
    const user = await getAuthenticatedUser(request);

    if (!user?.email) {
      return new Response('Unauthorized', { status: 401 });
    }

    const url = new URL(request.url);
    const conversationId = url.searchParams.get('conversationId');

    if (!conversationId) {
      return new Response('Conversation ID is required', { status: 400 });
    }

    await dbConnect();

    // Verify the conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return new Response('Conversation not found', { status: 404 });
    }

    // Check if user is a participant in this conversation
    const isParticipant = conversation.participants.some((p: any) =>
      p.toString() === user.id
    );

    if (!isParticipant) {
      return new Response('Unauthorized', { status: 403 });
    }

    // Set up SSE headers
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // Create a ReadableStream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial connection message
        controller.enqueue(`data: ${JSON.stringify({
          type: 'connected',
          message: 'Connected to personal chat stream',
          conversationId
        })}\n\n`);

        // Store the last message timestamp to track new messages
        let lastMessageTime = new Date();

        // Function to check for new messages in this conversation
        const checkForNewMessages = async () => {
          try {
            const newMessages = await Message.find({
              conversation: conversationId,
              createdAt: { $gt: lastMessageTime }
            })
              .populate('sender', 'name email image')
              .sort({ createdAt: 1 })
              .lean();

            if (newMessages.length > 0) {
              // Update last message time
              lastMessageTime = new Date(newMessages[newMessages.length - 1].createdAt);

              // Send new messages to client
              newMessages.forEach((message: {
                _id: any;
                content: string;
                sender: { _id: any; name: string; email: string; image?: string };
                createdAt: Date;
                type?: string;
              }) => {
                const transformedMessage = {
                  _id: message._id.toString(),
                  content: message.content,
                  sender: {
                    _id: message.sender._id.toString(),
                    name: message.sender.name,
                    email: message.sender.email,
                    image: message.sender.image
                  },
                  createdAt: message.createdAt,
                  type: message.type || 'text'
                };
                controller.enqueue(`data: ${JSON.stringify({
                  type: 'new_message',
                  message: transformedMessage,
                  conversationId
                })}\n\n`);
              });
            }
          } catch (error) {
            console.error('Error checking for new messages:', error);
          }
        };

        // Check for new messages every second
        const intervalId = setInterval(checkForNewMessages, 1000);

        // Clean up on client disconnect
        request.signal.addEventListener('abort', () => {
          clearInterval(intervalId);
          controller.close();
        });

        // Keep connection alive by sending periodic heartbeat
        const heartbeatInterval = setInterval(() => {
          controller.enqueue(`data: ${JSON.stringify({
            type: 'heartbeat',
            conversationId
          })}\n\n`);
        }, 30000);

        // Clean up heartbeat on disconnect
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeatInterval);
        });

      }
    });

    return new Response(stream, { headers });

  } catch (error) {
    console.error('Error in personal chat stream:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
