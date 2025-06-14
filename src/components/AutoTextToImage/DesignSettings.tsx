import React, { useState, useRef, useEffect } from 'react';
import Konva from 'konva';
import { Stage, Layer, Text as KonvaText, Transformer, Group } from 'react-konva';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import ColorOptions from './ColorOptions';
import { renderTextByStyle } from './styleOption';
import { useFonts } from '../../hooks/useFonts';
import { FontService } from '../../lib/fontService';
import { useAuth } from '../../context/AuthContext';

const DesignSettings = () => {
  const { user } = useAuth();
  const { userFonts, loadUserFonts, loading: fontsLoading, googleFontsLoaded } = useFonts();
  
  // CRITICAL: Enhanced system fonts list with proper font names for Konva
  const systemFonts = [
    'Arial', 'Times New Roman', 'Helvetica', 'Georgia', 'Verdana',
    'Comic Sans MS', 'Courier New', 'Roboto', 'Open Sans', 'Lobster'
  ];
  
  // Tüm fontları birleştir
  const allFonts = [
    ...systemFonts,
    ...userFonts.map(font => font.font_name)
  ];
  
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
      colorOption: 'normal',
      styleOption: 'normal',
    }
  ]);
  const [selectedId, setSelectedId] = useState(1);
  const [forceRender, setForceRender] = useState(0);
  const [fontUploading, setFontUploading] = useState(false);
  const [fontsInitialized, setFontsInitialized] = useState(false);
  const [fontLoadingStatus, setFontLoadingStatus] = useState('');
  const stageRef = useRef();
  const transformerRef = useRef();
  const groupRefs = useRef({});
  const fileInputRef = useRef();

  // CRITICAL: Enhanced font initialization with Google Fonts support
  useEffect(() => {
    const initializeFonts = async () => {
      if (!user || fontsLoading || fontsInitialized) return;
      
      console.log('🚀 SAYFA YÜKLENDİ - FONTLAR İNİTİALİZE EDİLİYOR...');
      setFontLoadingStatus('Fontlar yükleniyor...');
      
      try {
        // Wait for Google Fonts to be loaded first
        if (!googleFontsLoaded) {
          console.log('⏳ Google Fonts bekleniyor...');
          setFontLoadingStatus('Google Fonts yükleniyor...');
          
          // Wait for Google Fonts with timeout
          let attempts = 0;
          while (!googleFontsLoaded && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
          }
          
          if (googleFontsLoaded) {
            console.log('✅ Google Fonts hazır');
          } else {
            console.warn('⚠️ Google Fonts timeout, devam ediliyor');
          }
        }
        
        // Wait for document fonts to be ready
        await document.fonts.ready;
        console.log('✅ Document fonts ready');
        
        // Kullanıcı fontlarını Supabase'den yükle
        await loadUserFonts();
        
        // Tüm kullanıcı fontlarını canvas'a yükle
        if (userFonts.length > 0) {
          console.log(`🔄 ${userFonts.length} kullanıcı fontu canvas'a yükleniyor...`);
          setFontLoadingStatus(`${userFonts.length} font canvas'a yükleniyor...`);
          
          // CRITICAL: Sequential font loading with proper waiting
          for (let i = 0; i < userFonts.length; i++) {
            const font = userFonts[i];
            try {
              console.log(`📝 Canvas'a yükleniyor (${i + 1}/${userFonts.length}): ${font.font_name}`);
              setFontLoadingStatus(`Font yükleniyor: ${font.font_name} (${i + 1}/${userFonts.length})`);
              
              // Font'u browser'a yükle
              await FontService.loadFontInBrowser(font);
              
              // CRITICAL: Wait for font to be fully loaded and ready
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // CRITICAL: Verify font is actually loaded
              const mainFontFamily = font.font_family.split(',')[0].replace(/['"]/g, '').trim();
              const isLoaded = document.fonts.check(`16px "${mainFontFamily}"`);
              
              if (isLoaded) {
                console.log(`✅ Font verified loaded: ${font.font_name}`);
              } else {
                console.warn(`⚠️ Font may not be fully loaded: ${font.font_name}`);
                // Try one more time with longer wait
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
              
            } catch (error) {
              console.warn(`⚠️ Font yüklenemedi: ${font.font_name}`, error);
            }
          }
          
          console.log('✅ Tüm fontlar canvas\'a yüklendi');
          setFontLoadingStatus('Fontlar hazır!');
          
          // CRITICAL: Multiple canvas refreshes to ensure fonts are applied
          setTimeout(() => {
            setForceRender(prev => prev + 1);
            console.log('🎨 Canvas ilk yenileme');
          }, 500);
          
          setTimeout(() => {
            setForceRender(prev => prev + 1);
            console.log('🎨 Canvas ikinci yenileme');
          }, 1500);
          
          setTimeout(() => {
            setForceRender(prev => prev + 1);
            console.log('🎨 Canvas final yenileme');
            setFontLoadingStatus('');
          }, 3000);
        } else {
          setFontLoadingStatus('');
        }
        
        setFontsInitialized(true);
        console.log('🎉 FONT İNİTİALİZASYONU TAMAMLANDI');
        
      } catch (error) {
        console.error('❌ Font initialization hatası:', error);
        setFontLoadingStatus('Font yükleme hatası!');
        setFontsInitialized(true); // Hata olsa bile devam et
        setTimeout(() => setFontLoadingStatus(''), 3000);
      }
    };

    initializeFonts();
  }, [user, userFonts.length, fontsLoading, googleFontsLoaded]);

  // CRITICAL: Additional effect to handle font changes and re-renders
  useEffect(() => {
    if (fontsInitialized && userFonts.length > 0) {
      console.log('🔄 Font listesi değişti, canvas güncelleniyor...');
      
      // Multiple staged re-renders for better font application
      const timeouts = [100, 500, 1000, 2000];
      timeouts.forEach((delay, index) => {
        setTimeout(() => {
          setForceRender(prev => prev + 1);
          console.log(`🎨 Staged canvas refresh ${index + 1}/${timeouts.length}`);
        }, delay);
      });
    }
  }, [userFonts, fontsInitialized]);

  // CRITICAL: Force re-render when fonts are ready
  useEffect(() => {
    const handleFontsReady = () => {
      console.log('🎯 Document fonts ready event triggered');
      if (fontsInitialized) {
        setTimeout(() => {
          setForceRender(prev => prev + 1);
          console.log('🎨 Canvas refresh after fonts ready');
        }, 200);
      }
    };

    document.fonts.addEventListener('loadingdone', handleFontsReady);
    
    return () => {
      document.fonts.removeEventListener('loadingdone', handleFontsReady);
    };
  }, [fontsInitialized]);

  // CRITICAL: Google Fonts ready effect
  useEffect(() => {
    if (googleFontsLoaded && fontsInitialized) {
      console.log('🎯 Google Fonts loaded, refreshing canvas');
      setTimeout(() => {
        setForceRender(prev => prev + 1);
      }, 500);
    }
  }, [googleFontsLoaded, fontsInitialized]);

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

  useEffect(() => {
    if (selectedId === null) {
      transformerRef.current?.nodes([]);
      return;
    }
    const node = groupRefs.current[selectedId];
    if (node && transformerRef.current) {
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
  }, [selectedId, texts, scale]);

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

  const handleStageClick = (e) => {
    if (e.target === e.target.getStage()) {
      setSelectedId(null);
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
      y: canvasSize.height / 2
    });
    setTexts([...texts, newText]);
    setSelectedId(newId);
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
      // 1. ADIM: Canvas için hemen yükle (eski sistem)
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const fontName = file.name.split('.')[0].replace(/\s+/g, '-');
          const fontData = e.target.result;
          
          console.log(`📝 Canvas için font yükleniyor: ${fontName}`);
          
          // Canvas'a hemen yükle
          const newFontFace = new FontFace(fontName, `url(${fontData})`);
          const loadedFace = await newFontFace.load();
          document.fonts.add(loadedFace);
          
          console.log(`✅ Canvas'a font yüklendi: ${fontName}`);
          
          // Canvas'ı güncelle
          setForceRender(prev => prev + 1);
          
          // Seçili text'e uygula
          if (selectedId) {
            updateTextProperty(selectedId, 'fontFamily', fontName);
          }
          
          // 2. ADIM: Supabase'e kaydet
          console.log(`💾 Supabase'e kaydediliyor: ${fontName}`);
          
          const savedFont = await FontService.uploadAndSaveFont(file, user.id);
          console.log(`🎉 SUPABASE'E KAYDEDİLDİ:`, savedFont);
          
          // Font listesini yenile
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
    
    // Input'u temizle
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
    
    // Font değiştiğinde canvas'ı zorla yeniden render et
    if (property === 'fontFamily') {
      console.log(`🎨 Font değişti, canvas yeniden render ediliyor: ${value}`);
      setTimeout(() => {
        setForceRender(prev => prev + 1);
      }, 100);
    }
  };

  // CRITICAL: Enhanced text rendering with better font handling and Google Fonts support
  const renderKonvaText = (text) => {
    console.log(`🎨 Text render ediliyor: "${text.text.substring(0, 20)}..." font: ${text.fontFamily}`);
    
    // CRITICAL: Enhanced font availability check with Google Fonts support
    const isSystemFont = systemFonts.includes(text.fontFamily);
    const isUserFont = userFonts.some(f => f.font_name === text.fontFamily);
    const isFontLoaded = isSystemFont || isUserFont || document.fonts.check(`16px "${text.fontFamily}"`);
    
    // CRITICAL: Better fallback strategy
    let actualFontFamily = text.fontFamily;
    
    if (!isFontLoaded && text.fontFamily !== 'Arial') {
      console.warn(`⚠️ Font yüklenmemiş, fallback kullanılıyor: ${text.fontFamily} -> Arial`);
      actualFontFamily = 'Arial';
    }
    
    // CRITICAL: For user fonts, try to find the full font family with fallbacks
    const userFont = userFonts.find(f => f.font_name === text.fontFamily);
    if (userFont) {
      actualFontFamily = userFont.font_family; // This includes fallbacks
      console.log(`🎯 User font found, using full family: ${actualFontFamily}`);
    }
    
    // CRITICAL: For Google Fonts, ensure proper font family name
    if (isSystemFont && ['Roboto', 'Open Sans', 'Lobster'].includes(text.fontFamily)) {
      actualFontFamily = text.fontFamily; // Use exact Google Font name
      console.log(`🎯 Google Font detected: ${actualFontFamily}`);
    }
    
    return (
      <Group
        key={`${text.id}-${forceRender}-${fontsInitialized}-${userFonts.length}-${googleFontsLoaded}`}
        ref={(node) => (groupRefs.current[text.id] = node)}
        x={text.x}
        y={text.y}
        draggable
        onClick={() => setSelectedId(text.id)}
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
                key={`text-${text.id}-${forceRender}-${fontsInitialized}-${userFonts.length}-${googleFontsLoaded}`}
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
                key={`stage-${forceRender}-${fontsInitialized}-${userFonts.length}-${googleFontsLoaded}`}
                width={canvasSize.width} 
                height={canvasSize.height} 
                ref={stageRef} 
                onClick={handleStageClick}
              >
                <Layer key={`layer-${forceRender}-${fontsInitialized}-${userFonts.length}-${googleFontsLoaded}`}>
                  {texts.map((text) => renderKonvaText(text))}

                  {selectedId && (
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
            <Button variant="secondary" className="w-full">
              SAVE
            </Button>
          </div>
        </div>
      </div>

      {/* Text Controls Section - Right Side */}
      <div className="w-1/2 p-4 overflow-y-auto max-h-screen">
        {/* Font Loading Status */}
        {(!fontsInitialized || fontLoadingStatus) && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-blue-700 dark:text-blue-400 text-sm">
                {fontLoadingStatus || `Fontlar yükleniyor... (${userFonts.length} font)`}
              </span>
            </div>
          </div>
        )}

        {/* Google Fonts Status */}
        {!googleFontsLoaded && (
          <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
              <span className="text-orange-700 dark:text-orange-400 text-sm">
                Google Fonts yükleniyor... (Roboto, Open Sans, Lobster)
              </span>
            </div>
          </div>
        )}

        {texts.map((text) => (
          <Card key={text.id} className="mb-4">
            <CardHeader>
              <CardTitle>Text {text.id}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Text Input */}
              <div className="flex gap-2 items-start mb-4">
                <textarea 
                  value={text.text} 
                  onChange={(e) => updateTextProperty(text.id, 'text', e.target.value)} 
                  rows={1} 
                  className="border border-gray-300 dark:border-gray-600 p-2 rounded flex-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none overflow-hidden" 
                />
                <Button 
                  className="p-2 h-10 w-10 flex items-center justify-center" 
                  onClick={() => updateTextProperty(text.id, 'text', text.text + '\n')}
                >
                  +
                </Button>
              </div>

              {/* Font and Size Controls */}
              <div className="flex items-center gap-2 mt-2 w-full mb-4">
                <label className="text-gray-700 dark:text-gray-300 text-sm">Font:</label>
                <select 
                  value={text.fontFamily} 
                  onChange={(e) => {
                    console.log(`🔄 FONT DEĞİŞTİRİLİYOR: ${e.target.value}`);
                    updateTextProperty(text.id, 'fontFamily', e.target.value);
                  }} 
                  className="w-32 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={fontsLoading || !fontsInitialized}
                >
                  {allFonts.map((font) => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
                
                {/* Enhanced Font Upload Button */}
                <Button 
                  className="p-2 h-10 w-10 flex items-center justify-center" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={fontUploading}
                  title="Upload custom font"
                >
                  {fontUploading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    '+'
                  )}
                </Button>
                <input 
                  type="file" 
                  accept=".ttf,.otf,.woff,.woff2" 
                  ref={fileInputRef} 
                  onChange={handleFontUpload} 
                  style={{ display: 'none' }} 
                />

                <label className="text-gray-700 dark:text-gray-300 text-sm">Font Size (px):</label>
                <input 
                  type="number" 
                  value={text.maxFontSize} 
                  min="1"
                  step="1" 
                  onChange={(e) => updateTextProperty(text.id, 'maxFontSize', parseInt(e.target.value))} 
                  className="w-20 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                />
              </div>

              {/* Additional Controls */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <label className="text-gray-700 dark:text-gray-300 text-sm">Line Height:</label>
                <input 
                  type="number" 
                  value={text.lineHeight} 
                  onChange={(e) => updateTextProperty(text.id, 'lineHeight', parseFloat(e.target.value))} 
                  className="w-20 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                />
                
                <label className="text-gray-700 dark:text-gray-300 text-sm">Letter Spacing:</label>
                <input 
                  type="number" 
                  value={text.letterSpacing} 
                  onChange={(e) => updateTextProperty(text.id, 'letterSpacing', parseFloat(e.target.value))} 
                  className="w-20 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                />
                
                <label className="text-gray-700 dark:text-gray-300 text-sm">Align:</label>
                <select 
                  value={text.align} 
                  onChange={(e) => updateTextProperty(text.id, 'align', e.target.value)} 
                  className="w-24 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>

              {/* Alignment Buttons */}
              <div className="mt-4 flex gap-3 text-3xl mb-4">
                <button onClick={() => alignText('left')} className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                  <span className="material-icons">format_align_left</span>
                </button>
                <button onClick={() => alignText('centerX')} className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                  <span className="material-icons">format_align_center</span>
                </button>
                <button onClick={() => alignText('right')} className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                  <span className="material-icons">format_align_right</span>
                </button>
                <button onClick={() => alignText('top')} className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                  <span className="material-icons">vertical_align_top</span>
                </button>
                <button onClick={() => alignText('centerY')} className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                  <span className="material-icons">vertical_align_center</span>
                </button>
                <button onClick={() => alignText('bottom')} className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                  <span className="material-icons">vertical_align_bottom</span>
                </button>
              </div>

              {/* Color Options */}
              <ColorOptions text={text} setTexts={setTexts} texts={texts} />

              {/* Style Options */}
              <div className="mt-2 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-gray-700 dark:text-gray-300 text-sm">Style:</label>
                  <select
                    value={text.styleOption || 'normal'}
                    onChange={(e) => updateTextProperty(text.id, 'styleOption', e.target.value)}
                    className="w-24 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="normal">Normal</option>
                    <option value="arc">Arc</option>
                    <option value="wave">Wave</option>
                  </select>
                </div>
              </div>

              {/* Style Parameters */}
              <div className="mt-2 flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-gray-700 dark:text-gray-300 text-sm">Bend (%):</label>
                  <input 
                    type="number" 
                    value={text.bend || 50} 
                    onChange={(e) => updateTextProperty(text.id, 'bend', parseFloat(e.target.value))} 
                    className="w-20 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-gray-700 dark:text-gray-300 text-sm">Distortion H:</label>
                  <input 
                    type="number" 
                    value={text.distortionH || 0} 
                    onChange={(e) => updateTextProperty(text.id, 'distortionH', parseFloat(e.target.value))} 
                    className="w-20 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-gray-700 dark:text-gray-300 text-sm">Distortion V:</label>
                  <input 
                    type="number" 
                    value={text.distortionV || 0} 
                    onChange={(e) => updateTextProperty(text.id, 'distortionV', parseFloat(e.target.value))} 
                    className="w-20 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        <Button className="mt-4 w-full" onClick={addText}>
          Add Text
        </Button>
      </div>
    </div>
  );
};

export default DesignSettings;