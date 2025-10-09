"use strict";

import React, { useState, useCallback, useEffect } from 'react';
import PixelCanvas from './components/PixelCanvas';
import Toolbar from './components/Toolbar';
import ColorPicker from './components/ColorPicker';
import FileOperations from './components/FileOperations';
import ColorTable, { ColorTableEntry } from './components/ColorTable';
import ColorTableNew from './components/ColorTableNew';
import ColorTableCards from './components/ColorTableCards';
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
  const [currentColor, setCurrentColor] = useState<string | null>(null);
  const [brushSize, setBrushSize] = useState<number>(1);
  const [canvasSize, setCanvasSize] = useState<number>(16);
  const [zoom, setZoom] = useState<number>(() => {
    const savedZoom = localStorage.getItem('pixel-painter-zoom');
    return savedZoom ? parseFloat(savedZoom) : 2;
  });
  const [showGrid, setShowGrid] = useState<boolean>(() => {
    const savedShowGrid = localStorage.getItem('pixel-painter-show-grid');
    return savedShowGrid ? JSON.parse(savedShowGrid) : true;
  });
  const [gridColor, setGridColor] = useState<string>('#b3d9ff');
  const [gridThickness, setGridThickness] = useState<number>(() => {
    const savedThickness = localStorage.getItem('pixel-painter-grid-thickness');
    return savedThickness ? parseInt(savedThickness) : 1;
  });
  const [patternSize, setPatternSize] = useState<number>(() => {
    const savedPatternSize = localStorage.getItem('pixel-painter-pattern-size');
    return savedPatternSize ? parseInt(savedPatternSize) : 24;
  });
  const [patternOpacity, setPatternOpacity] = useState<number>(() => {
    const savedPatternOpacity = localStorage.getItem('pixel-painter-pattern-opacity');
    return savedPatternOpacity ? parseFloat(savedPatternOpacity) : 0.6;
  });
  const [patternAnimationSpeed, setPatternAnimationSpeed] = useState<number>(() => {
    const savedPatternAnimationSpeed = localStorage.getItem('pixel-painter-pattern-animation-speed');
    return savedPatternAnimationSpeed ? parseInt(savedPatternAnimationSpeed) : 30;
  });
  const [patternType, setPatternType] = useState<string>(() => {
    const savedPatternType = localStorage.getItem('pixel-painter-pattern-type');
    return savedPatternType || 'diagonal';
  });
  const [patternColor, setPatternColor] = useState<string>(() => {
    const savedPatternColor = localStorage.getItem('pixel-painter-pattern-color');
    return savedPatternColor || '#000000';
  });
  const [backgroundColor, setBackgroundColor] = useState<string>(() => {
    const savedBackgroundColor = localStorage.getItem('pixel-painter-background-color');
    return savedBackgroundColor || '#ffffff';
  });
  const [patternAnimationType, setPatternAnimationType] = useState<string>(() => {
    const savedPatternAnimationType = localStorage.getItem('pixel-painter-pattern-animation-type');
    return savedPatternAnimationType || 'waves';
  });
  const [channelValueMode, setChannelValueMode] = useState<boolean>(() => {
    const savedChannelValueMode = localStorage.getItem('pixel-painter-channel-value-mode');
    return savedChannelValueMode ? JSON.parse(savedChannelValueMode) : true;
  });
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
  const [colorTable, setColorTable] = useState<ColorTableEntry[]>([]);

  // Central function to update color table and localStorage
  const updateColorTableAndJson = useCallback((newColorTable: ColorTableEntry[] | ((prev: ColorTableEntry[]) => ColorTableEntry[])) => {
    // Handle both direct array and functional update
    setColorTable(prevTable => {
      const actualColorTable = typeof newColorTable === 'function' 
        ? newColorTable(prevTable) 
        : newColorTable;
      
      // Save to localStorage
      try {
        localStorage.setItem('pixel-painter-color-table', JSON.stringify(actualColorTable));
        console.log('🔧 App: Successfully updated color table in localStorage');
      } catch (error) {
        console.error('🔧 App: Error saving color table to localStorage:', error);
      }
      
      // Also update the ColorTableService to sync with JSON file
      import('./services/colorTableService').then(({ colorTableService }) => {
        // Update the service with the new color table data
        colorTableService.updateColorTableFromArray(actualColorTable);
        
        // Trigger JSON file update
        colorTableService.updateColorTablesJson().catch(error => {
          console.error('🔧 App: Error updating color tables JSON:', error);
        });
      }).catch(error => {
        console.error('🔧 App: Error importing ColorTableService:', error);
      });
      
      return actualColorTable;
    });
  }, []);

  // Toggle channel value mode
  const handleChannelValueModeToggle = useCallback(() => {
    setChannelValueMode(prevMode => {
      const newMode = !prevMode;
      console.log('🔄 ChannelValue Toggle:', { oldMode: prevMode, newMode });
      localStorage.setItem('pixel-painter-channel-value-mode', JSON.stringify(newMode));
      return newMode;
    });
  }, []);

  // Load initial color table data from localStorage (server dependency removed)
  useEffect(() => {
    const loadInitialColorTable = () => {
      try {
        const savedColorTable = localStorage.getItem('pixel-painter-color-table');
        if (savedColorTable) {
          const colorTableData = JSON.parse(savedColorTable);
          setColorTable(colorTableData);
          console.log('🔧 App: Loaded initial color table from localStorage', colorTableData);
        } else {
          // Initialize with empty color table if none exists
          setColorTable([]);
          console.log('🔧 App: No color table found, initialized with empty array');
        }
      } catch (error) {
        console.error('🔧 App: Error loading initial color table from localStorage:', error);
        setColorTable([]);
      }
    };
    
    loadInitialColorTable();
  }, []);
  const [activeColorTab, setActiveColorTab] = useState<'picker' | 'table'>(() => {
    const savedTab = localStorage.getItem('pixel-painter-active-tab');
    return (savedTab === 'picker' || savedTab === 'table') ? savedTab : 'picker';
  });
  const [pixelUpdateFunction, setPixelUpdateFunction] = useState<((layerType: LayerType, oldColor: string, newColor: string) => void) | null>(null);

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
    const newShowGrid = !showGrid;
    setShowGrid(newShowGrid);
    localStorage.setItem('pixel-painter-show-grid', JSON.stringify(newShowGrid));
  }, [showGrid]);

  const handleGridThicknessChange = useCallback((thickness: number) => {
    setGridThickness(thickness);
    localStorage.setItem('pixel-painter-grid-thickness', thickness.toString());
  }, []);

  const handlePatternSizeChange = useCallback((size: number) => {
    setPatternSize(size);
    localStorage.setItem('pixel-painter-pattern-size', size.toString());
  }, []);

  const handlePatternOpacityChange = useCallback((opacity: number) => {
    setPatternOpacity(opacity);
    localStorage.setItem('pixel-painter-pattern-opacity', opacity.toString());
  }, []);

  const handlePatternAnimationSpeedChange = useCallback((speed: number) => {
    setPatternAnimationSpeed(speed);
    localStorage.setItem('pixel-painter-pattern-animation-speed', speed.toString());
  }, []);

  const handlePatternTypeChange = useCallback((type: string) => {
    setPatternType(type);
    localStorage.setItem('pixel-painter-pattern-type', type);
  }, []);

  const handlePatternColorChange = useCallback((color: string) => {
    setPatternColor(color);
    localStorage.setItem('pixel-painter-pattern-color', color);
  }, []);

  const handleBackgroundColorChange = useCallback((color: string) => {
    setBackgroundColor(color);
    localStorage.setItem('pixel-painter-background-color', color);
  }, []);

  const handlePatternAnimationTypeChange = useCallback((type: string) => {
    setPatternAnimationType(type);
    localStorage.setItem('pixel-painter-pattern-animation-type', type);
  }, []);

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
    
    // Automatically select the first color from the new layer's palette
    const layerIndex = layerType === 'red' ? 0 : layerType === 'green' ? 1 : 2;
    const layerPalette = layers[layerIndex]?.palette || [];
    
    if (layerPalette.length > 0) {
      const firstColor = layerPalette[0].color;
      setCurrentColor(firstColor);
    } else {
      // If palette is empty, clear the color selection
      setCurrentColor(null);
    }
  }, [layers]);

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

  // Get all layer palettes for the color table
  const getAllLayerPalettes = useCallback(() => {
    return {
      red: layers[0]?.palette || [],
      green: layers[1]?.palette || [],
      blue: layers[2]?.palette || []
    };
  }, [layers]);

  // Handle color tab change
  const handleColorTabChange = useCallback((tab: 'picker' | 'table') => {
    setActiveColorTab(tab);
    localStorage.setItem('pixel-painter-active-tab', tab);
  }, []);

  // Handle pixel update function from canvas
  const handlePixelUpdateReady = useCallback((updateFunction: (layerType: LayerType, oldColor: string, newColor: string) => void) => {
    setPixelUpdateFunction(() => updateFunction);
  }, []);

  // Sync color table with palettes - DISABLED to prevent conflicts with ColorTable component
  // const syncColorTableWithPalettes = useCallback(() => {
  //   // This function is disabled to prevent conflicts with ColorTable's own sync function
  //   // The ColorTable component handles its own synchronization
  // }, [layers, colorTable]);

  // Auto-sync when layers change (disabled for now to prevent unwanted colors)
  // useEffect(() => {
  //   syncColorTableWithPalettes();
  // }, [layers, syncColorTableWithPalettes]);

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

    // Update colorTables.json when palette colors are added
    const updatedLayers = layers.map(layer => 
      layer.id === layerId 
        ? { ...layer, palette: [...layer.palette, newColor] }
        : layer
    );
    
    // Import colorTableService dynamically to avoid circular dependencies
    import('./services/colorTableService').then(({ colorTableService }) => {
      colorTableService.forceSyncAllPalettes(
        updatedLayers[0].palette,
        updatedLayers[1].palette,
        updatedLayers[2].palette
      );
    });
  }, [layers]);

  const handleUpdatePaletteColor = useCallback((layerId: number, colorId: string, updates: Partial<PaletteColor>) => {
    // Find the original color before update
    const layer = layers[layerId];
    const originalColor = layer.palette.find(color => color.id === colorId);
    
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

    // Update pixels in canvas if color changed and we have the update function
    if (originalColor && updates.color && pixelUpdateFunction) {
      const layerType = layerId === 0 ? 'red' : layerId === 1 ? 'green' : 'blue';
      pixelUpdateFunction(layerType, originalColor.color, updates.color);
    }

    // Update colorTables.json when palette colors change
    const updatedLayers = layers.map(layer => 
      layer.id === layerId 
        ? { 
            ...layer, 
            palette: layer.palette.map(color => 
              color.id === colorId ? { ...color, ...updates } : color
            )
          }
        : layer
    );
    
    // Import colorTableService dynamically to avoid circular dependencies
    import('./services/colorTableService').then(({ colorTableService }) => {
      colorTableService.forceSyncAllPalettes(
        updatedLayers[0].palette,
        updatedLayers[1].palette,
        updatedLayers[2].palette
      );
    });
  }, [layers, pixelUpdateFunction]);

  const handleRemovePaletteColor = useCallback((layerId: number, colorId: string) => {
    setLayers(prevLayers => 
      prevLayers.map(layer => 
        layer.id === layerId 
          ? { ...layer, palette: layer.palette.filter(color => color.id !== colorId) }
          : layer
      )
    );

    // Update colorTables.json when palette colors are removed
    const updatedLayers = layers.map(layer => 
      layer.id === layerId 
        ? { ...layer, palette: layer.palette.filter(color => color.id !== colorId) }
        : layer
    );
    
    // Import colorTableService dynamically to avoid circular dependencies
    import('./services/colorTableService').then(({ colorTableService }) => {
      colorTableService.forceSyncAllPalettes(
        updatedLayers[0].palette,
        updatedLayers[1].palette,
        updatedLayers[2].palette
      );
    });
  }, [layers]);

  // Initialize default palettes for each layer
  const initializeDefaultPalettes = useCallback(() => {
    const defaultPalettes = {
      environment: [
        { id: 'env-1', name: 'Gras', color: '#4a7c59' },
        { id: 'env-2', name: 'Erde', color: '#8b4513' },
        { id: 'env-3', name: 'Stein', color: '#696969' },
        { id: 'env-4', name: 'Wasser', color: '#4169e1' }
      ],
      entities: [
        { id: 'ent-1', name: 'Spieler', color: '#ff6b6b' },
        { id: 'ent-2', name: 'Feind', color: '#ff4757' },
        { id: 'ent-3', name: 'NPC', color: '#ffa502' },
        { id: 'ent-4', name: 'Item', color: '#ff6348' }
      ],
      functions: [
        { id: 'func-1', name: 'Tür', color: '#2f3542' },
        { id: 'func-2', name: 'Schalter', color: '#ffa502' },
        { id: 'func-3', name: 'Truhe', color: '#8b4513' },
        { id: 'func-4', name: 'Portal', color: '#5f27cd' }
      ]
    };

    console.log('🎨 Initializing default palettes:', defaultPalettes);

    setLayers(prevLayers => 
      prevLayers.map((layer, index) => {
        const layerName = layer.name.toLowerCase();
        const palette = defaultPalettes[layerName as keyof typeof defaultPalettes] || [];
        console.log(`🎨 Setting palette for ${layerName}:`, palette);
        return {
          ...layer,
          palette: palette
        };
      })
    );

    // Save to localStorage
    localStorage.setItem('pixel-painter-palettes', JSON.stringify(defaultPalettes));
    console.log('🎨 Saved default palettes to localStorage');
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
          console.log('🎨 Loaded palettes from localStorage:', palettes);
        } else {
          // Initialize default palettes if none exist
          console.log('🎨 No saved palettes found, initializing defaults');
          initializeDefaultPalettes();
        }

        // Load color table
        const savedColorTable = localStorage.getItem('pixel-painter-color-table');
        if (savedColorTable) {
          setColorTable(JSON.parse(savedColorTable));
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
        } else {
          setCurrentColor(null); // No color selected by default
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
  }, []);

  // Auto-select first color from current layer's palette on app start
  useEffect(() => {
    const layerIndex = currentLayer === 'red' ? 0 : currentLayer === 'green' ? 1 : 2;
    const layerPalette = layers[layerIndex]?.palette || [];
    
    // Always auto-select first color if palette has colors and no color is selected
    if (!currentColor && layerPalette.length > 0) {
      const firstColor = layerPalette[0].color;
      setCurrentColor(firstColor);
      console.log('🎨 Auto-selected first color from palette:', firstColor);
    }
  }, [currentLayer, layers, currentColor]);

  // Force auto-select color when layers are loaded
  useEffect(() => {
    if (layers.length > 0) {
      const layerIndex = currentLayer === 'red' ? 0 : currentLayer === 'green' ? 1 : 2;
      const layerPalette = layers[layerIndex]?.palette || [];
      
      if (layerPalette.length > 0 && !currentColor) {
        const firstColor = layerPalette[0].color;
        setCurrentColor(firstColor);
        console.log('🎨 Force auto-selected first color from loaded palette:', firstColor);
      }
    }
  }, [layers, currentLayer, currentColor]);

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

  // Save color table to localStorage when it changes
  useEffect(() => {
    const saveColorTableToStorage = () => {
      try {
        localStorage.setItem('pixel-painter-color-table', JSON.stringify(colorTable));
      } catch (error) {
        console.error('Failed to save color table to localStorage:', error);
      }
    };

    // Debounce saves to avoid too many localStorage writes
    const timeoutId = setTimeout(saveColorTableToStorage, 500);
    return () => clearTimeout(timeoutId);
  }, [colorTable]);

  // Save current color to localStorage when it changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentColor) {
        localStorage.setItem('pixel-painter-current-color', currentColor);
      } else {
        localStorage.removeItem('pixel-painter-current-color');
      }
    }, 500); // Debounce by 500ms

    return () => clearTimeout(timeoutId);
  }, [currentColor]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Pixel Painter</h1>
        <div className="app-controls">
          <FileOperations 
            canvasSize={canvasSize}
            onCanvasSizeChange={handleCanvasSizeChange}
            layers={layers}
            colorTable={colorTable}
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
          gridColor={gridColor}
          gridThickness={gridThickness}
          onGridToggle={handleGridToggle}
          onGridColorChange={setGridColor}
          onGridThicknessChange={handleGridThicknessChange}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          patternSize={patternSize}
          patternOpacity={patternOpacity}
          patternAnimationSpeed={patternAnimationSpeed}
          patternType={patternType}
          patternColor={patternColor}
          backgroundColor={backgroundColor}
          patternAnimationType={patternAnimationType}
          onPatternSizeChange={handlePatternSizeChange}
          onPatternOpacityChange={handlePatternOpacityChange}
          onPatternAnimationSpeedChange={handlePatternAnimationSpeedChange}
          onPatternTypeChange={handlePatternTypeChange}
          onPatternColorChange={handlePatternColorChange}
          onBackgroundColorChange={handleBackgroundColorChange}
          onPatternAnimationTypeChange={handlePatternAnimationTypeChange}
          channelValueMode={channelValueMode}
          onChannelValueModeToggle={handleChannelValueModeToggle}
        />
      </div>
      
      <div className="app-content">
        <div className={`app-sidebar ${activeColorTab === 'table' ? 'color-table-active' : ''}`}>
          {activeColorTab === 'picker' ? (
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
              colorTable={colorTable}
              onColorTableChange={updateColorTableAndJson}
              layerPalettes={getAllLayerPalettes()}
              activeTab={activeColorTab}
              onTabChange={handleColorTabChange}
            />
          ) : (
            <div className="color-table-container">
              <div className="color-picker-tabs">
                <button
                  className={`color-picker-tab ${activeColorTab === 'picker' ? 'active' : ''}`}
                  onClick={() => handleColorTabChange('picker')}
                >
                  <span className="material-icons">palette</span>
                  Painter
                </button>
                <button
                  className={`color-picker-tab ${activeColorTab === 'table' ? 'active' : ''}`}
                  onClick={() => handleColorTabChange('table')}
                >
                  <span className="material-icons">table_chart</span>
                  Kanäle
                </button>
              </div>
              
              <ColorTableCards
                colorTable={colorTable}
                onColorTableChange={updateColorTableAndJson}
                currentLayer={currentLayer}
                layers={layers}
              />
            </div>
          )}
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
            gridColor={gridColor}
            gridThickness={gridThickness}
            onHistoryUpdate={handleHistoryUpdate}
            onZoomChange={handleZoomChange}
            historyData={history[historyIndex]}
            currentLayer={currentLayer}
            layers={layers}
            colorTable={colorTable}
            onPixelUpdateReady={handlePixelUpdateReady}
            patternSize={patternSize}
            patternOpacity={patternOpacity}
            patternAnimationSpeed={patternAnimationSpeed}
            patternType={patternType}
            patternColor={patternColor}
            backgroundColor={backgroundColor}
            patternAnimationType={patternAnimationType}
            channelValueMode={channelValueMode}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
