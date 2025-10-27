'use client';

import { useState, useEffect, useCallback } from 'react';
import { WiFiNetwork } from '@/lib/types';
import { getCurrentUserFromSession } from '@/lib/auth-helper';
import {
  Wifi,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Shield,
  Lock,
  Signal,
  X,
  Crown,
  Vault,
  FileText
} from 'lucide-react';

export default function WiFiPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [networks, setNetworks] = useState<WiFiNetwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPassword, setShowPassword] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    ssid: '',
    password: '',
    securityType: 'WPA2' as const,
    notes: '',
  });

  useEffect(() => {
    const user = getCurrentUserFromSession();
    setCurrentUser(user);
  }, []);

  const fetchNetworks = useCallback(async () => {
    try {
      const response = await fetch('/api/wifi');
      if (response.ok) {
        const data = await response.json();
        setNetworks(data);
      }
    } catch (error) {
      console.error('Error fetching WiFi networks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchNetworks();
    }
  }, [currentUser, fetchNetworks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/wifi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({ name: '', ssid: '', password: '', securityType: 'WPA2', notes: '' });
        setShowAddForm(false);
        fetchNetworks();
      }
    } catch (error) {
      console.error('Error creating WiFi network:', error);
    }
  };

  const deleteNetwork = async (id: string) => {
    try {
      const response = await fetch(`/api/wifi/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchNetworks();
      }
    } catch (error) {
      console.error('Error deleting WiFi network:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
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
                <Wifi className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gold-400 via-amber-300 to-gold-500 bg-clip-text text-transparent">
                  Network Safe
                </h1>
                <p className="text-sm text-gray-400 font-medium">Protected WiFi Credentials</p>
              </div>
            </div>

            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-500 hover:to-amber-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-gold-400/25"
            >
              <Plus className="w-5 h-5" />
              <span>Add Network</span>
            </button>
          </div>
        </div>
      </header>

      {/* Add Network Form */}
      {showAddForm && (
        <div className="mb-8 bg-gradient-to-br from-slate-800/50 to-gray-800/50 p-8 rounded-2xl border border-gold-400/20 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Add New WiFi Network</h2>
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
                <label className="block text-sm font-medium text-gray-300 mb-2">Network Name *</label>
                <input
                  type="text"
                  placeholder="Enter network name"
                  required
                  className="w-full px-4 py-3 bg-slate-700/50 border border-gold-400/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">SSID *</label>
                <input
                  type="text"
                  placeholder="Enter SSID"
                  required
                  className="w-full px-4 py-3 bg-slate-700/50 border border-gold-400/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent font-mono"
                  value={formData.ssid}
                  onChange={(e) => setFormData({ ...formData, ssid: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password *</label>
                <input
                  type="password"
                  placeholder="Enter password"
                  required
                  className="w-full px-4 py-3 bg-slate-700/50 border border-gold-400/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Security Type</label>
                <select
                  className="w-full px-4 py-3 bg-slate-700/50 border border-gold-400/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                  value={formData.securityType}
                  onChange={(e) => setFormData({ ...formData, securityType: e.target.value as any })}
                >
                  <option value="WPA2">WPA2</option>
                  <option value="WPA">WPA</option>
                  <option value="WEP">WEP</option>
                  <option value="OPEN">Open</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
              <textarea
                placeholder="Additional notes about this network"
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
                Save Network
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

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {networks.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gold-400/10 to-amber-400/10 rounded-full mb-6 border border-gold-400/20">
              <Wifi className="w-10 h-10 text-gold-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No Networks Yet</h3>
            <p className="text-gray-400 text-lg mb-8">Start building your secure network vault</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-500 hover:to-amber-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-gold-400/25"
            >
              <Plus className="w-5 h-5" />
              <span>Add Your First Network</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {networks.map((network) => (
              <div key={network.id} className="group bg-gradient-to-br from-slate-800/50 to-gray-800/50 p-6 rounded-2xl border border-gold-400/20 hover:border-gold-400/40 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-gold-400/10 backdrop-blur-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-gold-400/20 to-amber-400/20 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-gold-400" />
                  </div>
                  <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <Copy className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => deleteNetwork(network.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-3">{network.name}</h3>

                <div className="space-y-2">
                  <div className="flex items-center space-x-3 text-gray-300">
                    <Wifi className="w-4 h-4 text-gold-400" />
                    <span className="text-sm font-mono">{network.ssid}</span>
                  </div>

                  <div className="flex items-center space-x-3 text-gray-300">
                    <Shield className="w-4 h-4 text-gold-400" />
                    <span className="text-sm">{network.securityType}</span>
                  </div>

                  {network.notes && (
                    <div className="flex items-start space-x-3 text-gray-400 mt-3">
                      <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                      <span className="text-sm leading-relaxed">{network.notes}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Password</span>
                    <button
                      onClick={() => setShowPassword(showPassword === network.id ? null : network.id)}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      {showPassword === network.id ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <div className="mt-2 p-2 bg-slate-700/50 rounded border border-gold-400/20">
                    <code className="text-sm text-gray-300 font-mono">
                      {showPassword === network.id ? network.password : '••••••••'}
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
