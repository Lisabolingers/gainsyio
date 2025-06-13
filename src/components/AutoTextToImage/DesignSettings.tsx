import React, { useState, useRef, useEffect } from 'react';
import Konva from 'konva';
import { Stage, Layer, Text as KonvaText, Transformer, Group } from 'react-konva';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import ColorOptions from './ColorOptions';
import FontUploadButton from './FontUploadButton';
import { renderTextByStyle } from './styleOption';
import { useFonts } from '../../hooks/useFonts';
import { FontService } from '../../lib/fontService';

const DesignSettings = () => {
  const { allFonts, loading: fontsLoading, loadUserFonts } = useFonts();
  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 1000 });
  const [templateName, setTemplateName] = useState('');
  const [texts, setTexts] = useState([
    {
      id: 1,
      text: 'Sample Text',
      x: 500,
      y: 500,
      maxFontSize: 50,
      fontFamily: 'Arial, sans-serif',
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
  const [fontLoadingStates, setFontLoadingStates] = useState<Record<string, boolean>>({});
  const stageRef = useRef();
  const transformerRef = useRef();
  const groupRefs = useRef({});

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
    
    // Ensure text stays within canvas bounds
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
      
      // Set transformer properties to ensure visibility regardless of scale
      const transformer = transformerRef.current;
      
      // Calculate minimum handle size based on scale
      const minHandleSize = Math.max(8, 12 / scale); // Minimum 8px, scaled up for small scales
      const minBorderWidth = Math.max(1, 2 / scale); // Minimum 1px, scaled up for small scales
      
      // Update transformer properties
      transformer.borderStrokeWidth(minBorderWidth);
      transformer.anchorSize(minHandleSize);
      transformer.anchorStroke('#0066ff');
      transformer.anchorFill('#ffffff');
      transformer.anchorStrokeWidth(Math.max(1, 1 / scale));
      transformer.borderStroke('#0066ff');
      
      // Force redraw
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
    
    // Reset scale to 1 and adjust width/height instead
    node.scaleX(1);
    node.scaleY(1);
    
    setTexts(prevTexts =>
      prevTexts.map(text =>
        text.id === textId
          ? constrainTextToBounds({
              ...text,
              x: node.x(),
              y: node.y(),
              width: Math.max(50, text.width * scaleX), // Minimum width
              height: Math.max(20, text.height * scaleY), // Minimum height,
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

  // CRITICAL: Enhanced font upload handler with immediate refresh
  const handleFontUploaded = async (fontData: { display: string, value: string }) => {
    console.log('🎉 Font uploaded successfully:', fontData);
    
    // Update selected text to use the new font immediately
    if (selectedId) {
      updateTextProperty(selectedId, 'fontFamily', fontData.value);
    }
    
    // Refresh the fonts list to show the new font immediately
    try {
      await loadUserFonts();
      console.log('✅ Font list refreshed after upload');
    } catch (error) {
      console.error('❌ Failed to refresh font list:', error);
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

    // Apply constraints
    newX = Math.max(halfWidth, Math.min(canvasSize.width - halfWidth, newX));
    newY = Math.max(halfHeight, Math.min(canvasSize.height - halfHeight, newY));

    setTexts(texts.map(t => t.id === selectedId ? { ...t, x: newX, y: newY } : t));
  };

  // Update text properties with constraints
  const updateTextProperty = (textId, property, value) => {
    setTexts(prevTexts =>
      prevTexts.map(text =>
        text.id === textId
          ? constrainTextToBounds({ ...text, [property]: value })
          : text
      )
    );
  };

  // CRITICAL: Enhanced font loading for Konva with aggressive approach
  const ensureFontLoadedForKonva = async (fontFamily: string): Promise<string> => {
    const konvaFontFamily = FontService.getKonvaFontFamily(fontFamily);
    
    console.log(`🚀 CRITICAL: Ensuring font is loaded for Konva: ${fontFamily} -> ${konvaFontFamily}`);
    
    // Check if font is already loaded
    if (document.fonts.check(`16px "${konvaFontFamily}"`)) {
      console.log(`✅ Font already loaded and ready: ${konvaFontFamily}`);
      return konvaFontFamily;
    }
    
    // Set loading state
    setFontLoadingStates(prev => ({ ...prev, [konvaFontFamily]: true }));
    
    try {
      console.log(`🔄 Font not ready, forcing load: ${konvaFontFamily}`);
      
      // Wait for document.fonts to be ready
      await document.fonts.ready;
      
      // Aggressive checking with longer timeout and more attempts
      let attempts = 0;
      const maxAttempts = 30; // Increased attempts
      
      while (attempts < maxAttempts && !document.fonts.check(`16px "${konvaFontFamily}"`)) {
        await new Promise(resolve => setTimeout(resolve, 300)); // Increased wait time
        attempts++;
        console.log(`⏳ AGGRESSIVE WAIT: Font loading attempt ${attempts}/${maxAttempts} for ${konvaFontFamily}`);
        
        // Force reflow every few attempts
        if (attempts % 5 === 0) {
          const testDiv = document.createElement('div');
          testDiv.style.fontFamily = `"${konvaFontFamily}", Arial, sans-serif`;
          testDiv.style.fontSize = '1px';
          testDiv.style.position = 'absolute';
          testDiv.style.left = '-9999px';
          testDiv.textContent = 'test';
          document.body.appendChild(testDiv);
          testDiv.offsetHeight; // Force reflow
          document.body.removeChild(testDiv);
        }
      }
      
      if (attempts >= maxAttempts) {
        console.warn(`⚠️ AGGRESSIVE LOADING TIMEOUT: Font ${konvaFontFamily} may not be fully loaded, using fallback`);
      } else {
        console.log(`🎉 AGGRESSIVE SUCCESS: Font ${konvaFontFamily} is ready for Konva after ${attempts} attempts`);
      }
      
      return konvaFontFamily;
    } catch (error) {
      console.error(`❌ CRITICAL ERROR loading font ${konvaFontFamily}:`, error);
      return 'Arial'; // Fallback to Arial
    } finally {
      // Clear loading state
      setFontLoadingStates(prev => ({ ...prev, [konvaFontFamily]: false }));
    }
  };

  // CRITICAL: Enhanced text rendering with aggressive font loading
  const renderKonvaText = (text) => {
    const konvaFontFamily = FontService.getKonvaFontFamily(text.fontFamily);
    const isLoading = fontLoadingStates[konvaFontFamily];
    
    console.log(`🎨 RENDERING TEXT: ${text.text.substring(0, 20)}... with font: ${text.fontFamily} -> ${konvaFontFamily}`);
    
    // Use fallback font while loading
    const actualFontFamily = isLoading ? 'Arial' : konvaFontFamily;
    
    // CRITICAL: Force font loading when font changes
    useEffect(() => {
      if (konvaFontFamily && konvaFontFamily !== 'Arial') {
        ensureFontLoadedForKonva(text.fontFamily).catch(console.error);
      }
    }, [text.fontFamily]);
    
    return (
      <Group
        key={text.id}
        ref={(node) => (groupRefs.current[text.id] = node)}
        x={text.x}
        y={text.y}
        draggable
        onClick={() => setSelectedId(text.id)}
        onDragEnd={(e) => handleTextDragEnd(text.id, e)}
        onTransformEnd={(e) => handleTransformEnd(text.id, e)}
        dragBoundFunc={(pos) => {
          // Constrain drag position to canvas bounds
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
                            key={`${lineIdx}-${idx}`}
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
              <Stage width={canvasSize.width} height={canvasSize.height} ref={stageRef} onClick={handleStageClick}>
                <Layer>
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
                        // Constrain transformer to canvas bounds
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
                    console.log(`🔄 CRITICAL: Font changed to: ${e.target.value}`);
                    updateTextProperty(text.id, 'fontFamily', e.target.value);
                    // Ensure font is loaded for Konva with aggressive approach
                    ensureFontLoadedForKonva(e.target.value).catch(console.error);
                  }} 
                  className="w-32 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={fontsLoading}
                >
                  {allFonts.map((font) => (
                    <option key={font.value} value={font.value}>{font.display}</option>
                  ))}
                </select>
                
                {/* Enhanced Font Upload Button */}
                <div className="relative">
                  <FontUploadButton onFontUploaded={handleFontUploaded} />
                </div>

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