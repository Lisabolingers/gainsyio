import React, { useState, useRef, useEffect } from 'react';
import { Upload, Plus, Trash2, X, Check, Image as ImageIcon, FileText, Tag, BookTemplate as Template, Grid as Grid3X3, Send, Sparkles, RefreshCw, ChevronDown, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';

interface DesignItem {
  id: string;
  designType: 'upload' | 'autoText';
  blackDesign: {
    file: File | null;
    preview: string;
  };
  whiteDesign: {
    file: File | null;
    preview: string;
  };
  title: string;
  aiTitle: string;
  tags: string[];
  aiTags: string[];
  tagInput: string;
  template: string;
  mockupFolder: string;
  // Auto Text Design fields
  textTemplate: string;
  textValues: Record<string, string>; // Dinamik text alanları için
}

interface AIRule {
  id: string;
  type: 'title' | 'tags';
  name: string;
  isDefault: boolean;
}

interface TextTemplate {
  id: string;
  name: string;
  style_settings?: {
    texts?: any[];
  };
}

const MAX_TITLE_LENGTH = 140;
const MAX_TAG_COUNT = 13;
const MAX_TAG_LENGTH = 20;

const DesignUploadPage: React.FC = () => {
  const { user } = useAuth();
  const [designItems, setDesignItems] = useState<DesignItem[]>([
    {
      id: '1',
      designType: 'upload',
      blackDesign: { file: null, preview: '' },
      whiteDesign: { file: null, preview: '' },
      title: '',
      aiTitle: '',
      tags: [],
      aiTags: [],
      tagInput: '',
      template: '',
      mockupFolder: '',
      textTemplate: '',
      textValues: {}
    }
  ]);
  const [templates, setTemplates] = useState<{id: string, name: string}[]>([
    { id: '1', name: 'Vintage Style Template' },
    { id: '2', name: 'Modern Minimalist' },
    { id: '3', name: 'Bold Typography' },
    { id: '4', name: 'Elegant Script' },
    { id: '5', name: 'Rustic Handmade' },
    { id: '6', name: 'Abstract Art' },
  ]);
  const [mockupFolders, setMockupFolders] = useState([
    { id: '1', name: 'T-Shirts' },
    { id: '2', name: 'Mugs' },
    { id: '3', name: 'Posters' },
    { id: '4', name: 'Phone Cases' },
    { id: '5', name: 'Canvas Prints' },
    { id: '6', name: 'Tote Bags' },
  ]);
  const [textTemplates, setTextTemplates] = useState<TextTemplate[]>([
    { id: '1', name: 'Basic Text Template', style_settings: { texts: [{}] } },
    { id: '2', name: 'Curved Text', style_settings: { texts: [{}, {}] } },
    { id: '3', name: 'Stacked Text', style_settings: { texts: [{}, {}, {}] } },
    { id: '4', name: 'Minimalist Text', style_settings: { texts: [{}] } },
    { id: '5', name: 'Bold Typography', style_settings: { texts: [{}, {}] } },
  ]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState<{[key: string]: boolean}>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // AI Rules
  const [titleRules, setTitleRules] = useState<AIRule[]>([]);
  const [tagRules, setTagRules] = useState<AIRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  
  const blackFileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const whiteFileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const tagInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize refs array when designItems changes
  useEffect(() => {
    blackFileInputRefs.current = blackFileInputRefs.current.slice(0, designItems.length);
    whiteFileInputRefs.current = whiteFileInputRefs.current.slice(0, designItems.length);
    tagInputRefs.current = tagInputRefs.current.slice(0, designItems.length);
  }, [designItems.length]);

  // Load AI rules on component mount
  useEffect(() => {
    if (user) {
      loadAIRules();
      loadTextTemplates();
    }
  }, [user]);

  const loadAIRules = async () => {
    try {
      setLoadingRules(true);
      console.log('🔄 Loading AI rules...');
      
      const { data, error } = await supabase
        .from('ai_rules')
        .select('id, type, name, is_default')
        .eq('user_id', user?.id);
      
      if (error) {
        console.error('❌ AI rules loading error:', error);
        throw error;
      }
      
      // Split rules by type
      const titleRules = data?.filter(rule => rule.type === 'title') || [];
      const tagRules = data?.filter(rule => rule.type === 'tags') || [];
      
      setTitleRules(titleRules);
      setTagRules(tagRules);
      
      console.log(`✅ Loaded ${titleRules.length} title rules and ${tagRules.length} tag rules`);
    } catch (error: any) {
      console.error('❌ Error loading AI rules:', error);
      // Don't show error to user, just log it
    } finally {
      setLoadingRules(false);
    }
  };

  const loadTextTemplates = async () => {
    try {
      console.log('🔄 Loading text templates...');
      
      const { data, error } = await supabase
        .from('auto_text_templates')
        .select('id, name, style_settings')
        .eq('user_id', user?.id);
      
      if (error) {
        console.error('❌ Text templates loading error:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        setTextTemplates(data);
        console.log(`✅ Loaded ${data.length} text templates`);
      }
    } catch (error: any) {
      console.error('❌ Error loading text templates:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, itemIndex: number, designType: 'black' | 'white') => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Sadece resim dosyaları yüklenebilir.');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Dosya boyutu 5MB\'dan küçük olmalıdır.');
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      
      setDesignItems(prev => prev.map((item, idx) => {
        if (idx === itemIndex) {
          return {
            ...item,
            [designType === 'black' ? 'blackDesign' : 'whiteDesign']: {
              file,
              preview
            }
          };
        }
        return item;
      }));
    };
    reader.readAsDataURL(file);
    
    // Reset error if any
    setError(null);
  };

  const removeDesign = (itemIndex: number, designType: 'black' | 'white') => {
    setDesignItems(prev => prev.map((item, idx) => {
      if (idx === itemIndex) {
        return {
          ...item,
          [designType === 'black' ? 'blackDesign' : 'whiteDesign']: {
            file: null,
            preview: ''
          }
        };
      }
      return item;
    }));
  };

  const handleTitleChange = (value: string, itemIndex: number) => {
    // Limit title length
    if (value.length > MAX_TITLE_LENGTH) {
      value = value.substring(0, MAX_TITLE_LENGTH);
    }
    
    setDesignItems(prev => prev.map((item, idx) => {
      if (idx === itemIndex) {
        return { ...item, title: value };
      }
      return item;
    }));
  };

  const handleTagInputChange = (value: string, itemIndex: number) => {
    setDesignItems(prev => prev.map((item, idx) => {
      if (idx === itemIndex) {
        return { ...item, tagInput: value };
      }
      return item;
    }));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, itemIndex: number) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = designItems[itemIndex].tagInput.trim();
      
      if (value) {
        addTag(itemIndex, value);
        
        // Clear input
        setDesignItems(prev => prev.map((item, idx) => {
          if (idx === itemIndex) {
            return { ...item, tagInput: '' };
          }
          return item;
        }));
      }
    }
  };

  const addTag = (itemIndex: number, tag: string) => {
    if (!tag.trim()) return;
    
    // Remove commas from tag
    tag = tag.replace(/,/g, '').trim();
    
    setDesignItems(prev => prev.map((item, idx) => {
      if (idx === itemIndex) {
        // Check if we already have MAX_TAG_COUNT tags
        if (item.tags.length >= MAX_TAG_COUNT) {
          return item;
        }
        
        // Check if tag already exists
        if (item.tags.includes(tag)) {
          return item;
        }
        
        // Limit tag length
        const formattedTag = tag.length > MAX_TAG_LENGTH ? tag.substring(0, MAX_TAG_LENGTH) : tag;
        
        return { 
          ...item, 
          tags: [...item.tags, formattedTag] 
        };
      }
      return item;
    }));
  };

  const handleTemplateChange = (value: string, itemIndex: number) => {
    setDesignItems(prev => prev.map((item, idx) => {
      if (idx === itemIndex) {
        return { ...item, template: value };
      }
      return item;
    }));
  };

  const handleMockupFolderChange = (value: string, itemIndex: number) => {
    setDesignItems(prev => prev.map((item, idx) => {
      if (idx === itemIndex) {
        return { ...item, mockupFolder: value };
      }
      return item;
    }));
  };

  const handleTextTemplateChange = (value: string, itemIndex: number) => {
    // Find the selected template to get the number of text fields
    const selectedTemplate = textTemplates.find(t => t.id === value);
    const textCount = selectedTemplate?.style_settings?.texts?.length || 0;
    
    // Create empty text values object with the right number of fields
    const textValues: Record<string, string> = {};
    for (let i = 1; i <= textCount; i++) {
      textValues[`text${i}`] = '';
    }
    
    setDesignItems(prev => prev.map((item, idx) => {
      if (idx === itemIndex) {
        return { 
          ...item, 
          textTemplate: value,
          textValues: textValues
        };
      }
      return item;
    }));
  };

  const handleTextValueChange = (field: string, value: string, itemIndex: number) => {
    setDesignItems(prev => prev.map((item, idx) => {
      if (idx === itemIndex) {
        return { 
          ...item, 
          textValues: {
            ...item.textValues,
            [field]: value
          }
        };
      }
      return item;
    }));
  };

  const toggleDesignType = (itemIndex: number, type: 'upload' | 'autoText') => {
    setDesignItems(prev => prev.map((item, idx) => {
      if (idx === itemIndex) {
        return { 
          ...item, 
          designType: type,
          // Reset design files when switching to Auto Text Design
          ...(type === 'autoText' ? {
            blackDesign: { file: null, preview: '' },
            whiteDesign: { file: null, preview: '' }
          } : {})
        };
      }
      return item;
    }));
  };

  const generateDesigns = async (itemIndex: number) => {
    const item = designItems[itemIndex];
    
    // Check if we have a template and text values
    if (!item.textTemplate) {
      setError('Lütfen bir text template seçin.');
      return;
    }
    
    // Check if at least one text field is filled
    const hasText = Object.values(item.textValues).some(text => text.trim() !== '');
    if (!hasText) {
      setError('Lütfen en az bir metin alanını doldurun.');
      return;
    }
    
    try {
      // Simulate loading
      setLoading(true);
      
      console.log('🔄 Generating designs from text template...');
      
      // In a real implementation, this would call an API to generate designs
      // For now, we'll simulate it with placeholder images
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate black and white designs
      const blackPreview = 'https://images.pexels.com/photos/3094218/pexels-photo-3094218.jpeg?auto=compress&cs=tinysrgb&w=400';
      const whitePreview = 'https://images.pexels.com/photos/1109354/pexels-photo-1109354.jpeg?auto=compress&cs=tinysrgb&w=400';
      
      // Update design items with previews
      setDesignItems(prev => prev.map((item, idx) => {
        if (idx === itemIndex) {
          return {
            ...item,
            blackDesign: {
              file: null,
              preview: blackPreview
            },
            whiteDesign: {
              file: null,
              preview: whitePreview
            }
          };
        }
        return item;
      }));
      
      // Save to temporary files (in a real implementation)
      // Here we'll just simulate the API call
      console.log('💾 Saving designs to temporary files...');
      
      // Simulate saving to temporary files
      const blackFile = {
        id: `temp-black-${Date.now()}`,
        user_id: user?.id,
        file_name: `Auto_Text_Black_${Date.now()}.png`,
        file_url: blackPreview,
        file_type: 'image/png',
        file_size: 245000,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
      };
      
      const whiteFile = {
        id: `temp-white-${Date.now()}`,
        user_id: user?.id,
        file_name: `Auto_Text_White_${Date.now()}.png`,
        file_url: whitePreview,
        file_type: 'image/png',
        file_size: 245000,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
      };
      
      // In a real implementation, we would save these to the temporary_files table
      // For now, we'll just log them
      console.log('✅ Designs saved to temporary files:', { blackFile, whiteFile });
      
      // Show success message
      setSuccess('Tasarımlar başarıyla oluşturuldu ve 10 dakika içinde Temporary Files bölümünde görüntülenebilir.');
      
    } catch (error: any) {
      console.error('❌ Error generating designs:', error);
      setError(`Tasarım oluşturulurken hata: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addNewDesignItem = () => {
    setDesignItems(prev => [
      ...prev,
      {
        id: `${Date.now()}`,
        designType: 'upload',
        blackDesign: { file: null, preview: '' },
        whiteDesign: { file: null, preview: '' },
        title: '',
        aiTitle: '',
        tags: [],
        aiTags: [],
        tagInput: '',
        template: '',
        mockupFolder: '',
        textTemplate: '',
        textValues: {}
      }
    ]);
  };

  const removeDesignItem = (itemIndex: number) => {
    if (designItems.length <= 1) {
      setError('En az bir tasarım öğesi gereklidir.');
      return;
    }
    
    setDesignItems(prev => prev.filter((_, idx) => idx !== itemIndex));
  };

  const removeTag = (itemIndex: number, tagIndex: number) => {
    setDesignItems(prev => prev.map((item, idx) => {
      if (idx === itemIndex) {
        const newTags = [...item.tags];
        newTags.splice(tagIndex, 1);
        
        // If we removed a tag, add one from AI suggestions if available
        let newAiTags = [...item.aiTags];
        if (newAiTags.length > 0 && newTags.length < MAX_TAG_COUNT) {
          const newTag = newAiTags.shift();
          if (newTag) {
            newTags.push(newTag);
          }
        }
        
        return { ...item, tags: newTags, aiTags: newAiTags };
      }
      return item;
    }));
  };

  const generateAIContent = async (itemIndex: number, contentType: 'title' | 'tags') => {
    const item = designItems[itemIndex];
    
    // Check if we have enough information
    if (!item.title && contentType === 'tags') {
      setError('Etiket önerileri oluşturmak için önce bir başlık girin.');
      return;
    }
    
    try {
      setAiLoading(prev => ({ ...prev, [`${itemIndex}-${contentType}`]: true }));
      
      // Get the default rule for this content type
      const defaultRule = contentType === 'title' 
        ? titleRules.find(rule => rule.isDefault)
        : tagRules.find(rule => rule.isDefault);
      
      if (!defaultRule) {
        throw new Error(`${contentType === 'title' ? 'Başlık' : 'Etiket'} oluşturma için varsayılan kural bulunamadı. Lütfen AI Agent sayfasından bir kural oluşturun ve varsayılan olarak ayarlayın.`);
      }
      
      console.log(`🤖 Generating ${contentType} using rule: ${defaultRule.name}`);
      
      // In a real implementation, this would call an AI service via Supabase Edge Function
      // For now, we'll simulate the AI response
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (contentType === 'title') {
        // Generate AI title based on tags or other info
        const aiTitle = generateMockAITitle(item);
        
        setDesignItems(prev => prev.map((item, idx) => {
          if (idx === itemIndex) {
            return { ...item, aiTitle };
          }
          return item;
        }));
      } else {
        // Generate AI tags based on title
        const aiTags = generateMockAITags(item);
        
        setDesignItems(prev => prev.map((item, idx) => {
          if (idx === itemIndex) {
            // If we have no tags yet, automatically use some AI tags
            if (item.tags.length === 0) {
              const tagsToUse = aiTags.slice(0, MAX_TAG_COUNT);
              const remainingTags = aiTags.slice(MAX_TAG_COUNT);
              return { 
                ...item, 
                tags: tagsToUse,
                aiTags: remainingTags
              };
            }
            
            return { ...item, aiTags };
          }
          return item;
        }));
      }
      
    } catch (error: any) {
      console.error('❌ Error generating AI content:', error);
      setError(`AI içeriği oluşturulurken hata: ${error.message}`);
    } finally {
      setAiLoading(prev => ({ ...prev, [`${itemIndex}-${contentType}`]: false }));
    }
  };

  // Mock AI title generator
  const generateMockAITitle = (item: DesignItem): string => {
    const baseTitle = item.title.trim() || "T-shirt Design";
    const adjectives = ["Vintage", "Modern", "Minimalist", "Elegant", "Rustic", "Bold", "Creative", "Unique", "Premium", "Handcrafted"];
    const nouns = ["Style", "Collection", "Edition", "Series", "Design", "Artwork", "Creation", "Masterpiece"];
    
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    
    if (item.title) {
      // Enhance existing title
      if (item.title.includes("shirt") || item.title.includes("tshirt") || item.title.includes("t-shirt")) {
        return `${randomAdj} ${item.title} - Perfect Gift Idea`;
      } else {
        return `${randomAdj} ${item.title} ${randomNoun} - Unique Gift`;
      }
    } else {
      // Create new title
      return `${randomAdj} T-shirt ${randomNoun} - Unique Gift Idea`;
    }
  };

  // Mock AI tags generator
  const generateMockAITags = (item: DesignItem): string[] => {
    const baseTags = ["gift idea", "custom design", "unique gift", "personalized", "handmade", "trending"];
    const titleWords = item.title.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    
    // Add some title-based tags
    const titleTags = titleWords.map(word => {
      const relatedWords: {[key: string]: string[]} = {
        "shirt": ["tshirt", "clothing", "apparel", "fashion"],
        "vintage": ["retro", "classic", "nostalgic", "old school"],
        "modern": ["contemporary", "minimalist", "sleek", "trendy"],
        "gift": ["present", "birthday gift", "holiday gift", "special occasion"],
        "design": ["artwork", "graphic", "illustration", "creative"],
        "custom": ["personalized", "unique", "one of a kind", "special"],
      };
      
      return relatedWords[word] || [`${word} design`, `${word} gift`, `${word} lover`];
    }).flat();
    
    // Combine and deduplicate
    const allTags = [...new Set([...baseTags, ...titleTags])];
    
    // Return random selection of tags
    return allTags
      .sort(() => 0.5 - Math.random())
      .slice(0, MAX_TAG_COUNT + 5); // Generate a few extra for suggestions
  };

  const useAITitle = (itemIndex: number) => {
    const item = designItems[itemIndex];
    if (!item.aiTitle) return;
    
    setDesignItems(prev => prev.map((item, idx) => {
      if (idx === itemIndex) {
        return { ...item, title: item.aiTitle, aiTitle: '' };
      }
      return item;
    }));
  };

  const useAITags = (itemIndex: number) => {
    const item = designItems[itemIndex];
    if (item.aiTags.length === 0) return;
    
    setDesignItems(prev => prev.map((item, idx) => {
      if (idx === itemIndex) {
        // Calculate how many tags we can add
        const availableSlots = MAX_TAG_COUNT - item.tags.length;
        if (availableSlots <= 0) return item;
        
        // Take tags from AI suggestions
        const tagsToAdd = item.aiTags.slice(0, availableSlots);
        const remainingTags = item.aiTags.slice(availableSlots);
        
        return { 
          ...item, 
          tags: [...item.tags, ...tagsToAdd],
          aiTags: remainingTags
        };
      }
      return item;
    }));
  };

  const handleSubmit = async () => {
    // Validate inputs
    const invalidItems = designItems.filter(item => {
      if (item.designType === 'upload') {
        const hasBlackOrWhite = item.blackDesign.file !== null || item.whiteDesign.file !== null;
        return !item.title.trim() || item.tags.length === 0 || !hasBlackOrWhite || !item.template || !item.mockupFolder;
      } else { // autoText
        const hasDesigns = item.blackDesign.preview !== '' || item.whiteDesign.preview !== '';
        return !item.title.trim() || item.tags.length === 0 || !hasDesigns || !item.template || !item.mockupFolder;
      }
    });
    
    if (invalidItems.length > 0) {
      setError('Lütfen her öğe için tüm alanları doldurun ve en az bir tasarım yükleyin.');
      return;
    }
    
    // Submit form
    try {
      setLoading(true);
      setError(null);
      
      // In a real implementation, this would upload files to Supabase Storage
      // and create records in the database
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess(`${designItems.length} tasarım başarıyla yüklendi ve Etsy'ye gönderildi! 🎉`);
      
      // Reset form
      setDesignItems([
        {
          id: '1',
          designType: 'upload',
          blackDesign: { file: null, preview: '' },
          whiteDesign: { file: null, preview: '' },
          title: '',
          aiTitle: '',
          tags: [],
          aiTags: [],
          tagInput: '',
          template: '',
          mockupFolder: '',
          textTemplate: '',
          textValues: {}
        }
      ]);
      
    } catch (error: any) {
      console.error('❌ Error submitting designs:', error);
      setError(`Gönderim sırasında hata: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle "Use" button for tags
  const useTagsFromAI = (itemIndex: number) => {
    const item = designItems[itemIndex];
    
    // Convert AI tags to comma-separated string and add to tagInput
    if (item.aiTags.length > 0) {
      const tagsString = item.aiTags.join(', ');
      
      setDesignItems(prev => prev.map((item, idx) => {
        if (idx === itemIndex) {
          return { 
            ...item, 
            tagInput: tagsString,
            aiTags: []
          };
        }
        return item;
      }));
      
      // Focus on the tag input
      setTimeout(() => {
        if (tagInputRefs.current[itemIndex]) {
          tagInputRefs.current[itemIndex]?.focus();
        }
      }, 100);
    }
  };

  // Get text field count for a template
  const getTextFieldCount = (templateId: string): number => {
    const template = textTemplates.find(t => t.id === templateId);
    return template?.style_settings?.texts?.length || 0;
  };

  // Save designs to temporary files
  const saveToTemporaryFiles = async (blackPreview: string, whitePreview: string) => {
    try {
      // In a real implementation, this would save to the temporary_files table
      // For now, we'll just simulate it
      
      const blackFile = {
        user_id: user?.id,
        file_name: `Auto_Text_Black_${Date.now()}.png`,
        file_url: blackPreview,
        file_type: 'image',
        file_size: 245000,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
      };
      
      const whiteFile = {
        user_id: user?.id,
        file_name: `Auto_Text_White_${Date.now()}.png`,
        file_url: whitePreview,
        file_type: 'image',
        file_size: 245000,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
      };
      
      // In a real implementation, we would insert these into the temporary_files table
      const { data: blackData, error: blackError } = await supabase
        .from('temporary_files')
        .insert(blackFile);
        
      if (blackError) {
        console.error('❌ Error saving black design to temporary files:', blackError);
      }
      
      const { data: whiteData, error: whiteError } = await supabase
        .from('temporary_files')
        .insert(whiteFile);
        
      if (whiteError) {
        console.error('❌ Error saving white design to temporary files:', whiteError);
      }
      
      console.log('✅ Designs saved to temporary files');
      
    } catch (error: any) {
      console.error('❌ Error saving to temporary files:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <Upload className="h-6 w-6 mr-2 text-orange-500" />
          Tasarım Yükleme
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Tasarımlarınızı yükleyin ve Etsy'ye gönderin
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <X className="h-5 w-5 text-red-500" />
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Check className="h-5 w-5 text-green-500" />
            <p className="text-green-700 dark:text-green-400">{success}</p>
          </div>
        </div>
      )}

      {/* AI Rules Warning */}
      {(titleRules.length === 0 || tagRules.length === 0 || !titleRules.some(r => r.isDefault) || !tagRules.some(r => r.isDefault)) && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Sparkles className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-1">
                AI Kuralları Eksik
              </h3>
              <p className="text-sm text-yellow-600 dark:text-yellow-300">
                AI başlık ve etiket oluşturma özelliğini kullanmak için, <a href="/admin/ai-agent" className="underline font-medium">AI Agent</a> sayfasından kurallar oluşturun ve varsayılan olarak ayarlayın.
                {titleRules.length === 0 && <span className="block mt-1">• Başlık kuralı oluşturmanız gerekiyor</span>}
                {titleRules.length > 0 && !titleRules.some(r => r.isDefault) && <span className="block mt-1">• Bir başlık kuralını varsayılan olarak ayarlamanız gerekiyor</span>}
                {tagRules.length === 0 && <span className="block mt-1">• Etiket kuralı oluşturmanız gerekiyor</span>}
                {tagRules.length > 0 && !tagRules.some(r => r.isDefault) && <span className="block mt-1">• Bir etiket kuralını varsayılan olarak ayarlamanız gerekiyor</span>}
              </p>
            </div>
          </div>
        </div>
      )}

        {/* Design Items List */}
      <div className="space-y-8">
        {designItems.map((item, itemIndex) => (
          <Card key={item.id} className="border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Tasarım #{itemIndex + 1}
                </h2>
                {designItems.length > 1 && (
                  <Button
                    onClick={() => removeDesignItem(itemIndex)}
                    variant="danger"
                    size="sm"
                    className="p-2 h-8 w-8 flex items-center justify-center"
                    title="Tasarımı sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {/* Design Type Selection */}
              <div className="mb-6 flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={item.designType === 'upload'}
                    onChange={() => toggleDesignType(itemIndex, 'upload')}
                    className="form-radio h-4 w-4 text-orange-600"
                  />
                  <span className="text-gray-900 dark:text-white">Upload Design</span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={item.designType === 'autoText'}
                    onChange={() => toggleDesignType(itemIndex, 'autoText')}
                    className="form-radio h-4 w-4 text-orange-600"
                  />
                  <span className="text-gray-900 dark:text-white">Auto Text Design</span>
                </label>
                
                {/* Auto Text Design Controls */}
                {item.designType === 'autoText' && (
                  <div className="flex items-center space-x-2 flex-1 flex-wrap">
                    <select
                      value={item.textTemplate}
                      onChange={(e) => handleTextTemplateChange(e.target.value, itemIndex)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Text Template</option>
                      {textTemplates.map(template => (
                        <option key={template.id} value={template.id}>{template.name}</option>
                      ))}
                    </select>
                    
                    {/* Dinamik Text Alanları */}
                    {item.textTemplate && (
                      <>
                        {Array.from({ length: getTextFieldCount(item.textTemplate) }).map((_, idx) => (
                          <Input
                            key={idx}
                            placeholder={`Text ${idx + 1}`}
                            value={item.textValues[`text${idx + 1}`] || ''}
                            onChange={(e) => handleTextValueChange(`text${idx + 1}`, e.target.value, itemIndex)}
                            className="w-32"
                          />
                        ))}
                        
                        <Button
                          onClick={() => generateDesigns(itemIndex)}
                          disabled={!item.textTemplate || !Object.values(item.textValues).some(v => v.trim() !== '')}
                          className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                        >
                          Oluştur
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-12 gap-4">
                {/* First Row - All elements side by side */}
                <div className="col-span-12 grid grid-cols-12 gap-4">
                  {/* Design Uploads - 2 columns */}
                  <div className="col-span-2 flex space-x-2">
                    {/* Black Design */}
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                        <div className="w-3 h-3 bg-black rounded-full mr-1"></div>
                        Siyah
                      </h3>
                      <div className="relative">
                        {item.blackDesign.preview ? (
                          <div className="relative w-full h-20 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                            <img 
                              src={item.blackDesign.preview} 
                              alt={`Black design ${itemIndex + 1}`} 
                              className="w-full h-full object-contain"
                            />
                            <button
                              onClick={() => removeDesign(itemIndex, 'black')}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                              title="Tasarımı kaldır"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => item.designType === 'upload' && blackFileInputRefs.current[itemIndex]?.click()}
                            className={`w-full h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-orange-500 dark:hover:border-orange-500 transition-colors bg-white dark:bg-gray-800 ${item.designType === 'autoText' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={item.designType === 'autoText'}
                          >
                            <Plus className="h-5 w-5 text-gray-400 dark:text-gray-500 mb-1" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">Yükle</span>
                            <input
                              ref={el => blackFileInputRefs.current[itemIndex] = el}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileSelect(e, itemIndex, 'black')}
                              disabled={item.designType === 'autoText'}
                            />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* White Design */}
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                        <div className="w-3 h-3 bg-white border border-gray-300 rounded-full mr-1"></div>
                        Beyaz
                      </h3>
                      <div className="relative">
                        {item.whiteDesign.preview ? (
                          <div className="relative w-full h-20 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                            <img 
                              src={item.whiteDesign.preview} 
                              alt={`White design ${itemIndex + 1}`} 
                              className="w-full h-full object-contain"
                            />
                            <button
                              onClick={() => removeDesign(itemIndex, 'white')}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                              title="Tasarımı kaldır"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => item.designType === 'upload' && whiteFileInputRefs.current[itemIndex]?.click()}
                            className={`w-full h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-orange-500 dark:hover:border-orange-500 transition-colors bg-gray-800 ${item.designType === 'autoText' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={item.designType === 'autoText'}
                          >
                            <Plus className="h-5 w-5 text-gray-400 dark:text-gray-500 mb-1" />
                            <span className="text-xs text-gray-400">Yükle</span>
                            <input
                              ref={el => whiteFileInputRefs.current[itemIndex] = el}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileSelect(e, itemIndex, 'white')}
                              disabled={item.designType === 'autoText'}
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Title Section - 3 columns */}
                  <div className="col-span-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                          <FileText className="h-4 w-4 mr-1 text-orange-500" />
                          Başlık
                        </h3>
                        <span className={`text-xs ${item.title.length > MAX_TITLE_LENGTH * 0.9 ? 'text-orange-500' : 'text-gray-500'}`}>
                          {item.title.length}/{MAX_TITLE_LENGTH}
                        </span>
                      </div>
                      <textarea
                        value={item.title}
                        onChange={(e) => handleTitleChange(e.target.value, itemIndex)}
                        placeholder="Ürün başlığını girin..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 resize-none"
                        maxLength={MAX_TITLE_LENGTH}
                        rows={3}
                        style={{ minHeight: '80px' }}
                      />
                      
                      {/* AI Title Button */}
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => generateAIContent(itemIndex, 'title')}
                          variant="secondary"
                          size="sm"
                          className="flex items-center space-x-1"
                          disabled={aiLoading[`${itemIndex}-title`] || titleRules.length === 0 || !titleRules.some(r => r.isDefault)}
                        >
                          {aiLoading[`${itemIndex}-title`] ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3 text-orange-500" />
                          )}
                          <span className="text-xs">AI Öner</span>
                        </Button>
                        
                        {item.aiTitle && (
                          <Button
                            onClick={() => useAITitle(itemIndex)}
                            variant="secondary"
                            size="sm"
                            className="py-1 px-2 text-xs"
                          >
                            Kullan
                          </Button>
                        )}
                      </div>
                      
                      {/* AI Title Suggestion */}
                      {item.aiTitle && (
                        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-2">
                          <div className="flex items-center space-x-2">
                            <Sparkles className="h-3 w-3 text-orange-500 flex-shrink-0" />
                            <p className="text-xs text-orange-700 dark:text-orange-400 line-clamp-2">{item.aiTitle}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tags Section - 3 columns */}
                  <div className="col-span-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                          <Tag className="h-4 w-4 mr-1 text-orange-500" />
                          Etiketler
                        </h3>
                        <span className={`text-xs ${item.tags.length > MAX_TAG_COUNT * 0.9 ? 'text-orange-500' : 'text-gray-500'}`}>
                          {item.tags.length}/{MAX_TAG_COUNT}
                        </span>
                      </div>
                      
                      {/* Tag Input - Modified to be a textarea */}
                      <textarea
                        value={item.tags.join(', ')}
                        onChange={(e) => {
                          const tagsText = e.target.value;
                          const tagArray = tagsText.split(',')
                            .map(tag => tag.trim())
                            .filter(tag => tag.length > 0)
                            .slice(0, MAX_TAG_COUNT);
                          
                          setDesignItems(prev => prev.map((item, idx) => {
                            if (idx === itemIndex) {
                              return { ...item, tags: tagArray };
                            }
                            return item;
                          }));
                        }}
                        placeholder="Etiketleri virgülle ayırarak girin..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 resize-none"
                        rows={3}
                        style={{ minHeight: '80px' }}
                      />
                      
                      {/* AI Tags Button */}
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => generateAIContent(itemIndex, 'tags')}
                          variant="secondary"
                          size="sm"
                          className="flex items-center space-x-1"
                          disabled={aiLoading[`${itemIndex}-tags`] || !item.title || tagRules.length === 0 || !tagRules.some(r => r.isDefault)}
                        >
                          {aiLoading[`${itemIndex}-tags`] ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3 text-orange-500" />
                          )}
                          <span className="text-xs">AI Öner</span>
                        </Button>
                        
                        {item.aiTags.length > 0 && (
                          <Button
                            onClick={() => useTagsFromAI(itemIndex)}
                            variant="secondary"
                            size="sm"
                            className="py-1 px-2 text-xs"
                          >
                            Kullan
                          </Button>
                        )}
                      </div>
                      
                      {/* AI Tags Suggestions */}
                      {item.aiTags.length > 0 && (
                        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-2">
                          <div className="flex items-center space-x-1 mb-1">
                            <Sparkles className="h-3 w-3 text-orange-500" />
                            <p className="text-xs text-orange-700 dark:text-orange-400">Önerilen Etiketler:</p>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {item.aiTags.map((tag, tagIndex) => (
                              <div 
                                key={tagIndex}
                                className="bg-orange-100 dark:bg-orange-800/30 px-2 py-1 rounded-full text-xs flex items-center space-x-1 cursor-pointer hover:bg-orange-200 dark:hover:bg-orange-800/50 transition-colors"
                                onClick={() => {
                                  if (item.tags.length < MAX_TAG_COUNT) {
                                    setDesignItems(prev => prev.map((item, idx) => {
                                      if (idx === itemIndex) {
                                        const newAiTags = [...item.aiTags];
                                        const tag = newAiTags.splice(tagIndex, 1)[0];
                                        return { 
                                          ...item, 
                                          tags: [...item.tags, tag],
                                          aiTags: newAiTags
                                        };
                                      }
                                      return item;
                                    }));
                                  }
                                }}
                              >
                                <span className="text-orange-700 dark:text-orange-300 max-w-[80px] truncate">{tag}</span>
                                <Plus className="h-3 w-3 text-orange-500" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Listing Template - 2 columns */}
                  <div className="col-span-2">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                      <Template className="h-4 w-4 mr-1 text-orange-500" />
                      Listeleme Şablonu
                    </h3>
                    <select
                      value={item.template}
                      onChange={(e) => handleTemplateChange(e.target.value, itemIndex)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Şablon seçin...</option>
                      {templates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Mockup Folder - 2 columns */}
                  <div className="col-span-2">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                      <Grid3X3 className="h-4 w-4 mr-1 text-orange-500" />
                      Mockup Klasörü
                    </h3>
                    <select
                      value={item.mockupFolder}
                      onChange={(e) => handleMockupFolderChange(e.target.value, itemIndex)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Klasör seçin...</option>
                      {mockupFolders.map(folder => (
                        <option key={folder.id} value={folder.id}>
                          {folder.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add New Item Button */}
      <div className="flex justify-start">
        <Button
          onClick={addNewDesignItem}
          variant="secondary"
          className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
        >
          <Plus className="h-4 w-4" />
          <span>Yeni Tasarım Ekle</span>
        </Button>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end mt-8">
        <Button
          onClick={handleSubmit}
          className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg flex items-center space-x-2 text-lg shadow-md hover:shadow-lg transition-all"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Gönderiliyor...</span>
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              <span>Etsy'ye Gönder</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default DesignUploadPage;