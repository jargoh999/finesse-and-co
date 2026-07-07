'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { cn } from '@/lib/utils';

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

interface AnonymousDMListProps {
  conversations: AnonymousConversation[];
  selectedConversation: AnonymousConversation | null;
  onSelectConversation: (conversation: AnonymousConversation) => void;
  currentUser: any;
}

export function AnonymousDMList({
  conversations,
  selectedConversation,
  onSelectConversation,
  currentUser
}: AnonymousDMListProps) {
  const truncateMessage = (message: string, maxLength: number = 35) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  return (
    <div className="divide-y divide-gray-100/50">
      {conversations.map((conversation) => (
        <div
          key={conversation.senderId}
          onClick={() => onSelectConversation(conversation)}
          className={cn(
            'p-4 cursor-pointer transition-all duration-200 hover:bg-[#faf8f5]/80 min-h-[72px] touch-manipulation',
            selectedConversation?.senderId === conversation.senderId && 'bg-[#f7f4ed]/80 border-r-4 border-[#c7b793]'
          )}
        >
          <div className="flex items-center space-x-3">
            {/* Avatar - always anonymous */}
            <div className="relative">
              <Avatar className="h-12 w-12 border border-[#c7b793]/10">
                <AvatarFallback className="bg-[#c7b793] text-white font-semibold shadow-sm">
                  ?
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Conversation info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  Anonymous
                </h3>
                {conversation.lastMessage?.createdAt && (
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: false })}
                  </span>
                )}
              </div>

              {conversation.lastMessage ? (
                <p className="text-sm text-gray-500 truncate">
                  {truncateMessage(conversation.lastMessage.content)}
                </p>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  No messages yet
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
