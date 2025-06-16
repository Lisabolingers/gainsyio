import React, { useState, useRef, useEffect } from 'react';
import Konva from 'konva';
import { Stage, Layer, Text as KonvaText, Transformer, Group, Image as KonvaImage } from 'react-konva';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import AccordionTextControls from './AccordionTextControls';
import { renderTextByStyle } from './styleOption';
import { useFonts } from '../../hooks/useFonts';
import { FontService } from '../../lib/fontService';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import LogoSelector from './LogoSelector';

const DesignSettings = () => {
  const { user } = useAuth();
  const { userFonts, loadUserFonts, loading: fontsLoading } = useFonts();
  
  // System fonts + user fonts
  const systemFonts = [
    'Arial', 'Times New Roman', 'Helvetica', 'Georgia', 'Verdana',
    'Comic Sans MS', 'Courier New'
  ];
  
  // Font list state - for automatic updates
  const [allFonts, setAllFonts] = useState<string[]>(systemFonts);
  
  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 1000 });
  const [templateName, setTemplateName] = useState('');
  const [texts, setTexts] = useState([
    {
      id: 1,
      text: 'Sample Text',
      x: 500,
      y: 500,
      maxFontSize: 50,
      fontFamily: 'Arial',
      fill: '#000',
      rotation: 0,
      lineHeight: 1,
      letterSpacing: 0,
      width: 400,
      height: 100,
      align: 'center',
      colorOption: 'bw',
      styleOption: 'normal',
    }
  ]);
  
  // Selection state controls
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isTransformerVisible, setIsTransformerVisible] = useState(false);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  
  const [forceRender, setForceRender] = useState(0);
  const [fontUploading, setFontUploading] = useState(false);
  const [fontsInitialized, setFontsInitialized] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
  const [showLogoSelector, setShowLogoSelector] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const stageRef = useRef<Konva.Stage>();
  const transformerRef = useRef<Konva.Transformer>();
  const groupRefs = useRef<Record<number, Konva.Group>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update font list when userFonts changes
  useEffect(() => {
    const updatedFonts = [
      ...systemFonts,
      ...userFonts.map(font => font.font_name)
    ];
    
    console.log('🔄 Font list updating:', updatedFonts);
    setAllFonts(updatedFonts);
    
    // Force canvas re-render
    setForceRender(prev => prev + 1);
  }, [userFonts]);

  // Template loading - get template ID from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const templateId = urlParams.get('template');
    
    if (templateId && user) {
      loadTemplate(templateId);
    }
  }, [user]);

  // Template loading function
  const loadTemplate = async (templateId: string) => {
    try {
      setTemplateLoading(true);
      console.log(`🔄 Loading template: ${templateId}`);

      const { data, error } = await supabase
        .from('auto_text_templates')
        .select('*')
        .eq('id', templateId)
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('❌ Template loading error:', error);
        return;
      }

      if (data) {
        console.log('✅ Template data received:', data);
        
        // Set template data
        setCurrentTemplateId(templateId);
        setTemplateName(data.name);
        
        // Set canvas size
        if (data.style_settings?.canvas_size) {
          setCanvasSize(data.style_settings.canvas_size);
          console.log('📐 Canvas size set:', data.style_settings.canvas_size);
        }
        
        // Set text elements
        if (data.style_settings?.texts && Array.isArray(data.style_settings.texts)) {
          const loadedTexts = data.style_settings.texts.map((text: any) => ({
            ...text,
            lineHeight: text.lineHeight || 1,
            letterSpacing: text.letterSpacing || 0,
            align: text.align || 'center',
            colorOption: text.colorOption || 'bw',
            styleOption: text.styleOption || 'normal',
            fill: text.fill || '#000000',
            maxFontSize: text.maxFontSize || 50,
            fontFamily: text.fontFamily || 'Arial',
            width: text.width || 400,
            height: text.height || 100,
            x: text.x || 500,
            y: text.y || 500,
            rotation: text.rotation || 0
          }));
          
          setTexts(loadedTexts);
          console.log('📝 Text elements loaded:', loadedTexts.length, 'elements');
          
          // Clear selection when template loads
          setSelectedId(null);
          setIsTransformerVisible(false);
          setIsUserInteracting(false);
        }
        
        // Load logo if exists
        if (data.style_settings?.logoUrl) {
          setLogoUrl(data.style_settings.logoUrl);
        }
        
        // Re-render canvas
        setTimeout(() => {
          setForceRender(prev => prev + 1);
        }, 500);
        
        console.log('🎉 Template loaded successfully!');
      }
    } catch (error) {
      console.error('❌ Template loading general error:', error);
    } finally {
      setTemplateLoading(false);
    }
  };

  // Load all fonts to canvas on page load
  useEffect(() => {
    const initializeFonts = async () => {
      if (!user || fontsLoading || fontsInitialized) return;
      
      console.log('🚀 PAGE LOADED - INITIALIZING FONTS...');
      
      try {
        await loadUserFonts();
        
        if (userFonts.length > 0) {
          console.log(`🔄 Loading ${userFonts.length} user fonts to canvas...`);
          
          for (const font of userFonts) {
            try {
              console.log(`📝 Loading to canvas: ${font.font_name}`);
              await FontService.loadFontInBrowser(font);
              await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
              console.warn(`⚠️ Font could not be loaded: ${font.font_name}`, error);
            }
          }
          
          console.log('✅ All fonts loaded to canvas');
          setForceRender(prev => prev + 1);
        }
        
        setFontsInitialized(true);
        console.log('🎉 FONT INITIALIZATION COMPLETED');
        
      } catch (error) {
        console.error('❌ Font initialization error:', error);
        setFontsInitialized(true);
      }
    };

    initializeFonts();
  }, [user, userFonts.length, fontsLoading]);

  // Update canvas when userFonts changes
  useEffect(() => {
    if (fontsInitialized && userFonts.length > 0) {
      console.log('🔄 Font list changed, updating canvas...');
      setForceRender(prev => prev + 1);
    }
  }, [userFonts, fontsInitialized]);

  // Fixed canvas container size - always 700x700px
  const maxContainerSize = 700;
  const padding = 10;

  const scale = Math.min(
    (maxContainerSize - padding * 2) / canvasSize.width,
    (maxContainerSize - padding * 2) / canvasSize.height,
    1
  );
  const offsetX = padding + ((maxContainerSize - padding * 2) - canvasSize.width * scale) / 2;
  const offsetY = padding + ((maxContainerSize - padding * 2) - canvasSize.height * scale) / 2;

  // Text boundary constraint function
  const constrainTextToBounds = (text) => {
    const halfWidth = text.width / 2;
    const halfHeight = text.height / 2;
    
    const minX = halfWidth;
    const maxX = canvasSize.width - halfWidth;
    const minY = halfHeight;
    const maxY = canvasSize.height - halfHeight;
    
    const constrainedX = Math.max(minX, Math.min(maxX, text.x));
    const constrainedY = Math.max(minY, Math.min(maxY, text.y));
    
    return {
      ...text,
      x: constrainedX,
      y: constrainedY
    };
  };

  // Apply constraints whenever texts change
  useEffect(() => {
    setTexts(prevTexts => 
      prevTexts.map(text => constrainTextToBounds(text))
    );
  }, [canvasSize.width, canvasSize.height]);

  // Transformer control - enhanced version
  useEffect(() => {
    console.log('🔧 Updating transformer:', {
      selectedId,
      isTransformerVisible,
      isUserInteracting
    });

    // Conditions to hide transformer
    if (!selectedId || !isTransformerVisible) {
      console.log('❌ Hiding transformer - no selection or not visible');
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
        transformerRef.current.getLayer()?.batchDraw();
      }
      return;
    }

    // Show transformer
    const node = groupRefs.current[selectedId];
    if (node && transformerRef.current) {
      console.log('✅ Showing transformer:', selectedId);
      transformerRef.current.nodes([node]);
      
      const transformer = transformerRef.current;
      const minHandleSize = Math.max(8, 12 / scale);
      const minBorderWidth = Math.max(1, 2 / scale);
      
      transformer.borderStrokeWidth(minBorderWidth);
      transformer.anchorSize(minHandleSize);
      transformer.anchorStroke('#0066ff');
      transformer.anchorFill('#ffffff');
      transformer.anchorStrokeWidth(Math.max(1, 1 / scale));
      transformer.borderStroke('#0066ff');
      
      transformer.getLayer()?.batchDraw();
    }
  }, [selectedId, isTransformerVisible, isUserInteracting, texts, scale]);

  const adjustFontSize = (text) => {
    const baseFontSize = text.maxFontSize || 50;
    const letterSpacing = text.letterSpacing || 0;
    const totalLength = text.text.length;
    let estimatedWidth = totalLength * baseFontSize * 0.6 + letterSpacing * (totalLength - 1);
    let newFontSize = baseFontSize;

    while ((estimatedWidth > text.width || newFontSize * text.lineHeight > text.height) && newFontSize > 5) {
      newFontSize -= 1;
      estimatedWidth = totalLength * newFontSize * 0.6 + letterSpacing * (totalLength - 1);
    }

    return newFontSize;
  };

  useEffect(() => {
    setTexts(prev =>
      prev.map(text => constrainTextToBounds({
        ...text,
        maxFontSize: adjustFontSize(text)
      }))
    );
  }, [texts.map(t => t.text + t.letterSpacing + t.lineHeight + t.width + t.height)]);

  // Canvas click handler - enhanced version
  const handleStageClick = (e) => {
    console.log('🖱️ Canvas clicked:', e.target.getType());
    
    // If clicked on empty area (stage itself)
    if (e.target === e.target.getStage()) {
      console.log('🔄 Empty area clicked - clearing selection');
      
      // Clear selection completely
      setSelectedId(null);
      setIsTransformerVisible(false);
      setIsUserInteracting(false);
      
      // Hide transformer immediately
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    }
  };

  const addText = () => {
    const newId = texts.length + 1;
    const baseText = texts[0];
    const newText = constrainTextToBounds({
      ...baseText, 
      id: newId, 
      text: '', 
      x: canvasSize.width / 2, 
      y: canvasSize.height / 2,
      colorOption: 'bw'
    });
    setTexts([...texts, newText]);
    
    // Auto-select new text and show transformer
    setSelectedId(newId);
    setIsTransformerVisible(true);
    setIsUserInteracting(true);
    
    console.log('➕ New text added and selected:', newId);
  };

  // Text click handler - enhanced version
  const handleTextClick = (textId) => {
    console.log('📝 Text clicked:', textId);
    
    // Mark user as interacting
    setIsUserInteracting(true);
    setSelectedId(textId);
    setIsTransformerVisible(true);
    
    console.log('✅ Text selected and transformer shown:', textId);
  };

  // Handle text drag with boundary constraints
  const handleTextDragEnd = (textId, e) => {
    const newX = e.target.x();
    const newY = e.target.y();
    
    setTexts(prevTexts =>
      prevTexts.map(text =>
        text.id === textId
          ? constrainTextToBounds({ ...text, x: newX, y: newY })
          : text
      )
    );
  };

  // Handle transformer changes with boundary constraints
  const handleTransformEnd = (textId, e) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    node.scaleX(1);
    node.scaleY(1);
    
    setTexts(prevTexts =>
      prevTexts.map(text =>
        text.id === textId
          ? constrainTextToBounds({
              ...text,
              x: node.x(),
              y: node.y(),
              width: Math.max(50, text.width * scaleX),
              height: Math.max(20, text.height * scaleY),
            })
          : text
      )
    );
  };

  const downloadImage = () => {
    if (texts.some(text => text.colorOption === 'bw')) {
      // 🖤 Black text output
      setTexts(prevTexts => prevTexts.map(text =>
        text.colorOption === 'bw' ? { ...text, tempFill: '#000000' } : text
      ));
      setTimeout(() => {
        const uriBlack = stageRef.current.toDataURL();
        const linkBlack = document.createElement('a');
        linkBlack.download = `${templateName || 'design'}-black.png`;
        linkBlack.href = uriBlack;
        linkBlack.click();

        // 🤍 White text output
        setTexts(prevTexts => prevTexts.map(text =>
          text.colorOption === 'bw' ? { ...text, tempFill: '#FFFFFF' } : text
        ));
        setTimeout(() => {
          const uriWhite = stageRef.current.toDataURL();
          const linkWhite = document.createElement('a');
          linkWhite.download = `${templateName || 'design'}-white.png`;
          linkWhite.href = uriWhite;
          linkWhite.click();

          // 🎨 Revert color change
          setTexts(prevTexts => prevTexts.map(text =>
            text.colorOption === 'bw' ? { ...text, tempFill: undefined } : text
          ));
        }, 500);
      }, 500);
    } else {
      // Normal download
      const uri = stageRef.current.toDataURL();
      const link = document.createElement('a');
      link.download = `${templateName || 'design'}.png`;
      link.href = uri;
      link.click();
    }
  };

  // Template save function
  const saveTemplate = async () => {
    if (!templateName.trim()) {
      alert('Template name is required!');
      return;
    }

    if (!user) {
      alert('User login required!');
      return;
    }

    try {
      console.log('💾 Saving template...');

      const templateData = {
        user_id: user.id,
        name: templateName,
        font_family: 'Arial',
        font_size: 24,
        font_weight: 'normal',
        text_color: '#000000',
        background_color: '#ffffff',
        style_settings: {
          canvas_size: canvasSize,
          texts: texts,
          logoUrl: logoUrl
        },
        is_default: false
      };

      let result;

      if (currentTemplateId) {
        console.log(`🔄 Updating existing template: ${currentTemplateId}`);
        result = await supabase
          .from('auto_text_templates')
          .update({
            name: templateName,
            style_settings: templateData.style_settings,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentTemplateId)
          .eq('user_id', user.id)
          .select()
          .single();
      } else {
        console.log('✨ Creating new template...');
        result = await supabase
          .from('auto_text_templates')
          .insert(templateData)
          .select()
          .single();
      }

      if (result.error) {
        console.error('❌ Template save error:', result.error);
        alert('Template could not be saved: ' + result.error.message);
        return;
      }

      console.log('✅ Template saved successfully:', result.data);

      if (!currentTemplateId && result.data) {
        setCurrentTemplateId(result.data.id);
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('template', result.data.id);
        window.history.replaceState({}, '', newUrl.toString());
      }

      alert('Template saved successfully! 🎉');

    } catch (error) {
      console.error('❌ Template save general error:', error);
      alert('Template could not be saved: ' + error.message);
    }
  };

  // Enhanced font upload - save to both canvas and Supabase
  const handleFontUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !user) {
      console.log('❌ No file selected or user not logged in');
      return;
    }

    setFontUploading(true);
    console.log(`🚀 FONT UPLOAD STARTED: ${file.name}`);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const fontName = file.name.split('.')[0].replace(/\s+/g, '-');
          const fontData = e.target.result;
          
          console.log(`📝 Loading font for canvas: ${fontName}`);
          
          const newFontFace = new FontFace(fontName, `url(${fontData})`);
          const loadedFace = await newFontFace.load();
          document.fonts.add(loadedFace);
          
          console.log(`✅ Font loaded to canvas: ${fontName}`);
          
          setForceRender(prev => prev + 1);
          
          if (selectedId) {
            updateTextProperty(selectedId, 'fontFamily', fontName);
          }
          
          console.log(`💾 Saving to Supabase: ${fontName}`);
          
          const savedFont = await FontService.uploadAndSaveFont(file, user.id);
          console.log(`🎉 SAVED TO SUPABASE:`, savedFont);
          
          await loadUserFonts();
          console.log(`🔄 Font list refreshed`);
          
        } catch (error) {
          console.error(`❌ Font upload error:`, error);
          alert(`Font upload error: ${error.message}`);
        } finally {
          setFontUploading(false);
        }
      };
      
      reader.onerror = (err) => {
        console.error(`❌ File reading error:`, err);
        setFontUploading(false);
      };
      
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error(`❌ Font upload general error:`, error);
      alert(`Font upload error: ${error.message}`);
      setFontUploading(false);
    }
    
    if (event.target) {
      event.target.value = '';
    }
  };

  const alignText = (alignment) => {
    if (!selectedId) return;
    const text = texts.find(t => t.id === selectedId);
    if (!text) return;

    let newX = text.x;
    let newY = text.y;
    const halfWidth = text.width / 2;
    const halfHeight = text.height / 2;

    switch (alignment) {
      case 'left':
        newX = halfWidth;
        break;
      case 'centerX':
        newX = canvasSize.width / 2;
        break;
      case 'right':
        newX = canvasSize.width - halfWidth;
        break;
      case 'top':
        newY = halfHeight;
        break;
      case 'centerY':
        newY = canvasSize.height / 2;
        break;
      case 'bottom':
        newY = canvasSize.height - halfHeight;
        break;
      default:
        break;
    }

    newX = Math.max(halfWidth, Math.min(canvasSize.width - halfWidth, newX));
    newY = Math.max(halfHeight, Math.min(canvasSize.height - halfHeight, newY));

    setTexts(texts.map(t => t.id === selectedId ? { ...t, x: newX, y: newY } : t));
  };

  // Update text properties with constraints
  const updateTextProperty = (textId, property, value) => {
    console.log(`🔄 Updating text property: ${property} = ${value}`);
    
    setTexts(prevTexts =>
      prevTexts.map(text =>
        text.id === textId
          ? constrainTextToBounds({ ...text, [property]: value })
          : text
      )
    );
    
    // Force re-render when font changes
    if (property === 'fontFamily') {
      console.log(`🎨 Font changed, re-rendering canvas: ${value}`);
      setTimeout(() => {
        setForceRender(prev => prev + 1);
      }, 100);
    }
  };

  // Text deletion function
  const deleteText = (textId) => {
    if (texts.length <= 1) {
      alert('At least one text element is required!');
      return;
    }
    
    setTexts(prev => prev.filter(t => t.id !== textId));
    
    // Clear selection if deleted text was selected
    if (selectedId === textId) {
      console.log('🗑️ Selected text deleted, clearing selection');
      setSelectedId(null);
      setIsTransformerVisible(false);
      setIsUserInteracting(false);
    }
  };

  // Font uploaded callback
  const handleFontUploaded = async () => {
    console.log('🎉 Font uploaded, refreshing font list...');
    
    try {
      await loadUserFonts();
      setForceRender(prev => prev + 1);
      console.log('✅ Font list refreshed successfully');
    } catch (error) {
      console.error('❌ Font list refresh error:', error);
    }
  };

  // Handle logo selection
  const handleLogoSelect = (imageUrl: string) => {
    setLogoUrl(imageUrl);
    setShowLogoSelector(false);
  };

  // Enhanced text rendering with proper font handling
  const renderKonvaText = (text) => {
    console.log(`🎨 Rendering text: "${text.text.substring(0, 20)}..." font: ${text.fontFamily}`);
    
    const isFontLoaded = systemFonts.includes(text.fontFamily) || 
                        userFonts.some(f => f.font_name === text.fontFamily) ||
                        document.fonts.check(`16px "${text.fontFamily}"`);
    
    const actualFontFamily = isFontLoaded ? text.fontFamily : 'Arial';
    
    if (!isFontLoaded && text.fontFamily !== 'Arial') {
      console.warn(`⚠️ Font not loaded, using fallback: ${text.fontFamily} -> ${actualFontFamily}`);
    }
    
    return (
      <Group
        key={`${text.id}-${forceRender}-${fontsInitialized}`}
        ref={(node) => (groupRefs.current[text.id] = node)}
        x={text.x}
        y={text.y}
        draggable={isTransformerVisible && selectedId === text.id}
        onClick={() => handleTextClick(text.id)}
        onDragEnd={(e) => handleTextDragEnd(text.id, e)}
        onTransformEnd={(e) => handleTransformEnd(text.id, e)}
        dragBoundFunc={(pos) => {
          const halfWidth = text.width / 2;
          const halfHeight = text.height / 2;
          return {
            x: Math.max(halfWidth, Math.min(canvasSize.width - halfWidth, pos.x)),
            y: Math.max(halfHeight, Math.min(canvasSize.height - halfHeight, pos.y))
          };
        }}
      >
        {text.styleOption && text.styleOption !== 'normal'
          ? renderTextByStyle({...text, fontFamily: actualFontFamily}, canvasSize)
          : (
            text.colorOption === 'letters' ? (
              (() => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                ctx.font = `${text.maxFontSize}px ${actualFontFamily}`;
                const filteredColors = (text.letterColors || []).filter(color => color && color.trim() !== '' && color.toLowerCase() !== '#cccccc');
                const lines = text.text.split('\n');
                const totalWidth = Math.max(...lines.map(line =>
                  line.split('').reduce((acc, char) => acc + ctx.measureText(char).width + text.letterSpacing, 0)
                ));
                return (
                  <Group offsetX={totalWidth / 2} offsetY={text.height / 2 - text.maxFontSize * text.lineHeight / 2 + 2}>
                    {lines.flatMap((line, lineIdx) => {
                      let cumulativeX = 0;
                      const lineY = lineIdx * text.maxFontSize * text.lineHeight;
                      return line.split('').map((char, idx) => {
                        const metrics = ctx.measureText(char);
                        const charWidth = metrics.width;
                        const charX = cumulativeX;
                        cumulativeX += charWidth + text.letterSpacing;
                        const color = filteredColors.length > 0
                          ? filteredColors[(idx + lineIdx * line.length) % filteredColors.length]
                          : '#000000';
                        return (
                          <KonvaText
                            key={`${lineIdx}-${idx}-${forceRender}`}
                            text={char}
                            x={charX}
                            y={lineY}
                            fontSize={text.maxFontSize}
                            fontFamily={actualFontFamily}
                            fill={color}
                            stroke={text.strokeEnabled ? text.strokeColor || '#000000' : undefined}
                            strokeWidth={text.strokeEnabled ? text.strokeWidth || 2 : 0}
                            fillEnabled={!text.strokeOnly}
                            lineHeight={text.lineHeight || 1}
                          />
                        );
                      });
                    })}
                  </Group>
                );
              })()
            ) : (
              <KonvaText
                key={`text-${text.id}-${forceRender}-${fontsInitialized}`}
                text={text.text}
                fontSize={text.maxFontSize}
                fontFamily={actualFontFamily}
                fill={
                  text.tempFill
                    ? text.tempFill
                    : text.colorOption === 'bw'
                    ? '#000000'
                    : text.fill || '#000000'
                }
                stroke={text.strokeEnabled ? text.strokeColor || '#000000' : undefined}
                strokeWidth={text.strokeEnabled ? text.strokeWidth || 2 : 0}
                fillEnabled={!text.strokeOnly}
                width={text.width}
                height={text.height}
                align={text.align}
                lineHeight={text.lineHeight || 1}
                letterSpacing={text.letterSpacing}
                offsetX={text.width / 2}
                offsetY={text.height / 2 - text.maxFontSize * text.lineHeight / 2 + 2}
              />
            )
          )}
      </Group>
    );
  };

  // Render logo if available
  const renderLogo = () => {
    if (!logoUrl) return null;
    
    const logoSize = 100; // Default size
    const logoX = canvasSize.width / 2;
    const logoY = canvasSize.height - logoSize / 2 - 20; // Position at bottom
    
    return (
      <KonvaImage
        image={new window.Image()}
        x={logoX}
        y={logoY}
        width={logoSize}
        height={logoSize}
        offsetX={logoSize / 2}
        offsetY={logoSize / 2}
        src={logoUrl}
        onLoad={(e) => {
          // When image loads, redraw the layer
          e.target.getLayer().batchDraw();
        }}
      />
    );
  };

  return (
    <div className="flex h-full gap-[10px] p-4">
      {/* Template Loading Indicator */}
      {templateLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
            <span className="text-gray-900 dark:text-white">Loading template...</span>
          </div>
        </div>
      )}

      {/* Logo Selector Modal */}
      {showLogoSelector && (
        <LogoSelector 
          onSelect={handleLogoSelect}
          onClose={() => setShowLogoSelector(false)}
        />
      )}

      {/* Canvas Section - Left Side */}
      <div className="flex flex-col w-1/2">
        <div className="flex-1 flex items-center justify-center p-4">
          <div style={{ 
            backgroundColor: '#555', 
            width: `${maxContainerSize}px`, 
            height: `${maxContainerSize}px`, 
            position: 'relative', 
            overflow: 'hidden' 
          }}>
            <div style={{
              width: `${canvasSize.width}px`,
              height: `${canvasSize.height}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              position: 'absolute',
              left: `${offsetX}px`,
              top: `${offsetY}px`,
              backgroundColor: 'white'
            }}>
              <Stage 
                key={`stage-${forceRender}-${fontsInitialized}`}
                width={canvasSize.width} 
                height={canvasSize.height} 
                ref={stageRef} 
                onClick={handleStageClick}
              >
                <Layer key={`layer-${forceRender}-${fontsInitialized}`}>
                  {/* Render logo first (behind text) */}
                  {logoUrl && renderLogo()}
                  
                  {/* Render text elements */}
                  {texts.map((text) => renderKonvaText(text))}

                  {/* Show transformer only when needed */}
                  {selectedId && isTransformerVisible && (
                    <Transformer 
                      ref={transformerRef} 
                      borderStroke="#0066ff" 
                      borderStrokeWidth={Math.max(1, 2 / scale)}
                      anchorSize={Math.max(8, 12 / scale)}
                      anchorStroke="#0066ff"
                      anchorFill="#ffffff"
                      anchorStrokeWidth={Math.max(1, 1 / scale)}
                      borderStroke="#0066ff"
                      boundBoxFunc={(oldBox, newBox) => {
                        const text = texts.find(t => t.id === selectedId);
                        if (!text) return newBox;
                        
                        const minWidth = 50;
                        const minHeight = 20;
                        const maxWidth = canvasSize.width - Math.abs(newBox.x);
                        const maxHeight = canvasSize.height - Math.abs(newBox.y);
                        
                        return {
                          ...newBox,
                          width: Math.max(minWidth, Math.min(maxWidth, newBox.width)),
                          height: Math.max(minHeight, Math.min(maxHeight, newBox.height)),
                          x: Math.max(0, Math.min(canvasSize.width - newBox.width, newBox.x)),
                          y: Math.max(0, Math.min(canvasSize.height - newBox.height, newBox.y))
                        };
                      }}
                    />
                  )}
                </Layer>
              </Stage>
            </div>
          </div>
        </div>

        {/* Canvas Controls */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 w-[800px]">
          <div className="flex gap-4 items-center mb-4">
            <label className="text-gray-700 dark:text-gray-300 font-medium">CANVAS SIZE :</label>
            <Input 
              type="number" 
              placeholder="Width" 
              value={canvasSize.width} 
              onChange={(e) => setCanvasSize({ ...canvasSize, width: parseInt(e.target.value) || 0 })}
              className="w-24"
            />
            <Input 
              type="number" 
              placeholder="Height" 
              value={canvasSize.height} 
              onChange={(e) => setCanvasSize({ ...canvasSize, height: parseInt(e.target.value) || 0 })}
              className="w-24"
            />
            <label className="text-gray-700 dark:text-gray-300 font-medium">TEMPLATE NAME :</label>
            <Input 
              placeholder="Template Name" 
              value={templateName} 
              onChange={(e) => setTemplateName(e.target.value)}
              className="flex-1"
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button onClick={downloadImage} disabled={!templateName} className="flex-1">
                DOWNLOAD DESIGN
              </Button>
              <Button onClick={saveTemplate} disabled={!templateName} variant="secondary" className="flex-1">
                {currentTemplateId ? 'UPDATE TEMPLATE' : 'SAVE TEMPLATE'}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowLogoSelector(true)} 
                variant="secondary" 
                className="flex-1"
              >
                {logoUrl ? 'CHANGE LOGO' : 'ADD LOGO'}
              </Button>
              {logoUrl && (
                <Button 
                  onClick={() => setLogoUrl(null)} 
                  variant="danger" 
                  className="w-10"
                >
                  X
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Text Controls Section - Right Side */}
      <div className="w-1/2 p-4 overflow-y-auto max-h-screen">
        {/* Font Loading Status */}
        {!fontsInitialized && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-sm text-blue-700 dark:text-blue-400">
                Loading fonts... ({userFonts.length} fonts)
              </span>
            </div>
          </div>
        )}

        {/* Accordion Text Controls */}
        {texts.map((text) => (
          <AccordionTextControls
            key={text.id}
            text={text}
            texts={texts}
            setTexts={setTexts}
            allFonts={allFonts}
            fontsLoading={fontsLoading}
            fontsInitialized={fontsInitialized}
            fontUploading={fontUploading}
            fileInputRef={fileInputRef}
            handleFontUpload={handleFontUpload}
            alignText={alignText}
            updateTextProperty={updateTextProperty}
            onDelete={deleteText}
            onFontUploaded={handleFontUploaded}
          />
        ))}
        
        <Button className="mt-4 w-full" onClick={addText}>
          Add Text
        </Button>
      </div>
    </div>
  );
};

export default DesignSettings;