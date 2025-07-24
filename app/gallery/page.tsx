'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { X, Menu, Play, Home, ShoppingBag, Video, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Head from 'next/head';
import dynamic from 'next/dynamic';

const FallingFlowers = dynamic(() => import('@/components/FallingFlowers'), {
  ssr: false,
});

// Add this to your global.css or in a style tag
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap');
  
  body {
    font-family: 'Montserrat', sans-serif;
    background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
    min-height: 100vh;
  }
  
  .shiny-frame {
    position: relative;
    overflow: hidden;
  }
  
  .shiny-frame::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.1) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    transform: rotate(30deg);
    transition: 0.6s;
    opacity: 0;
  }
  
  .shiny-frame:hover::after {
    left: 100%;
    opacity: 1;
  }
  
  .petals {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: -1;
    overflow: hidden;
  }
  
  .petal {
    position: absolute;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 150% 0 150% 0;
    animation: falling linear infinite;
    pointer-events: none;
  }
  
  @keyframes falling {
    0% {
      transform: translate(0, -10%) rotate(0deg);
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    90% {
      opacity: 1;
    }
    100% {
      transform: translate(var(--random-x), 100vh) rotate(360deg);
      opacity: 0;
    }
  }
`;

type VideoFormat = 'youtube' | 'ogg' | 'mp4';

interface Video {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  category: string;
  format: VideoFormat;
}

// WhatsApp video data
const videos: Video[] = [
  {
    id: 1,
    title: 'Luxury Fragrance Showcase',
    description: 'Experience our premium collection in stunning detail',
    thumbnail: '/glaciar.png',
    videoUrl: '/vid.mp4', // Path to your OGG file in public/videos/
    category: 'Showcase',
    format: 'mp4'
  },
  {
    id: 2,
    title: 'Behind the Scenes',
    description: 'Discover the art of fragrance making',
    thumbnail: '/gucci.png',
    videoUrl: '/finehand.mp4',
    category: 'Behind the Scenes',
    format: 'mp4'
  },
  // Add more videos as needed
];

const PetalsBackground = () => {
  useEffect(() => {
    const createPetal = () => {
      const petal = document.createElement('div');
      petal.className = 'petal';
      
      // Random size between 10 and 30px
      const size = Math.random() * 20 + 10;
      
      // Random position
      const startX = Math.random() * window.innerWidth;
      const randomX = (Math.random() - 0.5) * 200; // Random horizontal movement
      
      // Random animation duration between 10 and 20 seconds
      const duration = Math.random() * 10 + 10;
      
      // Apply styles
      petal.style.setProperty('--random-x', `${randomX}px`);
      petal.style.width = `${size}px`;
      petal.style.height = `${size}px`;
      petal.style.left = `${startX}px`;
      petal.style.animationDuration = `${duration}s`;
      petal.style.opacity = (Math.random() * 0.5 + 0.1).toString();
      
      // Add to DOM
      document.querySelector('.petals')?.appendChild(petal);
      
      // Remove after animation completes
      setTimeout(() => {
        petal.remove();
      }, duration * 1000);
    };
    
    // Create initial petals
    for (let i = 0; i < 15; i++) {
      setTimeout(createPetal, Math.random() * 5000);
    }
    
    // Create new petals at intervals
    const interval = setInterval(createPetal, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  return <div className="petals"></div>;
};

const GalleryPage = () => {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const controls = useAnimation();

  useEffect(() => {
    setIsClient(true);
    controls.start({
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' }
    });
  }, [controls]);
  
  // Get unique categories
  const categories = ['All', ...new Set(videos.map(video => video.category))];
  
  // Filter videos by category
  const filteredVideos = selectedCategory === 'All' 
    ? [...videos] 
    : videos.filter(video => video.category === selectedCategory);

  const openVideo = (video: Video) => {
    setSelectedVideo(video);
    document.body.style.overflow = 'hidden';
  };

  const closeVideo = () => {
    setSelectedVideo(null);
    document.body.style.overflow = 'auto';
  };

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
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-white via-blue-50 to-blue-100 relative">
      {isClient && <FallingFlowers count={15} />}
      <Head>
        <title>Gallery | Finesse & Co.</title>
        <meta name="description" content="Explore our fragrance videos and collections" />
      </Head>
      <style jsx global>{`
        ${globalStyles}
      `}</style>
      
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
                    <Link href="/" className="flex items-center px-4 py-2 text-gray-700 hover:bg-pink-50 rounded-md transition-colors">
                      <Home className="mr-3 h-5 w-5" />
                      Home
                    </Link>
                    <Link href="/collection" className="flex items-center px-4 py-2 text-gray-700 hover:bg-pink-50 rounded-md transition-colors">
                      <ShoppingBag className="mr-3 h-5 w-5" />
                      Collection
                    </Link>
                    <Link href="/gallery" className="flex items-center px-4 py-2 text-pink-600 bg-pink-50 rounded-md font-medium">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12 text-center"
        >
          <motion.h1 
            className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-pink-600"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Video Gallery
          </motion.h1>
          <motion.p 
            className="text-lg text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Immerse yourself in the world of luxury fragrances through our exclusive video collection
          </motion.p>
          
          {/* Category Filter */}
          <motion.div 
            className="flex flex-wrap justify-center gap-3 mt-10 mb-16"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {categories.map((category) => (
              <motion.button
                key={category}
                variants={item}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-100'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm hover:shadow-md border border-gray-100'
                }`}
              >
                {category}
              </motion.button>
            ))}
          </motion.div>
          
          {/* Video Grid */}
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {filteredVideos.map((video, index) => (
              <motion.div 
                key={video.id}
                variants={item}
                initial={{ opacity: 0, y: 20 }}
                whileHover={{ 
                  y: -5,
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer shiny-frame"
                onClick={() => openVideo(video)}
                onMouseEnter={() => setHoveredCard(video.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="relative h-56 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                  <motion.div 
                    className="absolute inset-0"
                    initial={{ scale: 1 }}
                    animate={{ 
                      scale: hoveredCard === video.id ? 1.05 : 1,
                      transition: { duration: 0.5, ease: "easeOut" }
                    }}
                  >
                    <img 
                      src={video.thumbnail} 
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                    <motion.div 
                      className="w-full"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ 
                        y: hoveredCard === video.id ? 0 : 20,
                        opacity: hoveredCard === video.id ? 1 : 0,
                        transition: { duration: 0.3, delay: 0.1 }
                      }}
                    >
                      <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center mb-4 transform group-hover:scale-110 transition-transform duration-300">
                        <Play className="w-5 h-5 text-pink-500 ml-0.5" />
                      </div>
                      <h3 className="text-white text-lg font-semibold mb-1">{video.title}</h3>
                      <p className="text-gray-200 text-sm line-clamp-2">{video.description}</p>
                    </motion.div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-pink-600 transition-colors">
                        {video.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{video.description}</p>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-pink-50 text-pink-700 border border-pink-100">
                      {video.category}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
          
          {filteredVideos.length === 0 && (
            <motion.div 
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-xl font-medium text-gray-900 mb-2">No videos found</h3>
              <p className="text-gray-500">Try selecting a different category or check back later for new content.</p>
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Video Modal */}
      <AnimatePresence>
        {isClient && selectedVideo && (
          <motion.div 
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ 
              opacity: 1,
              backdropFilter: 'blur(8px)',
              transition: { duration: 0.3 }
            }}
            exit={{ 
              opacity: 0,
              backdropFilter: 'blur(0px)',
              transition: { duration: 0.2 }
            }}
            onClick={closeVideo}
          >
            <motion.div 
              className="relative w-full max-w-4xl"
              initial={{ y: 20, opacity: 0, scale: 0.98 }}
              animate={{ 
                y: 0, 
                opacity: 1, 
                scale: 1,
                transition: { 
                  delay: 0.1,
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1]
                }
              }}
              exit={{ 
                y: 20, 
                opacity: 0,
                scale: 0.98,
                transition: { duration: 0.2 }
              }}
              onClick={e => e.stopPropagation()}
            >
              <motion.button 
                className="absolute -top-10 right-0 text-white hover:text-pink-300 transition-colors"
                onClick={closeVideo}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Close video"
              >
                <X className="w-6 h-6" />
              </motion.button>
              
              <div className="aspect-w-16 aspect-h-9 w-full overflow-hidden rounded-xl shadow-2xl">
                {selectedVideo.format === 'youtube' ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    <iframe
                      src={selectedVideo.videoUrl}
                      title={selectedVideo.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-[500px] rounded-lg"
                      loading="lazy"
                    />
                  </motion.div>
                ) : (
                  <motion.div 
                    className="relative w-full h-[500px] bg-black rounded-lg overflow-hidden"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    <video
                      key={selectedVideo.id}
                      controls
                      className="w-full h-full object-contain"
                      poster={selectedVideo.thumbnail}
                      autoPlay
                    >
                      <source 
                        src={selectedVideo.videoUrl} 
                        type={`video/${selectedVideo.format}`} 
                      />
                      Your browser does not support the video tag.
                    </video>
                  </motion.div>
                )}
              </div>
              <motion.div 
                className="mt-6 text-white px-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-2xl font-bold mb-1">{selectedVideo.title}</h2>
                <p className="text-gray-300 text-sm">{selectedVideo.description}</p>
                <div className="mt-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/90 border border-white/20">
                    {selectedVideo.category}
                  </span>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GalleryPage;
