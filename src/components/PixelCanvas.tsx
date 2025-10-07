"use strict";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Tool, PixelData, Layer, LayerType } from '../App';
import './PixelCanvas.css';

interface PixelCanvasProps {
  width: number;
  height: number;
  currentTool: Tool;
  currentColor: string;
  brushSize: number;
  zoom: number;
  showGrid: boolean;
  onHistoryUpdate: (imageData: ImageData) => void;
  onZoomChange: (zoom: number) => void;
  historyData?: ImageData;
  currentLayer: LayerType;
  layers: Layer[];
}

const PixelCanvas: React.FC<PixelCanvasProps> = ({
  width,
  height,
  currentTool,
  currentColor,
  brushSize,
  zoom,
  showGrid,
  onHistoryUpdate,
  onZoomChange,
  historyData,
  currentLayer,
  layers
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [lastPosition, setLastPosition] = useState<{ x: number; y: number } | null>(null);
  const [startPixelPosition, setStartPixelPosition] = useState<{ x: number; y: number } | null>(null);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const [mouseButton, setMouseButton] = useState<number>(-1);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Save initial state
    const initialData = ctx.getImageData(0, 0, width, height);
    setImageData(initialData);
    onHistoryUpdate(initialData);
  }, [width, height]); // Removed onHistoryUpdate from dependencies

  // Restore from history
  useEffect(() => {
    if (historyData) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.putImageData(historyData, 0, 0);
      setImageData(historyData);
    }
  }, [historyData]);

  const getPixelPosition = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    // Get the actual transformed canvas position
    const canvasRect = canvas.getBoundingClientRect();
    
    // Calculate position relative to the transformed canvas
    const canvasX = event.clientX - canvasRect.left;
    const canvasY = event.clientY - canvasRect.top;
    
    // The canvas is already transformed, so we need to convert back to pixel coordinates
    // The canvas appears larger due to zoom, so we divide by zoom
    const x = Math.floor(canvasX / zoom);
    const y = Math.floor(canvasY / zoom);

    return { x, y };
  }, [zoom]);

  const drawPixel = useCallback((x: number, y: number, color: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  }, []);

  const drawBrush = useCallback((x: number, y: number, color: string, size: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.fillStyle = color;
    
    // For size 1: draw 1 pixel
    // For size 2: draw 2x2 pixels
    // For size 3: draw 3x3 pixels
    const startX = x - Math.floor((size - 1) / 2);
    const startY = y - Math.floor((size - 1) / 2);
    
    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        const px = startX + dx;
        const py = startY + dy;
        
        if (px >= 0 && px < width && py >= 0 && py < height) {
          ctx.fillRect(px, py, 1, 1);
        }
      }
    }
  }, [width, height]);

  const drawHoverPreview = useCallback((x: number, y: number, size: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Use same calculation as drawBrush
    const startX = x - Math.floor((size - 1) / 2);
    const startY = y - Math.floor((size - 1) / 2);
    
    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        const px = startX + dx;
        const py = startY + dy;
        
        if (px >= 0 && px < width && py >= 0 && py < height) {
          // Draw bright yellow highlight with stronger opacity
          ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
          ctx.fillRect(px, py, 1, 1);
          
          // Add a subtle border for better visibility
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.lineWidth = 0.1;
          ctx.strokeRect(px, py, 1, 1);
        }
      }
    }
  }, [width, height]);

  const drawRectanglePreview = useCallback((x: number, y: number, endX?: number, endY?: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    if (endX !== undefined && endY !== undefined) {
      // Draw full rectangle preview while drawing
      const startX = Math.min(x, endX);
      const startY = Math.min(y, endY);
      const width = Math.abs(endX - x) + 1;
      const height = Math.abs(endY - y) + 1;
      
      // Draw filled rectangle with bright color
      ctx.fillStyle = 'rgba(255, 255, 0, 0.4)';
      ctx.fillRect(startX, startY, width, height);
      
      // Add border for better visibility
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
      ctx.lineWidth = 0.1;
      ctx.strokeRect(startX, startY, width, height);
    } else {
      // Draw a single pixel preview for hover (same as other tools)
      ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
      ctx.fillRect(x, y, 1, 1);
      
      // Add border for better visibility
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 0.1;
      ctx.strokeRect(x, y, 1, 1);
    }
  }, []);

  const clearHoverPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Redraw the canvas to remove hover preview
    if (imageData) {
      ctx.putImageData(imageData, 0, 0);
    }
  }, [imageData]);

  const getPixelColor = useCallback((x: number, y: number): string => {
    if (!imageData) return '#000000';
    
    const index = (y * width + x) * 4;
    const r = imageData.data[index];
    const g = imageData.data[index + 1];
    const b = imageData.data[index + 2];
    const a = imageData.data[index + 3];
    
    if (a === 0) return 'transparent';
    
    return `rgb(${r}, ${g}, ${b})`;
  }, [imageData, width]);

  const floodFill = useCallback((startX: number, startY: number, fillColor: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const targetColor = getPixelColor(startX, startY);
    if (targetColor === fillColor) return;

    const stack: { x: number; y: number }[] = [{ x: startX, y: startY }];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      const key = `${x},${y}`;

      if (visited.has(key)) continue;
      if (x < 0 || x >= width || y < 0 || y >= height) continue;

      const currentColor = getPixelColor(x, y);
      if (currentColor !== targetColor) continue;

      visited.add(key);
      drawPixel(x, y, fillColor);

      // Add neighbors
      stack.push({ x: x + 1, y });
      stack.push({ x: x - 1, y });
      stack.push({ x, y: y + 1 });
      stack.push({ x, y: y - 1 });
    }
  }, [width, height, getPixelColor, drawPixel]);

  const drawLine = useCallback((x1: number, y1: number, x2: number, y2: number, color: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1 + 0.5, y1 + 0.5);
    ctx.lineTo(x2 + 0.5, y2 + 0.5);
    ctx.stroke();
  }, []);

  const drawRectangle = useCallback((x1: number, y1: number, x2: number, y2: number, color: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Calculate rectangle bounds (same logic as preview)
    const startX = Math.min(x1, x2);
    const startY = Math.min(y1, y2);
    const width = Math.abs(x2 - x1) + 1;
    const height = Math.abs(y2 - y1) + 1;

    // Draw filled rectangle
    ctx.fillStyle = color;
    ctx.fillRect(startX, startY, width, height);
  }, []);

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const data = ctx.getImageData(0, 0, width, height);
    setImageData(data);
    onHistoryUpdate(data);
  }, [width, height]);

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    setIsMouseDown(true);
    setMouseButton(event.button);
    
    // Clear hover preview
    clearHoverPreview();
    
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    setLastPosition({ x: mouseX, y: mouseY });

    // Handle right-click for panning (works everywhere)
    if (event.button === 2) {
      setIsPanning(true);
      return;
    }

    // Handle left-click for drawing (only on canvas)
    if (event.button === 0) {
      const pos = getPixelPosition(event);
      if (pos) {
        setIsDrawing(true);
        const { x, y } = pos;

        switch (currentTool) {
          case 'brush':
            drawBrush(x, y, currentColor, brushSize);
            break;
          case 'eraser':
            drawBrush(x, y, '#ffffff', brushSize);
            break;
          case 'eyedropper':
            const color = getPixelColor(x, y);
            // This would need to be passed up to parent to update currentColor
            break;
          case 'fill':
            floodFill(x, y, currentColor);
            break;
          case 'rectangle':
            // Rectangle will be drawn on mouse up - save start position
            setStartPixelPosition({ x, y });
            break;
          case 'line':
            // Line will be drawn on mouse up - save start position
            setStartPixelPosition({ x, y });
            break;
        }

        // Only save state for tools that draw immediately
        if (currentTool !== 'rectangle' && currentTool !== 'line') {
          saveState();
        }
      }
    }
  }, [getPixelPosition, currentTool, currentColor, brushSize, drawBrush, getPixelColor, floodFill, saveState, clearHoverPreview]);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (!isMouseDown || !lastPosition) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;
    
    const deltaX = currentX - lastPosition.x;
    const deltaY = currentY - lastPosition.y;

    // Handle panning (right-click) - works everywhere
    if (mouseButton === 2 && isPanning) {
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
    }
    // Handle drawing (left-click) - only on canvas
    else if (mouseButton === 0 && isDrawing) {
      const pos = getPixelPosition(event);
      if (pos) {
        const { x, y } = pos;

        switch (currentTool) {
          case 'brush':
            drawBrush(x, y, currentColor, brushSize);
            break;
          case 'eraser':
            drawBrush(x, y, '#ffffff', brushSize);
            break;
          case 'line':
            // Preview line (would need additional canvas layer)
            break;
          case 'rectangle':
            // Show rectangle preview while drawing
            if (startPixelPosition) {
              // Clear previous preview and show new rectangle
              clearHoverPreview();
              drawRectanglePreview(startPixelPosition.x, startPixelPosition.y, x, y);
            }
            break;
        }
        
        // Update image data for continuous painting (only for tools that draw continuously)
        if (currentTool === 'brush' || currentTool === 'eraser') {
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
              const data = ctx.getImageData(0, 0, width, height);
              setImageData(data);
            }
          }
        }
      }
    }

    setLastPosition({ x: currentX, y: currentY });
  }, [isMouseDown, mouseButton, isPanning, isDrawing, lastPosition, getPixelPosition, currentTool, currentColor, brushSize, drawBrush, width, height, clearHoverPreview, startPixelPosition, drawRectanglePreview]);

  const handleMouseUp = useCallback((event: React.MouseEvent<HTMLElement>) => {
    // Clear hover preview
    clearHoverPreview();
    
    // Handle rectangle and line tools
    if (isDrawing && startPixelPosition) {
      const pos = getPixelPosition(event);
      if (pos) {
        const startX = startPixelPosition.x;
        const startY = startPixelPosition.y;
        const endX = pos.x;
        const endY = pos.y;
        
        switch (currentTool) {
          case 'rectangle':
            drawRectangle(startX, startY, endX, endY, currentColor);
            break;
          case 'line':
            drawLine(startX, startY, endX, endY, currentColor);
            break;
        }
      }
    }
    
    // Save state when finishing drawing
    if (isDrawing) {
      saveState();
    }
    
    setIsMouseDown(false);
    setMouseButton(-1);
    setIsDrawing(false);
    setIsPanning(false);
    setLastPosition(null);
    setStartPixelPosition(null);
  }, [isDrawing, startPixelPosition, getPixelPosition, currentTool, currentColor, drawRectangle, drawLine, saveState, clearHoverPreview]);

  const handleMouseEnter = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const pos = getPixelPosition(event);
    if (pos && pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height) {
      // Show hover preview based on current tool
      switch (currentTool) {
        case 'brush':
        case 'eraser':
          drawHoverPreview(pos.x, pos.y, brushSize);
          break;
        case 'fill':
        case 'eyedropper':
          drawHoverPreview(pos.x, pos.y, 1);
          break;
        case 'rectangle':
          drawRectanglePreview(pos.x, pos.y);
          break;
        case 'line':
          drawHoverPreview(pos.x, pos.y, 1);
          break;
        default:
          drawHoverPreview(pos.x, pos.y, 1);
      }
    }
  }, [getPixelPosition, currentTool, brushSize, drawHoverPreview, drawRectanglePreview, width, height]);

  const handleMouseLeave = useCallback(() => {
    // Clear hover preview
    clearHoverPreview();
    
    // Reset mouse state when leaving canvas
    setIsMouseDown(false);
    setMouseButton(-1);
    setIsDrawing(false);
    setIsPanning(false);
    setLastPosition(null);
    setStartPixelPosition(null);
  }, [clearHoverPreview]);


  // Handle mouse move for container
  const handleMouseMoveWithPreview = useCallback((event: React.MouseEvent<HTMLElement>) => {
    // Handle drawing/panning
    handleMouseMove(event);
    
    // Handle hover preview (only if not drawing/panning)
    if (!isMouseDown) {
      const pos = getPixelPosition(event);
      if (pos && pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height) {
        // Clear previous preview and show new one
        clearHoverPreview();
        
        // Show hover preview based on current tool
        switch (currentTool) {
          case 'brush':
          case 'eraser':
            drawHoverPreview(pos.x, pos.y, brushSize);
            break;
          case 'fill':
          case 'eyedropper':
            drawHoverPreview(pos.x, pos.y, 1);
            break;
          case 'rectangle':
            drawRectanglePreview(pos.x, pos.y);
            break;
          case 'line':
            drawHoverPreview(pos.x, pos.y, 1);
            break;
        }
      } else {
        clearHoverPreview();
      }
    }
  }, [handleMouseMove, isMouseDown, getPixelPosition, currentTool, brushSize, drawHoverPreview, drawRectanglePreview, clearHoverPreview, width, height]);

  const handleWheel = useCallback((event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.5 : 0.5;
    const newZoom = Math.max(0.5, Math.min(30, zoom + delta));
    
    onZoomChange(newZoom);
  }, [zoom, onZoomChange]);

  // Add native wheel event listener to handle preventDefault properly
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleNativeWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      
      const delta = event.deltaY > 0 ? -0.5 : 0.5;
      const newZoom = Math.max(0.5, Math.min(30, zoom + delta));
      
      onZoomChange(newZoom);
    };

    canvas.addEventListener('wheel', handleNativeWheel, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', handleNativeWheel);
    };
  }, [zoom, onZoomChange]);


  return (
    <div 
      className="pixel-canvas-container" 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMoveWithPreview}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="canvas-wrapper" style={{ 
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          position: 'relative',
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: 'center',
          width: width,
          height: height
        }}>
          <canvas
            ref={canvasRef}
            className="pixel-canvas"
            style={{
              width: width,
              height: height,
              imageRendering: 'pixelated' as const,
              border: showGrid ? '1px solid #666' : '1px solid #444',
              display: 'block'
            }}
            onMouseEnter={handleMouseEnter}
            onWheel={handleWheel}
          />
        </div>
      </div>
    </div>
  );
};

export default PixelCanvas;
