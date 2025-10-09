"use strict";

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;
const PALETTES_FILE = path.join(__dirname, 'palettes.json');
const COLOR_TABLES_FILE = path.join(__dirname, 'src', 'data', 'colorTables.json');
const IMAGE_CACHE_FILE = path.join(__dirname, 'image-cache.json');
const IMAGES_FOLDER = path.join(__dirname, 'images');

// Middleware
app.use(cors());
app.use(express.json());

// Ensure palettes file exists
async function ensurePalettesFile() {
  try {
    await fs.access(PALETTES_FILE);
  } catch (error) {
    // File doesn't exist, create it with default data
    const defaultState = {
      palettes: {
        environment: [],
        entities: [],
        functions: []
      },
      appState: {
        currentTool: 'brush',
        currentColor: '#ff0000',
        currentLayer: 'red',
        brushSize: 1,
        canvasSize: 16,
        zoom: 2,
        showGrid: true
      }
    };
    await fs.writeFile(PALETTES_FILE, JSON.stringify(defaultState, null, 2));
  }
}

// Load state from file
async function loadState() {
  try {
    const data = await fs.readFile(PALETTES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading state:', error);
    return {
      palettes: {
        environment: [],
        entities: [],
        functions: []
      },
      appState: {
        currentTool: 'brush',
        currentColor: '#ff0000',
        currentLayer: 'red',
        brushSize: 1,
        canvasSize: 16,
        zoom: 2,
        showGrid: true
      }
    };
  }
}

// Save state to file
async function saveState(state) {
  try {
    await fs.writeFile(PALETTES_FILE, JSON.stringify(state, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving state:', error);
    return false;
  }
}

// Load color tables from file
async function loadColorTables() {
  try {
    const data = await fs.readFile(COLOR_TABLES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading color tables:', error);
    return {
      red: [],
      green: [],
      blue: []
    };
  }
}

// Save color tables to file
async function saveColorTables(colorTables) {
  try {
    // Ensure the directory exists
    const dir = path.dirname(COLOR_TABLES_FILE);
    await fs.mkdir(dir, { recursive: true });
    
    // Write the file
    await fs.writeFile(COLOR_TABLES_FILE, JSON.stringify(colorTables, null, 2));
    console.log('🔧 Server: Successfully wrote colorTables.json to:', COLOR_TABLES_FILE);
    return true;
  } catch (error) {
    console.error('Error saving color tables:', error);
    return false;
  }
}

// Load image cache from file
async function loadImageCache() {
  try {
    const data = await fs.readFile(IMAGE_CACHE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log('No image cache file found, creating new one');
    return {
      layers: {
        red: null,
        green: null,
        blue: null
      },
      timestamp: null,
      canvasSize: 16
    };
  }
}

// Save image cache to file
async function saveImageCache(cacheData) {
  try {
    await fs.writeFile(IMAGE_CACHE_FILE, JSON.stringify(cacheData, null, 2));
    console.log('🖼️ Server: Successfully saved image cache');
    return true;
  } catch (error) {
    console.error('Error saving image cache:', error);
    return false;
  }
}

// Clear image cache
async function clearImageCache() {
  try {
    await fs.unlink(IMAGE_CACHE_FILE);
    console.log('🗑️ Server: Image cache cleared');
    return true;
  } catch (error) {
    // File might not exist, which is fine
    console.log('Image cache file not found, nothing to clear');
    return true;
  }
}

// Ensure images folder exists
async function ensureImagesFolder() {
  try {
    await fs.mkdir(IMAGES_FOLDER, { recursive: true });
  } catch (error) {
    console.error('Error creating images folder:', error);
  }
}

// Save PNG files to images folder (overwrite existing files)
async function savePngFiles(layers, canvasSize) {
  try {
    await ensureImagesFolder();
    
    // Check if layers have new structure (color + channel) or old structure (single base64)
    const hasNewStructure = layers.red && typeof layers.red === 'object' && layers.red.color && layers.red.channel;
    
    if (hasNewStructure) {
      // New structure: save both color and channel versions
      const redColorBuffer = Buffer.from(layers.red.color, 'base64');
      const redChannelBuffer = Buffer.from(layers.red.channel, 'base64');
      const greenColorBuffer = Buffer.from(layers.green.color, 'base64');
      const greenChannelBuffer = Buffer.from(layers.green.channel, 'base64');
      const blueColorBuffer = Buffer.from(layers.blue.color, 'base64');
      const blueChannelBuffer = Buffer.from(layers.blue.channel, 'base64');
      
      const redColorPath = path.join(IMAGES_FOLDER, 'layer-red-color.png');
      const redChannelPath = path.join(IMAGES_FOLDER, 'layer-red-channel.png');
      const greenColorPath = path.join(IMAGES_FOLDER, 'layer-green-color.png');
      const greenChannelPath = path.join(IMAGES_FOLDER, 'layer-green-channel.png');
      const blueColorPath = path.join(IMAGES_FOLDER, 'layer-blue-color.png');
      const blueChannelPath = path.join(IMAGES_FOLDER, 'layer-blue-channel.png');
      
      await Promise.all([
        // Save color versions (Painter Value)
        fs.writeFile(redColorPath, redColorBuffer),
        fs.writeFile(greenColorPath, greenColorBuffer),
        fs.writeFile(blueColorPath, blueColorBuffer),
        // Save channel versions (Channel Value)
        fs.writeFile(redChannelPath, redChannelBuffer),
        fs.writeFile(greenChannelPath, greenChannelBuffer),
        fs.writeFile(blueChannelPath, blueChannelBuffer)
      ]);
      
      console.log('🖼️ Server: PNG files updated in images folder (color + channel versions)');
      return {
        red: { color: 'layer-red-color.png', channel: 'layer-red-channel.png' },
        green: { color: 'layer-green-color.png', channel: 'layer-green-channel.png' },
        blue: { color: 'layer-blue-color.png', channel: 'layer-blue-channel.png' }
      };
    } else {
      // Old structure: save single versions (backward compatibility)
      const redBuffer = Buffer.from(layers.red, 'base64');
      const greenBuffer = Buffer.from(layers.green, 'base64');
      const blueBuffer = Buffer.from(layers.blue, 'base64');
      
      const redPath = path.join(IMAGES_FOLDER, 'layer-environment.png');
      const greenPath = path.join(IMAGES_FOLDER, 'layer-entities.png');
      const bluePath = path.join(IMAGES_FOLDER, 'layer-functions.png');
      
      await Promise.all([
        fs.writeFile(redPath, redBuffer),
        fs.writeFile(greenPath, greenBuffer),
        fs.writeFile(bluePath, blueBuffer)
      ]);
      
      console.log('🖼️ Server: PNG files updated in images folder (legacy format)');
      return {
        red: 'layer-environment.png',
        green: 'layer-entities.png',
        blue: 'layer-functions.png'
      };
    }
  } catch (error) {
    console.error('Error saving PNG files:', error);
    return null;
  }
}

// Load PNG files from images folder
async function loadPngFiles() {
  try {
    const redPath = path.join(IMAGES_FOLDER, 'layer-environment.png');
    const greenPath = path.join(IMAGES_FOLDER, 'layer-entities.png');
    const bluePath = path.join(IMAGES_FOLDER, 'layer-functions.png');
    
    // Check if all three files exist
    try {
      await Promise.all([
        fs.access(redPath),
        fs.access(greenPath),
        fs.access(bluePath)
      ]);
    } catch (error) {
      // Files don't exist
      return null;
    }
    
    const redBuffer = await fs.readFile(redPath);
    const greenBuffer = await fs.readFile(greenPath);
    const blueBuffer = await fs.readFile(bluePath);
    
    return {
      layers: {
        red: redBuffer.toString('base64'),
        green: greenBuffer.toString('base64'),
        blue: blueBuffer.toString('base64')
      },
      files: {
        red: 'layer-environment.png',
        green: 'layer-entities.png',
        blue: 'layer-functions.png'
      }
    };
  } catch (error) {
    console.error('Error loading PNG files:', error);
    return null;
  }
}

// Clear PNG files from images folder
async function clearPngFiles() {
  try {
    const redPath = path.join(IMAGES_FOLDER, 'layer-environment.png');
    const greenPath = path.join(IMAGES_FOLDER, 'layer-entities.png');
    const bluePath = path.join(IMAGES_FOLDER, 'layer-functions.png');
    
    // Try to delete each file (ignore errors if files don't exist)
    await Promise.allSettled([
      fs.unlink(redPath),
      fs.unlink(greenPath),
      fs.unlink(bluePath)
    ]);
    
    console.log('🗑️ Server: PNG files cleared from images folder');
    return true;
  } catch (error) {
    console.error('Error clearing PNG files:', error);
    return false;
  }
}

// Routes
app.get('/api/state', async (req, res) => {
  try {
    const state = await loadState();
    res.json(state);
  } catch (error) {
    console.error('Error getting state:', error);
    res.status(500).json({ error: 'Failed to load state' });
  }
});

app.get('/api/palettes', async (req, res) => {
  try {
    const state = await loadState();
    res.json(state.palettes);
  } catch (error) {
    console.error('Error getting palettes:', error);
    res.status(500).json({ error: 'Failed to load palettes' });
  }
});

app.post('/api/state', async (req, res) => {
  try {
    const { palettes, appState } = req.body;
    
    if (!palettes || !appState) {
      return res.status(400).json({ error: 'Palettes and appState are required' });
    }

    const newState = { palettes, appState };
    const success = await saveState(newState);
    
    if (success) {
      res.json({ success: true, state: newState });
    } else {
      res.status(500).json({ error: 'Failed to save state' });
    }
  } catch (error) {
    console.error('Error saving state:', error);
    res.status(500).json({ error: 'Failed to save state' });
  }
});

app.post('/api/palettes', async (req, res) => {
  try {
    const { layer, palettes } = req.body;
    
    if (!layer || !palettes) {
      return res.status(400).json({ error: 'Layer and palettes are required' });
    }

    const currentState = await loadState();
    currentState.palettes[layer] = palettes;
    
    const success = await saveState(currentState);
    
    if (success) {
      res.json({ success: true, palettes: currentState.palettes });
    } else {
      res.status(500).json({ error: 'Failed to save palettes' });
    }
  } catch (error) {
    console.error('Error saving palettes:', error);
    res.status(500).json({ error: 'Failed to save palettes' });
  }
});

app.put('/api/palettes/:layer', async (req, res) => {
  try {
    const { layer } = req.params;
    const { palettes } = req.body;
    
    if (!palettes) {
      return res.status(400).json({ error: 'Palettes are required' });
    }

    const currentState = await loadState();
    currentState.palettes[layer] = palettes;
    
    const success = await saveState(currentState);
    
    if (success) {
      res.json({ success: true, palettes: currentState.palettes[layer] });
    } else {
      res.status(500).json({ error: 'Failed to update palettes' });
    }
  } catch (error) {
    console.error('Error updating palettes:', error);
    res.status(500).json({ error: 'Failed to update palettes' });
  }
});

// Color Tables API
app.get('/api/color-tables', async (req, res) => {
  try {
    const colorTables = await loadColorTables();
    res.json(colorTables);
  } catch (error) {
    console.error('Error getting color tables:', error);
    res.status(500).json({ error: 'Failed to load color tables' });
  }
});

app.post('/api/color-tables', async (req, res) => {
  try {
    const colorTables = req.body;
    
    if (!colorTables || typeof colorTables !== 'object') {
      return res.status(400).json({ error: 'Color tables data is required' });
    }

    const success = await saveColorTables(colorTables);
    
    if (success) {
      res.json({ success: true, colorTables });
    } else {
      res.status(500).json({ error: 'Failed to save color tables' });
    }
  } catch (error) {
    console.error('Error saving color tables:', error);
    res.status(500).json({ error: 'Failed to save color tables' });
  }
});

app.put('/api/color-tables/:layer', async (req, res) => {
  try {
    const { layer } = req.params;
    const { colorTable } = req.body;
    
    if (!colorTable || !Array.isArray(colorTable)) {
      return res.status(400).json({ error: 'Color table array is required' });
    }

    const currentColorTables = await loadColorTables();
    currentColorTables[layer] = colorTable;
    
    const success = await saveColorTables(currentColorTables);
    
    if (success) {
      res.json({ success: true, colorTable: currentColorTables[layer] });
    } else {
      res.status(500).json({ error: 'Failed to update color table' });
    }
  } catch (error) {
    console.error('Error updating color table:', error);
    res.status(500).json({ error: 'Failed to update color table' });
  }
});

// Image Cache API
app.get('/api/image-cache', async (req, res) => {
  try {
    // Try to load from PNG files first
    const pngData = await loadPngFiles();
    if (pngData) {
      res.json({
        layers: pngData.layers,
        timestamp: new Date().toISOString(),
        canvasSize: 16, // Default, could be enhanced
        source: 'png'
      });
      return;
    }
    
    // Fallback to JSON cache
    const cache = await loadImageCache();
    res.json({
      ...cache,
      source: 'json'
    });
  } catch (error) {
    console.error('Error getting image cache:', error);
    res.status(500).json({ error: 'Failed to load image cache' });
  }
});

app.post('/api/image-cache', async (req, res) => {
  try {
    const { layers, canvasSize } = req.body;
    
    if (!layers || !canvasSize) {
      return res.status(400).json({ error: 'Layers and canvasSize are required' });
    }

    // Save as JSON cache (for compatibility)
    const cacheData = {
      layers,
      timestamp: new Date().toISOString(),
      canvasSize
    };
    
    const cacheSuccess = await saveImageCache(cacheData);
    
    // Save as PNG files
    const pngFiles = await savePngFiles(layers, canvasSize);
    
    if (cacheSuccess && pngFiles) {
      res.json({ 
        success: true, 
        cache: cacheData,
        pngFiles: pngFiles
      });
    } else {
      res.status(500).json({ error: 'Failed to save image cache or PNG files' });
    }
  } catch (error) {
    console.error('Error saving image cache:', error);
    res.status(500).json({ error: 'Failed to save image cache' });
  }
});

app.delete('/api/image-cache', async (req, res) => {
  try {
    const cacheSuccess = await clearImageCache();
    const pngSuccess = await clearPngFiles();
    
    if (cacheSuccess && pngSuccess) {
      res.json({ success: true, message: 'Image cache and PNG files cleared' });
    } else {
      res.status(500).json({ error: 'Failed to clear image cache or PNG files' });
    }
  } catch (error) {
    console.error('Error clearing image cache:', error);
    res.status(500).json({ error: 'Failed to clear image cache' });
  }
});

// Get image ages
app.get('/api/image-ages', async (req, res) => {
  try {
    // Check for new structure first (color + channel files)
    const redColorPath = path.join(IMAGES_FOLDER, 'layer-red-color.png');
    const redChannelPath = path.join(IMAGES_FOLDER, 'layer-red-channel.png');
    const greenColorPath = path.join(IMAGES_FOLDER, 'layer-green-color.png');
    const greenChannelPath = path.join(IMAGES_FOLDER, 'layer-green-channel.png');
    const blueColorPath = path.join(IMAGES_FOLDER, 'layer-blue-color.png');
    const blueChannelPath = path.join(IMAGES_FOLDER, 'layer-blue-channel.png');
    
    // Fallback to old structure
    const redLegacyPath = path.join(IMAGES_FOLDER, 'layer-environment.png');
    const greenLegacyPath = path.join(IMAGES_FOLDER, 'layer-entities.png');
    const blueLegacyPath = path.join(IMAGES_FOLDER, 'layer-functions.png');
    
    const calculateAge = (lastModified) => {
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

    const getAge = async (filePath) => {
      try {
        const stats = await fs.stat(filePath);
        return calculateAge(stats.mtime);
      } catch (error) {
        return 'Nicht vorhanden';
      }
    };

    // Check if new structure exists
    try {
      await fs.access(redColorPath);
      // New structure exists
      const [redColorAge, redChannelAge, greenColorAge, greenChannelAge, blueColorAge, blueChannelAge] = await Promise.all([
        getAge(redColorPath),
        getAge(redChannelPath),
        getAge(greenColorPath),
        getAge(greenChannelPath),
        getAge(blueColorPath),
        getAge(blueChannelPath)
      ]);

      res.json({
        red: { color: redColorAge, channel: redChannelAge },
        green: { color: greenColorAge, channel: greenChannelAge },
        blue: { color: blueColorAge, channel: blueChannelAge }
      });
    } catch (error) {
      // Fallback to legacy structure
      const [redAge, greenAge, blueAge] = await Promise.all([
        getAge(redLegacyPath),
        getAge(greenLegacyPath),
        getAge(blueLegacyPath)
      ]);

      res.json({
        red: redAge,
        green: greenAge,
        blue: blueAge
      });
    }
  } catch (error) {
    console.error('Error getting image ages:', error);
    res.status(500).json({ error: 'Failed to get image ages' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
async function startServer() {
  await ensurePalettesFile();
  await ensureImagesFolder();
  
  app.listen(PORT, () => {
    console.log(`Palette server running on http://localhost:${PORT}`);
    console.log(`Palettes file: ${PALETTES_FILE}`);
    console.log(`Images folder: ${IMAGES_FOLDER}`);
  });
}

startServer().catch(console.error);
