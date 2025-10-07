"use strict";

import React, { useState, useCallback, useEffect } from 'react';
import { Layer, LayerType, PaletteColor } from '../App';
import { hexToRgb, rgbToHex, getLayerIndex } from '../utils/colorUtils';
import ColorTable, { ColorTableEntry } from './ColorTable';
import './ColorPicker.css';

interface ColorPickerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  currentLayer: LayerType;
  onLayerChange: (layer: LayerType) => void;
  layers: Layer[];
  onLayerVisibilityToggle: (layerId: number) => void;
  onLayerOpacityChange: (layerId: number, opacity: number) => void;
  layerPalette: PaletteColor[];
  onAddColorToPalette: (layerId: number, color: string, name?: string) => void;
  onUpdatePaletteColor: (layerId: number, colorId: string, updates: Partial<PaletteColor>) => void;
  onRemovePaletteColor: (layerId: number, colorId: string) => void;
  colorTable: ColorTableEntry[];
  onColorTableChange: (colorTable: ColorTableEntry[]) => void;
  layerPalettes: {
    red: PaletteColor[];
    green: PaletteColor[];
    blue: PaletteColor[];
  };
  activeTab: 'picker' | 'table';
  onTabChange: (tab: 'picker' | 'table') => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  currentColor,
  onColorChange,
  brushSize,
  onBrushSizeChange,
  currentLayer,
  onLayerChange,
  layers,
  onLayerVisibilityToggle,
  onLayerOpacityChange,
  layerPalette,
  onAddColorToPalette,
  onUpdatePaletteColor,
  onRemovePaletteColor,
  colorTable,
  onColorTableChange,
  layerPalettes,
  activeTab,
  onTabChange
}) => {

  const predefinedColors = [
    '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#ff00ff', '#00ffff', '#ff8000', '#8000ff',
    '#0080ff', '#80ff00', '#ff0080', '#80ff80', '#8080ff',
    '#ff8080', '#808080', '#404040', '#c0c0c0', '#800000',
    '#008000', '#000080', '#808000', '#800080', '#008080'
  ];

  const handlePredefinedColorClick = useCallback((color: string) => {
    onColorChange(color);
    setOriginalColor(color); // Set original color to the selected color
    setHasModifiedColor(false); // Don't mark as modified
    setShowSaveButton(false); // Don't show save button for predefined colors
    setSelectedPaletteColor(null); // Clear palette selection
  }, [onColorChange]);

  const handlePaletteColorClick = useCallback((color: string) => {
    onColorChange(color);
    setOriginalColor(color); // Set original color to the selected color
    setHasModifiedColor(false); // Don't mark as modified initially
    setShowSaveButton(true); // Show save button for palette colors
    setSelectedPaletteColor(color); // Mark this palette color as selected
  }, [onColorChange]);

  // Use utility functions

  // Get current RGB values
  const [currentRgb, setCurrentRgb] = useState(() => hexToRgb(currentColor));
  const [hasModifiedColor, setHasModifiedColor] = useState(false);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [originalColor, setOriginalColor] = useState(currentColor);
  const [selectedPaletteColor, setSelectedPaletteColor] = useState<string | null>(null);

  // Update RGB values when current color changes
  useEffect(() => {
    setCurrentRgb(hexToRgb(currentColor));
    // Don't reset any states here - let the click handlers manage them
  }, [currentColor, hexToRgb]);

  // Handle RGB slider changes (only 10-step increments)
  const handleRgbChange = useCallback((component: 'r' | 'g' | 'b', value: number) => {
    // Round to nearest 10
    const roundedValue = Math.round(value / 10) * 10;
    // Clamp value to valid range
    const clampedValue = Math.max(0, Math.min(255, roundedValue));
    const newRgb = { ...currentRgb, [component]: clampedValue };
    setCurrentRgb(newRgb);
    setHasModifiedColor(true); // Mark color as modified
    setShowSaveButton(true); // Show save button when RGB sliders are used
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    onColorChange(newHex);
    // Keep palette selection if it exists
  }, [currentRgb, rgbToHex, onColorChange]);

  // Handle hex input change
  const handleHexChange = useCallback((hex: string) => {
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      onColorChange(hex);
      setOriginalColor(hex); // Set original color to the hex input
      setHasModifiedColor(true); // Mark as modified when changing hex input
      setShowSaveButton(true); // Show save button when hex input is used
      setSelectedPaletteColor(null); // Clear palette selection
    }
  }, [onColorChange]);

  // Handle saving current color to palette
  const handleSaveColorToPalette = useCallback(() => {
    const layerIndex = getLayerIndex(currentLayer);
    
    // Check if original color is already in the palette (for updates)
    const existingColorIndex = layerPalette.findIndex(color => color.color === originalColor);
    
    if (existingColorIndex !== -1) {
      // Update existing color - preserve original name
      const existingColor = layerPalette[existingColorIndex];
      onUpdatePaletteColor(layerIndex, existingColor.id, { 
        color: currentColor,
        name: existingColor.name // Preserve the original name
      });
    } else {
      // Add new color
      onAddColorToPalette(layerIndex, currentColor, `RGB(${currentRgb.r},${currentRgb.g},${currentRgb.b})`);
    }
    
    setHasModifiedColor(false); // Reset modification flag after saving
    setShowSaveButton(false); // Hide save button after saving
    setOriginalColor(currentColor); // Update original color to current color
  }, [getLayerIndex, currentColor, currentRgb, originalColor, layerPalette, onAddColorToPalette, onUpdatePaletteColor]);

  // Handle replacing a specific palette color with current color
  const handleReplacePaletteColor = useCallback((paletteColorId: string) => {
    const layerIndex = getLayerIndex(currentLayer);
    // Find the original palette color to preserve its name
    const originalPaletteColor = layerPalette.find(color => color.id === paletteColorId);
    const originalName = originalPaletteColor?.name || `RGB(${currentRgb.r},${currentRgb.g},${currentRgb.b})`;
    
    onUpdatePaletteColor(layerIndex, paletteColorId, { 
      color: currentColor,
      name: originalName // Preserve the original name
    });
  }, [getLayerIndex, currentColor, currentRgb, layerPalette, onUpdatePaletteColor]);


  return (
    <div className="color-picker">
      {/* Tab Navigation */}
      <div className="color-picker-tabs">
        <button
          className={`color-picker-tab ${activeTab === 'picker' ? 'active' : ''}`}
          onClick={() => onTabChange('picker')}
        >
          <span className="material-icons">palette</span>
          Farbpicker
        </button>
        <button
          className={`color-picker-tab ${activeTab === 'table' ? 'active' : ''}`}
          onClick={() => onTabChange('table')}
        >
          <span className="material-icons">table_chart</span>
          Farbtabelle
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'picker' && (
        <>
          <div className="color-picker-section">
            <h3 className="color-picker-title">Pinselgröße</h3>
        
        <div className="brush-size-control">
          <span className="brush-size-label">{brushSize}px</span>
          <div className="brush-size-slider-container">
            <input
              type="range"
              min="1"
              max="32"
              value={brushSize}
              onChange={(e) => onBrushSizeChange(parseInt(e.target.value))}
              className="brush-size-slider"
            />
            <div 
              className="brush-size-preview"
              style={{ 
                width: Math.min(brushSize * 2, 32), 
                height: Math.min(brushSize * 2, 32) 
              }}
            />
          </div>
        </div>
      </div>

      {/* Layer-Tabs */}
      <div className="color-picker-section">
        <h3 className="color-picker-title">Layer</h3>
        <div className="layer-tabs">
          {layers.map((layer) => (
            <div key={layer.id} className="layer-tab-item">
              <button
                className={`layer-tab ${currentLayer === (layer.id === 0 ? 'red' : layer.id === 1 ? 'green' : 'blue') ? 'active' : ''}`}
                onClick={() => onLayerChange(layer.id === 0 ? 'red' : layer.id === 1 ? 'green' : 'blue')}
                title={layer.name}
              >
                <span className="material-icons">
                  {layer.id === 0 ? 'landscape' : layer.id === 1 ? 'person' : 'functions'}
                </span>
              </button>
              <div className="layer-controls">
                <button
                  className="layer-visibility"
                  onClick={() => onLayerVisibilityToggle(layer.id)}
                  title={layer.visible ? 'Layer verstecken' : 'Layer anzeigen'}
                >
                  <span className="material-icons">
                    {layer.visible ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Aktuelle Layer-Palette */}
      <div className="color-picker-section">
        <h3 className="color-picker-title">Palette</h3>
        <div className="current-palette">
          <div className="palette-list">
            {layerPalette.map((paletteColor) => (
              <div key={paletteColor.id} className="palette-item">
                <button
                  className={`palette-color-button ${selectedPaletteColor === paletteColor.color ? 'active' : ''}`}
                  style={{ backgroundColor: paletteColor.color }}
                  onClick={() => handlePaletteColorClick(paletteColor.color)}
                  title={paletteColor.color}
                />
                <input
                  type="text"
                  value={paletteColor.name}
                  onChange={(e) => {
                    onUpdatePaletteColor(getLayerIndex(currentLayer), paletteColor.id, { name: e.target.value });
                  }}
                  className="palette-color-name"
                  placeholder="Farbname"
                />
                <button
                  className="palette-save-button"
                  onClick={() => handleReplacePaletteColor(paletteColor.id)}
                  title="Aktuelle Farbe ersetzen"
                >
                  <span className="material-icons">save</span>
                </button>
                <button
                  className="palette-remove-button"
                  onClick={() => {
                    onRemovePaletteColor(getLayerIndex(currentLayer), paletteColor.id);
                  }}
                  title="Farbe entfernen"
                >
                  <span className="material-icons">close</span>
                </button>
              </div>
            ))}
            {layerPalette.length === 0 && (
              <div className="palette-empty">
                <span className="material-icons">palette</span>
                <span>Leere Palette</span>
                <button
                  className="palette-save-button"
                  onClick={handleSaveColorToPalette}
                  title="Aktuelle Farbe speichern"
                >
                  <span className="material-icons">save</span>
                  Speichern
                </button>
              </div>
            )}
            <button
              className="palette-add-button"
              onClick={() => {
                onAddColorToPalette(getLayerIndex(currentLayer), currentColor);
              }}
              title="Aktuelle Farbe zur Palette hinzufügen"
            >
              <span className="material-icons">add</span>
              <span>Farbe hinzufügen</span>
            </button>
          </div>
        </div>
      </div>

      <div className="color-picker-section">
        <h3 className="color-picker-title">Aktuelle Farbe</h3>
        
        <div className="color-controls">
          <div className="hex-input-section">
            <div 
              className="current-color-preview"
              style={{ backgroundColor: currentColor }}
            />
            <input
              id="hex-input"
              type="text"
              value={currentColor}
              onChange={(e) => handleHexChange(e.target.value)}
              className="hex-input"
              placeholder="#000000"
            />
          </div>

          <div className="rgb-controls">
            <div className="rgb-slider">
              <label htmlFor="red-slider">R:</label>
              <input
                id="red-slider"
                type="range"
                min="0"
                max="255"
                step="10"
                value={currentRgb.r}
                onChange={(e) => handleRgbChange('r', parseInt(e.target.value))}
                className="rgb-slider-input"
              />
              <span className="rgb-value">{currentRgb.r}</span>
            </div>

            <div className="rgb-slider">
              <label htmlFor="green-slider">G:</label>
              <input
                id="green-slider"
                type="range"
                min="0"
                max="255"
                step="10"
                value={currentRgb.g}
                onChange={(e) => handleRgbChange('g', parseInt(e.target.value))}
                className="rgb-slider-input"
              />
              <span className="rgb-value">{currentRgb.g}</span>
            </div>

            <div className="rgb-slider">
              <label htmlFor="blue-slider">B:</label>
              <input
                id="blue-slider"
                type="range"
                min="0"
                max="255"
                step="10"
                value={currentRgb.b}
                onChange={(e) => handleRgbChange('b', parseInt(e.target.value))}
                className="rgb-slider-input"
              />
              <span className="rgb-value">{currentRgb.b}</span>
            </div>
          </div>
        </div>

        <div className="predefined-colors-section">
          <h4 className="predefined-colors-title">Vordefinierte Farben</h4>
          <div className="predefined-colors-grid">
            {predefinedColors.map((color, index) => (
              <button
                key={index}
                className={`predefined-color-button ${currentColor === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => handlePredefinedColorClick(color)}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>
        </>
      )}

      {/* Color Table Tab - Content is now rendered in the main canvas area */}
      {activeTab === 'table' && (
        <div className="color-table-placeholder">
          <div className="placeholder-content">
            <span className="material-icons">table_chart</span>
            <h3>Farbtabelle</h3>
            <p>Die Farbtabelle wird im Hauptbereich angezeigt</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
