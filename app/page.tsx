"use client"
import { ShoppingCart, ArrowRight } from "lucide-react"
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion"
import dynamic from 'next/dynamic'
import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'

// Dynamically import the PerfumeStack component with no SSR to avoid hydration issues
const PerfumeStack = dynamic(() => import('@/components/PerfumeStack'), {
  ssr: false,
  loading: () => (
    <div className="w-[400px] h-[600px] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
})

// Removed individual FlowerPetal component as we've moved the logic inline for better performance

export default function LuxeBeautyHomepage() {
  const [isMounted, setIsMounted] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  useEffect(() => {
    setIsMounted(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);
  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-white via-blue-50 to-blue-100">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 absolute top-0 left-0 right-0 z-50">
        <div className="flex items-center gap-3">
        
          <span className="text-white text-xl font-semibold bg-gradient-to-r from-pink-100 to-pink-400 via-white-100 bg-clip-text text-pink-400">Finesse & Co..</span>
        </div>
        {/* <Button className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-full ">
          <ShoppingCart className="w-4 h-4 mr-2" />
          Cart
        </Button> */}
        <div className="relative w-16 ">
                    <button
                        className="w-full py-3 px-4 text-blue-900 font-semibold rounded-full bg-gradient-to-r from-amber-300 via-amber-100 to-amber-300 hover:from-amber-200 hover:to-amber-100 transition-all duration-300 border-2 border-amber-200/50 relative z-10 shadow-lg"
                    >
                        <ShoppingCart className="w-7 h-7" />
          
                    </button>
                    <div className="absolute -bottom-2 left-0 right-0 h-[calc(80%-1px)] bg-amber-200/30 rounded-full z-0"></div>
                </div>
      </header>

      {/* Hero Section with Dazzling Background */}
      <section className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden pt-16">
        {/* Animated Gradient Background */}
        <motion.div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(45deg, #ffffff, #e0f2fe, #bae6fd, #7dd3fc, #38bdf8, #0ea5e9, #0284c7)',
            backgroundSize: '400% 400%',
            filter: 'blur(60px)',
            opacity: 0.7,
          }}
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 10,
            ease: 'linear',
            repeat: Infinity,
          }}
        />
        
        {/* Title with Glossy Effect */}
        <motion.div 
          className="relative z-10 text-center mb-12 group"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1 
            className="text-5xl md:text-7xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-900 via-blue-600 to-pink-400"
            style={{
              backgroundSize: '200% auto',
              textShadow: '0 0 20px rgba(255,255,255,0.3)',
              WebkitBackgroundClip: 'text',
            }}
            animate={{
              backgroundPosition: ['0% center', '200% center'],
            }}
            transition={{
              duration: 8,
              ease: 'linear',
              repeat: Infinity,
            }}
          >
          Finesse & Co..
          </motion.h1>
          <motion.p 
            className="text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-800 to-pink-400"
            style={{
              textShadow: '0 0 15px rgba(255,255,255,0.2)',
              WebkitBackgroundClip: 'text',
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              textShadow: ['0 0 15px rgba(255,255,255,0.2)', '0 0 30px rgba(255,255,255,0.4)', '0 0 15px rgba(255,255,255,0.2)']
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              repeatType: 'reverse'
            }}
          >
            Experience the essence of luxury
          </motion.p>
          
          {/* Glossy overlay effect */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none"
            style={{
              transform: 'rotate(-5deg) scale(1.5)',
              maskImage: 'linear-gradient(75deg, transparent, white, transparent)',
              WebkitMaskImage: 'linear-gradient(75deg, transparent, white, transparent)',
            }}
            transition={{ duration: 0.5 }}
          />
        </motion.div>

        {/* 3D Perfume Stack */}
        <div className="relative z-10">
          <PerfumeStack />
        </div>

         <Link href="/collection">
          <motion.button 
            className="px-8 py-4 bg-gradient-to-r from-amber-300 via-transparent to-amber-300 text-white rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center group relative overflow-hidden"
            whileHover={{ 
              scale: 1.05,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="relative z-10 flex items-center">
              Discover the Collection
              <motion.span 
                className="ml-2 inline-block"
                initial={{ x: 0 }}
                animate={{ x: [0, 4, 0] }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 1.5,
                  ease: 'easeInOut'
                }}
              >
                <ArrowRight className="w-5 h-5" />
              </motion.span>
            </span>
            <motion.span 
              className="absolute inset-0 bg-gradient-to-r from-pink-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              initial={{ x: '-100%' }}
              whileHover={{ x: '0%' }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </motion.button>
        </Link>

        {/* Abundant Falling Petals */}
        {isMounted && [...Array(150)].map((_, i) => {
          const size = Math.random() * 30 + 10; // Larger size range
          const duration = Math.random() * 15 + 15; // Slower falling
          const delay = Math.random() * 10; // Staggered start
          const startX = Math.random() * window.innerWidth;
          const endX = startX + (Math.random() * 400 - 200); // More horizontal movement
          
          return (
            <motion.div
              key={`flower-${i}`}
              className={`absolute rounded-full ${Math.random() > 0.5 ? 'bg-pink-200/60' : 'bg-blue-200/60'}`}
              style={{
                width: `${size}px`,
                height: `${size}px`,
                filter: 'blur(0.5px)',
                rotate: Math.random() * 360,
                left: startX,
                top: -50,
              }}
              initial={{
                y: -100,
                x: startX,
                opacity: 0,
                scale: 0.5,
              }}
              animate={{
                y: window.innerHeight + 100,
                x: endX,
                opacity: [0, 0.8, 0.8, 0],
                scale: [0.5, 1, 0.8, 0],
                rotate: 360 + (Math.random() * 360),
              }}
              transition={{
                duration: duration,
                delay: delay,
                repeat: Infinity,
                repeatDelay: Math.random() * 5,
                ease: 'linear',
              }}
            />
          );
        })}
        
        {/* Subtle floating particles - increased quantity */}
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className={`absolute rounded-full ${Math.random() > 0.5 ? 'bg-pink-200/40' : 'bg-blue-200/40'}`}
            style={{
              width: Math.random() * 6 + 2,
              height: Math.random() * 6 + 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, Math.random() * 200 - 100],
              x: [0, Math.random() * 200 - 100],
              opacity: [0.1, 0.6, 0.1],
            }}
            transition={{
              duration: Math.random() * 15 + 15,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
              delay: Math.random() * 5,
            }}
          />
        ))}
      </section>
    </div>
  )
}
