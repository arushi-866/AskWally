import React, { useState, useEffect } from 'react';
import { ollamaService } from '../services/ollamaService';

const OllamaTest: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [currentModel, setCurrentModel] = useState('');

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const isConnected = await ollamaService.isAvailable();
      setConnectionStatus(isConnected);
      
      if (isConnected) {
        const models = await ollamaService.getAvailableModels();
        setAvailableModels(models);
        setCurrentModel(ollamaService.getCurrentModel());
      }
    } catch (error) {
      console.error('Error checking Ollama connection:', error);
      setConnectionStatus(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const result = await ollamaService.searchProducts(query);
      setResponse(result);
    } catch (error) {
      console.error('Search error:', error);
      setResponse({
        success: false,
        response: 'Error: ' + (error as Error).message,
        products: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChatTest = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const chatResponse = await ollamaService.getChatResponse(query);
      setResponse({
        success: true,
        response: chatResponse,
        products: [],
        action: 'chat'
      });
    } catch (error) {
      console.error('Chat error:', error);
      setResponse({
        success: false,
        response: 'Error: ' + (error as Error).message,
        products: []
      });
    } finally {
      setLoading(false);
    }
  };

  const sampleQueries = [
    "Show me affordable laptops under $500",
    "I need a red dress for a party",
    "What are the best headphones for gaming?",
    "Compare smartphones with good cameras",
    "Find eco-friendly cleaning products"
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">🤖 Ollama AI Integration Test</h2>
      
      {/* Connection Status */}
      <div className="mb-6 p-4 rounded-lg border">
        <h3 className="font-semibold mb-2">Connection Status</h3>
        <div className="flex items-center gap-2 mb-2">
          <span className={`w-3 h-3 rounded-full ${connectionStatus ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className={connectionStatus ? 'text-green-600' : 'text-red-600'}>
            {connectionStatus === null ? 'Checking...' : connectionStatus ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        
        {connectionStatus && (
          <div className="text-sm text-gray-600">
            <p><strong>Current Model:</strong> {currentModel}</p>
            <p><strong>Available Models:</strong> {availableModels.join(', ') || 'None'}</p>
          </div>
        )}
        
        {!connectionStatus && connectionStatus !== null && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
            <p className="text-yellow-800 font-medium">Ollama not connected</p>
            <p className="text-yellow-700">
              Please ensure Ollama is running: <code className="bg-yellow-100 px-1 rounded">ollama run llama3.2</code>
            </p>
            <button 
              onClick={checkConnection}
              className="mt-2 px-3 py-1 bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300"
            >
              Retry Connection
            </button>
          </div>
        )}
      </div>

      {/* Query Input */}
      <div className="mb-6">
        <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
          Ask Wally anything about products:
        </label>
        <div className="flex gap-2">
          <input
            id="query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Show me red winter jackets under $100"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={loading || !connectionStatus}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? '🔄' : '🔍'} Search
          </button>
          <button
            onClick={handleChatTest}
            disabled={loading || !connectionStatus}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? '🔄' : '💬'} Chat
          </button>
        </div>
      </div>

      {/* Sample Queries */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Try these sample queries:</h3>
        <div className="flex flex-wrap gap-2">
          {sampleQueries.map((sample, index) => (
            <button
              key={index}
              onClick={() => setQuery(sample)}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Response */}
      {response && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Response:</h3>
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="mb-3">
              <span className={`inline-block px-2 py-1 rounded text-sm ${
                response.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {response.success ? '✅ Success' : '❌ Error'}
              </span>
              {response.action && (
                <span className="ml-2 inline-block px-2 py-1 rounded text-sm bg-blue-100 text-blue-800">
                  Action: {response.action}
                </span>
              )}
            </div>
            
            <div className="mb-3">
              <strong>AI Response:</strong>
              <p className="mt-1 text-gray-700">{response.response}</p>
            </div>

            {response.products && response.products.length > 0 && (
              <div>
                <strong>Products Found ({response.products.length}):</strong>
                <div className="mt-2 space-y-2">
                  {response.products.slice(0, 3).map((product: any, index: number) => (
                    <div key={index} className="p-2 bg-white border rounded text-sm">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-gray-600">
                        {product.brand} • ${product.price} • ⭐ {product.rating} ({product.reviewCount} reviews)
                      </div>
                      <div className="text-xs text-gray-500">{product.category}</div>
                    </div>
                  ))}
                  {response.products.length > 3 && (
                    <div className="text-sm text-gray-500">
                      ... and {response.products.length - 3} more products
                    </div>
                  )}
                </div>
              </div>
            )}

            {response.entities && (
              <div className="mt-3 pt-3 border-t">
                <strong>Extracted Entities:</strong>
                <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(response.entities, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">🚀 Getting Started</h3>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. Install Ollama: <a href="https://ollama.ai/download" className="underline" target="_blank" rel="noopener noreferrer">https://ollama.ai/download</a></li>
          <li>2. Run in terminal: <code className="bg-blue-100 px-1 rounded">ollama run llama3.2</code></li>
          <li>3. Wait for the model to download (first time only)</li>
          <li>4. Refresh this page and test the integration!</li>
        </ol>
        
        <div className="mt-3 pt-3 border-t border-blue-200">
          <p className="text-xs text-blue-600">
            <strong>Note:</strong> This component is for testing purposes. The AI integration is already 
            built into your search components and Wally assistant throughout the app.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OllamaTest;
