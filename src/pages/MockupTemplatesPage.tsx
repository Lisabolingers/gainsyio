import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Upload, Search, Filter, Grid, List, Folder, Image, Plus, Edit, Trash2 } from 'lucide-react';

interface MockupTemplate {
  id: string;
  name: string;
  image_url: string;
  design_areas: any[];
  text_areas: any[];
  logo_area: any;
  design_type: 'black' | 'white' | 'color';
  product_category: string;
  folder_path: string;
  folder_name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface TemplateFolder {
  folder_path: string;
  folder_name: string;
  template_count: number;
  black_designs: number;
  white_designs: number;
  color_designs: number;
}

const MockupTemplatesPage: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<MockupTemplate[]>([]);
  const [folders, setFolders] = useState<TemplateFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [selectedDesignType, setSelectedDesignType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadFolder, setUploadFolder] = useState('default');
  const [uploadCategory, setUploadCategory] = useState('t-shirt');
  const [uploadDesignType, setUploadDesignType] = useState<'black' | 'white' | 'color'>('black');

  const categories = [
    't-shirt', 'sweatshirt', 'hoodie', 'mug', 'poster', 'canvas', 
    'pillow', 'phone-case', 'tote-bag', 'sticker', 'other'
  ];

  useEffect(() => {
    if (user) {
      fetchTemplates();
      fetchFolders();
    }
  }, [user]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('mockup_templates')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('mockup_template_folders')
        .select('*')
        .eq('user_id', user?.id)
        .order('folder_name');

      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadName || !user) return;

    try {
      // Upload file to Supabase Storage
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `mockup-templates/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('mockup-templates')
        .upload(filePath, uploadFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('mockup-templates')
        .getPublicUrl(filePath);

      // Save template to database
      const { error: dbError } = await supabase
        .from('mockup_templates')
        .insert({
          user_id: user.id,
          name: uploadName,
          image_url: publicUrl,
          design_type: uploadDesignType,
          product_category: uploadCategory,
          folder_path: uploadFolder,
          folder_name: uploadFolder === 'default' ? 'Default Templates' : uploadFolder,
          design_areas: [],
          text_areas: [],
          is_default: false
        });

      if (dbError) throw dbError;

      // Refresh data
      await fetchTemplates();
      await fetchFolders();
      
      // Reset form
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadName('');
      setUploadFolder('default');
      setUploadCategory('t-shirt');
      setUploadDesignType('black');
    } catch (error) {
      console.error('Error uploading template:', error);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Bu şablonu silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('mockup_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', user?.id);

      if (error) throw error;

      await fetchTemplates();
      await fetchFolders();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = selectedFolder === 'all' || template.folder_path === selectedFolder;
    const matchesDesignType = selectedDesignType === 'all' || template.design_type === selectedDesignType;
    const matchesCategory = selectedCategory === 'all' || template.product_category === selectedCategory;
    
    return matchesSearch && matchesFolder && matchesDesignType && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Mockup şablonları yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mockup Templates</h1>
              <p className="text-gray-600 mt-2">Manage your product mockup templates</p>
            </div>
            <Button
              onClick={() => setShowUploadModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload Template
            </Button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Folder</label>
                <select
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Folders</option>
                  {folders.map(folder => (
                    <option key={folder.folder_path} value={folder.folder_path}>
                      {folder.folder_name} ({folder.template_count})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Design Type</label>
                <select
                  value={selectedDesignType}
                  onChange={(e) => setSelectedDesignType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Types</option>
                  <option value="black">Black</option>
                  <option value="white">White</option>
                  <option value="color">Color</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">View</label>
                <div className="flex space-x-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Templates Grid/List */}
        {filteredTemplates.length === 0 ? (
          <Card className="text-center py-12">
            <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedFolder !== 'all' || selectedDesignType !== 'all' || selectedCategory !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Upload your first mockup template to get started.'}
            </p>
            <Button
              onClick={() => setShowUploadModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload Template
            </Button>
          </Card>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
          }>
            {filteredTemplates.map(template => (
              <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {viewMode === 'grid' ? (
                  <>
                    <div className="aspect-square bg-gray-100 relative">
                      <img
                        src={template.image_url}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          template.design_type === 'black' ? 'bg-gray-900 text-white' :
                          template.design_type === 'white' ? 'bg-gray-100 text-gray-900' :
                          'bg-gradient-to-r from-red-500 to-blue-500 text-white'
                        }`}>
                          {template.design_type}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 mb-1">{template.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {template.product_category.charAt(0).toUpperCase() + template.product_category.slice(1).replace('-', ' ')}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-gray-500">
                          <Folder className="w-3 h-3 mr-1" />
                          {template.folder_name}
                        </div>
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => deleteTemplate(template.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center p-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg mr-4 flex-shrink-0">
                      <img
                        src={template.image_url}
                        alt={template.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{template.name}</h3>
                      <p className="text-sm text-gray-600">
                        {template.product_category.charAt(0).toUpperCase() + template.product_category.slice(1).replace('-', ' ')}
                      </p>
                      <div className="flex items-center mt-1">
                        <Folder className="w-3 h-3 mr-1 text-gray-400" />
                        <span className="text-xs text-gray-500">{template.folder_name}</span>
                        <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded ${
                          template.design_type === 'black' ? 'bg-gray-900 text-white' :
                          template.design_type === 'white' ? 'bg-gray-100 text-gray-900' :
                          'bg-gradient-to-r from-red-500 to-blue-500 text-white'
                        }`}>
                          {template.design_type}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => deleteTemplate(template.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Upload Mockup Template</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                  <Input
                    type="text"
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    placeholder="Enter template name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Design Type</label>
                  <select
                    value={uploadDesignType}
                    onChange={(e) => setUploadDesignType(e.target.value as 'black' | 'white' | 'color')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="black">Black</option>
                    <option value="white">White</option>
                    <option value="color">Color</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Folder</label>
                  <Input
                    type="text"
                    value={uploadFolder}
                    onChange={(e) => setUploadFolder(e.target.value)}
                    placeholder="Enter folder name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!uploadFile || !uploadName}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MockupTemplatesPage;