'use client';

import Image from 'next/image';
import { ShoppingCart, Star, ChevronRight, Check, Loader2, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface UserInfo {
  name: string;
  email: string;
  phone: string;
}

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

const COLORS = [
  { value: 'red', label: 'Red' },
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
];

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const { cart, addToCart, loadingProducts, userInfo, setUserInfo } = useCart();
  const router = useRouter();
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
  const [isInCart, setIsInCart] = useState(false);
  const isProcessing = loadingProducts.has(product._id);

  // Check if this product is already in the cart
  useEffect(() => {
    if (userInfo && cart?.items) {
      const inCart = cart.items.some(item => item.product._id === product._id);
      setIsInCart(inCart);
    } else {
      setIsInCart(false);
    }
  }, [userInfo, cart]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isProcessing) return; // Prevent multiple clicks

    if (!userInfo) {
      // Redirect to registration with product ID for adding after login
      const returnUrl = encodeURIComponent('/categories');
      router.push(`/register?productId=${product._id}&redirect=${returnUrl}`);
      return;
    }

    if (isInCart) {
      router.push('/cart');
      return;
    }

    try {
      // Show loading state
      const updatedCart = await addToCart(product._id, 1);

      // Only update UI state if the cart was updated successfully
      if (updatedCart) {
        toast.success('Added to cart');
        setIsInCart(true);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  const handleUserInfoSubmit = async (info: UserInfo) => {
    try {
      // Set user info and wait for it to be saved
      await setUserInfo(info);

      // Add to cart with the product ID
      await addToCart(product._id, 1);
    } catch (error) {
      console.error('Error processing cart:', error);
      // Error is already handled by CartContext
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on the View Details link
    if ((e.target as HTMLElement).closest('a, button')) {
      return;
    }
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full flex flex-col cursor-pointer"
      onClick={handleCardClick}
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
          <div className="relative z-10">
            <Link
              href={`/products/${product._id || product.id}`}
              className="text-xs sm:text-sm text-pink-600 hover:text-pink-700 font-medium flex items-center relative z-20"
              onClick={(e) => {
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
              }}
            >
              <span>View Details</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="relative">
            {isInCart ? (
              <button
                onClick={handleAddToCart}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors bg-gradient-to-r from-amber-300 via-amber-100 to-amber-300 hover:from-amber-200 hover:to-amber-100 text-blue-900 border-2 border-amber-200/50"
              >
                <ShoppingBag className="w-4 h-4" />
                View in Cart
              </button>
            ) : (
              <motion.button
                onClick={handleAddToCart}
                disabled={isProcessing}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  y: [0, -5, 0],
                  transition: {
                    duration: 2,
                    repeat: Infinity,
                    repeatType: 'loop',
                    ease: 'easeInOut'
                  }
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
