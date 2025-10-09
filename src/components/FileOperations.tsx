"use strict";

import React, { useRef, useCallback, useState, useEffect } from 'react';
import ChannelPreviewModal from './ChannelPreviewModal';
import { paletteApi } from '../services/paletteApi';
import { hexToRgb } from '../utils/colorUtils';
import './FileOperations.css';

interface FileOperationsProps {
  canvasSize: number;
  onCanvasSizeChange: (size: number) => void;
  layers: Array<{
    id: number;
    name: string;
    visible: boolean;
    opacity: number;
    palette: Array<{ id: string; name: string; color: string }>;
  }>;
  colorTable: Array<{
    id: string;
    name: string;
    color: string;
    redChannel: number;
    greenChannel: number;
    blueChannel: number;
  }>;
}

const FileOperations: React.FC<FileOperationsProps> = ({
  canvasSize,
  onCanvasSizeChange,
  layers,
  colorTable
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasSizes = [16, 32, 64, 128, 256];
  const [autoSaveInterval, setAutoSaveInterval] = useState<NodeJS.Timeout | null>(null);

  const handleNewCanvas = useCallback(async () => {
    // Silent new canvas creation - no confirmation dialog
    try {
      // Clear server cache
      await paletteApi.clearPixelArtCache();
      console.log('🗑️ Server cache cleared for new canvas - silent');
    } catch (error) {
      console.error('Error clearing server cache:', error);
    }
    
    // Reload page to clear canvas
    // window.location.reload(); // Commented out to prevent page refreshes
  }, []);



  const handleSaveImage = useCallback(async () => {
    try {
      // Get all layer canvases
      const redCanvas = document.querySelector('.pixel-canvas[data-layer="red"]') as HTMLCanvasElement;
      const greenCanvas = document.querySelector('.pixel-canvas[data-layer="green"]') as HTMLCanvasElement;
      const blueCanvas = document.querySelector('.pixel-canvas[data-layer="blue"]') as HTMLCanvasElement;
      
      if (!redCanvas || !greenCanvas || !blueCanvas) {
        console.error('Could not find all layer canvases');
        return;
      }
      
      // Convert to base64 (Painter Value - original colors)
      const redBase64 = redCanvas.toDataURL('image/png').split(',')[1];
      const greenBase64 = greenCanvas.toDataURL('image/png').split(',')[1];
      const blueBase64 = blueCanvas.toDataURL('image/png').split(',')[1];
      
      const layers = {
        red: redBase64,
        green: greenBase64,
        blue: blueBase64
      };
      
      // Save to server (PNG files in images/ folder) - silent save
      const success = await paletteApi.savePixelArtCache(layers, canvasSize);
      
      if (success) {
        console.log('💾 Image saved to server (images/ folder) - silent save (color + channel versions)');
        // Silent save - no dialog
      } else {
        console.error('Failed to save image to server');
        // Silent failure - no dialog
      }
    } catch (error) {
      console.error('Error saving image:', error);
      // Silent error - no dialog
    }
  }, [canvasSize]);


  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleSaveImage();
    }, 30000); // 30 seconds

    setAutoSaveInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []); // Remove handleSaveImage dependency to prevent interval recreation

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
      }
    };
  }, [autoSaveInterval]);

  const handleLoadImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.querySelector('.pixel-canvas') as HTMLCanvasElement;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Calculate scaling to fit image in canvas
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const offsetX = (canvas.width - scaledWidth) / 2;
        const offsetY = (canvas.height - scaledHeight) / 2;

        // Draw image
        ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

        // This would need to be passed up to parent to update history
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleCanvasSizeChange = useCallback((size: number) => {
    onCanvasSizeChange(size);
  }, [onCanvasSizeChange]);

  return (
    <div className="file-operations">
      <div className="canvas-size-control">
        <select
          value={canvasSize}
          onChange={(e) => handleCanvasSizeChange(parseInt(e.target.value))}
          className="canvas-size-select"
          title="Canvas-Größe"
        >
          {canvasSizes.map((size) => (
            <option key={size} value={size}>
              {size}×{size}
            </option>
          ))}
        </select>
      </div>
      
      <div className="file-buttons">
        <button
          className="file-button new"
          onClick={handleNewCanvas}
          title="Neues Bild (Ctrl+N)"
        >
          <span className="material-icons">add</span>
          <span>Neu</span>
        </button>

        <button
          className="file-button save"
          onClick={handleSaveImage}
          title="Bild speichern (Ctrl+S)"
        >
          <span className="material-icons">save</span>
          <span>Speichern</span>
        </button>


        <button
          className="file-button load"
          onClick={handleLoadImage}
          title="Bild laden (Ctrl+O)"
        >
          <span className="material-icons">folder_open</span>
          <span>Laden</span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

    </div>
  );
};

export default FileOperations;
