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

    await dbConnect();

    // Use a fixed ObjectId for the general chat conversation
    const GENERAL_CHAT_ID = new Types.ObjectId('507f1f77bcf86cd799439011');

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
        controller.enqueue(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to chat stream' })}\n\n`);

        // Store the last message timestamp to track new messages
        let lastMessageTime = new Date();

        // Function to check for new messages
        const checkForNewMessages = async () => {
          try {
            const newMessages = await Message.find({
              conversation: GENERAL_CHAT_ID,
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
                  id: message._id.toString(),
                  content: message.content,
                  senderId: message.sender._id.toString(),
                  senderName: message.sender.name,
                  senderImage: message.sender.image,
                  timestamp: message.createdAt,
                  type: message.type || 'text'
                };
                controller.enqueue(`data: ${JSON.stringify({ type: 'new_message', message: transformedMessage })}\n\n`);
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
          controller.enqueue(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`);
        }, 30000);

        // Clean up heartbeat on disconnect
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeatInterval);
        });

      }
    });

    return new Response(stream, { headers });

  } catch (error) {
    console.error('Error in chat stream:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
