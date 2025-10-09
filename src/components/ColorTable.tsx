"use strict";

import React, { useState, useCallback } from 'react';
import { LayerType, PaletteColor } from '../App';
import { hexToRgb, getLayerIndex, getLayerName, getChannelColor } from '../utils/colorUtils';
import ColorModal from './ColorModal';
import './ColorTable.css';

export interface ColorTableEntry {
  id: string;
  name: string;
}

interface ColorTableProps {
  colorTable: ColorTableEntry[];
  onColorTableChange: (colorTable: ColorTableEntry[]) => void;
  currentLayer: LayerType;
  onColorSelect: (color: string) => void;
  layerPalettes: {
    red: PaletteColor[];
    green: PaletteColor[];
    blue: PaletteColor[];
  };
}

const ColorTable: React.FC<ColorTableProps> = ({
  colorTable,
  onColorTableChange,
  currentLayer,
  onColorSelect,
  layerPalettes
}) => {
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    entryId: string | null;
    channelType: LayerType | null;
  }>({
    isOpen: false,
    entryId: null,
    channelType: null
  });
  
  // State for inline editing of channel values
  const [editingChannel, setEditingChannel] = useState<{
    entryId: string | null;
    channel: LayerType | null;
    value: string;
  }>({
    entryId: null,
    channel: null,
    value: ''
  });

  // Helper function to get layer index
  const getCurrentLayerIndex = useCallback(() => {
    return getLayerIndex(currentLayer);
  }, [currentLayer]);

  // Get current channel value based on layer
  const getCurrentChannelValue = useCallback((entry: ColorTableEntry) => {
    switch (currentLayer) {
      case 'red': return entry.redChannel;
      case 'green': return entry.greenChannel;
      case 'blue': return entry.blueChannel;
      default: return 0;
    }
  }, [currentLayer]);

  // Update channel value for current layer (legacy function)
  const updateChannelValueLegacy = useCallback((entryId: string, value: number) => {
    const updatedTable = colorTable.map(entry => {
      if (entry.id === entryId) {
        const updatedEntry = { ...entry };
        switch (currentLayer) {
          case 'red':
            updatedEntry.redChannel = value;
            break;
          case 'green':
            updatedEntry.greenChannel = value;
            break;
          case 'blue':
            updatedEntry.blueChannel = value;
            break;
        }
        return updatedEntry;
      }
      return entry;
    });
    onColorTableChange(updatedTable);
  }, [colorTable, currentLayer, onColorTableChange]);


  // Remove color entry
  const removeColorEntry = useCallback((entryId: string) => {
    onColorTableChange(colorTable.filter(entry => entry.id !== entryId));
  }, [colorTable, onColorTableChange]);

  // Update color name
  const updateColorName = useCallback((entryId: string, name: string) => {
    const updatedTable = colorTable.map(entry => {
      if (entry.id === entryId) {
        return { ...entry, name };
      }
      return entry;
    });
    onColorTableChange(updatedTable);
  }, [colorTable, onColorTableChange]);

  // Update color value
  const updateColorValue = useCallback((entryId: string, color: string) => {
    const updatedTable = colorTable.map(entry => {
      if (entry.id === entryId) {
        return { ...entry, color };
      }
      return entry;
    });
    onColorTableChange(updatedTable);
  }, [colorTable, onColorTableChange]);

  // Update channel value directly (without changing the palette color)
  const updateChannelValue = useCallback((entryId: string, channel: 'red' | 'green' | 'blue', value: number) => {
    console.log('🎛️ DEBUG: updateChannelValue called', { entryId, channel, value });
    
    // Since we're now working directly with palettes, we need to update the colorTable
    // to reflect the channel changes for display purposes
    const updatedTable = colorTable.map(entry => {
      if (entry.id === entryId) {
        const updatedEntry = { ...entry };
        // Parse RGB string and update the specific channel
        const rgbValues = updatedEntry.rgb.split(',').map(v => parseInt(v.trim()));
        const oldValue = rgbValues[channel === 'red' ? 0 : channel === 'green' ? 1 : 2];
        rgbValues[channel === 'red' ? 0 : channel === 'green' ? 1 : 2] = Math.max(0, Math.min(255, value));
        updatedEntry.rgb = rgbValues.join(',');
        
        
        console.log('🎛️ DEBUG: Channel updated', { 
          channel, 
          oldValue, 
          newValue: rgbValues[channel === 'red' ? 0 : channel === 'green' ? 1 : 2],
          entryId 
        });
        
        // DON'T update the palette color - only the channel value should change
        // The palette color should remain unchanged to preserve the original color
        
        return updatedEntry;
      }
      return entry;
    });
    
    console.log('🎛️ DEBUG: Calling onColorTableChange with updated table');
    onColorTableChange(updatedTable);
  }, [colorTable, onColorTableChange]);

  // Use utility function for hex to RGB conversion

  // Auto-update channels when color changes
  const handleColorChange = useCallback((entryId: string, color: string) => {
    const rgb = hexToRgb(color);
    const updatedTable = colorTable.map(entry => {
      if (entry.id === entryId) {
        return {
          ...entry,
          color,
          redChannel: rgb.r,
          greenChannel: rgb.g,
          blueChannel: rgb.b
        };
      }
      return entry;
    });
    onColorTableChange(updatedTable);
  }, [colorTable, hexToRgb, onColorTableChange]);

  // Use utility function for layer name

  // Convert channel value to channel color (not grayscale)
  const getChannelColorFromValue = useCallback((channelValue: number, channel: LayerType): string => {
    const clampedValue = Math.max(0, Math.min(255, channelValue));
    
    switch (channel) {
      case 'red':
        return `rgb(${clampedValue}, 0, 0)`;
      case 'green':
        return `rgb(0, ${clampedValue}, 0)`;
      case 'blue':
        return `rgb(0, 0, ${clampedValue})`;
      default:
        const hex = clampedValue.toString(16).padStart(2, '0');
        return `#${hex}${hex}${hex}`;
    }
  }, []);

  // Get palette color for a specific channel
  const getPaletteColorForChannel = useCallback((channel: LayerType, index: number): string | null => {
    const palette = layerPalettes[channel];
    if (palette && palette[index]) {
      return palette[index].color;
    }
    return null; // No color available
  }, [layerPalettes]);

  // Get palette name for a specific channel
  const getPaletteNameForChannel = useCallback((channel: LayerType, index: number): string | null => {
    const palette = layerPalettes[channel];
    if (palette && palette[index]) {
      return palette[index].name;
    }
    return null; // No name available
  }, [layerPalettes]);

  // Get colors that exist in a specific channel
  const getColorsForChannel = useCallback((channel: LayerType) => {
    const palette = layerPalettes[channel];
    if (!palette || palette.length === 0) {
      return [];
    }
    
    // Create ColorTableEntry objects directly from palette colors
    // This ensures each channel shows only its own colors
    const channelColors = palette.map((paletteColor, index) => {
      // Convert hex to RGB for channel values
      const hex = paletteColor.color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      
      return {
        id: `table-${channel}-${paletteColor.id}`,
        name: paletteColor.name,
        color: paletteColor.color,
        redChannel: r,
        greenChannel: g,
        blueChannel: b
      };
    });
    
    return channelColors;
  }, [layerPalettes]);

  // Get palette index for a specific color in a channel
  const getPaletteIndexForColor = useCallback((channel: LayerType, color: string) => {
    const palette = layerPalettes[channel];
    if (!palette) return -1;
    
    return palette.findIndex(paletteColor => 
      paletteColor.color.toLowerCase() === color.toLowerCase()
    );
  }, [layerPalettes]);

  // Get all unique colors from all palettes
  const getAllPaletteColors = useCallback(() => {
    const allColors = new Map<string, { name: string; color: string }>();
    
    // Collect all colors from all palettes
    Object.entries(layerPalettes).forEach(([channel, palette]) => {
      palette.forEach(paletteColor => {
        const key = paletteColor.color.toLowerCase();
        if (!allColors.has(key)) {
          allColors.set(key, {
            name: paletteColor.name,
            color: paletteColor.color
          });
        }
      });
    });
    
    return Array.from(allColors.values());
  }, [layerPalettes]);

  // Auto-sync color table with actual palette colors
  const syncColorTableWithPalettes = useCallback(() => {
    const paletteColors = getAllPaletteColors();
    
    // Only show colors that exist in palettes
    const updatedTable = paletteColors.map((paletteColor, index) => {
      const existingEntry = colorTable.find(entry => 
        entry.color.toLowerCase() === paletteColor.color.toLowerCase()
      );
      
      if (existingEntry) {
        // Only update the name, keep all channel values unchanged
        return {
          ...existingEntry,
          name: paletteColor.name
          // DON'T update redChannel, greenChannel, blueChannel - keep manual changes
        };
      } else {
        // Convert hex to RGB for channel values - use actual color values
        const hex = paletteColor.color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        return {
          id: `table-${Date.now()}-${index}`,
          name: paletteColor.name,
          color: paletteColor.color,
          redChannel: r,    // Use actual red value from color
          greenChannel: g,  // Use actual green value from color
          blueChannel: b    // Use actual blue value from color
        };
      }
    });
    
    if (JSON.stringify(updatedTable) !== JSON.stringify(colorTable)) {
      onColorTableChange(updatedTable);
    }
  }, [getAllPaletteColors, colorTable, onColorTableChange]);

  // Sync color table when palettes change - DISABLED to keep channels separate
  // React.useEffect(() => {
  //   syncColorTableWithPalettes();
  // }, [layerPalettes, syncColorTableWithPalettes]);

  // Removed redundant useEffect - React automatically re-renders when props change

  // Handle opening modal for channel color
  const handleChannelColorClick = useCallback((entryId: string, channelType: LayerType) => {
    setModalState({
      isOpen: true,
      entryId,
      channelType
    });
  }, []);

  // Handle closing modal
  const handleModalClose = useCallback(() => {
    setModalState({
      isOpen: false,
      entryId: null,
      channelType: null
    });
  }, []);

  // Handle color change from modal
  const handleModalColorChange = useCallback((color: string, channelValue: number) => {
    if (!modalState.entryId || !modalState.channelType) return;

    console.log('🔧 DEBUG: handleModalColorChange called', {
      entryId: modalState.entryId,
      channelType: modalState.channelType,
      color,
      channelValue
    });

    const updatedTable = colorTable.map(entry => {
      if (entry.id === modalState.entryId) {
        const updatedEntry = { ...entry };
        console.log('🔧 DEBUG: Before update:', updatedEntry);
        
        // DON'T update the main color - only update the channel value
        // updatedEntry.color = color; // REMOVED - don't change palette color
        
        // Update only the specific channel value
        switch (modalState.channelType) {
          case 'red':
            updatedEntry.redChannel = channelValue;
            break;
          case 'green':
            updatedEntry.greenChannel = channelValue;
            break;
          case 'blue':
            updatedEntry.blueChannel = channelValue;
            break;
        }
        
        console.log('🔧 DEBUG: After update:', updatedEntry);
        return updatedEntry;
      }
      return entry;
    });
    
    console.log('🔧 DEBUG: Updated table:', updatedTable);
    onColorTableChange(updatedTable);
  }, [modalState.entryId, modalState.channelType, colorTable, onColorTableChange]);

  // Handle name change from modal
  const handleModalNameChange = useCallback((name: string) => {
    if (!modalState.entryId) return;

    const updatedTable = colorTable.map(entry => {
      if (entry.id === modalState.entryId) {
        return { ...entry, name };
      }
      return entry;
    });
    onColorTableChange(updatedTable);
  }, [modalState.entryId, colorTable, onColorTableChange]);

  // Handle inline editing of channel values
  const handleChannelValueClick = useCallback((entryId: string, channel: LayerType, currentValue: number) => {
    setEditingChannel({
      entryId,
      channel,
      value: currentValue.toString()
    });
  }, []);

  const handleChannelValueChange = useCallback((value: string) => {
    setEditingChannel(prev => ({
      ...prev,
      value
    }));
  }, []);

  const handleChannelValueSave = useCallback(() => {
    if (!editingChannel.entryId || !editingChannel.channel) return;

    const newValue = Math.max(0, Math.min(255, parseInt(editingChannel.value) || 0));
    updateChannelValue(editingChannel.entryId, editingChannel.channel, newValue);
    
    setEditingChannel({
      entryId: null,
      channel: null,
      value: ''
    });
  }, [editingChannel, updateChannelValue]);

  const handleChannelValueCancel = useCallback(() => {
    setEditingChannel({
      entryId: null,
      channel: null,
      value: ''
    });
  }, []);

  const handleChannelValueKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleChannelValueSave();
    } else if (e.key === 'Escape') {
      handleChannelValueCancel();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const currentValue = parseInt(editingChannel.value) || 0;
      const newValue = Math.min(255, currentValue + 5);
      handleChannelValueChange(newValue.toString());
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const currentValue = parseInt(editingChannel.value) || 0;
      const newValue = Math.max(0, currentValue - 5);
      handleChannelValueChange(newValue.toString());
    }
  }, [handleChannelValueSave, handleChannelValueCancel, editingChannel.value, handleChannelValueChange]);

  return (
    <div className="color-table">
      <div className="color-table-header">
        <h3 className="color-table-title">Farbtabelle - Layer-Zuweisungen</h3>
        <div className="current-layer-info">
          <span className="layer-indicator">
            <span className="material-icons">layers</span>
            Aktueller Layer: {getLayerName(currentLayer)}
          </span>
        </div>
      </div>

      <div className="color-table-content">
        <div className="channel-tables-container">
          {/* Rot-Layer Tabelle */}
          <div className="channel-table">
            <div className="channel-table-header">
              <div className="channel-color-stripe red"></div>
            </div>
            <div className="channel-table-content">
              <div className="table-header">
                <div className="header-cell">Name</div>
                <div className="header-cell">
                  <span className="channel-letter" title="Layer-Farbe">R</span>
                </div>
                <div className="header-cell">
                  <span className="material-icons" title="Palette-Farbe">palette</span>
                </div>
              </div>
              <div className="table-body">
                {getColorsForChannel('red').map((entry, index) => (
                  <div key={`red-${entry.id}-${entry.redChannel}`} className="table-row">
                    <div className="table-cell name-cell">
                      <input
                        type="text"
                        value={entry.name || 'Unbenannt'}
                        onChange={(e) => {
                          // Update local state immediately for UI responsiveness
                          updateColorName(entry.id, e.target.value);
                        }}
                        onBlur={(e) => {
                          // Save the final name when focus is lost
                          updateColorName(entry.id, e.target.value);
                        }}
                        onKeyDown={(e) => {
                          // Prevent form submission
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            updateColorName(entry.id, e.target.value);
                            e.currentTarget.blur();
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            e.currentTarget.blur();
                          }
                        }}
                        className="color-name-input"
                        title="Klicken zum Bearbeiten"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="table-cell channel-color-cell">
                      <div className="channel-controls">
                        <div 
                          className="channel-color-preview inline clickable"
                          style={{ backgroundColor: getChannelColorFromValue(entry.redChannel, 'red') }}
                          title={`Rot-Layer: ${entry.redChannel} - Klicken zum Bearbeiten`}
                          onClick={() => handleChannelColorClick(entry.id, 'red')}
                        />
                         <input
                           type="range"
                           min="0"
                           max="255"
                           step="1"
                           value={entry.redChannel}
                           onChange={(e) => updateChannelValue(entry.id, 'red', parseInt(e.target.value) || 0)}
                           className="channel-slider"
                           title={`Rot-Layer: ${entry.redChannel}`}
                         />
                         {editingChannel.entryId === entry.id && editingChannel.channel === 'red' ? (
                           <input
                             type="number"
                             min="0"
                             max="255"
                             value={editingChannel.value}
                             onChange={(e) => handleChannelValueChange(e.target.value)}
                             onBlur={handleChannelValueSave}
                             onKeyDown={handleChannelValueKeyDown}
                             className="channel-value-input"
                             autoFocus
                           />
                         ) : (
                           <span 
                             className="channel-value-text clickable"
                             onClick={() => handleChannelValueClick(entry.id, 'red', entry.redChannel)}
                             title="Klicken zum Bearbeiten"
                           >
                             {entry.redChannel}
                           </span>
                         )}
                      </div>
                    </div>
                    <div className="table-cell palette-color-cell">
                      {(() => {
                        const paletteIndex = getPaletteIndexForColor('red', entry.color);
                        const paletteColor = paletteIndex >= 0 ? getPaletteColorForChannel('red', paletteIndex) : null;
                        return paletteColor ? (
                          <div 
                            className="palette-color-preview"
                            style={{ backgroundColor: paletteColor }}
                            title={paletteColor}
                          />
                        ) : (
                          <div className="palette-color-empty">
                            <span className="material-icons">remove</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Grün-Layer Tabelle */}
          <div className="channel-table">
            <div className="channel-table-header">
              <div className="channel-color-stripe green"></div>
            </div>
            <div className="channel-table-content">
              <div className="table-header">
                <div className="header-cell">Name</div>
                <div className="header-cell">
                  <span className="channel-letter" title="Layer-Farbe">G</span>
                </div>
                <div className="header-cell">
                  <span className="material-icons" title="Palette-Farbe">palette</span>
                </div>
              </div>
              <div className="table-body">
                {getColorsForChannel('green').map((entry, index) => (
                  <div key={`green-${entry.id}-${entry.greenChannel}`} className="table-row">
                    <div className="table-cell name-cell">
                      <input
                        type="text"
                        value={entry.name || 'Unbenannt'}
                        onChange={(e) => {
                          // Update local state immediately for UI responsiveness
                          updateColorName(entry.id, e.target.value);
                        }}
                        onBlur={(e) => {
                          // Save the final name when focus is lost
                          updateColorName(entry.id, e.target.value);
                        }}
                        onKeyDown={(e) => {
                          // Prevent form submission
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            updateColorName(entry.id, e.target.value);
                            e.currentTarget.blur();
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            e.currentTarget.blur();
                          }
                        }}
                        className="color-name-input"
                        title="Klicken zum Bearbeiten"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="table-cell channel-color-cell">
                      <div className="channel-controls">
                        <div 
                          className="channel-color-preview inline clickable"
                          style={{ backgroundColor: getChannelColorFromValue(entry.greenChannel, 'green') }}
                          title={`Grün-Layer: ${entry.greenChannel} - Klicken zum Bearbeiten`}
                          onClick={() => handleChannelColorClick(entry.id, 'green')}
                        />
                         <input
                           type="range"
                           min="0"
                           max="255"
                           step="1"
                           value={entry.greenChannel}
                           onChange={(e) => updateChannelValue(entry.id, 'green', parseInt(e.target.value) || 0)}
                           className="channel-slider"
                           title={`Grün-Layer: ${entry.greenChannel}`}
                         />
                         {editingChannel.entryId === entry.id && editingChannel.channel === 'green' ? (
                           <input
                             type="number"
                             min="0"
                             max="255"
                             value={editingChannel.value}
                             onChange={(e) => handleChannelValueChange(e.target.value)}
                             onBlur={handleChannelValueSave}
                             onKeyDown={handleChannelValueKeyDown}
                             className="channel-value-input"
                             autoFocus
                           />
                         ) : (
                           <span 
                             className="channel-value-text clickable"
                             onClick={() => handleChannelValueClick(entry.id, 'green', entry.greenChannel)}
                             title="Klicken zum Bearbeiten"
                           >
                             {entry.greenChannel}
                           </span>
                         )}
                      </div>
                    </div>
                    <div className="table-cell palette-color-cell">
                      {(() => {
                        const paletteIndex = getPaletteIndexForColor('green', entry.color);
                        const paletteColor = paletteIndex >= 0 ? getPaletteColorForChannel('green', paletteIndex) : null;
                        return paletteColor ? (
                          <div 
                            className="palette-color-preview"
                            style={{ backgroundColor: paletteColor }}
                            title={paletteColor}
                          />
                        ) : (
                          <div className="palette-color-empty">
                            <span className="material-icons">remove</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Blau-Layer Tabelle */}
          <div className="channel-table">
            <div className="channel-table-header">
              <div className="channel-color-stripe blue"></div>
            </div>
            <div className="channel-table-content">
              <div className="table-header">
                <div className="header-cell">Name</div>
                <div className="header-cell">
                  <span className="channel-letter" title="Layer-Farbe">B</span>
                </div>
                <div className="header-cell">
                  <span className="material-icons" title="Palette-Farbe">palette</span>
                </div>
              </div>
              <div className="table-body">
                {getColorsForChannel('blue').map((entry, index) => (
                  <div key={`blue-${entry.id}-${entry.blueChannel}`} className="table-row">
                    <div className="table-cell name-cell">
                      <input
                        type="text"
                        value={entry.name || 'Unbenannt'}
                        onChange={(e) => {
                          // Update local state immediately for UI responsiveness
                          updateColorName(entry.id, e.target.value);
                        }}
                        onBlur={(e) => {
                          // Save the final name when focus is lost
                          updateColorName(entry.id, e.target.value);
                        }}
                        onKeyDown={(e) => {
                          // Prevent form submission
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            updateColorName(entry.id, e.target.value);
                            e.currentTarget.blur();
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            e.currentTarget.blur();
                          }
                        }}
                        className="color-name-input"
                        title="Klicken zum Bearbeiten"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="table-cell channel-color-cell">
                      <div className="channel-controls">
                        <div 
                          className="channel-color-preview inline clickable"
                          style={{ backgroundColor: getChannelColorFromValue(entry.blueChannel, 'blue') }}
                          title={`Blau-Layer: ${entry.blueChannel} - Klicken zum Bearbeiten`}
                          onClick={() => handleChannelColorClick(entry.id, 'blue')}
                        />
                         <input
                           type="range"
                           min="0"
                           max="255"
                           step="1"
                           value={entry.blueChannel}
                           onChange={(e) => updateChannelValue(entry.id, 'blue', parseInt(e.target.value) || 0)}
                           className="channel-slider"
                           title={`Blau-Layer: ${entry.blueChannel}`}
                         />
                         {editingChannel.entryId === entry.id && editingChannel.channel === 'blue' ? (
                           <input
                             type="number"
                             min="0"
                             max="255"
                             value={editingChannel.value}
                             onChange={(e) => handleChannelValueChange(e.target.value)}
                             onBlur={handleChannelValueSave}
                             onKeyDown={handleChannelValueKeyDown}
                             className="channel-value-input"
                             autoFocus
                           />
                         ) : (
                           <span 
                             className="channel-value-text clickable"
                             onClick={() => handleChannelValueClick(entry.id, 'blue', entry.blueChannel)}
                             title="Klicken zum Bearbeiten"
                           >
                             {entry.blueChannel}
                           </span>
                         )}
                      </div>
                    </div>
                    <div className="table-cell palette-color-cell">
                      {(() => {
                        const paletteIndex = getPaletteIndexForColor('blue', entry.color);
                        const paletteColor = paletteIndex >= 0 ? getPaletteColorForChannel('blue', paletteIndex) : null;
                        return paletteColor ? (
                          <div 
                            className="palette-color-preview"
                            style={{ backgroundColor: paletteColor }}
                            title={paletteColor}
                          />
                        ) : (
                          <div className="palette-color-empty">
                            <span className="material-icons">remove</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {colorTable.length === 0 && (
          <div className="color-table-empty">
            <span className="material-icons">palette</span>
            <span>Keine Farben in der Tabelle</span>
            <span style={{ fontSize: '12px', color: '#888' }}>
              Farben werden automatisch aus den Paletten synchronisiert
            </span>
          </div>
        )}

      </div>

      {/* Color Modal */}
      {modalState.isOpen && modalState.entryId && modalState.channelType && (
        <ColorModal
          isOpen={modalState.isOpen}
          onClose={handleModalClose}
          currentColor={colorTable.find(e => e.id === modalState.entryId)?.color || '#000000'}
          currentChannel={
            modalState.channelType === 'red' 
              ? colorTable.find(e => e.id === modalState.entryId)?.redChannel || 0
              : modalState.channelType === 'green'
              ? colorTable.find(e => e.id === modalState.entryId)?.greenChannel || 0
              : colorTable.find(e => e.id === modalState.entryId)?.blueChannel || 0
          }
          channelType={modalState.channelType}
          onColorChange={handleModalColorChange}
          colorName={colorTable.find(e => e.id === modalState.entryId)?.name || ''}
          onNameChange={handleModalNameChange}
        />
      )}
    </div>
  );
};

export default ColorTable;
