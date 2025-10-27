'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Send,
  ArrowLeft,
  MoreVertical,
  Paperclip,
  Smile,
  Check,
  CheckCheck
} from 'lucide-react';
import { format } from 'date-fns/format';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { cn } from '@/lib/utils';

interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    name: string;
    email: string;
    image?: string;
  };
  timestamp: Date;
  type: string;
  read?: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
}

interface Conversation {
  _id: string;
  participants: any[];
  participant: {
    _id: string;
    name: string;
    email: string;
    image?: string;
    status: string;
  };
  lastMessage?: {
    content: string;
    sender: { name: string; email: string };
    createdAt: Date;
  };
  lastMessageAt: Date;
  unreadCount: number;
}

interface PersonalChatProps {
  conversation: Conversation;
  currentUser: any;
  onBack: () => void;
}

export function PersonalChat({ conversation, currentUser, onBack }: PersonalChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Debug: Log the conversation object
  console.log('PersonalChat received conversation:', conversation);

  // Validate conversation object
  if (!conversation || !conversation._id) {
    console.error('Invalid conversation object:', conversation);
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error: Invalid conversation</p>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  // Load messages when conversation changes
  useEffect(() => {
    loadMessages();
    setupRealTimeConnection();

    return () => {
      cleanupRealTimeConnection();
    };
  }, [conversation._id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set up typing indicator
  const { onType, stopTyping } = useTypingIndicator(
    conversation._id,
    (convId, typing) => {
      setIsTyping(typing);
    },
    3000
  );

  const setupRealTimeConnection = () => {
    // Try SSE first
    if (typeof EventSource !== 'undefined') {
      setupSSEConnection();
    } else {
      setupPollingConnection();
    }
  };

  const setupSSEConnection = () => {
    try {
      const eventSource = new EventSource(`/api/personal-chat/stream?conversationId=${conversation._id}`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        console.log('Connected to personal chat stream');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'new_message' && data.message) {
            setMessages(prev => {
              const exists = prev.some(m => m._id === data.message._id);
              return exists ? prev : [...prev, data.message];
            });
          } else if (data.type === 'typing' && data.userId !== currentUser?.email) {
            setIsTyping(data.isTyping);
          } else if (data.type === 'heartbeat') {
            setIsConnected(true);
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        setIsConnected(false);
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

        const response = await fetch(
          `/api/personal-messages?conversationId=${conversation._id}&since=${since.toISOString()}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.messages && data.messages.length > 0) {
            setMessages(prev => {
              const newMessages = data.messages.filter((msg: Message) =>
                !prev.some(existing => existing._id === msg._id)
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
      const response = await fetch(`/api/personal-messages?conversationId=${conversation._id}`);
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

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    try {
      const response = await fetch('/api/personal-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: conversation._id,
          content: newMessage.trim(),
          type: 'text'
        }),
      });

      if (response.ok) {
        setNewMessage('');
        stopTyping();
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

  const renderMessageStatus = (message: Message) => {
    if (message.sender.email !== currentUser?.email) return null;

    if (message.status === 'sending') {
      return <div className="animate-spin h-3 w-3 border border-gray-300 border-t-transparent rounded-full" />;
    } else if (message.read) {
      return <CheckCheck className="h-3 w-3 text-blue-400" />;
    } else {
      return <Check className="h-3 w-3 text-gray-300" />;
    }
  };

  const renderMessage = (message: Message) => {
    const isCurrentUser = message.sender.email === currentUser?.email;

    return (
      <div
        key={message._id}
        className={cn(
          'flex mb-4 px-2',
          isCurrentUser ? 'justify-end' : 'justify-start'
        )}
      >
        <div className={cn(
          'max-w-[280px] sm:max-w-sm rounded-2xl px-4 py-3 shadow-sm relative',
          isCurrentUser
            ? 'bg-blue-600 text-white ml-auto rounded-br-md'
            : 'bg-white border border-gray-200 rounded-bl-md'
        )}>
          {/* Header with sender info - only for received messages */}
          {!isCurrentUser && (
            <div className="mb-2">
              <p className="text-sm font-semibold text-gray-900">
                {message.sender.name}
              </p>
              <span className="text-xs text-gray-400">
                {message.timestamp ? format(new Date(message.timestamp), 'MMM d, yyyy h:mm a') : ''}
              </span>
            </div>
          )}

          <p className={cn(
            'text-sm leading-relaxed break-words',
            isCurrentUser ? 'text-white' : 'text-gray-800'
          )}>
            {message.content}
          </p>

          {/* Timestamp at bottom for current user messages */}
          {isCurrentUser && (
            <div className="flex items-center justify-end mt-2 space-x-1">
              <span className="text-xs text-blue-100">
                {message.timestamp ? format(new Date(message.timestamp), 'MMM d, yyyy h:mm a') : ''}
              </span>
              {renderMessageStatus(message)}
            </div>
          )}

          {/* Message tail */}
          <div className={cn(
            'absolute -bottom-1 w-3 h-3 overflow-hidden',
            isCurrentUser ? 'right-0' : 'left-0'
          )}>
            <div className={cn(
              'absolute w-3 h-3 transform -rotate-45 origin-bottom-left',
              isCurrentUser
                ? 'bg-blue-600 -top-2 right-0'
                : 'bg-white border-l border-b border-gray-200 -top-2 left-0'
            )} />
          </div>
        </div>
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between min-h-[64px]">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="md:hidden min-h-[44px] min-w-[44px]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={conversation.participant?.image} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm">
                {conversation.participant?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div
              className={cn(
                'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white',
                getStatusColor(conversation.participant?.status || 'offline')
              )}
            />
          </div>

          <div>
            <h1 className="text-base font-semibold text-gray-900 truncate">
              {conversation.participant?.name || conversation.participant?.email}
            </h1>
            <p className="text-sm text-gray-500 flex items-center">
              <span className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
              {isTyping
                ? 'typing...'
                : isConnected
                  ? (conversation.participant?.status === 'online' ? 'online' : 'offline')
                  : 'connecting...'
              }
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="text-gray-500 hover:text-gray-700 p-2 min-h-[44px] min-w-[44px]"
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 -webkit-overflow-scrolling-touch scroll-smooth">
        <div className="max-w-4xl mx-auto space-y-4 p-3 sm:p-4 pb-24 sm:pb-20">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-sm font-medium text-gray-600">Loading conversation...</p>
                <p className="text-xs text-gray-400">Connecting to chat</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] py-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-3xl">💬</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Start a conversation</h3>
              <p className="text-gray-500 max-w-sm mb-6 text-sm">
                Send a message to {conversation.participant?.name || conversation.participant?.email} to begin chatting.
              </p>
            </div>
          ) : (
            <>
              {messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-3 sm:p-4 shadow-lg sticky bottom-0">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={sendMessage} className="relative">
            <div className="relative">
              <Input
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  if (e.target.value.trim()) {
                    onType();
                  } else {
                    stopTyping();
                  }
                }}
                placeholder={`Message ${conversation.participant?.name || conversation.participant?.email}...`}
                className="pl-3 pr-12 sm:pl-4 sm:pr-14 py-3 sm:py-4 rounded-full border border-gray-300 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 text-sm min-h-[44px] sm:min-h-[48px] text-black resize-none"
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
                className={`absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-10 sm:w-10 rounded-full p-0 transition-all duration-200 ${!newMessage.trim()
                  ? 'bg-gray-200 text-gray-400'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg transform hover:scale-105'
                  }`}
              >
                <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </div>

            <div className="flex items-center justify-between mt-3 px-1">
              <div className="flex space-x-2">
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Attach file"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Add emoji"
                >
                  <Smile className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center">
                <span className="text-xs text-gray-400">
                  {newMessage.length}/500
                </span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
