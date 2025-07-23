'use client';

import { motion, useMotionValue, AnimatePresence, useTransform, Variants } from "framer-motion";
import { useState, useRef } from "react";
import Image from "next/image";

interface PerfumeProps {
  id: number;
  src: string;
  alt: string;
  initial: {
    x: number;
    y: number;
    rotate: number;
    z: number;
  };
  hover: {
    x: number;
    y: number;
    rotate: number;
    z: number;
  };
}

const PerfumeStack = () => {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    rotateX.set((y - centerY) / 20);
    rotateY.set((centerX - x) / 20);
  };
  
  const resetRotation = () => {
    rotateX.set(0);
    rotateY.set(0);
  };
  
  const perfumes: PerfumeProps[] = [
    { 
      id: 1, 
      src: "/goldea.png", 
      alt: "Goldea Perfume",
      initial: { x: -20, y: -30, rotate: -5, z: 0 },
      hover: { x: -100, y: -50, rotate: -15, z: 50 }
    },
    { 
      id: 2, 
      src: "/gucci.png", 
      alt: "Gucci Perfume",
      initial: { x: 0, y: 0, rotate: 0, z: 20 },
      hover: { x: 0, y: -100, rotate: 0, z: 100 }
    },
    { 
      id: 3, 
      src: "/glaciar.png", 
      alt: "Glaciar Perfume",
      initial: { x: 20, y: 30, rotate: 5, z: 40 },
      hover: { x: 100, y: -50, rotate: 15, z: 50 }
    },
  ];

  // Create a function to handle animation variants
  const getVariants = (perfume: PerfumeProps, index: number): Variants => ({
    initial: {
      x: perfume.initial.x,
      y: perfume.initial.y,
      rotate: perfume.initial.rotate,
      z: perfume.initial.z,
      scale: 1,
      transition: { 
        type: 'spring' as const,
        stiffness: 100,
        damping: 15,
        mass: 0.5
      }
    },
    hover: {
      x: perfume.hover.x,
      y: perfume.hover.y,
      rotate: [perfume.hover.rotate, perfume.hover.rotate + 5, perfume.hover.rotate],
      z: perfume.hover.z,
      scale: 1.05,
      transition: { 
        type: 'spring' as const, 
        stiffness: 200,
        damping: 15,
        mass: 0.8,
        rotate: {
          repeat: Infinity,
          duration: 3,
          ease: 'easeInOut'
        }
      }
    }
  });

  return (
    <div 
      ref={containerRef}
      className="relative w-[400px] h-[600px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        resetRotation();
      }}
      onMouseMove={handleMouseMove}
    >
      <AnimatePresence>
        {perfumes.map((perfume, index) => {
          const variants = getVariants(perfume, index);
          return (
            <motion.div
              key={perfume.id}
              className="absolute inset-0 flex items-center justify-center"
              initial="initial"
              animate={isHovered ? "hover" : "initial"}
              variants={variants}
              style={{
                perspective: '1000px',
                transformStyle: 'preserve-3d',
                zIndex: isHovered ? perfumes.length - index : index,
                rotateX: isHovered ? rotateX : 0,
                rotateY: isHovered ? rotateY : 0,
              }}
            >
              <motion.div 
                className="relative w-[300px] h-[450px] flex items-center justify-center group"
                whileHover={!isHovered ? { 
                  y: -10,
                  transition: { 
                    y: { 
                      repeat: Infinity, 
                      repeatType: 'reverse', 
                      duration: 2 + (index * 0.5),
                      ease: 'easeInOut'
                    }
                  }
                } : {}}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-amber-500/10 rounded-3xl border-2 border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.3)] backdrop-blur-sm transition-all duration-300 group-hover:border-pink-400/80 group-hover:shadow-[0_0_30px_rgba(255,182,193,0.8)]" />
                <div className="relative z-10 w-full h-full overflow-hidden rounded-2xl">
                  <Image
                    src={perfume.src}
                    alt={perfume.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                    priority
                  />
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      
      {/* Glow effect */}
      <motion.div 
        className="absolute inset-0 rounded-3xl pointer-events-none"
        initial={{ opacity: 0.5 }}
        animate={{
          background: [
            'radial-gradient(circle at 30% 30%, rgba(255, 192, 203, 0.2), transparent 50%)',
            'radial-gradient(circle at 70% 70%, rgba(255, 215, 0, 0.2), transparent 50%)',
            'radial-gradient(circle at 30% 70%, rgba(255, 192, 203, 0.2), transparent 50%)',
            'radial-gradient(circle at 30% 30%, rgba(255, 192, 203, 0.2), transparent 50%)',
          ],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: 'reverse' as const,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
};

export default PerfumeStack;
