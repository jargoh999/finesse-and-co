'use client';

import { useState, useEffect, useContext } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { Star, ChevronLeft, ShoppingCart, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Playfair_Display } from 'next/font/google';

// Add a more feminine and legible font
const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
});

interface ProductDetails {
  topNotes?: string[];
  middleNotes?: string[];
  baseNotes?: string[];
  size?: string;
  concentration?: string;
  [key: string]: any;
}

interface Product {
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

export const dynamic = 'force-dynamic';

async function getProduct(id: string): Promise<{ data: Product } | null> {
  try {
    console.log('Fetching product with ID:', id);
    const res = await fetch(`/api/products/${id}`, {
      cache: 'no-store',
    });

    console.log('Response status:', res.status);

    if (!res.ok) {
      console.error('Error response:', await res.text());
      return null;
    }

    const data = await res.json();
    console.log('Product data:', data);
    return data;
  } catch (error) {
    console.error('Error in getProduct:', error);
    return null;
  }
}

export default function ProductPage({ params }: { params: { id: string } }) {
  // State hooks
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [productId, setProductId] = useState<string>('');

  // Cart context
  const { cart, addToCart } = useCart();

  // Check if product is in cart
  const isInCart = cart?.items?.some(item => item.product._id === product?._id) || false;

  // Router hooks
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/categories';

  // Navigation handler
  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(redirect);
    }
  };

  // Load product ID from params
  useEffect(() => {
    const loadProductId = async () => {
      const resolvedParams = await Promise.resolve(params);
      setProductId(resolvedParams.id);
    };

    loadProductId();
  }, [params]);

  // Fetch product data when ID is available
  useEffect(() => {
    if (!productId) return;

    async function fetchProduct() {
      try {
        const result = await getProduct(productId);
        if (result?.data) {
          setProduct(result.data);
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [productId]);

  // Image navigation handlers
  const nextImage = () => {
    if (product?.images) {
      setCurrentImageIndex(prev =>
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (product?.images) {
      setCurrentImageIndex(prev =>
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  // Handle add to cart or navigate to cart
  const handleCartAction = async () => {
    if (!product) return;
    
    if (isInCart) {
      // Navigate to cart if product is already in cart
      window.location.href = '/cart';
    } else {
      // Add to cart with default quantity of 1
      await addToCart(product._id, 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
          <p className="text-gray-600 mb-4">The product you're looking for doesn't exist or an error occurred.</p>
          <Link href="/categories" className="text-pink-600 hover:underline inline-flex items-center">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Categories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 ${playfair.variable} font-sans`}>
      <div className="mb-8">
        <button
          onClick={handleGoBack}
          className="text-pink-600 hover:text-pink-700 inline-flex items-center text-sm font-medium transition-colors duration-200"
        >
          <ChevronLeft className="w-4 h-4 mr-1.5" />
          Back
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="md:flex">
          {/* Product Images */}
          <div className="md:w-1/2 p-4 md:p-8">
            <div className="relative aspect-square w-full mb-8 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
              {product.images && product.images.length > 0 ? (
                <>
                  <Image
                    src={product.images[currentImageIndex]}
                    alt={product.title}
                    fill
                    className="object-contain p-8 transition-opacity duration-300"
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2.5 rounded-full shadow-lg z-10 transition-all duration-200 hover:scale-110"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2.5 rounded-full shadow-lg z-10 transition-all duration-200 hover:scale-110"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-700" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="text-gray-400 text-lg">No image available</div>
              )}
            </div>

            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3 mt-4">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative h-20 rounded-md overflow-hidden border-2 transition-all ${index === currentImageIndex ? 'border-pink-500' : 'border-transparent'
                      }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.title} - ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 p-6 md:p-8">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-sans tracking-tight mb-4">
                  {product.title}
                </h1>

                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex items-center bg-yellow-50 px-3 py-1.5 rounded-full">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="ml-1.5 text-gray-800 font-medium">
                      {product.rating?.toFixed(1) || 'N/A'}
                    </span>
                    {product.numReviews && product.numReviews > 0 && (
                      <span className="ml-1.5 text-sm text-gray-500">
                        • {product.numReviews} review{product.numReviews !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {product.stock > 0 ? (
                    <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      In Stock
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full">
                      Out of Stock
                    </span>
                  )}
                </div>

                <div className="mt-6">
                  <div className="text-3xl font-bold text-gray-900">
                    ₦{product.price.toLocaleString()}
                  </div>
                </div>

                <div className="prose max-w-none text-gray-600 leading-relaxed mt-6">
                  <p className="text-gray-700">{product.description}</p>
                </div>
              </div>

              {/* Product Details */}
              {product.details && Object.keys(product.details).length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 font-sans">Product Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(product.details).map(([key, value]) => {
                      if (!value || (Array.isArray(value) && value.length === 0)) return null;

                      // Skip certain keys that are already displayed
                      const skipKeys = ['id', '_id', 'createdAt', 'updatedAt', 'isFeatured'];
                      if (skipKeys.includes(key)) return null;

                      let displayValue = value;
                      if (Array.isArray(value)) {
                        displayValue = value.join(', ');
                      } else if (value === true) {
                        displayValue = 'Yes';
                      } else if (value === false) {
                        displayValue = 'No';
                      }

                      // Format the key for display
                      const formattedKey = key
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, str => str.toUpperCase())
                        .trim();

                      return (
                        <div key={key} className="flex items-start">
                          <dt className="w-32 flex-shrink-0 text-gray-500 font-medium">{formattedKey}</dt>
                          <dd className="text-gray-800">{String(displayValue)}</dd>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add to Cart Section */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={handleCartAction}
                  className={`w-full px-6 py-3 rounded-md font-medium transition-colors ${
                    isInCart
                      ? 'bg-gray-800 text-white hover:bg-gray-700'
                      : 'bg-pink-600 text-white hover:bg-pink-700'
                  }`}
                >
                  {isInCart ? 'View in Cart' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
