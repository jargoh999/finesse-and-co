import { useEffect, useRef, useCallback, useState } from 'react';

interface SSEMessage {
  type: string;
  content?: string;
  from?: string;
  recipientId?: string;
  isTyping?: boolean;
  timestamp?: string;
  [key: string]: any;
}

export function useSSE(userId: string, token: string, onMessage: (data: SSEMessage) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!userId || !token) return;

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Create URL with token as query parameter (SSE doesn't support custom headers in EventSource)
    const url = new URL(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/sse`);
    url.searchParams.append('userId', userId);
    url.searchParams.append('token', token);
    
    // Create new EventSource connection
    const eventSource = new EventSource(url.toString(), {
      withCredentials: true
    });

    eventSource.onopen = () => {
      console.log('SSE connection opened');
      setIsConnected(true);
      reconnectAttempts.current = 0;
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      setIsConnected(false);
      
      // Attempt to reconnect with exponential backoff
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current += 1;
        
        reconnectTimeout.current = setTimeout(() => {
          console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})`);
          connect();
        }, delay);
      } else {
        console.error('Max reconnection attempts reached');
      }
    };

    eventSourceRef.current = eventSource;

    return () => {
      eventSource.close();
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [userId, token, onMessage]);

  // Connect on mount and when dependencies change
  useEffect(() => {
    const cleanup = connect();
    return () => {
      cleanup?.();
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [connect]);

  // Function to send a message (using fetch since SSE is one-way)
  const sendMessage = useCallback(async (message: SSEMessage) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...message,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [userId, token]);

  return { isConnected, sendMessage };
}
