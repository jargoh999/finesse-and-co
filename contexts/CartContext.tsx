'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CartItem {
  _id: string;
  product: {
    _id: string;
    title: string;
    price: number;
    images: string[];
  };
  quantity: number;
  price: number;
}

export interface CartData {
  _id: string;
  items: CartItem[];
  itemCount: number;
  total: number;
  user?: {
    name?: string;
    email: string;
    phone: string;
  };
}

export interface UserInfo {
  email: string;
  phone: string;
  name?: string;
}

interface CartContextType {
  cart: CartData | null;
  isLoading: boolean;
  error: string | null;
  userInfo: UserInfo | null;
  hasPreviousCarts: boolean;
  setUserInfo: (info: UserInfo | null) => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  loadCart: (userInfo: UserInfo) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfoState] = useState<UserInfo | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cartUserInfo');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  const [hasPreviousCarts, setHasPreviousCarts] = useState(false);

  // Load cart when user info changes
  useEffect(() => {
    if (userInfo) {
      loadCart(userInfo);
    }
  }, [userInfo?.email, userInfo?.phone]);

  const setUserInfo = async (info: UserInfo | null) => {
    if (info) {
      localStorage.setItem('cartUserInfo', JSON.stringify(info));
      setUserInfoState(info);
    } else {
      localStorage.removeItem('cartUserInfo');
      setUserInfoState(null);
      setCart(null);
    }
  };

  const loadCart = async (userInfo: UserInfo) => {
    if (!userInfo?.email || !userInfo?.phone) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        email: userInfo.email,
        phone: userInfo.phone
      });
      
      const response = await fetch(`/api/cart?${params}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load cart');
      }
      
      setCart(data.cart);
      setHasPreviousCarts(data.hasPreviousCarts);
      
      // Update user info with any additional data from the server
      if (data.user) {
        setUserInfoState(prev => ({
          ...prev,
          ...data.user
        }));
      }
    } catch (err) {
      console.error('Error loading cart:', err);
      setError(err instanceof Error ? err.message : 'Failed to load cart');
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!userInfo) {
      throw new Error('User information is required');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'add',
          productId,
          quantity,
          userInfo
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add item to cart');
      }
      
      setCart(data.cart);
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError(err instanceof Error ? err.message : 'Failed to add item to cart');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!userInfo) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'remove',
          productId,
          userInfo
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove item from cart');
      }
      
      setCart(data.cart);
    } catch (err) {
      console.error('Error removing from cart:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove item from cart');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!userInfo) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          productId,
          quantity,
          userInfo
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update cart');
      }
      
      setCart(data.cart);
    } catch (err) {
      console.error('Error updating cart:', err);
      setError(err instanceof Error ? err.message : 'Failed to update cart');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    if (!userInfo) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'clear',
          userInfo
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to clear cart');
      }
      
      setCart(null);
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear cart');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        error,
        userInfo,
        hasPreviousCarts,
        setUserInfo,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        loadCart,
      }}
    >
      {children}
      <AnimatePresence>
        {!isLoading && error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center"
          >
            <span className="mr-2">{error}</span>
            <button onClick={() => setError(null)} className="text-white">
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
