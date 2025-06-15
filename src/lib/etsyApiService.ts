import { supabase } from './supabase';

// Etsy API endpoints
const ETSY_API_BASE_URL = 'https://openapi.etsy.com/v3';

// Etsy API service for interacting with Etsy's official API
export class EtsyApiService {
  private static instance: EtsyApiService;
  private apiKey: string = '';
  private isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): EtsyApiService {
    if (!EtsyApiService.instance) {
      EtsyApiService.instance = new EtsyApiService();
    }
    return EtsyApiService.instance;
  }

  // Initialize with API key
  public async initialize(): Promise<boolean> {
    try {
      // In a real implementation, we would get the API key from environment variables
      // For now, we'll use a placeholder
      this.apiKey = import.meta.env.VITE_ETSY_API_KEY || '';
      
      if (!this.apiKey) {
        console.warn('⚠️ Etsy API key not found. Using mock data.');
        return false;
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Etsy API service:', error);
      return false;
    }
  }

  // Search Etsy listings
  public async searchListings(params: EtsySearchParams): Promise<EtsySearchResult> {
    await this.ensureInitialized();
    
    try {
      // Check if we have a valid API key
      if (!this.apiKey) {
        console.log('🔄 No API key, using mock data');
        return this.getMockSearchResults(params);
      }
      
      // In a real implementation, we would make an actual API call
      // For now, we'll use mock data
      console.log('🔄 Using mock data for Etsy API search');
      return this.getMockSearchResults(params);
    } catch (error) {
      console.error('❌ Etsy API search error:', error);
      throw new Error(`Etsy API search failed: ${error.message}`);
    }
  }

  // Get store listings
  public async getStoreListings(storeId: string, params: any = {}): Promise<any> {
    await this.ensureInitialized();
    
    try {
      // Check if we have a valid API key
      if (!this.apiKey) {
        console.log('🔄 No API key, using mock data');
        return this.getMockStoreListings(storeId);
      }
      
      // In a real implementation, we would make an actual API call
      // For now, we'll use mock data
      console.log('🔄 Using mock data for Etsy store listings');
      return this.getMockStoreListings(storeId);
    } catch (error) {
      console.error('❌ Etsy API store listings error:', error);
      throw new Error(`Failed to get store listings: ${error.message}`);
    }
  }

  // Get store information
  public async getStoreInfo(storeId: string): Promise<any> {
    await this.ensureInitialized();
    
    try {
      // Check if we have a valid API key
      if (!this.apiKey) {
        console.log('🔄 No API key, using mock data');
        return this.getMockStoreInfo(storeId);
      }
      
      // In a real implementation, we would make an actual API call
      // For now, we'll use mock data
      console.log('🔄 Using mock data for Etsy store info');
      return this.getMockStoreInfo(storeId);
    } catch (error) {
      console.error('❌ Etsy API store info error:', error);
      throw new Error(`Failed to get store info: ${error.message}`);
    }
  }

  // Ensure the service is initialized
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  // Get API information
  public getApiInfo(): EtsyApiInfo {
    return {
      name: 'Etsy API v3',
      version: '3.0',
      documentation: 'https://developer.etsy.com/documentation/',
      rateLimit: {
        maxRequests: 10,
        perTimeWindow: '1 second'
      },
      guidelines: [
        'Etsy API kullanımı, Etsy\'nin API kullanım şartlarına tabidir',
        'Etsy API anahtarı gerektirir ve kullanım sınırlamaları vardır',
        'Etsy API, ürün bilgilerini yasal ve güvenli bir şekilde çekmenizi sağlar',
        'Etsy API, web scraping\'e göre daha güvenilir ve sürdürülebilir bir çözümdür'
      ]
    };
  }

  // Mock data for search results
  private getMockSearchResults(params: EtsySearchParams): EtsySearchResult {
    const { query, page = 1, limit = 20, filters = {} } = params;
    
    // Base product templates with real images from Pexels
    const baseProducts = [
      {
        title: `${query} Vintage Style Poster - Digital Download`,
        shop_name: 'VintageDesignStudio',
        price: 4.99,
        favorites: 1247,
        sales_count: 89,
        rating: 4.8,
        reviews_count: 156,
        category: 'Art & Collectibles',
        images: ['https://images.pexels.com/photos/1070945/pexels-photo-1070945.jpeg?auto=compress&cs=tinysrgb&w=400'],
        description: 'Beautiful vintage-style poster perfect for home decoration. High-quality digital download ready for printing.'
      },
      {
        title: `Modern ${query} Typography Print - Instant Download`,
        shop_name: 'ModernPrintCo',
        price: 3.99,
        favorites: 892,
        sales_count: 67,
        rating: 4.9,
        reviews_count: 89,
        category: 'Art & Collectibles',
        images: ['https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=400'],
        description: 'Clean and modern typography design. Perfect for office or home decoration.'
      },
      {
        title: `${query} Botanical Illustration Set - Digital Art`,
        shop_name: 'BotanicalArtist',
        price: 7.99,
        favorites: 2156,
        sales_count: 134,
        rating: 4.7,
        reviews_count: 203,
        category: 'Art & Collectibles',
        images: ['https://images.pexels.com/photos/1055379/pexels-photo-1055379.jpeg?auto=compress&cs=tinysrgb&w=400'],
        description: 'Set of 4 botanical illustrations. High-resolution files perfect for printing and framing.'
      },
      {
        title: `Watercolor ${query} Bundle - Digital Clipart`,
        shop_name: 'WatercolorWorks',
        price: 12.99,
        favorites: 3421,
        sales_count: 287,
        rating: 4.9,
        reviews_count: 445,
        category: 'Craft Supplies & Tools',
        images: ['https://images.pexels.com/photos/1070850/pexels-photo-1070850.jpeg?auto=compress&cs=tinysrgb&w=400'],
        description: 'Beautiful watercolor floral elements. Perfect for wedding invitations and crafting projects.'
      },
      {
        title: `Abstract ${query} Art - Printable Wall Art`,
        shop_name: 'AbstractCreations',
        price: 5.99,
        favorites: 567,
        sales_count: 45,
        rating: 4.6,
        reviews_count: 78,
        category: 'Art & Collectibles',
        images: ['https://images.pexels.com/photos/1109354/pexels-photo-1109354.jpeg?auto=compress&cs=tinysrgb&w=400'],
        description: 'Contemporary abstract geometric design. Perfect for modern interiors.'
      },
      {
        title: `Minimalist ${query} Design - Digital Print`,
        shop_name: 'MinimalDesigns',
        price: 2.99,
        favorites: 234,
        sales_count: 23,
        rating: 4.5,
        reviews_count: 34,
        category: 'Art & Collectibles',
        images: ['https://images.pexels.com/photos/1029604/pexels-photo-1029604.jpeg?auto=compress&cs=tinysrgb&w=400'],
        description: 'Simple and elegant minimalist design. Perfect for modern homes.'
      },
      // Additional real product templates with real images
      {
        title: `Handmade ${query} Ceramic Mug - Unique Gift`,
        shop_name: 'CeramicArtistry',
        price: 24.99,
        favorites: 1876,
        sales_count: 342,
        rating: 4.9,
        reviews_count: 289,
        category: 'Home & Living',
        images: ['https://images.pexels.com/photos/1566308/pexels-photo-1566308.jpeg?auto=compress&cs=tinysrgb&w=400'],
        description: 'Handcrafted ceramic mug, perfect for your morning coffee or tea. Each piece is unique and made with love.'
      },
      {
        title: `${query} Personalized Necklace - Custom Jewelry`,
        shop_name: 'CustomJewelryDesigns',
        price: 32.50,
        favorites: 4231,
        sales_count: 987,
        rating: 4.8,
        reviews_count: 756,
        category: 'Jewelry',
        images: ['https://images.pexels.com/photos/1454171/pexels-photo-1454171.jpeg?auto=compress&cs=tinysrgb&w=400'],
        description: 'Beautiful personalized necklace that can be customized with your name or special date. Makes a perfect gift.'
      },
      {
        title: `Handwoven ${query} Basket - Eco-friendly Storage`,
        shop_name: 'EcoWeavers',
        price: 45.00,
        favorites: 1243,
        sales_count: 187,
        rating: 4.7,
        reviews_count: 156,
        category: 'Home & Living',
        images: ['https://images.pexels.com/photos/4439901/pexels-photo-4439901.jpeg?auto=compress&cs=tinysrgb&w=400'],
        description: 'Handwoven basket made from sustainable materials. Perfect for storage and home decoration.'
      },
      {
        title: `${query} Scented Candle - Natural Soy Wax`,
        shop_name: 'AromaHaven',
        price: 18.99,
        favorites: 2567,
        sales_count: 432,
        rating: 4.9,
        reviews_count: 378,
        category: 'Home & Living',
        images: ['https://images.pexels.com/photos/4195342/pexels-photo-4195342.jpeg?auto=compress&cs=tinysrgb&w=400'],
        description: 'Hand-poured soy candle with natural essential oils. Long-lasting and clean burning.'
      },
      {
        title: `Vintage ${query} Leather Journal - Handmade Notebook`,
        shop_name: 'LeatherBoundMemories',
        price: 28.50,
        favorites: 3421,
        sales_count: 654,
        rating: 4.8,
        reviews_count: 521,
        category: 'Paper & Party Supplies',
        images: ['https://images.pexels.com/photos/6683359/pexels-photo-6683359.jpeg?auto=compress&cs=tinysrgb&w=400'],
        description: 'Handcrafted leather journal with premium paper. Perfect for writing, sketching, or as a thoughtful gift.'
      },
      {
        title: `${query} Macramé Wall Hanging - Boho Home Decor`,
        shop_name: 'BohoKnotCreations',
        price: 39.99,
        favorites: 1876,
        sales_count: 234,
        rating: 4.7,
        reviews_count: 198,
        category: 'Home & Living',
        images: ['https://images.pexels.com/photos/1248583/pexels-photo-1248583.jpeg?auto=compress&cs=tinysrgb&w=400'],
        description: 'Handmade macramé wall hanging that adds texture and warmth to any space. Each piece is unique.'
      },
      {
        title: `Custom ${query} Portrait - Digital Illustration`,
        shop_name: 'PortraitArtistry',
        price: 35.00,
        favorites: 5432,
        sales_count: 1243,
        rating: 4.9,
        reviews_count: 987,
        category: 'Art & Collectibles',
        images: ['https://images.pexels.com/photos/3094218/pexels-photo-3094218.jpeg?auto=compress&cs=tinysrgb&w=400'],
        description: 'Custom digital portrait created from your photo. Makes a perfect personalized gift.'
      },
      {
        title: `${query} Stained Glass Suncatcher - Window Hanging`,
        shop_name: 'GlassArtWonders',
        price: 42.99,
        favorites: 1543,
        sales_count: 321,
        rating: 4.8,
        reviews_count: 276,
        category: 'Home & Living',
        images: ['https://images.pexels.com/photos/1295036/pexels-photo-1295036.jpeg?auto=compress&cs=tinysrgb&w=400'],
        description: 'Handcrafted stained glass suncatcher that creates beautiful light patterns. Each piece is handmade with care.'
      },
      {
        title: `Handmade ${query} Soap Set - Natural Ingredients`,
        shop_name: 'PureSoapWorks',
        price: 16.50,
        favorites: 2134,
        sales_count: 543,
        rating: 4.9,
        reviews_count: 432,
        category: 'Bath & Beauty',
        images: ['https://images.pexels.com/photos/6621339/pexels-photo-6621339.jpeg?auto=compress&cs=tinysrgb&w=400'],
        description: 'Set of handmade soaps made with natural ingredients and essential oils. Gentle on skin and beautifully scented.'
      },
      {
        title: `${query} Wooden Cutting Board - Kitchen Accessory`,
        shop_name: 'WoodcraftKitchen',
        price: 49.99,
        favorites: 1876,
        sales_count: 432,
        rating: 4.8,
        reviews_count: 365,
        category: 'Home & Living',
        images: ['https://images.pexels.com/photos/4226896/pexels-photo-4226896.jpeg?auto=compress&cs=tinysrgb&w=400'],
        description: 'Handcrafted wooden cutting board made from sustainable hardwood. Functional and beautiful kitchen accessory.'
      }
    ];
    
    // Generate products for the requested page
    const products = [];
    const startIndex = (page - 1) * limit;
    const totalResults = 1000 + Math.floor(Math.random() * 2000);
    
    for (let i = 0; i < limit; i++) {
      const baseIndex = (startIndex + i) % baseProducts.length;
      const base = baseProducts[baseIndex];
      
      // Add some randomization
      const priceVariation = (Math.random() - 0.5) * (base.price * 0.2); // 20% variation
      const favoritesVariation = Math.floor(Math.random() * (base.favorites * 0.1)); // 10% variation
      const salesVariation = Math.floor(Math.random() * (base.sales_count * 0.1)); // 10% variation
      
      // Generate unique tags based on query and product type
      const queryWords = query.toLowerCase().split(' ');
      const baseTags = ['handmade', 'custom', 'unique', 'gift'];
      
      // Add category-specific tags
      let categoryTags: string[] = [];
      if (base.category.includes('Art')) {
        categoryTags = ['wall art', 'home decor', 'printable', 'digital download'];
      } else if (base.category.includes('Home')) {
        categoryTags = ['home decor', 'housewarming', 'kitchen', 'living room'];
      } else if (base.category.includes('Jewelry')) {
        categoryTags = ['gift for her', 'personalized', 'custom', 'handmade jewelry'];
      } else if (base.category.includes('Bath')) {
        categoryTags = ['self care', 'natural', 'organic', 'vegan'];
      }
      
      // Combine and deduplicate tags
      const allTags = [...queryWords, ...baseTags, ...categoryTags];
      const uniqueTags = [...new Set(allTags)].slice(0, 13); // Etsy allows max 13 tags
      
      // Create a unique ID
      const uniqueId = `etsy_${Math.random().toString(36).substring(2, 10)}`;
      
      // Create the product with realistic data
      products.push({
        id: uniqueId,
        title: base.title,
        description: base.description,
        price: Math.max(0.99, base.price + priceVariation),
        currency: 'USD',
        images: base.images,
        tags: uniqueTags,
        shop_name: base.shop_name,
        shop_url: `https://etsy.com/shop/${base.shop_name}`,
        product_url: `https://etsy.com/listing/${startIndex + i + 1000}/${query.toLowerCase().replace(/\s+/g, '-')}-${base.shop_name.toLowerCase()}`,
        views: Math.floor(Math.random() * 5000) + 100,
        favorites: Math.max(0, base.favorites + favoritesVariation),
        sales_count: Math.max(0, base.sales_count + salesVariation),
        created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        category: base.category,
        materials: ['Handmade', 'Custom', 'Unique'],
        shipping_info: { 
          free_shipping: Math.random() > 0.3,
          shipping_cost: Math.random() > 0.3 ? 0 : (2.99 + Math.random() * 5).toFixed(2)
        },
        reviews_count: base.reviews_count,
        rating: base.rating,
        fetched_at: new Date().toISOString()
      });
    }
    
    // Apply filters
    let filteredProducts = products;
    
    if (filters.min_price) {
      filteredProducts = filteredProducts.filter(p => p.price >= filters.min_price);
    }
    if (filters.max_price) {
      filteredProducts = filteredProducts.filter(p => p.price <= filters.max_price);
    }
    if (filters.min_favorites) {
      filteredProducts = filteredProducts.filter(p => p.favorites >= filters.min_favorites);
    }
    if (filters.min_sales) {
      filteredProducts = filteredProducts.filter(p => p.sales_count >= filters.min_sales);
    }
    if (filters.shipping_free) {
      filteredProducts = filteredProducts.filter(p => p.shipping_info.free_shipping);
    }
    
    // Apply sorting
    if (filters.sort_by) {
      switch (filters.sort_by) {
        case 'price_low':
          filteredProducts.sort((a, b) => a.price - b.price);
          break;
        case 'price_high':
          filteredProducts.sort((a, b) => b.price - a.price);
          break;
        case 'newest':
          filteredProducts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          break;
        case 'favorites':
          filteredProducts.sort((a, b) => b.favorites - a.favorites);
          break;
        default: // relevancy
          // Keep original order for relevancy
          break;
      }
    }
    
    return {
      products: filteredProducts,
      total: totalResults,
      page,
      limit,
      query
    };
  }

  // Mock data for store listings
  private getMockStoreListings(storeId: string): any {
    // In a real implementation, this would fetch actual store listings
    return {
      listings: [],
      total: 0
    };
  }

  // Mock data for store info
  private getMockStoreInfo(storeId: string): any {
    // In a real implementation, this would fetch actual store info
    return {
      shop_id: storeId,
      shop_name: 'MockEtsyStore',
      title: 'Mock Etsy Store',
      announcement: 'This is a mock Etsy store for testing purposes',
      currency_code: 'USD',
      is_vacation: false,
      vacation_message: null,
      sale_message: 'Thank you for your purchase!',
      digital_sale_message: null,
      update_date: 1620000000,
      listing_active_count: 100,
      digital_listing_count: 50,
      login_name: 'mocketsystore',
      accepts_custom_requests: true,
      policy_welcome: 'Welcome to my store!',
      policy_payment: 'I accept PayPal and credit cards',
      policy_shipping: 'Items ship within 1-3 business days',
      policy_refunds: 'I accept returns within 14 days',
      policy_additional: 'Please contact me with any questions',
      policy_seller_info: 'I am a mock Etsy seller',
      policy_update_date: 1620000000,
      is_shop_us_based: true,
      transaction_sold_count: 500,
      shipping_from_country_id: 209,
      shop_location_country: 'United States',
      review_count: 450,
      review_average: 4.8
    };
  }
}

// Types
export interface EtsySearchParams {
  query: string;
  page?: number;
  limit?: number;
  filters?: {
    min_price?: number;
    max_price?: number;
    category?: string;
    sort_by?: 'relevancy' | 'price_low' | 'price_high' | 'newest' | 'favorites';
    min_favorites?: number;
    min_sales?: number;
    shipping_free?: boolean;
  };
}

export interface EtsySearchResult {
  products: EtsyProduct[];
  total: number;
  page: number;
  limit: number;
  query: string;
}

export interface EtsyProduct {
  id: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  images: string[];
  tags: string[];
  shop_name: string;
  shop_url: string;
  product_url: string;
  views?: number;
  favorites: number;
  sales_count: number;
  created_at?: string;
  category: string;
  materials?: string[];
  shipping_info: any;
  reviews_count: number;
  rating: number;
  fetched_at: string;
}

export interface EtsyApiInfo {
  name: string;
  version: string;
  documentation: string;
  rateLimit: {
    maxRequests: number;
    perTimeWindow: string;
  };
  guidelines: string[];
}

// Create and export a singleton instance
export const etsyApiService = EtsyApiService.getInstance();