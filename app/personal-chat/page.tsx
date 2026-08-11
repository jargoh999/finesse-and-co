'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, MessageCircle, LogOut, MessageCircleQuestion, MessageSquareLock, UserPlus, UserCircle } from 'lucide-react';
import { getCurrentUserFromSession, clearCurrentUserSession, resetSessionExpiry } from '@/lib/client-auth';
import { NewConversationDialog } from '../../components/NewConversationDialog';
import { ConversationList } from '../../components/ConversationList';
import { PersonalChat } from '../../components/PersonalChat';
import { AnonymousAnswers } from '../../components/AnonymousAnswers';
import { AnonymousDMList } from '../../components/AnonymousDMList';
import { AnonymousDMConversation } from '../../components/AnonymousDMConversation';
import { NewAnonymousDMDialog } from '../../components/NewAnonymousDMDialog';
import { ThemeSwitcher } from '../../components/ThemeSwitcher';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '../../contexts/ThemeContext';
// import { useBackButtonGuard } from '@/hooks/useBackButtonGuard';
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

export default function PersonalChatPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen bg-[#faf8f5]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c7b793]"></div></div>}>
      <PersonalChatPageContent />
    </Suspense>
  );
}

function PersonalChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { colors } = useTheme();
  // Prevent phone back button from leaving the app tab
  // useBackButtonGuard('/personal-chat');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [anonymousConversations, setAnonymousConversations] = useState<AnonymousConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedAnonymousConversation, setSelectedAnonymousConversation] = useState<AnonymousConversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'anonymous'>('chats');
  const [showNewDMDialog, setShowNewDMDialog] = useState(false);
  const [anonymousEnabled, setAnonymousEnabled] = useState(true);
  const conversationsEventSourceRef = useRef<EventSource | null>(null);
  const conversationsLoadedRef = useRef(false);
  const anonymousConversationsLoadedRef = useRef(false);

  // IMPORTANT: Check authentication only (no reload redirect)
  useEffect(() => {
    const user = getCurrentUserFromSession();
    console.log('Personal chat - user from session:', user);
    if (!user) {
      console.log('Personal chat - no user found, redirecting to login');
      router.push('/login');
      return;
    }
    setCurrentUser(user);

    // IMPORTANT: Replace history to remove landing-page from history stack
    window.history.replaceState({ tab: activeTab, isPersonalChat: true }, '', window.location.href);
  }, [router, activeTab]);

  // Reset session expiry on user activity so active users aren't logged out
  useEffect(() => {
    if (!currentUser) return;

    const resetExpiry = () => {
      resetSessionExpiry();
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      window.addEventListener(event, resetExpiry, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetExpiry);
      });
    };
  }, [currentUser]);

  // Warn before leaving the app via back button or close
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // Load conversations once on mount (no constant polling)
  useEffect(() => {
    if (currentUser) {
      loadConversations();
      loadAnonymousConversations();
    }
  }, [currentUser]);

  // Load anonymous enabled state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('anonymous-enabled');
      if (stored !== null) {
        setAnonymousEnabled(stored === 'true');
      }
    } catch (error) {
      console.error('Error loading anonymous setting:', error);
    }
  }, []);

  // Save anonymous enabled state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('anonymous-enabled', String(anonymousEnabled));
    } catch (error) {
      console.error('Error saving anonymous setting:', error);
    }
  }, [anonymousEnabled]);

  // IMPORTANT: Read conversation ID from URL and select it
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    const anonymousId = searchParams.get('anonymous');
    const tab = searchParams.get('tab');

    // Set active tab from URL parameter
    if (tab === 'chats' || tab === 'anonymous') {
      setActiveTab(tab);
    }

    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c._id === conversationId);
      if (conversation) {
        setSelectedConversation(conversation);
      }
    }

    if (anonymousId && anonymousConversations.length > 0) {
      const conversation = anonymousConversations.find(c => c.senderId === anonymousId);
      if (conversation) {
        setSelectedAnonymousConversation(conversation);
      }
    }
  }, [searchParams, conversations, anonymousConversations]);

  // IMPORTANT: Update URL when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      const url = new URL(window.location.href);
      url.searchParams.set('conversation', selectedConversation._id);
      url.searchParams.set('tab', 'chats');
      url.searchParams.delete('anonymous');
      window.history.pushState({ tab: 'chats' }, '', url);
    } else if (selectedAnonymousConversation) {
      const url = new URL(window.location.href);
      url.searchParams.set('anonymous', selectedAnonymousConversation.senderId);
      url.searchParams.set('tab', 'anonymous');
      url.searchParams.delete('conversation');
      window.history.pushState({ tab: 'anonymous' }, '', url);
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete('conversation');
      url.searchParams.delete('anonymous');
      url.searchParams.delete('tab');
      window.history.replaceState({ tab: activeTab, isPersonalChat: true }, '', url);
    }
  }, [selectedConversation, selectedAnonymousConversation, activeTab]);

  // IMPORTANT: Handle back button to prevent going to landing-page
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // If going back from a conversation, deselect it
      if (selectedConversation || selectedAnonymousConversation) {
        if (event.state && event.state.tab) {
          setActiveTab(event.state.tab);
          setSelectedConversation(null);
          setSelectedAnonymousConversation(null);
        }
        return;
      }

      // If trying to go back from personal-chat (no conversation selected), push back to personal-chat
      if (!selectedConversation && !selectedAnonymousConversation) {
        // Small delay to allow the browser to process the back event
        setTimeout(() => {
          window.history.pushState({ tab: activeTab, isPersonalChat: true }, '', window.location.href);
        }, 0);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab, selectedConversation, selectedAnonymousConversation]);

  // Switch back to chats tab if anonymous is disabled while on that tab
  useEffect(() => {
    if (!anonymousEnabled && activeTab === 'anonymous') {
      setActiveTab('chats');
    }
  }, [anonymousEnabled, activeTab]);

  // Real-time conversation list updates via SSE
  useEffect(() => {
    if (!currentUser) return;

    const eventSource = new EventSource('/api/conversations/stream');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'conversation_updated' && data.conversationId) {
          setConversations(prev =>
            prev.map(c =>
              c._id === data.conversationId
                ? {
                    ...c,
                    lastMessage: data.lastMessage,
                    unreadCount: data.unreadCount,
                    lastMessageAt: new Date(data.lastMessageAt)
                  }
                : c
            )
          );
        }
      } catch (error) {
        console.error('Error parsing conversations SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Conversations SSE connection error:', error);
    };

    return () => {
      eventSource.close();
    };
  }, [currentUser]);

  const loadConversations = async (showLoading = true) => {
    try {
      if (showLoading && !conversationsLoadedRef.current) setIsLoading(true);
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        const validConversations = (data.conversations || []).filter((conv: Conversation) => conv._id);
        setConversations(validConversations);
        conversationsLoadedRef.current = true;
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      if (showLoading && !conversationsLoadedRef.current) setIsLoading(false);
    }
  };

  // IMPORTANT: Load anonymous conversations separately for the Anonymous DM tab
  const loadAnonymousConversations = async (showLoading = true) => {
    try {
      if (showLoading && !anonymousConversationsLoadedRef.current) setIsLoading(true);
      const response = await fetch('/api/anonymous-dm');
      if (response.ok) {
        const data = await response.json();
        setAnonymousConversations(data.conversations || []);
        anonymousConversationsLoadedRef.current = true;
      }
    } catch (error) {
      console.error('Error loading anonymous DMs:', error);
    } finally {
      if (showLoading && !anonymousConversationsLoadedRef.current) setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clearCurrentUserSession();
    router.push('/login');
  };

  const handleSendAnonymousDM = async (receiverId: string, message: string) => {
    try {
      const response = await fetch('/api/anonymous-dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId, content: message }),
      });

      if (response.ok) {
        loadAnonymousConversations();
      }
    } catch (error) {
      console.error('Error sending anonymous DM:', error);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.participant?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#faf8f5]" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c7b793] mx-auto mb-4"></div>
          <p className="text-[#a38c5b] text-sm">loading chats....</p>
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
        "w-full md:w-80 lg:w-96 bg-white flex flex-col overflow-hidden h-full transition-all duration-300",
        selectedConversation ? "hidden md:flex" : "flex"
      )}
        style={{ borderRightColor: colors.border }}
      >
        {/* Header */}
        <div className="p-4 bg-white"
          style={{ borderBottomColor: colors.border }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Chats</h1>
              <p className="text-xs font-medium mt-0.5" style={{ color: colors.text }}>
                {conversations.length} active {conversations.length === 1 ? 'channel' : 'channels'}
              </p>
            </div>
            <div className="flex items-center space-x-1.5">
              <NewConversationDialog
                onSelectUser={(userData) => {
                  console.log('NewConversationDialog onSelectUser called with:', userData);
                  loadConversations().then(() => {
                    if (userData.conversationId) {
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
                      setSelectedConversation(newConversation);
                    }
                  });
                }}
                currentUser={currentUser}
              />
              {/* IMPORTANT: Q&A icon only visible when Anonymous DM tab is active */}
              {activeTab === 'anonymous' && (
                <div className="flex flex-col items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push('/anonymous')}
                    className="text-gray-400 hover:text-gray-600 rounded-full h-9 w-9 flex items-center justify-center"
                    title="Anonymous Q&A"
                    aria-label="Anonymous Q&A"
                  >
                    <MessageCircleQuestion className="h-4.5 w-4.5" />
                  </Button>
                  <span className="text-[9px] text-gray-400 sm:hidden mt-0.5">Q&A</span>
                </div>
              )}
              <ThemeSwitcher />
              {/* Profile button */}
              <div className="flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push('/profile')}
                  className="text-gray-400 hover:text-[#c7b793] rounded-full h-9 w-9 flex items-center justify-center transition-colors"
                  title="My Profile"
                  aria-label="My Profile"
                >
                  {currentUser?.image ? (
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={currentUser.image} />
                      <AvatarFallback className="bg-[#c7b793] text-white text-xs">
                        {currentUser.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <UserCircle className="h-4.5 w-4.5" />
                  )}
                </Button>
                <span className="text-[9px] text-gray-400 sm:hidden mt-0.5">Profile</span>
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

          {/* IMPORTANT: Tab Switcher - hide when Anonymous DM conversation is selected */}
          {!selectedAnonymousConversation && (
            <div className="flex gap-2 mb-4">
              <Button
                size="sm"
                variant={activeTab === 'chats' ? 'default' : 'outline'}
                onClick={() => setActiveTab('chats')}
                className={cn(
                  "flex-1 rounded-full text-sm font-medium",
                  activeTab === 'chats' ? 'text-white' : 'text-gray-600'
                )}
                style={activeTab === 'chats' ? { backgroundColor: colors.primary } : { borderColor: colors.primaryLight, backgroundColor: 'transparent' }}
                onMouseEnter={(e) => {
                  if (activeTab === 'chats') {
                    e.currentTarget.style.backgroundColor = colors.primaryHover;
                  } else {
                    e.currentTarget.style.backgroundColor = colors.primaryLight;
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab === 'chats') {
                    e.currentTarget.style.backgroundColor = colors.primary;
                  } else {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Chats
              </Button>
              <Button
                size="sm"
                variant={activeTab === 'anonymous' ? 'default' : 'outline'}
                onClick={() => anonymousEnabled && setActiveTab('anonymous')}
                disabled={!anonymousEnabled}
                className={cn(
                  "flex-1 rounded-full text-sm font-medium",
                  activeTab === 'anonymous' ? 'text-white' : 'text-gray-600'
                )}
                style={activeTab === 'anonymous' && anonymousEnabled ? { backgroundColor: colors.primary } : { borderColor: colors.primaryLight, backgroundColor: 'transparent' }}
                onMouseEnter={(e) => {
                  if (activeTab === 'anonymous' && anonymousEnabled) {
                    e.currentTarget.style.backgroundColor = colors.primaryHover;
                  } else if (anonymousEnabled) {
                    e.currentTarget.style.backgroundColor = colors.primaryLight;
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab === 'anonymous' && anonymousEnabled) {
                    e.currentTarget.style.backgroundColor = colors.primary;
                  } else {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Anonymous DM
              </Button>

              <div className="flex items-center space-x-1 sm:space-x-2 ml-1 sm:ml-2">
                <span className="text-[10px] text-gray-500 sm:text-xs">Anonymous</span>
                <div className="scale-75 sm:scale-100 origin-left">
                  <Switch
                    checked={anonymousEnabled}
                    onCheckedChange={setAnonymousEnabled}
                    className="h-5 w-9"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Search - only show in chats tab */}
          {activeTab === 'chats' && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-sm h-9 text-gray-800 placeholder-gray-400"
                style={{ backgroundColor: colors.backgroundLight, borderColor: colors.border }}
                onFocus={(e) => {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.borderColor = colors.primary;
                }}
                onBlur={(e) => {
                  e.target.style.backgroundColor = colors.backgroundLight;
                  e.target.style.borderColor = colors.border;
                }}
              />
            </div>
          )}
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1 bg-white">
          {(activeTab === 'chats' || !anonymousEnabled) ? (
            <>
              {isLoading && !conversationsLoadedRef.current ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#c7b793]"></div>
                </div>
              ) : !conversationsLoadedRef.current ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#c7b793]"></div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center p-6">
                  <div className="w-14 h-14 bg-[#faf8f5] border border-[#c7b793]/15 rounded-full flex items-center justify-center mb-3">
                    <MessageCircle className="h-7 w-7 text-[#c7b793]/70" />
                  </div>
                  <p className="text-gray-700 font-semibold text-sm">No conversations</p>
                  <p className="text-gray-400 text-xs mt-1 px-4">
                    {searchQuery ? 'No matching contacts found' : 'Click the compose icon above to start a secure chat'}
                  </p>
                </div>
              ) : (
                <ConversationList
                  conversations={filteredConversations}
                  selectedConversation={selectedConversation}
                  onSelectConversation={(conversation) => {
                    setSelectedConversation(conversation);
                  }}
                  currentUser={currentUser}
                  privateMode={false}
                />
              )}
            </>
          ) : (
            // IMPORTANT: Render full Anonymous DM page content in the second tab
            // This includes the sidebar with conversation list and main chat area
            <div className="flex h-full">
              {/* Anonymous DM Sidebar */}
              <div className={cn(
                "w-full md:w-80 lg:w-96 bg-white border-r border-[#c7b793]/15 flex flex-col overflow-hidden h-full transition-all duration-300",
                selectedAnonymousConversation ? "hidden md:flex" : "flex"
              )}>
                {/* Header */}
                <div className="p-4 border-b border-[#c7b793]/15 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h1 className="text-xl font-bold text-gray-900 tracking-tight">Anonymous DMs</h1>
                      <p className="text-xs text-[#a38c5b] font-medium mt-0.5">
                        {anonymousConversations.length} anonymous {anonymousConversations.length === 1 ? 'conversation' : 'conversations'}
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
                    </div>
                  </div>
                </div>

                {/* Anonymous DM List */}
                <ScrollArea className="flex-1 bg-white">
                  {isLoading && !anonymousConversationsLoadedRef.current ? (
                    <div className="flex items-center justify-center h-48">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#c7b793]"></div>
                    </div>
                  ) : !anonymousConversationsLoadedRef.current ? (
                    <div className="flex items-center justify-center h-48">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#c7b793]"></div>
                    </div>
                  ) : anonymousConversations.length === 0 ? (
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
                      conversations={anonymousConversations}
                      selectedConversation={selectedAnonymousConversation}
                      onSelectConversation={(conversation: AnonymousConversation) => {
                        setSelectedAnonymousConversation(conversation);
                      }}
                      currentUser={currentUser}
                    />
                  )}
                </ScrollArea>
              </div>

              {/* Anonymous DM Chat Area */}
              <div className={cn(
                "flex-1 flex flex-col min-w-0 h-full",
                selectedAnonymousConversation ? "flex" : "hidden md:flex"
              )}>
                {selectedAnonymousConversation ? (
                  <AnonymousDMConversation
                    conversation={selectedAnonymousConversation}
                    currentUser={currentUser}
                    onBack={() => setSelectedAnonymousConversation(null)}
                    onRefresh={loadAnonymousConversations}
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
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 h-full",
        selectedConversation ? "flex" : "hidden md:flex"
      )}>
        {selectedConversation ? (
          <PersonalChat
            conversation={selectedConversation}
            currentUser={currentUser}
            onBack={() => setSelectedConversation(null)}
            onConversationUpdate={({ conversationId, lastMessage, lastMessageAt }) => {
              setConversations(prev =>
                prev.map(c =>
                  c._id === conversationId
                    ? { ...c, lastMessage, lastMessageAt }
                    : c
                )
              );
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-white to-[#faf8f5]">
            <div className="text-center max-w-md mx-auto p-8">
              <div className="w-20 h-20 bg-[#faf8f5] border border-[#c7b793]/20 rounded-full flex items-center justify-center mb-6 mx-auto shadow-sm">
                <MessageCircle className="h-10 w-10 text-[#c7b793]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight mb-2">
                Secure Chat Tunnel
              </h2>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Select an authorized contact from the directory to establish an encrypted message channel. All metadata is stripped and communications are peer-verified.
              </p>
              <div className="flex flex-col space-y-2.5 text-xs text-[#a38c5b] font-medium">
                <div className="flex items-center justify-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  <span>Real-time channel active</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-[#c7b793] rounded-full"></span>
                  <span>Zero metadata storage</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-[#c7b793] rounded-full"></span>
                  <span>Client-side decryption</span>
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