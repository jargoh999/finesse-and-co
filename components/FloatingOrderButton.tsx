'use client';

import { useCart } from '@/contexts/CartContext';
import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function FloatingOrderButton() {
  const { cart } = useCart();
  const [isMounted, setIsMounted] = useState(false);
  
  // Calculate item count safely
  const itemCount = cart?.items?.reduce((total, item) => {
    return total + (item.quantity || 0);
  }, 0) || 0;

  // Set mounted state after initial render
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render anything on server-side or if cart is empty
  if (!isMounted || itemCount === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <div className="relative group">
        <Link 
          href="/orders"
          className="flex items-center justify-center h-14 w-14 md:h-12 md:w-12 rounded-full bg-pink-600 hover:bg-pink-700 text-white shadow-lg transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-pink-500 focus:ring-opacity-50"
          aria-label={`View your orders`}
        >
          <div className="relative">
            <ShoppingBag className="h-6 w-6" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-white text-pink-600 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border border-pink-600">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </div>
        </Link>
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
          View your orders
        </div>
      <style jsx global>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce {
          animation: bounce 2s infinite;
        }
        @media (max-width: 768px) {
          .animate-bounce {
            animation: bounce 1.5s infinite;
          }
        }
      `}</style>
      </div>
    </div>
  );
}
