'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Package, CheckCircle, Truck, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';

const montserrat = {
  className: 'font-sans'
};

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${id}`);
        const data = await response.json();
        
        if (response.ok) {
          setOrder(data.order);
        } else {
          throw new Error(data.error || 'Failed to fetch order');
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'processing':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-indigo-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h2 className="text-xl font-semibold mb-4">Order not found</h2>
        <p className="mb-4">We couldn't find the order you're looking for.</p>
        <Button onClick={() => router.push('/orders')}>Back to Orders</Button>
      </div>
    );
  }

  return (
    <div className={`${montserrat.className} max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8`}>
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-6 px-0 hover:bg-transparent hover:underline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
              <p className="text-gray-500 text-sm mt-1">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
              {getStatusIcon(order.status)}
              <span className="text-sm font-medium capitalize">{order.status}</span>
            </div>
          </div>
          
          {/* Order Progress */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 ${
                  ['pending', 'processing', 'shipped', 'delivered'].includes(order.status.toLowerCase()) 
                    ? 'bg-pink-100 text-pink-600' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  <CheckCircle className="h-4 w-4" />
                </div>
                <span>Order Placed</span>
              </div>
              
              <div className="flex-1 h-0.5 mx 2 bg-gray-200"></div>
              
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 ${
                  ['processing', 'shipped', 'delivered'].includes(order.status.toLowerCase()) 
                    ? 'bg-pink-100 text-pink-600' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  <Package className="h-4 w-4" />
                </div>
                <span>Processing</span>
              </div>
              
              <div className="flex-1 h-0.5 mx-2 bg-gray-200"></div>
              
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 ${
                  ['shipped', 'delivered'].includes(order.status.toLowerCase()) 
                    ? 'bg-pink-100 text-pink-600' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  <Truck className="h-4 w-4" />
                </div>
                <span>Shipped</span>
              </div>
              
              <div className="flex-1 h-0.5 mx-2 bg-gray-200"></div>
              
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 ${
                  order.status.toLowerCase() === 'delivered' 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  <CheckCircle className="h-4 w-4" />
                </div>
                <span>Delivered</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Order Items ({order.items.length})</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {order.items.map((item: any, index: number) => {
                const product = item.product || {};
                return (
                  <div key={index} className="p-6 flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-24 h-24 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name || product.title || 'Product'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900">{item.name || product.title || 'Unnamed Product'}</h3>
                      
                      {item.specifications && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {Object.entries(item.specifications as Record<string, unknown>).map(([key, value]) => (
                            value && (
                              <span key={key} className="text-xs px-2 py-0.5 bg-gray-50 text-gray-600 rounded border border-gray-100">
                                {key}: {String(value)}
                              </span>
                            )
                          )).filter(Boolean) as React.ReactNode}
                        </div>
                      )}
                      
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                        <span className="text-sm font-medium text-gray-900">
                          ₦{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₦{order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">₦{order.shippingPrice ? order.shippingPrice.toLocaleString() : '0.00'}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">-₦{order.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>₦{order.total.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button className="w-full sm:w-auto" variant="outline">
                  Need Help?
                </Button>
                <Button className="w-full sm:w-auto bg-pink-600 hover:bg-pink-700">
                  Buy Again
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          {/* Shipping Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Shipping Information</h2>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Delivery Address</h3>
                <p className="mt-1 text-gray-900">
                  {order.shippingInfo.name}<br />
                  {order.shippingInfo.address}<br />
                  {order.shippingInfo.city}, {order.shippingInfo.state} {order.shippingInfo.postalCode}<br />
                  {order.shippingInfo.country}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Contact Information</h3>
                <p className="mt-1 text-gray-900">
                  {order.shippingInfo.email || order.email || 'No email provided'}<br />
                  {order.shippingInfo.phone}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Shipping Method</h3>
                <p className="mt-1 text-gray-900">
                  {order.shippingMethod || 'Standard Shipping'}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Payment Information</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Payment Method</span>
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {order.paymentInfo.method.replace('_', ' ')}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Payment Status</span>
                <span className={`text-sm font-medium ${
                  order.paymentInfo.status.toLowerCase() === 'paid' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {order.paymentInfo.status}
                </span>
              </div>
              
              {order.paymentInfo.transactionId && (
                <div className="pt-2 mt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                  <p className="text-sm font-mono text-gray-700 break-all">
                    {order.paymentInfo.transactionId}
                  </p>
                </div>
              )}
              
              <div className="pt-4 mt-2 border-t border-gray-100">
                <div className="flex justify-between text-base font-semibold">
                  <span>Amount Paid</span>
                  <span>₦{order.paymentInfo.amountPaid.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
