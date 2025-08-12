'use client';

import Image from 'next/image';
import { ShoppingCart, Star, ChevronRight, Check } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useState, useEffect } from 'react';
import UserInfoPopup, { UserInfo } from './UserInfoPopup';

export interface ProductDetails {
  topNotes?: string[];
  middleNotes?: string[];
  baseNotes?: string[];
  size?: string;
  concentration?: string;
  [key: string]: any;
}

export interface Product {
  _id: string;
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  rating?: number;
  numReviews?: number;
  isFeatured?: boolean;
  details?: ProductDetails;
  createdAt: string;
  updatedAt: string;
}

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const { addToCart, isLoading, userInfo, setUserInfo } = useCart();
  const [showUserInfoPopup, setShowUserInfoPopup] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInCart, setIsInCart] = useState(false);

  // Check if this product is already in the cart
  useEffect(() => {
    if (userInfo) {
      // This would be set based on the actual cart data
      // For now, we'll assume it's not in the cart
      setIsInCart(false);
    }
  }, [userInfo]);

  const handleAddToCartClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    try {
      if (userInfo) {
        // User info exists, add to cart directly
        await addToCart(product._id, 1);
      } else {
        // Show user info popup
        setShowUserInfoPopup(true);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      // Error is already handled by CartContext
    }
  };

  const handleUserInfoSubmit = async (info: UserInfo) => {
    try {
      setIsProcessing(true);
      
      // Set user info and wait for it to be saved
      await setUserInfo(info);
      
      // Add to cart with the product ID
      await addToCart(product._id, 1);
      
      setShowUserInfoPopup(false);
    } catch (error) {
      console.error('Error processing cart:', error);
      // Error is already handled by CartContext
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div 
      className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full flex flex-col cursor-pointer"
      onClick={onClick}
    >
      {/* Product Image */}
      <div className="relative h-48 w-full bg-gray-50">
        <Image
          src={product.images?.[0] || '/placeholder-product.jpg'}
          alt={product.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {product.isFeatured && (
          <div className="absolute top-2 left-2 bg-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
            Featured
          </div>
        )}
      </div>
      
      {/* Product Info */}
      <div className="p-3 flex-1 flex flex-col">
        <div className="flex-1">
          <h3 className="font-medium text-sm sm:text-base text-gray-900 mb-1 line-clamp-1">
            {product.title}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mb-2 line-clamp-2">
            {product.description}
          </p>
          
          {/* Product Details */}
          <div className="space-y-1 text-xs text-gray-600 mt-2">
            <div className="flex items-center">
              <span className="font-medium w-16">Price:</span>
              <span>₦{product.price.toLocaleString()}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium w-16">Rating:</span>
              <div className="flex items-center">
                <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
                <span>{product.rating?.toFixed(1) || 'N/A'}</span>
              </div>
            </div>
            {product.details?.size && (
              <div className="flex items-center">
                <span className="font-medium w-16">Size:</span>
                <span>{product.details.size}</span>
              </div>
            )}
            {product.details?.concentration && (
              <div className="flex items-center">
                <span className="font-medium w-16">Conc:</span>
                <span className="line-clamp-1">{product.details.concentration}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between items-center">
          <div 
            className="text-xs sm:text-sm text-pink-600 hover:text-pink-700 font-medium flex items-center"
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/products/${product.id}`;
            }}
          >
            <span>View Details</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
          <div className="relative">
            <button 
              className="text-white text-xs sm:text-sm px-3 py-1.5 rounded-full bg-gray-400 cursor-not-allowed flex items-center"
              disabled={true}
            >
              <span>Coming Soon</span>
            </button>
            
            <UserInfoPopup
              isOpen={showUserInfoPopup}
              onClose={() => setShowUserInfoPopup(false)}
              onContinue={handleUserInfoSubmit}
              productName={product.title}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
