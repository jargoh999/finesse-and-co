'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setCurrentUserSession } from '@/lib/auth-helper';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userSession, setUserSession] = useState<any>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentUserSession(data.user);
        localStorage.setItem('autoSavePermission', 'granted');
        router.push('/landing-page');
      } else {
        setError(data.error || 'Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated && data.user) {
            setUserSession(data.user);
            setEmail(data.user.email || '');
          }
        }
      } catch (error) {
        console.error('Session check failed:', error);
      }
    };
    checkSession();
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
      `}</style>
      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-6">
        {/* Illustration */}
        <div className="flex justify-center mb-8">
          <img
            src="/logo3333.png"
            alt="Logo"
            className="w-48 h-48 object-contain"
          />
        </div>

        {/* User Session Display */}
        {userSession && (
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-[#c7b793]/10 rounded-full border-2 border-[#c7b793]/30">
              <div className="w-10 h-10 rounded-full bg-[#c7b793] flex items-center justify-center text-white font-bold text-lg">
                {userSession.name?.charAt(0).toUpperCase() || userSession.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="text-left">
                <p className="text-sm text-gray-500">Welcome back,</p>
                <p className="font-semibold text-[#c7b793]">{userSession.name || userSession.email?.split('@')[0]}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form className="w-full max-w-md space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}

          {!userSession && (
            <div>
              <input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c7b793] focus:border-transparent"
              />
            </div>
          )}

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c7b793] focus:border-transparent pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#c7b793] hover:bg-[#c7b793]/80 text-white font-semibold rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Sign Up Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="text-[#c7b793] font-semibold">
              Sign Up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
