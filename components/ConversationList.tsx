'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { cn } from '@/lib/utils';

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

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  currentUser: any;
}

export function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  currentUser
}: ConversationListProps) {
  const truncateMessage = (message: string, maxLength: number = 35) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
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
    <div className="divide-y divide-gray-100">
      {conversations.map((conversation) => (
        <div
          key={conversation._id}
          onClick={() => onSelectConversation(conversation)}
          className={cn(
            'p-4 cursor-pointer transition-colors hover:bg-gray-50 min-h-[72px] touch-manipulation',
            selectedConversation?._id === conversation._id && 'bg-blue-50 border-r-2 border-blue-500'
          )}
        >
          <div className="flex items-center space-x-3">
            {/* Avatar with status indicator */}
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={conversation.participant?.image} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
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

            {/* Conversation info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {conversation.participant?.name || conversation.participant?.email}
                </h3>
                <div className="flex items-center space-x-1">
                  {conversation.lastMessageAt && (
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: false })}
                    </span>
                  )}
                  {conversation.unreadCount > 0 && (
                    <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>

              {conversation.lastMessage ? (
                <div className="flex items-center justify-between">
                  <p className={cn(
                    'text-sm truncate',
                    conversation.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'
                  )}>
                    {conversation.lastMessage.sender.email === currentUser?.email ? 'You: ' : ''}
                    {truncateMessage(conversation.lastMessage.content)}
                  </p>
                </div>
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
