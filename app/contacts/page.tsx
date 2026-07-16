'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Contact } from '@/lib/types';
import { getCurrentUserFromSession, clearCurrentUserSession } from '@/lib/client-auth';
import {
  Users,
  Plus,
  Trash2,
  Mail,
  Phone,
  MapPin,
  FileText,
  X,
  Crown,
  Vault
} from 'lucide-react';

export default function ContactsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    const user = getCurrentUserFromSession();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
  }, [router]);

  useEffect(() => {
    if (currentUser) {
      fetchContacts();
    }
  }, [currentUser]);

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/contacts');
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({ name: '', email: '', phone: '', address: '', notes: '' });
        setShowAddForm(false);
        fetchContacts();
      }
    } catch (error) {
      console.error('Error creating contact:', error);
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchContacts();
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-2 border-gold-400 border-t-transparent"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-gold-400/20 to-gold-600/20 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,_theme(colors.gold.400),_transparent_50%)] opacity-20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_theme(colors.amber.400),_transparent_50%)] opacity-20"></div>
      </div>

      {/* Header */}
      <header className="relative bg-gradient-to-r from-slate-800/80 to-gray-800/80 backdrop-blur-xl border-b border-gold-400/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl flex items-center justify-center shadow-2xl shadow-gold-400/25">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gold-400 via-amber-300 to-gold-500 bg-clip-text text-transparent">
                  Contact Vault
                </h1>
                <p className="text-sm text-gray-400 font-medium">Secure Contact Management</p>
              </div>
            </div>

            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-500 hover:to-amber-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-gold-400/25"
            >
              <Plus className="w-5 h-5" />
              <span>Add Contact</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Contact Form */}
        {showAddForm && (
          <div className="mb-8 bg-gradient-to-br from-slate-800/50 to-gray-800/50 p-8 rounded-2xl border border-gold-400/20 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Add New Contact</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    required
                    className="w-full px-4 py-3 bg-slate-700/50 border border-gold-400/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-gold-400/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-gold-400/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                  <input
                    type="text"
                    placeholder="Enter address"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-gold-400/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                <textarea
                  placeholder="Additional notes about this contact"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-gold-400/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent h-24 resize-none"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-500 hover:to-amber-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-gold-400/25"
                >
                  Save Contact
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-8 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-gray-300 font-semibold rounded-xl transition-all duration-200 border border-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Contacts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contacts.map((contact) => (
            <div key={contact.id} className="group bg-gradient-to-br from-slate-800/50 to-gray-800/50 p-6 rounded-2xl border border-gold-400/20 hover:border-gold-400/40 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-gold-400/10 backdrop-blur-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-gold-400/20 to-amber-400/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-gold-400" />
                </div>
                <button
                  onClick={() => deleteContact(contact.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>

              <h3 className="text-xl font-bold text-white mb-3">{contact.name}</h3>

              <div className="space-y-2">
                {contact.email && (
                  <div className="flex items-center space-x-3 text-gray-300">
                    <Mail className="w-4 h-4 text-gold-400" />
                    <span className="text-sm">{contact.email}</span>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center space-x-3 text-gray-300">
                    <Phone className="w-4 h-4 text-gold-400" />
                    <span className="text-sm">{contact.phone}</span>
                  </div>
                )}
                {contact.address && (
                  <div className="flex items-center space-x-3 text-gray-300">
                    <MapPin className="w-4 h-4 text-gold-400" />
                    <span className="text-sm">{contact.address}</span>
                  </div>
                )}
                {contact.notes && (
                  <div className="flex items-start space-x-3 text-gray-400 mt-3">
                    <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                    <span className="text-sm leading-relaxed">{contact.notes}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {contacts.length === 0 && !showAddForm && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gold-400/10 to-amber-400/10 rounded-full mb-6 border border-gold-400/20">
              <Users className="w-10 h-10 text-gold-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No Contacts Yet</h3>
            <p className="text-gray-400 text-lg mb-8">Start building your secure contact vault</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-500 hover:to-amber-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-gold-400/25"
            >
              <Plus className="w-5 h-5" />
              <span>Add Your First Contact</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
