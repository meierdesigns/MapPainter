"use strict";

import React, { useState, useCallback, useRef } from 'react';

interface ChannelSliderProps {
  entryId: string;
  channel: 'red' | 'green' | 'blue';
  value: number;
  onValueChange: (entryId: string, channel: 'red' | 'green' | 'blue', value: number) => void;
  onPreviewChange: (entryId: string, channel: 'red' | 'green' | 'blue', value: number) => void;
  className?: string;
  title?: string;
}

const ChannelSlider: React.FC<ChannelSliderProps> = ({
  entryId,
  channel,
  value,
  onValueChange,
  onPreviewChange,
  className = '',
  title = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewValue, setPreviewValue] = useState<number | null>(null);
  const sliderRef = useRef<HTMLInputElement>(null);

  console.log('🔧 ChannelSlider RENDER:', { entryId, channel, value, isDragging, previewValue });

  const handleMouseDown = useCallback(() => {
    console.log('🔧 ChannelSlider: handleMouseDown', { entryId, channel });
    setIsDragging(true);
  }, [entryId, channel]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLInputElement>) => {
    console.log('🔧 ChannelSlider: handleMouseUp', { entryId, channel, value: e.currentTarget.value });
    const finalValue = parseInt(e.currentTarget.value) || 0;
    onValueChange(entryId, channel, finalValue);
    setIsDragging(false);
    setPreviewValue(null);
  }, [entryId, channel, onValueChange]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🔧 ChannelSlider: handleChange', { entryId, channel, value: e.target.value });
    const newValue = parseInt(e.target.value) || 0;
    
    if (isDragging) {
      // During dragging: update preview
      setPreviewValue(newValue);
      onPreviewChange(entryId, channel, newValue);
    } else {
      // Direct change: update immediately
      onValueChange(entryId, channel, newValue);
    }
  }, [entryId, channel, isDragging, onValueChange, onPreviewChange]);

  const handleTouchStart = useCallback(() => {
    console.log('🔧 ChannelSlider: handleTouchStart', { entryId, channel });
    setIsDragging(true);
  }, [entryId, channel]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLInputElement>) => {
    console.log('🔧 ChannelSlider: handleTouchEnd', { entryId, channel, value: e.currentTarget.value });
    const finalValue = parseInt(e.currentTarget.value) || 0;
    onValueChange(entryId, channel, finalValue);
    setIsDragging(false);
    setPreviewValue(null);
  }, [entryId, channel, onValueChange]);

  // Use preview value if available, otherwise use actual value
  const displayValue = previewValue !== null ? previewValue : value;

  console.log('🔧 ChannelSlider: Final render values', { 
    entryId, 
    channel, 
    value, 
    previewValue, 
    displayValue, 
    isDragging 
  });

  return (
    <input
      ref={sliderRef}
      type="range"
      min="0"
      max="255"
      step="5"
      value={displayValue}
      onChange={handleChange}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`channel-slider ${className}`}
      title={title || `${channel.toUpperCase()}-Kanal: ${displayValue}`}
    />
  );
};

export default ChannelSlider;
