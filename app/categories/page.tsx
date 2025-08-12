'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Playfair_Display, Montserrat } from 'next/font/google';
import { Variants } from 'framer-motion';
// Feminine fonts
const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700'],
});

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
  weight: ['300', '400', '500', '600'],
});

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 10
    }
  }
};



interface Category {
  name: string;
  image: string;
  count: number;
}

// Default categories in case API fails
const defaultCategories: Category[] = [
  { name: 'Perfume', image: '/placeholder.jpg', count: 0 },
  { name: 'Eyewear', image: '/placeholder.jpg', count: 0 },
  { name: 'Clothing', image: '/placeholder.jpg', count: 0 },
  { name: 'Accessories', image: '/placeholder.jpg', count: 0 },
  { name: 'Jewelry', image: '/placeholder.jpg', count: 0 },
  { name: 'Watches', image: '/placeholder.jpg', count: 0 },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        setCategories(data.data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories(defaultCategories);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-white">
        <div className="animate-pulse text-pink-400">
          <div className={`${montserrat.className} text-pink-600`}>Loading collections...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-pink-50 to-white ${montserrat.variable} font-sans`}>
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className={`${playfair.className} text-4xl md:text-5xl font-medium text-pink-800 mb-4`}>
            Our Collections
          </h1>
          <p className="text-pink-600 max-w-2xl mx-auto text-lg">
            Discover your perfect style in our curated selection
          </p>
        </motion.div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
                  {categories.map((category, index) => (
              //@ts-ignore
            <motion.div key={category.name} variants={item}>
              <Link 
                href={`/collection?category=${category.name}`}
                className="group block h-full"
              >
                <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-pink-100 hover:border-pink-200 h-full flex flex-col transform hover:-translate-y-1">
                  <div className="relative h-56 w-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-purple-50 opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
                    <Image
                      src={category.image || '/placeholder.jpg'}
                      alt={category.name}
                      fill
                      className="object-cover transform group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                      <div>
                        <h2 className={`${playfair.className} text-2xl font-semibold text-white mb-1`}>
                          {category.name}
                        </h2>
                        <p className="text-pink-100 text-sm">
                          {category.count || 'Many'} {category.count === 1 ? 'item' : 'items'} available
                        </p>
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 bg-white/90 text-xs font-medium px-3 py-1 rounded-full shadow-sm text-pink-700">
                      {category.count || '0'} items
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="mt-auto pt-4 border-t border-pink-100">
                      <span className="inline-flex items-center text-pink-600 font-medium group-hover:text-pink-700 transition-colors">
                        Explore collection
                        <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
