'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, MessageCircle, Settings, LogOut } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { getCurrentUserFromSession, clearCurrentUserSession } from '@/lib/client-auth';
import { NewConversationDialog } from '../../components/NewConversationDialog';
import { ConversationList } from '../../components/ConversationList';
import { PersonalChat } from '../../components/PersonalChat';

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

export default function PersonalChatPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Check authentication
  useEffect(() => {
    const user = getCurrentUserFromSession();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
  }, [router]);

  // Load conversations
  useEffect(() => {
    if (currentUser) {
      loadConversations();
    }
  }, [currentUser]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        // Filter out any conversations with null IDs (shouldn't happen but extra safety)
        const validConversations = (data.conversations || []).filter((conv: Conversation) => conv._id);
        setConversations(validConversations);
      } else {
        console.error('Failed to load conversations:', response.status, response.statusText);
        // Don't clear conversations on error, keep existing ones
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      // Show user-friendly error message
      // You could add a toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clearCurrentUserSession();
    router.push('/login');
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.participant?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 relative">
      {/* Mobile sidebar overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Conversations List */}
      <div className={`
        w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden
        md:relative md:translate-x-0
        ${isMobileSidebarOpen ? 'fixed left-0 top-0 h-full z-50' : 'fixed -left-80 md:left-0'}
        transition-transform duration-300 ease-in-out
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Messages</h1>
              <p className="text-sm text-gray-500">
                {conversations.length} conversations
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <NewConversationDialog
                onSelectUser={(userData) => {
                  console.log('NewConversationDialog onSelectUser called with:', userData);
                  // Close mobile sidebar after selecting
                  setIsMobileSidebarOpen(false);
                  // Reload conversations to show the new one
                  loadConversations().then(() => {
                    // Find and select the new conversation
                    if (userData.conversationId) {
                      console.log('Creating new conversation with:', {
                        conversationId: userData.conversationId,
                        userId: userData._id,
                        userName: userData.name,
                        userEmail: userData.email
                      });

                      // Create a properly typed conversation object
                      const newConversation: Conversation = {
                        _id: userData.conversationId,
                        participants: [currentUser?.id, userData._id].filter(Boolean),
                        participant: {
                          _id: userData._id || '',
                          name: userData.name || userData.email || 'Unknown',
                          email: userData.email || '',
                          image: userData.image,
                          status: userData.status || 'offline'
                        },
                        lastMessage: undefined,
                        lastMessageAt: new Date(),
                        unreadCount: 0
                      };

                      console.log('Setting selected conversation:', newConversation);
                      setSelectedConversation(newConversation);
                    } else {
                      console.warn('No conversationId in userData:', userData);
                    }
                  });
                }}
                currentUser={currentUser}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 min-h-[44px] min-w-[44px]"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center p-4">
              <MessageCircle className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm mb-1">No conversations yet</p>
              <p className="text-gray-400 text-xs">
                {searchQuery ? 'No matches found' : 'Start a conversation with someone'}
              </p>
            </div>
          ) : (
            <ConversationList
              conversations={filteredConversations}
              selectedConversation={selectedConversation}
              onSelectConversation={(conversation) => {
                setSelectedConversation(conversation);
                setIsMobileSidebarOpen(false); // Close sidebar on mobile after selection
              }}
              currentUser={currentUser}
            />
          )}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-0">
        {selectedConversation ? (
          <PersonalChat
            conversation={selectedConversation}
            currentUser={currentUser}
            onBack={() => setSelectedConversation(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center max-w-md mx-auto p-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <MessageCircle className="h-12 w-12 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                Welcome to Personal Chat
              </h2>
              <p className="text-gray-500 mb-6 leading-relaxed">
                Select a conversation from the sidebar to start chatting with your contacts.
                All messages are private and secure.
              </p>
              <div className="flex flex-col space-y-2 text-sm text-gray-400">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Real-time messaging</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Read receipts</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Typing indicators</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile menu button */}
      {!selectedConversation && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="fixed top-4 left-4 z-30 md:hidden bg-white shadow-lg hover:bg-gray-50 min-h-[44px] min-w-[44px] touch-manipulation"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}