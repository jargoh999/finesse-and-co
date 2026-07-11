import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import dbConnect from '@/lib/mongodb';
import { Message, Conversation } from '@/lib/models';
import { chatEmitter } from '@/lib/chat-emitter';
import { memoryCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
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

    // Verify the conversation exists and user is a participant using cache
    const cacheKey = `conv-participants:${conversationId}`;
    let participants = memoryCache.get(cacheKey);
    if (!participants) {
      const conversation = await Conversation.findById(conversationId).select('participants').lean();
      if (!conversation) {
        return new Response('Conversation not found', { status: 404 });
      }
      participants = conversation.participants.map((p: any) => p.toString());
      memoryCache.set(cacheKey, participants, 60000); // cache for 60s
    }

    // Check if user is a participant in this conversation
    const isParticipant = participants.includes(user.id);

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
      start(controller) {
        // Send initial connection message
        controller.enqueue(`data: ${JSON.stringify({
          type: 'connected',
          message: 'Connected to personal chat stream',
          conversationId
        })}\n\n`);

        // Event listener for chatEmitter
        const eventName = `message:${conversationId}`;
        const handleNewMessage = (data: any) => {
          try {
            controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
          } catch (e) {
            console.error('Error sending message to stream:', e);
          }
        };

        // Subscribe to emitter
        chatEmitter.on(eventName, handleNewMessage);

        // Keep connection alive by sending periodic heartbeat
        const heartbeatInterval = setInterval(() => {
          try {
            controller.enqueue(`data: ${JSON.stringify({
              type: 'heartbeat',
              conversationId
            })}\n\n`);
          } catch (e) {
            console.error('Error sending heartbeat:', e);
          }
        }, 30000);

        // Clean up on client disconnect
        request.signal.addEventListener('abort', () => {
          chatEmitter.off(eventName, handleNewMessage);
          clearInterval(heartbeatInterval);
          try {
            controller.close();
          } catch (e) {
            // Stream might already be closed
          }
        });
      }
    });

    return new Response(stream, { headers });

  } catch (error) {
    console.error('Error in personal chat stream:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
