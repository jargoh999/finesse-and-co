import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import dbConnect from '@/lib/mongodb';
import { Conversation, Message } from '@/lib/models';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Get authenticated user from cookie or Authorization header
    const user = await getAuthenticatedUser(req);
    if (!user?.email) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');
    if (!conversationId) {
      return new Response('Conversation ID required', { status: 400 });
    }

    // Verify user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: user.id,
    });
    if (!conversation) {
      return new Response('Conversation not found', { status: 404 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        const sendEvent = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        // Send heartbeat every 10 seconds
        const heartbeatInterval = setInterval(() => {
          sendEvent({ type: 'heartbeat' });
        }, 10000);

        // Watch for new messages using MongoDB change streams
        const changeStream = Message.watch([
          {
            $match: {
              'fullDocument.conversation': conversationId,
              'operationType': 'insert'
            }
          },
        ]);

        changeStream.on('change', async (change: any) => {
          try {
            if (change.operationType === 'insert') {
              const message = change.fullDocument;

              // Populate the message with sender details
              const populatedMessage = await Message.findById(message._id)
                .populate('sender', 'name email image')
                .lean();

              if (populatedMessage) {
                sendEvent({
                  type: 'new_message',
                  message: {
                    _id: populatedMessage._id,
                    content: populatedMessage.content,
                    sender: populatedMessage.sender,
                    timestamp: populatedMessage.createdAt,
                    type: populatedMessage.type
                  }
                });
              }
            }
          } catch (error) {
            console.error('Error processing change stream event:', error);
          }
        });

        // Handle client disconnect
        req.signal.addEventListener('abort', () => {
          clearInterval(heartbeatInterval);
          changeStream.close();
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });
  } catch (error) {
    console.error('Error in personal chat stream:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
