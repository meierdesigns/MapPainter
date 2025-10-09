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

const ChannelSlider: React.FC<ChannelSliderProps> = React.memo(({
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

  // Debug logging removed to prevent performance issues

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLInputElement>) => {
    const finalValue = parseInt(e.currentTarget.value) || 0;
    onValueChange(entryId, channel, finalValue);
    setIsDragging(false);
    setPreviewValue(null);
  }, [entryId, channel, onValueChange]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
    setIsDragging(true);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLInputElement>) => {
    const finalValue = parseInt(e.currentTarget.value) || 0;
    onValueChange(entryId, channel, finalValue);
    setIsDragging(false);
    setPreviewValue(null);
  }, [entryId, channel, onValueChange]);

  // Use preview value if available, otherwise use actual value
  const displayValue = previewValue !== null ? previewValue : value;

  // Final render values logging removed for performance

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
      title={title || `${channel.toUpperCase()}-Layer: ${displayValue}`}
    />
  );
});

ChannelSlider.displayName = 'ChannelSlider';

export default ChannelSlider;
