'use client';

import { useRouter } from 'next/navigation';

export default function ChatComponent() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 relative font-orbitron">
            {/* Back Button */}
            <button 
                onClick={() => router.back()}
                className="group relative flex items-center gap-2 text-white/80 hover:text-white transition-all duration-300"
                aria-label="Go back"
            >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all duration-300 group-hover:scale-110 hover:shadow-lg hover:shadow-blue-500/20">
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                    >
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                </div>
                <span className="text-sm font-medium tracking-wider group-hover:translate-x-1 transition-transform duration-300">BACK</span>
            </button>

            {/* Main content */}
            <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] gap-12 w-full max-w-md mx-auto">
                {/* Personal Chat Card */}
                <div 
                    className="group relative w-full max-w-xs"
                    onClick={() => router.push('/personal-chat')}
                >
                    <div className="p-0.5 rounded-2xl cursor-pointer transition-all duration-300">
                        <div className="bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl h-full flex flex-col items-center border border-gray-700/50 group-hover:border-blue-500/30 transition-colors duration-300">
                            <div className="w-32 h-32 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 group-hover:scale-110 relative group-hover:shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]">
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 group-hover:opacity-0 transition-opacity duration-500"></div>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-20 w-20 text-white transform transition-all duration-700 group-hover:scale-110 group-hover:rotate-3"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                </svg>
                            </div>
                            <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 tracking-[0.2em] uppercase font-orbitron text-shadow-[0_0_10px_rgba(56,189,248,0.5)]">PERSONAL CHAT</p>
                        </div>
                    </div>
                </div>

                {/* Group Chat Card */}
                <div 
                    className="group relative w-full max-w-xs"
                    onClick={() => router.push('/chat')}
                >
                    <div className="p-0.5 rounded-2xl cursor-pointer transition-all duration-300">
                        <div className="bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl h-full flex flex-col items-center border border-gray-700/50 group-hover:border-blue-500/30 transition-colors duration-300">
                            <div className="w-32 h-32 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 group-hover:scale-110 relative group-hover:shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]">
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 group-hover:opacity-0 transition-opacity duration-500"></div>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-20 w-20 text-white transform transition-all duration-700 group-hover:scale-110 group-hover:-rotate-3"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                </svg>
                            </div>
                            <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 tracking-[0.2em] uppercase font-orbitron text-shadow-[0_0_10px_rgba(56,189,248,0.5)]">GROUP CHAT</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
