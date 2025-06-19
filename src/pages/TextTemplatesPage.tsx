import React, { useState, useEffect } from 'react';
import { Type, Plus, Edit, Trash2, Copy, Search, Filter, Grid, List, Save, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

interface TextTemplate {
  id: string;
  user_id: string;
  name: string;
  font_family: string;
  font_size: number;
  font_weight: string;
  text_color: string;
  background_color: string;
  style_settings: {
    canvas_size: {
      width: number;
      height: number;
    };
    texts: any[];
  };
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

const TextTemplatesPage: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<TextTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadTemplates();
    }
  }, [user]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading templates...');
      
      const { data, error } = await supabase
        .from('auto_text_templates')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Template loading error:', error);
        throw error;
      }

      console.log('✅ Raw template data:', data);

      // Parse the stored JSON data with better error handling
      const parsedTemplates = data?.map(template => {
        console.log(`📝 Processing template: ${template.name}`, template);
        
        let canvasSize = { width: 1000, height: 1000 };
        let texts: any[] = [];
        
        try {
          if (template.style_settings) {
            if (template.style_settings.canvas_size) {
              canvasSize = template.style_settings.canvas_size;
            }
            if (Array.isArray(template.style_settings.texts)) {
              texts = template.style_settings.texts;
            }
          }
        } catch (parseError) {
          console.warn(`⚠️ Template parsing error: ${template.name}`, parseError);
        }
        
        const parsedTemplate = {
          ...template,
          style_settings: {
            canvas_size: canvasSize,
            texts: texts
          }
        };
        
        console.log(`✅ Processed template: ${template.name}`, parsedTemplate);
        return parsedTemplate;
      }) || [];

      console.log(`🎉 Total ${parsedTemplates.length} templates loaded`);
      setTemplates(parsedTemplates);
    } catch (error) {
      console.error('❌ Template loading general error:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('auto_text_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => t.id !== templateId));
      setSelectedTemplates(prev => prev.filter(id => id !== templateId));
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  const duplicateTemplate = async (template: TextTemplate) => {
    try {
      const { error } = await supabase
        .from('auto_text_templates')
        .insert({
          user_id: user?.id,
          name: `${template.name} (Copy)`,
          font_family: template.font_family || 'Arial',
          font_size: template.font_size || 24,
          font_weight: template.font_weight || 'normal',
          text_color: template.text_color || '#000000',
          background_color: template.background_color || '#ffffff',
          style_settings: template.style_settings,
          is_default: false
        });

      if (error) throw error;

      await loadTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
      alert('Failed to duplicate template');
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase())
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
      const { error } = await supabase
        .from('auto_text_templates')
        .delete()
        .in('id', selectedTemplates)
        .eq('user_id', user?.id);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => !selectedTemplates.includes(t.id)));
      setSelectedTemplates([]);
    } catch (error) {
      console.error('Error deleting templates:', error);
      alert('Failed to delete templates');
    }
  };

  // Enhanced Template Preview Component
  const TemplatePreview: React.FC<{ template: TextTemplate }> = ({ template }) => {
    console.log(`🎨 Rendering preview: ${template.name}`, template);
    
    const canvasSize = template.style_settings?.canvas_size || { width: 1000, height: 1000 };
    const texts = template.style_settings?.texts || [];
    
    console.log(`📐 Canvas size: ${canvasSize.width}x${canvasSize.height}`);
    console.log(`📝 Text count: ${texts.length}`, texts);
    
    // Preview container dimensions
    const previewWidth = 280;
    const canvasAspectRatio = canvasSize.width / canvasSize.height;
    const previewHeight = Math.min(previewWidth / canvasAspectRatio, 160);
    
    // Scale factor for preview
    const scale = previewWidth / canvasSize.width;
    
    console.log(`🔍 Scale: ${scale}, Preview: ${previewWidth}x${previewHeight}`);

    return (
      <div 
        className="relative bg-white border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden shadow-sm mx-auto"
        style={{ 
          width: `${previewWidth}px`, 
          height: `${previewHeight}px`
        }}
      >
        {/* Canvas Background */}
        <div 
          className="absolute inset-0 bg-white"
          style={{
            width: `${previewWidth}px`,
            height: `${previewHeight}px`
          }}
        >
          {/* Render text elements */}
          {texts.length > 0 ? (
            texts.map((text, index) => {
              console.log(`🔤 Rendering text ${index}:`, text);
              
              // Position calculations - from center point
              const textX = (text.x || canvasSize.width / 2) * scale;
              const textY = (text.y || canvasSize.height / 2) * scale;
              const fontSize = Math.max((text.maxFontSize || 24) * scale, 8);
              const textWidth = (text.width || 200) * scale;
              
              // Color determination
              let textColor = '#000000';
              if (text.colorOption === 'bw') {
                textColor = '#000000';
              } else if (text.colorOption === 'all' && text.selectedColor) {
                textColor = text.selectedColor;
              } else if (text.fill) {
                textColor = text.fill;
              }
              
              console.log(`🎨 Text ${index} - Pos: ${textX},${textY}, Size: ${fontSize}, Color: ${textColor}`);

              return (
                <div
                  key={index}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${textX - textWidth/2}px`,
                    top: `${textY - fontSize/2}px`,
                    width: `${textWidth}px`,
                    fontSize: `${fontSize}px`,
                    fontFamily: text.fontFamily || 'Arial',
                    color: textColor,
                    textAlign: (text.align || 'center') as any,
                    lineHeight: text.lineHeight || 1,
                    letterSpacing: `${(text.letterSpacing || 0) * scale}px`,
                    fontWeight: text.fontWeight || 'normal',
                    transform: text.rotation ? `rotate(${text.rotation}deg)` : 'none',
                    transformOrigin: 'center',
                    whiteSpace: 'pre-wrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    // Stroke support
                    WebkitTextStroke: text.strokeEnabled ? `${(text.strokeWidth || 2) * scale}px ${text.strokeColor || '#000000'}` : 'none',
                    WebkitTextFillColor: text.strokeOnly ? 'transparent' : textColor
                  }}
                >
                  {text.text || 'Sample Text'}
                </div>
              );
            })
          ) : (
            // Fallback: If no text
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
              No text elements
            </div>
          )}
        </div>
        
        {/* Overlay information */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
          <div className="text-white text-xs text-center">
            <div className="font-medium">{texts.length} element(s)</div>
            <div className="opacity-75">{canvasSize.width} × {canvasSize.height}</div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
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
            <Type className="h-6 w-6 mr-2 text-orange-500" />
            Text Templates
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your saved text design templates ({templates.length} templates)
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button
            onClick={() => window.location.href = '/admin/templates/auto-text-to-image'}
            className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create New</span>
          </Button>
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
          <Type className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'No templates found' : 'No text templates yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Create your first text template to get started'
            }
          </p>
          {!searchTerm && (
            <Button
              onClick={() => window.location.href = '/admin/templates/auto-text-to-image'}
              className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Template</span>
            </Button>
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
                    {/* Real Template Preview */}
                    <div className="mb-4">
                      <TemplatePreview template={template} />
                    </div>

                    {/* Template Info */}
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex justify-between">
                        <span>Elements:</span>
                        <span className="font-medium">{template.style_settings?.texts?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Canvas:</span>
                        <span>
                          {template.style_settings?.canvas_size?.width || 1000} × {template.style_settings?.canvas_size?.height || 1000}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span>{formatDate(template.created_at)}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 mt-4">
                      <Button
                        onClick={() => {
                          window.location.href = `/admin/templates/auto-text-to-image?template=${template.id}`;
                        }}
                        size="sm"
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => {
                          // TODO: Use template functionality
                          console.log('Use template:', template);
                        }}
                        variant="secondary"
                        size="sm"
                        className="flex-1"
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
                      Preview
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Elements
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Canvas Size
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-20 h-16 bg-gray-100 dark:bg-gray-700 rounded border overflow-hidden">
                          <div style={{ transform: 'scale(0.3)', transformOrigin: 'top left' }}>
                            <TemplatePreview template={template} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {template.style_settings?.texts?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {template.style_settings?.canvas_size?.width || 1000} × {template.style_settings?.canvas_size?.height || 1000}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatDate(template.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => {
                            window.location.href = `/admin/templates/auto-text-to-image?template=${template.id}`;
                          }}
                          className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                          title="Edit template"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => duplicateTemplate(template)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Duplicate template"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete template"
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
    </div>
  );
};

export default TextTemplatesPage;