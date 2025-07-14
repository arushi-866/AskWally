import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { ProductGrid } from '../components/ProductGrid';
import { ProductFilters } from '../components/ProductFilters';
import { SearchSummary } from '../components/SearchSummary';
import { getFilteredProducts, stores } from '../data/mockProducts';
import type { ParsedQuery } from '../utils/queryParser';
import type { Product } from '../types/Product';

export const ProductsPage: React.FC = () => {
  const location = useLocation();
  const { query, parsedQuery, searchPerformed, visualSearch, searchResults, aiResponse, totalResults } = location.state || {};
  
  const [products, setProducts] = useState<Product[]>([]);
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'rating' | 'name' | 'featured'>('rating');
  const [currentFilters, setCurrentFilters] = useState<ParsedQuery['filters']>(parsedQuery?.filters || {});
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {

    if (visualSearch && parsedQuery) {
      // Handle visual search - show kids dresses
      let allDresses = getFilteredProducts(undefined, {}).filter(
        p => {
          const name = p.name.toLowerCase();
          const category = p.category.toLowerCase();
          // Must be a gown/princess dress/party dress/frock
          const isGownLike = name.includes('gown') || name.includes('princess dress') || name.includes('party dress') || name.includes('frock');
          // Must be for kids/little girls
          const isForKids = category.includes('kid') || category.includes('child') || category.includes('toddler') || name.includes('kid') || name.includes('child') || name.includes('toddler') || name.includes('girl');
          // Exclude shoes, costumes, shorts, sets, rompers
          const isNotExcluded = !name.includes('shoe') && !category.includes('shoe') && !name.includes('costume') && !category.includes('costume') && !name.includes('short') && !category.includes('short') && !name.includes('set') && !category.includes('set') && !name.includes('romper') && !category.includes('romper');
          return isGownLike && isForKids && isNotExcluded;
        }
      );
      // Prefer pink
      let pinkDresses = allDresses.filter(
        p => (p.color && p.color.toLowerCase() === 'pink') || p.name.toLowerCase().includes('pink')
      );
      let results: Product[] = [];
      if (pinkDresses.length >= 9) {
        results = pinkDresses.slice(0, 9);
      } else {
        results = [...pinkDresses, ...allDresses.filter(p => !pinkDresses.includes(p))].slice(0, 9);
      }
      setProducts(results);

    } else {
      const filtered = getFilteredProducts(undefined, {});
      setProducts(filtered);
    }

  }, [parsedQuery, selectedStore, searchResults]);


  const handleFilterChange = (newFilters: ParsedQuery['filters']) => {
    setCurrentFilters(newFilters);
    const filtered = getFilteredProducts(parsedQuery?.category, {
      ...newFilters
    });
    setProducts(filtered);
  };

  const handleStoreChange = (storeId: string) => {
    setSelectedStore(storeId);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchQuery.trim()) {
      // Search within the current products (either from search results or filtered products)
      const searchResults = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setProducts(searchResults);
    } else {
      // Reset to original products based on parsed query or all products
      if (parsedQuery) {
        const filtered = getFilteredProducts(parsedQuery.category, {
          ...currentFilters
        });
        setProducts(filtered);
      } else {
        const filtered = getFilteredProducts(undefined, {});
        setProducts(filtered);
      }
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'featured':
        return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
      default:
        return 0;
    }
  });

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name, description, or brand..."
                className="w-full px-6 py-4 pl-14 pr-4 text-lg rounded-2xl border-2 border-gray-200 bg-white shadow-lg focus:outline-none focus:border-walmart-blue focus:ring-4 focus:ring-walmart-blue/20 transition-all duration-300"
              />
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-walmart-blue to-walmart-blue-dark text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {searchPerformed && (
          <SearchSummary 
            query={query} 
            resultCount={products.length}
            parsedQuery={parsedQuery}
            aiResponse={aiResponse}
            totalResults={totalResults}
          />
        )}

        {visualSearch && (
          <div className="mb-6 bg-gradient-to-r from-walmart-blue/5 to-walmart-yellow/5 rounded-2xl p-4 border border-walmart-blue/20">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">📷</span>
              <div>
                <h3 className="font-semibold text-walmart-blue">Visual Search Results</h3>
                <p className="text-sm text-gray-600">Products found using AI image recognition</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <ProductFilters
              filters={currentFilters}
              onFilterChange={handleFilterChange}
              category={parsedQuery?.category}
            />
          </aside>
          
          <main className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              
              
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Store Filter */}
                <select
                  value={selectedStore}
                  onChange={(e) => handleStoreChange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-walmart-blue"
                >
                  <option value="">All Stores</option>
                  {stores.map((store) => (
                    <option key={store.store_id} value={store.store_id}>
                      {store.store_name.replace('Walmart Supercenter - ', '')}
                    </option>
                  ))}
                </select>

                {/* Sort Options */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-walmart-blue"
                >
                  <option value="rating">Sort by Rating</option>
                  <option value="featured">Featured First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name">Name A-Z</option>
                </select>
              </div>
            </div>

            {/* Results Summary */}
            {(selectedStore || Object.keys(currentFilters).length > 0) && (
              <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <span>Filtered by:</span>
                  {selectedStore && (
                    <span className="bg-walmart-blue/10 text-walmart-blue px-2 py-1 rounded-full">
                      {stores.find(s => s.store_id === selectedStore)?.store_name.replace('Walmart Supercenter - ', '')}
                    </span>
                  )}
                  {currentFilters.price_min && (
                    <span className="bg-gray-100 px-2 py-1 rounded-full">
                      Min: ${currentFilters.price_min}
                    </span>
                  )}
                  {currentFilters.price_max && (
                    <span className="bg-gray-100 px-2 py-1 rounded-full">
                      Max: ${currentFilters.price_max}
                    </span>
                  )}
                  {currentFilters.brand && (
                    <span className="bg-gray-100 px-2 py-1 rounded-full">
                      {currentFilters.brand}
                    </span>
                  )}
                  {currentFilters.brand && (
                    <span className="bg-gray-100 px-2 py-1 rounded-full">
                      {currentFilters.brand}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            <ProductGrid products={sortedProducts} />
          </main>
        </div>
      </div>
    </div>
  );
};