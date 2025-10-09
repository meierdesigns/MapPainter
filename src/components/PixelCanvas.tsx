"use strict";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Tool, PixelData, Layer, LayerType } from '../App';
import { ColorTableEntry } from './ColorTable';
import { paletteApi } from '../services/paletteApi';
import { hexToRgb } from '../utils/colorUtils';
import './PixelCanvas.css';

interface PixelCanvasProps {
  width: number;
  height: number;
  currentTool: Tool;
  currentColor: string | null;
  brushSize: number;
  zoom: number;
  showGrid: boolean;
  gridColor: string;
  gridThickness: number;
  onHistoryUpdate: (imageData: ImageData) => void;
  onZoomChange: (zoom: number) => void;
  historyData?: ImageData;
  currentLayer: LayerType;
  layers: Layer[];
  colorTable: ColorTableEntry[];
  onExportReady?: (exportFunction: () => HTMLCanvasElement | null) => void;
  onPixelUpdateReady?: (updateFunction: (layerType: LayerType, oldColor: string, newColor: string) => void) => void;
  // Background pattern settings
  patternSize?: number;
  patternOpacity?: number;
  patternAnimationSpeed?: number;
  patternType?: string;
  patternColor?: string;
  backgroundColor?: string;
  patternAnimationType?: string;
}

const PixelCanvas: React.FC<PixelCanvasProps> = ({
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
  onExportReady,
  onPixelUpdateReady,
  patternSize = 24,
  patternOpacity = 0.6,
  patternAnimationSpeed = 30,
  patternType = 'diagonal',
  patternColor = '#000000',
  backgroundColor = '#ffffff',
  patternAnimationType = 'waves'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const redCanvasRef = useRef<HTMLCanvasElement>(null);
  const greenCanvasRef = useRef<HTMLCanvasElement>(null);
  const blueCanvasRef = useRef<HTMLCanvasElement>(null);
  const hoverCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [lastPosition, setLastPosition] = useState<{ x: number; y: number } | null>(null);
  const [startPixelPosition, setStartPixelPosition] = useState<{ x: number; y: number } | null>(null);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const [mouseButton, setMouseButton] = useState<number>(-1);
  const [layerImageData, setLayerImageData] = useState<{
    red: ImageData | null;
    green: ImageData | null;
    blue: ImageData | null;
  }>({
    red: null,
    green: null,
    blue: null
  });
  const [hoveredPixels, setHoveredPixels] = useState<Set<string>>(new Set());
  const [originalPixelColors, setOriginalPixelColors] = useState<Map<string, string>>(new Map());
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);
  const [pixelColorMap, setPixelColorMap] = useState<Map<string, string>>(new Map());
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [mouseMoveTimeout, setMouseMoveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [lastMousePosition, setLastMousePosition] = useState<{ x: number; y: number } | null>(null);
  // Removed complex batch rendering system

  // Get the appropriate canvas ref for the current layer
  const getCurrentLayerCanvas = useCallback(() => {
    switch (currentLayer) {
      case 'red': return redCanvasRef;
      case 'green': return greenCanvasRef;
      case 'blue': return blueCanvasRef;
      default: return redCanvasRef;
    }
  }, [currentLayer]);

  // Convert current color to grayscale channel value based on current layer
  const getChannelValueFromColor = useCallback((color: string): number => {
    // Find the color in the color table
    const colorTableEntry = colorTable.find(entry => entry.color.toLowerCase() === color.toLowerCase());
    if (colorTableEntry) {
      const layerFromId = colorTableEntry.id.split('-')[1] as 'red' | 'green' | 'blue';
      if (layerFromId === currentLayer && colorTableEntry.channelValue !== undefined) {
        return colorTableEntry.channelValue;
      }
    }

    // Fallback: use RGB values from the color
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    switch (currentLayer) {
      case 'red': return r;
      case 'green': return g;
      case 'blue': return b;
      default: return 0;
    }
  }, [colorTable, currentLayer]);

  // Convert channel value to grayscale color
  const getGrayscaleColorFromChannel = useCallback((channelValue: number): string => {
    const clampedValue = Math.max(0, Math.min(255, channelValue));
    const hex = clampedValue.toString(16).padStart(2, '0');
    return `#${hex}${hex}${hex}`;
  }, []);

  // Simple initialize pixelColorMap from existing canvas data
  const initializePixelColorMap = useCallback(() => {
    // Always initialize, even if map is empty
    
    const redCanvas = redCanvasRef.current;
    const greenCanvas = greenCanvasRef.current;
    const blueCanvas = blueCanvasRef.current;
    
    if (!redCanvas || !greenCanvas || !blueCanvas) return;
    
    const redCtx = redCanvas.getContext('2d', { willReadFrequently: true });
    const greenCtx = greenCanvas.getContext('2d', { willReadFrequently: true });
    const blueCtx = blueCanvas.getContext('2d', { willReadFrequently: true });
    
    if (!redCtx || !greenCtx || !blueCtx) return;
    
    const newPixelColorMap = new Map<string, string>();
    
    const layers = [
      { ctx: redCtx, layerType: 'red' as LayerType },
      { ctx: greenCtx, layerType: 'green' as LayerType },
      { ctx: blueCtx, layerType: 'blue' as LayerType }
    ];
    
    layers.forEach(({ ctx, layerType }) => {
      const imageData = ctx.getImageData(0, 0, width, height);
      
      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        const a = imageData.data[i + 3];
        
        if (a === 0) continue;
        
        const x = (i / 4) % width;
        const y = Math.floor((i / 4) / width);
        const pixelKey = `${layerType}-${x}-${y}`;
        
        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        newPixelColorMap.set(pixelKey, hex);
      }
    });
    
    setPixelColorMap(newPixelColorMap);
  }, [width, height, pixelColorMap.size]);

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

  // Convert ImageData to base64 string
  const imageDataToBase64 = useCallback((imageData: ImageData): string => {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return '';
    
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png').split(',')[1]; // Remove data:image/png;base64, prefix
  }, []);

  // Convert base64 string to ImageData
  const base64ToImageData = useCallback((base64: string, width: number, height: number): ImageData | null => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return null;
      
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = `data:image/png;base64,${base64}`;
      
      // Return a placeholder for now, the actual conversion will happen in useEffect
      return ctx.createImageData(width, height);
    } catch (error) {
      console.error('Error converting base64 to ImageData:', error);
      return null;
    }
  }, []);

  // Debounced auto-save pixel art to server
  const autoSavePixelArt = useCallback(async () => {
    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    // Set new timeout for debounced save
    const timeout = setTimeout(async () => {
      if (isAutoSaving) return;
      
      setIsAutoSaving(true);
      try {
        const redCanvas = redCanvasRef.current;
        const greenCanvas = greenCanvasRef.current;
        const blueCanvas = blueCanvasRef.current;
        
        if (!redCanvas || !greenCanvas || !blueCanvas) return;
        
        const redCtx = redCanvas.getContext('2d');
        const greenCtx = greenCanvas.getContext('2d');
        const blueCtx = blueCanvas.getContext('2d');
        
        if (!redCtx || !greenCtx || !blueCtx) return;
        
        // Get image data from each layer
        const redData = redCtx.getImageData(0, 0, width, height);
        const greenData = greenCtx.getImageData(0, 0, width, height);
        const blueData = blueCtx.getImageData(0, 0, width, height);
        
        // Convert to base64 (Painter Value - original colors)
        const redBase64 = imageDataToBase64(redData);
        const greenBase64 = imageDataToBase64(greenData);
        const blueBase64 = imageDataToBase64(blueData);
        
        // Create channel value versions (grayscale)
        const createChannelValueImage = (imageData: ImageData, layerType: LayerType): string => {
          const channelData = new ImageData(width, height);
          
          for (let i = 0; i < imageData.data.length; i += 4) {
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            const a = imageData.data[i + 3];
            
            if (a === 0) {
              // Transparent pixel
              channelData.data[i] = 0;
              channelData.data[i + 1] = 0;
              channelData.data[i + 2] = 0;
              channelData.data[i + 3] = 0;
            } else {
              // Get channel value based on layer type
              let channelValue: number;
              switch (layerType) {
                case 'red':
                  channelValue = r;
                  break;
                case 'green':
                  channelValue = g;
                  break;
                case 'blue':
                  channelValue = b;
                  break;
                default:
                  channelValue = r;
              }
              
              // Convert to grayscale
              channelData.data[i] = channelValue;
              channelData.data[i + 1] = channelValue;
              channelData.data[i + 2] = channelValue;
              channelData.data[i + 3] = a;
            }
          }
          
          return imageDataToBase64(channelData);
        };
        
        const redChannelBase64 = createChannelValueImage(redData, 'red');
        const greenChannelBase64 = createChannelValueImage(greenData, 'green');
        const blueChannelBase64 = createChannelValueImage(blueData, 'blue');
        
        // Create cache object with both versions
        const layers = {
          red: {
            color: redBase64,
            channel: redChannelBase64
          },
          green: {
            color: greenBase64,
            channel: greenChannelBase64
          },
          blue: {
            color: blueBase64,
            channel: blueChannelBase64
          }
        };
        
        // Save to server cache
        await paletteApi.savePixelArtCache(layers, width);
      } catch (error) {
        console.error('Error auto-saving pixel art:', error);
      } finally {
        setIsAutoSaving(false);
      }
    }, 100); // 100ms debounce for faster updates
    
    setAutoSaveTimeout(timeout);
  }, [width, height, imageDataToBase64, isAutoSaving, autoSaveTimeout]);

  // Simple direct pixel drawing - no batching needed
  const drawPixelDirect = useCallback((x: number, y: number, color: string) => {
    // Validate coordinates
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    
    // Validate color
    if (!color || color === 'transparent') return;

    // Get current layer canvas
    const canvas = getCurrentLayerCanvas().current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Draw pixel directly to canvas
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);

    // Update pixel color map
    const colorPixelKey = `${currentLayer}-${x}-${y}`;
    setPixelColorMap(prev => {
      const newMap = new Map(prev);
      newMap.set(colorPixelKey, color);
      return newMap;
    });
  }, [width, height, currentLayer, getCurrentLayerCanvas]);

  // Load pixel art from server cache
  const loadPixelArtFromCache = useCallback(async () => {
    try {
      const cache = await paletteApi.getPixelArtCache();
      if (!cache || !cache.layers) {
        console.log('No cached pixel art found on server');
        return; // No cached data
      }
      
      const redCanvas = redCanvasRef.current;
      const greenCanvas = greenCanvasRef.current;
      const blueCanvas = blueCanvasRef.current;
      
      if (!redCanvas || !greenCanvas || !blueCanvas) return;
      
      const redCtx = redCanvas.getContext('2d');
      const greenCtx = greenCanvas.getContext('2d');
      const blueCtx = blueCanvas.getContext('2d');
      
      if (!redCtx || !greenCtx || !blueCtx) return;
      
      // Load each layer
      const loadLayer = (ctx: CanvasRenderingContext2D, base64: string) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0);
            resolve();
          };
          img.onerror = () => resolve(); // Continue even if image fails to load
          img.src = `data:image/png;base64,${base64}`;
        });
      };
      
      // Check if we have new dual format or legacy format
      const hasNewFormat = cache.layers.red && typeof cache.layers.red === 'object' && cache.layers.red.color;
      
      if (hasNewFormat) {
        // New dual format: load color versions (Painter Value)
        await Promise.all([
          loadLayer(redCtx, cache.layers.red.color),
          loadLayer(greenCtx, cache.layers.green.color),
          loadLayer(blueCtx, cache.layers.blue.color)
        ]);
        console.log('🖼️ Successfully loaded pixel art from server cache (color versions)');
      } else {
        // Legacy format: load single versions
        if (!cache.layers.red || !cache.layers.green || !cache.layers.blue) {
          console.log('No cached pixel art found on server');
          return;
        }
        
        await Promise.all([
          loadLayer(redCtx, cache.layers.red),
          loadLayer(greenCtx, cache.layers.green),
          loadLayer(blueCtx, cache.layers.blue)
        ]);
        console.log('🖼️ Successfully loaded pixel art from server cache (legacy format)');
      }
      
      // Update layer image data
      setLayerImageData({
        red: redCtx.getImageData(0, 0, width, height),
        green: greenCtx.getImageData(0, 0, width, height),
        blue: blueCtx.getImageData(0, 0, width, height)
      });
      
      // Initialize pixelColorMap from loaded data
      setTimeout(() => {
        initializePixelColorMap();
      }, 100);
      
    } catch (error) {
      console.error('Error loading pixel art from cache:', error);
    }
  }, [width, height, initializePixelColorMap]);


  // Export function to convert colorful layers to channel-based image
  const exportToChannels = useCallback(() => {
    const redCanvas = redCanvasRef.current;
    const greenCanvas = greenCanvasRef.current;
    const blueCanvas = blueCanvasRef.current;
    
    if (!redCanvas || !greenCanvas || !blueCanvas) return null;

    const redCtx = redCanvas.getContext('2d', { willReadFrequently: true });
    const greenCtx = greenCanvas.getContext('2d', { willReadFrequently: true });
    const blueCtx = blueCanvas.getContext('2d', { willReadFrequently: true });
    
    if (!redCtx || !greenCtx || !blueCtx) return null;

    // Get image data from each layer
    const redData = redCtx.getImageData(0, 0, width, height);
    const greenData = greenCtx.getImageData(0, 0, width, height);
    const blueData = blueCtx.getImageData(0, 0, width, height);

    // Create output canvas
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = width;
    outputCanvas.height = height;
    const outputCtx = outputCanvas.getContext('2d', { willReadFrequently: true });
    if (!outputCtx) return null;

    // Create output image data
    const outputData = outputCtx.createImageData(width, height);

    // Convert each pixel
    for (let i = 0; i < outputData.data.length; i += 4) {
      const pixelIndex = i / 4;
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);

      // Get color from each layer
      const redPixelIndex = (y * width + x) * 4;
      const redR = redData.data[redPixelIndex];
      const redG = redData.data[redPixelIndex + 1];
      const redB = redData.data[redPixelIndex + 2];
      const redA = redData.data[redPixelIndex + 3];

      const greenR = greenData.data[redPixelIndex];
      const greenG = greenData.data[redPixelIndex + 1];
      const greenB = greenData.data[redPixelIndex + 2];
      const greenA = greenData.data[redPixelIndex + 3];

      const blueR = blueData.data[redPixelIndex];
      const blueG = blueData.data[redPixelIndex + 1];
      const blueB = blueData.data[redPixelIndex + 2];
      const blueA = blueData.data[redPixelIndex + 3];

      // Convert colors to channel values using color table
      let redChannel = 0;
      let greenChannel = 0;
      let blueChannel = 0;

      // Find matching color in color table and get channel values
      if (redA > 0) {
        const redColor = `rgb(${redR}, ${redG}, ${redB})`;
        const colorEntry = colorTable.find(entry => entry.color.toLowerCase() === redColor.toLowerCase());
        if (colorEntry) {
          redChannel = colorEntry.redChannel;
        }
      }

      if (greenA > 0) {
        const greenColor = `rgb(${greenR}, ${greenG}, ${greenB})`;
        const colorEntry = colorTable.find(entry => entry.color.toLowerCase() === greenColor.toLowerCase());
        if (colorEntry) {
          greenChannel = colorEntry.greenChannel;
        }
      }

      if (blueA > 0) {
        const blueColor = `rgb(${blueR}, ${blueG}, ${blueB})`;
        const colorEntry = colorTable.find(entry => entry.color.toLowerCase() === blueColor.toLowerCase());
        if (colorEntry) {
          blueChannel = colorEntry.blueChannel;
        }
      }

      // Set output pixel
      outputData.data[i] = redChannel;     // R
      outputData.data[i + 1] = greenChannel; // G
      outputData.data[i + 2] = blueChannel;  // B
      outputData.data[i + 3] = 255;          // A
    }

    // Draw output data to canvas
    outputCtx.putImageData(outputData, 0, 0);
    return outputCanvas;
  }, [width, height, colorTable]);

  // Initialize layer canvases
  const initializeLayerCanvas = useCallback((canvasRef: React.RefObject<HTMLCanvasElement>, layerType: 'red' | 'green' | 'blue') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas (transparent background)
    ctx.clearRect(0, 0, width, height);

    // Create completely transparent image data
    const transparentData = ctx.createImageData(width, height);
    // All pixels are already transparent (alpha = 0) by default
    
    setLayerImageData(prev => ({
      ...prev,
      [layerType]: transparentData
    }));
  }, [width, height]);

  // Initialize all layer canvases and load cached data (only once)
  useEffect(() => {
    let hasLoaded = false;
    
    const initializeAndLoad = () => {
      if (hasLoaded) return;
      hasLoaded = true;
      
      initializeLayerCanvas(redCanvasRef, 'red');
      initializeLayerCanvas(greenCanvasRef, 'green');
      initializeLayerCanvas(blueCanvasRef, 'blue');
      
      // Initialize hover canvas
      const hoverCanvas = hoverCanvasRef.current;
      if (hoverCanvas) {
        const ctx = hoverCanvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          hoverCanvas.width = width;
          hoverCanvas.height = height;
          ctx.clearRect(0, 0, width, height);
        }
      }
      
      // Load cached pixel art after a short delay to ensure canvases are initialized
      setTimeout(() => {
        loadPixelArtFromCache();
      }, 500); // Increased delay to ensure canvases are fully initialized
    };
    
    initializeAndLoad();
  }, [initializeLayerCanvas, width, height, loadPixelArtFromCache]);

  // Remove hover effect from pixels
  const removeHoverEffect = useCallback(() => {
    const hoverCanvas = hoverCanvasRef.current;
    if (!hoverCanvas) return;

    const ctx = hoverCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Clear the entire hover canvas
    ctx.clearRect(0, 0, width, height);
    
    // Clear hover state
    setHoveredPixels(new Set());
    setOriginalPixelColors(new Map());
  }, [width, height]);

  // Clear hover effects when layer changes
  useEffect(() => {
    removeHoverEffect();
  }, [currentLayer]); // Remove removeHoverEffect dependency

  // Use utility function for hex to RGB conversion

  // Update all pixels with a specific color in a specific layer
  const updatePixelsWithColor = useCallback((layerType: LayerType, oldColor: string, newColor: string) => {
    const canvasRef = layerType === 'red' ? redCanvasRef : layerType === 'green' ? greenCanvasRef : blueCanvasRef;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Get current image data
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Convert old color to RGB for comparison
    const oldRgb = hexToRgb(oldColor);
    const newRgb = hexToRgb(newColor);

    // Update all pixels with the old color
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // Check if pixel matches the old color and is not transparent
      if (a > 0 && r === oldRgb.r && g === oldRgb.g && b === oldRgb.b) {
        // Update pixel with new color
        data[i] = newRgb.r;
        data[i + 1] = newRgb.g;
        data[i + 2] = newRgb.b;
        // Keep alpha channel unchanged
      }
    }

    // Put the modified image data back to canvas
    ctx.putImageData(imageData, 0, 0);

    // Update layer image data
    setLayerImageData(prev => ({
      ...prev,
      [layerType]: imageData
    }));
  }, [width, height, hexToRgb]);

  // Provide export function to parent
  useEffect(() => {
    if (onExportReady) {
      onExportReady(exportToChannels);
    }
  }, [onExportReady]); // Remove exportToChannels dependency

  // Provide pixel update function to parent
  useEffect(() => {
    if (onPixelUpdateReady) {
      onPixelUpdateReady(updatePixelsWithColor);
    }
  }, [onPixelUpdateReady]); // Remove updatePixelsWithColor dependency

  // Initialize main canvas (for history and grid)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas (transparent background)
    ctx.clearRect(0, 0, width, height);

    // Grid is now drawn as CSS layer, not on canvas

    // Save initial state
    const initialData = ctx.getImageData(0, 0, width, height);
    setImageData(initialData);
    onHistoryUpdate(initialData);
  }, [width, height, showGrid, onHistoryUpdate]);

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
    if (!canvas) {
      console.warn('Canvas not available for pixel position calculation');
      return null;
    }

    // Get the actual transformed canvas position
    const canvasRect = canvas.getBoundingClientRect();
    
    // Calculate position relative to the transformed canvas
    const canvasX = event.clientX - canvasRect.left;
    const canvasY = event.clientY - canvasRect.top;
    
    // The canvas is already transformed, so we need to convert back to pixel coordinates
    // The canvas appears larger due to zoom, so we divide by zoom
    const x = Math.floor(canvasX / zoom);
    const y = Math.floor(canvasY / zoom);

    // Validate coordinates (allow small negative values for edge cases)
    if (x < -1 || x >= width || y < -1 || y >= height) {
      // Only warn for significant out-of-bounds
      if (x < -5 || x >= width + 5 || y < -5 || y >= height + 5) {
        console.warn(`Pixel position significantly out of bounds: (${x}, ${y})`);
      }
      return null;
    }

    return { x, y };
  }, [zoom, width, height]);

  const drawPixel = useCallback((x: number, y: number, color: string) => {
    // Draw pixel directly
    drawPixelDirect(x, y, color);
    
    // Auto-save after drawing (debounced)
    autoSavePixelArt();
  }, [drawPixelDirect, autoSavePixelArt]);

  const drawBrush = useCallback((x: number, y: number, color: string, size: number) => {
    // Validate color
    if (!color || color === 'transparent') {
      console.warn('Invalid color for brush drawing:', color);
      return;
    }

    // Validate brush size
    if (size < 1 || size > 10) {
      console.warn('Invalid brush size:', size);
      return;
    }

    // For size 1: draw 1 pixel
    // For size 2: draw 2x2 pixels
    // For size 3: draw 3x3 pixels
    const startX = x - Math.floor((size - 1) / 2);
    const startY = y - Math.floor((size - 1) / 2);
    
    const newPendingPixels = new Map<string, { x: number; y: number; color: string }>();
    
    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        const px = startX + dx;
        const py = startY + dy;
        
        if (px >= 0 && px < width && py >= 0 && py < height) {
          // Remove hover effect from this pixel if it exists
          const hoverPixelKey = `${px},${py}`;
          setHoveredPixels(prev => {
            if (prev.has(hoverPixelKey)) {
              setOriginalPixelColors(prevColors => {
                const newMap = new Map(prevColors);
                newMap.delete(hoverPixelKey);
                return newMap;
              });
              const newSet = new Set(prev);
              newSet.delete(hoverPixelKey);
              return newSet;
            }
            return prev;
          });
          
          // Store the original color for this pixel
          const colorPixelKey = `${currentLayer}-${px}-${py}`;
          setPixelColorMap(prev => {
            const newMap = new Map(prev);
            newMap.set(colorPixelKey, color);
            return newMap;
          });
          
          // Add to pending batch render
          const pixelKey = `${px},${py}`;
          newPendingPixels.set(pixelKey, { x: px, y: py, color });
        }
      }
    }

    // Add all pixels to pending batch render
    setPendingPixels(prev => {
      const combined = new Map(prev);
      newPendingPixels.forEach((pixel, key) => {
        combined.set(key, pixel);
      });
      return combined;
    });

    // Schedule batch render
    scheduleBatchRender();

    // Auto-save after drawing (debounced)
    autoSavePixelArt();
  }, [width, height, currentLayer, autoSavePixelArt, scheduleBatchRender]);

  const erasePixel = useCallback((x: number, y: number, size: number) => {
    // Validate brush size
    if (size < 1 || size > 10) {
      console.warn('Invalid eraser size:', size);
      return;
    }

    const canvas = getCurrentLayerCanvas().current;
    if (!canvas) {
      console.error('Canvas not available for erasing');
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      console.error('Canvas context not available for erasing');
      return;
    }

    // Get current image data
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // For size 1: erase 1 pixel
    // For size 2: erase 2x2 pixels
    // For size 3: erase 3x3 pixels
    const startX = x - Math.floor((size - 1) / 2);
    const startY = y - Math.floor((size - 1) / 2);
    
    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        const px = startX + dx;
        const py = startY + dy;
        
        if (px >= 0 && px < width && py >= 0 && py < height) {
          // Remove hover effect from this pixel if it exists
          const hoverPixelKey = `${px},${py}`;
          setHoveredPixels(prev => {
            if (prev.has(hoverPixelKey)) {
              setOriginalPixelColors(prevColors => {
                const newMap = new Map(prevColors);
                newMap.delete(hoverPixelKey);
                return newMap;
              });
              const newSet = new Set(prev);
              newSet.delete(hoverPixelKey);
              return newSet;
            }
            return prev;
          });
          
          // Remove the pixel from pixelColorMap when erasing
          const colorPixelKey = `${currentLayer}-${px}-${py}`;
          setPixelColorMap(prev => {
            const newMap = new Map(prev);
            newMap.delete(colorPixelKey);
            return newMap;
          });
          
          // Calculate pixel index in image data
          const pixelIndex = (py * width + px) * 4;
          
          // Set alpha channel to 0 (transparent)
          data[pixelIndex + 3] = 0;
        }
      }
    }

    // Put the modified image data back to canvas
    ctx.putImageData(imageData, 0, 0);

    // Auto-save after erasing (debounced)
    autoSavePixelArt();
  }, [width, height, getCurrentLayerCanvas, currentLayer, autoSavePixelArt, setPixelColorMap]);

  // Get pixel color from current layer
  const getPixelColorFromLayer = useCallback((x: number, y: number): string => {
    const canvas = getCurrentLayerCanvas().current;
    if (!canvas) return 'transparent';

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return 'transparent';

    const imageData = ctx.getImageData(x, y, 1, 1);
    const data = imageData.data;
    
    if (data[3] === 0) return 'transparent';
    
    return `rgb(${data[0]}, ${data[1]}, ${data[2]})`;
  }, [getCurrentLayerCanvas]);

  // Get combined pixel color from all visible layers
  const getCombinedPixelColor = useCallback((x: number, y: number): string => {
    // Check if any layer has content at this pixel
    let hasContent = false;
    
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      if (!layer.visible) continue;

      const layerCanvas = i === 0 ? redCanvasRef.current : 
                         i === 1 ? greenCanvasRef.current : 
                         blueCanvasRef.current;
      
      if (!layerCanvas) continue;

      const layerCtx = layerCanvas.getContext('2d', { willReadFrequently: true });
      if (!layerCtx) continue;

      const layerImageData = layerCtx.getImageData(x, y, 1, 1);
      const layerData = layerImageData.data;
      
      if (layerData[3] > 0) {
        hasContent = true;
        break;
      }
    }
    
    // If no layer has content, return transparent (so gradient shows through)
    if (!hasContent) {
      return 'transparent';
    }

    // Create a temporary canvas to composite all layers
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 1;
    tempCanvas.height = 1;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!tempCtx) return 'transparent';

    // Start with transparent background
    tempCtx.clearRect(0, 0, 1, 1);

    // Composite all visible layers
    layers.forEach((layer, index) => {
      if (!layer.visible) return;

      const layerCanvas = index === 0 ? redCanvasRef.current : 
                         index === 1 ? greenCanvasRef.current : 
                         blueCanvasRef.current;
      
      if (!layerCanvas) return;

      const layerCtx = layerCanvas.getContext('2d', { willReadFrequently: true });
      if (!layerCtx) return;

      const layerImageData = layerCtx.getImageData(x, y, 1, 1);
      const layerData = layerImageData.data;
      
      if (layerData[3] > 0) {
        // Apply layer opacity
        const opacity = (layer.opacity || 1) * (layerData[3] / 255);
        
        // Composite the layer
        tempCtx.globalAlpha = opacity;
        tempCtx.fillStyle = `rgb(${layerData[0]}, ${layerData[1]}, ${layerData[2]})`;
        tempCtx.fillRect(0, 0, 1, 1);
        tempCtx.globalAlpha = 1;
      }
    });

    // Get the final color
    const finalImageData = tempCtx.getImageData(0, 0, 1, 1);
    const finalData = finalImageData.data;
    
    // If the final result is transparent, return transparent
    if (finalData[3] === 0) {
      return 'transparent';
    }
    
    return `rgb(${finalData[0]}, ${finalData[1]}, ${finalData[2]})`;
  }, [layers]);

  // Apply hover effect to pixels
  const applyHoverEffect = useCallback((x: number, y: number, size: number) => {
    const canvas = getCurrentLayerCanvas().current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

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
          
          // Apply hover color (current color)
          const hoverColor = currentColor;
          ctx.fillStyle = hoverColor;
          ctx.fillRect(px, py, 1, 1);
          
          newHoveredPixels.add(pixelKey);
        }
      }
    }
    
    // Update state using functional updates
    setHoveredPixels(prev => new Set([...prev, ...newHoveredPixels]));
    setOriginalPixelColors(prev => new Map([...prev, ...newOriginalColors]));
  }, [getCurrentLayerCanvas, width, height, currentColor, getPixelColorFromLayer]);

  const showHoverEffect = useCallback((x: number, y: number, size: number) => {
    // Apply hover effect on hover canvas
    const hoverCanvas = hoverCanvasRef.current;
    if (!hoverCanvas) return;

    const ctx = hoverCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const startX = x - Math.floor((size - 1) / 2);
    const startY = y - Math.floor((size - 1) / 2);
    const newHoveredPixels = new Set<string>();
    
    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        const px = startX + dx;
        const py = startY + dy;
        
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const pixelKey = `${px},${py}`;
          
          // Apply hover color on hover canvas (semi-transparent)
          const hoverColor = currentColor;
          ctx.fillStyle = hoverColor;
          ctx.globalAlpha = 0.7; // Semi-transparent hover effect
          ctx.fillRect(px, py, 1, 1);
          ctx.globalAlpha = 1.0;
          
          newHoveredPixels.add(pixelKey);
        }
      }
    }
    
    // Update state
    setHoveredPixels(prev => new Set([...prev, ...newHoveredPixels]));
  }, [width, height, currentColor]);

  const drawHoverPreview = useCallback((x: number, y: number, size: number) => {
    // Remove any existing hover effects first
    removeHoverEffect();
    
    // Apply new hover effect
    showHoverEffect(x, y, size);
  }, [removeHoverEffect, showHoverEffect]);

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
    // Remove hover effects from pixels
    removeHoverEffect();
  }, [removeHoverEffect]);

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
    const canvas = getCurrentLayerCanvas().current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Use the original color directly (no conversion to grayscale)
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1 + 0.5, y1 + 0.5);
    ctx.lineTo(x2 + 0.5, y2 + 0.5);
    ctx.stroke();

    // Auto-save after drawing line (debounced)
    autoSavePixelArt();
  }, [getCurrentLayerCanvas, width, height, currentLayer, autoSavePixelArt]);

  const drawRectangle = useCallback((x1: number, y1: number, x2: number, y2: number, color: string) => {
    const canvas = getCurrentLayerCanvas().current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Use the original color directly (no conversion to grayscale)
    const startX = Math.min(x1, x2);
    const startY = Math.min(y1, y2);
    const width = Math.abs(x2 - x1) + 1;
    const height = Math.abs(y2 - y1) + 1;

    // Draw filled rectangle
    ctx.fillStyle = color;
    ctx.fillRect(startX, startY, width, height);

    // Auto-save after drawing rectangle (debounced)
    autoSavePixelArt();
  }, [getCurrentLayerCanvas, currentLayer, autoSavePixelArt]);

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
            if (currentColor) {
              drawBrush(x, y, currentColor, brushSize);
            } else {
              console.warn('No color selected for brush tool');
            }
            break;
          case 'eraser':
            erasePixel(x, y, brushSize);
            break;
          case 'eyedropper':
            const color = getPixelColor(x, y);
            // This would need to be passed up to parent to update currentColor
            break;
          case 'fill':
            if (currentColor) {
              floodFill(x, y, currentColor);
            } else {
              console.warn('No color selected for fill tool');
            }
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
  }, [getPixelPosition, currentTool, currentColor, brushSize, drawBrush, erasePixel, getPixelColor, floodFill, saveState, clearHoverPreview]);

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
            if (currentColor) {
              drawBrush(x, y, currentColor, brushSize);
            } else {
              console.warn('No color selected for brush tool (mouse move)');
            }
            break;
          case 'eraser':
            erasePixel(x, y, brushSize);
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
        
        // Remove unnecessary image data updates to prevent flickering
      }
    }

    setLastPosition({ x: currentX, y: currentY });
  }, [isMouseDown, mouseButton, isPanning, isDrawing, lastPosition, getPixelPosition, currentTool, currentColor, brushSize, drawBrush, erasePixel, width, height, clearHoverPreview, startPixelPosition, drawRectanglePreview]);

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
            if (currentColor) {
              drawRectangle(startX, startY, endX, endY, currentColor);
            } else {
              console.warn('No color selected for rectangle tool');
            }
            break;
          case 'line':
            if (currentColor) {
              drawLine(startX, startY, endX, endY, currentColor);
            } else {
              console.warn('No color selected for line tool');
            }
            break;
        }
      }
    }
    
    // Save state when finishing drawing
    if (isDrawing) {
      saveState();
    }
    
    // Auto-save to server cache and PNG files after mouse up (for all tools)
    if (isDrawing || isMouseDown) {
      autoSavePixelArt();
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
          showHoverEffect(pos.x, pos.y, brushSize);
          break;
        case 'fill':
        case 'eyedropper':
          showHoverEffect(pos.x, pos.y, 1);
          break;
        case 'rectangle':
          drawRectanglePreview(pos.x, pos.y);
          break;
        case 'line':
          showHoverEffect(pos.x, pos.y, 1);
          break;
        default:
          showHoverEffect(pos.x, pos.y, 1);
      }
    }
  }, [getPixelPosition, currentTool, brushSize, showHoverEffect, drawRectanglePreview, width, height]);

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


  // Throttled mouse move handler for better performance
  const handleMouseMoveWithPreview = useCallback((event: React.MouseEvent<HTMLElement>) => {
    // Clear existing timeout
    if (mouseMoveTimeout) {
      clearTimeout(mouseMoveTimeout);
    }
    
    // Throttle mouse move events to 16ms (60fps)
    const timeout = setTimeout(() => {
      // Handle drawing/panning
      handleMouseMove(event);
      
      // Handle hover preview (only if not drawing/panning)
      if (!isMouseDown) {
        const pos = getPixelPosition(event);
        if (pos && pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height) {
          // Skip if position hasn't changed significantly
          if (lastMousePosition && 
              Math.abs(pos.x - lastMousePosition.x) < 1 && 
              Math.abs(pos.y - lastMousePosition.y) < 1) {
            return;
          }
          
          setLastMousePosition(pos);
          
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
    }, 16); // 60fps throttling
    
    setMouseMoveTimeout(timeout);
  }, [handleMouseMove, isMouseDown, getPixelPosition, currentTool, brushSize, drawHoverPreview, drawRectanglePreview, clearHoverPreview, width, height, mouseMoveTimeout, lastMousePosition]);

  const handleWheel = useCallback((event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.5 : 0.5;
    const newZoom = Math.max(0.5, Math.min(32, zoom + delta));
    
    onZoomChange(newZoom);
  }, [zoom, onZoomChange]);

  // Add native wheel event listener to handle preventDefault properly
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleNativeWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      
      const delta = event.deltaY > 0 ? -0.5 : 0.5;
      const newZoom = Math.max(0.5, Math.min(32, zoom + delta));
      
      onZoomChange(newZoom);
    };

    container.addEventListener('wheel', handleNativeWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleNativeWheel);
    };
  }, [zoom, onZoomChange]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
      if (mouseMoveTimeout) {
        clearTimeout(mouseMoveTimeout);
      }
      if (renderTimeout) {
        clearTimeout(renderTimeout);
      }
    };
  }, [autoSaveTimeout, mouseMoveTimeout, renderTimeout]);

  return (
    <div 
      className="pixel-canvas-container" 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMoveWithPreview}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="canvas-wrapper" style={{ 
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {/* Grid layer - not zoomed, always 1px on screen */}
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
              zIndex: 1,
               backgroundImage: `
                 linear-gradient(to right, ${gridColor} ${gridThickness}px, transparent ${gridThickness}px),
                 linear-gradient(to bottom, ${gridColor} ${gridThickness}px, transparent ${gridThickness}px)
               `,
              backgroundSize: `${zoom}px ${zoom}px`,
              pointerEvents: 'none'
            }}
          />
        )}

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
            backgroundImage: (() => {
              // Convert hex colors to RGB
              const patternHex = patternColor.replace('#', '');
              const patternR = parseInt(patternHex.substr(0, 2), 16);
              const patternG = parseInt(patternHex.substr(2, 2), 16);
              const patternB = parseInt(patternHex.substr(4, 2), 16);
              const patternRgba = `rgba(${patternR},${patternG},${patternB},${patternOpacity})`;
              
              const bgHex = backgroundColor.replace('#', '');
              const bgR = parseInt(bgHex.substr(0, 2), 16);
              const bgG = parseInt(bgHex.substr(2, 2), 16);
              const bgB = parseInt(bgHex.substr(4, 2), 16);
              const bgRgba = `rgba(${bgR},${bgG},${bgB},1)`;
              
              switch (patternType) {
                case 'dots':
                  return `radial-gradient(circle at ${patternSize / 8}px ${patternSize / 8}px, ${patternRgba} ${patternSize / 16}px, ${bgRgba} ${patternSize / 16}px)`;
                case 'diamonds':
                  return `
                    linear-gradient(45deg, ${patternRgba} 25%, ${bgRgba} 25%),
                    linear-gradient(-45deg, ${patternRgba} 25%, ${bgRgba} 25%),
                    linear-gradient(45deg, ${bgRgba} 75%, ${patternRgba} 75%),
                    linear-gradient(-45deg, ${bgRgba} 75%, ${patternRgba} 75%)
                  `;
                case 'squares':
                  return `
                    linear-gradient(0deg, ${patternRgba} 25%, ${bgRgba} 25%),
                    linear-gradient(90deg, ${patternRgba} 25%, ${bgRgba} 25%)
                  `;
                case 'circles':
                  return `radial-gradient(circle at center, ${patternRgba} ${patternSize / 8}px, ${bgRgba} ${patternSize / 8}px)`;
                case 'crosses':
                  return `
                    linear-gradient(0deg, ${patternRgba} 1px, ${bgRgba} 1px),
                    linear-gradient(90deg, ${patternRgba} 1px, ${bgRgba} 1px)
                  `;
                case 'diagonal':
                default:
                  return `repeating-linear-gradient(45deg, ${bgRgba}, ${bgRgba} ${patternSize / 4}px, ${patternRgba} ${patternSize / 4}px, ${patternRgba} ${patternSize / 2}px)`;
              }
            })(),
            backgroundSize: `${patternSize}px ${patternSize}px`,
            backgroundPosition: '0 0',
            animation: patternAnimationSpeed > 0 ? `pattern-${patternAnimationType} ${patternAnimationSpeed}s ease-in-out infinite` : 'none',
            pointerEvents: 'none'
          }}
        />
        
        <div style={{
          position: 'relative',
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: 'center',
          width: width,
          height: height
        }}>
          {/* Gradient background layer - removed, now using separate pattern layer */}
          
          {/* Background canvas (white) */}
          <canvas
            ref={canvasRef}
            className="pixel-canvas pixel-canvas-background"
            width={width}
            height={height}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: width,
              height: height,
              imageRendering: 'pixelated' as const,
              border: 'none',
              display: 'block',
              zIndex: 1
            }}
            onMouseEnter={handleMouseEnter}
          />
          
          {/* Red Layer (bottom) */}
          <canvas
            ref={redCanvasRef}
            className="pixel-canvas pixel-canvas-layer"
            data-layer="red"
            width={width}
            height={height}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: width,
              height: height,
              imageRendering: 'pixelated' as const,
              display: layers[0]?.visible ? 'block' : 'none',
              opacity: layers[0]?.opacity || 1,
              zIndex: 2
            }}
          />
          
          {/* Green Layer (middle) */}
          <canvas
            ref={greenCanvasRef}
            className="pixel-canvas pixel-canvas-layer"
            data-layer="green"
            width={width}
            height={height}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: width,
              height: height,
              imageRendering: 'pixelated' as const,
              display: layers[1]?.visible ? 'block' : 'none',
              opacity: layers[1]?.opacity || 1,
              zIndex: 3
            }}
          />
          
          {/* Blue Layer (top) */}
          <canvas
            ref={blueCanvasRef}
            className="pixel-canvas pixel-canvas-layer"
            data-layer="blue"
            width={width}
            height={height}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: width,
              height: height,
              imageRendering: 'pixelated' as const,
              display: layers[2]?.visible ? 'block' : 'none',
              opacity: layers[2]?.opacity || 1,
              zIndex: 4
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
              top: 0,
              left: 0,
              width: width,
              height: height,
              imageRendering: 'pixelated' as const,
              display: 'block',
              opacity: 1,
              zIndex: 5,
              pointerEvents: 'none'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PixelCanvas;
