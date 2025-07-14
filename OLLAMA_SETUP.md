# 🤖 Ollama Integration Setup Guide

This guide will help you set up Ollama for local AI-powered product search and chat functionality in your AskWally application.

## 📋 Prerequisites

- Windows 10/11 or macOS/Linux
- At least 8GB RAM (16GB recommended for better performance)
- Internet connection for initial model download

## 🚀 Installation Steps

### Step 1: Install Ollama

#### For Windows:
1. Visit [https://ollama.ai/download](https://ollama.ai/download)
2. Download the Windows installer
3. Run the installer and follow the setup wizard
4. Ollama will be available in your system tray

#### For macOS:
```bash
brew install ollama
```

#### For Linux:
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Step 2: Download and Run a Model

Open your terminal/command prompt and run:

```bash
# Download and run Llama 3.2 (recommended for this project)
ollama run llama3.2

# Alternative models you can try:
# ollama run llama3.1        # Larger, more capable
# ollama run phi3           # Smaller, faster
# ollama run mistral        # Good balance of size and capability
```

The first run will download the model (this may take several minutes depending on your internet speed).

### Step 3: Verify Installation

1. Open a new terminal window
2. Run: `ollama list`
3. You should see your downloaded model listed

### Step 4: Test the API

```bash
curl http://localhost:11434/api/tags
```

You should see a JSON response with your available models.

## 🔧 Configuration

### Model Selection

You can change the model used by the application by calling:

```typescript
import { ollamaService } from './src/services/ollamaService';

// Set a different model
await ollamaService.setModel('llama3.1');
```

### Available Models and Recommendations

| Model | Size | Speed | Quality | Best For |
|-------|------|-------|---------|----------|
| `llama3.2` | ~2GB | Fast | Good | **Recommended** - Product search and chat |
| `llama3.1` | ~4.7GB | Medium | Excellent | Complex queries and detailed responses |
| `phi3` | ~2.3GB | Very Fast | Good | Quick responses, limited context |
| `mistral` | ~4.1GB | Medium | Very Good | Balanced performance |

## 🎯 Features Enabled

With Ollama integration, your AskWally app now supports:

### 🔍 Intelligent Product Search
- Natural language queries: *"Show me affordable blue shirts for men"*
- Intent recognition: *"Add this to my cart"* or *"Compare these products"*
- Smart filtering based on user descriptions

### 💬 Conversational AI Assistant
- Context-aware responses
- Product recommendations
- Shopping advice and suggestions

### 🧠 Enhanced Understanding
- Brand recognition: *"I want something like Nike but cheaper"*
- Category inference: *"I need something for cooking pasta"*
- Price range interpretation: *"affordable"*, *"premium"*, *"budget-friendly"*

## 🛠️ Development Usage

### Basic Search
```typescript
import { ollamaService } from './src/services/ollamaService';

const result = await ollamaService.searchProducts("red winter jackets under $50");
console.log(result.products); // Array of matching products
console.log(result.response); // AI-generated response
```

### Chat Interaction
```typescript
const response = await ollamaService.getChatResponse(
  "What's the best laptop for students?",
  { userPreferences: { budget: 500 } }
);
console.log(response); // Helpful AI response
```

### Product Recommendations
```typescript
const recommendations = await ollamaService.getProductRecommendations("product_id_123");
console.log(recommendations.products); // Similar/complementary products
```

## 🔍 Troubleshooting

### Ollama Not Starting
- **Windows**: Check system tray for Ollama icon
- **macOS/Linux**: Run `ollama serve` in terminal
- **All platforms**: Verify port 11434 is available

### Model Not Found
```bash
# List available models
ollama list

# Download a model
ollama pull llama3.2
```

### Connection Issues
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not working, restart Ollama
# Windows: Right-click tray icon → Restart
# macOS/Linux: killall ollama && ollama serve
```

### Performance Issues
- **Slow responses**: Try a smaller model like `phi3`
- **Memory issues**: Close other applications or upgrade RAM
- **Model loading**: Models are cached after first use

## 📊 Monitoring

### Check Connection Status
```typescript
import { ollamaService } from './src/services/ollamaService';

const isConnected = ollamaService.getConnectionStatus();
const currentModel = ollamaService.getCurrentModel();
const availableModels = await ollamaService.getAvailableModels();

console.log('Ollama Status:', {
  connected: isConnected,
  model: currentModel,
  available: availableModels
});
```

### Application Logs
Watch the browser console for Ollama connection status:
- ✅ "Ollama connected successfully!"
- ⚠️ "Ollama not running or not accessible"

## 🔄 Fallback Behavior

If Ollama is unavailable, the application will:
1. Show a warning in the console
2. Fall back to basic text-based search
3. Continue functioning with reduced AI capabilities
4. Display messages indicating AI assistant is unavailable

## 🚀 Next Steps

1. **Start Ollama**: `ollama run llama3.2`
2. **Start your development server**: `npm run dev`
3. **Test the integration**: Try searching for products using natural language
4. **Monitor performance**: Check console logs for connection status

## 💡 Tips for Best Results

1. **Use descriptive queries**: *"comfortable running shoes for flat feet"* vs *"shoes"*
2. **Include preferences**: *"eco-friendly cleaning products under $20"*
3. **Ask for comparisons**: *"compare these two laptops"*
4. **Request recommendations**: *"what goes well with this product?"*

---

## 🆘 Need Help?

- **Ollama Documentation**: [https://ollama.ai/docs](https://ollama.ai/docs)
- **Model Library**: [https://ollama.ai/library](https://ollama.ai/library)
- **Community Support**: [https://github.com/ollama/ollama](https://github.com/ollama/ollama)

Happy shopping with AI! 🛍️✨
