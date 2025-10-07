"use strict";

import React, { useState, useCallback, useEffect } from 'react';
import PixelCanvas from './components/PixelCanvas';
import Toolbar from './components/Toolbar';
import ColorPicker from './components/ColorPicker';
import FileOperations from './components/FileOperations';
// import { paletteApi, ServerPalettes } from './services/paletteApi'; // Disabled for now
import './styles/App.css';

export type Tool = 'brush' | 'eraser' | 'eyedropper' | 'fill' | 'line' | 'rectangle';

export interface PixelData {
  x: number;
  y: number;
  color: string;
}

export interface PaletteColor {
  id: string;
  name: string;
  color: string;
}

export interface Layer {
  id: number;
  name: string;
  visible: boolean;
  opacity: number;
  palette: PaletteColor[];
}

export type LayerType = 'red' | 'green' | 'blue';

const App: React.FC = () => {
  const [currentTool, setCurrentTool] = useState<Tool>('brush');
  const [currentColor, setCurrentColor] = useState<string>('#ff0000');
  const [brushSize, setBrushSize] = useState<number>(1);
  const [canvasSize, setCanvasSize] = useState<number>(16);
  const [zoom, setZoom] = useState<number>(() => {
    const savedZoom = localStorage.getItem('pixel-painter-zoom');
    return savedZoom ? parseFloat(savedZoom) : 2;
  });
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [currentLayer, setCurrentLayer] = useState<LayerType>('red');
  const [layers, setLayers] = useState<Layer[]>([
    {
      id: 0,
      name: 'Environment',
      visible: true,
      opacity: 1.0,
      palette: []
    },
    {
      id: 1,
      name: 'Entities',
      visible: true,
      opacity: 1.0,
      palette: []
    },
    {
      id: 2,
      name: 'Functions',
      visible: true,
      opacity: 1.0,
      palette: []
    }
  ]);
  const [serverConnected, setServerConnected] = useState<boolean>(false);

  const handleToolChange = useCallback((tool: Tool) => {
    setCurrentTool(tool);
    localStorage.setItem('pixel-painter-current-tool', tool);
  }, []);

  const handleColorChange = useCallback((color: string) => {
    setCurrentColor(color);
    localStorage.setItem('pixel-painter-current-color', color);
  }, []);

  const handleBrushSizeChange = useCallback((size: number) => {
    setBrushSize(size);
    localStorage.setItem('pixel-painter-brush-size', size.toString());
  }, []);

  const handleCanvasSizeChange = useCallback((size: number) => {
    setCanvasSize(size);
    // Auto-adjust zoom to fill canvas based on size, but respect saved zoom if reasonable
    const savedZoom = localStorage.getItem('pixel-painter-zoom');
    const currentZoom = savedZoom ? parseFloat(savedZoom) : 2;
    const optimalZoom = Math.max(1, Math.min(20, 256 / size));
    
    // Use saved zoom if it's within reasonable bounds, otherwise use optimal zoom
    const newZoom = (currentZoom >= 0.5 && currentZoom <= 20) ? currentZoom : optimalZoom;
    setZoom(newZoom);
    localStorage.setItem('pixel-painter-zoom', newZoom.toString());
  }, []);

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
    localStorage.setItem('pixel-painter-zoom', newZoom.toString());
  }, []);

  const handleGridToggle = useCallback(() => {
    setShowGrid(!showGrid);
  }, [showGrid]);

  const handleHistoryUpdate = useCallback((imageData: ImageData) => {
    setHistory(prevHistory => {
      const newHistory = prevHistory.slice(0, historyIndex + 1);
      newHistory.push(imageData);
      if (newHistory.length > 50) {
        newHistory.shift();
        return newHistory;
      } else {
        setHistoryIndex(prevIndex => prevIndex + 1);
        return newHistory;
      }
    });
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  }, [historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  }, [historyIndex, history.length]);

  const handleLayerChange = useCallback((layerType: LayerType) => {
    setCurrentLayer(layerType);
    localStorage.setItem('pixel-painter-current-layer', layerType);
  }, []);

  const handleLayerVisibilityToggle = useCallback((layerId: number) => {
    setLayers(prevLayers => 
      prevLayers.map(layer => 
        layer.id === layerId 
          ? { ...layer, visible: !layer.visible }
          : layer
      )
    );
  }, []);

  const handleLayerOpacityChange = useCallback((layerId: number, opacity: number) => {
    setLayers(prevLayers => 
      prevLayers.map(layer => 
        layer.id === layerId 
          ? { ...layer, opacity }
          : layer
      )
    );
  }, []);

  const getCurrentLayerPalette = useCallback(() => {
    const layerIndex = currentLayer === 'red' ? 0 : currentLayer === 'green' ? 1 : 2;
    return layers[layerIndex]?.palette || [];
  }, [currentLayer, layers]);

  const handleAddColorToPalette = useCallback((layerId: number, color: string, name: string = '') => {
    const newColor: PaletteColor = {
      id: Date.now().toString(),
      name: name || `Farbe ${layers[layerId].palette.length + 1}`,
      color: color
    };
    
    setLayers(prevLayers => 
      prevLayers.map(layer => 
        layer.id === layerId 
          ? { ...layer, palette: [...layer.palette, newColor] }
          : layer
      )
    );
  }, [layers]);

  const handleUpdatePaletteColor = useCallback((layerId: number, colorId: string, updates: Partial<PaletteColor>) => {
    setLayers(prevLayers => 
      prevLayers.map(layer => 
        layer.id === layerId 
          ? { 
              ...layer, 
              palette: layer.palette.map(color => 
                color.id === colorId ? { ...color, ...updates } : color
              )
            }
          : layer
      )
    );
  }, []);

  const handleRemovePaletteColor = useCallback((layerId: number, colorId: string) => {
    setLayers(prevLayers => 
      prevLayers.map(layer => 
        layer.id === layerId 
          ? { ...layer, palette: layer.palette.filter(color => color.id !== colorId) }
          : layer
      )
    );
  }, []);

  // Load palettes and app state from localStorage on component mount
  useEffect(() => {
    const loadStateFromStorage = () => {
      try {
        // Load palettes
        const savedPalettes = localStorage.getItem('pixel-painter-palettes');
        if (savedPalettes) {
          const palettes = JSON.parse(savedPalettes);
          setLayers(prevLayers => 
            prevLayers.map((layer, index) => {
              const layerName = layer.name.toLowerCase();
              return {
                ...layer,
                palette: palettes[layerName] || []
              };
            })
          );
        }

        // Load current tool
        const savedTool = localStorage.getItem('pixel-painter-current-tool');
        if (savedTool) {
          setCurrentTool(savedTool as Tool);
        }

        // Load current color
        const savedColor = localStorage.getItem('pixel-painter-current-color');
        if (savedColor) {
          setCurrentColor(savedColor);
        }

        // Load current layer
        const savedLayer = localStorage.getItem('pixel-painter-current-layer');
        if (savedLayer) {
          setCurrentLayer(savedLayer as LayerType);
        }

        // Load brush size
        const savedBrushSize = localStorage.getItem('pixel-painter-brush-size');
        if (savedBrushSize) {
          setBrushSize(parseInt(savedBrushSize));
        }
      } catch (error) {
        console.error('Failed to load state from localStorage:', error);
      }
    };

    loadStateFromStorage();
    setServerConnected(false); // Server is disabled
  }, []);

  // Save palettes to localStorage when they change
  useEffect(() => {
    const savePalettesToStorage = () => {
      try {
        const palettesToSave = {
          environment: layers[0].palette,
          entities: layers[1].palette,
          functions: layers[2].palette
        };
        
        localStorage.setItem('pixel-painter-palettes', JSON.stringify(palettesToSave));
      } catch (error) {
        console.error('Failed to save palettes to localStorage:', error);
      }
    };

    // Debounce saves to avoid too many localStorage writes
    const timeoutId = setTimeout(savePalettesToStorage, 500);
    return () => clearTimeout(timeoutId);
  }, [layers]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Pixel Painter</h1>
        <div className="app-controls">
          <div className="server-status">
            <span className="status-indicator local-storage">
              <span className="material-icons">storage</span>
              Lokale Speicherung
            </span>
          </div>
          <FileOperations 
            canvasSize={canvasSize}
            onCanvasSizeChange={handleCanvasSizeChange}
          />
        </div>
      </header>
      
      <div className="app-toolbar">
        <Toolbar
          currentTool={currentTool}
          onToolChange={handleToolChange}
          zoom={zoom}
          onZoomChange={handleZoomChange}
          showGrid={showGrid}
          onGridToggle={handleGridToggle}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
        />
      </div>
      
      <div className="app-content">
        <div className="app-sidebar">
          <ColorPicker
            currentColor={currentColor}
            onColorChange={handleColorChange}
            brushSize={brushSize}
            onBrushSizeChange={handleBrushSizeChange}
            currentLayer={currentLayer}
            onLayerChange={handleLayerChange}
            layers={layers}
            onLayerVisibilityToggle={handleLayerVisibilityToggle}
            onLayerOpacityChange={handleLayerOpacityChange}
            layerPalette={getCurrentLayerPalette()}
            onAddColorToPalette={handleAddColorToPalette}
            onUpdatePaletteColor={handleUpdatePaletteColor}
            onRemovePaletteColor={handleRemovePaletteColor}
          />
        </div>
        
        <div className="app-main">
          <PixelCanvas
            width={canvasSize}
            height={canvasSize}
            currentTool={currentTool}
            currentColor={currentColor}
            brushSize={brushSize}
            zoom={zoom}
            showGrid={showGrid}
            onHistoryUpdate={handleHistoryUpdate}
            onZoomChange={handleZoomChange}
            historyData={history[historyIndex]}
            currentLayer={currentLayer}
            layers={layers}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
