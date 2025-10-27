'use client';

import { useState, useEffect, useCallback } from 'react';
import { SecureNote } from '@/lib/types';
import { getCurrentUserFromSession } from '@/lib/auth-helper';
import { Lock, FileEdit, Trash2, Plus, X, FileText, ShieldCheck, Save, RotateCw } from 'lucide-react';

export default function SecureNotesPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [notes, setNotes] = useState<SecureNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNote, setEditingNote] = useState<SecureNote | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<SecureNote | null>(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinAction, setPinAction] = useState<'view' | 'edit' | 'delete'>('view');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isEncrypted: true,
    pin: '',
  });

  useEffect(() => {
    const user = getCurrentUserFromSession();
    setCurrentUser(user);
  }, []);

  const fetchNotes = useCallback(async () => {
    try {
      const response = await fetch('/api/secure-notes');
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      console.error('Error fetching secure notes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchNotes();
    }
  }, [currentUser, fetchNotes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingNote ? `/api/secure-notes/${editingNote.id}` : '/api/secure-notes';
      const method = editingNote ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({ title: '', content: '', isEncrypted: true, pin: '' });
        setShowAddForm(false);
        setEditingNote(null);
        fetchNotes();
      } else {
        const errorData = await response.json();
        setPinError(errorData.message || 'Error saving note');
      }
    } catch (error) {
      setPinError('Error saving secure note: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const verifyPinAndExecute = async (note: SecureNote, action: 'view' | 'edit' | 'delete') => {
    if (!note.isEncrypted) {
      // If not encrypted, execute directly
      if (action === 'view') {
        setSelectedNote(note);
      } else if (action === 'edit') {
        startEdit(note);
      } else if (action === 'delete') {
        deleteNoteDirectly(note.id);
      }
      return;
    }

    // For encrypted notes, show PIN modal
    setSelectedNote(note);
    setPinAction(action);
    setShowPinModal(true);
  };

  const executeWithPin = async () => {
    if (!selectedNote || !pin) return;

    try {
      console.log('Sending PIN verification request:', {
        noteId: selectedNote.id,
        pin: pin,
        action: pinAction,
      });

      // Use the single PIN verification endpoint for all actions
      const response = await fetch('/api/secure-notes/verify-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          noteId: selectedNote.id,
          pin: pin,
          action: pinAction,
        }),
      });

      console.log('PIN verification response status:', response.status);
      const data = await response.json();
      console.log('PIN verification response data:', data);

      if (response.ok && data.success) {
        if (pinAction === 'view') {
          setSelectedNote({ ...selectedNote, content: data.content });
        }

        setShowPinModal(false);
        setPin('');
        setPinError('');

        // Execute the action after successful PIN verification
        if (pinAction === 'edit') {
          setShowAddForm(true);
          setEditingNote(selectedNote);
          setFormData({
            title: selectedNote.title,
            content: selectedNote.content,
            isEncrypted: selectedNote.isEncrypted,
            pin: '',
          });
        } else if (pinAction === 'delete') {
          await deleteNoteDirectly(selectedNote.id);
        }

      } else {
        // Clear selected note on failed PIN verification to prevent content exposure
        setSelectedNote(null);
        setPinError(data.message || 'Invalid PIN');
        setPin('');
      }
    } catch (error) {
      console.error('PIN verification error:', error);
      setPinError('Error verifying PIN: ');
    }
  };

  const deleteNoteDirectly = async (id: string) => {
    try {
      const response = await fetch(`/api/secure-notes/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchNotes();
      }
    } catch (error) {
      console.error('Error deleting secure note:', error);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const response = await fetch(`/api/secure-notes/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchNotes();
      }
    } catch (error) {
      console.error('Error deleting secure note:', error);
    }
  };

  const startEdit = (note: SecureNote) => {
    if (note.isEncrypted) {
      // For encrypted notes, show PIN modal first
      setSelectedNote(note);
      setPinAction('edit');
      setShowPinModal(true);
    } else {
      // For non-encrypted notes, open edit form directly
      setEditingNote(note);
      setFormData({
        title: note.title,
        content: note.content,
        isEncrypted: note.isEncrypted,
        pin: '',
      });
      setShowAddForm(true);
    }
  };

  const viewNote = (note: SecureNote) => {
    if (note.isEncrypted) {
      setSelectedNote(null);
      setPinAction('view');
      setShowPinModal(true);
    } else {
      setSelectedNote(note);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 relative overflow-hidden font-mono">
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

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-gold-400 rounded-full animate-pulse opacity-20"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-amber-400 rounded-full animate-pulse opacity-30 animation-delay-1000"></div>
        <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-gold-300 rounded-full animate-pulse opacity-25 animation-delay-2000"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gold-400/10 to-amber-400/10 rounded-2xl mb-8 border border-gold-400/20 backdrop-blur-sm">
            <FileText className="w-12 h-12 text-gold-400" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gold-400 via-amber-300 to-gold-500 bg-clip-text text-transparent mb-4 tracking-tight">
            Secure Vault
          </h1>
          <p className="text-gray-400 text-lg font-medium tracking-wide">Encrypted Digital Notes</p>
        </div>

        {/* PIN Modal */}
        {showPinModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800/90 to-gray-800/90 p-8 rounded-3xl shadow-2xl max-w-md w-full border border-gold-400/30 backdrop-blur-md relative">
              {/* Digital border effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-gold-400/20 via-transparent to-amber-400/20 opacity-50"></div>

              <div className="relative">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-gold-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                    <ShieldCheck className="w-7 h-7 text-white" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-center mb-2 text-white">
                  {pinAction === 'view' && 'Access Encrypted Note'}
                  {pinAction === 'edit' && 'Modify Secure Note'}
                  {pinAction === 'delete' && 'Delete Protected Note'}
                </h3>
                <p className="text-gray-300 text-center mb-6 text-sm">
                  Authentication required for {pinAction}ing this encrypted note
                </p>

                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="Enter 4-6 digit PIN"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-700/50 border border-gold-400/40 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent text-center text-xl font-mono tracking-wider"
                      maxLength={6}
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gold-400">
                      <Lock className="w-5 h-5" />
                    </div>
                  </div>

                  {pinError && (
                    <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-3">
                      <p className="text-red-400 text-sm text-center">{pinError}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={executeWithPin}
                      className="px-8 py-4 bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-500 hover:to-amber-600 text-white font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-gold-400/25 transform hover:scale-105"
                    >
                      {pinAction === 'view' && 'Access Note'}
                      {pinAction === 'edit' && 'Edit Note'}
                      {pinAction === 'delete' && 'Delete Note'}
                    </button>
                    <button
                      onClick={() => {
                        setShowPinModal(false);
                        setPin('');
                        setPinError('');
                        setSelectedNote(null);
                      }}
                      className="px-8 py-4 bg-slate-700/50 hover:bg-slate-600/50 text-gray-300 font-semibold rounded-2xl transition-all duration-300 border border-gray-600 hover:border-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Note Content Modal */}
        {selectedNote && !showPinModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800/90 to-gray-800/90 p-8 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] border border-gold-400/30 backdrop-blur-md relative">
              {/* Digital border effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-gold-400/20 via-transparent to-amber-400/20 opacity-50"></div>

              <div className="relative">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-gold-400/20 to-amber-400/20 rounded-xl flex items-center justify-center border border-gold-400/30">
                      <svg className="w-6 h-6 text-gold-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{selectedNote.title}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        {selectedNote.isEncrypted && (
                          <span className="inline-flex items-center px-3 py-1 space-x-1.5 bg-gold-400/20 text-gold-400 text-xs font-medium rounded-full border border-gold-400/30">
                            <Lock className="w-3 h-3" />
                            <span>Encrypted</span>
                          </span>
                        )}
                        <span className="text-gray-400 text-sm">
                          {new Date(selectedNote.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedNote(null)}
                    className="w-10 h-10 bg-slate-700/50 hover:bg-slate-600/50 text-gray-400 hover:text-gray-300 rounded-xl transition-all duration-200 flex items-center justify-center border border-gray-600 hover:border-gray-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-slate-700/30 rounded-2xl p-6 border border-gold-400/20">
                  <pre className="whitespace-pre-wrap font-mono text-gray-300 leading-relaxed text-sm">
                    {selectedNote.content}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {showAddForm && (
          <div className="mb-12 bg-gradient-to-br from-slate-800/90 to-gray-800/90 p-8 rounded-3xl border border-gold-400/30 backdrop-blur-md shadow-2xl relative">
            {/* Digital border effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-gold-400/20 via-transparent to-amber-400/20 opacity-50"></div>

            <div className="relative">
              <div className="flex items-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-gold-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg mr-6">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">
                    {editingNote ? 'Edit Secure Note' : 'Create New Note'}
                  </h2>
                  <p className="text-gray-400 mt-1">
                    {editingNote ? 'Modify your encrypted note' : 'Add a new secure note to your vault'}
                  </p>
                </div>
              </div>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                      Note Title
                    </label>
                    <input
                      type="text"
                      placeholder="Enter note title..."
                      required
                      className="w-full px-6 py-4 bg-slate-700/50 border border-gold-400/40 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent text-lg transition-all duration-300"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                      Security
                    </label>
                    <div className="flex items-center space-x-4 p-4 bg-slate-700/30 rounded-2xl border border-gold-400/20">
                      <input
                        type="checkbox"
                        id="encrypted"
                        checked={formData.isEncrypted}
                        onChange={(e) => setFormData({ ...formData, isEncrypted: e.target.checked })}
                        className="w-5 h-5 text-gold-400 bg-slate-700/50 border-gold-400/40 rounded focus:ring-gold-400 focus:ring-2"
                      />
                      <label htmlFor="encrypted" className="text-gray-300 font-medium">
                        Encrypt this note with PIN protection
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                      {formData.isEncrypted ? 'PIN Code' : 'Content Preview'}
                    </label>
                    {formData.isEncrypted ? (
                      <div className="relative">
                        <input
                          type="password"
                          placeholder="4-6 digit PIN"
                          required
                          className="w-full px-6 py-4 bg-slate-700/50 border border-gold-400/40 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent text-center text-xl font-mono tracking-wider"
                          value={formData.pin}
                          onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                          maxLength={6}
                          minLength={4}
                        />
                        <div className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gold-400">
                          🔐
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-700/30 rounded-2xl border border-gold-400/20">
                        <p className="text-gray-400 text-sm">
                          This note will be stored without encryption
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                  Note Content
                </label>
                <textarea
                  placeholder="Write your secure note here..."
                  required
                  className="w-full px-6 py-4 bg-slate-700/50 border border-gold-400/40 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent h-40 resize-none transition-all duration-300"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                />
              </div>

              {editingNote?.isEncrypted && (
                <div className="bg-amber-500/10 border border-amber-400/30 rounded-2xl p-4">
                  <p className="text-amber-400 text-sm flex items-center">
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    This encrypted note required PIN verification for access
                  </p>
                </div>
              )}

              <div className="flex gap-6 pt-6">
                <button
                  type="submit"
                  className="flex-1 px-8 py-5 bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-500 hover:to-amber-600 text-white font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-gold-400/25 transform hover:scale-105"
                >
                  <span className="flex items-center justify-center space-x-2">
                    {editingNote ? (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Update Secure Note</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Create Secure Note</span>
                      </>
                    )}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingNote(null);
                    setSelectedNote(null);
                    setFormData({ title: '', content: '', isEncrypted: true, pin: '' });
                  }}
                  className="px-8 py-5 bg-slate-700/50 hover:bg-slate-600/50 text-gray-300 font-semibold rounded-2xl transition-all duration-300 border border-gray-600 hover:border-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <div key={note.id} className="group bg-gradient-to-br from-slate-800/50 to-gray-800/50 p-6 rounded-2xl border border-gold-400/20 hover:border-gold-400/40 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-gold-400/10 backdrop-blur-sm">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold text-white">{note.title}</h3>
                <div className="flex items-center gap-2">
                  {note.isEncrypted && (
                    <span className="text-gold-400 text-sm">🔒</span>
                  )}
                </div>
              </div>
              <p className="text-gray-400 mb-4 line-clamp-3">
                {note.isEncrypted ? '🔒 Encrypted content' : note.content.substring(0, 100) + (note.content.length > 100 ? '...' : '')}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => verifyPinAndExecute(note, 'view')}
                  className="text-gold-400 hover:text-gold-300 text-sm font-medium transition-colors"
                >
                  <span className="flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>View</span>
                  </span>
                </button>
                <button
                  onClick={() => verifyPinAndExecute(note, 'edit')}
                  className="text-gold-400 hover:text-gold-300 text-sm font-medium transition-colors"
                >
                  <span className="flex items-center space-x-1.5">
                    <FileEdit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </span>
                </button>
                <button
                  onClick={() => verifyPinAndExecute(note, 'delete')}
                  className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                >
                  <span className="flex items-center space-x-1.5">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {notes.length === 0 && !showAddForm && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gold-400/10 to-amber-400/10 rounded-full mb-6 border border-gold-400/20">
              <span className="text-3xl">📝</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No Notes Yet</h3>
            <p className="text-gray-400 text-lg mb-8">Start building your secure notes vault</p>
            <button
              onClick={() => {
                setShowAddForm(true);
                setEditingNote(null);
                setFormData({ title: '', content: '', isEncrypted: true, pin: '' });
              }}
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-500 hover:to-amber-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-gold-400/25"
            >
              <span className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Your First Note</span>
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
