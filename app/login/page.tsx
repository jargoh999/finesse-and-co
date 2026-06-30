'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { setCurrentUserSession } from '@/lib/auth-helper';
import { Lock, Mail, Eye, EyeOff, User } from 'lucide-react';
import Head from 'next/head';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userSession, setUserSession] = useState<any>(null);
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
        // Set both localStorage and cookies for authentication
        setCurrentUserSession(data.user);
        localStorage.setItem('autoSavePermission', 'granted');
        router.push('/vault-page');
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

  // Check for existing session
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

  // Background gradient animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Create subtle noise effect
    const animate = () => {
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        if (Math.random() > 0.99) {
          const value = Math.floor(Math.random() * 20) + 5;
          data[i] = value;     // R
          data[i + 1] = value; // G
          data[i + 2] = value; // B
          data[i + 3] = 10;    // A - very subtle
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      requestAnimationFrame(animate);
    };
    
    const animationId = requestAnimationFrame(animate);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="min-h-screen overflow-hidden relative flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Head>
        <title>Secure Login | Szecurium</title>
        <meta name="description" content="Secure login to your Szecurium vault" />
        <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet"/>
      </Head>
      
      {/* Animated background */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgcGF0dGVyblRyYW5zZm9ybT0icm90YXRlKDQ1KSI+PHJlY3Qgd2lkdGg9IjUwJSIgaGVpZ2h0PSI1MCUiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMSkiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjcGF0dGVybikiLz48L3N2Zz4=')] opacity-20"></div>

      <div className="w-full max-w-md relative z-10 bg-gray-900/80 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-gray-800/50 transform transition-all duration-200 font-orbitron">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img 
            src="/logo3333.png" 
            alt="Szecurium" 
            className="h-24 w-auto mx-auto animate-bounce transition-transform duration-300 hover:scale-105"
          />
          <h1 className="mt-4 text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 tracking-wider font-mono">
            SZECURIUM
          </h1>
          <p className="text-sm text-cyan-300 tracking-widest font-mono mt-1">ELITE DIGITAL SECURITY VAULT</p>
        </div>

        {/* User Info */}
        {userSession && (
          <div className="flex items-center justify-center gap-3 mb-6 p-3 bg-white/10 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <User className="text-white/80" />
            </div>
            <div className="text-white/90 font-medium">
              {userSession.name || userSession.email?.split('@')[0]}
            </div>
          </div>
        )}

        {/* Title */}
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300 mb-2 text-center tracking-wider font-mono">
          {userSession ? 'WELCOME BACK' : 'SECURE ACCESS'}
        </h1>
        {userSession ? (
          <p className="text-center text-cyan-300 mb-6 text-sm tracking-wider font-mono">
            UNLOCK YOUR DIGITAL VAULT
          </p>
        ) : (
          <p className="text-center text-cyan-300 mb-6 text-sm tracking-wider font-mono">
            SIGN IN TO YOUR SECURE VAULT
          </p>
        )}

          {error && (
            <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-6">
            {!userSession && (
              <div className="relative group transform transition-all duration-300 hover:scale-[1.02]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-blue-500 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3.5 bg-[#121218] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Email address"
                />
              </div>
            )}

            <div className="relative group transform transition-all duration-300 hover:scale-[1.02]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-blue-500 group-focus-within:text-blue-400 transition-colors" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-3.5 bg-[#0f0c29] border-2 border-[#3b82f6]/30 rounded-xl text-white placeholder-[#3b82f6]/60 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] transition-all duration-300 shadow-lg shadow-[#3b82f6]/10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-500 hover:text-blue-400 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : (
                <span className="flex items-center">
                  <Lock className="w-4 h-4 mr-2" />
                  {userSession ? 'Unlock' : 'Sign In'}
                </span>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Don't have an account?{' '}
            <Link href="/register" className="font-medium text-blue-500 hover:text-blue-400 transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>

      {/* Global styles for animations */}
      <style jsx global>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-bounce {
          animation: bounce 2s ease-in-out infinite;
        }
        
        /* Digital font styling */
        .font-orbitron {
          font-family: 'Orbitron', sans-serif;
          text-shadow: 0 0 5px rgba(96, 165, 250, 0.5), 
                       0 0 10px rgba(96, 165, 250, 0.3);
          letter-spacing: 1px;
        }
        
        /* Smooth transitions */
        * {
          transition: background-color 0.2s, border-color 0.2s, transform 0.2s, text-shadow 0.2s;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(18, 18, 24, 0.1);
        }
        
        ::-webkit-scrollbar-thumb {
          background: #3b82f6;
          border-radius: 3px;
        }
      `}</style>
      
      {/* Footer */}
      <footer className="py-4 text-center text-xs text-gray-500">
        <p> {new Date().getFullYear()} Szecurium. Elite Digital Security Vault</p>
      </footer>
    </div>
  );
}
