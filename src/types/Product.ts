export interface WalmartProduct {
  timestamp: string;
  url: string;
  final_price: string;
  sku: string;
  currency: string;
  gtin: string;
  specifications: string;
  image_urls: string;
  top_reviews: string;
  rating_stars: string;
  related_pages: string;
  available_for_delivery: string;
  available_for_pickup: string;
  brand: string;
  breadcrumbs: string;
  category_ids: string;
  review_count: string;
  description: string;
  product_id: string;
  product_name: string;
  review_tags: string;
  category_url: string;
  category_name: string;
  category_path: string;
  root_category_url: string;
  root_category_name: string;
  upc: string;
  tags: string;
  main_image: string;
  rating: string;
  unit_price: string;
  unit: string;
  aisle: string;
  free_returns: string;
  sizes: string;
  colors: string;
  seller: string;
  other_attributes: string;
  customer_reviews: string;
  ingredients: string;
  initial_price: string;
  discount: string;
  ingredients_full: string;
  categories: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  brand: string;
  category: string;
  color?: string;
  size?: string[];
  inStock: boolean;
  storeLocation: string;
  aisle: string;
  description: string;
  barcode?: string;
  is_featured?: boolean;
  store_availability?: StoreAvailability[];
}

export interface StoreAvailability {
  store_id: string;
  aisle_number: string;
  section: string;
  shelf_label: string;
  quantity: number;
}

export interface Store {
  store_id: string;
  store_name: string;
  latitude: number;
  longitude: number;
  address: string;
  phone: string;
  hours: {
    [key: string]: string;
  };
  services: string[];
  layout: {
    total_aisles: number;
    departments: Department[];
    special_areas: SpecialArea[];
  };
}

export interface Department {
  name: string;
  aisles: string[];
  sections: Section[];
}

export interface Section {
  aisle: string;
  section: string;
  coordinates: {
    x: number;
    y: number;
  };
}
export interface ProcessedProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  description: string;
  category: string;
  categories: string[];
  image: string;
  images: string[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
  availableForDelivery: boolean;
  availableForPickup: boolean;
  colors: string[];
  sizes: string[];
  tags: string[];
  url: string;
}
export interface SpecialArea {
  name: string;
  coordinates: {
    x: number;
    y: number;
  };
}