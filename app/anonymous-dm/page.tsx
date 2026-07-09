'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, MessageCircle, LogOut, UserPlus, Ban } from 'lucide-react';
import { getCurrentUserFromSession, clearCurrentUserSession } from '@/lib/client-auth';
import { AnonymousDMConversation } from '../../components/AnonymousDMConversation';
import { AnonymousDMList } from '../../components/AnonymousDMList';
import { NewAnonymousDMDialog } from '../../components/NewAnonymousDMDialog';
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

export default function AnonymousDMPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<AnonymousConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<AnonymousConversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewDMDialog, setShowNewDMDialog] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const user = getCurrentUserFromSession();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
    loadConversations();
    setupPolling();

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [router]);

  const setupPolling = () => {
    // Poll for conversation updates every 2 seconds without showing loading state
    pollingIntervalRef.current = setInterval(() => {
      loadConversations(false);
    }, 2000);
  };

  const loadConversations = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const response = await fetch('/api/anonymous-dm');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error loading anonymous DMs:', error);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const handleSendAnonymousDM = async (receiverId: string, message: string) => {
    try {
      const response = await fetch('/api/anonymous-dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId, content: message }),
      });

      if (response.ok) {
        loadConversations();
      }
    } catch (error) {
      console.error('Error sending anonymous DM:', error);
    }
  };

  const handleLogout = () => {
    clearCurrentUserSession();
    router.push('/login');
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#faf8f5]" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c7b793] mx-auto mb-4"></div>
          <p className="text-[#a38c5b] text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#faf8f5] overflow-hidden" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
      `}</style>

      {/* Sidebar - Conversations List */}
      <div className={cn(
        "w-full md:w-80 lg:w-96 bg-white border-r border-[#c7b793]/15 flex flex-col overflow-hidden h-full transition-all duration-300",
        selectedConversation ? "hidden md:flex" : "flex"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-[#c7b793]/15 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Anonymous DMs</h1>
              <p className="text-xs text-[#a38c5b] font-medium mt-0.5">
                {conversations.length} anonymous {conversations.length === 1 ? 'conversation' : 'conversations'}
              </p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-1.5">
              <div className="flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNewDMDialog(true)}
                  className="text-gray-400 hover:text-gray-600 rounded-full h-9 w-9 flex items-center justify-center"
                  title="New Anonymous Message"
                  aria-label="New Anonymous Message"
                >
                  <UserPlus className="h-4.5 w-4.5" />
                </Button>
                <span className="text-[9px] text-gray-400 sm:hidden mt-0.5">New</span>
              </div>
              <div className="flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push('/personal-chat')}
                  className="text-gray-400 hover:text-gray-600 rounded-full h-9 w-9 flex items-center justify-center"
                  title="Back to Chat"
                  aria-label="Back to Chat"
                >
                  <MessageCircle className="h-4.5 w-4.5" />
                </Button>
                <span className="text-[9px] text-gray-400 sm:hidden mt-0.5">Chat</span>
              </div>
              <div className="flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-red-500 hover:bg-red-50/50 rounded-full h-9 w-9 flex items-center justify-center transition-colors"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4.5 w-4.5" />
                </Button>
                <span className="text-[9px] text-gray-400 sm:hidden mt-0.5">Logout</span>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#faf8f5] border-transparent rounded-full focus:bg-white focus:border-[#c7b793]/40 focus:ring-[#c7b793]/10 text-sm h-9 text-gray-800 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1 bg-white">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#c7b793]"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center p-6">
              <div className="w-14 h-14 bg-[#faf8f5] border border-[#c7b793]/15 rounded-full flex items-center justify-center mb-3">
                <MessageCircle className="h-7 w-7 text-[#c7b793]/70" />
              </div>
              <p className="text-gray-700 font-semibold text-sm">No anonymous messages</p>
              <p className="text-gray-400 text-xs mt-1 px-4">
                When someone sends you an anonymous message, it will appear here
              </p>
            </div>
          ) : (
            <AnonymousDMList
              conversations={conversations}
              selectedConversation={selectedConversation}
              onSelectConversation={(conversation) => {
                setSelectedConversation(conversation);
              }}
              currentUser={currentUser}
            />
          )}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 h-full",
        selectedConversation ? "flex" : "hidden md:flex"
      )}>
        {selectedConversation ? (
          <AnonymousDMConversation
            conversation={selectedConversation}
            currentUser={currentUser}
            onBack={() => setSelectedConversation(null)}
            onRefresh={loadConversations}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-white to-[#faf8f5]">
            <div className="text-center max-w-md mx-auto p-8">
              <div className="w-20 h-20 bg-[#faf8f5] border border-[#c7b793]/20 rounded-full flex items-center justify-center mb-6 mx-auto shadow-sm">
                <MessageCircle className="h-10 w-10 text-[#c7b793]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight mb-2">
                Anonymous Messages
              </h2>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Select a conversation to reply to anonymous messages. Your identity remains hidden from the sender.
              </p>
              <div className="flex flex-col space-y-2.5 text-xs text-[#a38c5b] font-medium">
                <div className="flex items-center justify-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  <span>End-to-end encrypted</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-[#c7b793] rounded-full"></span>
                  <span>Identity protected</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-[#c7b793] rounded-full"></span>
                  <span>Block unwanted senders</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <NewAnonymousDMDialog
        open={showNewDMDialog}
        onOpenChange={setShowNewDMDialog}
        onSend={handleSendAnonymousDM}
        currentUser={currentUser}
      />
    </div>
  );
}