'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { cn } from '@/lib/utils';
import { Ban, ImageIcon, Film, Music, Paperclip } from 'lucide-react';

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
    type?: string;
    systemData?: {
      type: string;
      publicId: string;
      question: string;
    };
  };
  lastMessageAt: Date;
  unreadCount: number;
  isBlocked?: boolean;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  currentUser: any;
  privateMode?: boolean;
}

export function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  currentUser,
  privateMode = false
}: ConversationListProps) {
  const truncateMessage = (message: string, maxLength: number = 35) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  const getLastMessagePreview = (conv: Conversation) => {
    if (!conv.lastMessage) return null;
    const msg = conv.lastMessage;
    const isFromMe = msg.sender?.email === currentUser?.email;
    const prefix = isFromMe ? 'You: ' : '';

    if (msg.type === 'system') {
      return (
        <span className="text-[#a38c5b] font-medium">
          Q&A: {msg.systemData?.question || 'New question'}
        </span>
      );
    }
    if (msg.type === 'image') {
      return <span className="flex items-center gap-1 text-gray-400 italic"><ImageIcon className="h-3 w-3 flex-shrink-0" />{prefix}Photo</span>;
    }
    if (msg.type === 'video') {
      return <span className="flex items-center gap-1 text-gray-400 italic"><Film className="h-3 w-3 flex-shrink-0" />{prefix}Video</span>;
    }
    if (msg.type === 'audio') {
      return <span className="flex items-center gap-1 text-gray-400 italic"><Music className="h-3 w-3 flex-shrink-0" />{prefix}Audio</span>;
    }
    if (msg.type === 'file') {
      return <span className="flex items-center gap-1 text-gray-400 italic"><Paperclip className="h-3 w-3 flex-shrink-0" />{prefix}File</span>;
    }
    return <>{prefix}{truncateMessage(msg.content)}</>;
  };

  return (
    <div className="divide-y divide-gray-100/50">
      {conversations.map((conversation) => (
        <div
          key={conversation._id}
          onClick={() => onSelectConversation(conversation)}
          className={cn(
            'p-4 cursor-pointer transition-all duration-200 hover:bg-[#faf8f5]/80 min-h-[72px] touch-manipulation',
            selectedConversation?._id === conversation._id && 'bg-[#f7f4ed]/80 border-r-4 border-[#c7b793]'
          )}
        >
          <div className="flex items-center space-x-3">
            {/* Avatar with blocked overlay */}
            <div className="relative flex-shrink-0">
              <Avatar className="h-12 w-12 border border-[#c7b793]/10">
                <AvatarImage src={conversation.participant?.image} />
                <AvatarFallback className="bg-[#c7b793] text-white font-semibold shadow-sm">
                  {conversation.participant?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {conversation.isBlocked && (
                <div className="absolute -bottom-0.5 -right-0.5 bg-red-500 rounded-full p-0.5">
                  <Ban className="h-2.5 w-2.5 text-white" />
                </div>
              )}
            </div>

            {/* Conversation info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {conversation.participant?.name || conversation.participant?.email}
                  </h3>
                  {conversation.isBlocked && (
                    <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
                      Blocked
                    </span>
                  )}
                </div>
                {conversation.lastMessageAt && (
                  <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                    {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: false })}
                  </span>
                )}
              </div>

              {/* IMPORTANT: Show last message only when NOT in private mode */}
              {!privateMode && (
                <div className="flex items-center">
                  {conversation.lastMessage ? (
                    <p className="text-sm text-gray-500 truncate">
                      {getLastMessagePreview(conversation)}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">
                      No messages yet
                    </p>
                  )}
                </div>
              )}

              {/* IMPORTANT: In private mode, show minimal placeholder */}
              {privateMode && (
                <div className="h-4" />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}