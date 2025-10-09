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
  // Background pattern settings
  patternSize: number;
  patternOpacity: number;
  patternAnimationSpeed: number;
  patternType: string;
  patternColor: string;
  backgroundColor: string;
  patternAnimationType: string;
  onPatternSizeChange: (size: number) => void;
  onPatternOpacityChange: (opacity: number) => void;
  onPatternAnimationSpeedChange: (speed: number) => void;
  onPatternTypeChange: (type: string) => void;
  onPatternColorChange: (color: string) => void;
  onBackgroundColorChange: (color: string) => void;
  onPatternAnimationTypeChange: (type: string) => void;
  // Channel value mode settings
  channelValueMode: boolean;
  onChannelValueModeToggle: () => void;
}

const Toolbar: React.FC<ToolbarProps> = React.memo(({
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
  canRedo,
  patternSize,
  patternOpacity,
  patternAnimationSpeed,
  patternType,
  patternColor,
  backgroundColor,
  patternAnimationType,
  onPatternSizeChange,
  onPatternOpacityChange,
  onPatternAnimationSpeedChange,
  onPatternTypeChange,
  onPatternColorChange,
  onBackgroundColorChange,
  onPatternAnimationTypeChange,
  channelValueMode,
  onChannelValueModeToggle
}) => {
  // Debug log removed to prevent infinite re-renders
  const [showGridColorPicker, setShowGridColorPicker] = useState(false);
  const [showBackgroundSettings, setShowBackgroundSettings] = useState(false);
  const gridColorPickerRef = useRef<HTMLDivElement>(null);
  const backgroundSettingsRef = useRef<HTMLDivElement>(null);

  // Close color picker and background settings when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (gridColorPickerRef.current && !gridColorPickerRef.current.contains(event.target as Node)) {
        setShowGridColorPicker(false);
      }
      if (backgroundSettingsRef.current && !backgroundSettingsRef.current.contains(event.target as Node)) {
        setShowBackgroundSettings(false);
      }
    };

    if (showGridColorPicker || showBackgroundSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showGridColorPicker, showBackgroundSettings]);

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

        {/* Background Pattern Settings */}
        <div className="toolbar-section">
          <div className="toolbar-dropdown">
            <button
              className="toolbar-dropdown-button"
              onClick={() => setShowBackgroundSettings(!showBackgroundSettings)}
              title="Hintergrund-Einstellungen"
            >
              <span className="material-icons">texture</span>
              <span className="toolbar-dropdown-label">BG</span>
              <span className="material-icons dropdown-arrow">
                {showBackgroundSettings ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {showBackgroundSettings && (
              <div className="toolbar-dropdown-content" ref={backgroundSettingsRef}>
                <div className="background-settings">
                  <div className="background-pattern-presets">
                    <label className="background-pattern-label">Muster:</label>
                    <div className="background-pattern-preset-buttons">
                      <button
                        className={`background-pattern-preset ${patternType === 'diagonal' ? 'active' : ''}`}
                        title="Schräge Streifen"
                        onClick={() => onPatternTypeChange('diagonal')}
                        style={{
                          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)`,
                          backgroundSize: '8px 8px'
                        }}
                      />
                      <button
                        className={`background-pattern-preset ${patternType === 'dots' ? 'active' : ''}`}
                        title="Punkte"
                        onClick={() => onPatternTypeChange('dots')}
                        style={{
                          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(0,0,0,0.3) 1px, transparent 1px)`,
                          backgroundSize: '8px 8px'
                        }}
                      />
                      <button
                        className={`background-pattern-preset ${patternType === 'diamonds' ? 'active' : ''}`}
                        title="Rauten"
                        onClick={() => onPatternTypeChange('diamonds')}
                        style={{
                          backgroundImage: `
                            linear-gradient(45deg, rgba(0,0,0,0.2) 25%, transparent 25%),
                            linear-gradient(-45deg, rgba(0,0,0,0.2) 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.2) 75%),
                            linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.2) 75%)
                          `,
                          backgroundSize: '8px 8px',
                          backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
                        }}
                      />
                      <button
                        className={`background-pattern-preset ${patternType === 'squares' ? 'active' : ''}`}
                        title="Quadrate"
                        onClick={() => onPatternTypeChange('squares')}
                        style={{
                          backgroundImage: `
                            linear-gradient(0deg, rgba(0,0,0,0.2) 25%, transparent 25%),
                            linear-gradient(90deg, rgba(0,0,0,0.2) 25%, transparent 25%)
                          `,
                          backgroundSize: '8px 8px'
                        }}
                      />
                      <button
                        className={`background-pattern-preset ${patternType === 'circles' ? 'active' : ''}`}
                        title="Kreise"
                        onClick={() => onPatternTypeChange('circles')}
                        style={{
                          backgroundImage: `radial-gradient(circle at center, rgba(0,0,0,0.2) 2px, transparent 2px)`,
                          backgroundSize: '8px 8px'
                        }}
                      />
                      <button
                        className={`background-pattern-preset ${patternType === 'crosses' ? 'active' : ''}`}
                        title="Kreuze"
                        onClick={() => onPatternTypeChange('crosses')}
                        style={{
                          backgroundImage: `
                            linear-gradient(0deg, rgba(0,0,0,0.2) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,0,0,0.2) 1px, transparent 1px)
                          `,
                          backgroundSize: '8px 8px'
                        }}
                      />
                    </div>
                  </div>
                  <div className="background-pattern-control">
                    <label className="background-pattern-label">Muster-Farbe:</label>
                    <input
                      type="color"
                      value={patternColor}
                      onChange={(e) => onPatternColorChange(e.target.value)}
                      className="background-pattern-color-input"
                    />
                    <div className="background-pattern-color-presets">
                      {['#000000', '#666666', '#999999', '#cccccc', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'].map(color => (
                        <button
                          key={color}
                          className="background-pattern-color-preset"
                          style={{ backgroundColor: color }}
                          onClick={() => onPatternColorChange(color)}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="background-pattern-control">
                    <label className="background-pattern-label">Hintergrund:</label>
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => onBackgroundColorChange(e.target.value)}
                      className="background-pattern-color-input"
                    />
                    <div className="background-pattern-color-presets">
                      {['#ffffff', '#f0f0f0', '#e0e0e0', '#cccccc', '#999999', '#666666', '#333333', '#000000', '#ffeb3b', '#4caf50', '#2196f3'].map(color => (
                        <button
                          key={color}
                          className="background-pattern-color-preset"
                          style={{ backgroundColor: color }}
                          onClick={() => onBackgroundColorChange(color)}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="background-pattern-control">
                    <label className="background-pattern-label">Größe:</label>
                    <input
                      type="range"
                      min="8"
                      max="48"
                      step="4"
                      value={patternSize}
                      onChange={(e) => onPatternSizeChange(parseInt(e.target.value))}
                      className="background-pattern-slider"
                    />
                    <span className="background-pattern-value">{patternSize}px</span>
                  </div>
                  <div className="background-pattern-control">
                    <label className="background-pattern-label">Transparenz:</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      value={patternOpacity}
                      onChange={(e) => onPatternOpacityChange(parseFloat(e.target.value))}
                      className="background-pattern-slider"
                    />
                    <span className="background-pattern-value">{Math.round(patternOpacity * 100)}%</span>
                  </div>
                  <div className="background-pattern-control">
                    <label className="background-pattern-label">Animation:</label>
                    <input
                      type="range"
                      min="5"
                      max="60"
                      step="5"
                      value={patternAnimationSpeed}
                      onChange={(e) => onPatternAnimationSpeedChange(parseInt(e.target.value))}
                      className="background-pattern-slider"
                    />
                    <span className="background-pattern-value">{patternAnimationSpeed}s</span>
                  </div>
                  <div className="background-pattern-control">
                    <div className="background-pattern-animation-presets">
                      {[
                        { type: 'waves', label: 'Waves', icon: '🌊' },
                        { type: 'twitchy', label: 'Twitchy', icon: '⚡' },
                        { type: 'softmove', label: 'Soft Move', icon: '🌸' }
                      ].map(preset => (
                        <button
                          key={preset.type}
                          className={`background-pattern-animation-preset ${patternAnimationType === preset.type ? 'active' : ''}`}
                          onClick={() => onPatternAnimationTypeChange(preset.type)}
                          title={`${preset.label} Movement`}
                        >
                          <span className="preset-icon">{preset.icon}</span>
                          <span className="preset-label">{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="edit-controls">
          <button
            className={`edit-icon-button ${channelValueMode ? 'active' : ''}`}
            onClick={() => {
              // Debug log removed to prevent infinite re-renders
              onChannelValueModeToggle();
            }}
            title={channelValueMode ? 'ChannelValue-Modus deaktivieren' : 'ChannelValue-Modus aktivieren'}
            style={{
              backgroundColor: channelValueMode ? '#007acc' : '#333',
              borderColor: channelValueMode ? '#0099ff' : '#555',
              color: channelValueMode ? '#ffffff' : '#cccccc'
            }}
          >
            <span className="material-icons">tune</span>
          </button>
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
});

Toolbar.displayName = 'Toolbar';

export default Toolbar;
