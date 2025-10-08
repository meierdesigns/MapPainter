"use strict";

import React, { useState, useCallback, useEffect } from 'react';
import ChannelSlider from './ChannelSlider';
import './ColorTableNew.css';

interface ColorTableEntry {
  id: string;
  name: string;
  redChannel: number;
  greenChannel: number;
  blueChannel: number;
  color: string;
}

interface ColorTableNewProps {
  colorTable: ColorTableEntry[];
  onColorTableChange: (table: ColorTableEntry[]) => void;
  currentLayer: 'red' | 'green' | 'blue';
  layers: Array<{ palette: Array<{ color: string; name: string }> }>;
}

const ColorTableNew: React.FC<ColorTableNewProps> = ({
  colorTable,
  onColorTableChange,
  currentLayer,
  layers
}) => {
  const [previewValues, setPreviewValues] = useState<{[key: string]: {r: number, g: number, b: number}}>({});

  console.log('🔧 ColorTableNew RENDER:', { 
    colorTableLength: colorTable.length, 
    previewValuesKeys: Object.keys(previewValues),
    currentLayer 
  });

  // Sync color table with palettes
  useEffect(() => {
    console.log('🔧 ColorTableNew: syncColorTableWithPalettes useEffect');
    const layerIndex = currentLayer === 'red' ? 0 : currentLayer === 'green' ? 1 : 2;
    const layerPalette = layers[layerIndex]?.palette || [];
    
    if (layerPalette.length > 0) {
      const newTable: ColorTableEntry[] = layerPalette.map((paletteColor, index) => {
        const existingEntry = colorTable.find(entry => entry.color === paletteColor.color);
        
        if (existingEntry) {
          return existingEntry;
        }
        
        // Create new entry
        const rgb = hexToRgb(paletteColor.color);
        return {
          id: `table-${Date.now()}-${index}`,
          name: paletteColor.name || `Farbe ${index + 1}`,
          redChannel: rgb.r,
          greenChannel: rgb.g,
          blueChannel: rgb.b,
          color: paletteColor.color
        };
      });
      
      console.log('🔧 ColorTableNew: Updating color table', { newTable });
      onColorTableChange(newTable);
    }
  }, [layers, currentLayer, onColorTableChange]);

  // Hex to RGB conversion
  const hexToRgb = useCallback((hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }, []);

  // RGB to Hex conversion
  const rgbToHex = useCallback((r: number, g: number, b: number) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }, []);

  // Get grayscale color from channel value
  const getGrayscaleColorFromChannel = useCallback((value: number) => {
    const clampedValue = Math.max(0, Math.min(255, value));
    return `rgb(${clampedValue}, ${clampedValue}, ${clampedValue})`;
  }, []);

  // Handle channel value change (final save)
  const handleChannelValueChange = useCallback((entryId: string, channel: 'red' | 'green' | 'blue', value: number) => {
    console.log('🔧 ColorTableNew: handleChannelValueChange', { entryId, channel, value });
    
    const updatedTable = colorTable.map(entry => {
      if (entry.id === entryId) {
        const updatedEntry = {
          ...entry,
          [`${channel}Channel`]: value
        };
        
        // Update the color based on all channels
        const newColor = rgbToHex(
          updatedEntry.redChannel,
          updatedEntry.greenChannel,
          updatedEntry.blueChannel
        );
        
        return {
          ...updatedEntry,
          color: newColor
        };
      }
      return entry;
    });
    
    console.log('🔧 ColorTableNew: Calling onColorTableChange', { updatedTable });
    onColorTableChange(updatedTable);
  }, [colorTable, onColorTableChange, rgbToHex]);

  // Handle preview change (during dragging)
  const handlePreviewChange = useCallback((entryId: string, channel: 'red' | 'green' | 'blue', value: number) => {
    console.log('🔧 ColorTableNew: handlePreviewChange', { entryId, channel, value });
    
    setPreviewValues(prev => ({
      ...prev,
      [entryId]: {
        ...prev[entryId],
        [channel]: value
      }
    }));
  }, []);

  // Get display value (preview or actual)
  const getDisplayValue = useCallback((entry: ColorTableEntry, channel: 'red' | 'green' | 'blue') => {
    const previewValue = previewValues[entry.id]?.[channel];
    return previewValue !== undefined ? previewValue : entry[`${channel}Channel`];
  }, [previewValues]);

  // Get display color (preview or actual)
  const getDisplayColor = useCallback((entry: ColorTableEntry, channel: 'red' | 'green' | 'blue') => {
    const previewValue = previewValues[entry.id]?.[channel];
    const channelValue = previewValue !== undefined ? previewValue : entry[`${channel}Channel`];
    return getGrayscaleColorFromChannel(channelValue);
  }, [previewValues, getGrayscaleColorFromChannel]);

  if (colorTable.length === 0) {
    return (
      <div className="color-table-container">
        <div className="color-table-header">
          <h3>Kanäle - Kanal-Zuweisungen</h3>
          <div className="current-layer">
            <span className="layer-icon">layers</span>
            <span>Aktueller Layer: {currentLayer === 'red' ? 'Rot' : currentLayer === 'green' ? 'Grün' : 'Blau'}</span>
          </div>
        </div>
        <div className="no-colors-message">
          Keine Farben in der Tabelle
        </div>
      </div>
    );
  }

  return (
    <div className="color-table-container">
      <div className="color-table-header">
        <h3>Kanäle - Kanal-Zuweisungen</h3>
        <div className="current-layer">
          <span className="layer-icon">layers</span>
          <span>Aktueller Layer: {currentLayer === 'red' ? 'Rot' : currentLayer === 'green' ? 'Grün' : 'Blau'}</span>
        </div>
      </div>
      
      <div className="color-table">
        {/* Header */}
        <div className="color-table-row header">
          <div className="color-name">Name</div>
          <div className="channel-color">Kanal-Farbe</div>
          <div className="palette-color">Palette-Farbe</div>
        </div>

        {/* Red Channel */}
        <div className="color-table-row">
          <div className="color-name">Name</div>
          <div className="channel-color">R</div>
          <div className="palette-color">palette</div>
        </div>

        {colorTable.map((entry) => (
          <div key={entry.id} className="color-table-row">
            <div 
              className="color-name clickable"
              title="Klicken zum Bearbeiten"
            >
              {entry.name}
            </div>
            <div className="channel-controls">
              <div 
                className="channel-color-preview inline clickable"
                style={{ backgroundColor: getDisplayColor(entry, 'red') }}
                title={`Rot-Kanal: ${getDisplayValue(entry, 'red')} - Klicken zum Bearbeiten`}
              />
              <ChannelSlider
                entryId={entry.id}
                channel="red"
                value={entry.redChannel}
                onValueChange={handleChannelValueChange}
                onPreviewChange={handlePreviewChange}
                title={`Rot-Kanal: ${getDisplayValue(entry, 'red')}`}
              />
              <span 
                className="channel-value-text clickable"
                title="Klicken zum Bearbeiten"
              >
                {getDisplayValue(entry, 'red')}
              </span>
            </div>
            <div className="palette-color-preview" style={{ backgroundColor: entry.color }}>
              {entry.color}
            </div>
          </div>
        ))}

        {/* Green Channel */}
        <div className="color-table-row">
          <div className="color-name">Name</div>
          <div className="channel-color">G</div>
          <div className="palette-color">palette</div>
        </div>

        {colorTable.map((entry) => (
          <div key={`${entry.id}-green`} className="color-table-row">
            <div 
              className="color-name clickable"
              title="Klicken zum Bearbeiten"
            >
              {entry.name}
            </div>
            <div className="channel-controls">
              <div 
                className="channel-color-preview inline clickable"
                style={{ backgroundColor: getDisplayColor(entry, 'green') }}
                title={`Grün-Kanal: ${getDisplayValue(entry, 'green')} - Klicken zum Bearbeiten`}
              />
              <ChannelSlider
                entryId={entry.id}
                channel="green"
                value={entry.greenChannel}
                onValueChange={handleChannelValueChange}
                onPreviewChange={handlePreviewChange}
                title={`Grün-Kanal: ${getDisplayValue(entry, 'green')}`}
              />
              <span 
                className="channel-value-text clickable"
                title="Klicken zum Bearbeiten"
              >
                {getDisplayValue(entry, 'green')}
              </span>
            </div>
            <div className="palette-color-preview" style={{ backgroundColor: entry.color }}>
              {entry.color}
            </div>
          </div>
        ))}

        {/* Blue Channel */}
        <div className="color-table-row">
          <div className="color-name">Name</div>
          <div className="channel-color">B</div>
          <div className="palette-color">palette</div>
        </div>

        {colorTable.map((entry) => (
          <div key={`${entry.id}-blue`} className="color-table-row">
            <div 
              className="color-name clickable"
              title="Klicken zum Bearbeiten"
            >
              {entry.name}
            </div>
            <div className="channel-controls">
              <div 
                className="channel-color-preview inline clickable"
                style={{ backgroundColor: getDisplayColor(entry, 'blue') }}
                title={`Blau-Kanal: ${getDisplayValue(entry, 'blue')} - Klicken zum Bearbeiten`}
              />
              <ChannelSlider
                entryId={entry.id}
                channel="blue"
                value={entry.blueChannel}
                onValueChange={handleChannelValueChange}
                onPreviewChange={handlePreviewChange}
                title={`Blau-Kanal: ${getDisplayValue(entry, 'blue')}`}
              />
              <span 
                className="channel-value-text clickable"
                title="Klicken zum Bearbeiten"
              >
                {getDisplayValue(entry, 'blue')}
              </span>
            </div>
            <div className="palette-color-preview" style={{ backgroundColor: entry.color }}>
              {entry.color}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColorTableNew;
