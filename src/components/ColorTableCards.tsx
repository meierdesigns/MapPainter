"use strict";

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import ChannelSlider from './ChannelSlider';
import { colorTableService, ColorTableEntry } from '../services/colorTableService';
import './ColorTableCards.css';

// ColorTableEntry is now imported from the service

interface ColorTableCardsProps {
  colorTable: ColorTableEntry[];
  onColorTableChange: (table: ColorTableEntry[]) => void;
  currentLayer: 'red' | 'green' | 'blue';
  layers: Array<{ palette: Array<{ color: string; name: string }> }>;
}

const ColorTableCards: React.FC<ColorTableCardsProps> = ({
  colorTable,
  onColorTableChange,
  currentLayer,
  layers
}) => {
  const [previewValues, setPreviewValues] = useState<{[key: string]: {red: number, green: number, blue: number}}>({});

  // Sync color table with palettes using the service - DISABLED to prevent clearing
  // useEffect(() => {
  //   console.log('🔧 ColorTableCards: syncColorTableWithPalettes useEffect');
  //   const layerIndex = currentLayer === 'red' ? 0 : currentLayer === 'green' ? 1 : 2;
  //   const layerPalette = layers[layerIndex]?.palette || [];
  //   
  //   console.log('🔧 ColorTableCards: Layer palette data', { 
  //     layerIndex, 
  //     layerPalette, 
  //     paletteLength: layerPalette.length,
  //     currentLayer 
  //   });
  //   
  //   // Use the service to sync palette to color table
  //   const newTable = colorTableService.syncPaletteToColorTable(currentLayer, layerPalette);
  //   
  //   console.log('🔧 ColorTableCards: Service returned table', { 
  //     newTable, 
  //     newTableLength: newTable.length,
  //     oldTableLength: colorTable.length 
  //   });
  //   
  //   // Update the parent component
  //   onColorTableChange(newTable);
  // }, [layers, currentLayer, onColorTableChange]);

  // Hex to RGB and RGB to Hex conversions are now handled by the service

  // Get grayscale color from channel value
  const getGrayscaleColorFromChannel = useCallback((value: number) => {
    const clampedValue = Math.max(0, Math.min(255, value));
    return `rgb(${clampedValue}, ${clampedValue}, ${clampedValue})`;
  }, []);

  // Convert colorTable prop to the expected format - memoized for performance
  const colorTableData = useMemo(() => {
    const data = {
      red: colorTable.filter(entry => entry.id.includes('red')),
      green: colorTable.filter(entry => entry.id.includes('green')),
      blue: colorTable.filter(entry => entry.id.includes('blue'))
    };
    
    return data;
  }, [colorTable]);

  // Get colors for a specific channel from colorTableData - memoized
  const getColorsForChannel = useCallback((channel: 'red' | 'green' | 'blue') => {
    return colorTableData[channel] || [];
  }, [colorTableData]);

  // Handle channel value change (final save) - stable reference to prevent re-renders
  const handleChannelValueChange = useCallback((entryId: string, channel: 'red' | 'green' | 'blue', value: number) => {
    // Use functional update to avoid dependency on colorTable
    onColorTableChange(prevTable => {
      const updatedTable = prevTable.map(entry => {
        if (entry.id === entryId) {
          const updatedEntry = { ...entry };
          // ONLY update channelValue, NOT the individual color channels
          updatedEntry.channelValue = value;
          return updatedEntry;
        }
        return entry;
      });
      return updatedTable;
    });
    
    // Clear preview values for this entry
    setPreviewValues(prev => {
      const updated = { ...prev };
      if (updated[entryId]) {
        const newEntry = { ...updated[entryId] };
        delete newEntry[channel];
        if (Object.keys(newEntry).length === 0) {
          delete updated[entryId];
        } else {
          updated[entryId] = newEntry;
        }
      }
      return updated;
    });
  }, [onColorTableChange]);

  // Handle preview change (during dragging) - stable reference
  const handlePreviewChange = useCallback((entryId: string, channel: 'red' | 'green' | 'blue', value: number) => {
    setPreviewValues(prev => ({
      ...prev,
      [entryId]: {
        ...prev[entryId],
        [channel]: value
      }
    }));
  }, []);

  // Get display value (preview or actual) - memoized
  const getDisplayValue = useCallback((entry: ColorTableEntry, channel: 'red' | 'green' | 'blue') => {
    const previewValue = previewValues[entry.id]?.[channel];
    if (previewValue !== undefined) {
      return previewValue;
    }
    
    // Use channelValue if this is the channel for this layer
    const layerFromId = entry.id.split('-')[1] as 'red' | 'green' | 'blue';
    if (layerFromId === channel && entry.channelValue !== undefined) {
      return entry.channelValue;
    }
    
    // Fall back to the channel value
    switch (channel) {
      case 'red': return entry.redChannel;
      case 'green': return entry.greenChannel;
      case 'blue': return entry.blueChannel;
      default: return 0;
    }
  }, [previewValues]);

  // Get display color for channel sliders - shows only the specific channel color - memoized
  const getDisplayColor = useCallback((entry: ColorTableEntry, channel: 'red' | 'green' | 'blue') => {
    const previewValue = previewValues[entry.id]?.[channel];
    const layerFromId = entry.id.split('-')[1] as 'red' | 'green' | 'blue';
    
    let channelValue;
    
    // Use preview value if available
    if (previewValue !== undefined) {
      channelValue = previewValue;
    } else {
      // Use channelValue if this is the channel for this layer
      if (layerFromId === channel && entry.channelValue !== undefined) {
        channelValue = entry.channelValue;
      } else {
        // Fallback to individual channel values
        switch (channel) {
          case 'red': channelValue = entry.redChannel; break;
          case 'green': channelValue = entry.greenChannel; break;
          case 'blue': channelValue = entry.blueChannel; break;
          default: channelValue = 0;
        }
      }
    }
    
    // Return channel color (only the specific channel, others are 0)
    switch (channel) {
      case 'red':
        return `rgb(${channelValue}, 0, 0)`;
      case 'green':
        return `rgb(0, ${channelValue}, 0)`;
      case 'blue':
        return `rgb(0, 0, ${channelValue})`;
      default:
        return getGrayscaleColorFromChannel(channelValue);
    }
  }, [previewValues, getGrayscaleColorFromChannel]);

  // Get channel color for the label
  const getChannelColor = useCallback((channel: 'red' | 'green' | 'blue') => {
    switch (channel) {
      case 'red': return '#ff6b6b';
      case 'green': return '#4caf50';
      case 'blue': return '#2196f3';
      default: return '#666';
    }
  }, []);

  // Memoized lookup map for better performance - prevents O(n) searches on every render
  const colorLookupMap = useMemo(() => {
    const map = new Map<string, { red?: ColorTableEntry; green?: ColorTableEntry; blue?: ColorTableEntry }>();
    
    colorTable.forEach(entry => {
      const key = `${entry.color}-${entry.name}`;
      const layerFromId = entry.id.split('-')[1] as 'red' | 'green' | 'blue';
      
      if (!map.has(key)) {
        map.set(key, {});
      }
      
      const entryMap = map.get(key)!;
      entryMap[layerFromId] = entry;
    });
    
    return map;
  }, [colorTable]);

  // Get translated color based on channelValue for each channel - shows final RGB overlay
  const getTranslatedColor = useCallback((entry: ColorTableEntry) => {
    const key = `${entry.color}-${entry.name}`;
    const entryMap = colorLookupMap.get(key);
    
    if (!entryMap) {
      // Fallback to individual channel values if no matching entries found
      const toHex = (value: number) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0');
      return `#${toHex(entry.redChannel)}${toHex(entry.greenChannel)}${toHex(entry.blueChannel)}`;
    }
    
    // Get channelValue for each channel, fallback to individual channel values
    const redValue = entryMap.red?.channelValue ?? entryMap.red?.redChannel ?? 0;
    const greenValue = entryMap.green?.channelValue ?? entryMap.green?.greenChannel ?? 0;
    const blueValue = entryMap.blue?.channelValue ?? entryMap.blue?.blueChannel ?? 0;
    
    // Convert to hex - this shows the final RGB overlay combination
    const toHex = (value: number) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0');
    return `#${toHex(redValue)}${toHex(greenValue)}${toHex(blueValue)}`;
  }, [colorLookupMap]);

  // Check if we have any data in colorTableData
  const hasData = colorTableData.red.length > 0 || colorTableData.green.length > 0 || colorTableData.blue.length > 0;
  
  if (!hasData) {
    return (
      <div className="color-table-cards-container">
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
    <div className="color-table-cards-container">
      <div className="color-table-header">
        <h3>Kanäle - Kanal-Zuweisungen</h3>
        <div className="current-layer">
          <span className="layer-icon">layers</span>
          <span>Aktueller Layer: {currentLayer === 'red' ? 'Rot' : currentLayer === 'green' ? 'Grün' : 'Blau'}</span>
        </div>
      </div>
      
      <div className="channel-cards">
        {/* Red Channel Card */}
        <div className="channel-card">
          <div className="channel-card-header">
            <div 
              className="channel-color-label"
              style={{ backgroundColor: getChannelColor('red') }}
            >
              R
            </div>
            <div className="channel-title">Rot-Kanal</div>
          </div>
          
          <div className="channel-card-content">
            {getColorsForChannel('red').map((entry: ColorTableEntry) => (
              <div key={`${entry.id}-red`} className="color-entry">
                <div className="color-info">
                  <div className="color-name">{entry.name}</div>
                  <div className="color-preview" style={{ backgroundColor: getTranslatedColor(entry) }}>
                    {getTranslatedColor(entry)}
                  </div>
                </div>
                
                <div className="channel-controls">
                  <div 
                    className="channel-color-preview"
                    style={{ backgroundColor: getDisplayColor(entry, 'red') }}
                    title={`Rot-Kanal: ${getDisplayValue(entry, 'red')}`}
                  />
                  <ChannelSlider
                    entryId={entry.id}
                    channel="red"
                    value={getDisplayValue(entry, 'red')}
                    onValueChange={handleChannelValueChange}
                    onPreviewChange={handlePreviewChange}
                    title={`Rot-Kanal: ${getDisplayValue(entry, 'red')}`}
                  />
                  <span className="channel-value-text">
                    {getDisplayValue(entry, 'red')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Green Channel Card */}
        <div className="channel-card">
          <div className="channel-card-header">
            <div 
              className="channel-color-label"
              style={{ backgroundColor: getChannelColor('green') }}
            >
              G
            </div>
            <div className="channel-title">Grün-Kanal</div>
          </div>
          
          <div className="channel-card-content">
            {getColorsForChannel('green').map((entry: ColorTableEntry) => (
              <div key={`${entry.id}-green`} className="color-entry">
                <div className="color-info">
                  <div className="color-name">{entry.name}</div>
                  <div className="color-preview" style={{ backgroundColor: getTranslatedColor(entry) }}>
                    {getTranslatedColor(entry)}
                  </div>
                </div>
                
                <div className="channel-controls">
                  <div 
                    className="channel-color-preview"
                    style={{ backgroundColor: getDisplayColor(entry, 'green') }}
                    title={`Grün-Kanal: ${getDisplayValue(entry, 'green')}`}
                  />
                  <ChannelSlider
                    entryId={entry.id}
                    channel="green"
                    value={getDisplayValue(entry, 'green')}
                    onValueChange={handleChannelValueChange}
                    onPreviewChange={handlePreviewChange}
                    title={`Grün-Kanal: ${getDisplayValue(entry, 'green')}`}
                  />
                  <span className="channel-value-text">
                    {getDisplayValue(entry, 'green')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Blue Channel Card */}
        <div className="channel-card">
          <div className="channel-card-header">
            <div 
              className="channel-color-label"
              style={{ backgroundColor: getChannelColor('blue') }}
            >
              B
            </div>
            <div className="channel-title">Blau-Kanal</div>
          </div>
          
          <div className="channel-card-content">
            {getColorsForChannel('blue').map((entry: ColorTableEntry) => (
              <div key={`${entry.id}-blue`} className="color-entry">
                <div className="color-info">
                  <div className="color-name">{entry.name}</div>
                  <div className="color-preview" style={{ backgroundColor: getTranslatedColor(entry) }}>
                    {getTranslatedColor(entry)}
                  </div>
                </div>
                
                <div className="channel-controls">
                  <div 
                    className="channel-color-preview"
                    style={{ backgroundColor: getDisplayColor(entry, 'blue') }}
                    title={`Blau-Kanal: ${getDisplayValue(entry, 'blue')}`}
                  />
                  <ChannelSlider
                    entryId={entry.id}
                    channel="blue"
                    value={getDisplayValue(entry, 'blue')}
                    onValueChange={handleChannelValueChange}
                    onPreviewChange={handlePreviewChange}
                    title={`Blau-Kanal: ${getDisplayValue(entry, 'blue')}`}
                  />
                  <span className="channel-value-text">
                    {getDisplayValue(entry, 'blue')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorTableCards;
