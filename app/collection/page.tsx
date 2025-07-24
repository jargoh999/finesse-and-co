'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ShoppingCart, Star, Filter, X, Menu, Home, ShoppingBag, Video, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const FallingFlowers = dynamic(() => import('@/components/FallingFlowers'), {
  ssr: false,
});
import Image from 'next/image';

// Product Interface
export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  rating: number;
  image: string;
  category: string;
  details: {
    topNotes: string[];
    middleNotes: string[];
    baseNotes: string[];
    size: string;
    concentration: string;
  };
}

// Sample products data
const products: Product[] = [
  {
    id: 1,
    title: 'Sauvage Elixir',
    description: 'A new olfactory signature that combines extreme freshness with warm and spicy notes.',
    price: 150,
    rating: 4.8,
    image: '/glaciar.png',
    category: 'Luxury',
    details: {
      topNotes: ['Lavender', 'Grapefruit', 'Cinnamon'],
      middleNotes: ['Lavender', 'Jasmine', 'Nutmeg'],
      baseNotes: ['Vanilla', 'Tonka Bean', 'Amber'],
      size: '100ml',
      concentration: 'Eau de Parfum'
    }
  },
  {
    id: 2,
    title: 'Sauvage Elixir',
    description: 'A new olfactory signature that combines extreme freshness with warm and spicy notes.',
    price: 150,
    rating: 4.8,
    image: '/gucci.png',
    category: 'Luxury',
    details: {
      topNotes: ['Lavender', 'Grapefruit', 'Cinnamon'],
      middleNotes: ['Lavender', 'Jasmine', 'Nutmeg'],
      baseNotes: ['Vanilla', 'Tonka Bean', 'Amber'],
      size: '100ml',
      concentration: 'Eau de Parfum'
    }
  },

  {
    id: 3,
    title: 'Sauvage Elixir',
    description: 'A new olfactory signature that combines extreme freshness with warm and spicy notes.',
    price: 150,
    rating: 4.8,
    image: '/spec1.png',
    category: 'EyeWears',
    details: {
      topNotes: ['Lavender', 'Grapefruit', 'Cinnamon'],
      middleNotes: ['Lavender', 'Jasmine', 'Nutmeg'],
      baseNotes: ['Vanilla', 'Tonka Bean', 'Amber'],
      size: '100ml',
      concentration: 'Eau de Parfum'
    }
  },
  {
    id: 4,
    title: 'Sauvage Elixir',
    description: 'A new olfactory signature that combines extreme freshness with warm and spicy notes.',
    price: 150,
    rating: 4.8,
    image: '/spec2.png',
    category: 'EyeWears',
    details: {
      topNotes: ['Lavender', 'Grapefruit', 'Cinnamon'],
      middleNotes: ['Lavender', 'Jasmine', 'Nutmeg'],
      baseNotes: ['Vanilla', 'Tonka Bean', 'Amber'],
      size: '100ml',
      concentration: 'Eau de Parfum'
    }
  },
  // Add more products here...
];

// Product Card Component
const ProductCard = ({ product, onClick }: { 
  product: Product; 
  onClick: () => void;
}) => (
  <motion.div 
    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
    whileHover={{ y: -5 }}
    onClick={onClick}
  >
    <div className="relative h-64">
      <Image 
        src={product.image} 
        alt={product.title}
        layout="fill"
        objectFit="cover"
        className="hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-800 text-xs font-semibold px-2 py-1 rounded-full flex items-center">
        <Star className="w-3 h-3 mr-1" />
        {product.rating}
      </div>
    </div>
    <div className="p-4">
      <h3 className="font-bold text-lg mb-1">{product.title}</h3>
      <p className="text-gray-500 text-sm mb-2">{product.category}</p>
      <p className="text-gray-700 text-sm mb-3 line-clamp-2">{product.description}</p>
      <div className="flex justify-between items-center">
        <span className="font-bold">${product.price.toFixed(2)}</span>
        <button className="bg-black text-white p-2 rounded-full hover:bg-gray-800 transition-colors">
          <ShoppingCart className="w-4 h-4" />
        </button>
      </div>
    </div>
  </motion.div>
);

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
          
          <div className="grid md:grid-cols-2 gap-8 p-6">
            <div className="relative h-80 md:h-full">
              <Image
                src={product.image}
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
                      className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-current' : ''}`} 
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500">{product.rating.toFixed(1)}</span>
              </div>
              
              <p className="text-gray-700 mb-6">{product.description}</p>
              
              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="font-medium text-gray-900">Top Notes</h3>
                  <p className="text-sm text-gray-600">{product.details.topNotes.join(', ')}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Middle Notes</h3>
                  <p className="text-sm text-gray-600">{product.details.middleNotes.join(', ')}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Base Notes</h3>
                  <p className="text-sm text-gray-600">{product.details.baseNotes.join(', ')}</p>
                </div>
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Size</h3>
                    <p className="text-sm text-gray-600">{product.details.size}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Concentration</h3>
                    <p className="text-sm text-gray-600">{product.details.concentration}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">${product.price.toFixed(2)}</span>
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
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
      if (selectedCategory === 'All') return true;
      return product.category === selectedCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return b.rating - a.rating;
    });

  const openProduct = (product: Product, index: number) => {
    setSelectedIndex(index);
    setSelectedProduct(product);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedProduct(null);
    document.body.style.overflow = 'auto';
  };

  const goToNext = () => {
    if (selectedIndex < filteredProducts.length - 1) {
      const newIndex = selectedIndex + 1;
      setSelectedIndex(newIndex);
      setSelectedProduct(filteredProducts[newIndex]);
    }
  };

  const goToPrev = () => {
    if (selectedIndex > 0) {
      const newIndex = selectedIndex - 1;
      setSelectedIndex(newIndex);
      setSelectedProduct(filteredProducts[newIndex]);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-white via-blue-50 to-blue-100 relative">
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
            </nav>
            
            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:bg-pink-50 z-50 relative"
              >
                <Menu className={`h-6 w-6 transition-transform ${isMenuOpen ? 'rotate-90' : ''}`} />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="lg:hidden absolute top-full left-0 right-0 bg-white shadow-lg rounded-b-lg overflow-hidden z-50"
                >
                  <div className="flex flex-col p-4 space-y-2">
                    <button 
                      onClick={() => setIsMobileFilterOpen(true)}
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-pink-50 rounded-md transition-colors w-full text-left"
                    >
                      <Filter className="mr-3 h-5 w-5" />
                      Filters
                    </button>
                    <Link href="/" className="flex items-center px-4 py-2 text-gray-700 hover:bg-pink-50 rounded-md transition-colors">
                      <Home className="mr-3 h-5 w-5" />
                      Home
                    </Link>
                    <Link href="/collection" className="flex items-center px-4 py-2 text-pink-600 bg-pink-50 rounded-md font-medium">
                      <ShoppingBag className="mr-3 h-5 w-5" />
                      Collection
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
              <p className="text-gray-600">Discover our premium selection of fragrances</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => openProduct(product, index)}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-gray-500">Try adjusting your filters to find what you're looking for.</p>
          </div>
        )}
      </main>

      {/* Product Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductModal
            product={selectedProduct}
            onClose={closeModal}
            onNext={goToNext}
            onPrev={goToPrev}
            hasNext={selectedIndex < filteredProducts.length - 1}
            hasPrev={selectedIndex > 0}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
