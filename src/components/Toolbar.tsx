"use strict";

import React, { useState, useEffect, useRef } from 'react';
import { Tool } from '../App';
import './Toolbar.css';

interface ToolbarProps {
  currentTool: Tool;
  onToolChange: (tool: Tool) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  showGrid: boolean;
  gridColor: string;
  gridThickness: number;
  onGridToggle: () => void;
  onGridColorChange: (color: string) => void;
  onGridThicknessChange: (thickness: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  onToolChange,
  zoom,
  onZoomChange,
  showGrid,
  gridColor,
  gridThickness,
  onGridToggle,
  onGridColorChange,
  onGridThicknessChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) => {
  const [showGridColorPicker, setShowGridColorPicker] = useState(false);
  const gridColorPickerRef = useRef<HTMLDivElement>(null);

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (gridColorPickerRef.current && !gridColorPickerRef.current.contains(event.target as Node)) {
        setShowGridColorPicker(false);
      }
    };

    if (showGridColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showGridColorPicker]);

  const tools: { tool: Tool; icon: string; label: string }[] = [
    { tool: 'brush', icon: 'brush', label: 'Pinsel' },
    { tool: 'eraser', icon: 'clear', label: 'Radierer' },
    { tool: 'eyedropper', icon: 'colorize', label: 'Pipette' },
    { tool: 'fill', icon: 'format_color_fill', label: 'Füllen' },
    { tool: 'line', icon: 'show_chart', label: 'Linie' },
    { tool: 'rectangle', icon: 'crop_square', label: 'Rechteck' }
  ];

  return (
    <div className="toolbar horizontal-toolbar">
      {/* Werkzeuge */}
      <div className="toolbar-section">
        <div className="tool-grid">
          {tools.map(({ tool, icon, label }) => (
            <button
              key={tool}
              className={`tool-button ${currentTool === tool ? 'active' : ''}`}
              onClick={() => onToolChange(tool)}
              title={label}
            >
              <span className="material-icons">{icon}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Zweite Zeile: Zoom, Ansicht und Bearbeitung */}
      <div className="toolbar-section">
        <div className="zoom-controls">
          <button
            className="zoom-button"
            onClick={() => onZoomChange(Math.max(0.5, zoom - 0.5))}
            disabled={zoom <= 0.5}
          >
            <span className="material-icons">zoom_out</span>
          </button>
          <span className="zoom-value">{Math.round(zoom * 100)}%</span>
          <button
            className="zoom-button"
            onClick={() => onZoomChange(Math.min(32, zoom + 0.5))}
            disabled={zoom >= 32}
          >
            <span className="material-icons">zoom_in</span>
          </button>
        </div>

        <div className="view-controls">
          <div className="grid-controls">
            <button
              className={`view-button ${showGrid ? 'active' : ''}`}
              onClick={onGridToggle}
              title="Raster anzeigen/verstecken"
            >
              <span className="material-icons">grid_on</span>
            </button>
            {showGrid && (
              <div className="grid-color-control">
                <button
                  className="grid-color-button"
                  onClick={() => setShowGridColorPicker(!showGridColorPicker)}
                  title="Rasterfarbe ändern"
                >
                  <div 
                    className="grid-color-preview"
                    style={{ backgroundColor: gridColor }}
                  />
                  <span className="material-icons">arrow_drop_down</span>
                </button>
                {showGridColorPicker && (
                  <div className="grid-color-picker" ref={gridColorPickerRef}>
                    <input
                      type="color"
                      value={gridColor}
                      onChange={(e) => onGridColorChange(e.target.value)}
                      className="grid-color-input"
                    />
                    <div className="grid-color-presets">
                      {['#b3d9ff', '#ff9999', '#99ff99', '#ffff99', '#ff99ff', '#99ffff', '#cccccc', '#666666'].map(color => (
                        <button
                          key={color}
                          className="grid-color-preset"
                          style={{ backgroundColor: color }}
                          onClick={() => onGridColorChange(color)}
                          title={color}
                        />
                      ))}
                    </div>
                    <div className="grid-thickness-control">
                      <label className="grid-thickness-label">Stärke:</label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={gridThickness}
                        onChange={(e) => onGridThicknessChange(parseInt(e.target.value))}
                        className="grid-thickness-slider"
                      />
                      <span className="grid-thickness-value">{gridThickness}px</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="edit-controls">
          <button
            className="edit-icon-button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Rückgängig (Ctrl+Z)"
          >
            <span className="material-icons">undo</span>
          </button>
          <button
            className="edit-icon-button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Wiederholen (Ctrl+Y)"
          >
            <span className="material-icons">redo</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
