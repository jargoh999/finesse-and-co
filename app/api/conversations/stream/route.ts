import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { chatEmitter } from '@/lib/chat-emitter';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(`data: ${JSON.stringify({ type: 'connected', userId: user.id })}\n\n`);

        const eventName = `conversation:${user.id}`;
        const handleConversationUpdate = (data: any) => {
          try {
            controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
          } catch (e) {
            console.error('Error sending conversation update to stream:', e);
          }
        };

        chatEmitter.on(eventName, handleConversationUpdate);

        const heartbeatInterval = setInterval(() => {
          try {
            controller.enqueue(`data: ${JSON.stringify({ type: 'heartbeat', userId: user.id })}\n\n`);
          } catch (e) {
            console.error('Error sending heartbeat:', e);
          }
        }, 30000);

        request.signal.addEventListener('abort', () => {
          chatEmitter.off(eventName, handleConversationUpdate);
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
    console.error('Error in conversations stream:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
