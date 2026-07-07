'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, Users, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface User {
  _id: string;
  name: string;
  email: string;
  image?: string;
  status: string;
  lastSeen: Date;
}

interface Contact {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
}

interface NewConversationDialogProps {
  onSelectUser: (user: User & { conversationId?: string; conversation?: any }) => void;
  currentUser: any;
}

export function NewConversationDialog({ onSelectUser, currentUser }: NewConversationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'contacts'>('all');

  // Load users and contacts when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadUsers();
      loadContacts();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadContacts = async () => {
    try {
      const response = await fetch('/api/contacts');
      if (response.ok) {
        const data = await response.json();
        setContacts(data || []);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContacts = contacts.filter(contact =>
    contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const getLastSeenText = (lastSeen: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - new Date(lastSeen).getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleSelectUser = async (user: User) => {
    setIsOpen(false);
    setSearchQuery('');

    // Validate user object
    if (!user || !user._id) {
      console.error('Invalid user object:', user);
      return;
    }

    // Create conversation with selected user
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId: user._id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Pass the conversation data back to the parent with validation
        onSelectUser({
          ...user,
          conversationId: data.conversation?._id || data.conversation?.id,
          conversation: data.conversation
        });
      } else {
        console.error('Error creating conversation');
        // Still close the dialog even if there's an error
        onSelectUser(user);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      // Still close the dialog even if there's an error
      onSelectUser(user);
    }
  };

  const renderUser = (user: User, isContact = false) => (
    <div
      key={user._id}
      onClick={() => handleSelectUser(user)}
      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors min-h-[56px] touch-manipulation"
    >
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.image} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            {user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        {/* <div
          className={cn(
            'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white',
            getStatusColor(user.status || 'offline')
          )}
        /> */}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user.name || user.email}
          </p>
          {isContact && (
            <Badge variant="secondary" className="text-xs">
              Contact
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500 truncate">
            {user.email}
          </p>
          {user.status !== 'online' && (
            <span className="text-xs text-gray-400">
              {getLastSeenText(user.lastSeen)}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const handleAddContact = async (user: User) => {
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
        }),
      });

      if (response.ok) {
        // Refresh contacts list
        loadContacts();
        // Show success message (you could add a toast here)
        console.log('Contact added successfully');
      } else {
        console.error('Error adding contact');
      }
    } catch (error) {
      console.error('Error adding contact:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-500 hover:text-gray-700 min-h-[44px] min-w-[44px] touch-manipulation"
          title="New conversation"
        >
          <UserPlus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md mx-4 max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>Start New Conversation</DialogTitle>
          <DialogDescription>
            Search for users to start a new conversation with.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <Button
              variant={activeTab === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('all')}
              className="flex-1"
            >
              <Users className="h-4 w-4 mr-2" />
              All Users
            </Button>
            <Button
              variant={activeTab === 'contacts' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('contacts')}
              className="flex-1"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              My Contacts
            </Button>
          </div>

          {/* Results */}
          <ScrollArea className="h-80">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : activeTab === 'all' ? (
              filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                  <Users className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-gray-500 text-sm mb-1">
                    {searchQuery ? 'No users found' : 'No other users available'}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {searchQuery ? 'Try a different search term' : 'Check back later for new users'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredUsers.map((user) => renderUser(user, false))}
                </div>
              )
            ) : (
              filteredContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                  <UserPlus className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-gray-500 text-sm mb-1">
                    {searchQuery ? 'No contacts found' : 'No contacts yet'}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {searchQuery ? 'Try a different search term' : 'Add contacts to get started'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact._id}
                      onClick={() => handleSelectUser({
                        _id: contact._id || '',
                        name: contact.name || '',
                        email: contact.email || '',
                        image: '',
                        status: 'offline',
                        lastSeen: new Date()
                      })}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors min-h-[56px] touch-manipulation"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                          {contact.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'C'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {contact.name}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            Contact
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {contact.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
