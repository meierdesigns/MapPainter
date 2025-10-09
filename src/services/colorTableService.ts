import colorTablesData from '../data/colorTables.json';

export interface ColorTableEntry {
  id: string;
  name: string;
  redChannel: number;
  greenChannel: number;
  blueChannel: number;
  color: string;
  channelValue: number; // Specific channel value for the layer this entry belongs to
}

export interface ColorTables {
  red: ColorTableEntry[]; // Environment
  green: ColorTableEntry[]; // Entities
  blue: ColorTableEntry[]; // Functions
}

class ColorTableService {
  private colorTables: ColorTables = {
    red: [],
    green: [],
    blue: []
  };

  constructor() {
    this.loadFromStorage();
    // Try to load from server on startup
    this.loadFromServer().catch(error => {
      console.log('🔧 ColorTableService: Server not available, using localStorage data');
    });
  }

  // Load color tables from localStorage
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('pixel-painter-color-tables');
      if (stored) {
        this.colorTables = JSON.parse(stored);
        
        // Add missing channelValue fields to existing entries
        this.migrateChannelValues();
      } else {
        // Initialize with default data from colorTables.json
        this.colorTables = colorTablesData;
        console.log('🔧 ColorTableService: Initialized with colorTables.json data');
      }
    } catch (error) {
      console.error('Failed to load color tables from localStorage:', error);
      // Fallback to colorTables.json data
      this.colorTables = colorTablesData;
      console.log('🔧 ColorTableService: Fallback to colorTables.json data');
    }
  }

  // Migrate existing entries to include channelValue fields
  private migrateChannelValues(): void {
    let hasChanges = false;
    
    Object.entries(this.colorTables).forEach(([layer, entries]) => {
      entries.forEach((entry: ColorTableEntry, index: number) => {
        if (entry.channelValue === undefined) {
          // Add missing channelValue based on the layer
          const layerType = layer as 'red' | 'green' | 'blue';
          entry.channelValue = layerType === 'red' ? entry.redChannel : 
                              layerType === 'green' ? entry.greenChannel : 
                              entry.blueChannel;
          hasChanges = true;
          console.log('🔧 ColorTableService: Added missing channelValue to entry', { 
            entryId: entry.id, 
            layer: layerType, 
            channelValue: entry.channelValue 
          });
        }
      });
    });
    
    if (hasChanges) {
      this.saveToStorage();
      console.log('🔧 ColorTableService: Migrated channelValue fields and saved to storage');
    }
  }

  // Save color tables to localStorage
  private saveToStorage(): void {
    try {
      localStorage.setItem('pixel-painter-color-tables', JSON.stringify(this.colorTables));
    } catch (error) {
      console.error('Failed to save color tables to localStorage:', error);
    }
  }

  // Get color table for a specific layer
  getColorTable(layer: 'red' | 'green' | 'blue'): ColorTableEntry[] {
    return this.colorTables[layer] || [];
  }

  // Set color table for a specific layer
  setColorTable(layer: 'red' | 'green' | 'blue', table: ColorTableEntry[]): void {
    // Update only the specific layer, keep other layers unchanged
    this.colorTables[layer] = table;
    this.saveToStorage();
    
    // Also update the JSON export via server
    this.updateColorTablesJson().catch(error => {
      console.error('🔧 ColorTableService: Error updating color tables JSON:', error);
    });
  }

  // Sync palette colors to color table for a specific layer
  syncPaletteToColorTable(
    layer: 'red' | 'green' | 'blue', 
    paletteColors: Array<{ color: string; name: string }>
  ): ColorTableEntry[] {
    console.log('🔧 ColorTableService: Syncing palette to color table', { layer, paletteColors });

    const currentTable = this.getColorTable(layer);
    const newTable: ColorTableEntry[] = [];

    paletteColors.forEach((paletteColor, index) => {
      // Check if we already have this color in the table
      const existingEntry = currentTable.find(entry => entry.color === paletteColor.color);
      
      if (existingEntry) {
        // Keep existing entry with its channel modifications
        console.log('🔧 ColorTableService: Keeping existing entry', { existingEntry });
        newTable.push(existingEntry);
      } else {
        // Create new entry with RGB values from the original color
        const rgb = this.hexToRgb(paletteColor.color);
        const newEntry: ColorTableEntry = {
          id: `table-${layer}-${paletteColor.color}-${index}`,
          name: paletteColor.name || `Farbe ${index + 1}`,
          redChannel: rgb.r,
          greenChannel: rgb.g,
          blueChannel: rgb.b,
          color: paletteColor.color,
          channelValue: layer === 'red' ? rgb.r : layer === 'green' ? rgb.g : rgb.b
        };
        
        console.log('🔧 ColorTableService: Creating new entry with channelValue', { 
          paletteColor, 
          rgb, 
          newEntry,
          channelValue: newEntry.channelValue
        });
        
        console.log('🔧 ColorTableService: Creating new entry', { 
          paletteColor, 
          rgb, 
          newEntry 
        });
        newTable.push(newEntry);
      }
    });

    // Update the color table for this layer (this will preserve other layers)
    this.colorTables[layer] = newTable;
    this.saveToStorage();
    
    // Also update the JSON export via server
    this.updateColorTablesJson().catch(error => {
      console.error('🔧 ColorTableService: Error updating color tables JSON:', error);
    });
    
    console.log('🔧 ColorTableService: Updated color table', { 
      layer, 
      newTable, 
      newTableLength: newTable.length 
    });

    return newTable;
  }

  // Sync all palettes to color tables (preserves all channels)
  syncAllPalettesToColorTables(
    redPalette: Array<{ color: string; name: string }>,
    greenPalette: Array<{ color: string; name: string }>,
    bluePalette: Array<{ color: string; name: string }>
  ): void {
    console.log('🔧 ColorTableService: Syncing all palettes to color tables', { 
      redPalette, 
      greenPalette, 
      bluePalette 
    });

    // Sync each layer individually to preserve existing channel modifications
    this.syncPaletteToColorTable('red', redPalette);
    this.syncPaletteToColorTable('green', greenPalette);
    this.syncPaletteToColorTable('blue', bluePalette);
  }

  // Update a specific channel value
  updateChannelValue(
    layer: 'red' | 'green' | 'blue',
    entryId: string,
    channel: 'red' | 'green' | 'blue',
    value: number
  ): void {
    console.log('🔧 ColorTableService: Updating channel value', { layer, entryId, channel, value });

    const table = this.getColorTable(layer);
    const updatedTable = table.map(entry => {
      if (entry.id === entryId) {
        const updatedEntry = {
          ...entry,
          [`${channel}Channel`]: value
          // Keep the original color unchanged
        };
        
        // Update the channelValue if this is the channel for this layer
        const layerFromId = entryId.split('-')[1] as 'red' | 'green' | 'blue';
        if (layerFromId === channel) {
          updatedEntry.channelValue = value;
        }
        
        return updatedEntry;
      }
      return entry;
    });

    // Update the color table (this will also trigger JSON export)
    this.colorTables[layer] = updatedTable;
    this.saveToStorage();
    
    // Also update the JSON export via server
    this.updateColorTablesJson().catch(error => {
      console.error('🔧 ColorTableService: Error updating color tables JSON:', error);
    });
    
    console.log('🔧 ColorTableService: Channel value updated', { 
      layer, 
      entryId, 
      channel, 
      value,
      updatedTable 
    });
  }

  // Hex to RGB conversion
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  // Get all color tables
  getAllColorTables(): ColorTables {
    return this.colorTables;
  }

  // Clear all color tables
  clearAllColorTables(): void {
    this.colorTables = {
      red: [],
      green: [],
      blue: []
    };
    this.saveToStorage();
  }

  // Export color tables to JSON file (server-side only)
  exportToJsonFile(): void {
    try {
      // Save to localStorage as backup - server handles the actual file
      localStorage.setItem('pixel-painter-color-tables-json', JSON.stringify(this.colorTables, null, 2));
      console.log('🔧 ColorTableService: Saved color tables to localStorage as backup');
    } catch (error) {
      console.error('🔧 ColorTableService: Error saving to localStorage:', error);
    }
  }

  // Save color tables to server
  async saveToServer(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3001/api/color-tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.colorTables)
      });

      if (response.ok) {
        console.log('🔧 ColorTableService: Successfully saved color tables to server');
        return true;
      } else {
        console.error('🔧 ColorTableService: Failed to save color tables to server:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('🔧 ColorTableService: Error saving color tables to server:', error);
      return false;
    }
  }

  // Load color tables from server
  async loadFromServer(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3001/api/color-tables');
      
      if (response.ok) {
        const serverColorTables = await response.json();
        this.colorTables = serverColorTables;
        
        // Add missing channelValue fields to existing entries
        this.migrateChannelValues();
        
        this.saveToStorage(); // Also save to localStorage as backup
        console.log('🔧 ColorTableService: Successfully loaded color tables from server');
        return true;
      } else {
        console.error('🔧 ColorTableService: Failed to load color tables from server:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('🔧 ColorTableService: Error loading color tables from server:', error);
      return false;
    }
  }

  // Update colorTables.json data via server
  async updateColorTablesJson(): Promise<void> {
    console.log('🔧 ColorTableService: Current color tables state:', this.colorTables);
    
    // Save to localStorage as backup
    localStorage.setItem('pixel-painter-color-tables-json', JSON.stringify(this.colorTables, null, 2));
    
    // Save to server - this will write to the actual JSON file
    const success = await this.saveToServer();
    if (success) {
      console.log('🔧 ColorTableService: Successfully updated colorTables.json via server');
    } else {
      console.error('🔧 ColorTableService: Failed to update colorTables.json via server');
      // Fallback: trigger manual file write
      this.writeToJsonFile();
    }
  }

  // Write color tables to JSON file manually (server-side only)
  private writeToJsonFile(): void {
    try {
      // Only save to localStorage as backup - server handles the actual file
      localStorage.setItem('pixel-painter-color-tables-json', JSON.stringify(this.colorTables, null, 2));
      console.log('🔧 ColorTableService: Saved color tables to localStorage as backup');
    } catch (error) {
      console.error('🔧 ColorTableService: Error saving to localStorage:', error);
    }
  }

  // Force sync all palettes to color tables
  forceSyncAllPalettes(
    redPalette: Array<{ color: string; name: string }>,
    greenPalette: Array<{ color: string; name: string }>,
    bluePalette: Array<{ color: string; name: string }>
  ): void {
    console.log('🔧 ColorTableService: Force syncing all palettes', { redPalette, greenPalette, bluePalette });
    
    // Clear existing data
    this.colorTables = {
      red: [],
      green: [],
      blue: []
    };
    
    // Sync each palette
    this.syncPaletteToColorTable('red', redPalette);
    this.syncPaletteToColorTable('green', greenPalette);
    this.syncPaletteToColorTable('blue', bluePalette);
    
    console.log('🔧 ColorTableService: Force sync completed', this.colorTables);
    
    // Update JSON file via server
    this.updateColorTablesJson().catch(error => {
      console.error('🔧 ColorTableService: Error updating color tables JSON after force sync:', error);
    });
  }

  // Update color table from array (used by App.tsx)
  updateColorTableFromArray(colorTableArray: ColorTableEntry[]): void {
    console.log('🔧 ColorTableService: Updating color table from array', { colorTableArray });
    
    // Clear existing data
    this.colorTables = {
      red: [],
      green: [],
      blue: []
    };
    
    // Group entries by layer based on their ID
    colorTableArray.forEach(entry => {
      const layerFromId = entry.id.split('-')[1] as 'red' | 'green' | 'blue';
      if (layerFromId && ['red', 'green', 'blue'].includes(layerFromId)) {
        this.colorTables[layerFromId].push(entry);
      }
    });
    
    console.log('🔧 ColorTableService: Updated color tables from array', this.colorTables);
    
    // Save to localStorage as backup
    this.saveToStorage();
    
    // Update server and JSON file
    this.updateColorTablesJson().catch(error => {
      console.error('🔧 ColorTableService: Error updating color tables JSON after array update:', error);
    });
  }
}

// Export singleton instance
export const colorTableService = new ColorTableService();
