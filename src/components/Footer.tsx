"use strict";

import React, { useState, useEffect } from 'react';
import './Footer.css';
import { colorTableService } from '../services/colorTableService';

interface FooterProps {
  // No props needed for now
}

interface PreviewState {
  isVisible: boolean;
  channel: string | null;
  color: string | null;
  position: { x: number; y: number } | null;
}

const Footer: React.FC<FooterProps> = () => {
  const [imageAges, setImageAges] = useState<{
    red: string | { color: string; channel: string };
    green: string | { color: string; channel: string };
    blue: string | { color: string; channel: string };
  }>({
    red: 'Unbekannt',
    green: 'Unbekannt',
    blue: 'Unbekannt'
  });

  const [availableChannels, setAvailableChannels] = useState<string[]>([]);

  const [preview, setPreview] = useState<PreviewState>({
    isVisible: false,
    channel: null,
    color: null,
    position: null
  });

  // Funktion zur Ermittlung der verfügbaren Kanäle
  const getAvailableChannels = () => {
    const channels: string[] = [];
    
    // Prüfe jeden Kanal einzeln (interne Namen bleiben red/green/blue)
    const environmentTable = colorTableService.getColorTable('red');
    const entitiesTable = colorTableService.getColorTable('green');
    const functionsTable = colorTableService.getColorTable('blue');
    
    if (environmentTable && environmentTable.length > 0) {
      channels.push('red'); // Interne ID bleibt red
    }
    if (entitiesTable && entitiesTable.length > 0) {
      channels.push('green'); // Interne ID bleibt green
    }
    if (functionsTable && functionsTable.length > 0) {
      channels.push('blue'); // Interne ID bleibt blue
    }
    return channels;
  };

  // Kanal-Informationen für die Anzeige (Mapping von internen IDs zu Anzeige-Namen)
  const channelInfo = {
    red: { name: 'Environment', color: '#ff4444', emoji: '🌍' },
    green: { name: 'Entities', color: '#44ff44', emoji: '🏗️' },
    blue: { name: 'Functions', color: '#4444ff', emoji: '⚙️' }
  };

  // Bildpfade für jeden Kanal (interne IDs)
  const imagePaths = {
    red: '/images/layer-environment.png',
    green: '/images/layer-entities.png',
    blue: '/images/layer-functions.png'
  };

  const calculateAge = (lastModified: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - lastModified.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffSeconds < 60) {
      return `${diffSeconds}s`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d`;
    }
  };

  const handleMouseEnter = (channel: string, color: string, event: React.MouseEvent) => {
    setPreview({
      isVisible: true,
      channel,
      color,
      position: {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
      }
    });
  };

  const handleMouseLeave = () => {
    setPreview({
      isVisible: false,
      channel: null,
      color: null,
      position: null
    });
  };

  const updateImageAges = async () => {
    try {
      // Get image file information from server
      const response = await fetch('http://localhost:3001/api/image-ages', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      if (response.ok) {
        const ages = await response.json();
        setImageAges(ages);
      } else {
        // Fallback: try to get from local file system info
        setImageAges({
          red: 'Nicht verfügbar',
          green: 'Nicht verfügbar',
          blue: 'Nicht verfügbar'
        });
      }
    } catch (error) {
      console.error('Error fetching image ages:', error);
      setImageAges({
        red: 'Fehler',
        green: 'Fehler',
        blue: 'Fehler'
      });
    }
  };

  useEffect(() => {
    // Set available channels based on colorTables.json
    setAvailableChannels(getAvailableChannels());
    
    // Update ages immediately
    updateImageAges();
    
    // Update every 30 seconds (reduced frequency to prevent server overload)
    const interval = setInterval(updateImageAges, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const renderAgeItem = (layer: string, age: string | { color: string; channel: string }, color: string, emoji: string, channelKey: string) => {
    if (typeof age === 'object' && age.color && age.channel) {
      // New structure: show both color and channel ages
      return (
        <div className="age-item-group">
          <span 
            className="age-item hoverable" 
            style={{ borderLeftColor: color }}
            onMouseEnter={(e) => handleMouseEnter(channelKey, color, e)}
            onMouseLeave={handleMouseLeave}
          >
            {emoji} {layer}: Color {age.color} | Channel {age.channel}
          </span>
        </div>
      );
    } else {
      // Legacy structure: show single age
      return (
        <span 
          className="age-item hoverable" 
          style={{ borderLeftColor: color }}
          onMouseEnter={(e) => handleMouseEnter(channelKey, color, e)}
          onMouseLeave={handleMouseLeave}
        >
          {emoji} {layer}: {age}
        </span>
      );
    }
  };

  return (
    <>
      <footer className="footer">
        <div className="footer-content">
          <div className="image-ages">
            <span className="age-label">Layer-Bilder Alter:</span>
            {availableChannels.map(channel => {
              const info = channelInfo[channel as keyof typeof channelInfo];
              const age = imageAges[channel as keyof typeof imageAges];
              return (
                <div key={channel}>
                  {renderAgeItem(info.name, age, info.color, info.emoji, channel)}
                </div>
              );
            })}
          </div>
        </div>
      </footer>

      {/* Hover Preview Modal */}
      {preview.isVisible && preview.channel && preview.position && (
        <div 
          className="channel-preview-modal"
          style={{
            left: `${preview.position.x}px`,
            top: `${preview.position.y}px`
          }}
        >
          <div className="preview-header">
            <span style={{ color: preview.color }}>{preview.channel.toUpperCase()} Layer</span>
          </div>
          <div className="preview-images">
            <div className="preview-image-container">
              <img 
                src={imagePaths[preview.channel as keyof typeof imagePaths]} 
                alt={`${preview.channel} layer`}
                className="preview-image"
              />
              <span className="preview-label">{preview.channel.toUpperCase()}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;
