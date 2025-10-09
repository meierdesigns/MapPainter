"use strict";

import { PaletteColor } from '../App';

const API_BASE_URL = 'http://localhost:3001/api';

export interface ServerPalettes {
  environment: PaletteColor[];
  entities: PaletteColor[];
  functions: PaletteColor[];
}

export interface AppState {
  currentTool: string;
  currentColor: string;
  currentLayer: string;
  brushSize: number;
  canvasSize: number;
  zoom: number;
  showGrid: boolean;
}

export interface ServerState {
  palettes: ServerPalettes;
  appState: AppState;
}

export interface ImageCache {
  layers: {
    red: string | null;
    green: string | null;
    blue: string | null;
  };
  timestamp: string | null;
  canvasSize: number;
}

class PaletteApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getState(): Promise<ServerState> {
    try {
      return await this.request<ServerState>('/state');
    } catch (error) {
      console.error('Failed to load state from server:', error);
      // Return default state if server is not available
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

  async getPalettes(): Promise<ServerPalettes> {
    try {
      return await this.request<ServerPalettes>('/palettes');
    } catch (error) {
      console.error('Failed to load palettes from server:', error);
      // Return default palettes if server is not available
      return {
        environment: [],
        entities: [],
        functions: []
      };
    }
  }

  async saveState(state: ServerState): Promise<boolean> {
    try {
      await this.request('/state', {
        method: 'POST',
        body: JSON.stringify(state),
      });
      return true;
    } catch (error) {
      console.error('Failed to save state to server:', error);
      return false;
    }
  }

  async savePalettes(palettes: ServerPalettes): Promise<boolean> {
    try {
      await this.request('/palettes', {
        method: 'POST',
        body: JSON.stringify({ palettes }),
      });
      return true;
    } catch (error) {
      console.error('Failed to save palettes to server:', error);
      return false;
    }
  }

  async updateLayerPalette(layer: 'environment' | 'entities' | 'functions', palettes: PaletteColor[]): Promise<boolean> {
    try {
      await this.request(`/palettes/${layer}`, {
        method: 'PUT',
        body: JSON.stringify({ palettes }),
      });
      return true;
    } catch (error) {
      console.error(`Failed to update ${layer} palette on server:`, error);
      return false;
    }
  }

  async checkServerHealth(): Promise<boolean> {
    try {
      await this.request('/health');
      return true;
    } catch (error) {
      console.error('Server health check failed:', error);
      return false;
    }
  }

  // Image Cache API methods
  async getPixelArtCache(): Promise<ImageCache | null> {
    try {
      return await this.request<ImageCache>('/image-cache');
    } catch (error) {
      console.error('Failed to load pixel art cache from server:', error);
      return null;
    }
  }

  async savePixelArtCache(layers: { red: string | null; green: string | null; blue: string | null }, canvasSize: number): Promise<boolean> {
    try {
      await this.request('/image-cache', {
        method: 'POST',
        body: JSON.stringify({ layers, canvasSize }),
      });
      console.log('🖼️ Successfully saved pixel art cache to server');
      return true;
    } catch (error) {
      console.error('Failed to save pixel art cache to server:', error);
      return false;
    }
  }

  async clearPixelArtCache(): Promise<boolean> {
    try {
      await this.request('/image-cache', {
        method: 'DELETE',
      });
      console.log('🗑️ Successfully cleared pixel art cache on server');
      return true;
    } catch (error) {
      console.error('Failed to clear pixel art cache on server:', error);
      return false;
    }
  }
}

export const paletteApi = new PaletteApiService();
