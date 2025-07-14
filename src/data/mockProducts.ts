// src/data/mockProducts.ts
import { WalmartProduct, Product, Store, StoreAvailability } from '../types/Product';
import walmartProductsRaw from './walmart-products-parsed.json';
import storesData from './stores.json';

// Store data from stores.json
export const stores: Store[] = storesData as Store[];

// Cast to the correct raw type
export const rawWalmartProducts = walmartProductsRaw as WalmartProduct[];

// Helper function to safely parse JSON strings
function safeJsonParse(jsonString: string | null | undefined, defaultValue: any = null): any {
  if (!jsonString || jsonString === '' || jsonString === '[]' || jsonString === '{}') {
    return defaultValue;
  }
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    return defaultValue;
  }
}

// Helper function to assign products to stores
function assignProductToStore(product: WalmartProduct, index: number): StoreAvailability {
  const storeIndex = index % stores.length;
  const store = stores[storeIndex];
  const aisleNumber = (index % 20) + 1; // Distribute across 20 aisles
  
  return {
    store_id: store.store_id,
    aisle_number: `A${aisleNumber}`,
    section: `S${(index % 4) + 1}`,
    shelf_label: `${String.fromCharCode(65 + (index % 26))}${(index % 10) + 1}`,
    quantity: Math.floor(Math.random() * 50) + 1
  };
}

// Update the conversion to use WalmartProduct
export const mockProducts: Product[] = (walmartProductsRaw as WalmartProduct[]).map((item, index) => {
  const storeAssignment = assignProductToStore(item, index);
  
  // Parse JSON fields safely
  const imageUrls = safeJsonParse(item.image_urls, []);
  const colors = safeJsonParse(item.colors, []);
  const sizes = safeJsonParse(item.sizes, []);
  
  return {
    id: item.product_id || item.sku || Math.random().toString(36).slice(2),
    name: item.product_name || '',
    price: parseFloat(item.final_price) || parseFloat(item.unit_price) || 0,
    originalPrice: item.initial_price ? parseFloat(item.initial_price) : undefined,
    image: imageUrls[0] || item.main_image.replace(/^"|"$/g, ''),
    rating: parseFloat(item.rating) || 0,
    reviewCount: parseInt(item.review_count) || 0,
    brand: item.brand || '',
    category: item.category_name || 'general',
    color: colors[0] || undefined,
    size: sizes.length > 0 ? sizes : undefined,
    inStock: item.available_for_delivery === 'true',
    storeLocation: storeAssignment.store_id,
    aisle: storeAssignment.aisle_number,
    description: item.description || '',
    barcode: item.upc || undefined,
    is_featured: false,
    store_availability: [storeAssignment]
  };
});

// Helper function to get filtered products
export function getFilteredProducts(category?: string, filters?: {
  color?: string;
  brand?: string;
  priceRange?: [number, number];
  rating?: number;
}): Product[] {
  let filteredProducts = mockProducts;

  if (category) {
    filteredProducts = filteredProducts.filter(product => 
      product.category.toLowerCase().includes(category.toLowerCase())
    );
  }

  if (filters) {
    if (filters.color) {
      filteredProducts = filteredProducts.filter(product => 
        product.color?.toLowerCase().includes(filters.color!.toLowerCase())
      );
    }

    if (filters.brand) {
      filteredProducts = filteredProducts.filter(product => 
        product.brand.toLowerCase().includes(filters.brand!.toLowerCase())
      );
    }

    if (filters.priceRange) {
      filteredProducts = filteredProducts.filter(product => 
        product.price >= filters.priceRange![0] && product.price <= filters.priceRange![1]
      );
    }

    if (filters.rating) {
      filteredProducts = filteredProducts.filter(product => 
        product.rating >= filters.rating!
      );
    }
  }

  return filteredProducts;
}

// Helper function to get unique categories
export function getCategories(): string[] {
  return [...new Set(mockProducts.map(product => product.category))].sort();
}

// Helper function to get unique brands
export function getBrands(): string[] {
  return [...new Set(mockProducts.map(product => product.brand))].sort();
}

// Helper function to get price range
export function getPriceRange(): [number, number] {
  const prices = mockProducts.map(product => product.price);
  return [Math.min(...prices), Math.max(...prices)];
}

// Helper function to get store by ID
export function getStoreById(storeId: string): Store | undefined {
  return stores.find(store => store.store_id === storeId);
}

// Helper function to get products in specific aisle
export function getProductsInAisle(storeId: string, aisle: string): Product[] {
  return mockProducts.filter(product => 
    product.store_availability?.some(availability => 
      availability.store_id === storeId && availability.aisle_number === aisle
    )
  );
}

// Helper function to get product availability at a specific store
export function getProductAvailabilityAtStore(productId: string, storeId: string): StoreAvailability | undefined {
  const product = mockProducts.find(p => p.id === productId);
  if (!product) return undefined;
  
  return product.store_availability?.find(availability => 
    availability.store_id === storeId
  );
}

export default mockProducts;
