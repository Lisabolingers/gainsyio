// Supabase Edge Function for Etsy Scraping
// This provides a secure backend for scraping Etsy data

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

// Rate limiting implementation
class RateLimiter {
  private static instance: RateLimiter;
  private requestMap: Map<string, { count: number, timestamp: number }> = new Map();
  private readonly MAX_REQUESTS_PER_MINUTE = 10;
  private readonly WINDOW_MS = 60 * 1000; // 1 minute

  private constructor() {}

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  public isRateLimited(ip: string): boolean {
    const now = Date.now();
    const requestData = this.requestMap.get(ip) || { count: 0, timestamp: now };
    
    // Reset counter if window has passed
    if (now - requestData.timestamp > this.WINDOW_MS) {
      requestData.count = 1;
      requestData.timestamp = now;
    } else {
      requestData.count++;
    }
    
    this.requestMap.set(ip, requestData);
    
    return requestData.count > this.MAX_REQUESTS_PER_MINUTE;
  }
}

// User agent rotation
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36"
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Delay helper function
async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Scrape Etsy search results
async function scrapeEtsySearch(query: string, page: number = 1, filters: any = {}): Promise<any> {
  try {
    // Build Etsy search URL
    const baseUrl = 'https://www.etsy.com/search';
    const params = new URLSearchParams();
    
    params.append('q', query);
    params.append('page', page.toString());
    
    // Apply filters
    if (filters.min_price) {
      params.append('min', filters.min_price.toString());
    }
    if (filters.max_price) {
      params.append('max', filters.max_price.toString());
    }
    if (filters.shipping_free) {
      params.append('free_shipping', 'true');
    }
    
    // Sort parameter
    if (filters.sort_by) {
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
          params.append('order', 'most_relevant');
          break;
        default:
          params.append('order', 'most_relevant');
          break;
      }
    }
    
    const url = `${baseUrl}?${params.toString()}`;
    console.log(`🔍 Scraping Etsy URL: ${url}`);
    
    // In a real implementation, we would fetch and parse the HTML here
    // For this demo, we'll simulate the results
    
    // Add a realistic delay
    await delay(1500 + Math.random() * 1000);
    
    // Generate simulated results
    return simulateEtsyResults(query, page, filters);
  } catch (error) {
    console.error('Scraping error:', error);
    throw new Error(`Failed to scrape Etsy: ${error.message}`);
  }
}

// Simulate Etsy search results
function simulateEtsyResults(query: string, page: number, filters: any): any {
  // This function simulates what we would get from parsing Etsy's HTML
  // In a real implementation, we would extract this data from the page
  
  const resultsPerPage = 20;
  const totalResults = 1000 + Math.floor(Math.random() * 2000);
  
  // Base product templates
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
    // More product templates...
  ];
  
  // Generate products for the requested page
  const products = [];
  const startIndex = (page - 1) * resultsPerPage;
  
  for (let i = 0; i < resultsPerPage; i++) {
    const baseIndex = i % baseProducts.length;
    const base = baseProducts[baseIndex];
    
    // Add some randomization
    const priceVariation = (Math.random() - 0.5) * 10;
    const favoritesVariation = Math.floor(Math.random() * 200);
    const salesVariation = Math.floor(Math.random() * 50);
    
    // Generate unique ID
    const id = `etsy_${crypto.randomUUID().substring(0, 8)}`;
    
    products.push({
      id,
      title: base.title,
      description: base.description,
      price: Math.max(0.99, base.price + priceVariation),
      currency: 'USD',
      images: base.images,
      tags: [query.toLowerCase(), 'digital', 'download', 'printable', 'art', 'design', 'instant'],
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
    total: totalResults
  };
}

// Main handler function
serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Handle OPTIONS request for CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    
    // Check rate limit
    const rateLimiter = RateLimiter.getInstance();
    if (rateLimiter.isRateLimited(clientIP)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Rate limit exceeded. Please try again later."
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Parse request body
    const { query, page = 1, filters = {} } = await req.json();
    
    // Validate request
    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Search query must be at least 2 characters"
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    if (page < 1 || page > 50) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Page number must be between 1 and 50"
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    // Perform the scraping
    const results = await scrapeEtsySearch(query, page, filters);
    
    // Return the results
    return new Response(
      JSON.stringify({
        success: true,
        data: results
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An unknown error occurred"
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});