'use client';

import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

export default function Home() {
    const router = useRouter();

    const handleLogout = async () => {
        await signOut({ redirect: false });
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 relative overflow-hidden font-orbitron">
            {/* Back Button */}
            <button
                onClick={() => router.back()}
                className="absolute top-4 left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Go back"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                    />
                </svg>
            </button>

            {/* Logout Button */}
            <button
                onClick={handleLogout}
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors"
                aria-label="Logout"
            >
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-6 w-6" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                >
                    <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                    />
                </svg>
            </button>

            {/* Main content */}
            <div className="w-full max-w-md space-y-8 px-4">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-2 tracking-wider">
                        Secure Vault
                    </h1>
                    <p className="text-gray-300 text-sm">Choose your secure destination</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {/* Pass Vault Card */}
                    <div
                        onClick={() => router.push('/vault-component')}
                        className="group relative bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl cursor-pointer transition-all duration-300 hover:border-blue-500/30"
                    >
                        <div className="bg-[#121218] p-6 rounded-xl h-full flex flex-col items-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 shadow-lg shadow-blue-500/20">
                                <img
                                    src="/vault.png"
                                    alt="Vault"
                                    className="w-16 h-16 object-contain"
                                    width={64}
                                    height={64}
                                />
                            </div>
                            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 tracking-wide">Pass Vault</h2>
                            <p className="text-xs text-gray-400 mt-1 tracking-wider font-mono">Secure password management</p>
                        </div>
                    </div>

                    {/* Private Chat Card */}
                    <div
                        onClick={() => router.push('/chat-component')}
                        className="group relative bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl cursor-pointer transition-all duration-300 hover:border-purple-500/30"
                    >
                        <div className="bg-[#121218] p-6 rounded-xl h-full flex flex-col items-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 shadow-lg shadow-purple-500/20">
                                <img
                                    src="/chat-img.png"
                                    alt="Chat"
                                    className="w-16 h-16 object-contain"
                                    width={64}
                                    height={64}
                                />
                            </div>
                            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 tracking-wide">Private Chat</h2>
                            <p className="text-xs text-gray-400 mt-1 tracking-wider font-mono">End-to-end encrypted messaging</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
