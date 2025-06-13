import React from 'react';
import { Text as KonvaText } from 'react-konva';

// Arc efekti (Illustrator tarzı)
export const renderArcText = (textObj, canvasSize) => {
  const chars = textObj.text.split('');
  const bend = textObj.bend || 50; // Bend (yüzde)
  const distortionH = textObj.distortionH || 0; // Yatay bozulma
  const distortionV = textObj.distortionV || 0; // Dikey bozulma

  const radius = 300;
  const totalAngle = (Math.PI / 180) * bend; // Bend dereceyi radyana çevirir
  const angleStep = totalAngle / (chars.length - 1 || 1); // Bölüm sıfır olmamalı
  const startAngle = -totalAngle / 2;

  return (
    <>
      {chars.map((char, idx) => {
        const angle = startAngle + angleStep * idx;
        const distortionX = distortionH * Math.sin(angle); // Yatay distortion
        const distortionY = distortionV * Math.cos(angle); // Dikey distortion
        const x = textObj.x + radius * Math.sin(angle) + distortionX;
        const y = textObj.y - radius * Math.cos(angle) + distortionY;

        return (
          <KonvaText
            key={idx}
            text={char}
            x={x}
            y={y}
            rotation={(angle * 180) / Math.PI}
            fontSize={textObj.maxFontSize}
            fontFamily={textObj.fontFamily}
            fill={textObj.fill}
            offsetX={textObj.maxFontSize / 2}
            offsetY={textObj.maxFontSize / 2}
          />
        );
      })}
    </>
  );
};

// Wave efekti (önceki dalga efekti)
export const renderWaveText = (textObj) => {
  const amplitude = 30;
  const wavelength = 100;
  const chars = textObj.text.split('');

  return (
    <>
      {chars.map((char, idx) => {
        const x = textObj.x + idx * (textObj.maxFontSize + textObj.letterSpacing);
        const y = textObj.y + Math.sin((x / wavelength) * 2 * Math.PI) * amplitude;
        return (
          <KonvaText
            key={idx}
            text={char}
            x={x}
            y={y}
            fontSize={textObj.maxFontSize}
            fontFamily={textObj.fontFamily}
            fill={textObj.fill}
            offsetX={textObj.maxFontSize / 2}
            offsetY={textObj.maxFontSize / 2}
          />
        );
      })}
    </>
  );
};

// Seçime göre efekt seçimi
export const renderTextByStyle = (textObj, canvasSize) => {
  if (textObj.styleOption === 'arc') {
    return <>{renderArcText(textObj, canvasSize)}</>;
  } else if (textObj.styleOption === 'wave') {
    return <>{renderWaveText(textObj)}</>;
  } else {
    return null;
  }
};
