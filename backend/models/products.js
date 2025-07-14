import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  brand: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  description: { type: String, required: true },
  category: { type: String, required: true },
  subcategory: { type: String },
  image: { type: String, required: true },
  images: [String],
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  inStock: { type: Boolean, default: true },
  stockCount: { type: Number, default: 0 },
  isOnSale: { type: Boolean, default: false },
  salePercentage: { type: Number, default: 0 },
  sizes: [String],
  colors: [String],
  features: [String],
  specifications: mongoose.Schema.Types.Mixed,
  tags: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for better search performance
productSchema.index({ name: 'text', description: 'text', brand: 'text', category: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ rating: -1 });

export default mongoose.model('Products', productSchema);