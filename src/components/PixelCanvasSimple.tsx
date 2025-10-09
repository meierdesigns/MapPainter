"use strict";

import React, { useRef, useCallback, useState, useEffect } from 'react';
import './PixelCanvas.css';

interface PixelCanvasSimpleProps {
  width: number;
  height: number;
  currentTool: string;
  currentColor: string;
  brushSize: number;
  zoom: number;
  showGrid: boolean;
  gridColor: string;
  gridThickness: number;
  onHistoryUpdate: (data: ImageData) => void;
  onZoomChange: (zoom: number) => void;
  historyData: ImageData | null;
  currentLayer: 'red' | 'green' | 'blue';
  layers: Array<{ name: string; visible: boolean; palette: Array<{ color: string; name: string }> }>;
  colorTable: Array<{ id: string; name: string }>;
  onPixelUpdateReady: () => void;
  patternSize: number;
  patternOpacity: number;
  patternAnimationSpeed: number;
  patternType: string;
  patternColor: string;
  backgroundColor: string;
  patternAnimationType: string;
  onAutoAddColorToPalette?: (color: string) => void;
  currentRgbColor?: string;
}

const PixelCanvasSimple: React.FC<PixelCanvasSimpleProps> = ({
  width,
  height,
  currentTool,
  currentColor,
  brushSize,
  zoom,
  showGrid,
  gridColor,
  gridThickness,
  onHistoryUpdate,
  onZoomChange,
  historyData,
  currentLayer,
  layers,
  colorTable,
  onPixelUpdateReady,
  patternSize,
  patternOpacity,
  patternAnimationSpeed,
  patternType,
  patternColor,
  backgroundColor,
  patternAnimationType,
  onAutoAddColorToPalette,
  currentRgbColor
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const [lastPosition, setLastPosition] = useState<{ x: number; y: number } | null>(null);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredPixels, setHoveredPixels] = useState<Set<string>>(new Set());
  const [originalPixelColors, setOriginalPixelColors] = useState<Map<string, string>>(new Map());

  // Simple pixel drawing function
  const drawPixel = useCallback((x: number, y: number, color: string) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;

    // Get the current layer canvas
    const canvas = document.querySelector(`.pixel-canvas[data-layer="${currentLayer}"]`) as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (color === 'transparent' || !color) {
      // Erase pixel by setting it to transparent
      ctx.clearRect(x, y, 1, 1);
    } else {
      // Draw pixel directly
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }, [width, height, currentLayer]);

  // Simple brush drawing
  const drawBrush = useCallback((x: number, y: number, color: string, size: number) => {
    const startX = x - Math.floor((size - 1) / 2);
    const startY = y - Math.floor((size - 1) / 2);
    
    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        const px = startX + dx;
        const py = startY + dy;
        drawPixel(px, py, color);
      }
    }
  }, [drawPixel]);

  // Get pixel color from current layer
  const getPixelColorFromLayer = useCallback((x: number, y: number): string => {
    if (x < 0 || x >= width || y < 0 || y >= height) return 'transparent';
    
    const canvas = document.querySelector(`.pixel-canvas[data-layer="${currentLayer}"]`) as HTMLCanvasElement;
    if (!canvas) return 'transparent';
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return 'transparent';
    
    const imageData = ctx.getImageData(x, y, 1, 1);
    const [r, g, b, a] = imageData.data;
    
    if (a === 0) return 'transparent';
    return `rgb(${r}, ${g}, ${b})`;
  }, [width, height, currentLayer]);

  // Clear hover effect
  const clearHoverEffect = useCallback(() => {
    const hoverCanvas = hoverCanvasRef.current;
    if (!hoverCanvas) return;
    
    const ctx = hoverCanvas.getContext('2d');
    if (!ctx) return;
    
    // Clear hover canvas
    ctx.clearRect(0, 0, width, height);
    
    // Restore original colors to main canvas
    const mainCanvas = document.querySelector(`.pixel-canvas[data-layer="${currentLayer}"]`) as HTMLCanvasElement;
    if (mainCanvas) {
      const mainCtx = mainCanvas.getContext('2d');
      if (mainCtx) {
        originalPixelColors.forEach((color, pixelKey) => {
          const [x, y] = pixelKey.split(',').map(Number);
          if (x >= 0 && x < width && y >= 0 && y < height) {
            mainCtx.fillStyle = color;
            mainCtx.fillRect(x, y, 1, 1);
          }
        });
      }
    }
    
    // Clear state
    setHoveredPixels(new Set());
    setOriginalPixelColors(new Map());
  }, [width, height, currentLayer, originalPixelColors]);

  // Apply hover effect
  const applyHoverEffect = useCallback((x: number, y: number, size: number) => {
    if (!currentColor) return;
    
    const hoverCanvas = hoverCanvasRef.current;
    if (!hoverCanvas) return;
    
    const ctx = hoverCanvas.getContext('2d');
    if (!ctx) return;
    
    // Clear previous hover
    clearHoverEffect();
    
    const startX = x - Math.floor((size - 1) / 2);
    const startY = y - Math.floor((size - 1) / 2);
    const newHoveredPixels = new Set<string>();
    const newOriginalColors = new Map<string, string>();
    
    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        const px = startX + dx;
        const py = startY + dy;
        
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const pixelKey = `${px},${py}`;
          
          // Get original color
          const originalColor = getPixelColorFromLayer(px, py);
          newOriginalColors.set(pixelKey, originalColor);
          
          // Draw hover effect on hover canvas
          ctx.fillStyle = currentColor;
          ctx.fillRect(px, py, 1, 1);
          
          newHoveredPixels.add(pixelKey);
        }
      }
    }
    
    setHoveredPixels(newHoveredPixels);
    setOriginalPixelColors(newOriginalColors);
  }, [currentColor, width, height, clearHoverEffect, getPixelColorFromLayer]);

  // Get pixel position from mouse event
  const getPixelPosition = useCallback((event: React.MouseEvent<HTMLElement>) => {
    // Get the current layer canvas
    const canvas = document.querySelector(`.pixel-canvas[data-layer="${currentLayer}"]`) as HTMLCanvasElement;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    
    // Calculate mouse position relative to canvas
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Convert to pixel coordinates (canvas is scaled by zoom)
    const x = Math.floor(mouseX / zoom);
    const y = Math.floor(mouseY / zoom);
    
    console.log('🎯 Direct canvas coordinates:', {
      mouseX: event.clientX,
      mouseY: event.clientY,
      canvasLeft: rect.left,
      canvasTop: rect.top,
      relativeX: mouseX,
      relativeY: mouseY,
      zoom,
      pixelX: x,
      pixelY: y
    });
    
    if (x < 0 || x >= width || y < 0 || y >= height) return null;
    
    return { x, y };
  }, [zoom, width, height, currentLayer]);

  // Mouse event handlers
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    setIsMouseDown(true);
    
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    setLastPosition({ x: mouseX, y: mouseY });

    // Handle drawing
    if (event.button === 0) {
      const pos = getPixelPosition(event);
      if (pos) {
        switch (currentTool) {
          case 'brush':
            if (currentColor) {
              drawBrush(pos.x, pos.y, currentColor, brushSize);
            }
            break;
          case 'eraser':
            drawBrush(pos.x, pos.y, 'transparent', brushSize);
            break;
        }
      }
    }
  }, [getPixelPosition, currentTool, currentColor, brushSize, drawBrush]);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;
    
    if (isMouseDown && lastPosition) {
      // Handle panning (right-click)
      if (event.button === 2) {
        const deltaX = currentX - lastPosition.x;
        const deltaY = currentY - lastPosition.y;
        setPanOffset(prev => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY
        }));
      } else if (event.button === 0) {
        // Handle drawing
        const pos = getPixelPosition(event);
        if (pos) {
        switch (currentTool) {
          case 'brush':
            if (currentColor) {
              drawBrush(pos.x, pos.y, currentColor, brushSize);
            }
            break;
          case 'eraser':
            drawBrush(pos.x, pos.y, 'transparent', brushSize);
            break;
        }
        }
      }
      setLastPosition({ x: currentX, y: currentY });
    } else {
      // Handle hover preview
      const pos = getPixelPosition(event);
      if (pos && currentColor && (currentTool === 'brush' || currentTool === 'eraser')) {
        applyHoverEffect(pos.x, pos.y, brushSize);
      } else {
        clearHoverEffect();
      }
    }
  }, [isMouseDown, lastPosition, getPixelPosition, currentTool, currentColor, brushSize, drawBrush, applyHoverEffect, clearHoverEffect]);

  const handleMouseUp = useCallback(() => {
    setIsMouseDown(false);
    setLastPosition(null);
  }, []);

  const handleMouseLeave = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    clearHoverEffect();
  }, [clearHoverEffect]);

  const handleWheel = useCallback((event: React.WheelEvent<HTMLCanvasElement>) => {
    const delta = event.deltaY > 0 ? -0.5 : 0.5;
    const newZoom = Math.max(0.5, Math.min(32, zoom + delta));
    onZoomChange(newZoom);
  }, [zoom, onZoomChange]);

  // Update CSS animations dynamically (only when needed)
  useEffect(() => {
    if (patternAnimationSpeed <= 0) return;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pattern-waves {
        0% { background-position: 0 0; }
        25% { background-position: ${patternSize}px ${patternSize * 0.5}px; }
        50% { background-position: ${patternSize * 0.5}px ${patternSize}px; }
        75% { background-position: ${patternSize}px ${patternSize * 0.5}px; }
        100% { background-position: 0 0; }
      }
      
      @keyframes pattern-twitchy {
        0% { background-position: 0 0; }
        10% { background-position: ${patternSize * 0.2}px ${patternSize * 0.1}px; }
        20% { background-position: ${patternSize * 0.8}px ${patternSize * 0.3}px; }
        30% { background-position: ${patternSize * 0.1}px ${patternSize * 0.9}px; }
        40% { background-position: ${patternSize * 0.9}px ${patternSize * 0.2}px; }
        50% { background-position: ${patternSize * 0.3}px ${patternSize * 0.7}px; }
        60% { background-position: ${patternSize * 0.7}px ${patternSize * 0.1}px; }
        70% { background-position: ${patternSize * 0.1}px ${patternSize * 0.8}px; }
        80% { background-position: ${patternSize * 0.6}px ${patternSize * 0.4}px; }
        90% { background-position: ${patternSize * 0.4}px ${patternSize * 0.6}px; }
        100% { background-position: 0 0; }
      }
      
      @keyframes pattern-softmove {
        0% { background-position: 0 0; }
        33% { background-position: ${patternSize * 0.3}px ${patternSize * 0.7}px; }
        66% { background-position: ${patternSize * 0.7}px ${patternSize * 0.3}px; }
        100% { background-position: 0 0; }
      }
      
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, [patternSize, patternAnimationSpeed]);

  // Generate pattern background
  const getPatternBackground = useCallback(() => {
    console.log('🎨 Generating pattern:', {
      patternType,
      patternSize,
      patternColor,
      patternOpacity,
      backgroundColor
    });
    
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = patternSize;
    patternCanvas.height = patternSize;
    const patternCtx = patternCanvas.getContext('2d');
    
    if (!patternCtx) {
      console.error('❌ Failed to get pattern canvas context');
      return '';
    }

    // Clear with background color
    patternCtx.fillStyle = backgroundColor;
    patternCtx.fillRect(0, 0, patternSize, patternSize);

    // Draw pattern based on type
    patternCtx.fillStyle = patternColor;
    patternCtx.globalAlpha = patternOpacity;

    switch (patternType) {
      case 'dots':
        const dotSize = Math.max(1, Math.floor(patternSize / 8));
        const centerX = patternSize / 2;
        const centerY = patternSize / 2;
        patternCtx.beginPath();
        patternCtx.arc(centerX, centerY, dotSize / 2, 0, 2 * Math.PI);
        patternCtx.fill();
        break;
      
      case 'lines':
        patternCtx.strokeStyle = patternColor;
        patternCtx.lineWidth = 1;
        patternCtx.beginPath();
        patternCtx.moveTo(0, patternSize / 2);
        patternCtx.lineTo(patternSize, patternSize / 2);
        patternCtx.stroke();
        break;
      
      case 'grid':
        patternCtx.strokeStyle = patternColor;
        patternCtx.lineWidth = 1;
        patternCtx.beginPath();
        patternCtx.moveTo(patternSize / 2, 0);
        patternCtx.lineTo(patternSize / 2, patternSize);
        patternCtx.moveTo(0, patternSize / 2);
        patternCtx.lineTo(patternSize, patternSize / 2);
        patternCtx.stroke();
        break;
      
      case 'checkerboard':
        const squareSize = patternSize / 4;
        for (let x = 0; x < patternSize; x += squareSize * 2) {
          for (let y = 0; y < patternSize; y += squareSize * 2) {
            patternCtx.fillRect(x, y, squareSize, squareSize);
            patternCtx.fillRect(x + squareSize, y + squareSize, squareSize, squareSize);
          }
        }
        break;
      
      case 'diagonal':
        patternCtx.strokeStyle = patternColor;
        patternCtx.lineWidth = 1;
        patternCtx.beginPath();
        // Diagonal line from top-left to bottom-right
        patternCtx.moveTo(0, 0);
        patternCtx.lineTo(patternSize, patternSize);
        // Diagonal line from top-right to bottom-left
        patternCtx.moveTo(patternSize, 0);
        patternCtx.lineTo(0, patternSize);
        patternCtx.stroke();
        break;
      
      default:
        // Fallback to dots if pattern type is not recognized
        const defaultDotSize = Math.max(1, Math.floor(patternSize / 8));
        const defaultCenterX = patternSize / 2;
        const defaultCenterY = patternSize / 2;
        patternCtx.beginPath();
        patternCtx.arc(defaultCenterX, defaultCenterY, defaultDotSize / 2, 0, 2 * Math.PI);
        patternCtx.fill();
        break;
    }

    const dataURL = patternCanvas.toDataURL();
    console.log('✅ Pattern generated successfully:', dataURL.substring(0, 50) + '...');
    return dataURL;
  }, [patternSize, patternType, patternColor, patternOpacity, backgroundColor]);

  return (
    <div 
      className="pixel-canvas-container" 
      ref={containerRef}
      onWheel={handleWheel}
      onContextMenu={(e) => { /* Prevent context menu */ }}
    >
      <div className="canvas-wrapper" style={{ 
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        minHeight: '400px'
      }}>
        {/* Pattern background layer - not zoomed, fixed size */}
        <div
          className="pixel-canvas-pattern"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translate(${panOffset.x}px, ${panOffset.y}px)`,
            width: width * zoom,
            height: height * zoom,
            zIndex: 0,
            backgroundImage: `url(${getPatternBackground()})`,
            backgroundRepeat: 'repeat',
            backgroundPosition: '0 0',
            backgroundSize: `${patternSize}px ${patternSize}px`,
            animation: patternAnimationSpeed > 0 ? `pattern-${patternAnimationType} ${patternAnimationSpeed}s ease-in-out infinite` : 'none',
            pointerEvents: 'none'
          }}
        />
        {/* Red Layer (bottom) */}
        <canvas
          ref={canvasRef}
          className="pixel-canvas pixel-canvas-layer"
          data-layer="red"
          width={width}
          height={height}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translate(${panOffset.x}px, ${panOffset.y}px)`,
            width: width * zoom,
            height: height * zoom,
            imageRendering: 'pixelated',
            cursor: currentTool === 'brush' ? 'crosshair' : 'default',
            zIndex: 1
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
        
        {/* Green Layer (middle) */}
        <canvas
          className="pixel-canvas pixel-canvas-layer"
          data-layer="green"
          width={width}
          height={height}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translate(${panOffset.x}px, ${panOffset.y}px)`,
            width: width * zoom,
            height: height * zoom,
            imageRendering: 'pixelated',
            pointerEvents: 'none',
            zIndex: 2
          }}
        />
        
        {/* Blue Layer (top) */}
        <canvas
          className="pixel-canvas pixel-canvas-layer"
          data-layer="blue"
          width={width}
          height={height}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translate(${panOffset.x}px, ${panOffset.y}px)`,
            width: width * zoom,
            height: height * zoom,
            imageRendering: 'pixelated',
            pointerEvents: 'none',
            zIndex: 3
          }}
        />
        
        {/* Hover Layer (topmost) */}
        <canvas
          ref={hoverCanvasRef}
          className="pixel-canvas pixel-canvas-layer"
          width={width}
          height={height}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translate(${panOffset.x}px, ${panOffset.y}px)`,
            width: width * zoom,
            height: height * zoom,
            imageRendering: 'pixelated',
            zIndex: 4,
            pointerEvents: 'none'
          }}
        />
        
        {/* Grid overlay */}
        {showGrid && (
          <div
            className="pixel-canvas-grid"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) translate(${panOffset.x}px, ${panOffset.y}px)`,
              width: width * zoom,
              height: height * zoom,
              zIndex: 5,
              backgroundImage: `
                linear-gradient(to right, ${gridColor} ${gridThickness}px, transparent ${gridThickness}px),
                linear-gradient(to bottom, ${gridColor} ${gridThickness}px, transparent ${gridThickness}px)
              `,
              backgroundSize: `${zoom}px ${zoom}px`,
              pointerEvents: 'none'
            }}
          />
        )}
      </div>
    </div>
  );
};

export default PixelCanvasSimple;
