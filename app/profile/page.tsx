'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Camera,
  Check,
  Edit2,
  Mail,
  Calendar,
  User,
  Shield,
  X,
  Loader2,
} from 'lucide-react';
import { getCurrentUserFromSession, clearCurrentUserSession } from '@/lib/client-auth';
// import { useBackButtonGuard } from '@/hooks/useBackButtonGuard';
import { format } from 'date-fns/format';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  image: string | null;
  status: string;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  // useBackButtonGuard('/personal-chat');

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const user = getCurrentUserFromSession();
    if (!user) {
      router.push('/login');
      return;
    }
    loadProfile();
  }, [router]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setNameValue(data.profile.name);
        setPreviewImage(data.profile.image);
      }
    } catch (e) {
      console.error('Error loading profile:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveName = async () => {
    if (!nameValue.trim() || nameValue.trim() === profile?.name) {
      setEditingName(false);
      return;
    }
    await saveProfile({ name: nameValue.trim() });
    setEditingName(false);
  };

  const handleSaveImage = async () => {
    if (previewImage === profile?.image) return;
    await saveProfile({ image: previewImage || '' });
  };

  const saveProfile = async (updates: { name?: string; image?: string }) => {
    try {
      setIsSaving(true);
      setUploadError('');
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data.profile);
        setNameValue(data.profile.name);
        setPreviewImage(data.profile.image);
        setSuccessMsg('Profile updated!');
        setTimeout(() => setSuccessMsg(''), 3000);

        // Update localStorage session so header avatars update
        const session = JSON.parse(localStorage.getItem('user-session') || '{}');
        if (updates.name) session.name = updates.name;
        if (updates.image !== undefined) session.image = updates.image;
        localStorage.setItem('user-session', JSON.stringify(session));
      } else {
        setUploadError(data.error || 'Failed to update profile');
      }
    } catch (e) {
      setUploadError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#faf8f5]" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c7b793] mx-auto mb-4"></div>
          <p className="text-[#a38c5b] text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
      `}</style>

      {/* Header */}
      <div className="bg-white border-b border-[#c7b793]/15 px-4 py-3 flex items-center space-x-3 sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/personal-chat')}
          className="text-gray-400 hover:text-gray-600 rounded-full h-9 w-9"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold text-gray-900">My Profile</h1>
        {isSaving && <Loader2 className="h-4 w-4 animate-spin text-[#c7b793] ml-auto" />}
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-6 pb-12">

        {/* Success Message */}
        {successMsg && (
          <div className="flex items-center space-x-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
            <Check className="h-4 w-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Message */}
        {uploadError && (
          <div className="flex items-center space-x-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
            <X className="h-4 w-4 flex-shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Profile Picture Card */}
        <div className="bg-white rounded-2xl border border-[#c7b793]/15 p-6 shadow-sm">
          <div className="flex flex-col items-center space-y-4">
            {/* Avatar with camera button */}
            <div className="relative">
              <Avatar className="h-28 w-28 border-2 border-[#c7b793]/30 shadow-md">
                <AvatarImage src={previewImage || ''} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-[#c7b793] to-[#b8a57e] text-white text-3xl font-bold">
                  {profile?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 h-9 w-9 bg-[#c7b793] hover:bg-[#b8a57e] text-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-105"
                title="Change profile picture"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            <div className="text-center">
              <p className="text-base font-semibold text-gray-900">{profile?.name}</p>
              <p className="text-xs text-[#a38c5b] mt-0.5">{profile?.email}</p>
            </div>

            {/* Save picture button — only show when a new image is selected */}
            {previewImage !== profile?.image && (
              <div className="flex space-x-2 w-full">
                <Button
                  onClick={() => setPreviewImage(profile?.image || null)}
                  variant="outline"
                  className="flex-1 rounded-full border-gray-200 text-gray-600 hover:bg-gray-50 text-sm"
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveImage}
                  className="flex-1 bg-[#c7b793] hover:bg-[#b8a57e] text-white rounded-full text-sm"
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Photo'}
                </Button>
              </div>
            )}

            <p className="text-xs text-gray-400">Max 2MB • JPG, PNG, GIF, WebP</p>
          </div>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-2xl border border-[#c7b793]/15 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#c7b793]/10">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Account Info</h2>
          </div>

          {/* Name Row */}
          <div className="px-5 py-4 border-b border-[#c7b793]/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-9 h-9 bg-[#faf8f5] border border-[#c7b793]/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-[#c7b793]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 font-medium mb-0.5">Display Name</p>
                  {editingName ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        value={nameValue}
                        onChange={(e) => setNameValue(e.target.value)}
                        className="h-8 text-sm border-[#c7b793]/40 focus:ring-[#c7b793]/20 rounded-lg"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveName();
                          if (e.key === 'Escape') {
                            setEditingName(false);
                            setNameValue(profile?.name || '');
                          }
                        }}
                      />
                      <button
                        onClick={handleSaveName}
                        className="text-[#c7b793] hover:text-[#b8a57e] p-1"
                        disabled={isSaving}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingName(false);
                          setNameValue(profile?.name || '');
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-gray-900 truncate">{profile?.name}</p>
                  )}
                </div>
              </div>
              {!editingName && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingName(true)}
                  className="h-8 w-8 text-gray-400 hover:text-[#c7b793] flex-shrink-0"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Email Row */}
          <div className="px-5 py-4 border-b border-[#c7b793]/10">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-[#faf8f5] border border-[#c7b793]/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="h-4 w-4 text-[#c7b793]" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-0.5">Email Address</p>
                <p className="text-sm font-medium text-gray-900">{profile?.email}</p>
              </div>
            </div>
          </div>

          {/* Status Row */}
          <div className="px-5 py-4 border-b border-[#c7b793]/10">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-[#faf8f5] border border-[#c7b793]/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="h-4 w-4 text-[#c7b793]" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400 font-medium mb-0.5">Status</p>
                <div className="flex items-center space-x-1.5">
                  <span className={`w-2 h-2 rounded-full ${
                    profile?.status === 'online' ? 'bg-green-500' :
                    profile?.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                  }`}></span>
                  <p className="text-sm font-medium text-gray-900 capitalize">{profile?.status || 'offline'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Member Since Row */}
          <div className="px-5 py-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-[#faf8f5] border border-[#c7b793]/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Calendar className="h-4 w-4 text-[#c7b793]" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-0.5">Member Since</p>
                <p className="text-sm font-medium text-gray-900">
                  {profile?.createdAt
                    ? format(new Date(profile.createdAt), 'MMMM d, yyyy')
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Note */}
        <div className="bg-[#c7b793]/8 border border-[#c7b793]/20 rounded-2xl p-4">
          <div className="flex items-start space-x-3">
            <Shield className="h-4 w-4 text-[#c7b793] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-[#a38c5b] mb-0.5">Privacy Notice</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Your profile picture is stored securely in our database. Only users you chat with can see your name and picture.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
