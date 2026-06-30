'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
    const router = useRouter();
    
    const navigateTo = (path: string) => {
        router.push(path);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 relative font-orbitron">
            {/* Header */}
            <div className="flex items-center justify-between mb-12">
                <button 
                    onClick={() => router.push('/vault-page')} 
                    className="group relative flex items-center gap-2 text-white/80 hover:text-white transition-all duration-300"
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
                {/* <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 tracking-wider font-digital">PASS VAULT</h1> */}
                <div className="w-10"></div> {/* Spacer for alignment */}
            </div>

            {/* Main content grid */}
            <div className="max-w-2xl mx-auto">
                <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
                    {/* Password Card */}
                    <div 
                        className="group relative"
                        onClick={() => navigateTo('/passwords')}
                    >
                        <div className="p-0.5 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
                            <div className="bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl h-full flex flex-col items-center">
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 group-hover:scale-110 relative group-hover:shadow-lg group-hover:shadow-blue-500/30">
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 group-hover:opacity-0 transition-opacity duration-500"></div>
                                    <img 
                                        src="/1c.png" 
                                        alt="Password" 
                                        className="w-16 h-16 object-contain transform transition-all duration-700 group-hover:scale-110 group-hover:rotate-3"
                                        width={64}
                                        height={64}
                                    />
                                </div>
                                <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 tracking-wider font-digital">PASSWORDS</p>
                            </div>
                        </div>
                    </div>

                    {/* Secure note Card */}
                    <div 
                        className="group relative"
                        onClick={() => navigateTo('/secure-notes')}
                    >
                        <div className="p-0.5 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
                            <div className="bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl h-full flex flex-col items-center">
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 group-hover:scale-110 relative group-hover:shadow-lg group-hover:shadow-blue-500/30">
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 group-hover:opacity-0 transition-opacity duration-500"></div>
                                    <img 
                                        src="/2c.png" 
                                        alt="Secure Note" 
                                        className="w-16 h-16 object-contain transform transition-all duration-700 group-hover:scale-110 group-hover:-rotate-3"
                                        width={64}
                                        height={64}
                                    />
                                </div>
                                <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 tracking-wider font-digital">SECURE NOTES</p>
                            </div>
                        </div>
                    </div>

                    {/* Contact info Card */}
                    <div 
                        className="group relative"
                        onClick={() => navigateTo('/contacts')}
                    >
                        <div className="p-0.5 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
                            <div className="bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl h-full flex flex-col items-center">
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 group-hover:scale-110 relative group-hover:shadow-lg group-hover:shadow-blue-500/30">
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 group-hover:opacity-0 transition-opacity duration-500"></div>
                                    <img 
                                        src="/3c.png" 
                                        alt="Contact Info" 
                                        className="w-16 h-16 object-contain transform transition-all duration-700 group-hover:scale-110 group-hover:rotate-2"
                                        width={64}
                                        height={64}
                                    />
                                </div>
                                <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 tracking-wider font-digital">CONTACTS</p>
                            </div>
                        </div>
                    </div>

                    {/* Wifi Card */}
                    <div 
                        className="group relative"
                        onClick={() => navigateTo('/wifi')}
                    >
                        <div className="p-0.5 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
                            <div className="bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl h-full flex flex-col items-center">
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 group-hover:scale-110 relative group-hover:shadow-lg group-hover:shadow-blue-500/30">
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 group-hover:opacity-0 transition-opacity duration-500"></div>
                                    <img 
                                        src="/4c.png" 
                                        alt="WiFi" 
                                        className="w-16 h-16 object-contain transform transition-all duration-700 group-hover:scale-110 group-hover:-rotate-2"
                                        width={64}
                                        height={64}
                                    />
                                </div>
                                <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 tracking-wider font-digital">WI-FI</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}
