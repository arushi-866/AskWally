// Fixed ollamaService.ts with proper return types
import type { Product } from '../data/mockProducts';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface AIResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface SearchResult {
  products: Product[];
  response: string;
  action: string;
  entities: any;
  success: boolean;
}

export interface WallyServiceResponse {
  message: string;
  products?: Product[];
  action?: string;
  success: boolean;
}

class OllamaService {
  private isConnected = false;
  
  constructor() {
    this.checkConnection();
  }

private async checkConnection(): Promise<void> {
  try {
    console.log('Checking connection to:', `${API_BASE_URL}/ai/status`);
    
    const response = await fetch(`${API_BASE_URL}/ai/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    this.isConnected = data.success && data.data.ollama_connected;
    console.log(`🤖 Ollama Status: ${this.isConnected ? 'Connected' : 'Disconnected'}`);
  } catch (error) {
    console.warn('Failed to check Ollama status:', error);
    console.warn('Make sure your backend is running on http://localhost:5000');
    this.isConnected = false;
  }
}

  async processUserInput(
    input: string,
    context?: any,
    _addToWishlist?: (product: any) => void,
    _addToCart?: (product: Product) => void,
    _navigate?: (path: string, state?: any) => void
  ): Promise<WallyServiceResponse> {
    try {
      if (this.isSearchQuery(input)) {
        return await this.searchProducts(input);
      }

      const response = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, context })
      });

      const data: AIResponse = await response.json();

      return {
        message: data.message || 'I\'m here to help! What can I find for you?',
        success: data.success,
        action: 'chat'
      };

    } catch (error) {
      console.error('Error processing user input:', error);
      return {
        message: 'Sorry, I\'m having trouble right now. Please try again.',
        success: false,
        action: 'error'
      };
    }
  }

  async searchProducts(query: string): Promise<WallyServiceResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      const data: AIResponse = await response.json();

      return {
        message: data.message || `Found products for "${query}"`,
        products: data.data?.products || [],
        success: data.success,
        action: 'search_products'
      };

    } catch (error) {
      console.error('Error searching products:', error);
      return {
        message: 'Sorry, I couldn\'t search for products right now.',
        success: false,
        action: 'error'
      };
    }
  }

  private isSearchQuery(input: string): boolean {
    const searchKeywords = ['find', 'search', 'show', 'product', 'buy', 'looking for', 'need'];
    const lowerInput = input.toLowerCase();
    return searchKeywords.some(keyword => lowerInput.includes(keyword));
  }

  async isAvailable(): Promise<boolean> {
    await this.checkConnection();
    return this.isConnected;
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  async reconnect(): Promise<boolean> {
    await this.checkConnection();
    return this.isConnected;
  }

  // Legacy methods for compatibility
  async getChatResponse(message: string, context?: any): Promise<string> {
    const response = await this.processUserInput(message, context);
    return response.message;
  }

  getCurrentModel(): string {
    return 'Backend API';
  }
}

export const ollamaService = new OllamaService();