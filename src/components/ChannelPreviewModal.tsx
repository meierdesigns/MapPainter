"use strict";

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { hexToRgb } from '../utils/colorUtils';
import './ChannelPreviewModal.css';

interface ChannelPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  canvasSize: number;
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

const ChannelPreviewModal: React.FC<ChannelPreviewModalProps> = ({
  isOpen,
  onClose,
  onSave,
  canvasSize,
  layers,
  colorTable
}) => {
  const redPreviewRef = useRef<HTMLCanvasElement>(null);
  const greenPreviewRef = useRef<HTMLCanvasElement>(null);
  const bluePreviewRef = useRef<HTMLCanvasElement>(null);
  const combinedPreviewRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);


  // Helper function to get channel value for a color
  const getChannelValue = useCallback((color: string, channel: 'red' | 'green' | 'blue'): number => {
    const colorEntry = colorTable.find(entry => entry.color.toLowerCase() === color.toLowerCase());
    if (colorEntry) {
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
  }, [colorTable]);

  // Generate preview canvases
  const generatePreviews = useCallback(async () => {
    if (!isOpen) return;
    
    setIsGenerating(true);
    
    try {
      // Get all layer canvases
      const redCanvas = document.querySelector('.pixel-canvas[data-layer="red"]') as HTMLCanvasElement;
      const greenCanvas = document.querySelector('.pixel-canvas[data-layer="green"]') as HTMLCanvasElement;
      const blueCanvas = document.querySelector('.pixel-canvas[data-layer="blue"]') as HTMLCanvasElement;
      
      if (!redCanvas || !greenCanvas || !blueCanvas) {
        console.error('Could not find all layer canvases');
        return;
      }

      // Get contexts
      const redCtx = redCanvas.getContext('2d');
      const greenCtx = greenCanvas.getContext('2d');
      const blueCtx = blueCanvas.getContext('2d');
      
      if (!redCtx || !greenCtx || !blueCtx) {
        console.error('Could not get 2D contexts for layer canvases');
        return;
      }

      // Get image data from each layer
      const redImageData = redCtx.getImageData(0, 0, canvasSize, canvasSize);
      const greenImageData = greenCtx.getImageData(0, 0, canvasSize, canvasSize);
      const blueImageData = blueCtx.getImageData(0, 0, canvasSize, canvasSize);

      // Generate individual channel previews
      const generateChannelPreview = (
        imageData: ImageData, 
        channel: 'red' | 'green' | 'blue',
        canvasRef: React.RefObject<HTMLCanvasElement>
      ) => {
        if (!canvasRef.current) return;
        
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        // Set canvas size to 240x240 for display
        canvasRef.current.width = 240;
        canvasRef.current.height = 240;

        // Create a temporary canvas for the original size processing
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvasSize;
        tempCanvas.height = canvasSize;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        // Clear temporary canvas with transparent background
        tempCtx.clearRect(0, 0, canvasSize, canvasSize);

        const previewImageData = tempCtx.createImageData(canvasSize, canvasSize);
        
        for (let i = 0; i < previewImageData.data.length; i += 4) {
          const pixel = {
            r: imageData.data[i],
            g: imageData.data[i + 1],
            b: imageData.data[i + 2],
            a: imageData.data[i + 3]
          };

          // Check if pixel is transparent (alpha = 0) or white (unpainted)
          const isTransparent = pixel.a === 0;
          const isWhite = pixel.r === 255 && pixel.g === 255 && pixel.b === 255 && pixel.a === 255;
          const isUnpainted = isTransparent || isWhite;

          if (isUnpainted) {
            // Keep transparent for unpainted areas
            previewImageData.data[i] = 0;     // R
            previewImageData.data[i + 1] = 0; // G
            previewImageData.data[i + 2] = 0; // B
            previewImageData.data[i + 3] = 0; // A (transparent)
          } else {
            // Convert pixel color to hex for channel lookup
            const hex = `#${pixel.r.toString(16).padStart(2, '0')}${pixel.g.toString(16).padStart(2, '0')}${pixel.b.toString(16).padStart(2, '0')}`;
            const channelValue = getChannelValue(hex, channel);

            // Create grayscale preview for individual channel
            previewImageData.data[i] = channelValue;     // R
            previewImageData.data[i + 1] = channelValue; // G
            previewImageData.data[i + 2] = channelValue; // B
            previewImageData.data[i + 3] = 255; // A (opaque)
          }
        }

        // Draw to temporary canvas
        tempCtx.putImageData(previewImageData, 0, 0);

        // Scale and draw to display canvas
        ctx.imageSmoothingEnabled = false; // Keep pixelated look
        ctx.drawImage(tempCanvas, 0, 0, canvasSize, canvasSize, 0, 0, 240, 240);
      };

      // Generate combined preview
      const generateCombinedPreview = () => {
        if (!combinedPreviewRef.current) return;
        
        const ctx = combinedPreviewRef.current.getContext('2d');
        if (!ctx) return;

        // Set canvas size to 240x240 for display
        combinedPreviewRef.current.width = 240;
        combinedPreviewRef.current.height = 240;

        // Create a temporary canvas for the original size processing
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvasSize;
        tempCanvas.height = canvasSize;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        // Clear temporary canvas with transparent background
        tempCtx.clearRect(0, 0, canvasSize, canvasSize);

        const combinedImageData = tempCtx.createImageData(canvasSize, canvasSize);
        
        for (let i = 0; i < combinedImageData.data.length; i += 4) {
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

          // Check if all pixels are unpainted (transparent or white)
          const redUnpainted = (redPixel.a === 0) || (redPixel.r === 255 && redPixel.g === 255 && redPixel.b === 255 && redPixel.a === 255);
          const greenUnpainted = (greenPixel.a === 0) || (greenPixel.r === 255 && greenPixel.g === 255 && greenPixel.b === 255 && greenPixel.a === 255);
          const blueUnpainted = (bluePixel.a === 0) || (bluePixel.r === 255 && bluePixel.g === 255 && bluePixel.b === 255 && bluePixel.a === 255);
          const allUnpainted = redUnpainted && greenUnpainted && blueUnpainted;

          if (allUnpainted) {
            // Keep transparent for completely unpainted areas
            combinedImageData.data[i] = 0;     // R
            combinedImageData.data[i + 1] = 0; // G
            combinedImageData.data[i + 2] = 0; // B
            combinedImageData.data[i + 3] = 0; // A (transparent)
          } else {
            // Convert pixel colors to hex for channel lookup
            const redHex = `#${redPixel.r.toString(16).padStart(2, '0')}${redPixel.g.toString(16).padStart(2, '0')}${redPixel.b.toString(16).padStart(2, '0')}`;
            const greenHex = `#${greenPixel.r.toString(16).padStart(2, '0')}${greenPixel.g.toString(16).padStart(2, '0')}${greenPixel.b.toString(16).padStart(2, '0')}`;
            const blueHex = `#${bluePixel.r.toString(16).padStart(2, '0')}${bluePixel.g.toString(16).padStart(2, '0')}${bluePixel.b.toString(16).padStart(2, '0')}`;

            // Get channel values for each layer (use 0 for unpainted areas)
            const redChannelValue = redUnpainted ? 0 : getChannelValue(redHex, 'red');
            const greenChannelValue = greenUnpainted ? 0 : getChannelValue(greenHex, 'green');
            const blueChannelValue = blueUnpainted ? 0 : getChannelValue(blueHex, 'blue');

            // Combine channel values into final pixel
            combinedImageData.data[i] = redChannelValue;     // R
            combinedImageData.data[i + 1] = greenChannelValue; // G
            combinedImageData.data[i + 2] = blueChannelValue;  // B
            combinedImageData.data[i + 3] = 255; // A (fully opaque)
          }
        }

        // Draw to temporary canvas
        tempCtx.putImageData(combinedImageData, 0, 0);

        // Scale and draw to display canvas
        ctx.imageSmoothingEnabled = false; // Keep pixelated look
        ctx.drawImage(tempCanvas, 0, 0, canvasSize, canvasSize, 0, 0, 240, 240);
      };

      // Generate all previews
      generateChannelPreview(redImageData, 'red', redPreviewRef);
      generateChannelPreview(greenImageData, 'green', greenPreviewRef);
      generateChannelPreview(blueImageData, 'blue', bluePreviewRef);
      generateCombinedPreview();

    } catch (error) {
      console.error('Error generating previews:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [isOpen, canvasSize, getChannelValue]);

  // Generate previews when modal opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is ready
      setTimeout(generatePreviews, 100);
    }
  }, [isOpen]); // Remove generatePreviews dependency to prevent constant re-creation

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="channel-preview-modal-overlay" onClick={onClose}>
      <div className="channel-preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="channel-preview-modal-header">
          <h2 className="channel-preview-modal-title">
            <span className="material-icons">layers</span>
            Layer-Bild Vorschau
          </h2>
          <button 
            className="channel-preview-modal-close"
            onClick={onClose}
            title="Schließen (Esc)"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="channel-preview-modal-content">
          {isGenerating ? (
            <div className="channel-preview-loading">
              <span className="material-icons">hourglass_empty</span>
              <span>Vorschau wird generiert...</span>
            </div>
          ) : (
            <>
              <div className="channel-preview-individual">
                <h3 className="channel-preview-section-title">Einzelne Kanäle</h3>
                <div className="channel-preview-grid">
                  <div className="channel-preview-item">
                    <div className="channel-preview-label">
                      <span className="channel-indicator red"></span>
                      Rot-Layer (Environment)
                    </div>
                    <canvas
                      ref={redPreviewRef}
                      className="channel-preview-canvas"
                      width={240}
                      height={240}
                    />
                  </div>
                  
                  <div className="channel-preview-item">
                    <div className="channel-preview-label">
                      <span className="channel-indicator green"></span>
                      Grün-Layer (Entities)
                    </div>
                    <canvas
                      ref={greenPreviewRef}
                      className="channel-preview-canvas"
                      width={240}
                      height={240}
                    />
                  </div>
                  
                  <div className="channel-preview-item">
                    <div className="channel-preview-label">
                      <span className="channel-indicator blue"></span>
                      Blau-Layer (Functions)
                    </div>
                    <canvas
                      ref={bluePreviewRef}
                      className="channel-preview-canvas"
                      width={240}
                      height={240}
                    />
                  </div>
                </div>
              </div>

              <div className="channel-preview-combined">
                <h3 className="channel-preview-section-title">Kombiniertes Bild</h3>
                <div className="channel-preview-combined-container">
                  <canvas
                    ref={combinedPreviewRef}
                    className="channel-preview-canvas combined"
                    width={240}
                    height={240}
                  />
                  <div className="channel-preview-info">
                    <p>Alle drei Layer überlagert:</p>
                    <ul>
                      <li><span className="channel-indicator red"></span> Rot-Layer → Rot-Werte</li>
                      <li><span className="channel-indicator green"></span> Grün-Layer → Grün-Werte</li>
                      <li><span className="channel-indicator blue"></span> Blau-Layer → Blau-Werte</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="channel-preview-modal-footer">
          <button 
            className="channel-preview-button cancel"
            onClick={onClose}
          >
            <span className="material-icons">cancel</span>
            Abbrechen
          </button>
          <button 
            className="channel-preview-button save"
            onClick={onSave}
            disabled={isGenerating}
          >
            <span className="material-icons">save</span>
            Layer-Bild speichern
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChannelPreviewModal;
