'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, ArrowLeft, LogOut } from 'lucide-react';
import { format } from 'date-fns/format';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { getCurrentUserFromSession as getClientUser, clearCurrentUserSession } from '@/lib/client-auth';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderImage?: string;
  timestamp: Date;
  type: 'text' | 'system' | 'typing';
}

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check authentication on component mount
  useEffect(() => {
    const detectReload = () => {
      try {
        const navEntry = performance.getEntriesByType('navigation')[0] as any;
        const isReload = navEntry?.type === 'reload' || 
                         (performance.navigation && performance.navigation.type === 1);
        if (isReload) {
          clearCurrentUserSession();
        }
      } catch (e) {
        // Fallback: if Performance API unavailable, don't clear on navigation
      }
    };

    detectReload();

    const user = getClientUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
  }, [router]);

  // Load existing messages
  useEffect(() => {
    if (currentUser) {
      loadMessages();
      setupRealTimeConnection();
    }

    return () => {
      cleanupRealTimeConnection();
    };
  }, [currentUser]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const setupRealTimeConnection = () => {
    if (!currentUser) return;

    // Try SSE first (more efficient)
    if (typeof EventSource !== 'undefined') {
      setupSSEConnection();
    } else {
      // Fallback to polling for older browsers
      setupPollingConnection();
    }
  };

  const setupSSEConnection = () => {
    try {
      const eventSource = new EventSource('/api/chat/stream');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        console.log('Connected to chat stream');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'new_message' && data.message) {
            // Check if message already exists to avoid duplicates
            setMessages(prev => {
              const exists = prev.some(m => m.id === data.message.id);
              return exists ? prev : [...prev, data.message];
            });
          } else if (data.type === 'heartbeat') {
            // Keep connection alive
            setIsConnected(true);
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };
      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        setIsConnected(false);
        // Fallback to polling if SSE fails
        setupPollingConnection();
      };
    } catch (error) {
      console.error('Failed to setup SSE:', error);
      setupPollingConnection();
    }
  };
  const setupPollingConnection = () => {
    // Poll for new messages every 3 seconds as fallback
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const lastMessage = messages[messages.length - 1];
        const since = lastMessage ? new Date(lastMessage.timestamp) : new Date(0);
        const response = await fetch(`/api/chat/messages?since=${since.toISOString()}`);
        if (response.ok) {
          const data = await response.json();
          if (data.messages && data.messages.length > 0) {
            setMessages(prev => {
              const newMessages = data.messages.filter((msg: Message) =>
                !prev.some(existing => existing.id === msg.id)
              );
              return [...prev, ...newMessages];
            });
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);
  };

  const cleanupRealTimeConnection = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsConnected(false);
  };

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/chat/messages');
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clearCurrentUserSession();
    router.push('/login');
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !currentUser) return;

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          type: 'text'
        }),
      });

      if (response.ok) {
        setNewMessage('');
        // Real-time stream will automatically show the new message
      } else {
        console.error('Error sending message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c7b793] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white flex flex-col" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
      `}</style>
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">General Chat</h1>
              <p className="text-xs text-gray-500 flex items-center">
                <span className={`w-2 h-2 rounded-full mr-1 ${isConnected ? 'bg-[#c7b793]' : 'bg-red-500'}`}></span>
                {isConnected ? 'Live' : 'Offline'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-gray-500 hover:text-[#c7b793]"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4 overflow-y-auto">
          <div className="max-w-3xl mx-auto space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 border-4 border-[#c7b793] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm font-medium text-gray-600">Loading conversation...</p>
                  <p className="text-xs text-gray-400">Connecting to the chat server</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <div className="w-24 h-24 bg-[#c7b793]/10 rounded-2xl flex items-center justify-center mb-4">
                  <span className="text-4xl">💬</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No messages yet</h3>
                <p className="text-gray-500 max-w-md mb-6">
                  Be the first to send a message and start the conversation!
                </p>
                <div className="flex space-x-2">
                  <span className="px-3 py-1 bg-[#c7b793]/10 text-[#c7b793] text-xs font-medium rounded-full">Type below</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">Press Enter to send</span>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`group flex ${message.type === 'system' ? 'justify-center' : message.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.type === 'system' ? (
                      <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-full shadow-sm">
                        {message.content}
                      </div>
                    ) : (
                      <div
                        className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${message.senderId === currentUser.id ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}
                      >
                        <div className="relative group">
                          <Avatar className="h-8 w-8 flex-shrink-0 transition-transform group-hover:scale-110">
                            <AvatarImage src={message.senderImage} />
                            <AvatarFallback className="text-xs bg-[#c7b793] text-white">
                              {message.senderName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div
                          className={`relative rounded-2xl px-4 py-2 shadow-sm transition-all duration-200 ${message.senderId === currentUser.id
                            ? 'bg-[#c7b793] text-white rounded-br-none'
                            : 'bg-white border border-gray-100 rounded-bl-none shadow-sm'}`}
                        >
                          {message.senderId !== currentUser.id && (
                            <div className="mb-1">
                              <p className="text-xs font-semibold text-gray-900">
                                {message.senderName}
                              </p>
                              <span className="text-[10px] text-gray-400">
                                {format(message.timestamp, 'MMM d, yyyy h:mm a')}
                              </span>
                            </div>
                          )}
                          <p className={`text-sm ${message.senderId === currentUser.id ? 'text-white' : 'text-gray-800'}`}>
                            {message.content}
                          </p>
                          {message.senderId === currentUser.id && (
                            <div className="flex items-center justify-end mt-1 space-x-1">
                              <span className="text-[10px] text-white/80">
                                {format(message.timestamp, 'MMM d, yyyy h:mm a')}
                              </span>
                              <span className="text-white/60">•</span>
                              <span className="text-xs text-white/80">
                                {'✓✓'}
                              </span>
                            </div>
                          )}

                          {/* Message status indicator */}
                          {message.senderId === currentUser.id && (
                            <div className="absolute -bottom-1.5 right-0 w-3 h-3 overflow-hidden">
                              <div className="absolute -top-3 right-0 w-3 h-3 bg-[#c7b793] transform -rotate-45 origin-bottom-left"></div>
                            </div>
                          )}
                          {message.senderId !== currentUser.id && (
                            <div className="absolute -bottom-1.5 left-0 w-3 h-3 overflow-hidden">
                              <div className="absolute -top-3 left-0 w-3 h-3 bg-white border-l border-t border-gray-200 transform -rotate-45 origin-bottom-right"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-100 p-4 shadow-sm">
          <div className="max-w-3xl mx-auto ">
            <form onSubmit={sendMessage} className="relative">
              <div className="relative">
                <Input
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                  }}
                  placeholder="Type a message..."
                  className="pl-4 pr-12 py-6 rounded-2xl border-0 bg-gray-50 focus-visible:ring-2 focus-visible:ring-[#c7b793] transition-all duration-200 text-black"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(e);
                    }
                  }}
                />
                <Button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className={`absolute right-2 bottom-2 h-10 w-10 rounded-full p-0 transition-all duration-200 ${!newMessage.trim() ? 'bg-gray-200 text-gray-400' : 'bg-[#c7b793] hover:bg-[#c7b793]/80 shadow-lg transform hover:scale-105'}`}
                >
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send message</span>
                </Button>
              </div>

              <div className="flex items-center justify-between mt-2 px-1">
                <div className="flex space-x-1">
                  <button
                    type="button"
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                    title="Attach file"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                    title="Add emoji"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400">
                    {newMessage.length}/500
                  </span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
