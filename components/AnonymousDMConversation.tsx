'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Send,
  ArrowLeft,
  Smile,
  X,
  Ban,
  Paperclip,
  Image as ImageIcon,
  Film,
  Music,
  FileText,
  CheckSquare,
  Square,
  Trash2,
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
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // Select / delete mode
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages(conversation.messages || []);
    setSelectMode(false);
    setSelectedIds(new Set());
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
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const lastMessage = messages[messages.length - 1];
        const since = lastMessage ? new Date(lastMessage.createdAt) : new Date(0);

        const response = await fetch(`/api/anonymous-dm?since=${since.toISOString()}`);

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
        setMessages(prev => {
          const exists = prev.some(m => m._id === data.dm._id);
          return exists ? prev : [...prev, data.dm];
        });
        setNewMessage('');
        onRefresh();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isUploadingMedia) return;

    setIsUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/anonymous-dm/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to upload media');
      }

      const data = await res.json();

      const sendRes = await fetch('/api/anonymous-dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: conversation.senderId,
          content: data.url,
          mediaUrl: data.url,
          mediaType: data.mediaType,
          fileName: data.fileName,
        }),
      });

      if (sendRes.ok) {
        const sendData = await sendRes.json();
        setMessages(prev => {
          const exists = prev.some(m => m._id === sendData.dm._id);
          return exists ? prev : [...prev, sendData.dm];
        });
        onRefresh();
      }
    } catch (err: any) {
      console.error('Error sending media:', err);
      alert(err.message || 'Error uploading media file');
    } finally {
      setIsUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0 || isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/anonymous-dm', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageIds: Array.from(selectedIds) }),
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => !selectedIds.has(m._id)));
        setSelectedIds(new Set());
        setSelectMode(false);
        onRefresh();
      }
    } catch (err) {
      console.error('Error deleting messages:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderMediaContent = (message: any) => {
    const { mediaUrl, mediaType, fileName } = message;
    if (!mediaUrl) return null;

    if (mediaType === 'image') {
      return (
        <img
          src={mediaUrl}
          alt="Media attachment"
          className="max-w-full max-h-60 rounded-xl object-cover shadow-sm cursor-pointer hover:opacity-95 transition-opacity mt-1"
          onClick={() => window.open(mediaUrl, '_blank')}
        />
      );
    }
    if (mediaType === 'video') {
      return <video src={mediaUrl} controls className="max-w-full max-h-60 rounded-xl shadow-sm mt-1" />;
    }
    if (mediaType === 'audio') {
      return <audio src={mediaUrl} controls className="max-w-full mt-1" />;
    }
    return (
      <a
        href={mediaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center space-x-2 p-2.5 rounded-xl border border-white/20 bg-white/10 text-white mt-1 text-xs underline"
      >
        <Paperclip className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">{fileName || 'Download attachment'}</span>
      </a>
    );
  };

  const isCurrentUserMessage = (message: any) => message.senderId === currentUser?.id;

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-white to-[#faf8f5]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#c7b793]/15 bg-white flex-shrink-0">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={selectMode ? () => { setSelectMode(false); setSelectedIds(new Set()); } : onBack}
            className="md:hidden min-h-[44px] min-w-[44px]"
          >
            {selectMode ? <X className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
          </Button>

          <Avatar className="h-10 w-10 border border-[#c7b793]/15">
            <AvatarFallback className="bg-[#c7b793] text-white text-sm font-semibold shadow-sm">
              ?
            </AvatarFallback>
          </Avatar>

          <div>
            <h1 className="text-base font-semibold text-gray-900 truncate">
              {selectMode ? `${selectedIds.size} selected` : 'Anonymous'}
            </h1>
            <p className="text-sm text-gray-500">
              {isBlocked ? 'Blocked' : 'Identity hidden'}
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
                onClick={() => { setSelectMode(false); setSelectedIds(new Set()); }}
                className="text-gray-500 hover:text-gray-700 min-h-[44px] min-w-[44px]"
              >
                <X className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectMode(true)}
                className="text-gray-400 hover:text-gray-600 p-2 min-h-[44px] min-w-[44px]"
                title="Select messages"
              >
                <CheckSquare className="h-4.5 w-4.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleBlock}
                className={cn(
                  "text-gray-400 hover:text-red-500 hover:bg-red-50/50 p-2 min-h-[44px] min-w-[44px]",
                  isBlocked && "text-red-500 bg-red-50/50"
                )}
                title={isBlocked ? 'Unblock' : 'Block'}
              >
                <Ban className="h-4.5 w-4.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Messages area - min-h ensures reasonable size even with no messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[350px]">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full min-h-[280px] text-center py-10">
            <div className="w-14 h-14 bg-[#faf8f5] border border-[#c7b793]/20 rounded-full flex items-center justify-center mb-3">
              <span className="text-2xl">🔒</span>
            </div>
            <p className="text-gray-600 font-semibold text-sm">Anonymous conversation</p>
            <p className="text-gray-400 text-xs mt-1 max-w-xs leading-relaxed">
              Messages sent here are anonymous. The sender's identity remains hidden.
            </p>
          </div>
        )}

        {messages.map((message, index) => {
          const isMe = isCurrentUserMessage(message);
          const isSelected = selectedIds.has(message._id);
          const canDelete = isMe;

          return (
            <div
              key={message._id || index}
              className={cn(
                'flex mb-3 px-2 group',
                isMe ? 'justify-end' : 'justify-start'
              )}
              onClick={() => {
                if (selectMode && canDelete) toggleSelect(message._id);
              }}
            >
              {/* Checkbox for select mode (only own messages) */}
              {selectMode && canDelete && (
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

              <div
                className={cn(
                  'relative max-w-[75%] px-4 py-3 rounded-2xl',
                  isMe
                    ? 'bg-[#c7b793] text-white rounded-br-md'
                    : 'bg-white border border-[#e9e4d9] text-gray-800 rounded-bl-md',
                  isSelected && 'ring-2 ring-[#c7b793] ring-offset-1'
                )}
              >
                {message.isSystemMessage ? (
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
                  <>
                    {!isMe && (
                      <div className="flex items-center mb-1.5">
                        <p className="text-xs font-semibold text-[#a38c5b]">Anonymous</p>
                      </div>
                    )}

                    {/* Media rendering */}
                    {message.mediaUrl && renderMediaContent(message)}

                    {/* Text content (only show if different from mediaUrl) */}
                    {message.content && message.content !== message.mediaUrl && (
                      <p className={cn(
                        'text-[13.5px] leading-relaxed break-words font-normal',
                        isMe ? 'text-white' : 'text-gray-800',
                        message.mediaUrl && 'mt-1.5'
                      )}>
                        {message.content}
                      </p>
                    )}
                  </>
                )}

                <div className="flex items-center justify-end mt-1.5">
                  <span className={cn('text-[10px]', isMe ? 'text-white/85' : 'text-gray-400')}>
                    {message.createdAt ? format(new Date(message.createdAt), 'h:mm a') : ''}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input area */}
      <div className="flex-shrink-0 p-4 bg-white border-t border-[#c7b793]/15">
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
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
              className="hidden"
              onChange={handleFileUpload}
            />

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

            <div className="flex items-center justify-between mt-3 px-4">
              <div className="flex space-x-2">
                {/* Media upload button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingMedia}
                  className="p-2 text-gray-400 hover:text-[#c7b793] rounded-full hover:bg-gray-100 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Attach file"
                >
                  {isUploadingMedia
                    ? <div className="h-4 w-4 border-2 border-[#c7b793] border-t-transparent rounded-full animate-spin" />
                    : <Paperclip className="w-5 h-5" />
                  }
                </button>

                {/* Emoji picker */}
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
