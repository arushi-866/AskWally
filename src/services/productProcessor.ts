// src/services/productProcessor.ts
import { WalmartProduct, ProcessedProduct } from '../types/Product';

export class ProductProcessor {
  static processProduct(rawProduct: WalmartProduct): ProcessedProduct {
    // Helper function to safely parse JSON strings
    const safeJsonParse = (jsonString: string | null | undefined, fallback: any = []) => {
      if (!jsonString || jsonString === '' || jsonString === 'null' || jsonString === 'undefined') {
        return fallback;
      }
      try {
        return JSON.parse(jsonString);
      } catch {
        return fallback;
      }
    };

    // Safe string processing
    const safeString = (str: string | null | undefined, fallback: string = '') => {
      return str ? str.toString() : fallback;
    };

    // Safe number parsing
    const safeParseFloat = (str: string | null | undefined, fallback: number = 0) => {
      if (!str) return fallback;
      const num = parseFloat(str.toString());
      return isNaN(num) ? fallback : num;
    };

    const safeParseInt = (str: string | null | undefined, fallback: number = 0) => {
      if (!str) return fallback;
      const num = parseInt(str.toString());
      return isNaN(num) ? fallback : num;
    };

    // Convert scientific notation price to number
    const price = safeParseFloat(rawProduct.final_price) || safeParseFloat(rawProduct.unit_price) || 0;

    // Clean image URL (remove quotes)
    const mainImage = rawProduct.main_image ? rawProduct.main_image.replace(/"/g, '') : '';
    const imageUrls = safeJsonParse(rawProduct.image_urls, []);

    // Parse categories
    const categories = safeJsonParse(rawProduct.categories, []);

    return {
      id: safeString(rawProduct.product_id) || safeString(rawProduct.sku) || Math.random().toString(36).slice(2),
      name: safeString(rawProduct.product_name, 'Unknown Product'),
      brand: safeString(rawProduct.brand, 'Unknown Brand'),
      price: price,
      originalPrice: rawProduct.initial_price ? safeParseFloat(rawProduct.initial_price) : undefined,
      description: safeString(rawProduct.description, ''),
      category: safeString(rawProduct.category_name) || safeString(rawProduct.root_category_name, 'General'),
      categories: categories,
      image: imageUrls[0] || mainImage || '/placeholder-product.jpg',
      images: imageUrls,
      rating: safeParseFloat(rawProduct.rating, 0),
      reviewCount: safeParseInt(rawProduct.review_count, 0),
      inStock: rawProduct.available_for_delivery === 'true',
      availableForDelivery: rawProduct.available_for_delivery === 'true',
      availableForPickup: rawProduct.available_for_pickup === 'true',
      colors: safeJsonParse(rawProduct.colors, []),
      sizes: safeJsonParse(rawProduct.sizes, []),
      tags: safeJsonParse(rawProduct.tags, []),
      url: safeString(rawProduct.url, '')
    };
  }

  static processProducts(rawProducts: WalmartProduct[]): ProcessedProduct[] {
    return rawProducts.map(product => this.processProduct(product));
  }
}