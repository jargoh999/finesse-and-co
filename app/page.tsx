"use client"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, useMotionValue, useTransform } from "framer-motion"
import dynamic from 'next/dynamic'
import { useRef, useEffect, useState } from 'react'

// Dynamically import the PerfumeStack component with no SSR to avoid hydration issues
const PerfumeStack = dynamic(() => import('@/components/PerfumeStack'), {
  ssr: false,
  loading: () => (
    <div className="w-[400px] h-[600px] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
})

const FlowerPetal = ({ style, delay = 0 }: { style: any; delay: number }) => {
  const size = Math.random() * 20 + 10;
  const duration = Math.random() * 15 + 10;
  
  return (
    <motion.div
      className="absolute rounded-full bg-gradient-to-br from-pink-100/80 to-rose-100/80 backdrop-blur-sm"
      style={{
        ...style,
        width: `${size}px`,
        height: `${size}px`,
        filter: 'blur(1px)',
        rotate: Math.random() * 360,
      }}
      initial={{
        y: -100,
        x: Math.random() * window.innerWidth,
        opacity: 0,
        scale: 0,
      }}
      animate={{
        y: window.innerHeight + 100,
        x: style.x + (Math.random() * 200 - 100),
        opacity: [0, 0.8, 0.8, 0],
        scale: [0, 1, 0.5, 0],
        rotate: 360 + (Math.random() * 180 - 90),
      }}
      transition={{
        duration: duration,
        delay: delay,
        repeat: Infinity,
        repeatType: 'loop',
        ease: 'linear',
      }}
    />
  );
};

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
    <div className="min-h-screen overflow-hidden" style={{ backgroundColor: "#210a07" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 absolute top-0 left-0 right-0 z-50">
        <div className="flex items-center gap-3">
        
          <span className="text-white text-xl font-semibold">Finesse & Co..</span>
        </div>
        {/* <Button className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-full ">
          <ShoppingCart className="w-4 h-4 mr-2" />
          Cart
        </Button> */}
         <div className="relative w-16 ">
                    <button
                        className="w-full py-3 px-4 text-white font-semibold rounded-full bg-[#ed5386] hover:bg-[#ed5386] transition-colors border-2 border-[#c2c2d1] relative z-10"
                    >
                        <ShoppingCart className="w-7 h-7" />
          
                    </button>
                    <div className="absolute -bottom-2 left-0 right-0 h-[calc(80%-1px)] bg-[#ffb3b3] rounded-full z-0"></div>
                </div>
      </header>

      {/* Hero Section with Dazzling Background */}
      <section className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden pt-16">
        {/* Animated Gradient Background */}
        <motion.div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(45deg, #ff6b6b, #ff8e8e, #ffb3b3, #ffd8d8, #ffb3b3, #ff8e8e, #ff6b6b)',
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
            className="text-5xl md:text-7xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-300 via-white to-amber-200"
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
            className="text-xl bg-clip-text text-transparent bg-gradient-to-r from-pink-200 to-amber-100"
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

        {/* Call to Action */}
        <motion.div 
          className="relative z-10 mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <Button 
            className="bg-gradient-to-r from-pink-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 text-white px-8 py-6 text-lg rounded-full shadow-lg transform transition-all duration-300 hover:scale-105"
            size="lg"
          >
            Discover the Collection
          </Button>
        </motion.div>

        {/* Animated Flower Petals */}
        {isMounted && [...Array(25)].map((_, i) => (
          <FlowerPetal
            key={`flower-${i}`}
            style={{
              x: Math.random() * window.innerWidth,
              y: -50,
            }}
            delay={Math.random() * 5}
          />
        ))}
        
        {/* Subtle floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/20"
            style={{
              width: Math.random() * 8 + 2,
              height: Math.random() * 8 + 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, Math.random() * 100 - 50],
              x: [0, Math.random() * 100 - 50],
              opacity: [0.1, 0.6, 0.1],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }}
          />
        ))}
      </section>
    </div>
  )
}
