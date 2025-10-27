'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { getCurrentUserFromSession } from '@/lib/auth-helper';

export function AssistantButton() {
  const [showMenu, setShowMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { installApp, canInstall, isInstalled } = usePWAInstall();
  const router = useRouter();

  // Get current user from localStorage session
  useEffect(() => {
    const user = getCurrentUserFromSession();
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setUnreadCount(prev => Math.min(prev + 1, 9));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const playNotificationSound = () => {
    const audio = new Audio('/notification.mp3');
    audio.play().catch(e => console.log('Audio play failed:', e));
  };

  useEffect(() => {
    if (unreadCount > 0) {
      playNotificationSound();
    }
  }, [unreadCount]);

  const handleMenuItemClick = (path: string) => {
    setShowMenu(false);
    router.push(path);
  };

  return (
    <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-50">
      <div className="relative">
        {showMenu && (
          <div className="absolute right-0 bottom-full mb-4 w-64 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden transform transition-all duration-300 origin-bottom-right">
            <div className="p-2 space-y-1">
              <div
                className="flex items-center px-4 py-3 text-gray-200 hover:bg-gray-700/80 rounded-lg cursor-pointer transition-colors"
                onClick={() => handleMenuItemClick('/contacts')}
              >
                <span className="mr-3 text-xl">👥</span>
                <span className="font-medium">Contacts</span>
              </div>
              <div
                className="flex items-center px-4 py-3 text-gray-200 hover:bg-gray-700/80 rounded-lg cursor-pointer transition-colors"
                onClick={() => handleMenuItemClick('/wifi')}
              >
                <span className="mr-3 text-xl">📶</span>
                <span className="font-medium">WiFi</span>
              </div>
              <div
                className="flex items-center px-4 py-3 text-gray-200 hover:bg-gray-700/80 rounded-lg cursor-pointer transition-colors"
                onClick={() => handleMenuItemClick('/secure-notes')}
              >
                <span className="mr-3 text-xl">📝</span>
                <span className="font-medium">Secure Notes</span>
              </div>
              <div
                className="flex items-center px-4 py-3 text-gray-200 hover:bg-gray-700/80 rounded-lg cursor-pointer transition-colors"
                onClick={() => handleMenuItemClick('/passwords')}
              >
                <span className="mr-3 text-xl">🔐</span>
                <span className="font-medium">Passwords</span>
              </div>
              <div
                className="flex items-center justify-between px-4 py-3 text-gray-200 hover:bg-gray-700/80 rounded-lg cursor-pointer transition-colors"
                onClick={() => handleMenuItemClick('/private-chat')}
              >
                <div className="flex items-center">
                  <span className="mr-3 text-xl">💬</span>
                  <span className="font-medium">Private Chat</span>
                </div>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1.5 animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              {!isInstalled && canInstall && (
                <button
                  onClick={installApp}
                  className="mt-2 w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2.5 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity shadow-lg"
                >
                  🚀 Install App
                </button>
              )}
            </div>
          </div>
        )}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`relative w-14 h-14 rounded-full shadow-2xl transition-all duration-300 ${showMenu ? 'rotate-180' : ''}`}
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)'
          }}
          aria-label="Assistant menu"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-6 h-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white transition-transform duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              {unreadCount > 0 && (
                <span 
                  className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-bounce"
                  style={{
                    animation: 'bounce 2s infinite',
                    boxShadow: '0 0 0 2px rgba(31, 41, 55, 0.8)'
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
          </div>
        </button>
      </div>
      <style jsx global>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
