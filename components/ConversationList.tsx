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
    type?: string;
    systemData?: {
      type: string;
      publicId: string;
      question: string;
    };
  };
  lastMessageAt: Date;
  unreadCount: number;
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
            {/* Avatar */}
            <Avatar className="h-12 w-12 border border-[#c7b793]/10">
              <AvatarImage src={conversation.participant?.image} />
              <AvatarFallback className="bg-[#c7b793] text-white font-semibold shadow-sm">
                {conversation.participant?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>

            {/* Conversation info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {conversation.participant?.name || conversation.participant?.email}
                </h3>
                {conversation.unreadCount > 0 && (
                  <Badge className="bg-[#c7b793] text-white text-xs h-5 px-2 rounded-full">
                    {conversation.unreadCount}
                  </Badge>
                )}
              </div>

              {/* IMPORTANT: Show last message only when NOT in private mode */}
              {!privateMode && (
                <div className="flex items-center justify-between">
                  {conversation.lastMessage ? (
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.lastMessage.type === 'system' ? (
                        <span className="text-[#a38c5b] font-medium">
                          Q&A: {conversation.lastMessage.systemData?.question || 'New question'}
                        </span>
                      ) : (
                        <>
                          {conversation.lastMessage.sender.email === currentUser?.email ? 'You: ' : ''}
                          {truncateMessage(conversation.lastMessage.content)}
                        </>
                      )}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">
                      No messages yet
                    </p>
                  )}
                  {conversation.lastMessageAt && (
                    <span className="text-xs text-gray-400 ml-2">
                      {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: false })}
                    </span>
                  )}
                </div>
              )}

              {/* IMPORTANT: In private mode, only show unread count badge (no message, no timestamp, no text) */}
              {privateMode && (
                <div className="h-4"></div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}