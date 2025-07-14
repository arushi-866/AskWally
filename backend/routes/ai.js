import express from 'express';
import { ollamaService } from '../services/ollamaService.js';
import Product from '../models/products.js'; // Fixed: Changed from Products to Product

const router = express.Router();

// @desc    Process AI chat message with product search
// @route   POST /api/ai/chat
// @access  Public
router.post('/chat', async (req, res, next) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Check if the message is asking about products
    const isProductQuery = await isProductSearchQuery(message);
    
    if (isProductQuery) {
      // Handle product search
      const searchResult = await handleProductSearch(message);
      return res.json({
        success: true,
        message: searchResult.message,
        products: searchResult.products,
        isProductSearch: true,
        timestamp: new Date().toISOString()
      });
    }

    // Handle general chat
    let response;
    if (ollamaService.isAvailable()) {
      response = await ollamaService.getChatResponse(message, context);
    } else {
      response = "I'm here to help with your shopping needs! Try asking me about specific products like 'show me t-shirts under $10' or 'find me electronics'.";
    }

    res.json({
      success: true,
      message: response,
      isProductSearch: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Sorry, I encountered an error. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper function to detect product search queries
async function isProductSearchQuery(message) {
  const productKeywords = [
    'show me', 'find', 'search', 'looking for', 'need', 'want', 'buy',
    'tshirt', 't-shirt', 'shirt', 'electronics', 'phone', 'laptop', 'shoes',
    'under', 'price', 'cheap', 'expensive', 'dollar', '$', 'category',
    'brand', 'product', 'item', 'clothing', 'food', 'toy', 'book'
  ];
  
  const lowerMessage = message.toLowerCase();
  return productKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Enhanced product search function
async function handleProductSearch(query) {
  try {
    // Extract filters from query
    const filters = extractFiltersFromQuery(query);
    
    // Build search criteria
    let searchCriteria = {};
    
    // Text search
    if (filters.searchText) {
      searchCriteria.$text = { $search: filters.searchText };
    }
    
    // Category filter
    if (filters.category) {
      searchCriteria.category = new RegExp(filters.category, 'i');
    }
    
    // Price filters
    if (filters.minPrice || filters.maxPrice) {
      searchCriteria.price = {};
      if (filters.minPrice) searchCriteria.price.$gte = filters.minPrice;
      if (filters.maxPrice) searchCriteria.price.$lte = filters.maxPrice;
    }
    
    // In stock filter
    searchCriteria.inStock = true;
    
    // Search products
    const products = await Product.find(searchCriteria)
      .sort({ rating: -1, price: 1 })
      .limit(10);
    
    // Generate AI response
    let aiMessage;
    if (ollamaService.isAvailable()) {
      aiMessage = await ollamaService.processProductQuery(query, products);
    } else {
      aiMessage = generateFallbackMessage(query, products, filters);
    }
    
    return {
      message: aiMessage,
      products: products
    };
    
  } catch (error) {
    console.error('Product search error:', error);
    return {
      message: "I'm having trouble searching for products right now. Please try again!",
      products: []
    };
  }
}

// Extract filters from natural language query
function extractFiltersFromQuery(query) {
  const filters = {};
  const lowerQuery = query.toLowerCase();
  
  // Extract price filters
  const priceMatch = lowerQuery.match(/under\s*\$?(\d+)|less than\s*\$?(\d+)|below\s*\$?(\d+)/);
  if (priceMatch) {
    filters.maxPrice = parseInt(priceMatch[1] || priceMatch[2] || priceMatch[3]);
  }
  
  const minPriceMatch = lowerQuery.match(/over\s*\$?(\d+)|more than\s*\$?(\d+)|above\s*\$?(\d+)/);
  if (minPriceMatch) {
    filters.minPrice = parseInt(minPriceMatch[1] || minPriceMatch[2] || minPriceMatch[3]);
  }
  
  // Extract category
  const categories = {
    'tshirt': 'clothing',
    't-shirt': 'clothing',
    'shirt': 'clothing',
    'clothing': 'clothing',
    'electronics': 'electronics',
    'phone': 'electronics',
    'laptop': 'electronics',
    'food': 'food',
    'shoes': 'footwear'
  };
  
  for (const [keyword, category] of Object.entries(categories)) {
    if (lowerQuery.includes(keyword)) {
      filters.category = category;
      break;
    }
  }
  
  // Extract search text (remove price and category terms)
  let searchText = query
    .replace(/under\s*\$?\d+/gi, '')
    .replace(/less than\s*\$?\d+/gi, '')
    .replace(/show me/gi, '')
    .replace(/find/gi, '')
    .replace(/search/gi, '')
    .trim();
  
  if (searchText) {
    filters.searchText = searchText;
  }
  
  return filters;
}

// Fallback message when Ollama is not available
function generateFallbackMessage(query, products, filters) {
  if (products.length === 0) {
    return `I couldn't find any products matching "${query}". Try searching for different terms or check our categories!`;
  }
  
  let message = `I found ${products.length} products for you! `;
  
  if (filters.maxPrice) {
    message += `All items are under $${filters.maxPrice}. `;
  }
  
  if (products.length > 0) {
    message += `Here are some great options: ${products.slice(0, 3).map(p => p.name).join(', ')}.`;
  }
  
  return message;
}

// Keep your existing search and status routes
router.post('/search', async (req, res, next) => {
  try {
    const { query, filters = {} } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    let searchCriteria = {
      $text: { $search: query }
    };

    // Apply filters
    if (filters.category) {
      searchCriteria.category = new RegExp(filters.category, 'i');
    }
    if (filters.brand) {
      searchCriteria.brand = new RegExp(filters.brand, 'i');
    }
    if (filters.minPrice || filters.maxPrice) {
      searchCriteria.price = {};
      if (filters.minPrice) searchCriteria.price.$gte = filters.minPrice;
      if (filters.maxPrice) searchCriteria.price.$lte = filters.maxPrice;
    }
    if (filters.minRating) {
      searchCriteria.rating = { $gte: filters.minRating };
    }

    const products = await Product.find(searchCriteria)
      .sort({ score: { $meta: 'textScore' }, rating: -1 })
      .limit(20);

    let aiResponse = '';
    if (ollamaService.isAvailable()) {
      try {
        aiResponse = await ollamaService.processProductQuery(query, products);
      } catch (error) {
        console.error('AI processing error:', error);
        aiResponse = `I found ${products.length} products matching "${query}". Here are the results!`;
      }
    } else {
      aiResponse = `Found ${products.length} products for "${query}". Showing the most relevant results.`;
    }

    res.json({
      success: true,
      message: aiResponse,
      data: {
        products,
        total: products.length,
        query,
        filters: filters
      }
    });

  } catch (error) {
    console.error('AI search error:', error);
    next(error);
  }
});

router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      ollama_connected: ollamaService.isAvailable(),
      status: ollamaService.isAvailable() ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    }
  });
});

export default router;