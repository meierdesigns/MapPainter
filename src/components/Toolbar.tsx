"use strict";

import React from 'react';
import { Tool } from '../App';
import './Toolbar.css';

interface ToolbarProps {
  currentTool: Tool;
  onToolChange: (tool: Tool) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  showGrid: boolean;
  onGridToggle: () => void;
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
  onGridToggle,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) => {
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
            onClick={() => onZoomChange(Math.min(30, zoom + 0.5))}
            disabled={zoom >= 30}
          >
            <span className="material-icons">zoom_in</span>
          </button>
        </div>

        <div className="view-controls">
          <button
            className={`view-button ${showGrid ? 'active' : ''}`}
            onClick={onGridToggle}
            title="Raster anzeigen/verstecken"
          >
            <span className="material-icons">grid_on</span>
            <span>Raster</span>
          </button>
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
