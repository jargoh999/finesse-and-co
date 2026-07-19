'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Image, Video, Building, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getCurrentUserFromSession } from '@/lib/client-auth';

interface Ad {
  _id: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  userId: string;
  userName: string;
  userEmail: string;
  userImage?: string;
  createdAt: Date;
}

interface CommercialSpace {
  _id: string;
  title: string;
  description: string;
  location: string;
  price: string;
  userId: string;
  userName: string;
  userEmail: string;
  userImage?: string;
  createdAt: Date;
}

interface DailyRequest {
  _id: string;
  title: string;
  description: string;
  category: string;
  userId: string;
  userName: string;
  userEmail: string;
  userImage?: string;
  createdAt: Date;
}

export default function UpdatePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'ads' | 'commercial' | 'requests'>('ads');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [commercialSpaces, setCommercialSpaces] = useState<CommercialSpace[]>([]);
  const [dailyRequests, setDailyRequests] = useState<DailyRequest[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<'image' | 'video'>('image');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const user = getCurrentUserFromSession();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
    loadAds();
    loadCommercialSpaces();
    loadDailyRequests();
  }, [router]);

  const loadAds = async () => {
    try {
      const response = await fetch('/api/ads');
      if (response.ok) {
        const data = await response.json();
        setAds(data);
      }
    } catch (error) {
      console.error('Error loading ads:', error);
    }
  };

  const loadCommercialSpaces = async () => {
    try {
      const response = await fetch('/api/commercial-spaces');
      if (response.ok) {
        const data = await response.json();
        setCommercialSpaces(data);
      }
    } catch (error) {
      console.error('Error loading commercial spaces:', error);
    }
  };

  const loadDailyRequests = async () => {
    try {
      const response = await fetch('/api/daily-requests');
      if (response.ok) {
        const data = await response.json();
        setDailyRequests(data);
      }
    } catch (error) {
      console.error('Error loading daily requests:', error);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle || !uploadDescription) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadTitle);
      formData.append('description', uploadDescription);
      formData.append('mediaType', uploadType);

      const response = await fetch('/api/ads', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setShowUploadModal(false);
        setUploadTitle('');
        setUploadDescription('');
        setUploadFile(null);
        loadAds();
      }
    } catch (error) {
      console.error('Error uploading ad:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdClick = (ad: Ad) => {
    // Navigate to user's chat DM
    router.push(`/personal-chat?conversation=${ad.userId}`);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
      `}</style>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/landing-page')}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-800">Updates</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('ads')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'ads'
                ? 'border-[#c7b793] text-[#c7b793]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Ads
          </button>
          <button
            onClick={() => setActiveTab('commercial')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'commercial'
                ? 'border-[#c7b793] text-[#c7b793]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Commercial Space
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'requests'
                ? 'border-[#c7b793] text-[#c7b793]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Daily Requests
          </button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {activeTab === 'ads' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-medium text-gray-600">Business Advertisements</h2>
                <Button
                  onClick={() => setShowUploadModal(true)}
                  size="sm"
                  className="bg-[#c7b793] hover:bg-[#b5a682] text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Ad
                </Button>
              </div>

              {ads.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-[#faf8f5] border border-[#c7b793]/15 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Image className="h-8 w-8 text-[#c7b793]/70" />
                  </div>
                  <p className="text-gray-700 font-semibold text-sm">No ads yet</p>
                  <p className="text-gray-400 text-xs mt-1">Be the first to advertise your business</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ads.map((ad) => (
                    <div
                      key={ad._id}
                      onClick={() => handleAdClick(ad)}
                      className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="relative aspect-video bg-gray-100">
                        {ad.mediaType === 'image' ? (
                          <img
                            src={ad.mediaUrl}
                            alt={ad.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video
                            src={ad.mediaUrl}
                            className="w-full h-full object-cover"
                            controls
                          />
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-800 text-sm mb-2">{ad.title}</h3>
                        <p className="text-xs text-gray-500 line-clamp-2">{ad.description}</p>
                        <div className="flex items-center mt-3 pt-3 border-t border-gray-100">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={ad.userImage} />
                            <AvatarFallback className="text-xs">
                              {ad.userName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-gray-500 ml-2">{ad.userName}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'commercial' && (
            <div className="space-y-4">
              <h2 className="text-sm font-medium text-gray-600 mb-4">Commercial Spaces</h2>

              {commercialSpaces.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-[#faf8f5] border border-[#c7b793]/15 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building className="h-8 w-8 text-[#c7b793]/70" />
                  </div>
                  <p className="text-gray-700 font-semibold text-sm">No commercial spaces listed</p>
                  <p className="text-gray-400 text-xs mt-1">Check back later for available spaces</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {commercialSpaces.map((space) => (
                    <div
                      key={space._id}
                      className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 text-sm mb-1">{space.title}</h3>
                          <p className="text-xs text-gray-500 line-clamp-2 mb-2">{space.description}</p>
                          <div className="flex items-center space-x-2 text-xs text-gray-400">
                            <span>{space.location}</span>
                            <span>•</span>
                            <span className="text-[#c7b793] font-medium">{space.price}</span>
                          </div>
                        </div>
                        <Avatar className="h-8 w-8 ml-3">
                          <AvatarImage src={space.userImage} />
                          <AvatarFallback className="text-xs">
                            {space.userName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-4">
              <h2 className="text-sm font-medium text-gray-600 mb-4">Daily Requests</h2>

              {dailyRequests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-[#faf8f5] border border-[#c7b793]/15 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ClipboardList className="h-8 w-8 text-[#c7b793]/70" />
                  </div>
                  <p className="text-gray-700 font-semibold text-sm">No requests yet</p>
                  <p className="text-gray-400 text-xs mt-1">Check back later for community requests</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dailyRequests.map((request) => (
                    <div
                      key={request._id}
                      className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs bg-[#c7b793]/10 text-[#c7b793] px-2 py-0.5 rounded-full">
                              {request.category}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-800 text-sm mb-1">{request.title}</h3>
                          <p className="text-xs text-gray-500 line-clamp-2">{request.description}</p>
                        </div>
                        <Avatar className="h-8 w-8 ml-3">
                          <AvatarImage src={request.userImage} />
                          <AvatarFallback className="text-xs">
                            {request.userName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Create Advertisement</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Media Type</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setUploadType('image')}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 flex items-center justify-center space-x-2 transition-colors ${
                      uploadType === 'image'
                        ? 'border-[#c7b793] bg-[#c7b793]/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Image className="h-4 w-4" />
                    <span className="text-sm">Image</span>
                  </button>
                  <button
                    onClick={() => setUploadType('video')}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 flex items-center justify-center space-x-2 transition-colors ${
                      uploadType === 'video'
                        ? 'border-[#c7b793] bg-[#c7b793]/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Video className="h-4 w-4" />
                    <span className="text-sm">Video</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <Input
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Enter ad title"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Describe your business"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c7b793]/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {uploadType === 'image' ? 'Image' : 'Video'}
                </label>
                <Input
                  type="file"
                  accept={uploadType === 'image' ? 'image/*' : 'video/*'}
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={isLoading || !uploadFile || !uploadTitle || !uploadDescription}
                  className="flex-1 bg-[#c7b793] hover:bg-[#b5a682] text-white"
                >
                  {isLoading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
