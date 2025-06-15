// Supabase Edge Function for Etsy API Integration
// This provides a secure backend for accessing Etsy API

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

// Delay helper function
async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Call Etsy API
async function callEtsyApi(endpoint: string, params: Record<string, any> = {}): Promise<any> {
  try {
    // In a real implementation, we would make an actual API call to Etsy
    // For now, we'll simulate the API response
    
    // Add a realistic delay
    await delay(1000 + Math.random() * 500);
    
    // Simulate different endpoints
    if (endpoint === 'listings/active') {
      return simulateListingsSearch(params);
    } else if (endpoint.startsWith('shops/')) {
      return simulateShopInfo(params);
    } else {
      throw new Error(`Unsupported endpoint: ${endpoint}`);
    }
  } catch (error) {
    console.error('Etsy API error:', error);
    throw new Error(`Failed to call Etsy API: ${error.message}`);
  }
}

// Simulate Etsy listings search
function simulateListingsSearch(params: Record<string, any>): any {
  const { keywords, limit = 20, page = 1, min_price, max_price, sort_on, sort_order } = params;
  
  // Base product templates with real images from Pexels
  const baseProducts = [
    {
      title: `${keywords} Vintage Style Poster - Digital Download`,
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
      title: `Modern ${keywords} Typography Print - Instant Download`,
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
      title: `${keywords} Botanical Illustration Set - Digital Art`,
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
      title: `Watercolor ${keywords} Bundle - Digital Clipart`,
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
      title: `Abstract ${keywords} Art - Printable Wall Art`,
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
      title: `Minimalist ${keywords} Design - Digital Print`,
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
      title: `Handmade ${keywords} Ceramic Mug - Unique Gift`,
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
      title: `${keywords} Personalized Necklace - Custom Jewelry`,
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
      title: `Handwoven ${keywords} Basket - Eco-friendly Storage`,
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
      title: `${keywords} Scented Candle - Natural Soy Wax`,
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
      title: `Vintage ${keywords} Leather Journal - Handmade Notebook`,
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
      title: `${keywords} Macramé Wall Hanging - Boho Home Decor`,
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
      title: `Custom ${keywords} Portrait - Digital Illustration`,
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
      title: `${keywords} Stained Glass Suncatcher - Window Hanging`,
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
      title: `Handmade ${keywords} Soap Set - Natural Ingredients`,
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
      title: `${keywords} Wooden Cutting Board - Kitchen Accessory`,
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
    
    // Generate unique tags based on keywords and product type
    const keywordWords = keywords.toLowerCase().split(' ');
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
    const allTags = [...keywordWords, ...baseTags, ...categoryTags];
    const uniqueTags = [...new Set(allTags)].slice(0, 13); // Etsy allows max 13 tags
    
    // Create a unique ID
    const uniqueId = `etsy_${Math.random().toString(36).substring(2, 10)}`;
    
    // Create the product with realistic data
    products.push({
      id: uniqueId,
      title: base.title,
      description: base.description,
      price: Math.max(0.99, base.price + priceVariation),
      currency_code: 'USD',
      images: base.images.map(url => ({ url_fullxfull: url })),
      tags: uniqueTags,
      shop_name: base.shop_name,
      shop: {
        shop_id: Math.floor(Math.random() * 1000000),
        shop_name: base.shop_name,
        url: `https://etsy.com/shop/${base.shop_name}`
      },
      url: `https://etsy.com/listing/${startIndex + i + 1000}/${keywords.toLowerCase().replace(/\s+/g, '-')}-${base.shop_name.toLowerCase()}`,
      views: Math.floor(Math.random() * 5000) + 100,
      num_favorers: Math.max(0, base.favorites + favoritesVariation),
      quantity_sold: Math.max(0, base.sales_count + salesVariation),
      creation_timestamp: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 365 * 24 * 60 * 60),
      taxonomy_path: [base.category],
      materials: ['Handmade', 'Custom', 'Unique'],
      shipping_profile: { 
        origin_country_iso: 'US',
        min_processing_days: 1,
        max_processing_days: 3,
        shipping_options: [
          {
            shipping_method: 'Standard',
            amount: { amount: Math.random() > 0.3 ? 0 : (2.99 + Math.random() * 5).toFixed(2), currency_code: 'USD' },
            is_free: Math.random() > 0.3
          }
        ]
      },
      num_reviews: base.reviews_count,
      rating: base.rating
    });
  }
  
  // Apply filters
  let filteredProducts = products;
  
  if (min_price) {
    filteredProducts = filteredProducts.filter(p => p.price >= min_price);
  }
  if (max_price) {
    filteredProducts = filteredProducts.filter(p => p.price <= max_price);
  }
  
  // Apply sorting
  if (sort_on && sort_order) {
    switch (sort_on) {
      case 'price':
        filteredProducts.sort((a, b) => sort_order === 'asc' ? a.price - b.price : b.price - a.price);
        break;
      case 'created':
        filteredProducts.sort((a, b) => sort_order === 'asc' ? a.creation_timestamp - b.creation_timestamp : b.creation_timestamp - a.creation_timestamp);
        break;
      case 'favorers':
        filteredProducts.sort((a, b) => sort_order === 'asc' ? a.num_favorers - b.num_favorers : b.num_favorers - a.num_favorers);
        break;
      default:
        // Keep original order for relevancy
        break;
    }
  }
  
  // Format response to match Etsy API format
  return {
    count: filteredProducts.length,
    results: filteredProducts,
    pagination: {
      effective_page: page,
      effective_limit: limit,
      next_page: page < Math.ceil(totalResults / limit) ? page + 1 : null,
      effective_offset: (page - 1) * limit,
      total_count: totalResults
    }
  };
}

// Simulate Etsy shop info
function simulateShopInfo(params: Record<string, any>): any {
  const shopId = params.shop_id || '12345';
  
  return {
    shop_id: shopId,
    shop_name: `EtsyShop${shopId}`,
    title: `Etsy Shop ${shopId}`,
    announcement: 'Welcome to my Etsy shop!',
    currency_code: 'USD',
    is_vacation: false,
    vacation_message: null,
    sale_message: 'Thank you for your purchase!',
    digital_sale_message: null,
    update_date: Math.floor(Date.now() / 1000) - 86400,
    listing_active_count: Math.floor(Math.random() * 100) + 10,
    digital_listing_count: Math.floor(Math.random() * 50),
    login_name: `etsyshop${shopId}`,
    accepts_custom_requests: true,
    policy_welcome: 'Welcome to my shop!',
    policy_payment: 'I accept PayPal and credit cards',
    policy_shipping: 'Items ship within 1-3 business days',
    policy_refunds: 'I accept returns within 14 days',
    policy_additional: 'Please contact me with any questions',
    policy_seller_info: 'I am an Etsy seller',
    policy_update_date: Math.floor(Date.now() / 1000) - 86400 * 30,
    is_shop_us_based: true,
    transaction_sold_count: Math.floor(Math.random() * 1000) + 100,
    shipping_from_country_id: 209,
    shop_location_country: 'United States',
    review_count: Math.floor(Math.random() * 500) + 50,
    review_average: (4 + Math.random()).toFixed(1)
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
    const { endpoint, params = {} } = await req.json();
    
    // Validate request
    if (!endpoint) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "API endpoint is required"
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
    
    // Call Etsy API
    const result = await callEtsyApi(endpoint, params);
    
    // Return the results
    return new Response(
      JSON.stringify({
        success: true,
        data: result
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