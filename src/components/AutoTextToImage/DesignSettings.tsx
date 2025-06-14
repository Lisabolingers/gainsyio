import React, { useState, useRef, useEffect } from 'react';
import Konva from 'konva';
import { Stage, Layer, Text as KonvaText, Transformer, Group } from 'react-konva';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import AccordionTextControls from './AccordionTextControls';
import { renderTextByStyle } from './styleOption';
import { useFonts } from '../../hooks/useFonts';
import { FontService } from '../../lib/fontService';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const DesignSettings = () => {
  const { user } = useAuth();
  const { userFonts, loadUserFonts, loading: fontsLoading } = useFonts();
  
  // Sistem fontları + kullanıcı fontları
  const systemFonts = [
    'Arial', 'Times New Roman', 'Helvetica', 'Georgia', 'Verdana',
    'Comic Sans MS', 'Courier New'
  ];
  
  // CRITICAL: Font listesi state'i - otomatik güncelleme için
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
  
  // CRITICAL: Seçim durumunu kontrol eden state'ler
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isTransformerVisible, setIsTransformerVisible] = useState(false);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  
  const [forceRender, setForceRender] = useState(0);
  const [fontUploading, setFontUploading] = useState(false);
  const [fontsInitialized, setFontsInitialized] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
  const stageRef = useRef();
  const transformerRef = useRef();
  const groupRefs = useRef({});
  const fileInputRef = useRef();

  // CRITICAL: Font listesini güncelle - userFonts değiştiğinde
  useEffect(() => {
    const updatedFonts = [
      ...systemFonts,
      ...userFonts.map(font => font.font_name)
    ];
    
    console.log('🔄 Font listesi güncelleniyor:', updatedFonts);
    setAllFonts(updatedFonts);
    
    // Canvas'ı zorla yeniden render et
    setForceRender(prev => prev + 1);
  }, [userFonts]);

  // CRITICAL: Template yükleme - URL'den template ID'si al
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const templateId = urlParams.get('template');
    
    if (templateId && user) {
      loadTemplate(templateId);
    }
  }, [user]);

  // Template yükleme fonksiyonu
  const loadTemplate = async (templateId: string) => {
    try {
      setTemplateLoading(true);
      console.log(`🔄 Template yükleniyor: ${templateId}`);

      const { data, error } = await supabase
        .from('auto_text_templates')
        .select('*')
        .eq('id', templateId)
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('❌ Template yükleme hatası:', error);
        return;
      }

      if (data) {
        console.log('✅ Template verisi alındı:', data);
        
        // Template verilerini ayarla
        setCurrentTemplateId(templateId);
        setTemplateName(data.name);
        
        // Canvas boyutunu ayarla
        if (data.style_settings?.canvas_size) {
          setCanvasSize(data.style_settings.canvas_size);
          console.log('📐 Canvas boyutu ayarlandı:', data.style_settings.canvas_size);
        }
        
        // Text elementlerini ayarla
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
          console.log('📝 Text elementleri yüklendi:', loadedTexts.length, 'element');
          
          // CRITICAL: Template yüklendiğinde seçimi temizle
          setSelectedId(null);
          setIsTransformerVisible(false);
          setIsUserInteracting(false);
        }
        
        // Canvas'ı yeniden render et
        setTimeout(() => {
          setForceRender(prev => prev + 1);
        }, 500);
        
        console.log('🎉 Template başarıyla yüklendi!');
      }
    } catch (error) {
      console.error('❌ Template yükleme genel hatası:', error);
    } finally {
      setTemplateLoading(false);
    }
  };

  // CRITICAL: Sayfa yüklendiğinde tüm fontları canvas'a yükle
  useEffect(() => {
    const initializeFonts = async () => {
      if (!user || fontsLoading || fontsInitialized) return;
      
      console.log('🚀 SAYFA YÜKLENDİ - FONTLAR İNİTİALİZE EDİLİYOR...');
      
      try {
        await loadUserFonts();
        
        if (userFonts.length > 0) {
          console.log(`🔄 ${userFonts.length} kullanıcı fontu canvas'a yükleniyor...`);
          
          for (const font of userFonts) {
            try {
              console.log(`📝 Canvas'a yükleniyor: ${font.font_name}`);
              await FontService.loadFontInBrowser(font);
              await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
              console.warn(`⚠️ Font yüklenemedi: ${font.font_name}`, error);
            }
          }
          
          console.log('✅ Tüm fontlar canvas\'a yüklendi');
          setForceRender(prev => prev + 1);
        }
        
        setFontsInitialized(true);
        console.log('🎉 FONT İNİTİALİZASYONU TAMAMLANDI');
        
      } catch (error) {
        console.error('❌ Font initialization hatası:', error);
        setFontsInitialized(true);
      }
    };

    initializeFonts();
  }, [user, userFonts.length, fontsLoading]);

  // CRITICAL: userFonts değiştiğinde canvas'ı güncelle
  useEffect(() => {
    if (fontsInitialized && userFonts.length > 0) {
      console.log('🔄 Font listesi değişti, canvas güncelleniyor...');
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

  // CRITICAL: Transformer kontrolü - geliştirilmiş versiyon
  useEffect(() => {
    console.log('🔧 Transformer güncelleniyor:', {
      selectedId,
      isTransformerVisible,
      isUserInteracting
    });

    // Transformer'ı gizle koşulları
    if (!selectedId || !isTransformerVisible) {
      console.log('❌ Transformer gizleniyor - seçim yok veya görünür değil');
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
        transformerRef.current.getLayer()?.batchDraw();
      }
      return;
    }

    // Transformer'ı göster
    const node = groupRefs.current[selectedId];
    if (node && transformerRef.current) {
      console.log('✅ Transformer gösteriliyor:', selectedId);
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

  // CRITICAL: Canvas tıklama işleyicisi - geliştirilmiş versiyon
  const handleStageClick = (e) => {
    console.log('🖱️ Canvas tıklandı:', e.target.getType());
    
    // Eğer tıklanan element stage'in kendisiyse (boş alan)
    if (e.target === e.target.getStage()) {
      console.log('🔄 Boş alana tıklandı - seçim temizleniyor');
      
      // CRITICAL: Seçimi tamamen temizle
      setSelectedId(null);
      setIsTransformerVisible(false);
      setIsUserInteracting(false);
      
      // Transformer'ı hemen gizle
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
    
    // CRITICAL: Yeni text eklendiğinde otomatik seç ve transformer'ı göster
    setSelectedId(newId);
    setIsTransformerVisible(true);
    setIsUserInteracting(true);
    
    console.log('➕ Yeni text eklendi ve seçildi:', newId);
  };

  // CRITICAL: Text tıklama işleyicisi - geliştirilmiş versiyon
  const handleTextClick = (textId) => {
    console.log('📝 Text tıklandı:', textId);
    
    // Kullanıcı etkileşimde olduğunu işaretle
    setIsUserInteracting(true);
    setSelectedId(textId);
    setIsTransformerVisible(true);
    
    console.log('✅ Text seçildi ve transformer gösterildi:', textId);
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
      // 🖤 Siyah yazı çıktısı
      setTexts(prevTexts => prevTexts.map(text =>
        text.colorOption === 'bw' ? { ...text, tempFill: '#000000' } : text
      ));
      setTimeout(() => {
        const uriBlack = stageRef.current.toDataURL();
        const linkBlack = document.createElement('a');
        linkBlack.download = `${templateName || 'design'}-black.png`;
        linkBlack.href = uriBlack;
        linkBlack.click();

        // 🤍 Beyaz yazı çıktısı
        setTexts(prevTexts => prevTexts.map(text =>
          text.colorOption === 'bw' ? { ...text, tempFill: '#FFFFFF' } : text
        ));
        setTimeout(() => {
          const uriWhite = stageRef.current.toDataURL();
          const linkWhite = document.createElement('a');
          linkWhite.download = `${templateName || 'design'}-white.png`;
          linkWhite.href = uriWhite;
          linkWhite.click();

          // 🎨 Renk geçişini geri al
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

  // Template kaydetme fonksiyonu
  const saveTemplate = async () => {
    if (!templateName.trim()) {
      alert('Lütfen template adı girin!');
      return;
    }

    if (!user) {
      alert('Kullanıcı girişi gerekli!');
      return;
    }

    try {
      console.log('💾 Template kaydediliyor...');

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
          texts: texts
        },
        is_default: false
      };

      let result;

      if (currentTemplateId) {
        console.log(`🔄 Mevcut template güncelleniyor: ${currentTemplateId}`);
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
        console.log('✨ Yeni template oluşturuluyor...');
        result = await supabase
          .from('auto_text_templates')
          .insert(templateData)
          .select()
          .single();
      }

      if (result.error) {
        console.error('❌ Template kaydetme hatası:', result.error);
        alert('Template kaydedilemedi: ' + result.error.message);
        return;
      }

      console.log('✅ Template başarıyla kaydedildi:', result.data);

      if (!currentTemplateId && result.data) {
        setCurrentTemplateId(result.data.id);
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('template', result.data.id);
        window.history.replaceState({}, '', newUrl.toString());
      }

      alert('Template başarıyla kaydedildi! 🎉');

    } catch (error) {
      console.error('❌ Template kaydetme genel hatası:', error);
      alert('Template kaydedilemedi: ' + error.message);
    }
  };

  // ENHANCED: Font yükleme - hem canvas'a hem Supabase'e kaydet
  const handleFontUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !user) {
      console.log('❌ Dosya seçilmedi veya kullanıcı giriş yapmamış');
      return;
    }

    setFontUploading(true);
    console.log(`🚀 FONT YÜKLEME BAŞLADI: ${file.name}`);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const fontName = file.name.split('.')[0].replace(/\s+/g, '-');
          const fontData = e.target.result;
          
          console.log(`📝 Canvas için font yükleniyor: ${fontName}`);
          
          const newFontFace = new FontFace(fontName, `url(${fontData})`);
          const loadedFace = await newFontFace.load();
          document.fonts.add(loadedFace);
          
          console.log(`✅ Canvas'a font yüklendi: ${fontName}`);
          
          setForceRender(prev => prev + 1);
          
          if (selectedId) {
            updateTextProperty(selectedId, 'fontFamily', fontName);
          }
          
          console.log(`💾 Supabase'e kaydediliyor: ${fontName}`);
          
          const savedFont = await FontService.uploadAndSaveFont(file, user.id);
          console.log(`🎉 SUPABASE'E KAYDEDİLDİ:`, savedFont);
          
          await loadUserFonts();
          console.log(`🔄 Font listesi yenilendi`);
          
        } catch (error) {
          console.error(`❌ Font yükleme hatası:`, error);
          alert(`Font yükleme hatası: ${error.message}`);
        } finally {
          setFontUploading(false);
        }
      };
      
      reader.onerror = (err) => {
        console.error(`❌ Dosya okuma hatası:`, err);
        setFontUploading(false);
      };
      
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error(`❌ Font yükleme genel hatası:`, error);
      alert(`Font yükleme hatası: ${error.message}`);
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
    console.log(`🔄 Text özelliği güncelleniyor: ${property} = ${value}`);
    
    setTexts(prevTexts =>
      prevTexts.map(text =>
        text.id === textId
          ? constrainTextToBounds({ ...text, [property]: value })
          : text
      )
    );
    
    if (property === 'fontFamily') {
      console.log(`🎨 Font değişti, canvas yeniden render ediliyor: ${value}`);
      setTimeout(() => {
        setForceRender(prev => prev + 1);
      }, 100);
    }
  };

  // Text silme fonksiyonu
  const deleteText = (textId) => {
    if (texts.length <= 1) {
      alert('En az bir text elementi olmalı!');
      return;
    }
    
    setTexts(prev => prev.filter(t => t.id !== textId));
    
    // CRITICAL: Silinen text seçiliyse, seçimi temizle
    if (selectedId === textId) {
      console.log('🗑️ Seçili text silindi, seçim temizleniyor');
      setSelectedId(null);
      setIsTransformerVisible(false);
      setIsUserInteracting(false);
    }
  };

  // CRITICAL: Font yüklendiğinde callback
  const handleFontUploaded = async () => {
    console.log('🎉 Font yüklendi, font listesi yenileniyor...');
    
    try {
      await loadUserFonts();
      setForceRender(prev => prev + 1);
      console.log('✅ Font listesi başarıyla yenilendi');
    } catch (error) {
      console.error('❌ Font listesi yenileme hatası:', error);
    }
  };

  // CRITICAL: Enhanced text rendering with proper font handling
  const renderKonvaText = (text) => {
    console.log(`🎨 Text render ediliyor: "${text.text.substring(0, 20)}..." font: ${text.fontFamily}`);
    
    const isFontLoaded = systemFonts.includes(text.fontFamily) || 
                        userFonts.some(f => f.font_name === text.fontFamily) ||
                        document.fonts.check(`16px "${text.fontFamily}"`);
    
    const actualFontFamily = isFontLoaded ? text.fontFamily : 'Arial';
    
    if (!isFontLoaded && text.fontFamily !== 'Arial') {
      console.warn(`⚠️ Font yüklenmemiş, fallback kullanılıyor: ${text.fontFamily} -> ${actualFontFamily}`);
    }
    
    return (
      <Group
        key={`${text.id}-${forceRender}-${fontsInitialized}`}
        ref={(node) => (groupRefs.current[text.id] = node)}
        x={text.x}
        y={text.y}
        draggable={isTransformerVisible && selectedId === text.id} // CRITICAL: Sadece transformer görünürken sürüklenebilir
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

  return (
    <div className="flex h-full gap-[10px] p-4">
      {/* Template Loading Indicator */}
      {templateLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
            <span className="text-gray-900 dark:text-white">Template yükleniyor...</span>
          </div>
        </div>
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
                  {texts.map((text) => renderKonvaText(text))}

                  {/* CRITICAL: Transformer sadece gerekli koşullarda göster */}
                  {selectedId && isTransformerVisible && (
                    <Transformer 
                      ref={transformerRef} 
                      borderStroke="#0066ff" 
                      borderStrokeWidth={Math.max(1, 2 / scale)}
                      anchorSize={Math.max(8, 12 / scale)}
                      anchorStroke="#0066ff"
                      anchorFill="#ffffff"
                      anchorStrokeWidth={Math.max(1, 1 / scale)}
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
            <Button onClick={downloadImage} disabled={!templateName} className="w-full">
              DOWNLOAD DESIGN
            </Button>
            <Button onClick={saveTemplate} disabled={!templateName} variant="secondary" className="w-full">
              {currentTemplateId ? 'UPDATE TEMPLATE' : 'SAVE TEMPLATE'}
            </Button>
          </div>
          
          {/* CRITICAL: Geliştirilmiş kullanıcı ipuçları */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
              <p><strong>💡 İpuçları:</strong></p>
              <p>• <strong>Boş alana tıklayın</strong> → Seçimi kaldırır, sadece yazıları görürsünüz</p>
              <p>• <strong>Yazıya tıklayın</strong> → Yazıyı seçer ve düzenleme çerçevesini gösterir</p>
              <p>• <strong>Sürükleme</strong> → Sadece seçili yazılar sürüklenebilir</p>
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
              <span className="text-blue-700 dark:text-blue-400 text-sm">
                Fontlar yükleniyor... ({userFonts.length} font)
              </span>
            </div>
          </div>
        )}

        {/* CRITICAL: Seçim durumu göstergesi */}
        {selectedId && (
          <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="text-sm text-orange-700 dark:text-orange-400">
              <p><strong>📝 Seçili Text:</strong> Text {selectedId}</p>
              <p className="text-xs mt-1">Düzenleme çerçevesi aktif - özellikleri değiştirebilirsiniz</p>
            </div>
          </div>
        )}

        {/* CRITICAL: Accordion Text Controls */}
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