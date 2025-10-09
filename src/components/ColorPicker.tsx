"use strict";

import React, { useState, useCallback, useEffect } from 'react';
import { Layer, LayerType, PaletteColor } from '../App';
import { hexToRgb, rgbToHex, getLayerIndex } from '../utils/colorUtils';
import ColorTable, { ColorTableEntry } from './ColorTable';
import './ColorPicker.css';

interface ColorPickerProps {
  currentColor: string | null;
  onColorChange: (color: string | null) => void;
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
  onAutoAddColorToPalette?: (color: string) => void;
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
  onTabChange,
  onAutoAddColorToPalette
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

  const handleClearColorClick = useCallback(() => {
    // Set to black instead of null to allow painting
    onColorChange('#000000');
    setOriginalColor('#000000');
    setHasModifiedColor(false);
    setShowSaveButton(false);
    setSelectedPaletteColor(null);
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
  const [currentRgb, setCurrentRgb] = useState(() => currentColor ? hexToRgb(currentColor) : { r: 0, g: 0, b: 0 });
  const [hasModifiedColor, setHasModifiedColor] = useState(false);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [originalColor, setOriginalColor] = useState(currentColor);
  const [selectedPaletteColor, setSelectedPaletteColor] = useState<string | null>(null);
  
  // Local state for editing palette color names
  const [editingNames, setEditingNames] = useState<{ [colorId: string]: string }>({});

  // Update RGB values when current color changes (but not during slider interaction)
  // Single useEffect to handle both RGB and palette selection updates
  useEffect(() => {
    // Update RGB values
    if (currentColor && !hasModifiedColor) {
      setCurrentRgb(hexToRgb(currentColor));
    } else if (!currentColor) {
      setCurrentRgb({ r: 0, g: 0, b: 0 });
    }
    
    // Update selected palette color
    if (currentColor) {
      // Check if the current color exists in the current layer's palette
      const matchingPaletteColor = layerPalette.find(p => p.color === currentColor);
      
      if (matchingPaletteColor) {
        setSelectedPaletteColor(matchingPaletteColor.color);
        console.log('🎨 Palette color selected:', matchingPaletteColor.color);
      } else {
        setSelectedPaletteColor(null);
        console.log('🎨 Current color not found in palette:', currentColor);
      }
    } else {
      setSelectedPaletteColor(null);
      console.log('🎨 No color selected');
    }
  }, [currentColor, layerPalette, hasModifiedColor, hexToRgb]);

  // Handle RGB slider changes (only 10-step increments)
  const handleRgbChange = useCallback((component: 'r' | 'g' | 'b' | 'all', value: number) => {
    // Round to nearest 10
    const roundedValue = Math.round(value / 10) * 10;
    // Clamp value to valid range
    const clampedValue = Math.max(0, Math.min(255, roundedValue));
    
    let newRgb;
    if (component === 'all') {
      // Set all RGB components to the same value (grayscale)
      newRgb = { r: clampedValue, g: clampedValue, b: clampedValue };
    } else {
      // Set individual component
      newRgb = { ...currentRgb, [component]: clampedValue };
    }
    
    setCurrentRgb(newRgb);
    setHasModifiedColor(true); // Mark color as modified
    setShowSaveButton(true); // Show save button when RGB sliders are used
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    
    // Update the selected palette color if one is selected
    if (selectedPaletteColor) {
      // Find the palette color and update it
      const layerIndex = getLayerIndex(currentLayer);
      const paletteColor = layerPalette.find(p => p.color === selectedPaletteColor);
      if (paletteColor) {
        onUpdatePaletteColor(layerIndex, paletteColor.id, { color: newHex });
        // Set the new color as current color
        onColorChange(newHex);
        console.log('🎨 Updated selected palette color:', newHex);
      }
    } else {
      // No palette color selected, just update current color for preview
      onColorChange(newHex);
      console.log('🎨 RGB slider changed (no palette selection):', { component, value, newHex });
    }
  }, [currentRgb, rgbToHex, selectedPaletteColor, layerPalette, currentLayer, onUpdatePaletteColor, onColorChange]);

  // Handle hex input change
  const handleHexChange = useCallback((hex: string) => {
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      setOriginalColor(hex);
      setHasModifiedColor(true);
      setShowSaveButton(true);
      // Update RGB values
      const rgb = hexToRgb(hex);
      setCurrentRgb(rgb);
      
      // Update the selected palette color if one is selected
      if (selectedPaletteColor) {
        const layerIndex = getLayerIndex(currentLayer);
        const paletteColor = layerPalette.find(p => p.color === selectedPaletteColor);
        if (paletteColor) {
          onUpdatePaletteColor(layerIndex, paletteColor.id, { color: hex });
          // Set the new color as current color
          onColorChange(hex);
          console.log('🎨 Updated selected palette color via hex input:', hex);
        }
      } else {
        // No palette color selected, just update current color for preview
        onColorChange(hex);
        console.log('🎨 Hex input changed (no palette selection):', hex);
      }
    }
  }, [hexToRgb, selectedPaletteColor, layerPalette, currentLayer, onUpdatePaletteColor, onColorChange]);

  // Auto-add color to palette when painting with RGB color
  const autoAddColorToPalette = useCallback(() => {
    if (onAutoAddColorToPalette) {
      const newHex = rgbToHex(currentRgb.r, currentRgb.g, currentRgb.b);
      onAutoAddColorToPalette(newHex);
    }
  }, [currentRgb, onAutoAddColorToPalette, rgbToHex]);

  // Get current RGB color as hex
  const getCurrentRgbColor = useCallback(() => {
    return rgbToHex(currentRgb.r, currentRgb.g, currentRgb.b);
  }, [currentRgb, rgbToHex]);

  // Handle saving current color to palette
  const handleSaveColorToPalette = useCallback(() => {
    const layerIndex = getLayerIndex(currentLayer);
    const newHex = rgbToHex(currentRgb.r, currentRgb.g, currentRgb.b);
    
    // Check if original color is already in the palette (for updates)
    const existingColorIndex = -1; // Temporarily disable this check since we removed color fields
    
    if (existingColorIndex !== -1) {
      // Update existing color - preserve original name
      const existingColor = layerPalette[existingColorIndex];
      onUpdatePaletteColor(layerIndex, existingColor.id, { 
        color: newHex,
        name: existingColor.name // Preserve the original name
      });
    } else {
      // Add new color
      onAddColorToPalette(layerIndex, newHex, `RGB(${currentRgb.r},${currentRgb.g},${currentRgb.b})`);
    }
    
    // Set the new color as current color
    onColorChange(newHex);
    
    setHasModifiedColor(false); // Reset modification flag after saving
    setShowSaveButton(false); // Hide save button after saving
    setOriginalColor(newHex); // Update original color to new color
  }, [getLayerIndex, currentRgb, layerPalette, onAddColorToPalette, onUpdatePaletteColor, onColorChange, rgbToHex]);

  // Handle replacing a specific palette color with current color
  const handleReplacePaletteColor = useCallback((paletteColorId: string) => {
    const layerIndex = getLayerIndex(currentLayer);
    // Find the original palette color to preserve its name
    const originalPaletteColor = layerPalette.find(color => color.id === paletteColorId) || null;
    const originalName = originalPaletteColor?.name || `RGB(${currentRgb.r},${currentRgb.g},${currentRgb.b})`;
    
    onUpdatePaletteColor(layerIndex, paletteColorId, { 
      color: currentColor || '',
      name: originalName // Preserve the original name
    });
  }, [getLayerIndex, currentColor, currentRgb, layerPalette, onUpdatePaletteColor]);


  return (
    <div className="color-picker">
      {/* Color Picker Content */}
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
            <div key={`layer-${layer.id}`} className="layer-tab-item">
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
              <div key={`palette-${paletteColor.id}`} className="palette-item">
                <button
                  className={`palette-color-button ${selectedPaletteColor === paletteColor.color ? 'active' : ''}`}
                  style={{ backgroundColor: paletteColor.color }}
                  onClick={() => handlePaletteColorClick(paletteColor.color)}
                  title={paletteColor.color}
                />
                <input
                  type="text"
                  value={editingNames[paletteColor.id] !== undefined ? editingNames[paletteColor.id] : paletteColor.name}
                  onChange={(e) => {
                    // Only update local editing state, don't save yet
                    setEditingNames(prev => ({
                      ...prev,
                      [paletteColor.id]: e.target.value
                    }));
                  }}
                  onBlur={(e) => {
                    // Save the final name when focus is lost
                    const finalName = editingNames[paletteColor.id] !== undefined ? editingNames[paletteColor.id] : e.target.value;
                    onUpdatePaletteColor(getLayerIndex(currentLayer), paletteColor.id, { name: finalName });
                    // Clear the editing state
                    setEditingNames(prev => {
                      const newState = { ...prev };
                      delete newState[paletteColor.id];
                      return newState;
                    });
                  }}
                  onKeyDown={(e) => {
                    // Prevent form submission
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const finalName = editingNames[paletteColor.id] !== undefined ? editingNames[paletteColor.id] : e.currentTarget.value;
                      onUpdatePaletteColor(getLayerIndex(currentLayer), paletteColor.id, { name: finalName });
                      // Clear the editing state
                      setEditingNames(prev => {
                        const newState = { ...prev };
                        delete newState[paletteColor.id];
                        return newState;
                      });
                      e.currentTarget.blur(); // Remove focus
                    }
                    // Cancel editing when Escape is pressed
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      setEditingNames(prev => {
                        const newState = { ...prev };
                        delete newState[paletteColor.id];
                        return newState;
                      });
                      e.currentTarget.blur(); // Remove focus
                    }
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
                {currentColor && (
                  <button
                    className="palette-save-button"
                    onClick={handleSaveColorToPalette}
                    title="Aktuelle Farbe speichern"
                  >
                    <span className="material-icons">save</span>
                    Speichern
                  </button>
                )}
              </div>
            )}
            {currentColor && (
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
            )}
          </div>
        </div>
      </div>

      <div className="color-picker-section">
        <h3 className="color-picker-title">Aktuelle Farbe</h3>
        
        <div className="color-controls">
          <div className="hex-input-section">
            <div 
              className="current-color-preview"
              style={{ backgroundColor: currentColor || 'transparent' }}
              title={currentColor || 'Keine Farbe ausgewählt'}
            />
            <input
              id="hex-input"
              type="text"
              value={currentColor || ''}
              onChange={(e) => handleHexChange(e.target.value)}
              className="hex-input"
              placeholder="#000000"
            />
            <button
              className="clear-color-button"
              onClick={handleClearColorClick}
              title="Farbe entfernen"
            >
              <span className="material-icons">clear</span>
            </button>
          </div>

          <div className="rgb-controls">
            <div className="rgb-slider">
              <label htmlFor="all-slider">Alle:</label>
              <input
                id="all-slider"
                type="range"
                min="0"
                max="255"
                step="10"
                value={Math.round((currentRgb.r + currentRgb.g + currentRgb.b) / 3)}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  handleRgbChange('all', value);
                }}
                className="rgb-slider-input all-slider"
              />
              <span className="rgb-value">{Math.round((currentRgb.r + currentRgb.g + currentRgb.b) / 3)}</span>
            </div>

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
                key={`predefined-${index}-${color}`}
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
    </div>
  );
};

export default ColorPicker;
