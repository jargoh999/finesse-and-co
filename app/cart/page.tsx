"use client";

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useCart, type CartData, type CartItem, type UserInfo } from '@/contexts/CartContext';
import Image from 'next/image';
import { Trash2, ArrowLeft, ShoppingBag, Plus, Minus, Loader2, RefreshCw, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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

// Available specifications options
const SPECIFICATIONS = {
  color: [
    { name: 'None', value: 'none' },
    { name: 'Red', value: 'red' },
    { name: 'Blue', value: 'blue' },
    { name: 'Green', value: 'green' },
    { name: 'Black', value: 'black' },
    { name: 'White', value: 'white' },
  ],
  size: [
    { name: 'None', value: 'none' },
    { name: 'XS', value: 'xs' },
    { name: 'S', value: 's' },
    { name: 'M', value: 'm' },
    { name: 'L', value: 'l' },
    { name: 'XL', value: 'xl' },
    { name: 'XXL', value: 'xxl' },
    { name: 'XXXL', value: 'xxxl' },
  ],
  bodySize: [
    { name: 'None', value: 'none' },
    { name: 'X-Small', value: 'xsmall' },
    { name: 'Small', value: 'small' },
    { name: 'Medium', value: 'medium' },
    { name: 'Large', value: 'large' },
    { name: 'X-Large', value: 'xlarge' },
  ],
  numericSize: Array.from({ length: 71 }, (_, i) => ({
    name: i.toString(),
    value: i.toString()
  }))
};

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
  const pendingUpdatesRef = useRef<Record<string, { quantity: number; timeout: NodeJS.Timeout }>>({});
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, {
    color: string;
    size: string;
    bodySize: string;
    numericSize: string;
  }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
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

  // Track pending quantity updates
  const pendingUpdates = useRef<Record<string, number>>({});
  const isUpdatingRef = useRef(false);

  // Update safeCart when cart data is available
  useEffect(() => {
    // Skip updates if we're in the middle of a local update
    if (isUpdatingRef.current) return;

    if (cart) {
      setSafeCart(prev => {
        // Don't update if the only change is from a pending update we already handled
        const hasPendingUpdates = Object.keys(pendingUpdates.current).length > 0;
        if (hasPendingUpdates) {
          const allPendingMatch = Object.entries(pendingUpdates.current).every(([id, qty]) => {
            const item = cart.items.find((i: CartItem) => i._id === id);
            return item && item.quantity === qty;
          });

          if (allPendingMatch) {
            // Clear pending updates if they match the server state
            pendingUpdates.current = {};
            return prev;
          }
        }

        return {
          _id: cart._id || '',
          items: Array.isArray(cart.items) ? cart.items : [],
          itemCount: cart.itemCount || 0,
          total: cart.total || 0
        };
      });

      // Update specifications when cart items change
      if (cart.items) {
        const updatedSpecs = { ...selectedSpecs };
        let specsUpdated = false;

        cart.items.forEach((item: CartItem) => {
          if (item?.product?._id && !updatedSpecs[item.product._id]) {
            updatedSpecs[item.product._id] = {
              color: SPECIFICATIONS.color[0].value,
              size: SPECIFICATIONS.size[0].value,
              bodySize: SPECIFICATIONS.bodySize[0].value,
              numericSize: SPECIFICATIONS.numericSize[0].value,
            };
            specsUpdated = true;
          }
        });

        if (specsUpdated) {
          setSelectedSpecs(updatedSpecs);
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

    // Track this update
    pendingUpdates.current[itemId] = newQuantity;
    isUpdatingRef.current = true;

    try {
      // Update local state immediately for instant feedback
      const updatedItems = safeCart.items.map(item =>
        item._id === itemId ? { ...item, quantity: newQuantity } : item
      );

      const newTotal = updatedItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      const newItemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

      // Update the local cart state immediately
      setSafeCart({
        ...safeCart,
        items: updatedItems,
        total: newTotal,
        itemCount: newItemCount
      });

      // Clear any pending timeouts for this item
      if (pendingUpdatesRef.current[itemId]) {
        clearTimeout(pendingUpdatesRef.current[itemId].timeout);
      }

      // Schedule the API call with a small delay for debouncing
      pendingUpdatesRef.current[itemId] = {
        quantity: newQuantity,
        timeout: setTimeout(async () => {
          try {
            await updateQuantity(itemId, newQuantity);
            // Only clear the pending update if it's still the most recent one
            if (pendingUpdates.current[itemId] === newQuantity) {
              delete pendingUpdates.current[itemId];
            }
          } catch (error) {
            console.error('Failed to update quantity:', error);
            toast.error('Failed to update quantity. Please try again.');

            // Revert to server state on error
            if (loadCart && userInfo) {
              await loadCart(userInfo);
            }
          } finally {
            isUpdatingRef.current = false;
          }
        }, 300) // Reduced debounce time for better responsiveness
      };
    } catch (error) {
      console.error('Error updating quantity:', error);
      isUpdatingRef.current = false;
      throw error;
    }
  }

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
      // Optimistically update the UI
      const currentItem = cart?.items.find((item: CartItem) => item._id === productId);

      if (previousCart?.items) {
        previousCart.items = previousCart.items.filter((item: CartItem) => item._id !== productId);

        // Update local state immediately
        const newTotal = previousCart.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const newItemCount = previousCart.items.reduce((sum, item) => sum + item.quantity, 0);

        setSafeCart({
          ...previousCart,
          total: newTotal,
          itemCount: newItemCount
        });
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
      console.error('Failed to remove item:', error);
      toast.error('Failed to remove item. Please try again.');

      // Revert to server state on error
      if (loadCart && userInfo) {
        await loadCart(userInfo);
      } else if (previousCart) {
        // Fallback to previous cart state if loadCart is not available
        // @ts-ignore - setCart is available in the context
        setCart(previousCart);
      }
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
            <motion.div
              key={`${item.product._id}-${index}`}
              className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0
              }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-full sm:w-32 h-32 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                <Image
                  src={item.product.images?.[0] || '/placeholder-product.jpg'}
                  alt={item.product.title}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{item.product.title}</h3>
                    <p className="text-gray-500 text-sm mt-1">₦{item.product.price.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      ₦{(item.product.price * item.quantity).toLocaleString()}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(item._id)}
                      disabled={loadingStates[item._id]}
                      className="text-gray-400 hover:text-red-500 h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Collapsible className="mt-3">
                  <CollapsibleTrigger className="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-gray-900">
                    <span>Customize item</span>
                    <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 space-y-3">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Color</label>
                      <Select
                        value={selectedSpecs[item.product._id]?.color || ''}
                        onValueChange={(value) => {
                          setSelectedSpecs(prev => ({
                            ...prev,
                            [item.product._id]: {
                              ...prev[item.product._id],
                              color: value
                            }
                          }));
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select color" />
                        </SelectTrigger>
                        <SelectContent>
                          {SPECIFICATIONS.color.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                              <div className="flex items-center gap-2">
                                <span className="h-4 w-4 rounded-full border" style={{ backgroundColor: color.value }} />
                                {color.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Size</label>
                      <div className="flex flex-wrap gap-2">
                        {SPECIFICATIONS.size.map((size) => (
                          <Button
                            key={size.value}
                            type="button"
                            variant={selectedSpecs[item.product._id]?.size === size.value ? 'default' : 'outline'}
                            size="sm"
                            className="h-8 px-3"
                            onClick={() => {
                              setSelectedSpecs(prev => ({
                                ...prev,
                                [item.product._id]: {
                                  ...prev[item.product._id],
                                  size: size.value
                                }
                              }));
                            }}
                          >
                            {size.name}
                            {selectedSpecs[item.product._id]?.size === size.value && (
                              <Check className="ml-1 h-3 w-3" />
                            )}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Body Size</label>
                        <Select
                          value={selectedSpecs[item.product._id]?.bodySize || 'none'}
                          onValueChange={(value) => {
                            setSelectedSpecs(prev => ({
                              ...prev,
                              [item.product._id]: {
                                ...prev[item.product._id],
                                bodySize: value
                              }
                            }));
                          }}
                        >
                          <SelectTrigger className="text-base">
                            <SelectValue placeholder="Select body size" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto">
                            {SPECIFICATIONS.bodySize.map((size) => (
                              <SelectItem
                                key={size.value}
                                value={size.value}
                                className="text-base"
                              >
                                {size.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Numeric Size</label>
                        <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
                          <Select
                            value={selectedSpecs[item.product._id]?.numericSize || '0'}
                            onValueChange={(value) => {
                              setSelectedSpecs(prev => ({
                                ...prev,
                                [item.product._id]: {
                                  ...prev[item.product._id],
                                  numericSize: value
                                }
                              }));
                            }}
                          >
                            <SelectTrigger className="col-span-5 text-base">
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60 overflow-y-auto">
                              {SPECIFICATIONS.numericSize.map((size) => (
                                <SelectItem
                                  key={size.value}
                                  value={size.value}
                                  className="text-base"
                                >
                                  {size.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <div className="mt-4 flex items-center justify-between border-t pt-4">
                  <div className="flex items-center border rounded-md overflow-hidden">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-none"
                      onClick={() => decrementQuantity(item._id, item.quantity)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-10 text-center text-sm">
                      {item.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-none"
                      onClick={() => incrementQuantity(item._id, item.quantity)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="font-medium">
                    ₦{(item.product.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 p-6 rounded-lg sticky top-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">₦{safeCart.total.toLocaleString()}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">Contact The Vendor <a className="text-pink-600 hover:underline" href="https://wa.me/2348124139608">here</a></span>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between text-lg font-medium text-gray-900">
                  <span>Total</span>
                  <span>₦{safeCart.total.toLocaleString()}</span>
                </div>
              </div>

              <Button
                className="w-full mt-6 bg-pink-600 hover:bg-pink-700"
                onClick={() => router.push('/checkout')}
                disabled={isSubmitting || safeCart.items.length === 0}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Proceed to Checkout
              </Button>

              <p className="text-xs text-gray-500 text-center mt-2">
                or{' '}
                <button
                  onClick={handleGoBack}
                  className="text-pink-600 hover:underline"
                >
                  continue shopping
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}