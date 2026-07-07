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
  X
} from 'lucide-react';
import { format } from 'date-fns/format';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { cn } from '@/lib/utils';
import EmojiPicker from 'emoji-picker-react';

interface Message {
  systemData: any;
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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
    // Poll for new messages every 1 second as fallback for better real-time experience
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
    }, 1000);
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
          'max-w-[280px] sm:max-w-sm rounded-2xl px-4 py-3.5 shadow-sm relative',
          isCurrentUser
            ? 'bg-[#c7b793] text-white ml-auto rounded-tr-none'
            : 'bg-white border border-[#e9e4d9] rounded-tl-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
        )}>
          {message.type === 'system' ? (
            // System message with Q&A link button
            <div className="space-y-3">
              <p className="text-[13.5px] leading-relaxed break-words font-normal text-gray-800">
                {message.content}
              </p>
              {message.systemData?.type === 'qa_started' && (
                <div className="pt-2">
                  <Button
                    onClick={() => window.open(`/anonymous/answer/${message.systemData.publicId}`, '_blank')}
                    className="bg-[#c7b793] hover:bg-[#b8a57e] text-white rounded-lg h-10 px-5 text-sm font-medium shadow-sm transition-all duration-200 w-full"
                  >
                    Answer Question
                  </Button>
                </div>
              )}
            </div>
          ) : (
            // Regular message
            <>
              {/* Header with sender info - only for received messages */}
              {!isCurrentUser && (
                <div className="mb-1.5 flex items-baseline justify-between gap-4">
                  <p className="text-xs font-semibold text-[#a38c5b]">
                    {message.sender.name}
                  </p>
                  {/* <span className="text-[10px] text-gray-400">
                    {message.timestamp ? format(new Date(message.timestamp), 'h:mm a') : ''}
                  </span> */}
                </div>
              )}

              <p className={cn(
                'text-[13.5px] leading-relaxed break-words font-normal',
                isCurrentUser ? 'text-white' : 'text-gray-800'
              )}>
                {message.content}
              </p>
            </>
          )}

          {/* Timestamp at bottom */}
          <div className="flex items-center justify-end mt-1.5">
            <span className={cn(
              'text-[10px]',
              isCurrentUser ? 'text-white/85' : 'text-gray-400'
            )}>
              {message.timestamp ? format(new Date(message.timestamp), 'h:mm a') : ''}
            </span>
          </div>

          {/* Message tail */}
          <div className={cn(
            'absolute top-0 w-3 h-3 overflow-hidden',
            isCurrentUser ? '-right-2.5' : '-left-2.5'
          )}>
            <div className={cn(
              'absolute w-3 h-3 transform rotate-45',
              isCurrentUser
                ? 'bg-[#c7b793] -left-1.5 top-0'
                : 'bg-white border-l border-t border-[#e9e4d9] left-1.5 top-0'
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
    <div className="flex flex-col h-screen bg-[#faf8f5] overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-[#c7b793]/15 px-4 py-3 flex items-center justify-between min-h-[64px]">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="md:hidden min-h-[44px] min-w-[44px]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <Avatar className="h-10 w-10 border border-[#c7b793]/15">
            <AvatarImage src={conversation.participant?.image} />
            <AvatarFallback className="bg-[#c7b793] text-white text-sm font-semibold shadow-sm">
              {conversation.participant?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>

          <div>
            <h1 className="text-base font-semibold text-gray-900 truncate">
              {conversation.participant?.name || conversation.participant?.email}
            </h1>
            <p className="text-sm text-gray-500">
              {isTyping
                ? 'typing...'
                : conversation.participant?.status === 'online' 
                  ? 'online' 
                  : 'offline'
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
      <div className="flex-1 overflow-y-auto bg-[#faf8f5] -webkit-overflow-scrolling-touch scroll-smooth">
        <div className="max-w-4xl mx-auto space-y-4 p-3 sm:p-4 pb-24 sm:pb-20">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-[#c7b793] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-sm font-medium text-gray-600">Loading conversation...</p>
                <p className="text-xs text-gray-400">Establishing secure channel</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] py-12 text-center">
              <div className="w-16 h-16 bg-white border border-[#c7b793]/15 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-base font-semibold text-gray-800 mb-1.5">Encrypt communication channel</h3>
              <p className="text-gray-500 max-w-xs mb-6 text-xs leading-relaxed">
                Send an initial message to establish a zero-knowledge communication link with {conversation.participant?.name || conversation.participant?.email}.
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
      <div className="bg-white border-t border-[#c7b793]/15 p-3 sm:p-4 shadow-lg sticky bottom-0">
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
                className="pl-4 pr-12 sm:pl-5 sm:pr-14 py-3.5 rounded-full border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#c7b793] focus:ring-2 focus:ring-[#c7b793]/10 transition-all duration-200 text-sm min-h-[44px] text-black resize-none"
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
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full p-0 transition-all duration-200 ${!newMessage.trim()
                  ? 'bg-gray-100 text-gray-300'
                  : 'bg-[#c7b793] hover:bg-[#b8a57e] text-white shadow-md transform hover:scale-105'
                  }`}
              >
                <Send className="h-3.5 w-3.5" />
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
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Add emoji"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-14 left-0 z-50">
                      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-2">
                        <div className="flex items-center justify-between mb-2 px-2">
                          <span className="text-xs font-medium text-gray-600">Emoji</span>
                          <button
                            onClick={() => setShowEmojiPicker(false)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <EmojiPicker
                          onEmojiClick={(emojiObject) => {
                            setNewMessage(prev => prev + emojiObject.emoji);
                            setShowEmojiPicker(false);
                          }}
                          width={280}
                          height={350}
                        />
                      </div>
                    </div>
                  )}
                </div>
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
