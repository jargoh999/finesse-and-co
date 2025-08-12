'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useEffect, useRef, useState } from 'react';

interface FloatingCartButtonProps {
  onClick?: () => void;
  className?: string;
}

export default function FloatingCartButton({ onClick, className = '' }: FloatingCartButtonProps) {
  const { cart } = useCart();
  const [isAnimating, setIsAnimating] = useState(false);
  const prevCountRef = useRef(cart?.items.length || 0);

  useEffect(() => {
    // Only trigger animation when count increases
    if (cart?.items.length > prevCountRef.current) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = cart?.items.length || 0;
  }, [cart]);

  return (
    <div className={`relative ${className}`}>
      <motion.button
        onClick={onClick}
        className="w-full py-3 px-4 text-blue-900 font-semibold rounded-full bg-gradient-to-r from-amber-300 via-amber-100 to-amber-300 hover:from-amber-200 hover:to-amber-100 transition-all duration-300 border-2 border-amber-200/50 relative z-10 shadow-lg flex items-center justify-center"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ShoppingCart className="w-5 h-5" />
        <AnimatePresence>
          {cart?.items.length > 0 && (
            <motion.span
              key={cart?.items.length}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ 
                scale: isAnimating ? [1, 1.5, 1] : 1,
                opacity: 1 
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ 
                duration: 0.5,
                type: 'spring',
                stiffness: 500,
                damping: 15
              }}
              className="absolute -top-2 -right-2 bg-pink-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
            >
              {itemCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
      <div className="absolute -bottom-2 left-0 right-0 h-[calc(80%-1px)] bg-amber-200/30 rounded-full z-0"></div>
    </div>
  );
}
