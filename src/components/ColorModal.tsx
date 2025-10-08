"use strict";

import React, { useState, useCallback } from 'react';
import { LayerType } from '../App';
import { hexToRgb, rgbToHex, getLayerName, getChannelColor } from '../utils/colorUtils';
import './ColorModal.css';

interface ColorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentColor: string;
  currentChannel: number;
  channelType: LayerType;
  onColorChange: (color: string, channelValue: number) => void;
  colorName: string;
  onNameChange: (name: string) => void;
}

const ColorModal: React.FC<ColorModalProps> = ({
  isOpen,
  onClose,
  currentColor,
  currentChannel,
  channelType,
  onColorChange,
  colorName,
  onNameChange
}) => {
  const [selectedColor, setSelectedColor] = useState(currentColor);
  const [selectedChannel, setSelectedChannel] = useState(currentChannel);
  const [name, setName] = useState(colorName);
  
  // Initialize with the current channel value from the table
  React.useEffect(() => {
    setSelectedChannel(currentChannel);
  }, [currentChannel]);

  // Use utility functions for color conversions

  // Get current RGB values
  const [currentRgb, setCurrentRgb] = useState(() => hexToRgb(currentColor));

  // Update RGB values when color changes
  React.useEffect(() => {
    setCurrentRgb(hexToRgb(selectedColor));
  }, [selectedColor, hexToRgb]);

  // Handle color change
  const handleColorChange = useCallback((color: string) => {
    setSelectedColor(color);
    const rgb = hexToRgb(color);
    setSelectedChannel(channelType === 'red' ? rgb.r : channelType === 'green' ? rgb.g : rgb.b);
  }, [hexToRgb, channelType]);

  // Handle channel slider change
  const handleChannelChange = useCallback((value: number) => {
    setSelectedChannel(value);
    // DON'T update selectedColor - only the channel value should change
    // The palette color should remain unchanged
  }, []);

  // Handle save
  const handleSave = useCallback(() => {
    console.log('💾 DEBUG: Modal save called', {
      currentColor,
      selectedChannel,
      name
    });
    // Pass the original palette color, not the modified selectedColor
    onColorChange(currentColor, selectedChannel);
    onNameChange(name);
    onClose();
  }, [currentColor, selectedChannel, name, onColorChange, onNameChange, onClose]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    setSelectedColor(currentColor);
    setSelectedChannel(currentChannel);
    setName(colorName);
    onClose();
  }, [currentColor, currentChannel, colorName, onClose]);

  if (!isOpen) return null;

  // Use utility functions for channel info

  return (
    <div className="color-modal-overlay" onClick={handleCancel}>
      <div className="color-modal" onClick={(e) => e.stopPropagation()}>
        <div className="color-modal-header">
          <h3 className="color-modal-title">
            <span className="material-icons" style={{ color: getChannelColor(channelType) }}>
              fiber_manual_record
            </span>
            {getLayerName(channelType)}-Kanal bearbeiten
          </h3>
          <button className="color-modal-close" onClick={handleCancel}>
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="color-modal-content">
          <div className="color-modal-section">
            <label className="color-modal-label">Farbname:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="color-modal-name-input"
              placeholder="Farbname eingeben"
            />
          </div>

          <div className="color-modal-section">
            <label className="color-modal-label">Farbe:</label>
            <div className="color-modal-color-picker">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="color-modal-color-input"
              />
              <input
                type="text"
                value={selectedColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="color-modal-hex-input"
                placeholder="#000000"
              />
            </div>
          </div>

          <div className="color-modal-section">
            <label className="color-modal-label">
              {getLayerName(channelType)}-Kanal Wert: {selectedChannel}
            </label>
            <div className="color-modal-channel-control">
              <input
                type="range"
                min="0"
                max="255"
                step="1"
                value={selectedChannel}
                onChange={(e) => handleChannelChange(parseInt(e.target.value))}
                className="color-modal-channel-slider"
                style={{ accentColor: getChannelColor(channelType) }}
              />
              <span className="color-modal-channel-value">{selectedChannel}</span>
            </div>
          </div>

          <div className="color-modal-section">
            <label className="color-modal-label">Vorschau:</label>
            <div className="color-modal-preview">
              <div 
                className="color-modal-preview-color"
                style={{ backgroundColor: currentColor }}
                title={`Palettenfarbe: ${currentColor}`}
              />
              <div 
                className="color-modal-preview-channel"
                style={{ 
                  backgroundColor: `rgb(${channelType === 'red' ? selectedChannel : 0}, ${channelType === 'green' ? selectedChannel : 0}, ${channelType === 'blue' ? selectedChannel : 0})` 
                }}
                title={`${getLayerName(channelType)}-Kanal bearbeitet: ${selectedChannel}`}
              />
            </div>
          </div>
        </div>

        <div className="color-modal-actions">
          <button className="color-modal-button color-modal-button-cancel" onClick={handleCancel}>
            Abbrechen
          </button>
          <button className="color-modal-button color-modal-button-save" onClick={handleSave}>
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColorModal;
