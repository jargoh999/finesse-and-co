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
  X,
  Ban
} from 'lucide-react';
import { format } from 'date-fns/format';
import { cn } from '@/lib/utils';
import EmojiPicker from 'emoji-picker-react';

interface AnonymousConversation {
  senderId: string;
  sender: {
    _id: string;
    name: string;
    email: string;
    image?: string;
  } | null;
  messages: any[];
  lastMessage: any;
  unreadCount: number;
  isAnonymous: true;
}

interface AnonymousDMConversationProps {
  conversation: AnonymousConversation;
  currentUser: any;
  onBack: () => void;
  onRefresh: () => void;
}

export function AnonymousDMConversation({ conversation, currentUser, onBack, onRefresh }: AnonymousDMConversationProps) {
  const [messages, setMessages] = useState(conversation.messages || []);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMessages(conversation.messages || []);
    setupPollingConnection();
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [conversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const setupPollingConnection = () => {
    // Poll for new messages every 1 second
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const lastMessage = messages[messages.length - 1];
        const since = lastMessage ? new Date(lastMessage.createdAt) : new Date(0);

        const response = await fetch(
          `/api/anonymous-dm?since=${since.toISOString()}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.conversations && data.conversations.length > 0) {
            const currentConv = data.conversations.find((c: any) => c.senderId === conversation.senderId);
            if (currentConv && currentConv.messages) {
              setMessages(prev => {
                const newMessages = currentConv.messages.filter((msg: any) =>
                  !prev.some(existing => existing._id === msg._id)
                );
                return [...prev, ...newMessages];
              });
            }
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 1000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/anonymous-dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: conversation.senderId,
          content: newMessage.trim()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([...messages, data.dm]);
        setNewMessage('');
        onRefresh();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBlock = async () => {
    try {
      const response = await fetch('/api/anonymous-dm/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: conversation.senderId,
          block: !isBlocked
        }),
      });

      if (response.ok) {
        setIsBlocked(!isBlocked);
      }
    } catch (error) {
      console.error('Error toggling block:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-white to-[#faf8f5]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#c7b793]/15 bg-white">
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
            <AvatarFallback className="bg-[#c7b793] text-white text-sm font-semibold shadow-sm">
              ?
            </AvatarFallback>
          </Avatar>

          <div>
            <h1 className="text-base font-semibold text-gray-900 truncate">
              Anonymous
            </h1>
            <p className="text-sm text-gray-500">
              {isBlocked ? 'Blocked' : 'Identity hidden'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-1">
          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleBlock}
              className={cn(
                "text-gray-400 hover:text-red-500 hover:bg-red-50/50 p-2 min-h-[44px] min-w-[44px]",
                isBlocked && "text-red-500 bg-red-50/50"
              )}
              title={isBlocked ? 'Unblock' : 'Block'}
              aria-label={isBlocked ? 'Unblock user' : 'Block user'}
            >
              <Ban className="h-4.5 w-4.5" />
            </Button>
            <span className="text-[9px] text-gray-400 sm:hidden mt-0.5">{isBlocked ? 'Unblock' : 'Block'}</span>
          </div>
          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-gray-700 p-2 min-h-[44px] min-w-[44px]"
              title="More options"
              aria-label="More options"
            >
              <MoreVertical className="h-4.5 w-4.5" />
            </Button>
            <span className="text-[9px] text-gray-400 sm:hidden mt-0.5">More</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const isCurrentUser = message.senderId === currentUser?.id;
          
          return (
            <div
              key={index}
              className={cn(
                'flex mb-4 px-2',
                isCurrentUser ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'relative max-w-[75%] px-4 py-3 rounded-2xl',
                  isCurrentUser
                    ? 'bg-[#c7b793] text-white rounded-br-md'
                    : 'bg-white border border-[#e9e4d9] text-gray-800 rounded-bl-md'
                )}
              >
                {message.isSystemMessage ? (
                  // IMPORTANT: System message with Q&A link button for Anonymous DM
                  <div className="space-y-3">
                    <p className="text-[13.5px] leading-relaxed break-words font-normal">
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
                    {message.senderId !== currentUser?.id && (
                      <div className="flex items-center mb-2">
                        <p className="text-xs font-semibold text-[#a38c5b]">
                          Anonymous
                        </p>
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
                    {message.createdAt ? format(new Date(message.createdAt), 'h:mm a') : ''}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-[#c7b793]/15">
        {isBlocked ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">You have blocked this sender</p>
            <Button
              onClick={toggleBlock}
              variant="outline"
              className="mt-2 border-[#c7b793]/30 text-gray-600 hover:bg-[#c7b793]/10"
            >
              Unblock
            </Button>
          </div>
        ) : (
          <form onSubmit={sendMessage} className="space-y-3">
            <div className="relative">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="bg-[#faf8f5] border-transparent rounded-2xl focus:bg-white focus:border-[#c7b793]/40 focus:ring-[#c7b793]/10 text-sm h-12 pr-12 text-gray-800 placeholder-gray-400"
                maxLength={500}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                {newMessage.length}/500
              </div>
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

              <Button
                type="submit"
                disabled={!newMessage.trim() || isLoading}
                className="bg-[#c7b793] hover:bg-[#b8a57e] text-white rounded-full h-10 px-4"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
