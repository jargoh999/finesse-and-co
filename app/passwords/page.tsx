'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Password } from '@/lib/types';
import { getCurrentUserFromSession } from '@/lib/auth-helper';
import { Key, Plus, Eye, EyeOff, Copy, Trash2, Globe, User, Tag, FileText, X, Lock, RotateCw, ShieldCheck, RefreshCw, Vault } from 'lucide-react';

interface User {
  id: string;
  email?: string;
  name?: string;
  // Add other user properties as needed
}

// Add Vault type if not already defined in your types
interface Vault {
  id: string;
  name: string;
  // Add other vault properties as needed
}

export default function PasswordsPage() {
  type PasswordFormData = Omit<Password, 'id' | 'createdAt' | 'updatedAt'>;
  
  // State declarations
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPassword, setShowPassword] = useState<string | null>(null);
  const [formData, setFormData] = useState<PasswordFormData>({
    title: '',
    username: '',
    password: '',
    url: '',
    notes: '',
    category: '',
    userId: ''
  });

  // Move fetchPasswords before it's used in useEffect
  const fetchPasswords = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/passwords');
      if (response.ok) {
        const data = await response.json();
        setPasswords(data);
      }
    } catch (error) {
      console.error('Error fetching passwords:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update formData with userId when currentUser is available
  useEffect(() => {
    if (currentUser?.id && !formData.userId) {
      setFormData(prev => ({ ...prev, userId: currentUser.id }));
    }
  }, [currentUser?.id, formData.userId]);

  // Load user data and passwords
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await getCurrentUserFromSession();
        setCurrentUser(user);
        if (user?.id) {
          fetchPasswords();
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    
    loadUser();
  }, [fetchPasswords]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        userId: currentUser?.id || '' // Ensure userId is included in the request
      };
      
      const response = await fetch('/api/passwords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      if (!response.ok) {
        throw new Error('Failed to save password');
      }

      setFormData({
        title: '',
        username: '',
        password: '',
        url: '',
        notes: '',
        category: '',
        userId: currentUser?.id || ''
      } as Omit<Password, 'id' | 'createdAt' | 'updatedAt'>);
      
      setShowAddForm(false);
      await fetchPasswords();
      
      // Show success message (you can replace this with a toast notification)
      alert('Password saved successfully!');
      
    } catch (error) {
      console.error('Error creating password:', error);
      alert('Failed to save password. Please try again.');
    }
  };

  const deletePassword = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this password?')) {
      try {
        const response = await fetch(`/api/passwords/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchPasswords();
        }
      } catch (error) {
        console.error('Error deleting password:', error);
      }
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // TODO: Add toast notification here
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const generatePassword = useCallback((): void => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const result = Array.from(
      { length: 16 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join('');
    
    setFormData(prev => ({
      ...prev,
      password: result
    }));
  }, []);

  if (loading && passwords.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-gold-400/30 border-t-gold-400 rounded-full animate-spin mb-4"></div>
        <div className="text-gold-400 text-lg font-medium tracking-wide">Securing your vault...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 relative overflow-hidden font-mono text-gray-100">
      {/* Digital Grid Background */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `
              linear-gradient(rgba(251, 191, 36, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(251, 191, 36, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Header */}
      <header className="relative bg-gradient-to-r from-slate-800/80 to-gray-800/80 backdrop-blur-xl border-b border-gold-400/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-6 space-y-4 md:space-y-0">
            <div className="flex items-center space-x-5">
              <div className="w-16 h-16 bg-gradient-to-br from-gold-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-gold-400/25">
                <Key className="w-7 h-7 text-white" strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gold-400 via-amber-300 to-gold-500 bg-clip-text text-transparent tracking-tight">
                  Password Vault
                </h1>
                <p className="text-sm text-gray-400 font-medium tracking-wide">Secure Password Management</p>
              </div>
            </div>

            <button
              onClick={() => setShowAddForm(true)}
              className="w-full md:w-auto inline-flex items-center justify-center space-x-2.5 px-7 py-3.5 bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-500 hover:to-amber-600 text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-gold-400/25 transform hover:scale-[1.02] active:scale-95"
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
              <span className="tracking-wide">Add Password</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {showAddForm && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-gold-400/20 p-6 mb-10 shadow-2xl shadow-gold-400/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Add New Password</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-2 rounded-full hover:bg-slate-700/50 transition-colors text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-transparent"
                    placeholder="e.g. Gmail Account"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Username/Email *</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-transparent"
                    placeholder="username@example.com"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-400">Password *</label>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="text-xs text-gold-400 hover:text-gold-300 flex items-center space-x-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Generate</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2.5 pr-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-transparent"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(showPassword ? null : 'new')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Website URL</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      type="url"
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg pl-10 px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-transparent"
                      placeholder="https://"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Tag className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      type="text"
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg pl-10 px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-transparent"
                      placeholder="e.g. Work, Personal"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Notes</label>
                  <div className="relative">
                    <div className="absolute top-3 left-3">
                      <FileText className="h-5 w-5 text-gray-500" />
                    </div>
                    <textarea
                      rows={3}
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg pl-10 px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-transparent"
                      placeholder="Additional notes about this password..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2.5 text-sm font-medium text-gray-300 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-600 hover:to-amber-600 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        )}

        {passwords.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gold-400/10 to-amber-400/10 rounded-full mb-8 border border-gold-400/20">
              <Vault className="w-12 h-12 text-gold-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">No Passwords Yet</h2>
            <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
              Your secure password vault is empty. Add your first password to get started.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center space-x-2.5 px-7 py-3.5 bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-500 hover:to-amber-600 text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-gold-400/25"
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
              <span className="tracking-wide">Add Your First Password</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {passwords.map((password) => (
              <div key={password.id} className="group bg-gradient-to-br from-slate-800/50 to-gray-800/50 p-6 rounded-2xl border border-gold-400/20 hover:border-gold-400/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-gold-400/10 backdrop-blur-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-gold-400/20 to-amber-400/20 rounded-xl flex items-center justify-center">
                    <Lock className="w-6 h-6 text-gold-400" />
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => {
                        copyToClipboard(password.password);
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-gold-400"
                      title="Copy password"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deletePassword(password.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                      title="Delete password"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-3">{password.title}</h3>

                <div className="space-y-2.5">
                  {password.username && (
                    <div className="flex items-center space-x-3 text-gray-300">
                      <User className="w-4 h-4 text-gold-400 flex-shrink-0" />
                      <span className="text-sm truncate">{password.username}</span>
                    </div>
                  )}
                  {password.url && (
                    <div className="flex items-center space-x-3 text-gray-300">
                      <Globe className="w-4 h-4 text-gold-400 flex-shrink-0" />
                      <a 
                        href={password.url.startsWith('http') ? password.url : `https://${password.url}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-gold-400 hover:underline truncate"
                      >
                        {password.url.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  {password.category && (
                    <div className="flex items-center space-x-3 text-gray-300">
                      <Tag className="w-4 h-4 text-gold-400 flex-shrink-0" />
                      <span className="text-sm bg-gold-400/10 text-gold-400 px-2.5 py-0.5 rounded-full">
                        {password.category}
                      </span>
                    </div>
                  )}
                  {password.notes && (
                    <div className="flex items-start space-x-3 text-gray-400 mt-3">
                      <FileText className="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm leading-relaxed line-clamp-2">{password.notes}</p>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-gray-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-400">Password</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          copyToClipboard(password.password);
                        }}
                        className="p-1 text-gray-500 hover:text-gold-400 transition-colors"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setShowPassword(showPassword === password.id ? null : password.id)}
                        className="p-1 text-gray-500 hover:text-gold-400 transition-colors"
                        title={showPassword === password.id ? 'Hide password' : 'Show password'}
                      >
                        {showPassword === password.id ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="px-3 py-2 bg-slate-800/50 rounded-lg border border-gold-400/20">
                    <code className="text-sm text-gray-300 font-mono tracking-wider">
                      {showPassword === password.id ? password.password : '••••••••••••••••'}
                    </code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
