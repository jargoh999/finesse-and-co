"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart, type CartData, type CartItem, type UserInfo } from '@/contexts/CartContext';
import Image from 'next/image';
import { Trash2, ArrowLeft, ShoppingBag, Plus, Minus, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Inter } from 'next/font/google';

// Create a wrapper component to handle Suspense
function CartPageContent() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
          <p className="text-gray-600">Loading your cart...</p>
        </div>
      </div>
    }>
      <CartPageInner />
    </Suspense>
  );
}

export default CartPageContent;

// Initialize Inter font with specific weights
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// Available color options
const COLORS = [
  { name: 'Red', value: '#EF4444' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Black', value: '#111827' },
  { name: 'White', value: '#F3F4F6' },
];

// Track loading states for each product
interface LoadingStates {
  [productId: string]: boolean;
}

// Extend the CartData interface to ensure all required properties are available
interface SafeCartData extends Omit<CartData, 'items' | 'total'> {
  items: CartItem[];
  total: number;
}

function CartPageInner() {
  // All hooks must be called unconditionally at the top level
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get cart context
  const {
    cart,
    updateQuantity,
    removeFromCart,
    addToCart,
    userInfo,
    isLoading: isCartLoading,
    error: cartError,
    loadCart
  } = useCart();

  // Local state - all hooks must be called in the same order on every render
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [safeCart, setSafeCart] = useState<SafeCartData>({
    _id: '',
    items: [],
    itemCount: 0,
    total: 0
  });
  
  const redirect = searchParams?.get('redirect') || '/categories';
  const isAuthenticated = !!userInfo;

  // Set client-side flag on mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load cart when user info is available
  useEffect(() => {
    if (isClient && userInfo) {
      const loadCartData = async () => {
        try {
          await loadCart(userInfo);
        } catch (err) {
          console.error('Error loading cart:', err);
          setError('Failed to load cart. Please try again.');
        } finally {
          setIsLoading(false);
        }
      };
      
      loadCartData();
    } else if (isClient && !userInfo) {
      // If no user info, redirect to register
      router.push(`/register?redirect=/cart`);
    } else {
      setIsLoading(false);
    }
  }, [isClient, userInfo]);

  // Update safeCart when cart data is available
  useEffect(() => {
    if (cart) {
      setSafeCart({
        _id: cart._id || '',
        items: Array.isArray(cart.items) ? cart.items : [],
        itemCount: cart.itemCount || 0,
        total: cart.total || 0
      });
      
      // Update colors when cart items change
      if (cart.items) {
        const initialColors = { ...selectedColors };
        let colorsUpdated = false;

        cart.items.forEach((item: CartItem) => {
          if (item?.product?._id && !initialColors[item.product._id]) {
            initialColors[item.product._id] = COLORS[0].value;
            colorsUpdated = true;
          }
        });

        if (colorsUpdated) {
          setSelectedColors(initialColors);
        }
      }
    }
  }, [cart]);

  // Show loading state while checking authentication or loading cart
  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex items-center gap-2 bg-pink-600 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-6 w-6" />
          </motion.span>
          <span>Loading Your Cart...</span>
        </motion.div>
      </div>
    );
  }
  
  // Don't render anything if not authenticated (redirect will happen in useEffect)
  if (!isAuthenticated) {
    return null;
  }

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (!cart) return;

    try {
      setLoadingStates(prev => ({ ...prev, [itemId]: true }));

      // Use the context's updateQuantity which handles both UI and server updates
      await updateQuantity(itemId, newQuantity);

      // The cart context will handle the UI updates and error handling
    } catch (error) {
      console.error('Failed to update quantity:', error);
      toast.error('Failed to update quantity. Please try again.');

      // Use the context's loadCart if available, otherwise refresh the page
      if (loadCart && userInfo) {
        await loadCart(userInfo);
      } else if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } finally {
      setLoadingStates(prev => ({
        ...prev,
        [itemId]: false
      }));
    }
  };

  const incrementQuantity = (itemId: string, currentQty: number) => {
    handleQuantityChange(itemId, currentQty + 1);
  };

  const decrementQuantity = (itemId: string, currentQty: number) => {
    if (currentQty > 1) {
      handleQuantityChange(itemId, currentQty - 1);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    if (!cart) return;

    const previousCart = { ...cart }; // Create a copy of the current cart state
    if (!confirm('Are you sure you want to remove this item from your cart?')) {
      return;
    }

    try {
      setLoadingStates(prev => ({ ...prev, [productId]: true }));

      // Optimistically update the UI
      const currentItem = cart?.items.find((item: CartItem) => item._id === productId);

      if (previousCart?.items) {
        previousCart.items = previousCart.items.filter((item: CartItem) => item._id !== productId);
      }

      // Update server
      await removeFromCart(productId);

      toast.success('Item removed from cart', {
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              if (currentItem) {
                await addToCart(currentItem.product._id, currentItem.quantity);
                toast.success('Item added back to cart');
              }
            } catch (error) {
              console.error('Error adding item back to cart:', error);
              toast.error('Failed to add item back to cart');
              // Refresh cart to sync with server
              if (userInfo) {
                // @ts-ignore - loadCart is available in the context
                loadCart(userInfo);
              }
            }
          },
        },
      });

      // Update the URL to remove any product-specific parameters
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.get('productId') === productId) {
        currentUrl.searchParams.delete('productId');
        window.history.replaceState({}, '', currentUrl.toString());
      }
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item from cart');
      // Revert to previous cart state on error
      if (previousCart) {
        // @ts-ignore - setCart is available in the context
        setCart(previousCart);
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, [productId]: false }));
    }
  };

  if (!safeCart?.items || safeCart.items.length === 0 || cartError) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {cartError ? 'Error loading cart' : 'Your cart is empty'}
        </h1>
        <p className="text-gray-600 mb-6">
          {cartError ? 'There was an error loading your cart. Please try again.' : "Looks like you haven't added any items yet."}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={redirect}>
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {redirect === '/collection' ? 'Continue Shopping' : 'Back to Store'}
            </Button>
          </Link>
          {cartError && (
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(redirect);
    }
  };

  return (
    <div className={`container mx-auto px-4 py-8 ${inter.variable} font-sans`}>
      <Button
        variant="ghost"
        onClick={handleGoBack}
        className="mb-6 flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors pl-0"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Continue Shopping
      </Button>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Your Shopping Cart</h1>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {safeCart.items.map((item, index) => (
            <div key={`${item.product._id}-${index}`} className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg">
              <div className="w-full sm:w-32 h-32 bg-gray-100 rounded-md overflow-hidden">
                <Image
                  src={item.product.images?.[0] || '/placeholder-product.jpg'}
                  alt={item.product.title}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{item.product.title}</h3>
                <p className="text-gray-600 text-sm mt-1">₦{item.product.price?.toLocaleString()}</p>

                <div className="mt-3 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <div className="flex flex-wrap gap-2">
                      {COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          className={`w-6 h-6 rounded-full border-2 ${selectedColors[item.product._id] === color.value
                            ? 'border-pink-500 ring-2 ring-offset-1 ring-pink-200'
                            : 'border-gray-200'
                            }`}
                          style={{ backgroundColor: color.value }}
                          onClick={() =>
                            setSelectedColors({
                              ...selectedColors,
                              [item.product._id]: color.value,
                            })
                          }
                          title={color.name}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">Qty:</span>
                        <motion.div
                          className="flex items-center border rounded-md overflow-hidden"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-none"
                            onClick={() => decrementQuantity(item._id, item.quantity)}
                            disabled={item.quantity <= 1 || loadingStates[item._id]}
                          >
                            <motion.span
                              key={`decrement-${item._id}-${loadingStates[item._id]}`}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{
                                opacity: loadingStates[item._id] ? 0.7 : 1,
                                scale: loadingStates[item._id] ? 0.9 : 1
                              }}
                              transition={{ duration: 0.2 }}
                            >
                              {loadingStates[item._id] ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Minus className="h-3 w-3" />
                              )}
                            </motion.span>
                          </Button>
                          <div className="w-10 text-center text-sm">
                            <motion.span
                              key={`quantity-${item._id}-${item.quantity}`}
                              initial={{ scale: 1.2 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.2 }}
                            >
                              {item.quantity}
                            </motion.span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-none"
                            onClick={() => incrementQuantity(item._id, item.quantity)}
                            disabled={loadingStates[item._id]}
                          >
                            <motion.span
                              key={`increment-${item._id}-${loadingStates[item._id]}`}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{
                                opacity: loadingStates[item._id] ? 0.7 : 1,
                                scale: loadingStates[item._id] ? 0.9 : 1
                              }}
                              transition={{ duration: 0.2 }}
                            >
                              {loadingStates[item._id] ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Plus className="h-3 w-3" />
                              )}
                            </motion.span>
                          </Button>
                        </motion.div>
                      </div>
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900 mr-4">
                          ₦{((item.product.price || 0) * item.quantity).toLocaleString()}
                        </p>
                        <button
                          onClick={() => handleRemoveItem(item._id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          disabled={loadingStates[item._id]}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:sticky lg:top-8 h-fit">
          <div className="border rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>₦{safeCart.total?.toLocaleString() || '0'}</span>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between font-medium text-gray-900">
                  <span>Total</span>
                  <span>₦{safeCart.total?.toLocaleString() || '0'}</span>
                </div>
              </div>

              <Button
                onClick={() => router.push('/checkout')}
                disabled={isSubmitting}
                className="w-full mt-6 py-3 text-base"
              >
                {isSubmitting ? 'Processing...' : 'Proceed to Checkout'}
              </Button>

              <p className="text-xs text-gray-500 mt-2 text-center">
                You'll be redirected to complete your purchase securely
              </p>
            </div>

            <div className="mt-4 text-sm text-gray-500">
              <p>Need help? <a href="#" className="text-pink-600 hover:underline">Contact us</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
