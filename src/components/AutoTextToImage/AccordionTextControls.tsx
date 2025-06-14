import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import ColorOptions from './ColorOptions';
import FontUploadButton from './FontUploadButton';

interface TextType {
  id: number;
  text: string;
  x: number;
  y: number;
  maxFontSize: number;
  fontFamily: string;
  fill: string;
  rotation: number;
  lineHeight: number;
  letterSpacing: number;
  width: number;
  height: number;
  align: string;
  colorOption?: 'bw' | 'all' | 'letters' | null;
  selectedColor?: string;
  letterColors?: string[];
  strokeEnabled?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  strokeOnly?: boolean;
  styleOption?: string;
  bend?: number;
  distortionH?: number;
  distortionV?: number;
}

interface Props {
  text: TextType;
  texts: TextType[];
  setTexts: React.Dispatch<React.SetStateAction<TextType[]>>;
  allFonts: string[];
  fontsLoading: boolean;
  fontsInitialized: boolean;
  fontUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFontUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  alignText: (alignment: string) => void;
  updateTextProperty: (textId: number, property: string, value: any) => void;
  onDelete: (textId: number) => void;
}

const AccordionTextControls: React.FC<Props> = ({
  text,
  texts,
  setTexts,
  allFonts,
  fontsLoading,
  fontsInitialized,
  fontUploading,
  fileInputRef,
  handleFontUpload,
  alignText,
  updateTextProperty,
  onDelete
}) => {
  // CRITICAL: Her text için ayrı state - sadece bir bölüm açık olabilir
  const [activeSection, setActiveSection] = useState<'textOptions' | 'colorOptions' | 'styleOptions' | null>('textOptions');

  // CRITICAL: Black & White'ı default olarak ayarla
  React.useEffect(() => {
    if (!text.colorOption) {
      updateTextProperty(text.id, 'colorOption', 'bw');
    }
  }, [text.id, text.colorOption, updateTextProperty]);

  // CRITICAL: Akordiyon toggle fonksiyonu - basitleştirildi ve güçlendirildi
  const toggleSection = (section: 'textOptions' | 'colorOptions' | 'styleOptions') => {
    console.log(`🔄 Toggle çağrıldı - Section: ${section}, Current: ${activeSection}`);
    
    // Eğer aynı bölüme tıklanırsa kapat, değilse o bölümü aç
    if (activeSection === section) {
      console.log(`❌ Aynı bölüm, kapatılıyor: ${section}`);
      setActiveSection(null);
    } else {
      console.log(`✅ Yeni bölüm açılıyor: ${section}`);
      setActiveSection(section);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Text {text.id}</CardTitle>
          <Button
            onClick={() => onDelete(text.id)}
            variant="danger"
            size="sm"
            className="p-2 h-8 w-8 flex items-center justify-center"
            title="Delete text"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Text Input - Her zaman görünür */}
        <div className="flex gap-2 items-start">
          <textarea 
            value={text.text} 
            onChange={(e) => updateTextProperty(text.id, 'text', e.target.value)} 
            rows={1} 
            className="border border-gray-300 dark:border-gray-600 p-2 rounded flex-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none overflow-hidden" 
            placeholder="Enter your text..."
          />
          <Button 
            className="p-2 h-10 w-10 flex items-center justify-center" 
            onClick={() => updateTextProperty(text.id, 'text', text.text + '\n')}
            title="Add new line"
          >
            +
          </Button>
        </div>

        {/* AKORDIYON BÖLÜMLER */}
        <div className="space-y-3">
          
          {/* 1. TEXT OPTIONS ACCORDION */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {/* Header */}
            <button
              type="button"
              onClick={() => toggleSection('textOptions')}
              className={`w-full flex items-center justify-between p-3 text-left transition-all duration-200 ${
                activeSection === 'textOptions'
                  ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                  : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">📝</span>
                <span className="font-medium">Text Options</span>
              </div>
              <div className={`transition-transform duration-200 ${
                activeSection === 'textOptions' ? 'rotate-180' : 'rotate-0'
              }`}>
                <ChevronDown className="h-4 w-4" />
              </div>
            </button>
            
            {/* Content */}
            {activeSection === 'textOptions' && (
              <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 space-y-4">
                {/* Font and Size Controls */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Font:</label>
                    <div className="flex gap-2">
                      <select 
                        value={text.fontFamily} 
                        onChange={(e) => updateTextProperty(text.id, 'fontFamily', e.target.value)} 
                        className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        disabled={fontsLoading || !fontsInitialized}
                      >
                        {allFonts.map((font) => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </select>
                      
                      <FontUploadButton 
                        onFontUploaded={() => {}}
                        className="p-2 h-10 w-10 flex items-center justify-center"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Font Size (px):</label>
                    <input 
                      type="number" 
                      value={text.maxFontSize} 
                      min="1"
                      step="1" 
                      onChange={(e) => updateTextProperty(text.id, 'maxFontSize', parseInt(e.target.value))} 
                      className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    />
                  </div>
                </div>

                {/* Line Height, Letter Spacing, Align */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Line Height:</label>
                    <input 
                      type="number" 
                      value={text.lineHeight} 
                      step="0.1"
                      min="0.1"
                      onChange={(e) => updateTextProperty(text.id, 'lineHeight', parseFloat(e.target.value))} 
                      className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Letter Spacing:</label>
                    <input 
                      type="number" 
                      value={text.letterSpacing} 
                      onChange={(e) => updateTextProperty(text.id, 'letterSpacing', parseFloat(e.target.value))} 
                      className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Align:</label>
                    <select 
                      value={text.align} 
                      onChange={(e) => updateTextProperty(text.id, 'align', e.target.value)} 
                      className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>

                {/* Alignment Buttons */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Alignment:</label>
                  <div className="flex gap-2 text-2xl">
                    <button 
                      type="button"
                      onClick={() => alignText('left')} 
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Align left"
                    >
                      <span className="material-icons text-lg">format_align_left</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => alignText('centerX')} 
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Align center horizontally"
                    >
                      <span className="material-icons text-lg">format_align_center</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => alignText('right')} 
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Align right"
                    >
                      <span className="material-icons text-lg">format_align_right</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => alignText('top')} 
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Align top"
                    >
                      <span className="material-icons text-lg">vertical_align_top</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => alignText('centerY')} 
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Align center vertically"
                    >
                      <span className="material-icons text-lg">vertical_align_center</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => alignText('bottom')} 
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Align bottom"
                    >
                      <span className="material-icons text-lg">vertical_align_bottom</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. COLOR OPTIONS ACCORDION */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {/* Header */}
            <button
              type="button"
              onClick={() => toggleSection('colorOptions')}
              className={`w-full flex items-center justify-between p-3 text-left transition-all duration-200 ${
                activeSection === 'colorOptions'
                  ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                  : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">🎨</span>
                <span className="font-medium">Color Options</span>
              </div>
              <div className={`transition-transform duration-200 ${
                activeSection === 'colorOptions' ? 'rotate-180' : 'rotate-0'
              }`}>
                <ChevronDown className="h-4 w-4" />
              </div>
            </button>
            
            {/* Content */}
            {activeSection === 'colorOptions' && (
              <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <ColorOptions text={text} setTexts={setTexts} texts={texts} />
              </div>
            )}
          </div>

          {/* 3. STYLE OPTIONS ACCORDION */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {/* Header */}
            <button
              type="button"
              onClick={() => toggleSection('styleOptions')}
              className={`w-full flex items-center justify-between p-3 text-left transition-all duration-200 ${
                activeSection === 'styleOptions'
                  ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                  : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">✨</span>
                <span className="font-medium">Style Options</span>
              </div>
              <div className={`transition-transform duration-200 ${
                activeSection === 'styleOptions' ? 'rotate-180' : 'rotate-0'
              }`}>
                <ChevronDown className="h-4 w-4" />
              </div>
            </button>
            
            {/* Content */}
            {activeSection === 'styleOptions' && (
              <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 space-y-4">
                {/* Style Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Style:</label>
                  <select
                    value={text.styleOption || 'normal'}
                    onChange={(e) => updateTextProperty(text.id, 'styleOption', e.target.value)}
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="normal">Normal</option>
                    <option value="arc">Arc</option>
                    <option value="wave">Wave</option>
                  </select>
                </div>

                {/* Style Parameters */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bend (%):</label>
                    <input 
                      type="number" 
                      value={text.bend || 50} 
                      onChange={(e) => updateTextProperty(text.id, 'bend', parseFloat(e.target.value))} 
                      className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Distortion H:</label>
                    <input 
                      type="number" 
                      value={text.distortionH || 0} 
                      onChange={(e) => updateTextProperty(text.id, 'distortionH', parseFloat(e.target.value))} 
                      className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Distortion V:</label>
                    <input 
                      type="number" 
                      value={text.distortionV || 0} 
                      onChange={(e) => updateTextProperty(text.id, 'distortionV', parseFloat(e.target.value))} 
                      className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </CardContent>
    </Card>
  );
};

export default AccordionTextControls;