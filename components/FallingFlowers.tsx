'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const COLORS = [
  { bg: 'bg-yellow-300/60', shadow: 'shadow-yellow-300/30' }, // Gold
  { bg: 'bg-pink-300/60', shadow: 'shadow-pink-300/30' },    // Pink
  { bg: 'bg-blue-300/60', shadow: 'shadow-blue-300/30' }     // Blue
];

const FallingFlowers = ({ count = 15 }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {Array.from({ length: count }).map((_, i) => {
        const size = Math.random() * 24 + 8; // 8px to 32px
        const duration = Math.random() * 15 + 15; // 15s to 30s
        const delay = Math.random() * 10;
        const startX = Math.random() * 100;
        const endX = startX + (Math.random() * 40 - 20);
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        
        return (
          <motion.div
            key={`flower-${i}`}
            className={`absolute rounded-full ${color.bg} ${color.shadow}`}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${startX}%`,
              top: '-50px',
              filter: 'blur(0.5px)',
              rotate: Math.random() * 360,
            }}
            initial={{
              y: -100,
              x: 0,
              opacity: 0,
              scale: 0.5,
            }}
            animate={{
              y: '100vh',
              x: `${endX - startX}%`,
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
    </div>
  );
};

export default FallingFlowers;
