import { supabase } from './supabase';

// Interface for AI providers
export interface AIProvider {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'custom';
  apiKey: string;
  isActive: boolean;
}

// Interface for AI rules
export interface AIRule {
  id: string;
  type: 'title' | 'tags';
  name: string;
  prompt: string;
  maxLength: number;
  minLength: number;
  apiProviderId: string;
  isDefault: boolean;
}

// Interface for AI generation request
export interface AIGenerationRequest {
  productInfo: string;
  ruleId?: string;
  type: 'title' | 'tags';
}

// Interface for AI generation response
export interface AIGenerationResponse {
  success: boolean;
  data?: {
    title?: string;
    tags?: string[];
  };
  error?: string;
}

// AI Service class
export class AIService {
  // Get all API providers for a user
  static async getProviders(userId: string): Promise<AIProvider[]> {
    try {
      const { data, error } = await supabase
        .from('ai_providers')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Map database fields to camelCase for frontend
      return (data || []).map(provider => ({
        id: provider.id,
        name: provider.name,
        provider: provider.provider,
        apiKey: provider.api_key,
        isActive: provider.is_active
      }));
    } catch (error) {
      console.error('Error fetching AI providers:', error);
      throw error;
    }
  }
  
  // Get all AI rules for a user
  static async getRules(userId: string): Promise<AIRule[]> {
    try {
      const { data, error } = await supabase
        .from('ai_rules')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Map database fields to camelCase for frontend
      return (data || []).map(rule => ({
        id: rule.id,
        type: rule.type,
        name: rule.name,
        prompt: rule.prompt,
        maxLength: rule.max_length,
        minLength: rule.min_length,
        apiProviderId: rule.api_provider_id,
        isDefault: rule.is_default
      }));
    } catch (error) {
      console.error('Error fetching AI rules:', error);
      throw error;
    }
  }
  
  // Get default rule for a specific type
  static async getDefaultRule(userId: string, type: 'title' | 'tags'): Promise<AIRule | null> {
    try {
      const { data, error } = await supabase
        .from('ai_rules')
        .select('*')
        .eq('user_id', userId)
        .eq('type', type)
        .eq('is_default', true)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found" error
      
      if (!data) return null;
      
      // Map database fields to camelCase for frontend
      return {
        id: data.id,
        type: data.type,
        name: data.name,
        prompt: data.prompt,
        maxLength: data.max_length,
        minLength: data.min_length,
        apiProviderId: data.api_provider_id,
        isDefault: data.is_default
      };
    } catch (error) {
      console.error(`Error fetching default ${type} rule:`, error);
      throw error;
    }
  }
  
  // Save a new API provider
  static async saveProvider(userId: string, provider: Omit<AIProvider, 'id'>): Promise<AIProvider> {
    try {
      const { data, error } = await supabase
        .from('ai_providers')
        .insert({
          user_id: userId,
          name: provider.name,
          provider: provider.provider,
          api_key: provider.apiKey,
          is_active: provider.isActive
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Map database fields to camelCase for frontend
      return {
        id: data.id,
        name: data.name,
        provider: data.provider,
        apiKey: data.api_key,
        isActive: data.is_active
      };
    } catch (error) {
      console.error('Error saving AI provider:', error);
      throw error;
    }
  }
  
  // Update an existing API provider
  static async updateProvider(userId: string, providerId: string, provider: Partial<AIProvider>): Promise<AIProvider> {
    try {
      const updateData: any = {};
      
      // Only include fields that are provided
      if (provider.name !== undefined) updateData.name = provider.name;
      if (provider.provider !== undefined) updateData.provider = provider.provider;
      if (provider.apiKey !== undefined) updateData.api_key = provider.apiKey;
      if (provider.isActive !== undefined) updateData.is_active = provider.isActive;
      
      const { data, error } = await supabase
        .from('ai_providers')
        .update(updateData)
        .eq('id', providerId)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Map database fields to camelCase for frontend
      return {
        id: data.id,
        name: data.name,
        provider: data.provider,
        apiKey: data.api_key,
        isActive: data.is_active
      };
    } catch (error) {
      console.error('Error updating AI provider:', error);
      throw error;
    }
  }
  
  // Save a new AI rule
  static async saveRule(userId: string, rule: Omit<AIRule, 'id'>): Promise<AIRule> {
    try {
      // If this is a default rule, unset any existing default for this type
      if (rule.isDefault) {
        await supabase
          .from('ai_rules')
          .update({ is_default: false })
          .eq('user_id', userId)
          .eq('type', rule.type)
          .eq('is_default', true);
      }
      
      const { data, error } = await supabase
        .from('ai_rules')
        .insert({
          user_id: userId,
          type: rule.type,
          name: rule.name,
          prompt: rule.prompt,
          max_length: rule.maxLength,
          min_length: rule.minLength,
          api_provider_id: rule.apiProviderId,
          is_default: rule.isDefault
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Map database fields to camelCase for frontend
      return {
        id: data.id,
        type: data.type,
        name: data.name,
        prompt: data.prompt,
        maxLength: data.max_length,
        minLength: data.min_length,
        apiProviderId: data.api_provider_id,
        isDefault: data.is_default
      };
    } catch (error) {
      console.error('Error saving AI rule:', error);
      throw error;
    }
  }
  
  // Update an existing AI rule
  static async updateRule(userId: string, ruleId: string, rule: Partial<AIRule>): Promise<AIRule> {
    try {
      // If this is being set as default, unset any existing default for this type
      if (rule.isDefault) {
        await supabase
          .from('ai_rules')
          .update({ is_default: false })
          .eq('user_id', userId)
          .eq('type', rule.type)
          .eq('is_default', true);
      }
      
      const updateData: any = {};
      
      // Only include fields that are provided
      if (rule.type !== undefined) updateData.type = rule.type;
      if (rule.name !== undefined) updateData.name = rule.name;
      if (rule.prompt !== undefined) updateData.prompt = rule.prompt;
      if (rule.maxLength !== undefined) updateData.max_length = rule.maxLength;
      if (rule.minLength !== undefined) updateData.min_length = rule.minLength;
      if (rule.apiProviderId !== undefined) updateData.api_provider_id = rule.apiProviderId;
      if (rule.isDefault !== undefined) updateData.is_default = rule.isDefault;
      
      const { data, error } = await supabase
        .from('ai_rules')
        .update(updateData)
        .eq('id', ruleId)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Map database fields to camelCase for frontend
      return {
        id: data.id,
        type: data.type,
        name: data.name,
        prompt: data.prompt,
        maxLength: data.max_length,
        minLength: data.min_length,
        apiProviderId: data.api_provider_id,
        isDefault: data.is_default
      };
    } catch (error) {
      console.error('Error updating AI rule:', error);
      throw error;
    }
  }
  
  // Delete an API provider
  static async deleteProvider(userId: string, providerId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_providers')
        .delete()
        .eq('id', providerId)
        .eq('user_id', userId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting AI provider:', error);
      throw error;
    }
  }
  
  // Delete an AI rule
  static async deleteRule(userId: string, ruleId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_rules')
        .delete()
        .eq('id', ruleId)
        .eq('user_id', userId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting AI rule:', error);
      throw error;
    }
  }
  
  // Generate content using AI
  static async generateContent(userId: string, request: AIGenerationRequest): Promise<AIGenerationResponse> {
    try {
      // Get the rule to use
      let rule: AIRule | null = null;
      
      if (request.ruleId) {
        // Get specific rule
        const { data, error } = await supabase
          .from('ai_rules')
          .select('*')
          .eq('id', request.ruleId)
          .eq('user_id', userId)
          .single();
        
        if (error) throw error;
        
        // Map database fields to camelCase for frontend
        rule = {
          id: data.id,
          type: data.type,
          name: data.name,
          prompt: data.prompt,
          maxLength: data.max_length,
          minLength: data.min_length,
          apiProviderId: data.api_provider_id,
          isDefault: data.is_default
        };
      } else {
        // Get default rule for this type
        rule = await this.getDefaultRule(userId, request.type);
        
        if (!rule) {
          throw new Error(`No default ${request.type} rule found. Please create a rule first.`);
        }
      }
      
      // Get the API provider
      const { data: providerData, error: providerError } = await supabase
        .from('ai_providers')
        .select('*')
        .eq('id', rule.apiProviderId)
        .eq('user_id', userId)
        .single();
      
      if (providerError) throw providerError;
      
      // Map database fields to camelCase for frontend
      const provider = {
        id: providerData.id,
        name: providerData.name,
        provider: providerData.provider,
        apiKey: providerData.api_key,
        isActive: providerData.is_active
      };
      
      if (!provider.isActive) {
        throw new Error(`The selected API provider (${provider.name}) is inactive.`);
      }
      
      // Prepare the prompt
      const prompt = rule.prompt.replace('{{product}}', request.productInfo);
      
      // In a real implementation, this would call the appropriate AI API
      // For now, we'll simulate the response
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (request.type === 'title') {
        // Generate a title
        const title = this.simulateTitleGeneration(request.productInfo, rule.maxLength);
        
        return {
          success: true,
          data: {
            title
          }
        };
      } else {
        // Generate tags
        const tags = this.simulateTagsGeneration(request.productInfo, rule.maxLength);
        
        return {
          success: true,
          data: {
            tags
          }
        };
      }
      
    } catch (error: any) {
      console.error('Error generating AI content:', error);
      return {
        success: false,
        error: error.message || 'An unknown error occurred'
      };
    }
  }
  
  // Simulate title generation (for demo purposes)
  private static simulateTitleGeneration(productInfo: string, maxLength: number): string {
    const keywords = productInfo.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    
    const adjectives = [
      'Handmade', 'Custom', 'Personalized', 'Unique', 'Vintage', 'Modern', 
      'Rustic', 'Minimalist', 'Elegant', 'Premium', 'Exclusive', 'Trendy'
    ];
    
    const nouns = [
      'Gift', 'Design', 'Artwork', 'Creation', 'Piece', 'Item', 
      'Product', 'Present', 'Decor', 'Accessory', 'Collection'
    ];
    
    const occasions = [
      'Birthday', 'Anniversary', 'Wedding', 'Graduation', 'Housewarming',
      'Christmas', 'Holiday', 'Special Occasion', 'Celebration'
    ];
    
    // Pick random elements
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const occasion = occasions[Math.floor(Math.random() * occasions.length)];
    
    // Use keywords from product info if available
    let keyword = 'Item';
    if (keywords.length > 0) {
      keyword = keywords[Math.floor(Math.random() * keywords.length)];
      // Capitalize first letter
      keyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);
    }
    
    // Generate title
    let title = `${adjective} ${keyword} ${noun} - Perfect ${occasion} Gift`;
    
    // Ensure it's within max length
    if (title.length > maxLength) {
      title = title.substring(0, maxLength);
    }
    
    return title;
  }
  
  // Simulate tags generation (for demo purposes)
  private static simulateTagsGeneration(productInfo: string, maxLength: number): string[] {
    const keywords = productInfo.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    
    const baseTags = [
      'handmade', 'custom', 'personalized', 'unique', 'gift idea',
      'birthday gift', 'special occasion', 'home decor', 'wall art',
      'trending', 'best seller', 'popular item', 'fast shipping'
    ];
    
    // Generate tags based on keywords
    const keywordTags = keywords.map(word => {
      return [word, `${word} gift`, `${word} design`, `custom ${word}`];
    }).flat();
    
    // Combine and deduplicate
    const allTags = [...new Set([...baseTags, ...keywordTags])];
    
    // Ensure each tag is within max length
    const validTags = allTags
      .map(tag => tag.substring(0, maxLength))
      .filter((tag, index, self) => self.indexOf(tag) === index) // Remove duplicates
      .slice(0, 13); // Etsy allows max 13 tags
    
    return validTags;
  }
}