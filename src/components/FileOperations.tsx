"use strict";

import React, { useRef, useCallback } from 'react';
import './FileOperations.css';

interface FileOperationsProps {
  canvasSize: number;
  onCanvasSizeChange: (size: number) => void;
}

const FileOperations: React.FC<FileOperationsProps> = ({
  canvasSize,
  onCanvasSizeChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasSizes = [16, 32, 64, 128, 256];

  const handleNewCanvas = useCallback(() => {
    if (window.confirm('Möchten Sie ein neues Bild erstellen? Alle ungespeicherten Änderungen gehen verloren.')) {
      // This would need to be passed up to parent to clear canvas
      window.location.reload();
    }
  }, []);

  const handleSaveImage = useCallback(() => {
    const canvas = document.querySelector('.pixel-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `pixel-art-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

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
