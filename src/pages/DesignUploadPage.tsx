import React, { useState, useRef } from 'react';
import { Upload, Plus, Trash2, X, Check, Image as ImageIcon, FileText, Tag, BookTemplate as Template, Grid as Grid3X3, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';

interface DesignFile {
  id: string;
  file: File | null;
  preview: string;
  type: 'black' | 'white';
}

interface TemplateOption {
  id: string;
  name: string;
  selected: boolean;
}

interface MockupOption {
  id: string;
  name: string;
  selected: boolean;
}

const DesignUploadPage: React.FC = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [blackDesigns, setBlackDesigns] = useState<DesignFile[]>(Array(6).fill(null).map((_, i) => ({
    id: `black-${i}`,
    file: null,
    preview: '',
    type: 'black'
  })));
  const [whiteDesigns, setWhiteDesigns] = useState<DesignFile[]>(Array(6).fill(null).map((_, i) => ({
    id: `white-${i}`,
    file: null,
    preview: '',
    type: 'white'
  })));
  const [templates, setTemplates] = useState<TemplateOption[]>([
    { id: '1', name: 'Vintage Style Template', selected: false },
    { id: '2', name: 'Modern Minimalist', selected: false },
    { id: '3', name: 'Bold Typography', selected: false },
    { id: '4', name: 'Elegant Script', selected: false },
    { id: '5', name: 'Rustic Handmade', selected: false },
    { id: '6', name: 'Abstract Art', selected: false },
  ]);
  const [mockupFolders, setMockupFolders] = useState<MockupOption[]>([
    { id: '1', name: 'T-Shirts', selected: false },
    { id: '2', name: 'Mugs', selected: false },
    { id: '3', name: 'Posters', selected: false },
    { id: '4', name: 'Phone Cases', selected: false },
    { id: '5', name: 'Canvas Prints', selected: false },
    { id: '6', name: 'Tote Bags', selected: false },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const blackFileInputRef = useRef<HTMLInputElement>(null);
  const whiteFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, designType: 'black' | 'white', index: number) => {
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
      
      if (designType === 'black') {
        setBlackDesigns(prev => prev.map((design, i) => 
          i === index ? { ...design, file, preview } : design
        ));
      } else {
        setWhiteDesigns(prev => prev.map((design, i) => 
          i === index ? { ...design, file, preview } : design
        ));
      }
    };
    reader.readAsDataURL(file);
    
    // Reset error if any
    setError(null);
  };

  const removeDesign = (designType: 'black' | 'white', index: number) => {
    if (designType === 'black') {
      setBlackDesigns(prev => prev.map((design, i) => 
        i === index ? { ...design, file: null, preview: '' } : design
      ));
    } else {
      setWhiteDesigns(prev => prev.map((design, i) => 
        i === index ? { ...design, file: null, preview: '' } : design
      ));
    }
  };

  const toggleTemplate = (id: string) => {
    setTemplates(prev => prev.map(template => 
      template.id === id ? { ...template, selected: !template.selected } : template
    ));
  };

  const toggleMockupFolder = (id: string) => {
    setMockupFolders(prev => prev.map(folder => 
      folder.id === id ? { ...folder, selected: !folder.selected } : folder
    ));
  };

  const handleSubmit = async () => {
    // Validate inputs
    if (!title.trim()) {
      setError('Lütfen bir başlık girin.');
      return;
    }
    
    if (!tags.trim()) {
      setError('Lütfen etiketler girin.');
      return;
    }
    
    const hasBlackDesign = blackDesigns.some(design => design.file !== null);
    const hasWhiteDesign = whiteDesigns.some(design => design.file !== null);
    
    if (!hasBlackDesign && !hasWhiteDesign) {
      setError('Lütfen en az bir tasarım yükleyin.');
      return;
    }
    
    const selectedTemplates = templates.filter(t => t.selected);
    if (selectedTemplates.length === 0) {
      setError('Lütfen en az bir şablon seçin.');
      return;
    }
    
    const selectedFolders = mockupFolders.filter(f => f.selected);
    if (selectedFolders.length === 0) {
      setError('Lütfen en az bir mockup klasörü seçin.');
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
      
      setSuccess('Tasarımlar başarıyla yüklendi ve Etsy\'ye gönderildi! 🎉');
      
      // Reset form
      setTitle('');
      setTags('');
      setBlackDesigns(Array(6).fill(null).map((_, i) => ({
        id: `black-${i}`,
        file: null,
        preview: '',
        type: 'black'
      })));
      setWhiteDesigns(Array(6).fill(null).map((_, i) => ({
        id: `white-${i}`,
        file: null,
        preview: '',
        type: 'white'
      })));
      setTemplates(prev => prev.map(t => ({ ...t, selected: false })));
      setMockupFolders(prev => prev.map(f => ({ ...f, selected: false })));
      
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Design Uploads */}
        <div className="space-y-6">
          {/* Black Designs */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <div className="w-6 h-6 bg-black rounded-full mr-2"></div>
              Siyah Tasarım
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {blackDesigns.map((design, index) => (
                <div key={design.id} className="relative">
                  {design.preview ? (
                    <div className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                      <img 
                        src={design.preview} 
                        alt={`Black design ${index + 1}`} 
                        className="w-full h-full object-contain"
                      />
                      <button
                        onClick={() => removeDesign('black', index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        title="Remove design"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => blackFileInputRef.current?.click()}
                      className="w-full aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-orange-500 dark:hover:border-orange-500 transition-colors bg-white dark:bg-gray-800"
                    >
                      <Plus className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">Yükle</span>
                      <input
                        ref={blackFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e, 'black', index)}
                      />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* White Designs */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <div className="w-6 h-6 bg-white border border-gray-300 rounded-full mr-2"></div>
              Beyaz Tasarım
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {whiteDesigns.map((design, index) => (
                <div key={design.id} className="relative">
                  {design.preview ? (
                    <div className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                      <img 
                        src={design.preview} 
                        alt={`White design ${index + 1}`} 
                        className="w-full h-full object-contain"
                      />
                      <button
                        onClick={() => removeDesign('white', index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        title="Remove design"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => whiteFileInputRef.current?.click()}
                      className="w-full aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-orange-500 dark:hover:border-orange-500 transition-colors bg-gray-800"
                    >
                      <Plus className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
                      <span className="text-sm text-gray-400">Yükle</span>
                      <input
                        ref={whiteFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e, 'white', index)}
                      />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Metadata and Options */}
        <div className="space-y-6">
          {/* Title */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-orange-500" />
              Başlık
            </h2>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ürün başlığı girin..."
              className="w-full"
            />
          </div>

          {/* Tags */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Tag className="h-5 w-5 mr-2 text-orange-500" />
              Etiketler
            </h2>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Etiketleri virgülle ayırarak girin..."
              className="w-full"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Örnek: vintage, poster, digital download, printable
            </p>
          </div>

          {/* Listing Templates */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Template className="h-5 w-5 mr-2 text-orange-500" />
              Listeleme Şablonları
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {templates.map(template => (
                <div
                  key={template.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    template.selected
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => toggleTemplate(template.id)}
                >
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full mr-2 flex items-center justify-center ${
                      template.selected ? 'bg-orange-500' : 'border border-gray-400'
                    }`}>
                      {template.selected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className="text-sm text-gray-900 dark:text-white">{template.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mockup Folders */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Grid3X3 className="h-5 w-5 mr-2 text-orange-500" />
              Mockup Klasörleri
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {mockupFolders.map(folder => (
                <div
                  key={folder.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    folder.selected
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => toggleMockupFolder(folder.id)}
                >
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full mr-2 flex items-center justify-center ${
                      folder.selected ? 'bg-orange-500' : 'border border-gray-400'
                    }`}>
                      {folder.selected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className="text-sm text-gray-900 dark:text-white">{folder.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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