"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Head from 'next/head'

export default function WelcomePage() {
  const router = useRouter()

  useEffect(() => {
    // Auto-navigate to login after 3.5 seconds (time for animation to complete)
    const timer = setTimeout(() => {
      router.push('/login')
    }, 3500)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] overflow-hidden relative flex flex-col items-center justify-center p-4">
      <Head>
        <title>Welcome</title>
        <meta name="description" content="Welcome to our secure platform" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700;900&display=swap" rel="stylesheet"/>
      </Head>
      
      {/* Logo with bounce animation */}
      <div className="relative z-10 text-center mb-8 animate-float">
        <img 
          src="/logo3333.png" 
          alt="Logo" 
          className="h-64 w-auto mx-auto drop-shadow-[0_5px_15px_rgba(199,183,147,0.4)] hover:drop-shadow-[0_5px_25px_rgba(199,183,147,0.7)] transition-all duration-300"
        />
      </div>

      {/* Gamified Text - Moved to bottom */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <div className="inline-flex flex-wrap justify-center gap-1">
          {['S','O','C','I','A','L',' ','B','U','T',' ','S','E','C','U','R','E'].map((letter, index) => (
            <span 
              key={index} 
              className="letter text-white/90 text-shadow-sm"
              style={{
                animation: `glow 2s ease-in-out ${index * 0.1}s infinite alternate`,
                textShadow: '0 0 5px rgba(199, 183, 147, 0.6)',
                fontSize: '0.8rem',
                lineHeight: '1.2'
              }}
            >
              {letter === ' ' ? '\u00A0' : letter}
            </span>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Poppins:wght@700;900&display=swap');
        
        .font-gamified {
          font-family: 'Poppins', sans-serif;
          font-weight: 500;
          letter-spacing: 0.5px;
          font-size: 0.8rem;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes glow {
          from {
            color: #ffffff;
            text-shadow: 0 0 5px #fff, 0 0 10px #c7b793, 0 0 15px #c7b793, 0 0 20px #c7b793;
          }
          to {
            color: #c7b793;
            text-shadow: 0 0 10px #fff, 0 0 20px #c7b793, 0 0 30px #c7b793, 0 0 40px #c7b793;
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .letter {
          display: inline-block;
          transition: all 0.3s ease;
        }
        
        .letter:hover {
          transform: scale(1.5) rotate(5deg);
          color: #c7b793 !important;
        }
      `}</style>
    </div>
  )
}
