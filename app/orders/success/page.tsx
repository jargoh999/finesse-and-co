'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ShoppingBag, Truck, Package, CreditCard, User, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

const montserrat = {
  className: 'font-sans'
};

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-600"></div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
    {children}
  </div>
);

const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-lg font-semibold text-gray-900 mb-4">{children}</h3>
);

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const orderNumber = searchParams.get('orderNumber');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(!!orderId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        setError('No order ID provided');
        return;
      }

      try {
        const response = await fetch(`/api/orders/${orderId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch order');
        }

        setOrder(data.order);
      } catch (err: any) {
        console.error('Error fetching order:', err);
        // If we have the order number from URL, we can still show success
        if (orderNumber) {
          setOrder({
            orderNumber,
            items: []
          });
        } else {
          setError(err.message || 'Failed to load order details');
        }
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    } else if (orderNumber) {
      // If we only have order number, show basic success
      setOrder({
        orderNumber,
        items: []
      });
      setLoading(false);
    } else {
      setError('No order information provided');
      setLoading(false);
    }
  }, [orderId, orderNumber]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  if ((error || !order) && !orderNumber) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h2>
          <p className="text-gray-600 mb-6">
            {error || 'We couldn\'t find your order details. Please check your order confirmation email or contact support.'}
          </p>
          <Link href="/categories">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`${montserrat.className} min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8`}>
      <div className="max-w-4xl mx-auto">
        {/* Order Confirmed Header */}
        <div className="text-center mb-12">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-50 mb-6">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Thank you for your order!</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            A confirmation email has been sent to <span className="font-medium text-gray-900">{order?.user?.email || 'your email'}</span>.
          </p>
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
            <span>Order #{order?.orderNumber || orderNumber}</span>
            {order?.createdAt && (
              <span className="mx-2">•</span>
            )}
            {order?.createdAt && (
              <span>{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            )}
          </div>
          {!order && (
            <p className="text-yellow-600 text-sm mt-3">
              Order details are still being processed. You'll receive a confirmation email shortly.
            </p>
          )}
        </div>

        {/* Order Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 space-y-6">

              {/* Order Items */}
              <Card>
                <div className="p-6">
                  <SectionHeader>Order Summary</SectionHeader>
                  <div className="space-y-6">
                    {order?.items?.length > 0 ? (
                      order.items.map((item: any, index: number) => (
                        <div key={index} className="flex items-start pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                          <div className="h-20 w-20 bg-gray-50 rounded-md overflow-hidden flex-shrink-0 border border-gray-100">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = '/placeholder-product.jpg';
                                }}
                              />
                            ) : (
                              <div className="h-full w-full bg-gray-50 flex items-center justify-center">
                                <Package className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4 flex-1 min-w-0">
                            <div className="flex justify-between">
                              <h4 className="text-base font-medium text-gray-900">{item.name}</h4>
                              <p className="text-base font-medium text-gray-900 ml-4 whitespace-nowrap">
                                ₦{(item.price * item.quantity).toLocaleString()}
                              </p>
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                            {item.specifications && Object.keys(item.specifications).length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {Object.entries(item.specifications).map(([key, value]) => 
                                  value ? (
                                    <span key={key} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100">
                                      {key}: {String(value).substring(0, 12)}{String(value).length > 12 ? '...' : ''}
                                    </span>
                                  ) : null
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-gray-500">Your order details will be available shortly.</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Order Information */}
              <Card className="mt-6">
                <div className="p-6">
                  <SectionHeader>Order Information</SectionHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Shipping Address */}
                    {order?.shippingInfo && (
                      <div>
                        <div className="flex items-center text-gray-900 font-medium mb-3">
                          <Truck className="h-5 w-5 mr-2 text-gray-400" />
                          <span>Shipping Address</span>
                        </div>
                        <div className="pl-7">
                          <p className="text-gray-700">
                            {order.shippingInfo?.name && <>{order.shippingInfo.name}<br /></>}
                            {order.shippingInfo?.address && <>{order.shippingInfo.address}<br /></>}
                            {order.shippingInfo?.city && (
                              <>{order.shippingInfo.city}{order.shippingInfo.state ? `, ${order.shippingInfo.state}` : ''} {order.shippingInfo.postalCode || ''}<br /></>
                            )}
                            {order.shippingInfo?.country}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Contact Information */}
                    {(order?.user?.email || order?.shippingInfo?.phone) && (
                      <div>
                        <div className="flex items-center text-gray-900 font-medium mb-3">
                          <User className="h-5 w-5 mr-2 text-gray-400" />
                          <span>Contact Information</span>
                        </div>
                        <div className="pl-7 space-y-1">
                          {order.user?.email && (
                            <p className="text-gray-700 flex items-center">
                              <Mail className="h-4 w-4 mr-2 text-gray-400" />
                              <span>{order.user.email}</span>
                            </p>
                          )}
                          {order.shippingInfo?.phone && (
                            <p className="text-gray-700 flex items-center">
                              <Phone className="h-4 w-4 mr-2 text-gray-400" />
                              <span>{order.shippingInfo.phone}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Payment Method */}
                    {order?.paymentInfo?.method && (
                      <div>
                        <div className="flex items-center text-gray-900 font-medium mb-3">
                          <CreditCard className="h-5 w-5 mr-2 text-gray-400" />
                          <span>Payment Method</span>
                        </div>
                        <div className="pl-7">
                          <p className="text-gray-700 capitalize">
                            {String(order.paymentInfo.method).replace('_', ' ')}
                          </p>
                          <p className="text-sm text-green-600 mt-1">Paid with {String(order.paymentInfo.method).replace('_', ' ')}</p>
                        </div>
                      </div>
                    )}

                    {/* Order Status */}
                    <div>
                      <div className="flex items-center text-gray-900 font-medium mb-3">
                        <Package className="h-5 w-5 mr-2 text-gray-400" />
                        <span>Order Status</span>
                      </div>
                      <div className="pl-7">
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Processing
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Your order is being processed and will be shipped soon.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              </div>

              {/* Order Total */}
              <div className="lg:col-span-1">
                <Card className="sticky top-6">
                  <div className="p-6">
                    <SectionHeader>Order Total</SectionHeader>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">₦{order?.total?.toLocaleString() || '0.00'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Shipping</span>
                        <span className="text-gray-900">Contact Vendor</span>
                      </div>
                      <div className="pt-3 mt-3 border-t border-gray-200">
                        <div className="flex justify-between font-medium">
                          <span>Total</span>
                          <span className="text-gray-900">₦{order?.total?.toLocaleString() || '0.00'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Need Help */}
                <Card className="mt-6 p-6">
                  <div className="text-center">
                    <h3 className="font-medium text-gray-900 mb-2">Need help?</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Have questions about your order? We're here to help!
                    </p>
                    <Button variant="outline" className="w-full">
                      Contact Support
                    </Button>
                  </div>
                </Card>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-12">
              <Link href="/categories" className="w-full sm:w-auto">
                <Button className="w-full bg-pink-600 hover:bg-pink-700 h-12 px-6">
                  Continue Shopping
                </Button>
              </Link>
              {orderId && (
                <Link href="/orders" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full h-12 flex items-center justify-center">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    View Order History
                  </Button>
                </Link>
              )}
            </div>
      </div>
    </div>
  );
}
