"use strict";

import React, { useState, useCallback, useEffect } from 'react';
import PixelCanvasSimple from './components/PixelCanvasSimple';
import Toolbar from './components/Toolbar';
import ColorPicker from './components/ColorPicker';
import FileOperations from './components/FileOperations';
import Footer from './components/Footer';
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

  // Color table is now managed server-side only - AUTO-SYNC DISABLED
  const updateColorTableAndJson = useCallback((newColorTable: ColorTableEntry[] | ((prev: ColorTableEntry[]) => ColorTableEntry[])) => {
    // Handle both direct array and functional update
    setColorTable(prevTable => {
      const actualColorTable = typeof newColorTable === 'function' 
        ? newColorTable(prevTable) 
        : newColorTable;
      
      // Update the ColorTableService to sync with server
      import('./services/colorTableService').then(({ colorTableService }) => {
        // Update the service with the new color table data (automatically syncs to server)
        colorTableService.updateColorTableFromArray(actualColorTable);
      }).catch(error => {
        console.error('🔧 App: Error importing ColorTableService:', error);
      });
      
      return actualColorTable;
    });
  }, []);


  // Load initial color table data from server
  useEffect(() => {
    const loadInitialColorTable = async () => {
      try {
        // Load from server API
        const response = await fetch('http://localhost:3001/api/color-tables', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        if (response.ok) {
          const colorTables = await response.json();
          // Load all color tables, not just current layer
          const allColorTables = [
            ...(colorTables.red || []),
            ...(colorTables.green || []),
            ...(colorTables.blue || [])
          ];
          setColorTable(allColorTables);
          console.log('🔧 App: Loaded all color tables from server', allColorTables);
          
          // Update palettes based on loaded color tables
          setLayers(prevLayers => {
            const updatedLayers = [...prevLayers];
            
            // Update red layer palette
            if (colorTables.red && colorTables.red.length > 0) {
              updatedLayers[0] = {
                ...updatedLayers[0],
                palette: colorTables.red.map(entry => ({
                  color: entry.color,
                  name: entry.name
                }))
              };
            }
            
            // Update green layer palette
            if (colorTables.green && colorTables.green.length > 0) {
              updatedLayers[1] = {
                ...updatedLayers[1],
                palette: colorTables.green.map(entry => ({
                  color: entry.color,
                  name: entry.name
                }))
              };
            }
            
            // Update blue layer palette
            if (colorTables.blue && colorTables.blue.length > 0) {
              updatedLayers[2] = {
                ...updatedLayers[2],
                palette: colorTables.blue.map(entry => ({
                  color: entry.color,
                  name: entry.name
                }))
              };
            }
            
            console.log('🔧 App: Updated palettes from color tables', updatedLayers);
            return updatedLayers;
          });
        } else {
          console.error('Failed to load color tables from server');
          setColorTable([]);
        }
      } catch (error) {
        console.error('🔧 App: Error loading initial color table from server:', error);
        setColorTable([]);
      }
    };
    
    loadInitialColorTable();
  }, []); // Only run once on mount
  const [activeColorTab, setActiveColorTab] = useState<'picker'>(() => {
    return 'picker';
  });
  const [pixelUpdateFunction, setPixelUpdateFunction] = useState<((layerType: LayerType, oldColor: string, newColor: string) => void) | null>(null);

  const handleToolChange = useCallback((tool: Tool) => {
    setCurrentTool(tool);
    localStorage.setItem('pixel-painter-current-tool', tool);
  }, []);

  const handleColorChange = useCallback((color: string | null) => {
    setCurrentColor(color);
    if (color) {
      localStorage.setItem('pixel-painter-current-color', color);
    } else {
      localStorage.removeItem('pixel-painter-current-color');
    }
  }, []);

  // Auto-add color to palette when painting with RGB color
  const handleAutoAddColorToPalette = useCallback((color: string) => {
    const layerIndex = currentLayer === 'red' ? 0 : currentLayer === 'green' ? 1 : 2;
    const layerPalette = layers[layerIndex]?.palette || [];
    
    // Check if color already exists in palette
    const existingColor = layerPalette.find(p => p.color === color);
    if (!existingColor) {
      // Add new color to palette - we'll define handleAddColorToPalette later
      const newColor: PaletteColor = {
        id: Date.now().toString(),
        name: `RGB-${color}`,
        color: color
      };
      
      const updatedLayers = [...layers];
      updatedLayers[layerIndex] = {
        ...updatedLayers[layerIndex],
        palette: [...updatedLayers[layerIndex].palette, newColor]
      };
      setLayers(updatedLayers);
      
      // Set as current color
      setCurrentColor(color);
      console.log('🎨 Auto-added color to palette and selected:', color);
    } else {
      // Use existing color
      setCurrentColor(color);
      console.log('🎨 Selected existing color from palette:', color);
    }
  }, [currentLayer, layers]);

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

  // Handle color tab change (only picker tab now)
  const handleColorTabChange = useCallback((tab: 'picker') => {
    setActiveColorTab(tab);
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

    // Auto-sync to colorTables.json DISABLED to prevent refreshes
    // const updatedLayers = layers.map(layer => 
    //   layer.id === layerId 
    //     ? { 
    //         ...layer, 
    //         palette: layer.palette.map(color => 
    //           color.id === colorId ? { ...color, ...updates } : color
    //         )
    //       }
    //     : layer
    // );
    
    // Import colorTableService dynamically to avoid circular dependencies - DISABLED
    // import('./services/colorTableService').then(({ colorTableService }) => {
    //   colorTableService.forceSyncAllPalettes(
    //     updatedLayers[0].palette,
    //     updatedLayers[1].palette,
    //     updatedLayers[2].palette
    //   );
    // }).catch(error => {
    //   console.error('🔧 App: Error syncing color tables:', error);
    // });
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

  // Initialize default palettes from server storage only
  const initializeDefaultPalettes = useCallback(async () => {
    try {
      // Load from server API instead of localStorage
      const response = await fetch('http://localhost:3001/api/color-tables', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      if (response.ok) {
        const colorTables = await response.json();
        
        const defaultPalettes = {
          environment: colorTables.red.map((entry, index) => ({
            id: `env-${index + 1}`,
            name: entry.name,
            color: entry.color
          })),
          entities: colorTables.green.map((entry, index) => ({
            id: `ent-${index + 1}`,
            name: entry.name,
            color: entry.color
          })),
          functions: colorTables.blue.map((entry, index) => ({
            id: `func-${index + 1}`,
            name: entry.name,
            color: entry.color
          }))
        };

        console.log('🎨 Loaded palettes from server:', defaultPalettes);

        setLayers(prevLayers => 
          prevLayers.map((layer, index) => {
            // Map layer names to palette keys
            const layerName = layer.name.toLowerCase();
            let paletteKey = '';
            
            if (layerName === 'environment') {
              paletteKey = 'environment';
            } else if (layerName === 'entities') {
              paletteKey = 'entities';
            } else if (layerName === 'functions') {
              paletteKey = 'functions';
            }
            
            const palette = defaultPalettes[paletteKey] || [];
            console.log(`🎨 Setting palette for ${layerName} (${paletteKey}):`, palette);
            return {
              ...layer,
              palette: palette
            };
          })
        );
      } else {
        console.error('Failed to load color tables from server');
        // Fallback to empty palettes
        setLayers(prevLayers => 
          prevLayers.map(layer => ({ ...layer, palette: [] }))
        );
      }
    } catch (error) {
      console.error('Error loading palettes from server:', error);
      // Fallback to empty palettes
      setLayers(prevLayers => 
        prevLayers.map(layer => ({ ...layer, palette: [] }))
      );
    }
  }, []);

  // Load palettes from server on component mount - DISABLED to prevent refreshes
  // useEffect(() => {
  //   const loadStateFromStorage = () => {
  //     try {
  //       // Always load palettes from server, no localStorage
  //       console.log('🎨 Loading palettes from server');
  //       initializeDefaultPalettes();

  //       // Color table is now managed by ColorTableService (server-side)

  //       // Load current tool
  //       const savedTool = localStorage.getItem('pixel-painter-current-tool');
  //       if (savedTool) {
  //         setCurrentTool(savedTool as Tool);
  //       }

  //       // Load current color
  //       const savedColor = localStorage.getItem('pixel-painter-current-color');
  //       if (savedColor) {
  //         setCurrentColor(savedColor);
  //       } else {
  //         setCurrentColor(null); // No color selected by default
  //       }

  //       // Load current layer
  //       const savedLayer = localStorage.getItem('pixel-painter-current-layer');
  //       if (savedLayer) {
  //         setCurrentLayer(savedLayer as LayerType);
  //       }

  //       // Load brush size
  //       const savedBrushSize = localStorage.getItem('pixel-painter-brush-size');
  //       if (savedBrushSize) {
  //         setBrushSize(parseInt(savedBrushSize));
  //       }
  //     } catch (error) {
  //       console.error('Failed to load state from localStorage:', error);
  //     }
  //   };

  //   loadStateFromStorage();
  // }, []);

  // Single auto-select color effect - DISABLED to prevent refreshes
  // useEffect(() => {
  //   if (layers.length === 0) return; // Wait for layers to load
  //   
  //   const layerIndex = currentLayer === 'red' ? 0 : currentLayer === 'green' ? 1 : 2;
  //   const layerPalette = layers[layerIndex]?.palette || [];
  //   
  //   if (layerPalette.length === 0) return; // No colors in palette
  //   
  //   // Check if we have a saved color in localStorage
  //   const savedColor = localStorage.getItem('pixel-painter-current-color');
  //   
  //   if (savedColor) {
  //     // Check if saved color exists in current layer's palette
  //     const colorExists = layerPalette.find(p => p.color === savedColor);
  //     if (colorExists) {
  //       setCurrentColor(savedColor);
  //       console.log('🎨 Restored saved color from localStorage:', savedColor);
  //       return;
  //     }
  //   }
  //   
  //   // If no current color or current color doesn't exist in palette, select first available
  //   if (!currentColor || !layerPalette.find(p => p.color === currentColor)) {
  //     const firstColor = layerPalette[0].color;
  //     setCurrentColor(firstColor);
  //     console.log('🎨 Auto-selected first color from palette:', firstColor);
  //   }
  // }, [layers, currentLayer]); // Only depend on layers and currentLayer

  // Palettes are now managed server-side, no localStorage saving needed

  // Color table is now managed server-side, no localStorage saving needed

  // Save current color to localStorage when it changes - DISABLED to prevent refreshes
  // useEffect(() => {
  //   const timeoutId = setTimeout(() => {
  //     if (currentColor) {
  //       localStorage.setItem('pixel-painter-current-color', currentColor);
  //     } else {
  //       localStorage.removeItem('pixel-painter-current-color');
  //     }
  //   }, 500); // Debounce by 500ms

  //   return () => clearTimeout(timeoutId);
  // }, [currentColor]);

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
            colorTable={colorTable}
            onColorTableChange={updateColorTableAndJson}
            layerPalettes={getAllLayerPalettes()}
            activeTab={activeColorTab}
            onTabChange={handleColorTabChange}
            onAutoAddColorToPalette={handleAutoAddColorToPalette}
          />
        </div>
        
        <div className="app-main">
          <PixelCanvasSimple
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
            onAutoAddColorToPalette={handleAutoAddColorToPalette}
            currentRgbColor={currentColor}
          />
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default App;
