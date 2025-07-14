import fetch from 'node-fetch';

class BackendOllamaService {
  constructor() {
    this.baseUrl = 'http://localhost:11434';
    this.model = 'llama3.2:latest';
    this.isConnected = false;
    this.initializeOllama();
  }

  async initializeOllama() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        console.warn('⚠️  Ollama not running on localhost:11434');
        console.warn('💡 Please run: ollama run llama3.2');
        return;
      }
      
      const data = await response.json();
      console.log('✅ Ollama connected successfully!');
      
      if (data.models && data.models.length > 0) {
        this.model = data.models[0].name;
        console.log(`🤖 Using model: ${this.model}`);
      }
      
      this.isConnected = true;
    } catch (error) {
      console.warn('❌ Failed to connect to Ollama:', error.message);
    }
  }

  async generateResponse(prompt, options = {}) {
    if (!this.isConnected) {
      throw new Error('Ollama not connected. Please ensure Ollama is running.');
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            top_k: 40,
            ...options
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error calling Ollama:', error);
      throw error;
    }
  }

  async processProductQuery(query, products) {
    const prompt = `You are Wally, a helpful Walmart shopping assistant. Based on the user's query, help them find relevant products.

AVAILABLE PRODUCTS (${products.length} items):
${products.slice(0, 10).map(p => `• ${p.name} - ${p.brand} - $${p.price} - ${p.category}`).join('\n')}

USER QUERY: "${query}"

Provide a helpful response and suggest the most relevant products. Be conversational and friendly.
If products match their query, mention specific product names and why they might be good choices.
If no products match well, suggest alternative search terms or related categories.

Keep response concise but helpful (2-3 sentences max).`;

    try {
      return await this.generateResponse(prompt);
    } catch (error) {
      return `I found ${products.length} products for "${query}". Let me know if you'd like me to help you narrow down the options!`;
    }
  }

  async getChatResponse(message, context = {}) {
    const prompt = `You are Wally, Walmart's friendly AI shopping assistant. Help customers with shopping questions, product recommendations, and general inquiries.

CONTEXT: ${JSON.stringify(context, null, 2)}

CUSTOMER MESSAGE: "${message}"

Provide a helpful, friendly response. If they're asking about products, guide them to search or ask follow-up questions to better understand their needs.`;

    try {
      return await this.generateResponse(prompt);
    } catch (error) {
      return "I'm here to help with your shopping needs! Feel free to ask me about products, prices, or anything else you're looking for.";
    }
  }

  isAvailable() {
    return this.isConnected;
  }
}

export const ollamaService = new BackendOllamaService();