import React, { useState, useRef } from 'react';
import { Upload, Plus, Trash2, X, Check, Image as ImageIcon, FileText, Tag, BookTemplate as Template, Grid as Grid3X3, Send, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';

interface DesignItem {
  id: string;
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
  template: string;
  mockupFolder: string;
}

const MAX_TITLE_LENGTH = 140;
const MAX_TAG_COUNT = 13;
const MAX_TAG_LENGTH = 20;

const DesignUploadPage: React.FC = () => {
  const { user } = useAuth();
  const [designItems, setDesignItems] = useState<DesignItem[]>([
    {
      id: '1',
      blackDesign: { file: null, preview: '' },
      whiteDesign: { file: null, preview: '' },
      title: '',
      aiTitle: '',
      tags: [],
      aiTags: [],
      template: '',
      mockupFolder: ''
    }
  ]);
  const [templates, setTemplates] = useState([
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
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState<{[key: string]: boolean}>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const blackFileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const whiteFileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  const handleTagInput = (value: string, itemIndex: number) => {
    // Split by commas and filter empty tags
    const tagsArray = value.split(/,\s*/).filter(tag => tag.trim() !== '');
    
    // Limit to MAX_TAG_COUNT tags
    const limitedTags = tagsArray.slice(0, MAX_TAG_COUNT);
    
    // Limit each tag to MAX_TAG_LENGTH characters
    const formattedTags = limitedTags.map(tag => {
      if (tag.length > MAX_TAG_LENGTH) {
        return tag.substring(0, MAX_TAG_LENGTH);
      }
      return tag;
    });
    
    setDesignItems(prev => prev.map((item, idx) => {
      if (idx === itemIndex) {
        return { ...item, tags: formattedTags };
      }
      return item;
    }));
  };

  const addTag = (itemIndex: number, tag: string) => {
    if (!tag.trim()) return;
    
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

  const addNewDesignItem = () => {
    setDesignItems(prev => [
      ...prev,
      {
        id: `${Date.now()}`,
        blackDesign: { file: null, preview: '' },
        whiteDesign: { file: null, preview: '' },
        title: '',
        aiTitle: '',
        tags: [],
        aiTags: [],
        template: '',
        mockupFolder: ''
      }
    ]);
  };

  const removeDesignItem = (itemIndex: number) => {
    if (designItems.length <= 1) {
      setError('En az bir tasarım öğesi olmalıdır.');
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
      setError('Etiket önerileri için önce bir başlık girin.');
      return;
    }
    
    try {
      setAiLoading(prev => ({ ...prev, [`${itemIndex}-${contentType}`]: true }));
      
      // In a real implementation, this would call an AI service
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
      setError(`AI içerik oluşturma hatası: ${error.message}`);
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
      const hasBlackOrWhite = item.blackDesign.file !== null || item.whiteDesign.file !== null;
      return !item.title.trim() || item.tags.length === 0 || !hasBlackOrWhite || !item.template || !item.mockupFolder;
    });
    
    if (invalidItems.length > 0) {
      setError('Lütfen tüm alanları doldurun ve her öğe için en az bir tasarım yükleyin.');
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
          blackDesign: { file: null, preview: '' },
          whiteDesign: { file: null, preview: '' },
          title: '',
          aiTitle: '',
          tags: [],
          aiTags: [],
          template: '',
          mockupFolder: ''
        }
      ]);
      
    } catch (error: any) {
      console.error('❌ Error submitting designs:', error);
      setError(`Gönderim sırasında bir hata oluştu: ${error.message}`);
    } finally {
      setLoading(false);
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

      {/* Design Items List */}
      <div className="space-y-8">
        {designItems.map((item, itemIndex) => (
          <Card key={item.id} className="border-2 border-gray-200 dark:border-gray-700">
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
                              title="Remove design"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => blackFileInputRefs.current[itemIndex]?.click()}
                            className="w-full h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-orange-500 dark:hover:border-orange-500 transition-colors bg-white dark:bg-gray-800"
                          >
                            <Plus className="h-5 w-5 text-gray-400 dark:text-gray-500 mb-1" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">Yükle</span>
                            <input
                              ref={el => blackFileInputRefs.current[itemIndex] = el}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileSelect(e, itemIndex, 'black')}
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
                              title="Remove design"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => whiteFileInputRefs.current[itemIndex]?.click()}
                            className="w-full h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-orange-500 dark:hover:border-orange-500 transition-colors bg-gray-800"
                          >
                            <Plus className="h-5 w-5 text-gray-400 dark:text-gray-500 mb-1" />
                            <span className="text-xs text-gray-400">Yükle</span>
                            <input
                              ref={el => whiteFileInputRefs.current[itemIndex] = el}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileSelect(e, itemIndex, 'white')}
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
                      <Input
                        value={item.title}
                        onChange={(e) => handleTitleChange(e.target.value, itemIndex)}
                        placeholder="Ürün başlığı girin..."
                        className="w-full"
                        maxLength={MAX_TITLE_LENGTH}
                      />
                      
                      {/* AI Title Button */}
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => generateAIContent(itemIndex, 'title')}
                          variant="secondary"
                          size="sm"
                          className="flex items-center space-x-1"
                          disabled={aiLoading[`${itemIndex}-title`]}
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
                      
                      {/* Tags Display */}
                      <div className="flex flex-wrap gap-1 min-h-[38px] max-h-[76px] overflow-y-auto p-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                        {item.tags.length === 0 ? (
                          <span className="text-xs text-gray-500 dark:text-gray-400 p-1">
                            Etiket eklemek için virgülle ayırarak girin veya AI önerisi alın
                          </span>
                        ) : (
                          item.tags.map((tag, tagIndex) => (
                            <div 
                              key={tagIndex}
                              className="bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded-full text-xs flex items-center space-x-1"
                            >
                              <span className="text-gray-800 dark:text-gray-200 max-w-[100px] truncate">{tag}</span>
                              <button
                                onClick={() => removeTag(itemIndex, tagIndex)}
                                className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                      
                      {/* Tag Input */}
                      <div className="flex items-center space-x-2">
                        <Input
                          placeholder="Etiket ekle, virgülle ayır..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ',') {
                              e.preventDefault();
                              const input = e.currentTarget;
                              const value = input.value.trim();
                              if (value) {
                                addTag(itemIndex, value);
                                input.value = '';
                              }
                            }
                          }}
                          className="flex-1"
                          disabled={item.tags.length >= MAX_TAG_COUNT}
                        />
                        
                        <Button
                          onClick={() => generateAIContent(itemIndex, 'tags')}
                          variant="secondary"
                          size="sm"
                          className="flex items-center space-x-1"
                          disabled={aiLoading[`${itemIndex}-tags`] || !item.title}
                        >
                          {aiLoading[`${itemIndex}-tags`] ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3 text-orange-500" />
                          )}
                          <span className="text-xs">AI Öner</span>
                        </Button>
                      </div>
                      
                      {/* AI Tags Suggestions */}
                      {item.aiTags.length > 0 && (
                        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-2">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-1">
                              <Sparkles className="h-3 w-3 text-orange-500" />
                              <p className="text-xs text-orange-700 dark:text-orange-400">Önerilen:</p>
                            </div>
                            {item.tags.length < MAX_TAG_COUNT && (
                              <Button
                                onClick={() => useAITags(itemIndex)}
                                variant="secondary"
                                size="sm"
                                className="py-0.5 px-2 text-xs h-6"
                              >
                                Tümünü Ekle
                              </Button>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {item.aiTags.slice(0, 5).map((tag, tagIndex) => (
                              <div 
                                key={tagIndex}
                                className="bg-orange-100 dark:bg-orange-800/30 px-2 py-1 rounded-full text-xs flex items-center space-x-1 cursor-pointer hover:bg-orange-200 dark:hover:bg-orange-800/50"
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
                
                {/* Character Limit Info */}
                <div className="col-span-12">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-blue-700 dark:text-blue-400">
                        <p><strong>Sınırlamalar:</strong> Başlık en fazla {MAX_TITLE_LENGTH} karakter olabilir. Etiketler en fazla {MAX_TAG_COUNT} adet ve her biri en fazla {MAX_TAG_LENGTH} karakter olabilir.</p>
                      </div>
                    </div>
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
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Yeni Tasarım Ekle</span>
        </Button>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end mt-8">
        <Button
          onClick={handleSubmit}
          className="px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center space-x-2 text-lg"
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
              <span>Gönder</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default DesignUploadPage;