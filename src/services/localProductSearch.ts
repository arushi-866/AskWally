// src/services/localProductSearch.ts
import { ProcessedProduct } from '../types/Product';

export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  searchText?: string;
  colors?: string[];
  rating?: number;
}

export class LocalProductSearch {
  private products: ProcessedProduct[];

  constructor(products: ProcessedProduct[]) {
    this.products = products;
  }

  searchProducts(query: string): ProcessedProduct[] {
    const filters = this.parseQuery(query);
    const results = this.filterProducts(filters);
    
    // Calculate relevance scores for better sorting
    const scoredResults = results.map(product => ({
      product,
      score: this.calculateRelevanceScore(product, query, filters)
    }));
    
    // Sort by relevance score (higher first), then by rating, then by price
    return scoredResults
      .sort((a, b) => {
        // First by relevance score
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        
        // Then by rating (higher first)
        if (b.product.rating !== a.product.rating) {
          return b.product.rating - a.product.rating;
        }
        
        // Then by price (lower first)
        return a.product.price - b.product.price;
      })
      .map(item => item.product);
  }

  private calculateRelevanceScore(product: ProcessedProduct, query: string, filters: SearchFilters): number {
    let score = 0;
    const lowerQuery = query.toLowerCase();
    const productText = `${product.name} ${product.description} ${product.brand} ${product.category} ${product.categories.join(' ')} ${product.tags.join(' ')}`.toLowerCase();
    
    // Exact matches get highest score
    if (product.name.toLowerCase().includes(lowerQuery)) score += 100;
    if (product.brand.toLowerCase().includes(lowerQuery)) score += 80;
    
    // Word-by-word matching
    const queryWords = lowerQuery.split(' ').filter(word => word.length > 2);
    queryWords.forEach(word => {
      if (productText.includes(word)) score += 20;
      if (product.name.toLowerCase().includes(word)) score += 30;
      if (product.brand.toLowerCase().includes(word)) score += 25;
      if (product.category.toLowerCase().includes(word)) score += 15;
    });
    
    // Category matching
    if (filters.category) {
      if (product.category.toLowerCase().includes(filters.category)) score += 40;
      if (product.categories.some(cat => cat.toLowerCase().includes(filters.category!))) score += 35;
    }
    
    // Brand matching
    if (filters.brand && product.brand.toLowerCase().includes(filters.brand.toLowerCase())) {
      score += 50;
    }
    
    // Color matching
    if (filters.colors) {
      filters.colors.forEach(color => {
        if (product.colors.some(productColor => productColor.toLowerCase().includes(color.toLowerCase()))) {
          score += 30;
        }
      });
    }
    
    // Price range bonus
    if (filters.maxPrice && product.price <= filters.maxPrice) score += 10;
    if (filters.minPrice && product.price >= filters.minPrice) score += 10;
    
    // Rating bonus
    if (product.rating >= 4) score += 15;
    if (product.rating >= 4.5) score += 10;
    
    // Availability bonus
    if (product.inStock) score += 5;
    if (product.availableForDelivery) score += 5;
    
    return score;
  }

  private parseQuery(query: string): SearchFilters {
    const lowerQuery = query.toLowerCase();
    const filters: SearchFilters = {};

    // Extract price filters with more patterns
    const pricePatterns = [
      /under\s*\$?(\d+)/,
      /less than\s*\$?(\d+)/,
      /below\s*\$?(\d+)/,
      /up to\s*\$?(\d+)/,
      /maximum\s*\$?(\d+)/,
      /over\s*\$?(\d+)/,
      /more than\s*\$?(\d+)/,
      /above\s*\$?(\d+)/,
      /minimum\s*\$?(\d+)/,
      /at least\s*\$?(\d+)/,
      /cheap/,
      /expensive/,
      /budget/,
      /affordable/
    ];

    // Check for max price patterns
    for (let i = 0; i < 5; i++) {
      const match = lowerQuery.match(pricePatterns[i]);
      if (match) {
        filters.maxPrice = parseInt(match[1]);
        break;
      }
    }

    // Check for min price patterns
    for (let i = 5; i < 9; i++) {
      const match = lowerQuery.match(pricePatterns[i]);
      if (match) {
        filters.minPrice = parseInt(match[1]);
        break;
      }
    }

    // Handle price range indicators
    if (lowerQuery.includes('cheap') || lowerQuery.includes('budget') || lowerQuery.includes('affordable')) {
      filters.maxPrice = 50; // Default cheap threshold
    }
    if (lowerQuery.includes('expensive') || lowerQuery.includes('premium')) {
      filters.minPrice = 100; // Default expensive threshold
    }

    // Extract categories - map to your actual category structure
    const categoryKeywords = {
      // Beauty categories
      'makeup': ['beauty', 'makeup', 'cosmetic', 'skincare', 'perfume', 'foundation', 'concealer', 'powder', 'blush', 'bronzer', 'highlighter'],
      'eyeshadow': ['eye shadow', 'eyeshadow', 'eye makeup', 'mascara', 'lipstick', 'eyeliner', 'brow', 'eyebrow', 'eye primer', 'eye palette'],
      'beauty': ['beauty', 'cosmetics', 'personal care', 'skincare', 'hair care', 'nail care', 'fragrance'],
      'skincare': ['skincare', 'skin care', 'moisturizer', 'cleanser', 'toner', 'serum', 'face mask', 'sunscreen', 'anti-aging'],
      
      // Clothing
      'clothing': ['clothing', 'clothes', 'apparel', 'fashion', 'wear', 'outfit'],
      'shirt': ['shirt', 'tshirt', 't-shirt', 'blouse', 'top', 'tee', 'polo'],
      'shoes': ['shoes', 'footwear', 'sneakers', 'boots', 'sandals', 'heels', 'flats', 'athletic shoes'],
      'dress': ['dress', 'gown', 'outfit', 'evening dress', 'casual dress'],
      'pants': ['pants', 'jeans', 'trousers', 'leggings', 'shorts', 'slacks'],
      'jacket': ['jacket', 'coat', 'blazer', 'hoodie', 'sweater', 'cardigan'],
      
      // Electronics
      'electronics': ['electronics', 'electronic', 'tech', 'technology', 'gadget', 'device'],
      'phone': ['phone', 'mobile', 'smartphone', 'cellphone', 'iphone', 'android'],
      'laptop': ['laptop', 'computer', 'pc', 'desktop', 'notebook', 'macbook'],
      'headphones': ['headphones', 'earbuds', 'earphones', 'wireless headphones'],
      'camera': ['camera', 'photography', 'digital camera', 'webcam'],
      
      // Other categories
      'food': ['food', 'grocery', 'snack', 'beverage', 'drink', 'candy', 'chips', 'cereal'],
      'home': ['home', 'household', 'kitchen', 'garden', 'furniture', 'decor', 'appliance'],
      'toys': ['toys', 'toy', 'games', 'game', 'puzzle', 'board game', 'video game'],
      'books': ['book', 'books', 'reading', 'novel', 'textbook', 'magazine'],
      'sports': ['sports', 'fitness', 'exercise', 'workout', 'gym', 'athletic', 'running'],
      'baby': ['baby', 'infant', 'child', 'diaper', 'formula', 'baby food', 'stroller'],
      'pet': ['pet', 'dog', 'cat', 'animal', 'pet food', 'pet toy', 'pet care'],
      'automotive': ['car', 'automotive', 'vehicle', 'auto', 'car care', 'motor oil'],
      'health': ['health', 'medical', 'pharmacy', 'medicine', 'vitamin', 'supplement'],
      'office': ['office', 'stationery', 'paper', 'pen', 'pencil', 'notebook'],
      'jewelry': ['jewelry', 'necklace', 'ring', 'earring', 'bracelet', 'watch']
    };

    for (const [key, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        filters.category = key;
        break;
      }
    }

    // Extract brand mentions
    const brands = [
      'laura mercier', 'apple', 'samsung', 'nike', 'walmart', 'adidas', 'puma',
      'sony', 'lg', 'hp', 'dell', 'lenovo', 'asus', 'acer', 'microsoft',
      'google', 'amazon', 'target', 'best buy', 'home depot', 'lowes',
      'maybelline', 'loreal', 'revlon', 'covergirl', 'neutrogena', 'cerave',
      'coca cola', 'pepsi', 'kraft', 'nestle', 'kellogg', 'general mills'
    ];
    for (const brand of brands) {
      if (lowerQuery.includes(brand)) {
        filters.brand = brand;
        break;
      }
    }

    // Extract color mentions
    const colors = ['black', 'white', 'red', 'blue', 'green', 'pink', 'purple', 'yellow'];
    const mentionedColors = colors.filter(color => lowerQuery.includes(color));
    if (mentionedColors.length > 0) {
      filters.colors = mentionedColors;
    }

    // Extract rating requirements
    if (lowerQuery.includes('high rated') || lowerQuery.includes('best rated')) {
      filters.rating = 4;
    }

    // Extract search text (remove price and category terms)
    let searchText = query
      .replace(/under\s*\$?\d+/gi, '')
      .replace(/over\s*\$?\d+/gi, '')
      .replace(/less than\s*\$?\d+/gi, '')
      .replace(/more than\s*\$?\d+/gi, '')
      .replace(/below\s*\$?\d+/gi, '')
      .replace(/above\s*\$?\d+/gi, '')
      .replace(/up to\s*\$?\d+/gi, '')
      .replace(/at least\s*\$?\d+/gi, '')
      .replace(/maximum\s*\$?\d+/gi, '')
      .replace(/minimum\s*\$?\d+/gi, '')
      .replace(/show me/gi, '')
      .replace(/find/gi, '')
      .replace(/search/gi, '')
      .replace(/i need/gi, '')
      .replace(/looking for/gi, '')
      .replace(/want/gi, '')
      .replace(/get/gi, '')
      .replace(/buy/gi, '')
      .replace(/help me/gi, '')
      .replace(/can you/gi, '')
      .replace(/please/gi, '')
      .replace(/thanks/gi, '')
      .replace(/thank you/gi, '')
      .trim();

    if (searchText) {
      filters.searchText = searchText;
    }

    return filters;
  }

  private filterProducts(filters: SearchFilters): ProcessedProduct[] {
    return this.products.filter(product => {
      // Price filters
      if (filters.minPrice && product.price < filters.minPrice) return false;
      if (filters.maxPrice && product.price > filters.maxPrice) return false;

      // Category filter - check both category and categories array
      if (filters.category) {
        const categoryMatch = 
          product.category.toLowerCase().includes(filters.category) ||
          product.categories.some(cat => cat.toLowerCase().includes(filters.category!));
        
        if (!categoryMatch) return false;
      }

      // Brand filter - more flexible matching
      if (filters.brand) {
        const brandMatch = 
          product.brand.toLowerCase().includes(filters.brand.toLowerCase()) ||
          filters.brand.toLowerCase().includes(product.brand.toLowerCase());
        
        if (!brandMatch) return false;
      }

      // Color filter - more flexible matching
      if (filters.colors && filters.colors.length > 0) {
        const hasColor = filters.colors.some(color => 
          product.colors.some(productColor => 
            productColor.toLowerCase().includes(color.toLowerCase()) ||
            color.toLowerCase().includes(productColor.toLowerCase())
          )
        );
        if (!hasColor) return false;
      }

      // Rating filter
      if (filters.rating && product.rating < filters.rating) {
        return false;
      }

      // Text search in name, description, brand, categories - improved matching
      if (filters.searchText) {
        const searchFields = [
          product.name,
          product.description,
          product.brand,
          product.category,
          ...product.categories,
          ...product.tags
        ].join(' ').toLowerCase();

        const searchTerms = filters.searchText.toLowerCase().split(' ').filter(term => term.length > 1);
        
        // If no meaningful search terms, return all products
        if (searchTerms.length === 0) return true;
        
        // Check if any search term matches any field (more flexible)
        const hasAnyTerm = searchTerms.some(term => {
          // Check for exact matches first
          if (searchFields.includes(term)) return true;
          
          // Check for partial matches
          return searchFields.split(' ').some(fieldWord => 
            fieldWord.includes(term) || term.includes(fieldWord)
          );
        });
        
        if (!hasAnyTerm) return false;
      }

      return true;
    });
  }

  generateAIResponse(query: string, products: ProcessedProduct[]): string {
    if (products.length === 0) {
      return `I couldn't find any products matching "${query}". Try searching for different terms or browse our categories like Beauty, Electronics, Clothing, Food, or Home & Garden!`;
    }

    const filters = this.parseQuery(query);
    let response = `Great! I found ${products.length} product${products.length > 1 ? 's' : ''} for you! `;

    if (filters.maxPrice) {
      response += `All items are under $${filters.maxPrice}. `;
    }

    if (filters.category) {
      response += `Here are the best ${filters.category} options `;
    }

    if (products.length > 0) {
      const topProducts = products.slice(0, 3).map(p => 
        `"${p.name}" by ${p.brand} ($${p.price.toFixed(2)})`
      );
      response += `including: ${topProducts.join(', ')}.`;
    }

    if (products.length > 3) {
      response += ` Click "View All" to see all ${products.length} results!`;
    }

    // Add helpful suggestions
    if (products.length > 0) {
      const avgPrice = products.reduce((sum, p) => sum + p.price, 0) / products.length;
      response += ` 💡 Average price: $${avgPrice.toFixed(2)}`;
      
      if (products.some(p => p.availableForDelivery)) {
        response += ` 🚚 Many items available for delivery!`;
      }
      
      // Add rating info if available
      const highRatedProducts = products.filter(p => p.rating >= 4);
      if (highRatedProducts.length > 0) {
        response += ` ⭐ ${highRatedProducts.length} highly rated items!`;
      }
      
      // Add price range info
      const prices = products.map(p => p.price).sort((a, b) => a - b);
      const priceRange = `$${prices[0].toFixed(2)} - $${prices[prices.length - 1].toFixed(2)}`;
      response += ` 📊 Price range: ${priceRange}`;
      
      // Add category diversity info
      const categories = [...new Set(products.map(p => p.category))];
      if (categories.length > 1) {
        response += ` 🏷️ Found across ${categories.length} categories`;
      }
    }

    return response;
  }
}