'use client';

import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, CheckCheck, Mic, MoreVertical, Paperclip, Send, Smile } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { getCurrentUserFromSession } from '@/lib/auth-helper';

interface Message {
  _id?: string;
  id?: string;
  conversationId: string;
  sender: string | { _id: string; name: string; email: string; image?: string };
  content: string;
  type?: string;
  systemData?: {
    type: string;
    publicId: string;
    question: string;
  };
  read?: boolean;
  readAt?: Date;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

interface ChatProps {
  conversationId: string;
  otherUserId: string;
}

export function Chat({ conversationId, otherUserId }: ChatProps) {
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Get current user from localStorage session
  useEffect(() => {
    const user = getCurrentUserFromSession();
    setCurrentUser(user);
  }, []);

  const {
    messages,
    sendMessage: sendChatMessage,
    markAsRead,
    isSending,
    typingUsers,
    setTyping,
  } = useChat();

  // Filter and sort messages for the current conversation
  const conversationMessages = messages
    .filter(msg => msg.conversationId === conversationId)
    .sort((a, b) =>
      new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
    );

  // Get typing users for this conversation
  const currentTypingUsers = typingUsers[conversationId] || [];
  const isOtherUserTyping = currentTypingUsers.length > 0;

  // Set up typing indicator
  const { onType, stopTyping } = useTypingIndicator(
    conversationId,
    (_, isTyping) => {
      setTyping(conversationId, isTyping);
    },
    3000
  );

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  // Mark messages as read when the chat is opened
  useEffect(() => {
    if (!currentUser) return;

    const unreadMessageIds = conversationMessages
      .filter(msg =>
        !msg.read &&
        (typeof msg.sender === 'string'
          ? msg.sender !== currentUser.email
          : msg.sender?.email !== currentUser.email)
      )
      .map(msg => msg._id || '');

    if (unreadMessageIds.length > 0) {
      markAsRead(unreadMessageIds, conversationId);
    }
  }, [conversationId, conversationMessages, markAsRead, currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMessage = e.target.value;
    setMessage(newMessage);

    if (newMessage.trim()) {
      onType();
    } else {
      stopTyping();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentUser) return;

    try {
      await sendChatMessage(message, conversationId);
      setMessage('');
      stopTyping();
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderMessageStatus = (msg: Message) => {
    if (!msg.read) {
      return <Check className="h-3 w-3 text-muted-foreground" />;
    }
    return <CheckCheck className="h-3 w-3 text-blue-500" />;
  };

  const renderMessage = (msg: Message, index: number) => {
    const isCurrentUser = typeof msg.sender === 'string'
      ? msg.sender === currentUser?.email
      : msg.sender?.email === currentUser?.email;

    const senderName = typeof msg.sender === 'string'
      ? msg.sender.split('@')[0]
      : msg.sender?.name || 'Unknown';

    return (
      <div
        key={msg._id || index}
        className={cn(
          'flex mb-4',
          isCurrentUser ? 'justify-end' : 'justify-start'
        )}
      >
        <div className={cn(
          'max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg px-4 py-2',
          isCurrentUser
            ? 'bg-primary text-primary-foreground rounded-br-none'
            : 'bg-muted rounded-bl-none'
        )}>
          {/* Header with sender info - only for received messages */}
          {!isCurrentUser && (
            <div className="mb-1">
              <p className="text-xs font-semibold text-gray-900">
                {senderName}
              </p>
              <span className="text-[10px] text-gray-400">
                {msg.createdAt ? format(new Date(msg.createdAt), 'MMM d, yyyy h:mm a') : ''}
              </span>
            </div>
          )}

          {msg.type === 'system' ? (
            // System message with Q&A link button
            <div className="space-y-3">
              <p className="text-sm leading-relaxed break-words font-normal">
                {msg.content}
              </p>
              {msg.systemData?.type === 'qa_started' && (
                <div className="pt-2">
                  <Button
                  //@ts-ignore
                    onClick={() => window.open(`/anonymous/answer/${msg.systemData.publicId}`, '_blank')}
                    className="bg-[#c7b793] hover:bg-[#b8a57e] text-white rounded-lg h-10 px-5 text-sm font-medium shadow-sm transition-all duration-200 w-full"
                  >
                    Answer Question
                  </Button>
                </div>
              )}
            </div>
          ) : (
            // Regular message
            <p className="text-sm">{msg.content}</p>
          )}

          {/* Timestamp at bottom for current user messages */}
          {isCurrentUser && (
            <div className="flex justify-end mt-1 space-x-1">
              <span className="text-[10px] text-blue-100">
                {msg.createdAt ? format(new Date(msg.createdAt), 'MMM d, yyyy h:mm a') : ''}
              </span>
              {renderMessageStatus(msg)}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="border-b p-4 flex items-center justify-between bg-background">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src="" />
            <AvatarFallback>{otherUserId.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{otherUserId}</h3>
            <p className="text-xs text-muted-foreground">
              {isOtherUserTyping ? 'typing...' : 'online'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea
        ref={scrollAreaRef}
        className="flex-1 p-4 overflow-y-auto"
      >
        <div className="space-y-2">
          {conversationMessages.map((msg, index) => renderMessage(msg, index))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message input */}
      <div className="border-t p-4 bg-background">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <Button type="button" variant="ghost" size="icon">
            <Paperclip className="h-5 w-5" />
          </Button>
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={message}
              onChange={handleInputChange}
              onBlur={stopTyping}
              placeholder="Type a message..."
              className="pr-12"
              disabled={isSending}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
            >
              <Smile className="h-5 w-5" />
            </Button>
          </div>
          <Button
            type="submit"
            disabled={!message.trim() || isSending}
            className="h-10 w-10 p-0 rounded-full flex items-center justify-center"
          >
            {isSending ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
