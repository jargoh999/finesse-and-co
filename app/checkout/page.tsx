'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, ShoppingBag, ArrowLeft, Info, Lock } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart, userInfo: cartUserInfo } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shippingInfo, setShippingInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Nigeria',
  });

  useEffect(() => {
    // Redirect if cart is empty
    if (cart?.items.length === 0) {
      router.push('/cart');
    }
  }, [cart, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!cart || !cart.items || cart.items.length === 0) {
      setError('No items in cart. Please add items before checking out.');
      setLoading(false);
      return;
    }

    if (!cartUserInfo?.email || !cartUserInfo?.phone) {
      setError('User information is missing. Please refresh the page and try again.');
      setLoading(false);
      return;
    }

    try {
      // Create order
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInfo: {
            email: cartUserInfo.email,
            name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
            phone: cartUserInfo.phone,
          },
          shippingInfo: {
            ...shippingInfo,
            name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
          },
          paymentMethod: 'on_delivery',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      // Redirect to success page with order details
      router.push(`/orders/success?orderId=${data.orderId}&orderNumber=${data.orderNumber}`);
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'An error occurred during checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Looks like you haven't added any items to your cart yet.</p>
          <Button
            asChild
            className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
          >
            <Link href="/categories">
              Continue Shopping
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const subtotal = cart?.items?.reduce(
    (sum, item) => sum + ((item?.price || 0) * (item?.quantity || 0)), 0
  ) || 0;
  const total = subtotal + 10; // Add shipping cost
  const discount = 0; // Add any discount logic here

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
         
        </div>

        <div className="lg:flex lg:gap-8">
          {/* Main Content */}
          <div className="lg:w-2/3">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/cart')}
              className="mb-6 px-0 text-gray-600 hover:bg-transparent hover:text-pink-600"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Return to cart
            </Button>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={shippingInfo.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
                    placeholder="Enter your email"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Order confirmation will be sent to this email</p>
                </div>
                
                <div className="pt-6 border-t border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">First name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={shippingInfo.firstName}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
                        placeholder="First name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Last name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={shippingInfo.lastName}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
                        placeholder="Last name"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={shippingInfo.address}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Address"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                      <input
                        type="text"
                        name="city"
                        value={shippingInfo.city}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
                        placeholder="City"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
                      <input
                        type="text"
                        name="state"
                        value={shippingInfo.state}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
                        placeholder="State"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Postal code</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={shippingInfo.postalCode}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
                        placeholder="Postal code"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Country/Region</label>
                    <div className="relative">
                      <select
                        name="country"
                        value={shippingInfo.country}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-md bg-white focus:ring-1 focus:ring-pink-500 focus:border-pink-500 appearance-none"
                        disabled
                      >
                        <option>Nigeria</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={shippingInfo.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Phone number"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">For delivery updates</p>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Method</h3>
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <label className="flex items-center p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="shipping" className="h-4 w-4 text-pink-600 focus:ring-pink-500" defaultChecked />
                      <div className="ml-3">
                        <div className="flex items-center">
                          <span className="block text-sm font-medium text-gray-900">Standard Shipping</span>
                          <span className="ml-auto text-sm font-medium">Contact Vendor</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Delivery in 3-5 business days</p>
                      </div>
                    </label>
                  </div>
                </div>
                
                {error && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-md flex items-start">
                    <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <Button
                    type="submit"
                    className="w-full py-3 text-base font-medium bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Complete Order
                      </>
                    )}
                  </Button>
                  
                  <p className="mt-3 text-xs text-center text-gray-500">
                    By placing your order, you agree to our{' '}
                    <Link href="/terms" className="text-pink-600 hover:underline">Terms of Service</Link> and{' '}
                    <Link href="/privacy" className="text-pink-600 hover:underline">Privacy Policy</Link>.
                  </p>
                </div>
              </form>
            </div>
          </div>
          
          {/* Order Summary Sidebar */}
          <div className="lg:w-1/3 mt-8 lg:mt-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden sticky top-6">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2 -mr-2">
                  {cart.items.map((item) => (
                    <div key={item._id} className="flex items-start pb-4 border-b border-gray-100">
                      <div className="h-16 w-16 bg-gray-50 rounded-md overflow-hidden flex-shrink-0 border border-gray-100">
                        {item.product.images?.[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.title || 'Product image'}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = '/placeholder-product.jpg';
                            }}
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                            <ShoppingBag className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {item.product.title || 'Unnamed Product'}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                        {item.specifications && Object.keys(item.specifications).length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {Object.entries(item.specifications).map(([key, value]) => 
                              value ? (
                                <span key={key} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-600 border border-gray-100">
                                  {key}: {String(value).substring(0, 12)}{String(value).length > 12 ? '...' : ''}
                                </span>
                              ) : null
                            )}
                          </div>
                        )}
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-sm font-medium text-gray-900">
                          ₦{(item.product.price * item.quantity).toLocaleString()}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-gray-500">
                            ₦{item.product.price.toLocaleString()} each
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">₦{cart.total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <span className="text-sm text-gray-900">Contact Vendor</span>
                    </div>
                    
                    <div className="pt-2 mt-2 border-t border-gray-200">
                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <div>
                          <span className="text-gray-900">₦{cart.total.toLocaleString()}</span>
                         
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center text-xs text-gray-500">
                  <Lock className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                  <span>Secure checkout with SSL encryption</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Need help? <Link href="/contact" className="text-pink-600 hover:underline">Contact us</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
