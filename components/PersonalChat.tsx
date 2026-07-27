
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Send,
  ArrowLeft,
  MoreVertical,
  Smile,
  X,
  CheckSquare,
  Square,
  Trash2,
  Edit2,
  Check,
  CornerDownLeft,
  Reply,
  Lock,
  Unlock,
  Ban,
} from 'lucide-react';
import { format } from 'date-fns';
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
  isEdited?: boolean;
  editedAt?: Date;
  replyTo?: {
    messageId: string;
    senderName: string;
    content: string;
  };
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
  const [isSending, setIsSending] = useState(false);
  const pendingMessageIdRef = useRef<string | null>(null);

  // Select mode for multi-delete
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit mode
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [contextMenuMsgId, setContextMenuMsgId] = useState<string | null>(null);

  // IMPORTANT: Reply mode for smooth UX
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  // IMPORTANT: Private mode for screenshot prevention
  const [privateMode, setPrivateMode] = useState(false);

  // IMPORTANT: Block user functionality
  const [isBlocked, setIsBlocked] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  
  // Track timestamp and length to safely prevent recursive rendering loops
  const lastTimestampRef = useRef<string>(new Date(0).toISOString());
  const messagesCountRef = useRef<number>(0);

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

  // Set up typing indicator
  const { onType, stopTyping } = useTypingIndicator(
    conversation._id,
    (convId, typing) => {
      setIsTyping(typing);
    },
    3000
  );

  // Load messages when conversation changes
  useEffect(() => {
    loadMessages();
    setupRealTimeConnection();
    checkBlockStatus();

    return () => {
      cleanupRealTimeConnection();
    };
  }, [conversation._id]);

  // FIX: Scroll only executes when the actual array length changes, breaking the infinite cycle
  useEffect(() => {
    if (messages.length !== messagesCountRef.current) {
      messagesCountRef.current = messages.length;
      scrollToBottom();
    }
  }, [messages.length]);

  // Reset timestamp when conversation changes to avoid stale polling state
  useEffect(() => {
    lastTimestampRef.current = new Date(0).toISOString();
    setIsSending(false);
    pendingMessageIdRef.current = null;
  }, [conversation._id]);

  // Confirm send state when SSE delivers the pending message
  useEffect(() => {
    if (!isSending || !pendingMessageIdRef.current) return;
    const timeout = setTimeout(() => {
      setNewMessage('');
      stopTyping();
      setIsSending(false);
      pendingMessageIdRef.current = null;
    }, 4000);
    return () => clearTimeout(timeout);
  }, [isSending, messages, stopTyping]);

  // Focus edit input when editing
  useEffect(() => {
    if (editingMessageId) {
      editInputRef.current?.focus();
    }
  }, [editingMessageId]);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenuMsgId) return;
    const handler = () => setContextMenuMsgId(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [contextMenuMsgId]);

  const setupRealTimeConnection = () => {
    cleanupRealTimeConnection(); // Clean up existing routines first
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
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'new_message' && data.message) {
            setMessages(prev => {
              const exists = prev.some(m => m._id === data.message._id);
              if (exists) return prev;
              return [...prev, data.message];
            });

            if (pendingMessageIdRef.current && data.message._id === pendingMessageIdRef.current) {
              setNewMessage('');
              stopTyping();
              setIsSending(false);
              pendingMessageIdRef.current = null;
            }
          } else if (data.type === 'typing' && data.userId !== currentUser?.email) {
            setIsTyping(data.isTyping);
          } else if (data.type === 'heartbeat') {
            setIsConnected(true);
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        cleanupRealTimeConnection();
        setupPollingConnection(); // Fallback cleanly to polling without compounding timers
      };

    } catch (error) {
      console.error('Failed to setup SSE:', error);
      setupPollingConnection();
    }
  };

  const setupPollingConnection = () => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/personal-messages?conversationId=${conversation._id}&since=${lastTimestampRef.current}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.messages && data.messages.length > 0) {
            const newest = data.messages[data.messages.length - 1];
            if (newest?.timestamp) {
              lastTimestampRef.current = new Date(newest.timestamp).toISOString();
            }
            setMessages(prev => {
              const newMessages = data.messages.filter((msg: Message) =>
                !prev.some(existing => existing._id === msg._id)
              );
              return newMessages.length > 0 ? [...prev, ...newMessages] : prev;
            });
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 4000); // Bumped to 4s to minimize background connection choking
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

  const checkBlockStatus = async () => {
    try {
      const response = await fetch(`/api/block-status?userId=${conversation.participant?._id}`);
      if (response.ok) {
        const data = await response.json();
        setIsBlocked(data.isBlocked || false);
      }
    } catch (error) {
      console.error('Error checking block status:', error);
    }
  };

  const toggleBlock = async () => {
    try {
      const response = await fetch('/api/block-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockedUserId: conversation.participant?._id,
          block: !isBlocked
        })
      });

      if (response.ok) {
        setIsBlocked(!isBlocked);
      }
    } catch (error) {
      console.error('Error toggling block:', error);
    }
  };

  const renderMessageContent = (content: string) => {
    // First, parse markdown-style links [text](url) and render as clickable links
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      // Add the link
      parts.push(
        <a
          key={match.index}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/50 hover:text-white/50 underline"
        >
          {match[1]}
        </a>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    // If no markdown links found, check for plain URLs
    if (parts.length === 1 && typeof parts[0] === 'string') {
      const plainText = parts[0];
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urlParts = [];
      let urlLastIndex = 0;
      let urlMatch;

      while ((urlMatch = urlRegex.exec(plainText)) !== null) {
        // Add text before the URL
        if (urlMatch.index > urlLastIndex) {
          urlParts.push(plainText.substring(urlLastIndex, urlMatch.index));
        }

        // Add the URL as a clickable link
        urlParts.push(
          <a
            key={urlMatch.index}
            href={urlMatch[1]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 underline"
          >
            {urlMatch[1]}
          </a>
        );

        urlLastIndex = urlMatch.index + urlMatch[0].length;
      }

      // Add remaining text
      if (urlLastIndex < plainText.length) {
        urlParts.push(plainText.substring(urlLastIndex));
      }

      return urlParts.length > 0 ? urlParts : plainText;
    }

    return parts.length > 0 ? parts : content;
  };

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/personal-messages?conversationId=${conversation._id}&limit=200`);
      if (response.ok) {
        const data = await response.json();
        const msgs = data.messages || [];
        setMessages(msgs);
        if (msgs.length > 0) {
          lastTimestampRef.current = new Date(msgs[msgs.length - 1].timestamp).toISOString();
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();

    const cleanMessage = newMessage.trim();
    if (!cleanMessage || isSending) return;

    setIsSending(true);

    // IMPORTANT: Clear reply state after sending
    const replyToMessage = replyingTo;
    if (replyingTo) {
      setReplyingTo(null);
    }
    try {
      const response = await fetch('/api/personal-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: conversation._id,
          content: cleanMessage,
          type: 'text',
          // IMPORTANT: Include reply metadata if replying to a message
          replyTo: replyToMessage ? {
            messageId: replyToMessage._id,
            senderName: replyToMessage.sender.name,
            content: replyToMessage.content
          } : undefined
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const sentMessage = data.message;
        pendingMessageIdRef.current = sentMessage?._id || null;

        if (sentMessage) {
          setMessages(prev => {
            const exists = prev.some(m => m._id === sentMessage._id);
            if (exists) return prev;
            return [...prev, sentMessage];
          });
          if (sentMessage.timestamp) {
            lastTimestampRef.current = new Date(sentMessage.timestamp).toISOString();
          }
        }

        setNewMessage('');
        stopTyping();
        setIsSending(false);
        pendingMessageIdRef.current = null;
      } else {
        setIsSending(false);
        pendingMessageIdRef.current = null;
        console.error('Backend returned an error trying to save the message');
      }
    } catch (error) {
      setIsSending(false);
      pendingMessageIdRef.current = null;
      console.error('Network error during sendMessage:', error);
    }
  };

  // ── Multi-select delete ───────────────────────────────────────
  const toggleSelectMode = () => {
    setSelectMode(prev => !prev);
    setSelectedIds(new Set());
    setContextMenuMsgId(null);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/personal-messages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageIds: Array.from(selectedIds) }),
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => !selectedIds.has(m._id)));
        setSelectedIds(new Set());
        setSelectMode(false);
      }
    } catch (err) {
      console.error('Error deleting messages:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Edit message ──────────────────────────────────────────────
  const startEdit = (msg: Message) => {
    setEditingMessageId(msg._id);
    setEditContent(msg.content);
    setContextMenuMsgId(null);
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  // IMPORTANT: Reply functions for smooth UX
  const startReply = (message: Message) => {
    setReplyingTo(message);
    messageInputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  // IMPORTANT: Double-tap handler for replying to messages
  const lastTapRef = useRef<number>(0);
  const handleDoubleTap = (message: Message) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    
    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Double tap detected - only allow replying to other users' messages
      if (message.sender.email !== currentUser?.email) {
        startReply(message);
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const submitEdit = async () => {
    if (!editContent.trim() || !editingMessageId) return;
    setIsEditing(true);
    try {
      const res = await fetch('/api/personal-messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: editingMessageId, content: editContent.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => prev.map(m =>
          m._id === editingMessageId
            ? { ...m, content: data.message.content, isEdited: true, editedAt: data.message.editedAt }
            : m
        ));
        setEditingMessageId(null);
        setEditContent('');
      }
    } catch (err) {
      console.error('Error editing message:', err);
    } finally {
      setIsEditing(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const renderMessage = (message: Message) => {
    const isCurrentUser = message.sender.email === currentUser?.email;
    const isSelected = selectedIds.has(message._id);
    const showContextMenu = contextMenuMsgId === message._id;

    return (
      <div
        key={message._id}
        className={cn(
          'flex mb-4 px-2 group',
          isCurrentUser ? 'justify-end' : 'justify-start'
        )}
        onClick={() => {
          if (selectMode && isCurrentUser) toggleSelect(message._id);
        }}
        onTouchStart={() => handleDoubleTap(message)}
        onDoubleClick={() => {
          // Desktop double-click support
          if (!isCurrentUser) startReply(message);
        }}
      >
        {/* Select mode checkbox (only own messages) */}
        {selectMode && isCurrentUser && (
          <div className="flex items-center mr-2 self-center">
            <button
              onClick={(e) => { e.stopPropagation(); toggleSelect(message._id); }}
              className="text-[#c7b793]"
            >
              {isSelected
                ? <CheckSquare className="h-5 w-5" />
                : <Square className="h-5 w-5 text-gray-400" />
              }
            </button>
          </div>
        )}

        <div className="relative">
          <div className={cn(
            'max-w-[280px] sm:max-w-sm rounded-2xl px-4 py-3.5 shadow-sm relative transition-all duration-150',
            isCurrentUser
              ? 'bg-[#c7b793] text-white ml-auto rounded-tr-none'
              : 'bg-white border border-[#e9e4d9] rounded-tl-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]',
            isSelected && 'ring-2 ring-[#c7b793] ring-offset-1'
          )}>
            {message.type === 'system' ? (
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
              <>
                {/* IMPORTANT: Show reply context if this is a reply */}
                {message.replyTo && (
                  <div className={cn(
                    "mb-2 pb-2 border-b transition-all duration-200 ease-in-out",
                    isCurrentUser ? "border-white/20" : "border-gray-200"
                  )}>
                    <div className="flex items-center space-x-1.5">
                      <CornerDownLeft className={cn(
                        "h-3 w-3",
                        isCurrentUser ? "text-white/70" : "text-gray-400"
                      )} />
                      <p className={cn(
                        "text-xs",
                        isCurrentUser ? "text-white/70" : "text-gray-500"
                      )}>
                        <span className="font-medium">{message.replyTo.senderName}</span>
                      </p>
                    </div>
                    <p className={cn(
                      "text-xs truncate mt-0.5 ml-4",
                      isCurrentUser ? "text-white/60" : "text-gray-400"
                    )}>
                      {message.replyTo.content}
                    </p>
                  </div>
                )}

                {!isCurrentUser && (
                  <div className="mb-1.5 flex items-baseline justify-between gap-4">
                    <p className="text-xs font-semibold text-[#a38c5b]">
                      {message.sender.name}
                    </p>
                  </div>
                )}

                {editingMessageId === message._id ? (
                  <div className="space-y-2">
                    <Input
                      ref={editInputRef}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitEdit(); }
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      className="text-sm bg-white/20 border-white/40 text-white placeholder-white/60 rounded-lg h-8 focus:ring-white/30"
                    />
                    <div className="flex space-x-1">
                      <button
                        onClick={submitEdit}
                        disabled={isEditing}
                        className="flex-1 text-xs bg-white/20 hover:bg-white/30 rounded-lg py-1.5 font-medium transition-colors flex items-center justify-center space-x-1"
                      >
                        <Check className="h-3 w-3" />
                        <span>{isEditing ? 'Saving...' : 'Save'}</span>
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex-1 text-xs bg-white/10 hover:bg-white/20 rounded-lg py-1.5 font-medium transition-colors flex items-center justify-center space-x-1"
                      >
                        <X className="h-3 w-3" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className={cn(
                    'text-[13.5px] leading-relaxed break-words font-normal',
                    isCurrentUser ? 'text-white' : 'text-gray-800'
                  )}>
                    {renderMessageContent(message.content)}
                  </p>
                )}
              </>
            )}

            <div className="flex items-center justify-end mt-1.5 space-x-1">
              {message.isEdited && (
                <span className={cn('text-[10px] italic', isCurrentUser ? 'text-white/70' : 'text-gray-400')}>
                  edited
                </span>
              )}
              <span className={cn(
                'text-[10px]',
                isCurrentUser ? 'text-white/85' : 'text-gray-400'
              )}>
                {message.timestamp ? format(new Date(message.timestamp), 'h:mm a') : ''}
              </span>
              {!isCurrentUser && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startReply(message);
                  }}
                  className="text-gray-400 hover:text-[#c7b793] transition-colors"
                >
                  <Reply className="h-3 w-3" />
                </button>
              )}
            </div>

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

          {isCurrentUser && !selectMode && message.type === 'text' && editingMessageId !== message._id && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setContextMenuMsgId(prev => prev === message._id ? null : message._id);
              }}
              className="absolute -top-1 -left-7 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-100 rounded-full h-6 w-6 flex items-center justify-center shadow-sm text-gray-400 hover:text-gray-600"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
          )}

          {!isCurrentUser && !selectMode && message.type === 'text' && editingMessageId !== message._id && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                startReply(message);
              }}
              className="absolute -top-1 -left-7 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-100 rounded-full h-6 w-6 flex items-center justify-center shadow-sm text-gray-400 hover:text-[#c7b793]"
            >
              <Reply className="h-3.5 w-3.5" />
            </button>
          )}

          {showContextMenu && (
            <div
              className="absolute right-0 top-full mt-1 md:left-full md:top-0 md:ml-1 md:right-auto bg-white border border-gray-100 rounded-xl shadow-lg z-[100] overflow-hidden min-w-[120px]"
              onClick={(e) => e.stopPropagation()}
            >
              {!isCurrentUser && (
                <button
                  onClick={() => {
                    startReply(message);
                    setContextMenuMsgId(null);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-[#faf8f5] transition-colors"
                >
                  <Reply className="h-3.5 w-3.5 text-[#c7b793]" />
                  <span>Reply</span>
                </button>
              )}
              {isCurrentUser && (
                <button
                  onClick={() => startEdit(message)}
                  className="w-full flex items-center space-x-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-[#faf8f5] transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5 text-[#c7b793]" />
                  <span>Edit</span>
                </button>
              )}
              {isCurrentUser && (
                <button
                  onClick={() => {
                    setSelectMode(true);
                    toggleSelect(message._id);
                    setContextMenuMsgId(null);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      className={cn(
        "flex flex-col h-screen bg-[#faf8f5] overflow-hidden",
        privateMode && "select-none"
      )}
      style={{ 
        fontFamily: "'Outfit', sans-serif",
        WebkitUserSelect: privateMode ? 'none' : 'auto',
        userSelect: privateMode ? 'none' : 'auto'
      }}
    >
      {/* Header */}
      <div className="bg-white border-b border-[#c7b793]/15 px-4 py-3 flex items-center justify-between min-h-[64px] flex-shrink-0 relative z-10">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={selectMode ? toggleSelectMode : onBack}
            className="md:hidden min-h-[44px] min-w-[44px]"
          >
            {selectMode ? <X className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
          </Button>

          <Avatar className="h-10 w-10 border border-[#c7b793]/15">
            <AvatarImage src={conversation.participant?.image} />
            <AvatarFallback className="bg-[#c7b793] text-white text-sm font-semibold shadow-sm">
              {conversation.participant?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>

          <div>
            <h1 className="text-base font-semibold text-gray-900 truncate">
              {selectMode
                ? `${selectedIds.size} selected`
                : (conversation.participant?.name || conversation.participant?.email)
              }
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

        <div className="flex items-center space-x-1">
          {selectMode ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBulkDelete}
                disabled={selectedIds.size === 0 || isDeleting}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 min-h-[44px] min-w-[44px]"
                title="Delete selected"
              >
                {isDeleting
                  ? <div className="h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  : <Trash2 className="h-5 w-5" />
                }
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSelectMode}
                className="text-gray-500 hover:text-gray-700 min-h-[44px] min-w-[44px]"
              >
                <X className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSelectMode}
                className="text-gray-500 hover:text-gray-700 p-2 min-h-[44px] min-w-[44px]"
                title="Select messages"
              >
                <CheckSquare className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleBlock}
                className={cn(
                  "text-gray-500 p-2 min-h-[44px] min-w-[44px]",
                  isBlocked ? "text-red-500" : "hover:text-gray-700"
                )}
                title={isBlocked ? "Unblock user" : "Block user"}
              >
                <Ban className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPrivateMode(!privateMode)}
                className={cn(
                  "text-gray-500 p-2 min-h-[44px] min-w-[44px]",
                  privateMode ? "text-[#c7b793]" : "hover:text-gray-700"
                )}
                title={privateMode ? "Disable private mode" : "Enable private mode"}
              >
                {privateMode ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-[#faf8f5] scroll-smooth relative">
        {/* IMPORTANT: Private mode overlay to prevent screenshots */}
        {privateMode && (
          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center" style={{ 
            WebkitUserSelect: 'none',
            userSelect: 'none',
            WebkitTouchCallout: 'none'
          }}>
            <div className="bg-black/10 backdrop-blur-[1px] w-full h-full flex items-center justify-center">
              <div className="bg-white/95 px-6 py-4 rounded-2xl shadow-lg border border-[#c7b793]/20">
                <div className="flex items-center space-x-3">
                  <Lock className="h-5 w-5 text-[#c7b793]" />
                  <p className="text-sm font-medium text-gray-700">Private Mode Active</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">Screenshots disabled</p>
              </div>
            </div>
          </div>
        )}
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
                Send an initial message to establish a communication link with {conversation.participant?.name || conversation.participant?.email}.
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
      {!selectMode && (
        <div className="bg-white border-t border-[#c7b793]/15 p-3 sm:p-4 shadow-lg flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            {/* IMPORTANT: Reply indicator */}
            {replyingTo && (
              <div className="mb-2 flex items-center justify-between bg-[#faf8f5] rounded-lg px-3 py-2 border border-[#c7b793]/20 transition-all duration-200 ease-in-out">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <Reply className="h-3.5 w-3.5 text-[#c7b793] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">
                      Replying to {replyingTo.sender.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {replyingTo.content}
                    </p>
                  </div>
                </div>
                <button
                  onClick={cancelReply}
                  className="ml-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <form onSubmit={sendMessage} className="relative">
              <div className="relative">
                <Textarea
                  ref={messageInputRef}
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    if (e.target.value.trim()) {
                      onType();
                    } else {
                      stopTyping();
                    }
                  }}
                  onPaste={(e) => {
                    const pastedText = e.clipboardData.getData('text');
                    const urlRegex = /(https?:\/\/[^\s]+)/g;
                    const urls = pastedText.match(urlRegex);

                    if (urls && urls.length > 0) {
                      e.preventDefault();
                      const textarea = messageInputRef.current;
                      if (textarea) {
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const before = newMessage.substring(0, start);
                        const after = newMessage.substring(end);

                        let processedText = pastedText;
                        urls.forEach(url => {
                          processedText = processedText.replace(url, `[${url}](${url})`);
                        });

                        const newText = before + processedText + after;
                        setNewMessage(newText);

                        setTimeout(() => {
                          textarea.selectionStart = textarea.selectionEnd = start + processedText.length;
                        }, 0);
                      }
                    }
                  }}
                  placeholder={`Message ${conversation.participant?.name || conversation.participant?.email}...`}
                  className="pl-4 pr-12 sm:pl-5 sm:pr-14 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#c7b793] focus:ring-2 focus:ring-[#c7b793]/10 transition-all duration-200 text-sm min-h-[44px] text-black resize-none"
                />
                <Button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full p-0 transition-all duration-200 ${isSending
                    ? 'bg-gray-100 text-gray-300'
                    : !newMessage.trim()
                      ? 'bg-gray-100 text-gray-300'
                      : 'bg-[#c7b793] hover:bg-[#b8a57e] text-white shadow-md transform hover:scale-105'
                    }`}
                >
                  {isSending ? (
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span className="sr-only">Send message</span>
                </Button>
              </div>

              <div className="flex items-center justify-between mt-3 px-1">
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      const textarea = messageInputRef.current;
                      if (textarea) {
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const newText = newMessage.substring(0, start) + '\n' + newMessage.substring(end);
                        setNewMessage(newText);
                        setTimeout(() => {
                          textarea.selectionStart = textarea.selectionEnd = start + 1;
                        }, 0);
                      } else {
                        setNewMessage(prev => prev + '\n');
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="New line"
                  >
                    <CornerDownLeft className="w-5 h-5" />
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
                              type="button"
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
      )}

      {/* Select mode action bar */}
      {selectMode && (
        <div className="bg-white border-t border-[#c7b793]/15 p-4 flex-shrink-0">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {selectedIds.size === 0 ? 'Tap your messages to select' : `${selectedIds.size} message${selectedIds.size !== 1 ? 's' : ''} selected`}
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectMode}
                className="border-gray-200 text-gray-600 rounded-full text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleBulkDelete}
                disabled={selectedIds.size === 0 || isDeleting}
                className="bg-red-500 hover:bg-red-600 text-white rounded-full text-xs"
              >
                {isDeleting ? 'Deleting...' : `Delete ${selectedIds.size > 0 ? selectedIds.size : ''}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}