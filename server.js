"use strict";

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;
const PALETTES_FILE = path.join(__dirname, 'palettes.json');
const COLOR_TABLES_FILE = path.join(__dirname, 'src', 'data', 'colorTables.json');

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
async function startServer() {
  await ensurePalettesFile();
  
  app.listen(PORT, () => {
    console.log(`Palette server running on http://localhost:${PORT}`);
    console.log(`Palettes file: ${PALETTES_FILE}`);
  });
}

startServer().catch(console.error);
