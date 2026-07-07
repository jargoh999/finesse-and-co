'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Lock, Wifi, FileText } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const modules = [
    {
      id: 'chat',
      name: 'Private Chat',
      description: 'Establish secure, ephemeral, end-to-end encrypted chat rooms with zero message logs.',
      icon: MessageCircle,
      path: '/personal-chat',
      style: { left: '50%', top: '0', marginLeft: '-28px', marginTop: '-28px' },
      svgTarget: { x: 200, y: 50 },
      color: '#6366f1', // Indigo
    },
    {
      id: 'passwords',
      name: 'Credentials Fortress',
      description: 'Generate, store, and manage your credentials using zero-knowledge client-side encryption.',
      icon: Lock,
      path: '/passwords',
      style: { left: '100%', top: '50%', marginLeft: '-28px', marginTop: '-28px' },
      svgTarget: { x: 350, y: 200 },
      color: '#10b981', // Emerald
    },
    {
      id: 'wifi',
      name: 'WiFi Shield',
      description: 'Scan wireless channels, analyze security levels, and log trusted access parameters.',
      icon: Wifi,
      path: '/wifi',
      style: { left: '50%', top: '100%', marginLeft: '-28px', marginTop: '-28px' },
      svgTarget: { x: 200, y: 350 },
      color: '#f59e0b', // Amber
    },
    {
      id: 'notes',
      name: 'Secure Notes',
      description: 'Draft and lock plain-text databases inside encrypted local sandbox containers.',
      icon: FileText,
      path: '/secure-notes',
      style: { left: '0%', top: '50%', marginLeft: '-28px', marginTop: '-28px' },
      svgTarget: { x: 50, y: 200 },
      color: '#ec4899', // Pink
    },
  ];

  const handleNodeClick = (path: string) => {
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-white bg-[radial-gradient(rgba(199,183,147,0.15)_1px,transparent_1px)] bg-[size:24px_24px] flex items-center justify-center relative overflow-hidden" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
      `}</style>
      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.35;
            filter: drop-shadow(0 0 8px rgba(199, 183, 147, 0.25));
          }
          50% {
            opacity: 0.7;
            filter: drop-shadow(0 0 18px rgba(199, 183, 147, 0.55));
          }
        }
        @keyframes dot-blink {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.9;
          }
        }
        @keyframes laser-flow {
          from {
            stroke-dashoffset: 40;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        .hexagon-frame {
          animation: pulse-glow 3.5s ease-in-out infinite;
        }
        .node-dot-pulse {
          animation: dot-blink 2s ease-in-out infinite;
        }
        .laser-base-flow {
          animation: laser-flow 4s linear infinite;
          opacity: 0.35;
        }
        .laser-active-flow {
          animation: laser-flow 1.2s linear infinite;
        }
      `}</style>

      {/* HUD Info Panel (Gamified System Console) */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4 z-20 pointer-events-none">
        <div 
          className="bg-white/80 backdrop-blur-md border border-[#c7b793]/35 rounded-2xl py-3.5 px-5 shadow-[0_8px_32px_rgba(199,183,147,0.15)] text-center transition-all duration-300"
          style={{
            borderColor: hoveredNode 
              ? `${modules.find(m => m.id === hoveredNode)?.color}40` 
              : 'rgba(199, 183, 147, 0.35)',
            boxShadow: hoveredNode 
              ? `0 8px 32px rgba(199, 183, 147, 0.1), 0 0 15px ${modules.find(m => m.id === hoveredNode)?.color}10` 
              : '0 8px 32px rgba(199, 183, 147, 0.15)',
          }}
        >
          <div className="text-[9px] uppercase tracking-[0.25em] text-[#c7b793] font-bold mb-0.5">
            Core Subsystems
          </div>
          <h2 
            className="text-sm font-bold text-gray-800 tracking-wide transition-colors duration-300"
            style={{
              color: hoveredNode 
                ? modules.find(m => m.id === hoveredNode)?.color 
                : '#1f2937',
            }}
          >
            {hoveredNode 
              ? modules.find(m => m.id === hoveredNode)?.name.toUpperCase() 
              : 'SECURE VAULT INTEGRITY OK'}
          </h2>
          <p className="text-xs text-gray-500 mt-1.5 min-h-[34px] leading-relaxed transition-all duration-300 px-2">
            {hoveredNode 
              ? modules.find(m => m.id === hoveredNode)?.description 
              : 'Select or hover over any subsystem node to establish an authorized connection stream.'}
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            {modules.map((m) => (
              <span 
                key={m.id}
                className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: hoveredNode === m.id ? m.color : 'rgba(199, 183, 147, 0.3)',
                  transform: hoveredNode === m.id ? 'scale(1.4)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Node Connection Lines */}
      <svg className="absolute" style={{ width: '400px', height: '400px', left: '50%', top: '50%', marginLeft: '-200px', marginTop: '-200px', zIndex: 5 }}>
        {/* Base connection lines with slow flow */}
        {modules.map((mod) => (
          <g key={`lines-${mod.id}`}>
            {/* Background static line */}
            <line 
              x1="200" y1="200" 
              x2={mod.svgTarget.x} y2={mod.svgTarget.y} 
              stroke="#c7b793" 
              strokeWidth="2" 
              strokeOpacity="0.25" 
            />
            {/* Subtle flow line */}
            <line 
              x1="200" y1="200" 
              x2={mod.svgTarget.x} y2={mod.svgTarget.y} 
              stroke="#c7b793" 
              strokeWidth="2" 
              strokeDasharray="6, 12"
              className="laser-base-flow"
            />
            {/* Glowing fast active line when hovered */}
            <line 
              x1="200" y1="200" 
              x2={mod.svgTarget.x} y2={mod.svgTarget.y} 
              stroke={mod.color} 
              strokeWidth="3.5" 
              strokeDasharray="10, 8"
              strokeLinecap="round"
              className="laser-active-flow"
              style={{
                opacity: hoveredNode === mod.id ? 1 : 0,
                filter: `drop-shadow(0 0 6px ${mod.color})`,
                transition: 'opacity 0.25s ease',
              }}
            />
          </g>
        ))}
        
        {/* Node status dots at static connection points (halfway) */}
        <circle cx="200" cy="125" r="4" fill="#c7b793" className="node-dot-pulse" style={{ animationDelay: '0s' }} />
        <circle cx="275" cy="200" r="4" fill="#c7b793" className="node-dot-pulse" style={{ animationDelay: '0.5s' }} />
        <circle cx="200" cy="275" r="4" fill="#c7b793" className="node-dot-pulse" style={{ animationDelay: '1s' }} />
        <circle cx="125" cy="200" r="4" fill="#c7b793" className="node-dot-pulse" style={{ animationDelay: '1.5s' }} />
      </svg>

      {/* Transparent Hexagonal Frame */}
      <svg className="absolute hexagon-frame" style={{ width: '220px', height: '220px', left: '50%', top: '50%', marginLeft: '-110px', marginTop: '-110px', zIndex: 8 }}>
        <polygon
          points="110,5 205,60 205,160 110,215 15,160 15,60"
          fill="none"
          stroke="#c7b793"
          strokeWidth="3"
          strokeOpacity="0.6"
        />
        {/* Inner hexagon for depth */}
        <polygon
          points="110,20 190,65 190,155 110,200 30,155 30,65"
          fill="none"
          stroke="#c7b793"
          strokeWidth="2"
          strokeOpacity="0.4"
        />
        {/* Corner nodes (static status indicators) */}
        <circle cx="110" cy="5" r="5" fill="#c7b793" fillOpacity="0.75" className="node-dot-pulse" style={{ animationDelay: '0s' }} />
        <circle cx="205" cy="60" r="5" fill="#c7b793" fillOpacity="0.75" className="node-dot-pulse" style={{ animationDelay: '0.3s' }} />
        <circle cx="205" cy="160" r="5" fill="#c7b793" fillOpacity="0.75" className="node-dot-pulse" style={{ animationDelay: '0.6s' }} />
        <circle cx="110" cy="215" r="5" fill="#c7b793" fillOpacity="0.75" className="node-dot-pulse" style={{ animationDelay: '0.9s' }} />
        <circle cx="15" cy="160" r="5" fill="#c7b793" fillOpacity="0.75" className="node-dot-pulse" style={{ animationDelay: '1.2s' }} />
        <circle cx="15" cy="60" r="5" fill="#c7b793" fillOpacity="0.75" className="node-dot-pulse" style={{ animationDelay: '1.5s' }} />
      </svg>

      {/* Main Logo (Central Core) */}
      <div 
        className="flex items-center justify-center relative z-10 transition-transform duration-500 pointer-events-none"
        style={{
          transform: hoveredNode ? 'scale(1.05)' : 'scale(1)',
        }}
      >
        <div className="absolute inset-0 bg-[#c7b793]/10 rounded-full blur-xl scale-125 animate-pulse" />
        <img
          src="/logo3333.png"
          alt="Logo"
          className="w-32 h-32 object-contain relative z-10 drop-shadow-[0_0_15px_rgba(199,183,147,0.35)]"
        />
      </div>

      {/* Static Container for Interactive Nodes */}
      <div className="absolute" style={{ width: '300px', height: '300px', left: '50%', top: '50%', marginLeft: '-150px', marginTop: '-150px' }}>
        {modules.map((mod) => {
          const Icon = mod.icon;
          const isHovered = hoveredNode === mod.id;
          return (
            <div 
              key={mod.id}
              onClick={() => handleNodeClick(mod.path)}
              onMouseEnter={() => setHoveredNode(mod.id)}
              onMouseLeave={() => setHoveredNode(null)}
              className="absolute w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 z-20"
              style={{
                ...mod.style,
                backgroundColor: isHovered ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.75)',
                border: isHovered 
                  ? `2px solid ${mod.color}` 
                  : '2px solid rgba(199, 183, 147, 0.4)',
                boxShadow: isHovered 
                  ? `0 0 20px ${mod.color}40, inset 0 0 10px ${mod.color}15` 
                  : '0 4px 12px rgba(199, 183, 147, 0.1)',
                transform: isHovered ? 'scale(1.18)' : 'scale(1)',
              }}
            >
              <Icon 
                className="w-6 h-6 transition-colors duration-300"
                style={{
                  color: isHovered ? mod.color : '#c7b793',
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
