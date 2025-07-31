'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import ProductCard, { Product } from '@/components/ProductCard';

// Category type
type Category = {
  id: string;
  name: string;
  image: string;
  description: string;
};

// Sample categories
const categories: Category[] = [
  {
    id: 'perfume',
    name: 'Perfume',
    image: '/images/categories/perfume.jpg',
    description: 'Luxury fragrances for every occasion'
  },
  {
    id: 'eyewear',
    name: 'Eyewear',
    image: '/images/categories/eyewear.jpg',
    description: 'Stylish eyewear for clear vision'
  },
  {
    id: 'clothing',
    name: 'Clothing',
    image: '/images/categories/clothing.jpg',
    description: 'Premium clothing for all occasions'
  }
];

export default function CollectionPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'rating'>('price-asc');

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setPage(1);
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('category', categoryId);
    window.history.pushState({}, '', url.toString());
  };
  
  // Handle back to categories
  const handleBackToCategories = () => {
    setSelectedCategory(null);
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.delete('category');
    window.history.pushState({}, '', url.toString());
  };

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      if (!selectedCategory) return false;
      if (selectedCategory === 'all') return true;
      return product.category.toLowerCase() === selectedCategory.toLowerCase();
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return (b.rating || 0) - (a.rating || 0);
    });

  // Render category grid
  const renderCategoryGrid = () => (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Our Collections</h2>
          <p className="mt-2 text-lg text-gray-600">Browse our exclusive categories</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div 
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              className="group relative rounded-lg overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
            >
              <div className="aspect-w-16 aspect-h-9 bg-gray-200 overflow-hidden">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{category.name}</h3>
                <p className="text-gray-600">{category.description}</p>
                <div className="mt-4 flex items-center text-indigo-600 font-medium">
                  <span>Shop now</span>
                  <ChevronRight className="ml-2 h-4 w-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render products view
  const renderProductsView = () => (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={handleBackToCategories}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to Categories
        </button>
        
        {/* Products header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {categories.find(c => c.id === selectedCategory)?.name || 'All Products'}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'} available
            </p>
          </div>
          
          {/* Sort dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
            >
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>
        
        {/* Products grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product._id} className="group relative">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedCategory ? renderCategoryGrid() : renderProductsView()}
      </main>
    </div>
  );
}
