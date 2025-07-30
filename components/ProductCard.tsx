'use client';

import Image from 'next/image';
import { ShoppingCart, Star, ChevronRight } from 'lucide-react';
import Link from 'next/link';

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
          <button 
            className="bg-pink-600 text-white text-xs sm:text-sm px-3 py-1.5 rounded-full hover:bg-pink-700 transition-colors flex items-center"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              // Handle add to cart
            }}
          >
            <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </div>
  );
}
