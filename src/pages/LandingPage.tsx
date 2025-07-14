import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchHero } from '../components/SearchHero';
import { FeatureGrid } from '../components/FeatureGrid';
import { ExampleQueries } from '../components/ExampleQueries';
import { VisualSearch } from '../components/VisualSearch';
import { FloatingBubbles } from '../components/FloatingBubbles';
import { parseQuery } from '../utils/queryParser';
import { motion, AnimatePresence } from 'framer-motion';
import WalmartSpark from '../assets/walmart-spark.png';
import { LocalProductSearch } from '../services/localProductSearch';
import { ProductProcessor } from '../services/productProcessor';
import { rawWalmartProducts } from '../data/mockProducts';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [isVisualSearchOpen, setIsVisualSearchOpen] = useState(false);
  const [showElements, setShowElements] = useState([false, false, false]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Staggered animation triggers
    const timers = [
      setTimeout(() => setShowElements([true, false, false]), 500),
      setTimeout(() => setShowElements([true, true, false]), 1000),
      setTimeout(() => setShowElements([true, true, true]), 1500)
    ];
    
    return () => timers.forEach(timer => clearTimeout(timer));
  }, []);

  useEffect(() => {
    // Mouse tracking for interactive effects
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    
    try {
      // Initialize the product search service (same as Wally Assistant)
      const processedProducts = ProductProcessor.processProducts(rawWalmartProducts);
      const productSearch = new LocalProductSearch(processedProducts);
      
      // Search for products using the same logic as Wally Assistant
      const searchResults = productSearch.searchProducts(query);
      const aiResponse = productSearch.generateAIResponse(query, searchResults);
      
      // Enhanced AI processing simulation with visual feedback
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const parsedQuery = parseQuery(query);
      
      // Navigate to products page with search results
      navigate('/products', { 
        state: { 
          query, 
          parsedQuery,
          searchPerformed: true,
          searchResults: searchResults.slice(0, 50), // Limit to 50 results for display
          aiResponse: aiResponse,
          totalResults: searchResults.length
        } 
      });
      
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to original search method
      const parsedQuery = parseQuery(query);
      navigate('/products', { 
        state: { 
          query, 
          parsedQuery,
          searchPerformed: true 
        } 
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleVisualSearchClick = () => {
    setIsVisualSearchOpen(true);
  };

  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* Enhanced Background Effects */}
      <FloatingBubbles count={15} />
      
      {/* Interactive Mouse Follower */}
      <motion.div
        className="fixed w-6 h-6 bg-walmart-yellow/20 rounded-full blur-xl pointer-events-none z-0"
        animate={{
          x: mousePosition.x - 12,
          y: mousePosition.y - 12,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 28
        }}
      />

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <SearchHero 
            onSearch={handleSearch} 
            isSearching={isSearching} 
          />
        </motion.div>
        
        {/* Example Queries with Staggered Animation */}
        <AnimatePresence>
          {showElements[0] && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -100 }}
              transition={{ 
                duration: 1.2, 
                delay: 0.3,
                ease: "easeOut"
              }}
            >
              <ExampleQueries 
                onQueryClick={handleSearch} 
                onVisualSearchClick={handleVisualSearchClick}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feature Grid with Enhanced Entrance */}
        <AnimatePresence>
          {showElements[1] && (
            <motion.div
              initial={{ opacity: 0, y: 150, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -150, scale: 0.8 }}
              transition={{ 
                duration: 1.5, 
                delay: 0.6,
                ease: "easeOut"
              }}
            >
              <FeatureGrid />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Section */}
        <AnimatePresence>
          {showElements[2] && (
            <motion.div
              initial={{ opacity: 0, y: 200 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -200 }}
              transition={{ 
                duration: 1.8, 
                delay: 0.9,
                ease: "easeOut"
              }}
            >
              <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-walmart-blue/5 to-walmart-yellow/5 relative overflow-hidden">
                {/* Animated Background Elements */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-walmart-blue/10 via-transparent to-walmart-yellow/10"
                  animate={{
                    background: [
                      'linear-gradient(90deg, rgba(0,76,145,0.1), transparent, rgba(255,194,32,0.1))',
                      'linear-gradient(180deg, rgba(0,76,145,0.1), transparent, rgba(255,194,32,0.1))',
                      'linear-gradient(270deg, rgba(0,76,145,0.1), transparent, rgba(255,194,32,0.1))',
                      'linear-gradient(360deg, rgba(0,76,145,0.1), transparent, rgba(255,194,32,0.1))'
                    ]
                  }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                  <motion.h4 
                    className="text-2xl lg:text-3xl font-bold text-gray-800 mb-4"
                    animate={{
                      textShadow: [
                        '0 0 0 rgba(0,76,145,0)',
                        '2px 2px 8px rgba(0,76,145,0.3)',
                        '0 0 0 rgba(0,76,145,0)',
                        '-2px -2px 8px rgba(255,194,32,0.3)',
                        '0 0 0 rgba(0,76,145,0)'
                      ]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    Ready to Transform Your Shopping Experience?
                  </motion.h4>
                  <motion.p 
                    className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto"
                    initial={{ opacity: 0.8 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                  >
                    Join millions of shoppers who are already using AskWally to find exactly what they need, faster than ever before.
                  </motion.p>
                  
                  <motion.button
                    className="px-12 py-4 bg-gradient-to-r from-walmart-blue via-walmart-blue-light to-walmart-blue-dark text-white text-xl font-bold rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500"
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: '0 25px 50px rgba(0,76,145,0.4)'
                    }}
                    whileTap={{ scale: 0.95 }}
                    animate={{
                      background: [
                        'linear-gradient(90deg, #004c91, #0071ce, #004c91)',
                        'linear-gradient(180deg, #004c91, #0071ce, #004c91)',
                        'linear-gradient(270deg, #004c91, #0071ce, #004c91)',
                        'linear-gradient(360deg, #004c91, #0071ce, #004c91)'
                      ],
                      y: [0, -5, 0]
                    }}
                    transition={{
                      background: { duration: 4, repeat: Infinity, ease: "linear" },
                      y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                    }}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    Start Shopping Now
                  </motion.button>
                </div>
              </footer>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Visual Search Modal */}
      <VisualSearch 
        isOpen={isVisualSearchOpen} 
        onClose={() => setIsVisualSearchOpen(false)} 
      />
    </div>
  );
};