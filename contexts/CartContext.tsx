'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CartItem {
  _id: string;
  product: {
    _id: string;
    title: string;
    price: number;
    images: string[];
    specifications?: Record<string, any>;
  };
  quantity: number;
  price: number;
  specifications?: {
    color?: string;
    size?: string;
    bodySize?: string;
    numericSize?: string;
    [key: string]: any;
  };
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
  loadingProducts: Set<string>;
  setUserInfo: (info: UserInfo | null) => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  loadCart: (userInfo: UserInfo) => Promise<void>;
  setCart: React.Dispatch<React.SetStateAction<CartData | null>>;
}
const CartContext = createContext<CartContextType | undefined>(undefined);
export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartData | null>(() => {
    // Initialize with empty cart if none exists
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : { items: [], itemCount: 0, total: 0 };
    }
    return { items: [], itemCount: 0, total: 0 };
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProducts, setLoadingProducts] = useState<Set<string>>(new Set());
  const [userInfo, setUserInfoState] = useState<UserInfo | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cartUserInfo');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  const [hasPreviousCarts, setHasPreviousCarts] = useState(false);
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart && typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart]);

  // Load cart when user info changes
  useEffect(() => {
    // Only load cart if we have user info and we're not already loading
    if (userInfo?.email && userInfo?.phone && !isLoading) {
      const loadUserCart = async () => {
        try {
          await loadCart(userInfo);
        } catch (error) {
          console.error('Failed to load cart:', error);
        }
      };
      loadUserCart();
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

  const loadCart = async (userInfo: UserInfo, forceRefresh: boolean = true) => {
    if (!userInfo?.email || !userInfo?.phone) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        email: userInfo.email,
        phone: userInfo.phone,
        t: forceRefresh ? Date.now().toString() : '0' // Always force refresh with timestamp
      });
      
      // Force a hard refresh by bypassing all caches
      const response = await fetch(`/api/cart?${params}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Requested-With': 'XMLHttpRequest' // Helps identify AJAX requests
        },
        credentials: 'same-origin' // Include credentials if needed
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load cart');
      }
      const data = await response.json();
      // Only update state if we got valid data
      if (data && data.cart) {
        setCart(prevCart => ({
          ...data.cart,
          // Ensure items is always an array
          items: Array.isArray(data.cart.items) ? data.cart.items : []
        }));
        setHasPreviousCarts(data.hasPreviousCarts || false);       
        // Update user info with any additional data from the server
        if (data.user) {
          setUserInfoState(prev => ({
            ...(prev || {}),
            ...data.user
          }));
        }
        
        return data.cart;
      }
      
      return null;
    } catch (err) {
      console.error('Error loading cart:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load cart';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!userInfo) {
      // Redirect to register page with a return URL
      const returnUrl = encodeURIComponent(window.location.pathname);
      window.location.href = `/register?returnTo=${returnUrl}`;
      return Promise.reject('Redirecting to register');
    }

    setLoadingProducts(prev => {
      const newSet = new Set(prev);
      newSet.add(productId);
      return newSet;
    });

    try {
      // First, fetch the product to get its details
      const productResponse = await fetch(`/api/products/${productId}`);
      if (!productResponse.ok) {
        throw new Error('Failed to fetch product details');
      }
      const productData = await productResponse.json();
      const product = productData.data;
      
      if (!product || !product.price) {
        throw new Error('Invalid product data received');
      }

      // Calculate the price to add
      const priceToAdd = product.price * quantity;
      
      // Update the cart with the new item
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'add',
          productId,
          quantity,
          price: product.price,
          userInfo
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add item to cart');
      }

      const data = await response.json();
      
      // Ensure we have a valid cart response
      if (!data.cart || !Array.isArray(data.cart.items)) {
        throw new Error('Invalid cart data received');
      }
      
      // Calculate the total based on all items in the cart
      const calculatedTotal = data.cart.items.reduce((sum: number, item: CartItem) => {
        return sum + (item.quantity * item.price);
      }, 0);
      
      // Update the cart with the calculated total
      const updatedCart = {
        ...data.cart,
        total: parseFloat(calculatedTotal.toFixed(2)) // Ensure we don't have floating point precision issues
      };
      
      setCart(updatedCart);
      return updatedCart;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item to cart');
      throw err;
    } finally {
      setLoadingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    if (!userInfo) {
      throw new Error('User not authenticated');
    }
    
    // Find the cart item to be removed
    const itemToRemove = cart?.items.find(item => item._id === cartItemId);
    if (!itemToRemove) {
      throw new Error('Item not found in cart');
    }

    // Set loading state for this cart item
    setLoadingProducts(prev => new Set(prev).add(cartItemId));

    try {
      // Optimistically update the UI first
      setCart(prevCart => {
        if (!prevCart) return null;
        return {
          ...prevCart,
          items: prevCart.items.filter(item => item._id !== cartItemId),
          itemCount: Math.max(0, prevCart.itemCount - itemToRemove.quantity),
          total: Math.max(0, prevCart.total - (itemToRemove.price * itemToRemove.quantity))
        };
      });

      // Then make the API call
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove',
          productId: cartItemId, // This is actually the cart item ID
          userInfo
        }),
      });
      
      if (!response.ok) {
        // Revert optimistic update if API call fails
        setCart(cart);
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to remove item from cart');
      }
      
      // Get the updated cart from the response
      const data = await response.json();
      setCart(data.cart);
      return data.cart;
    } catch (err) {
      console.error('Error removing from cart:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove item from cart';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      // Clear loading state for this product
      setLoadingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(cartItemId);
        return newSet;
      });
    }
  };

  // Store the timeout ID for debouncing
  const updateTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (!userInfo || !cart) return;
    
    // Find the cart item
    const cartItem = cart.items.find(item => item._id === cartItemId);
    if (!cartItem) return;
    
    // Don't allow negative quantities or same quantity
    if (newQuantity < 1 || cartItem.quantity === newQuantity) return;
    
    // Clear any pending updates for this item
    if (updateTimeoutsRef.current[cartItemId]) {
      clearTimeout(updateTimeoutsRef.current[cartItemId]);
    }

    // Set loading state for this cart item
    setLoadingProducts(prev => new Set(prev).add(cartItemId));

    // Save current cart for potential rollback
    const previousCart = JSON.parse(JSON.stringify(cart));
    
    try {
      // 1. Create updated items array
      const updatedItems = cart.items.map(item => 
        item._id === cartItemId 
          ? { ...item, quantity: newQuantity }
          : item
      );
      
      // 2. Calculate new values
      const newTotal = updatedItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      const newItemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      
      // 3. Create a single updated cart object
      const updatedCart = {
        ...cart,
        items: updatedItems,
        itemCount: newItemCount,
        total: newTotal
      };

      // 4. Update state immediately for instant feedback
      setCart(updatedCart);

      // 5. Debounce the API call to avoid rapid successive requests
      updateTimeoutsRef.current[cartItemId] = setTimeout(async () => {
        try {
          const response = await fetch(`/api/cart/items/${cartItemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: newQuantity })
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to update quantity');
          }
          
          // Get the updated data from server
          const data = await response.json();
          
          // Only update if there's a difference from our optimistic update
          if (data.success && data.cart && 
              (data.cart.total !== newTotal || data.cart.itemCount !== newItemCount)) {
            setCart(prev => ({
              ...prev!,
              total: data.cart.total,
              itemCount: data.cart.itemCount,
              items: prev?.items || []
            }));
          }
        } catch (err) {
          console.error('Error updating cart:', err);
          // Revert to previous cart state on error
          setCart(previousCart);
          const errorMessage = err instanceof Error ? err.message : 'Failed to update cart';
          setError(errorMessage);
        } finally {
          setLoadingProducts(prev => {
            const newSet = new Set(prev);
            newSet.delete(cartItemId);
            return newSet;
          });
        }
      }, 300); // 300ms debounce delay

    } catch (err) {
      console.error('Error in optimistic update:', err);
      setCart(previousCart);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update cart';
      setError(errorMessage);
      throw new Error(errorMessage);
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
        loadingProducts,
        setUserInfo,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        loadCart,
        setCart, // Add setCart to the context value
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
