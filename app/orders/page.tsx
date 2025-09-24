'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ShoppingBag, ArrowLeft, Package } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';

const montserrat = {
  className: 'font-sans'
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { userInfo } = useCart();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!userInfo?.email || !userInfo?.phone) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const params = new URLSearchParams({
          email: userInfo.email,
          phone: userInfo.phone,
        });

        const response = await fetch(`/api/orders?${params}`);
        const data = await response.json();
        
        if (response.ok) {
          setOrders(data.orders || []);
        } else {
          console.error('Failed to fetch orders:', data.error);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userInfo?.email, userInfo?.phone]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Your Orders</h2>
        <p className="text-gray-600 max-w-md">We're fetching your order history. Please wait a moment...</p>
      </div>
    );
  }

  return (
    <div className={`${montserrat.className} max-w-4xl mx-auto p-4 sm:p-6`}>
      <div className="mb-6">
        <Link href="/categories" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to collection
        </Link>
      </div>
      
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Your Orders</h1>
        <p className="text-gray-600 text-sm sm:text-base">View and track your order history</p>
      </div>
      
      <div className="hidden sm:flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Order History</h2>
        <Link href="/collection" className="text-sm font-medium text-pink-600 hover:text-pink-700">
          Continue Shopping →
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="max-w-md mx-auto p-4 sm:p-6 min-h-[60vh] flex items-center justify-center">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100 w-full text-center">
            <div className="bg-blue-50 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Package className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No Orders Yet</h2>
            <p className="text-gray-600 text-sm sm:text-base mb-6">You haven't placed any orders yet. Start shopping to see your orders here.</p>
            <div className="space-y-4">
              <Link href="/collection" className="block w-full">
                <Button className="w-full py-3 sm:py-4 text-sm sm:text-base font-medium bg-pink-600 hover:bg-pink-700">
                  Start Shopping
                </Button>
              </Link>
              <div className="text-xs sm:text-sm text-gray-500">
                Need help? <a href="/contact" className="text-pink-600 hover:underline font-medium">Contact us</a>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="p-4 sm:p-6">
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div className="mb-2 sm:mb-0">
                    <h3 className="text-sm font-semibold text-gray-900">ORDER #{order.orderNumber}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      order.status.toLowerCase() === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status.toLowerCase() === 'shipped' ? 'bg-blue-100 text-blue-800' :
                      order.status.toLowerCase() === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t border-gray-100 pt-4">
                  {order.items.slice(0, 2).map((item: any, i: number) => {
                    const product = item.product || {};
                    return (
                      <div key={i} className="flex items-start py-3">
                        <div className="h-16 w-16 sm:h-20 sm:w-20 bg-gray-50 rounded-md overflow-hidden flex-shrink-0 border border-gray-100">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name || product.title || 'Product'}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                              <ShoppingBag className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.name || product.title || 'Unnamed Product'}
                          </p>
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                            <p className="text-sm font-medium text-gray-900">
                              ₦{(item.price * item.quantity).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {order.items.length > 2 && (
                    <div className="text-center mt-2">
                      <p className="text-xs text-gray-500">
                        +{order.items.length - 2} more item{order.items.length - 2 !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>

                {/* Order Footer */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium text-gray-900">Total</span>
                      <p className="text-xs text-gray-500">Includes shipping and taxes</p>
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      ₦{order.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
                    <Link href={`/orders/${order._id}`} className="w-full sm:w-auto">
                      <Button variant="outline" className="w-full sm:w-auto text-sm h-10">
                        View Order
                      </Button>
                    </Link>
                    <Button className="w-full sm:w-auto text-sm h-10 bg-pink-600 hover:bg-pink-700">
                      Buy Again
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
