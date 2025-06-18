import React, { useState, useEffect } from 'react';
import { BookTemplate as FileTemplate, Plus, Edit, Trash2, Copy, Search, Filter, Grid, List, Save, Download, Store, ExternalLink, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

interface ListingTemplate {
  id: string;
  user_id: string;
  name: string;
  title_template: string;
  description_template: string;
  tags_template: string[];
  price_template?: number;
  category: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface EtsyStore {
  id: string;
  store_name: string;
  is_active: boolean;
  api_credentials: any;
}

interface EtsyDraftListing {
  id: string;
  title: string;
  description: string;
  tags: string[];
  price: number;
  category: string;
  images: string[];
  created_date: string;
}

const ListingTemplatesPage: React.FC = () => {
  const { user, isDemoMode } = useAuth();
  const [templates, setTemplates] = useState<ListingTemplate[]>([]);
  const [stores, setStores] = useState<EtsyStore[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [draftListings, setDraftListings] = useState<EtsyDraftListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<EtsyDraftListing | null>(null);
  const [creatingTemplates, setCreatingTemplates] = useState(false);

  // Form states for creating/editing templates
  const [templateName, setTemplateName] = useState('');
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateTags, setTemplateTags] = useState<string[]>([]);
  const [templatePrice, setTemplatePrice] = useState<number | undefined>(undefined);
  const [templateCategory, setTemplateCategory] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<ListingTemplate | null>(null);

  useEffect(() => {
    if (user) {
      loadTemplates();
      loadStores();
    }
  }, [user]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading listing templates...');
      
      if (isDemoMode) {
        loadDemoTemplates();
        return;
      }
      
      const { data, error } = await supabase
        .from('listing_templates')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Template loading error:', error);
        loadDemoTemplates();
        return;
      }

      if (data && data.length === 0) {
        // If no templates exist, create sample templates
        await createSampleTemplates();
        return;
      }

      console.log(`✅ ${data?.length || 0} listing templates loaded`);
      setTemplates(data || []);
    } catch (error) {
      console.error('❌ Template loading general error:', error);
      loadDemoTemplates();
    } finally {
      setLoading(false);
    }
  };

  const loadDemoTemplates = () => {
    console.log('📋 Loading demo templates...');
    
    const demoTemplates: ListingTemplate[] = [
      {
        id: '1',
        user_id: user?.id || 'demo-user',
        name: 'Vintage Poster Template',
        title_template: 'Vintage {{theme}} Poster - Digital Download - Wall Art - Home Decor - Printable Art',
        description_template: 'Beautiful vintage-style {{theme}} poster perfect for home decoration. High-quality digital download ready for printing.\n\n✅ INSTANT DOWNLOAD\n✅ High resolution JPG and PDF files\n✅ Multiple sizes included: 8x10, 11x14, 16x20, A4, A3\n\nPerfect for living room, bedroom, office, or as a thoughtful gift!',
        tags_template: ['vintage', 'poster', 'digital download', 'printable', 'wall art', 'home decor', 'retro', 'design'],
        price_template: 4.99,
        category: 'Art & Collectibles',
        is_default: true,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        user_id: user?.id || 'demo-user',
        name: 'Modern Typography Template',
        title_template: 'Modern {{theme}} Typography Print - Instant Download - Minimalist Wall Art - Home Decor',
        description_template: 'Clean and modern {{theme}} typography design. Perfect for office or home decoration.\n\n✅ INSTANT DOWNLOAD\n✅ High resolution JPG and PDF files\n✅ Multiple sizes included: 8x10, 11x14, 16x20, A4, A3\n\nThis minimalist design will add a touch of elegance to any space!',
        tags_template: ['typography', 'modern', 'print', 'instant download', 'office decor', 'minimalist', 'black white', 'wall art'],
        price_template: 3.99,
        category: 'Art & Collectibles',
        is_default: false,
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        user_id: user?.id || 'demo-user',
        name: 'Botanical Illustration Template',
        title_template: 'Botanical {{theme}} Illustration Set - Digital Art - Printable Wall Art - Home Decor',
        description_template: 'Set of 4 beautiful botanical {{theme}} illustrations. High-resolution files perfect for printing and framing.\n\n✅ INSTANT DOWNLOAD\n✅ High resolution JPG and PDF files\n✅ Set of 4 coordinating prints\n✅ Multiple sizes included: 8x10, 11x14, 16x20, A4, A3\n\nThese botanical prints will bring nature\'s beauty into your home!',
        tags_template: ['botanical', 'illustration', 'nature', 'plants', 'digital art', 'set', 'printable', 'green'],
        price_template: 7.99,
        category: 'Art & Collectibles',
        is_default: false,
        created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    setTemplates(demoTemplates);
  };

  const createSampleTemplates = async () => {
    try {
      setCreatingTemplates(true);
      console.log('🔄 Creating sample templates...');
      
      if (isDemoMode) {
        loadDemoTemplates();
        return;
      }
      
      const sampleTemplates = [
        {
          user_id: user?.id,
          name: 'Vintage Poster Template',
          title_template: 'Vintage {{theme}} Poster - Digital Download - Wall Art - Home Decor - Printable Art',
          description_template: 'Beautiful vintage-style {{theme}} poster perfect for home decoration. High-quality digital download ready for printing.\n\n✅ INSTANT DOWNLOAD\n✅ High resolution JPG and PDF files\n✅ Multiple sizes included: 8x10, 11x14, 16x20, A4, A3\n\nPerfect for living room, bedroom, office, or as a thoughtful gift!',
          tags_template: ['vintage', 'poster', 'digital download', 'printable', 'wall art', 'home decor', 'retro', 'design'],
          price_template: 4.99,
          category: 'Art & Collectibles',
          is_default: true
        },
        {
          user_id: user?.id,
          name: 'Modern Typography Template',
          title_template: 'Modern {{theme}} Typography Print - Instant Download - Minimalist Wall Art - Home Decor',
          description_template: 'Clean and modern {{theme}} typography design. Perfect for office or home decoration.\n\n✅ INSTANT DOWNLOAD\n✅ High resolution JPG and PDF files\n✅ Multiple sizes included: 8x10, 11x14, 16x20, A4, A3\n\nThis minimalist design will add a touch of elegance to any space!',
          tags_template: ['typography', 'modern', 'print', 'instant download', 'office decor', 'minimalist', 'black white', 'wall art'],
          price_template: 3.99,
          category: 'Art & Collectibles',
          is_default: false
        },
        {
          user_id: user?.id,
          name: 'Botanical Illustration Template',
          title_template: 'Botanical {{theme}} Illustration Set - Digital Art - Printable Wall Art - Home Decor',
          description_template: 'Set of 4 beautiful botanical {{theme}} illustrations. High-resolution files perfect for printing and framing.\n\n✅ INSTANT DOWNLOAD\n✅ High resolution JPG and PDF files\n✅ Set of 4 coordinating prints\n✅ Multiple sizes included: 8x10, 11x14, 16x20, A4, A3\n\nThese botanical prints will bring nature\'s beauty into your home!',
          tags_template: ['botanical', 'illustration', 'nature', 'plants', 'digital art', 'set', 'printable', 'green'],
          price_template: 7.99,
          category: 'Art & Collectibles',
          is_default: false
        }
      ];
      
      // Insert templates one by one
      for (const template of sampleTemplates) {
        const { error } = await supabase
          .from('listing_templates')
          .insert(template);
          
        if (error) {
          console.error('❌ Error creating sample template:', error);
        }
      }
      
      console.log('✅ Sample templates created successfully');
      
      // Load templates again
      const { data, error } = await supabase
        .from('listing_templates')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('❌ Error loading templates after creation:', error);
        loadDemoTemplates();
        return;
      }
      
      setTemplates(data || []);
      
    } catch (error) {
      console.error('❌ Error creating sample templates:', error);
      loadDemoTemplates();
    } finally {
      setCreatingTemplates(false);
    }
  };

  const loadStores = async () => {
    try {
      console.log('🔄 Loading Etsy stores...');
      
      if (isDemoMode) {
        // Load demo stores
        const demoStores: EtsyStore[] = [
          {
            id: 'store1',
            store_name: 'My Etsy Store',
            is_active: true,
            api_credentials: { connected: true }
          },
          {
            id: 'store2',
            store_name: 'My Craft Shop',
            is_active: true,
            api_credentials: { connected: false }
          }
        ];
        
        setStores(demoStores);
        
        // Auto-select first store
        if (demoStores.length > 0) {
          setSelectedStore(demoStores[0].id);
        }
        
        return;
      }
      
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user?.id)
        .eq('platform', 'etsy')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Store loading error:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} Etsy stores loaded`);
      setStores(data || []);
      
      // Auto-select first store
      if (data && data.length > 0) {
        setSelectedStore(data[0].id);
      }
    } catch (error) {
      console.error('❌ Store loading general error:', error);
      
      // Load demo stores on error
      const demoStores: EtsyStore[] = [
        {
          id: 'store1',
          store_name: 'My Etsy Store',
          is_active: true,
          api_credentials: { connected: true }
        },
        {
          id: 'store2',
          store_name: 'My Craft Shop',
          is_active: true,
          api_credentials: { connected: false }
        }
      ];
      
      setStores(demoStores);
      
      // Auto-select first store
      if (demoStores.length > 0) {
        setSelectedStore(demoStores[0].id);
      }
    }
  };

  const loadDraftListings = async (storeId: string) => {
    if (!storeId) return;
    
    try {
      setLoadingDrafts(true);
      console.log(`🔄 Loading draft listings for store ${storeId}...`);
      
      // TODO: When Etsy API integration comes, this will be active
      // For now we're using mock data
      const mockDrafts: EtsyDraftListing[] = [
        {
          id: '1',
          title: 'Vintage Style Poster Design - Digital Download',
          description: 'Beautiful vintage-style poster perfect for home decoration. High-quality digital download ready for printing.',
          tags: ['vintage', 'poster', 'digital download', 'printable', 'wall art', 'home decor', 'retro', 'design'],
          price: 4.99,
          category: 'Art & Collectibles',
          images: ['https://images.pexels.com/photos/1070945/pexels-photo-1070945.jpeg?auto=compress&cs=tinysrgb&w=400'],
          created_date: '2024-01-15'
        },
        {
          id: '2',
          title: 'Modern Typography Print - Instant Download',
          description: 'Clean and modern typography design. Perfect for office or home decoration. Instant digital download.',
          tags: ['typography', 'modern', 'print', 'instant download', 'office decor', 'minimalist', 'black white'],
          price: 3.99,
          category: 'Art & Collectibles',
          images: ['https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=400'],
          created_date: '2024-01-10'
        },
        {
          id: '3',
          title: 'Botanical Illustration Set - Digital Art',
          description: 'Set of 4 botanical illustrations. High-resolution files perfect for printing and framing.',
          tags: ['botanical', 'illustration', 'nature', 'plants', 'digital art', 'set', 'printable', 'green'],
          price: 7.99,
          category: 'Art & Collectibles',
          images: ['https://images.pexels.com/photos/1055379/pexels-photo-1055379.jpeg?auto=compress&cs=tinysrgb&w=400'],
          created_date: '2024-01-05'
        },
        {
          id: '4',
          title: 'Watercolor Floral Bundle - Digital Clipart',
          description: 'Beautiful watercolor floral elements. Perfect for wedding invitations and crafting projects.',
          tags: ['watercolor', 'floral', 'clipart', 'wedding', 'invitation', 'digital', 'bundle'],
          price: 12.99,
          category: 'Craft Supplies & Tools',
          images: ['https://images.pexels.com/photos/1070850/pexels-photo-1070850.jpeg?auto=compress&cs=tinysrgb&w=400'],
          created_date: '2024-01-01'
        },
        {
          id: '5',
          title: 'Abstract Geometric Art - Printable Wall Art',
          description: 'Contemporary abstract geometric design. Perfect for modern interiors.',
          tags: ['abstract', 'geometric', 'modern', 'wall art', 'contemporary', 'printable', 'colorful'],
          price: 5.99,
          category: 'Art & Collectibles',
          images: ['https://images.pexels.com/photos/1109354/pexels-photo-1109354.jpeg?auto=compress&cs=tinysrgb&w=400'],
          created_date: '2024-01-25'
        }
      ];
      
      setDraftListings(mockDrafts);
      console.log(`✅ ${mockDrafts.length} draft listings loaded (mock data)`);
    } catch (error) {
      console.error('❌ Draft listing loading error:', error);
    } finally {
      setLoadingDrafts(false);
    }
  };

  useEffect(() => {
    if (selectedStore) {
      loadDraftListings(selectedStore);
    }
  }, [selectedStore]);

  const createTemplateFromDraft = async (draft: EtsyDraftListing) => {
    try {
      console.log('🔄 Creating template from draft:', draft.title);
      
      if (isDemoMode) {
        // Create a demo template
        const newTemplate: ListingTemplate = {
          id: `demo-${Date.now()}`,
          user_id: user?.id || 'demo-user',
          name: `Template: ${draft.title}`,
          title_template: draft.title,
          description_template: draft.description,
          tags_template: draft.tags,
          price_template: draft.price,
          category: draft.category,
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setTemplates(prev => [newTemplate, ...prev]);
        setShowDraftModal(false);
        setSelectedDraft(null);
        
        alert('Template created successfully! 🎉');
        return;
      }
      
      const templateData = {
        user_id: user?.id,
        name: `Template: ${draft.title}`,
        title_template: draft.title,
        description_template: draft.description,
        tags_template: draft.tags,
        price_template: draft.price,
        category: draft.category,
        is_default: false
      };

      const { data, error } = await supabase
        .from('listing_templates')
        .insert(templateData)
        .select()
        .single();

      if (error) {
        console.error('❌ Template creation error:', error);
        throw error;
      }

      console.log('✅ Template created successfully:', data);
      await loadTemplates();
      setShowDraftModal(false);
      setSelectedDraft(null);
      
      alert('Template created successfully! 🎉');
    } catch (error) {
      console.error('❌ Template creation general error:', error);
      alert('Error occurred while creating template.');
    }
  };

  const createTemplate = async () => {
    if (!templateName.trim()) {
      alert('Template name is required!');
      return;
    }
    
    try {
      console.log('🔄 Creating template manually...');
      
      if (isDemoMode) {
        // Create a demo template
        const newTemplate: ListingTemplate = {
          id: `demo-${Date.now()}`,
          user_id: user?.id || 'demo-user',
          name: templateName,
          title_template: templateTitle,
          description_template: templateDescription,
          tags_template: templateTags,
          price_template: templatePrice,
          category: templateCategory,
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setTemplates(prev => [newTemplate, ...prev]);
        resetForm();
        
        alert('Template created successfully! 🎉');
        return;
      }
      
      const templateData = {
        user_id: user?.id,
        name: templateName,
        title_template: templateTitle,
        description_template: templateDescription,
        tags_template: templateTags,
        price_template: templatePrice,
        category: templateCategory,
        is_default: false
      };

      let result;
      
      if (editingTemplate) {
        // Update existing template
        result = await supabase
          .from('listing_templates')
          .update(templateData)
          .eq('id', editingTemplate.id)
          .eq('user_id', user?.id)
          .select()
          .single();
      } else {
        // Create new template
        result = await supabase
          .from('listing_templates')
          .insert(templateData)
          .select()
          .single();
      }

      if (result.error) {
        console.error('❌ Template creation/update error:', result.error);
        throw result.error;
      }

      console.log('✅ Template created/updated successfully:', result.data);
      await loadTemplates();
      resetForm();
      
      alert(`Template ${editingTemplate ? 'updated' : 'created'} successfully! 🎉`);
    } catch (error) {
      console.error('❌ Template creation/update general error:', error);
      alert(`Error occurred while ${editingTemplate ? 'updating' : 'creating'} template.`);
    }
  };

  const resetForm = () => {
    setTemplateName('');
    setTemplateTitle('');
    setTemplateDescription('');
    setTemplateTags([]);
    setTemplatePrice(undefined);
    setTemplateCategory('');
    setEditingTemplate(null);
    setShowCreateModal(false);
  };

  const openEditForm = (template: ListingTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateTitle(template.title_template);
    setTemplateDescription(template.description_template);
    setTemplateTags(template.tags_template);
    setTemplatePrice(template.price_template);
    setTemplateCategory(template.category);
    setShowCreateModal(true);
  };

  const deleteTemplate = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      if (isDemoMode) {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
        setSelectedTemplates(prev => prev.filter(id => id !== templateId));
        return;
      }
      
      const { error } = await supabase
        .from('listing_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => t.id !== templateId));
      setSelectedTemplates(prev => prev.filter(id => id !== templateId));
    } catch (error) {
      console.error('Template deletion error:', error);
      alert('Error occurred while deleting template');
    }
  };

  const duplicateTemplate = async (template: ListingTemplate) => {
    try {
      if (isDemoMode) {
        const newTemplate: ListingTemplate = {
          ...template,
          id: `demo-${Date.now()}`,
          name: `${template.name} (Copy)`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_default: false
        };
        
        setTemplates(prev => [newTemplate, ...prev]);
        return;
      }
      
      const { error } = await supabase
        .from('listing_templates')
        .insert({
          user_id: user?.id,
          name: `${template.name} (Copy)`,
          title_template: template.title_template,
          description_template: template.description_template,
          tags_template: template.tags_template,
          price_template: template.price_template,
          category: template.category,
          is_default: false
        });

      if (error) throw error;

      await loadTemplates();
    } catch (error) {
      console.error('Template duplication error:', error);
      alert('Error occurred while duplicating template');
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.title_template.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleTemplateSelection = (templateId: string) => {
    setSelectedTemplates(prev =>
      prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  const selectAllTemplates = () => {
    if (selectedTemplates.length === filteredTemplates.length) {
      setSelectedTemplates([]);
    } else {
      setSelectedTemplates(filteredTemplates.map(t => t.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTemplates.length === 0) return;

    if (!window.confirm(`Are you sure you want to delete ${selectedTemplates.length} template(s)?`)) return;

    try {
      if (isDemoMode) {
        setTemplates(prev => prev.filter(t => !selectedTemplates.includes(t.id)));
        setSelectedTemplates([]);
        return;
      }
      
      const { error } = await supabase
        .from('listing_templates')
        .delete()
        .in('id', selectedTemplates)
        .eq('user_id', user?.id);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => !selectedTemplates.includes(t.id)));
      setSelectedTemplates([]);
    } catch (error) {
      console.error('Bulk deletion error:', error);
      alert('Error occurred while deleting templates');
    }
  };

  if (loading || creatingTemplates) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <FileTemplate className="h-6 w-6 mr-2 text-orange-500" />
            Listing Templates
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create templates from Etsy draft listings and manage them ({templates.length} templates)
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button
            onClick={() => setShowDraftModal(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
            disabled={!selectedStore || stores.length === 0}
          >
            <Plus className="h-4 w-4" />
            <span>Create from Draft</span>
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="secondary"
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Manually</span>
          </Button>
        </div>
      </div>

      {/* Store Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <Store className="h-5 w-5 text-orange-500" />
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Etsy Store:
            </label>
            {stores.length > 0 ? (
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select store...</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.store_name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-gray-500 dark:text-gray-400">
                No Etsy stores added yet. 
                <a href="/admin/stores" className="text-orange-500 hover:text-orange-600 ml-1">
                  Add a store
                </a>
              </div>
            )}
          </div>
          {selectedStore && (
            <Button
              onClick={() => loadDraftListings(selectedStore)}
              variant="secondary"
              size="sm"
              disabled={loadingDrafts}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${loadingDrafts ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-orange-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400'} rounded-l-lg`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400'} rounded-r-lg`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedTemplates.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-orange-700 dark:text-orange-400">
              {selectedTemplates.length} template(s) selected
            </span>
            <div className="flex space-x-2">
              <Button onClick={handleBulkDelete} variant="danger" size="sm">
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Selected
              </Button>
              <Button onClick={() => setSelectedTemplates([])} variant="secondary" size="sm">
                Clear Selection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Display */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <FileTemplate className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'No templates found' : 'No listing templates yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Start creating templates from your Etsy draft listings'
            }
          </p>
          {!searchTerm && (
            <div className="flex justify-center space-x-3">
              <Button
                onClick={() => setShowDraftModal(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
                disabled={!selectedStore}
              >
                <Plus className="h-4 w-4" />
                <span>Create from Draft</span>
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                variant="secondary"
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Create Manually</span>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Select All Checkbox */}
          <div className="flex items-center space-x-2 pb-4 border-b border-gray-200 dark:border-gray-700">
            <input
              type="checkbox"
              checked={selectedTemplates.length === filteredTemplates.length}
              onChange={selectAllTemplates}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Select all ({filteredTemplates.length} templates)
            </label>
          </div>

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedTemplates.includes(template.id)}
                          onChange={() => toggleTemplateSelection(template.id)}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <CardTitle className="text-lg truncate">{template.name}</CardTitle>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => duplicateTemplate(template)}
                          className="text-blue-500 hover:text-blue-700 p-1"
                          title="Duplicate template"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Delete template"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">Title:</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {template.title_template}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">Description:</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                          {template.description_template}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">Tags:</h4>
                        <div className="flex flex-wrap gap-1">
                          {template.tags_template.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-600 dark:text-gray-400"
                            >
                              {tag}
                            </span>
                          ))}
                          {template.tags_template.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-600 dark:text-gray-400">
                              +{template.tags_template.length - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>Category: {template.category}</span>
                        {template.price_template && (
                          <span>Price: ${template.price_template}</span>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Created: {formatDate(template.created_at)}
                      </div>
                    </div>

                    <div className="flex space-x-2 mt-4">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => openEditForm(template)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => alert('Template use functionality will be implemented soon')}
                      >
                        Use
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedTemplates.length === filteredTemplates.length}
                        onChange={selectAllTemplates}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tag Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredTemplates.map((template) => (
                    <tr key={template.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedTemplates.includes(template.id)}
                          onChange={() => toggleTemplateSelection(template.id)}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {template.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                          {template.title_template}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {template.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {template.tags_template.length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {template.price_template ? `$${template.price_template}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatDate(template.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => openEditForm(template)}
                          className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => duplicateTemplate(template)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Duplicate"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Draft Listings Modal */}
      {showDraftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Etsy Draft Listings
                </h2>
                <button
                  onClick={() => setShowDraftModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Select draft listings from your selected store and save them as templates
              </p>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {loadingDrafts ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : draftListings.length === 0 ? (
                <div className="text-center py-8">
                  <FileTemplate className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No draft listings found in this store
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {draftListings.map((draft) => (
                    <Card key={draft.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2">
                            {draft.title}
                          </h3>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                            {draft.description}
                          </p>
                          
                          <div className="flex flex-wrap gap-1">
                            {draft.tags.slice(0, 4).map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-600 dark:text-gray-400"
                              >
                                {tag}
                              </span>
                            ))}
                            {draft.tags.length > 4 && (
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-600 dark:text-gray-400">
                                +{draft.tags.length - 4}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>{draft.category}</span>
                            <span>${draft.price}</span>
                          </div>
                          
                          <Button
                            onClick={() => createTemplateFromDraft(draft)}
                            className="w-full"
                            size="sm"
                          >
                            Save as Template
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingTemplate ? 'Edit Template' : 'Create Template'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-4">
              {/* Template Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Name:
                </label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. Vintage Poster Template"
                  className="w-full"
                />
              </div>
              
              {/* Template Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title Template:
                </label>
                <Input
                  value={templateTitle}
                  onChange={(e) => setTemplateTitle(e.target.value)}
                  placeholder="e.g. Vintage {{theme}} Poster - Digital Download"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Use {{variables}} for dynamic content, e.g. {{theme}}, {{color}}, etc.
                </p>
              </div>
              
              {/* Template Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description Template:
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="e.g. Beautiful vintage-style {{theme}} poster perfect for home decoration..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 resize-none"
                  rows={6}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Use {{variables}} for dynamic content, e.g. {{theme}}, {{color}}, etc.
                </p>
              </div>
              
              {/* Template Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags Template:
                </label>
                <Input
                  value={templateTags.join(', ')}
                  onChange={(e) => setTemplateTags(e.target.value.split(',').map(tag => tag.trim()))}
                  placeholder="e.g. vintage, poster, digital download, printable"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter tags separated by commas. Maximum 13 tags.
                </p>
              </div>
              
              {/* Template Price and Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price Template:
                  </label>
                  <Input
                    type="number"
                    value={templatePrice || ''}
                    onChange={(e) => setTemplatePrice(e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="e.g. 4.99"
                    className="w-full"
                    step="0.01"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category:
                  </label>
                  <Input
                    value={templateCategory}
                    onChange={(e) => setTemplateCategory(e.target.value)}
                    placeholder="e.g. Art & Collectibles"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-3">
                <Button
                  onClick={createTemplate}
                  className="flex-1"
                >
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </Button>
                <Button
                  onClick={resetForm}
                  variant="secondary"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingTemplatesPage;