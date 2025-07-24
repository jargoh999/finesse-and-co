'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';
import { ShoppingCart, Star, Heart, Share2 } from 'lucide-react';

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  rating: number;
  image: string;
}

export default function ProductCard({ 
  product,
  onClick 
}: { 
  product: Product; 
  onClick: () => void 
}) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      className="product-card glass-effect p-4 rounded-2xl overflow-hidden relative"
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -10, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="relative h-64 w-full mb-4 rounded-xl overflow-hidden">
        <Image
          src={product.image}
          alt={product.title}
          fill
          className="object-cover transition-transform duration-500 hover:scale-105"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <div className="text-white">
            <h3 className="text-xl font-bold">{product.title}</h3>
            <p className="text-sm opacity-90">${product.price.toFixed(2)}</p>
          </div>
        </div>
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
          <Star className="w-4 h-4 text-amber-400 fill-current" />
          <span className="text-xs font-medium">{product.rating}</span>
        </div>
      </div>
      <div className="p-2">
        <h3 className="font-semibold text-gray-800">{product.title}</h3>
        <p className="text-sm text-gray-600 mt-1">{product.description}</p>
        <div className="mt-3 flex justify-between items-center">
          <span className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</span>
          <button 
            className="p-2 rounded-full bg-gradient-to-r from-pink-500 to-blue-500 text-white"
            onClick={(e) => {
              e.stopPropagation();
              // Add to cart logic here
            }}
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="glossy-overlay" />
    </motion.div>
  );
}
