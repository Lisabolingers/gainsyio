import { v4 as uuidv4 } from 'uuid';

interface EtsyProduct {
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
  scraped_at: string;
}

interface ScrapingRequest {
  query: string;
  page: number;
  filters?: {
    min_price?: number;
    max_price?: number;
    category?: string;
    location?: string;
    sort_by?: 'relevancy' | 'price_low' | 'price_high' | 'newest' | 'favorites';
    min_favorites?: number;
    min_sales?: number;
    shipping_free?: boolean;
  };
}

interface ScrapingResult {
  success: boolean;
  data?: {
    products: EtsyProduct[];
    total: number;
  };
  error?: string;
}

// Rate limiting implementation
class RateLimiter {
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private readonly minDelay: number = 1000; // Minimum 1 second between requests
  private readonly maxRequestsPerMinute: number = 10;
  private readonly resetInterval: number = 60000; // 1 minute

  constructor() {
    // Reset counter every minute
    setInterval(() => {
      this.requestCount = 0;
    }, this.resetInterval);
  }

  async waitForPermission(): Promise<boolean> {
    // Check if we've hit the rate limit
    if (this.requestCount >= this.maxRequestsPerMinute) {
      console.log('⚠️ Rate limit reached, denying request');
      return false;
    }

    // Calculate time since last request
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    // Enforce minimum delay between requests
    if (timeSinceLastRequest < this.minDelay) {
      const waitTime = this.minDelay - timeSinceLastRequest;
      console.log(`⏳ Waiting ${waitTime}ms before next request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Update tracking variables
    this.lastRequestTime = Date.now();
    this.requestCount++;
    
    return true;
  }
}

// Singleton rate limiter
const rateLimiter = new RateLimiter();

export class EtsyScrapingService {
  // Ethical guidelines for scraping
  private static readonly guidelines = [
    'Sadece herkese açık ürün bilgilerini topluyoruz',
    'Etsy\'nin robots.txt dosyasına uygun şekilde çalışıyoruz',
    'Sunucu yükünü azaltmak için rate limiting uyguluyoruz',
    'Kullanıcı bilgilerini veya özel verileri toplamıyoruz',
    'Etsy\'nin API kullanım şartlarına uygun hareket ediyoruz',
    'Çekilen veriler sadece araştırma amaçlı kullanılıyor'
  ];

  // Rate limit info
  private static readonly rateLimit = {
    maxRequests: 10,
    perMinute: 1,
    minDelay: 1000
  };

  /**
   * Validate scraping request parameters
   */
  static validateRequest(request: ScrapingRequest): { valid: boolean; error?: string } {
    // Check query length
    if (!request.query || request.query.length < 2) {
      return { valid: false, error: 'Arama terimi en az 2 karakter olmalıdır' };
    }
    
    if (request.query.length > 100) {
      return { valid: false, error: 'Arama terimi 100 karakterden uzun olamaz' };
    }
    
    // Check page number
    if (request.page < 1 || request.page > 50) {
      return { valid: false, error: 'Sayfa numarası 1-50 arasında olmalıdır' };
    }
    
    // Check price filters
    if (request.filters?.min_price && request.filters.min_price < 0) {
      return { valid: false, error: 'Minimum fiyat 0\'dan küçük olamaz' };
    }
    
    if (request.filters?.max_price && request.filters.max_price < 0) {
      return { valid: false, error: 'Maksimum fiyat 0\'dan küçük olamaz' };
    }
    
    if (request.filters?.min_price && request.filters?.max_price && 
        request.filters.min_price > request.filters.max_price) {
      return { valid: false, error: 'Minimum fiyat maksimum fiyattan büyük olamaz' };
    }
    
    return { valid: true };
  }

  /**
   * Get information about the scraping service
   */
  static getScrapingInfo() {
    return {
      guidelines: this.guidelines,
      rateLimit: this.rateLimit
    };
  }

  /**
   * Scrape Etsy products based on search query and filters
   */
  static async scrapeEtsyProducts(request: ScrapingRequest): Promise<ScrapingResult> {
    try {
      // Check rate limiter first
      const canProceed = await rateLimiter.waitForPermission();
      if (!canProceed) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again in a minute.'
        };
      }

      console.log(`🔍 Scraping Etsy for: "${request.query}" (Page ${request.page})`);
      
      // In a real implementation, this would call a backend service or edge function
      // For now, we'll simulate the scraping with realistic data
      const result = await this.simulateEtsyScraping(request);
      
      return {
        success: true,
        data: result
      };
    } catch (error: any) {
      console.error('❌ Etsy scraping service error:', error);
      return {
        success: false,
        error: error.message || 'An unknown error occurred'
      };
    }
  }

  /**
   * Build Etsy search URL with filters
   */
  private static buildEtsySearchUrl(request: ScrapingRequest): string {
    const { query, page, filters } = request;
    const baseUrl = 'https://www.etsy.com/search';
    const params = new URLSearchParams();
    
    params.append('q', query);
    params.append('page', page.toString());
    
    // Apply filters to URL
    if (filters?.min_price) {
      params.append('min', filters.min_price.toString());
    }
    if (filters?.max_price) {
      params.append('max', filters.max_price.toString());
    }
    if (filters?.shipping_free) {
      params.append('free_shipping', 'true');
    }
    
    // Sort parameter
    if (filters?.sort_by) {
      switch (filters.sort_by) {
        case 'price_low':
          params.append('order', 'price_asc');
          break;
        case 'price_high':
          params.append('order', 'price_desc');
          break;
        case 'newest':
          params.append('order', 'date_desc');
          break;
        case 'favorites':
          params.append('order', 'most_relevant'); // Etsy's closest equivalent
          break;
        default:
          params.append('order', 'most_relevant');
          break;
      }
    }
    
    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Simulate Etsy scraping with realistic data
   * In a real implementation, this would be replaced with actual scraping logic
   */
  private static async simulateEtsyScraping(request: ScrapingRequest): Promise<{ products: EtsyProduct[], total: number }> {
    const { query, page, filters } = request;
    
    // Simulate network delay with randomness to appear realistic
    const delay = 1500 + Math.random() * 1500;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Generate realistic Etsy-like data
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
      }
    ];

    // Generate products for the requested page
    const resultsPerPage = 20;
    const startIndex = (page - 1) * resultsPerPage;
    const products: EtsyProduct[] = [];

    for (let i = 0; i < resultsPerPage; i++) {
      const baseIndex = i % baseProducts.length;
      const base = baseProducts[baseIndex];
      
      // Add some randomization to make it more realistic
      const priceVariation = (Math.random() - 0.5) * 10;
      const favoritesVariation = Math.floor(Math.random() * 200);
      const salesVariation = Math.floor(Math.random() * 50);
      
      // Generate unique tags based on query and product type
      const queryWords = query.toLowerCase().split(' ');
      const baseTags = ['digital', 'download', 'printable', 'art', 'design', 'instant'];
      const uniqueTags = [...new Set([...queryWords, ...baseTags])];
      const productTags = uniqueTags.slice(0, 10); // Max 10 tags
      
      // Add some category-specific tags
      if (base.category.includes('Art')) {
        productTags.push('wall art', 'home decor');
      } else if (base.category.includes('Craft')) {
        productTags.push('craft supplies', 'diy');
      }
      
      products.push({
        id: `etsy_${uuidv4().substring(0, 8)}`,
        title: base.title,
        description: base.description,
        price: Math.max(0.99, base.price + priceVariation),
        currency: 'USD',
        images: base.images,
        tags: productTags.slice(0, 13), // Etsy allows max 13 tags
        shop_name: base.shop_name,
        shop_url: `https://etsy.com/shop/${base.shop_name}`,
        product_url: `https://etsy.com/listing/${startIndex + i + 1000}/${query.toLowerCase().replace(/\s+/g, '-')}-${base.shop_name.toLowerCase()}`,
        views: Math.floor(Math.random() * 5000) + 100,
        favorites: Math.max(0, base.favorites + favoritesVariation),
        sales_count: Math.max(0, base.sales_count + salesVariation),
        created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        category: base.category,
        materials: ['Digital File'],
        shipping_info: { free_shipping: Math.random() > 0.3 },
        reviews_count: base.reviews_count,
        rating: base.rating,
        scraped_at: new Date().toISOString()
      });
    }

    // Apply filters
    let filteredProducts = products;

    if (filters?.min_price) {
      filteredProducts = filteredProducts.filter(p => p.price >= filters.min_price!);
    }
    if (filters?.max_price) {
      filteredProducts = filteredProducts.filter(p => p.price <= filters.max_price!);
    }
    if (filters?.min_favorites) {
      filteredProducts = filteredProducts.filter(p => p.favorites >= filters.min_favorites!);
    }
    if (filters?.min_sales) {
      filteredProducts = filteredProducts.filter(p => p.sales_count >= filters.min_sales!);
    }
    if (filters?.shipping_free) {
      filteredProducts = filteredProducts.filter(p => p.shipping_info.free_shipping);
    }

    // Apply sorting
    if (filters?.sort_by) {
      switch (filters.sort_by) {
        case 'price_low':
          filteredProducts.sort((a, b) => a.price - b.price);
          break;
        case 'price_high':
          filteredProducts.sort((a, b) => b.price - a.price);
          break;
        case 'newest':
          filteredProducts.sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
          break;
        case 'favorites':
          filteredProducts.sort((a, b) => b.favorites - a.favorites);
          break;
        default: // relevancy
          // Keep original order for relevancy
          break;
      }
    }

    // Simulate total results count based on query popularity
    const totalResults = 1000 + Math.floor(Math.random() * 2000);

    return {
      products: filteredProducts,
      total: totalResults
    };
  }
}