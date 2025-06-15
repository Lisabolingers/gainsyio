import React, { useState, useRef } from 'react';
import { Upload, Plus, Trash2, X, Check, Image as ImageIcon, FileText, Tag, BookTemplate as Template, Grid as Grid3X3, Send } from 'lucide-react';
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
  tags: string;
  template: string;
  mockupFolder: string;
}

const DesignUploadPage: React.FC = () => {
  const { user } = useAuth();
  const [designItems, setDesignItems] = useState<DesignItem[]>([
    {
      id: '1',
      blackDesign: { file: null, preview: '' },
      whiteDesign: { file: null, preview: '' },
      title: '',
      tags: '',
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
    setDesignItems(prev => prev.map((item, idx) => {
      if (idx === itemIndex) {
        return { ...item, title: value };
      }
      return item;
    }));
  };

  const handleTagsChange = (value: string, itemIndex: number) => {
    setDesignItems(prev => prev.map((item, idx) => {
      if (idx === itemIndex) {
        return { ...item, tags: value };
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
        tags: '',
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

  const handleSubmit = async () => {
    // Validate inputs
    const invalidItems = designItems.filter(item => {
      const hasBlackOrWhite = item.blackDesign.file !== null || item.whiteDesign.file !== null;
      return !item.title.trim() || !item.tags.trim() || !hasBlackOrWhite || !item.template || !item.mockupFolder;
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
          tags: '',
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
              
              <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
                {/* Black Design */}
                <div className="lg:col-span-1">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                    <div className="w-5 h-5 bg-black rounded-full mr-2"></div>
                    Siyah Tasarım
                  </h3>
                  <div className="relative">
                    {item.blackDesign.preview ? (
                      <div className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                        <img 
                          src={item.blackDesign.preview} 
                          alt={`Black design ${itemIndex + 1}`} 
                          className="w-full h-full object-contain"
                        />
                        <button
                          onClick={() => removeDesign(itemIndex, 'black')}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          title="Remove design"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => blackFileInputRefs.current[itemIndex]?.click()}
                        className="w-full aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-orange-500 dark:hover:border-orange-500 transition-colors bg-white dark:bg-gray-800"
                      >
                        <Plus className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">Yükle</span>
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
                <div className="lg:col-span-1">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                    <div className="w-5 h-5 bg-white border border-gray-300 rounded-full mr-2"></div>
                    Beyaz Tasarım
                  </h3>
                  <div className="relative">
                    {item.whiteDesign.preview ? (
                      <div className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                        <img 
                          src={item.whiteDesign.preview} 
                          alt={`White design ${itemIndex + 1}`} 
                          className="w-full h-full object-contain"
                        />
                        <button
                          onClick={() => removeDesign(itemIndex, 'white')}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          title="Remove design"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => whiteFileInputRefs.current[itemIndex]?.click()}
                        className="w-full aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-orange-500 dark:hover:border-orange-500 transition-colors bg-gray-800"
                      >
                        <Plus className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
                        <span className="text-sm text-gray-400">Yükle</span>
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

                {/* Title */}
                <div className="lg:col-span-1">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-orange-500" />
                    Başlık
                  </h3>
                  <Input
                    value={item.title}
                    onChange={(e) => handleTitleChange(e.target.value, itemIndex)}
                    placeholder="Ürün başlığı girin..."
                    className="w-full"
                  />
                </div>

                {/* Tags */}
                <div className="lg:col-span-1">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                    <Tag className="h-5 w-5 mr-2 text-orange-500" />
                    Etiketler
                  </h3>
                  <Input
                    value={item.tags}
                    onChange={(e) => handleTagsChange(e.target.value, itemIndex)}
                    placeholder="Etiketleri virgülle ayırarak girin..."
                    className="w-full"
                  />
                </div>

                {/* Listing Templates */}
                <div className="lg:col-span-1">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                    <Template className="h-5 w-5 mr-2 text-orange-500" />
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

                {/* Mockup Folders */}
                <div className="lg:col-span-1">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                    <Grid3X3 className="h-5 w-5 mr-2 text-orange-500" />
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add New Item Button */}
      <div className="flex justify-center">
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
      <div className="flex justify-center mt-8">
        <Button
          onClick={handleSubmit}
          className="px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-full flex items-center space-x-2 text-lg"
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