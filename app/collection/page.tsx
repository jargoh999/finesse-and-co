'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Filter, X, Menu, Home, ShoppingBag, Video, ArrowRight, MessageCircle, ChevronLeft, ChevronRight, Star, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import WhatsAppButton from '@/components/WhatsAppButton';
import { Cormorant_Garamond } from 'next/font/google';
import { toast } from 'sonner';
import ProductCard, { Product } from '@/components/ProductCard';
import FloatingCartButton from '@/components/FloatingCartButton';

const cormorant = Cormorant_Garamond({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-cormorant',
});

const FallingFlowers = dynamic(() => import('@/components/FallingFlowers'), {
  ssr: false,
});
import Image from 'next/image';

// API Response Type
interface ApiResponse {
  success: boolean;
  data: Product[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

// Product Modal Component
const ProductModal = ({ 
  product, 
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev 
}: { 
  product: Product | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}) => {
  if (!product) return null;

  return (
    <motion.div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        exit={{ y: 20 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="relative">
          <button 
            className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md z-10"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
          <button 
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md z-10"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button 
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md z-10"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          <div className="grid md:grid-cols-2 gap-8 p-6">
            <div className="relative h-80 md:h-full">
              <Image
                src={product.images[0]}
                alt={product.title}
                layout="fill"
                objectFit="cover"
                className="rounded-lg"
              />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-2">{product.title}</h2>
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400 mr-2">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${i < Math.floor(product.rating || 0) ? 'fill-current' : ''}`} 
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500">{(product.rating || 0).toFixed(1)}</span>
              </div>

              <p className="text-gray-700 mb-6">{product.description}</p>
              
              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="font-medium text-gray-900">Top Notes</h3>
                  <p className="text-sm text-gray-600">{(product.details?.topNotes || []).join(', ')}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Middle Notes</h3>
                  <p className="text-sm text-gray-600">{(product.details?.middleNotes || []).join(', ')}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Base Notes</h3>
                  <p className="text-sm text-gray-600">{(product.details?.baseNotes || []).join(', ')}</p>
                </div>
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Size</h3>
                    <p className="text-sm text-gray-600">{product.details?.size || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Concentration</h3>
                    <p className="text-sm text-gray-600">{product.details?.concentration || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">₦{product.price.toFixed(2)}</span>
                <button className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors">
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function CollectionPage() {
  // Get category from URL if it exists
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Update selected category when URL changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const category = params.get('category');
      if (category) {
        setSelectedCategory(category);
        // Reset to first page when category changes
        setPage(1);
      }
    }
  }, []);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 12;
  
  // Initialize client-side only
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'rating'>('price-asc');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get unique categories
  const categories = ['All', ...new Set(products.map(product => product.category))];
  
  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      if (selectedCategory === 'all') return true;
      return product.category === selectedCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return (b.rating || 0) - (a.rating || 0);
    });

  // Fetch products when category or page changes
  useEffect(() => {
    let isMounted = true;
    
    const fetchProducts = async () => {
      console.log('Fetching products with params:', { 
        category: selectedCategory, 
        page, 
        itemsPerPage 
      });

      try {
        setLoading(true);
        const response = await fetch(
          `/api/products?category=${selectedCategory === 'all' ? '' : selectedCategory}&page=${page}&limit=${itemsPerPage}`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: ApiResponse = await response.json();
        console.log('API Response:', data);
        
        if (!isMounted) return;
        
        if (data.success) {
          setProducts(data.data);
          setTotalPages(data.pagination.pages);
          console.log('Updated products and totalPages:', {
            productsCount: data.data.length,
            totalPages: data.pagination.pages,
            currentPage: data.pagination.page
          });
        } else {
          console.error('API Error:', data);
          toast.error('Failed to fetch products');
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching products:', error);
          toast.error('Error loading products');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [selectedCategory, page, itemsPerPage]);

  // Navigation functions for modal
  const goToNextProduct = () => {
    if (currentIndex < filteredProducts.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setSelectedProduct(filteredProducts[newIndex]);
    } else if (page < totalPages) {
      // Go to next page and reset index to 0
      setPage(page + 1);
      setCurrentIndex(0);
    }
  };

  const goToPrevProduct = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setSelectedProduct(filteredProducts[newIndex]);
    } else if (page > 1) {
      // Go to previous page and set index to last item
      setPage(page - 1);
      setCurrentIndex(itemsPerPage - 1);
    }
  };

  const openProduct = (product: Product, index: number, e?: React.MouseEvent) => {
    e?.preventDefault();
    setCurrentIndex(index);
    setSelectedProduct(product);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  };

  const closeProduct = () => {
    setSelectedProduct(null);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'auto';
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-white via-blue-50 to-blue-100 relative font-sans">
      <style jsx global>{`
        html {
          overflow-x: hidden;
          width: 100%;
        }
        body {
          max-width: 100%;
          overflow-x: hidden;
        }
      `}</style>
      <style jsx global>{`
        body {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 400;
          line-height: 1.6;
        }
        h1, h2, h3, h4, h5, h6 {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 500;
          letter-spacing: 0.5px;
        }
      `}</style>
      {/* WhatsApp Button - Fixed on middle right (Desktop only) */}
      <WhatsAppButton 
        position="middle-right"
        size="lg"
        className="hidden md:block"
      />
      
      {isClient && <FallingFlowers count={15} />}
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute -top-1/2 -right-1/4 w-full h-[200%] bg-gradient-to-br from-pink-100/30 to-blue-100/30 rounded-full mix-blend-multiply filter blur-3xl opacity-50"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
        <motion.div 
          className="absolute -bottom-1/4 -left-1/4 w-[150%] h-[150%] bg-gradient-to-tr from-blue-100/30 to-pink-100/30 rounded-full mix-blend-multiply filter blur-3xl opacity-50"
          animate={{
            x: [0, -50, 0],
            y: [0, 100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: 5,
          }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 w-1/2 h-1/2 bg-gradient-to-r from-pink-200/20 to-blue-200/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          animate={{
            scale: [1, 1.5, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <motion.div 
            className="flex justify-between items-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/" className="flex items-center space-x-2 group">
              <motion.div 
                className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Home className="w-4 h-4 text-white" />
              </motion.div>
              <span className="text-xl font-bold bg-gradient-to-r from-pink-400 to-pink-600 bg-clip-text text-transparent">
                Finesse & Co.
              </span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-2 bg-white/80 rounded-full px-1 py-1 shadow-sm border border-gray-100">
              <Link 
                href="/collection" 
                className="flex items-center px-4 py-2 rounded-full hover:bg-pink-50 transition-all text-sm font-medium text-gray-700 group"
              >
                <ShoppingBag className="w-4 h-4 mr-2 text-pink-500 group-hover:scale-110 transition-transform" />
                Collection
                <ArrowRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </Link>
              <Link 
                href="/gallery" 
                className="flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 text-white text-sm font-medium shadow-lg shadow-pink-100 hover:shadow-pink-200 transition-all"
              >
                <Video className="w-4 h-4 mr-2" />
                Gallery
              </Link>
              <FloatingCartButton className="ml-2" />
            </nav>
            
            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <div className="flex items-center space-x-2">
                <FloatingCartButton className="mr-2" />
                <a
                  href="https://wa.me/2348124139608?text=Hello!%20I'm%20interested%20in%20your%20products"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-gradient-to-r from-transparent to-gray-100 hover:from-gray-100 hover:to-gray-100 transition-all shadow-lg shadow-gray-100 hover:shadow-gray-200"
                  aria-label="Chat on WhatsApp"
                >
                  <div className="relative h-10 w-10">
                    <Image 
                      src="/whatsapp.png" 
                      alt="WhatsApp" 
                      fill 
                      className="object-contain"
                      sizes="20px"
                    />
                  </div>
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
              {isMobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="lg:hidden absolute top-full left-0 right-0 bg-white shadow-lg rounded-b-lg overflow-hidden z-50"
                >
                  <div className="flex flex-col p-4 space-y-2">
                    <Link href="/" className="flex items-center px-4 py-2 text-gray-700 hover:bg-pink-50 rounded-md transition-colors">
                      <Home className="mr-3 h-5 w-5" />
                      Home
                    </Link>
                    <Link href="/categories" className="flex items-center px-4 py-2 text-pink-600 bg-pink-50 rounded-md font-medium">
                      <ShoppingBag className="mr-3 h-5 w-5" />
                      Categories
                    </Link>
                    <Link href="/gallery" className="flex items-center px-4 py-2 text-gray-700 hover:bg-pink-50 rounded-md transition-colors">
                      <Video className="mr-3 h-5 w-5" />
                      Gallery
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Our Collection</h1>
              <p className="text-gray-600">Discover our premium Collections </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-black focus:border-black sm:text-sm rounded-md"
                >
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mobile filter dialog */}
          <AnimatePresence>
            {isMobileFilterOpen && (
              <motion.div
                initial={{ opacity: 0, x: '100%' }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: '100%' }}
                className="fixed inset-0 z-50 bg-white p-6 overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-gray-900">Filters</h2>
                  <button
                    type="button"
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="border-t border-gray-200 pt-4 pb-6">
                  <h3 className="font-medium text-gray-900 mb-4">Categories</h3>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => {
                          setSelectedCategory(category);
                          setIsMobileFilterOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-2 rounded-md ${
                          selectedCategory === category
                            ? 'bg-black text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Desktop category tabs */}
          <div className="hidden md:block mt-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                      selectedCategory === category
                        ? 'border-black text-black'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map((product, index) => (
                  <div key={product._id} className="h-full">
                    <ProductCard 
                      product={{
                        ...product,
                        id: product._id,
                        details: {
                          ...(product.details || {}),
                          size: product.details?.size,
                          concentration: product.details?.concentration,
                          topNotes: product.details?.topNotes,
                          middleNotes: product.details?.middleNotes,
                          baseNotes: product.details?.baseNotes
                        }
                      }}
                      onClick={() => {
                        window.location.href = `/products/${product._id}`;
                      }}
                    />
                  </div>
                ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8 space-x-2">
                <div className="relative">
                  <button
                    id="prev-page-button"
                    onClick={(e) => {
                      console.log('Previous button clicked!');
                      e.preventDefault();
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                      
                      console.log('Current page:', page, 'Total pages:', totalPages);
                      
                      if (page > 1) {
                        const prevPage = page - 1;
                        console.log('Attempting to set page to:', prevPage);
                        setPage(prevPage);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      } else {
                        console.log('Cannot go to previous page: already on first page');
                      }
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                    }}
                    disabled={page === 1}
                    className={`px-4 py-2 rounded-md border relative z-10 ${
                      page === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-white hover:bg-gray-50 cursor-pointer active:scale-95 transition-transform'
                    }`}
                    style={{
                      position: 'relative',
                      zIndex: 10,
                      pointerEvents: 'auto'
                    }}
                  >
                    Previous
                  </button>
                  {/* Debug overlay */}
                  <div 
                    className="absolute inset-0 bg-red-500 opacity-0 hover:opacity-10 z-0"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 5
                    }}
                    onClick={(e) => {
                      console.log('Previous button overlay clicked!');
                      e.stopPropagation();
                    }}
                  />
                </div>
                <span className="flex items-center px-4">
                  Page {page} of {totalPages}
                </span>
                <div className="relative">
                  <button
                    id="next-page-button"
                    onClick={(e) => {
                      console.log('Next button clicked!');
                      e.preventDefault();
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                      
                      console.log('Current page:', page, 'Total pages:', totalPages);
                      
                      if (page < totalPages) {
                        const nextPage = page + 1;
                        console.log('Attempting to set page to:', nextPage);
                        setPage(nextPage);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      } else {
                        console.log('Cannot go to next page: already on last page');
                      }
                    }}
                    onMouseDown={(e) => {
                      // Stop propagation at the mouse down level
                      e.stopPropagation();
                    }}
                    disabled={page >= totalPages}
                    className={`px-4 py-2 rounded-md border relative z-10 ${
                      page >= totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-white hover:bg-gray-50 cursor-pointer active:scale-95 transition-transform'
                    }`}
                    style={{
                      position: 'relative',
                      zIndex: 10,
                      pointerEvents: 'auto'
                    }}
                  >
                    Next
                  </button>
                  {/* Debug overlay */}
                  <div 
                    className="absolute inset-0 bg-red-500 opacity-0 hover:opacity-10 z-0"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 5
                    }}
                    onClick={(e) => {
                      console.log('Overlay clicked!');
                      e.stopPropagation();
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Product Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductModal
            product={selectedProduct}
            onClose={closeProduct}
            onNext={goToNextProduct}
            onPrev={goToPrevProduct}
            hasNext={currentIndex < filteredProducts.length - 1 || page < totalPages}
            hasPrev={currentIndex > 0 || page > 1}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
