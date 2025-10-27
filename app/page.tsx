'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Wifi,
  FileText,
  MessageCircle,
  Settings,
  Shield,
  Smartphone,
  Zap,
  Key,
  Vault,
  Eye,
  EyeOff,
  Star,
  ChevronRight,
  Crown,
  Gem,
  Unlock,
  Lock
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setUser(data.user);
        } else {
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/login');
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

  if (!user) {
    return null;
  }

  const features = [
    {
      title: 'Contact Vault',
      description: 'Secure contact management with military-grade encryption',
      icon: Users,
      href: '/contacts',
      color: 'from-gold-400 to-gold-600',
      bgColor: 'bg-gradient-to-br from-gold-400/10 to-gold-600/10',
      borderColor: 'border-gold-400/30',
    },
    {
      title: 'Network Safe',
      description: 'Protected WiFi credentials with biometric access',
      icon: Shield,
      href: '/wifi',
      color: 'from-gold-500 to-amber-500',
      bgColor: 'bg-gradient-to-br from-gold-500/10 to-amber-500/10',
      borderColor: 'border-gold-500/30',
    },
    {
      title: 'Secure Notes',
      description: 'Encrypted notes vault with zero-knowledge architecture',
      icon: FileText,
      href: '/secure-notes',
      color: 'from-amber-400 to-gold-500',
      bgColor: 'bg-gradient-to-br from-amber-400/10 to-gold-500/10',
      borderColor: 'border-amber-400/30',
    },
    {
      title: 'Password Vault',
      description: 'Master password manager with quantum-resistant encryption',
      icon: Key,
      href: '/passwords',
      color: 'from-gold-600 to-amber-600',
      bgColor: 'bg-gradient-to-br from-gold-600/10 to-amber-600/10',
      borderColor: 'border-gold-600/30',
    },
    {
      title: 'Private Chat',
      description: 'End-to-end encrypted AI conversations with privacy focus',
      icon: MessageCircle,
      href: '/chat',
      color: 'from-amber-500 to-gold-400',
      bgColor: 'bg-gradient-to-br from-amber-500/10 to-gold-400/10',
      borderColor: 'border-amber-500/30',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,_theme(colors.gold.400),_transparent_50%)] opacity-20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_theme(colors.amber.400),_transparent_50%)] opacity-20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_80%,_theme(colors.gold.600),_transparent_50%)] opacity-20"></div>
      </div>

      {/* Header */}
      <header className="relative bg-gradient-to-r from-slate-800/80 to-gray-800/80 backdrop-blur-xl border-b border-gold-400/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl flex items-center justify-center shadow-2xl shadow-gold-400/25">
                  <Vault className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-amber-400 to-gold-500 rounded-full flex items-center justify-center">
                  <Crown className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gold-400 via-amber-300 to-gold-500 bg-clip-text text-transparent">
                  Szecurium
                </h1>
                <p className="text-sm text-gray-400 font-medium">Elite Digital Security Vault</p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{user.name}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>

              {/* Vault Status Indicator */}
              <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-gold-400/10 to-amber-400/10 rounded-lg border border-gold-400/20">
                <div className={`w-2 h-2 rounded-full ${isVaultOpen ? 'bg-green-400' : 'bg-gold-400'}`}></div>
                <span className="text-xs text-gray-300 font-medium">
                  {isVaultOpen ? 'Unlocked' : 'Locked'}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200 border border-white/10 hover:border-white/20"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gold-400/20 to-amber-400/20 rounded-full mb-6 border border-gold-400/30">
            <Lock className="w-10 h-10 text-gold-400" />
          </div>

          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white via-gold-200 to-white bg-clip-text text-transparent">
            Welcome back, {user.name}
          </h2>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Your personal fortress of digital security. Every secret, every connection, every credential — protected by military-grade encryption.
          </p>

          {/* Security Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 p-6 rounded-xl border border-gold-400/20 backdrop-blur-sm">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-lg mb-3 mx-auto">
                <Shield className="w-6 h-6 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">AES-256</div>
              <div className="text-sm text-gray-400">Military Grade Encryption</div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 p-6 rounded-xl border border-gold-400/20 backdrop-blur-sm">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-gold-400/20 to-amber-400/20 rounded-lg mb-3 mx-auto">
                <Eye className="w-6 h-6 text-gold-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">Zero Trust</div>
              <div className="text-sm text-gray-400">Privacy First Architecture</div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 p-6 rounded-xl border border-gold-400/20 backdrop-blur-sm">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-lg mb-3 mx-auto">
                <Gem className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">Premium</div>
              <div className="text-sm text-gray-400">Elite Security Experience</div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Link
              key={index}
              href={feature.href}
              className="group relative"
            >
              <div className={`relative p-8 rounded-2xl border-2 ${feature.bgColor} ${feature.borderColor} hover:border-gold-400/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-gold-400/10 backdrop-blur-sm`}>
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Icon */}
                <div className="relative z-10 mb-6">
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl shadow-lg`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-gold-300 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-4">
                    {feature.description}
                  </p>

                  {/* Arrow */}
                  <div className="flex items-center text-gold-400 group-hover:text-amber-300 transition-colors">
                    <span className="text-sm font-medium">Access Vault</span>
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </div>
                </div>

                {/* Hover Effect Border */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-gold-400/0 via-gold-400/20 to-amber-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
              </div>
            </Link>
          ))}
        </div>

        {/* Premium Footer */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gold-400/10 to-amber-400/10 rounded-full border border-gold-400/20">
            <Crown className="w-5 h-5 text-gold-400" />
            <span className="text-sm font-medium text-gray-300">
              Szecurium Elite • Premium Security Experience
            </span>
            <Star className="w-4 h-4 text-amber-400 fill-current" />
          </div>
        </div>
      </main>
    </div>
  );
}
