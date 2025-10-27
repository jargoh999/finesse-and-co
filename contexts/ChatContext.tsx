'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { getCurrentUserFromSession } from '@/lib/auth-helper';

export interface Message {
  _id?: string;
  id?: string; // For client-side temporary IDs
  conversationId: string;
  sender: string | { _id: string; name: string; email: string; image?: string };
  content: string;
  type?: 'text' | 'image' | 'file' | 'audio';
  read?: boolean;
  readAt?: Date;
  metadata?: Record<string, any>;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  createdAt?: Date;
  updatedAt?: Date;
}

interface ChatContextType {
  messages: Message[];
  sendMessage: (content: string, conversationId: string, type?: string, metadata?: Record<string, any>) => Promise<Message>;
  markAsRead: (messageIds: string[], conversationId: string) => Promise<boolean>;
  loadMoreMessages: (conversationId: string, before?: Date) => Promise<Message[]>;
  isSending: boolean;
  unreadCounts: Record<string, number>;
  typingUsers: Record<string, string[]>; // { [conversationId]: userId[] }
  setTyping: (conversationId: string, isTyping: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const typingTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  // Get current user from localStorage session
  useEffect(() => {
    const user = getCurrentUserFromSession();
    setCurrentUser(user);
  }, []);

  // Helper to get user ID from session
  const getCurrentUserId = useCallback(() => {
    return currentUser?.email || '';
  }, [currentUser]);

  // Load initial messages for a conversation
  const loadMessages = useCallback(async (conversationId: string, before?: Date) => {
    try {
      const params = new URLSearchParams({
        conversationId,
        ...(before && { before: before.toISOString() }),
      });

      const response = await fetch(`/api/messages?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const { messages: newMessages } = await response.json();
      return newMessages || [];
    } catch (error) {
      console.error('Error loading messages:', error);
      return [];
    }
  }, []);

  // Load more messages (for infinite scroll)
  const loadMoreMessages = useCallback(async (conversationId: string, before?: Date) => {
    try {
      const newMessages = await loadMessages(conversationId, before);
      setMessages(prev => [...newMessages, ...prev]);
      return newMessages;
    } catch (error) {
      console.error('Error loading more messages:', error);
      return [];
    }
  }, [loadMessages]);

  // Send a new message
  const sendMessage = useCallback(async (
    content: string,
    conversationId: string,
    type = 'text',
    metadata = {}
  ): Promise<Message> => {
    if (!currentUser) {
      throw new Error('Not authenticated');
    }

    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      conversationId,
      sender: currentUser.email,
      content,
      //@ts-ignore
      type,
      metadata,
      status: 'sending',
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, tempMessage]);
    setIsSending(true);

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          content,
          type,
          metadata,
          tempId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const { message: savedMessage } = await response.json();

      // Update the message with the server response
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempId
            ? { ...savedMessage, status: 'sent' }
            : msg
        )
      );

      return savedMessage;
    } catch (error) {
      console.error('Error sending message:', error);

      // Update the message with error status
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempId
            ? { ...msg, status: 'error' }
            : msg
        )
      );

      throw error;
    } finally {
      setIsSending(false);
    }
  }, [currentUser]);

  // Mark messages as read
  const markAsRead = useCallback(async (messageIds: string[], conversationId: string) => {
    try {
      const response = await fetch('/api/messages', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageIds,
          conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark messages as read');
      }

      // Update local state
      setMessages(prev =>
        prev.map(msg =>
          messageIds.includes(msg._id || '')
            ? { ...msg, read: true, readAt: new Date() }
            : msg
        )
      );

      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  }, []);

  // Set typing status
  const setTyping = useCallback((conversationId: string, isTyping: boolean) => {
    const userId = getCurrentUserId();
    if (!userId) return;

    // Clear existing timeout
    if (typingTimeouts.current[conversationId]) {
      clearTimeout(typingTimeouts.current[conversationId]);
    }

    // Set a timeout to automatically remove typing status after 3 seconds
    if (isTyping) {
      typingTimeouts.current[conversationId] = setTimeout(() => {
        setTypingUsers(prev => ({
          ...prev,
          [conversationId]: (prev[conversationId] || []).filter(id => id !== userId)
        }));
      }, 3000);
    }

    setTypingUsers(prev => {
      const currentTypingUsers = new Set(prev[conversationId] || []);

      if (isTyping) {
        currentTypingUsers.add(userId);
      } else {
        currentTypingUsers.delete(userId);
      }

      return {
        ...prev,
        [conversationId]: Array.from(currentTypingUsers),
      };
    });
  }, [getCurrentUserId]);

  // Load unread counts on mount
  useEffect(() => {
    if (!currentUser) return;

    const fetchUnreadCounts = async () => {
      try {
        const response = await fetch('/api/messages/unread-counts');
        if (response.ok) {
          const { counts } = await response.json();
          setUnreadCounts(counts || {});
        }
      } catch (error) {
        console.error('Error fetching unread counts:', error);
      }
    };

    fetchUnreadCounts();
  }, [currentUser]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        sendMessage,
        markAsRead,
        loadMoreMessages,
        isSending,
        unreadCounts,
        typingUsers,
        setTyping,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
