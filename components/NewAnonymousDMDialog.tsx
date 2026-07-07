'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, X, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface User {
  _id: string;
  name: string;
  email: string;
  image?: string;
}

interface NewAnonymousDMDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (userId: string, message: string) => void;
  currentUser: any;
}

export function NewAnonymousDMDialog({ open, onOpenChange, onSend, currentUser }: NewAnonymousDMDialogProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = () => {
    if (selectedUser && message.trim()) {
      onSend(selectedUser._id, message.trim());
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedUser(null);
    setMessage('');
    setSearchQuery('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <DialogHeader className="px-6 py-4 border-b border-[#c7b793]/15">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              New Anonymous Message
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-6">
          {!selectedUser ? (
            // User selection
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-[#faf8f5] border-transparent rounded-full focus:bg-white focus:border-[#c7b793]/40 focus:ring-[#c7b793]/10 text-sm h-10"
                />
              </div>

              <ScrollArea className="h-64 pr-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#c7b793]"></div>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">
                      {searchQuery ? 'No users found' : 'No users available'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredUsers.map((user) => (
                      <button
                        key={user._id}
                        onClick={() => setSelectedUser(user)}
                        className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-[#faf8f5] transition-colors text-left"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.image} />
                          <AvatarFallback className="bg-[#c7b793] text-white text-sm font-semibold">
                            {user.name?.charAt(0) || user.email?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.name || user.email}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user.email}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          ) : (
            // Message composition
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-[#faf8f5] rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedUser.image} />
                  <AvatarFallback className="bg-[#c7b793] text-white text-sm font-semibold">
                    {selectedUser.name?.charAt(0) || selectedUser.email?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {selectedUser.name || selectedUser.email}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {selectedUser.email}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedUser(null)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Your anonymous message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full min-h-[100px] px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#c7b793] focus:ring-2 focus:ring-[#c7b793]/10 transition-all duration-200 text-sm text-gray-800 placeholder-gray-400 resize-none"
                  maxLength={500}
                />
                <div className="flex justify-end mt-1.5">
                  <p className="text-xs text-gray-400">
                    {message.length}/500
                  </p>
                </div>
              </div>

              <Button
                onClick={handleSend}
                disabled={!message.trim()}
                className="w-full bg-[#c7b793] hover:bg-[#b8a57e] text-white rounded-full h-11 text-sm font-medium"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Anonymous Message
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
