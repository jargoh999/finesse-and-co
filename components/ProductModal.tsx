'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, Star, Heart, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface ProductDetails {
  topNotes: string[];
  middleNotes: string[];
  baseNotes: string[];
  size: string;
  concentration: string;
}

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  rating: number;
  image: string;
  details: ProductDetails;
}

export default function ProductModal({ 
  product, 
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
}: { 
  product: Product | null; 
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}) {
  const [currentImage, setCurrentImage] = useState(0);
  const images = [product?.image, '/glaciar.png', '/gucci.png'];

  if (!product) return null;

  return (
    <div className="flex items-start justify-center p-4 overflow-y-auto" style={{ alignItems: 'center' }}>
      <motion.div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <AnimatePresence>
        <motion.div 
          className="relative bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto mx-auto my-auto"
          style={{
            position: 'relative',
            margin: 'auto',
            top: 0,
            transform: 'none',
            WebkitTransform: 'none',
            msTransform: 'none'
          }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ 
            type: 'spring', 
            damping: 25,
            stiffness: 300
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm rounded-full p-2 z-10 hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>

          <div className="grid md:grid-cols-2 gap-8 p-6">
            {/* Product Images */}
            <div className="relative h-96 rounded-xl overflow-hidden bg-gray-50">
              <Image
                src={images[currentImage] || product.image}
                alt={product.title}
                fill
                className="object-contain p-8"
              />
              
              {/* Navigation Arrows */}
              {hasPrev && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onPrev(); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors"
                  aria-label="Previous product"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>
              )}
              
              {hasNext && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onNext(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors"
                  aria-label="Next product"
                >
                  <ChevronRight className="w-6 h-6 text-gray-700" />
                </button>
              )}
              
              {/* Image Thumbnails */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImage(index);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      currentImage === index ? 'bg-blue-500 w-6' : 'bg-gray-300'
                    }`}
                    aria-label={`View image ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Product Details */}
            <div className="py-4 px-2 sm:px-4">
              <style jsx global>{`
                .product-details * {
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  line-height: 1.5;
                }
                .product-details h2, .product-details h4 {
                  font-weight: 600;
                  color: #111827;
                }
                .product-details p {
                  color: #4B5563;
                }
              `}</style>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{product.title}</h2>
                  <p className="text-gray-500">{product.details.concentration} • {product.details.size}</p>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full">
                  <Star className="w-5 h-5 text-amber-400 fill-current" />
                  <span className="font-medium text-amber-800">{product.rating}</span>
                </div>
              </div>

              <p className="text-gray-700 mb-6">{product.description}</p>
              
              <div className="space-y-4 mb-8">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Top Notes</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.details.topNotes.map((note, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                        {note}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Middle Notes</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.details.middleNotes.map((note, i) => (
                      <span key={i} className="px-3 py-1 bg-pink-50 text-pink-700 rounded-full text-sm">
                        {note}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Base Notes</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.details.baseNotes.map((note, i) => (
                      <span key={i} className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm">
                        {note}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                <div>
                  <span className="text-sm text-gray-500">Price</span>
                  <p className="text-2xl font-bold text-gray-900">${product.price.toFixed(2)}</p>
                </div>
                
                <div className="flex gap-3">
                  <button className="p-3 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors">
                    <Heart className="w-5 h-5 text-gray-700" />
                  </button>
                  <button className="p-3 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors">
                    <Share2 className="w-5 h-5 text-gray-700" />
                  </button>
                  <button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-blue-500 text-white rounded-full font-medium hover:opacity-90 transition-opacity">
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
