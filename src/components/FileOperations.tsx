"use strict";

import React, { useRef, useCallback, useState } from 'react';
import ChannelPreviewModal from './ChannelPreviewModal';
import { paletteApi } from '../services/paletteApi';
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
  const [showChannelPreview, setShowChannelPreview] = useState(false);

  const handleNewCanvas = useCallback(async () => {
    if (window.confirm('Möchten Sie ein neues Bild erstellen? Alle ungespeicherten Änderungen gehen verloren.')) {
      try {
        // Clear server cache
        await paletteApi.clearPixelArtCache();
        console.log('🗑️ Server cache cleared for new canvas');
      } catch (error) {
        console.error('Error clearing server cache:', error);
      }
      
      // This would need to be passed up to parent to clear canvas
      window.location.reload();
    }
  }, []);

  // Helper function to convert hex color to RGB
  const hexToRgb = useCallback((hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }, []);

  // Helper function to get channel value for a color
  const getChannelValue = useCallback((color: string, channel: 'red' | 'green' | 'blue'): number => {
    const colorEntry = colorTable.find(entry => entry.color.toLowerCase() === color.toLowerCase());
    if (colorEntry) {
      // Check if this entry belongs to the requested channel
      const layerFromId = colorEntry.id.split('-')[1] as 'red' | 'green' | 'blue';
      if (layerFromId === channel && colorEntry.channelValue !== undefined) {
        // Use the specific channelValue for this layer
        return colorEntry.channelValue;
      }
      
      // Fallback to individual channel values if channelValue is not available
      switch (channel) {
        case 'red': return colorEntry.redChannel;
        case 'green': return colorEntry.greenChannel;
        case 'blue': return colorEntry.blueChannel;
      }
    }
    
    // Fallback: use actual RGB values from the color
    const rgb = hexToRgb(color);
    switch (channel) {
      case 'red': return rgb.r;
      case 'green': return rgb.g;
      case 'blue': return rgb.b;
    }
    return 0;
  }, [colorTable, hexToRgb]);

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
      
      // Convert to base64
      const redBase64 = redCanvas.toDataURL('image/png').split(',')[1];
      const greenBase64 = greenCanvas.toDataURL('image/png').split(',')[1];
      const blueBase64 = blueCanvas.toDataURL('image/png').split(',')[1];
      
      const layers = {
        red: redBase64,
        green: greenBase64,
        blue: blueBase64
      };
      
      // Save to server (PNG files in images/ folder)
      const success = await paletteApi.savePixelArtCache(layers, canvasSize);
      
      if (success) {
        console.log('💾 Image saved to server (images/ folder)');
        alert('Bild erfolgreich gespeichert!');
      } else {
        console.error('Failed to save image to server');
        alert('Fehler beim Speichern des Bildes!');
      }
    } catch (error) {
      console.error('Error saving image:', error);
      alert('Fehler beim Speichern des Bildes!');
    }
  }, [canvasSize]);

  const handleSaveChannelImage = useCallback(async () => {
    // Get all canvas elements for each layer
    const redCanvas = document.querySelector('.pixel-canvas[data-layer="red"]') as HTMLCanvasElement;
    const greenCanvas = document.querySelector('.pixel-canvas[data-layer="green"]') as HTMLCanvasElement;
    const blueCanvas = document.querySelector('.pixel-canvas[data-layer="blue"]') as HTMLCanvasElement;
    
    if (!redCanvas || !greenCanvas || !blueCanvas) {
      console.error('Could not find all layer canvases');
      return;
    }

    // Create a new canvas for the combined image
    const combinedCanvas = document.createElement('canvas');
    combinedCanvas.width = canvasSize;
    combinedCanvas.height = canvasSize;
    const combinedCtx = combinedCanvas.getContext('2d');
    
    if (!combinedCtx) {
      console.error('Could not get 2D context for combined canvas');
      return;
    }

    // Initialize with black background
    combinedCtx.fillStyle = '#000000';
    combinedCtx.fillRect(0, 0, canvasSize, canvasSize);

    // Get image data from each layer
    const redCtx = redCanvas.getContext('2d');
    const greenCtx = greenCanvas.getContext('2d');
    const blueCtx = blueCanvas.getContext('2d');
    
    if (!redCtx || !greenCtx || !blueCtx) {
      console.error('Could not get 2D contexts for layer canvases');
      return;
    }

    const redImageData = redCtx.getImageData(0, 0, canvasSize, canvasSize);
    const greenImageData = greenCtx.getImageData(0, 0, canvasSize, canvasSize);
    const blueImageData = blueCtx.getImageData(0, 0, canvasSize, canvasSize);

    // Create combined image data
    const combinedImageData = combinedCtx.createImageData(canvasSize, canvasSize);
    
    for (let i = 0; i < combinedImageData.data.length; i += 4) {
      const pixelIndex = i / 4;
      const x = pixelIndex % canvasSize;
      const y = Math.floor(pixelIndex / canvasSize);
      
      // Get pixel data from each layer
      const redPixel = {
        r: redImageData.data[i],
        g: redImageData.data[i + 1],
        b: redImageData.data[i + 2],
        a: redImageData.data[i + 3]
      };
      
      const greenPixel = {
        r: greenImageData.data[i],
        g: greenImageData.data[i + 1],
        b: greenImageData.data[i + 2],
        a: greenImageData.data[i + 3]
      };
      
      const bluePixel = {
        r: blueImageData.data[i],
        g: blueImageData.data[i + 1],
        b: blueImageData.data[i + 2],
        a: blueImageData.data[i + 3]
      };

      // Convert pixel colors to hex for channel lookup
      const redHex = `#${redPixel.r.toString(16).padStart(2, '0')}${redPixel.g.toString(16).padStart(2, '0')}${redPixel.b.toString(16).padStart(2, '0')}`;
      const greenHex = `#${greenPixel.r.toString(16).padStart(2, '0')}${greenPixel.g.toString(16).padStart(2, '0')}${greenPixel.b.toString(16).padStart(2, '0')}`;
      const blueHex = `#${bluePixel.r.toString(16).padStart(2, '0')}${bluePixel.g.toString(16).padStart(2, '0')}${bluePixel.b.toString(16).padStart(2, '0')}`;

      // Get channel values for each layer
      const redChannelValue = getChannelValue(redHex, 'red');
      const greenChannelValue = getChannelValue(greenHex, 'green');
      const blueChannelValue = getChannelValue(blueHex, 'blue');

      // Combine channel values into final pixel
      combinedImageData.data[i] = redChannelValue;     // R
      combinedImageData.data[i + 1] = greenChannelValue; // G
      combinedImageData.data[i + 2] = blueChannelValue;  // B
      combinedImageData.data[i + 3] = 255; // A (fully opaque)
    }

    // Draw the combined image data to the canvas
    combinedCtx.putImageData(combinedImageData, 0, 0);

    // Save channel image to server
    try {
      const combinedBase64 = combinedCanvas.toDataURL('image/png').split(',')[1];
      const layers = {
        red: combinedBase64,
        green: combinedBase64,
        blue: combinedBase64
      };
      
      const success = await paletteApi.savePixelArtCache(layers, canvasSize);
      
      if (success) {
        console.log('🎨 Channel image saved to server (images/ folder)');
        alert('Kanal-Bild erfolgreich gespeichert!');
      } else {
        console.error('Failed to save channel image to server');
        alert('Fehler beim Speichern des Kanal-Bildes!');
      }
    } catch (error) {
      console.error('Error saving channel image:', error);
      alert('Fehler beim Speichern des Kanal-Bildes!');
    }
  }, [canvasSize, getChannelValue]);

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
          className="file-button save-channels"
          onClick={() => setShowChannelPreview(true)}
          title="Kanal-Bild Vorschau - Alle Layer in Kanalwerte übersetzt"
        >
          <span className="material-icons">layers</span>
          <span>Kanal-Bild</span>
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

      <ChannelPreviewModal
        isOpen={showChannelPreview}
        onClose={() => setShowChannelPreview(false)}
        onSave={() => {
          handleSaveChannelImage();
          setShowChannelPreview(false);
        }}
        canvasSize={canvasSize}
        layers={layers}
        colorTable={colorTable}
      />
    </div>
  );
};

export default FileOperations;
