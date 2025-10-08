"use strict";

// Color utility functions for the pixel painter application

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Convert hex color to RGB
 * @param hex - Hex color string (e.g., "#ff0000" or "ff0000")
 * @returns RGB color object
 */
export function hexToRgb(hex: string): RgbColor {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  
  // Parse hex values
  const r = parseInt(cleanHex.substr(0, 2), 16);
  const g = parseInt(cleanHex.substr(2, 2), 16);
  const b = parseInt(cleanHex.substr(4, 2), 16);
  
  return { r, g, b };
}

/**
 * Convert RGB to hex color
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns Hex color string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Get layer index from layer type
 * @param layerType - The layer type ('red', 'green', 'blue')
 * @returns Layer index (0, 1, 2)
 */
export function getLayerIndex(layerType: string): number {
  switch (layerType) {
    case 'red': return 0;
    case 'green': return 1;
    case 'blue': return 2;
    default: return 0;
  }
}

/**
 * Convert RGB to HSL
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns HSL color object
 */
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Convert HSL to RGB
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param l - Lightness (0-100)
 * @returns RGB color object
 */
export function hslToRgb(h: number, s: number, l: number): RgbColor {
  h /= 360;
  s /= 100;
  l /= 100;
  
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

/**
 * Calculate color brightness
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns Brightness value (0-255)
 */
export function getBrightness(r: number, g: number, b: number): number {
  return (r * 299 + g * 587 + b * 114) / 1000;
}

/**
 * Check if a color is light or dark
 * @param hex - Hex color string
 * @returns true if light, false if dark
 */
export function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  return getBrightness(rgb.r, rgb.g, rgb.b) > 128;
}

/**
 * Generate a random color
 * @returns Random hex color string
 */
export function getRandomColor(): string {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return rgbToHex(r, g, b);
}

/**
 * Validate hex color string
 * @param hex - Hex color string to validate
 * @returns true if valid hex color
 */
export function isValidHex(hex: string): boolean {
  return /^#?[0-9A-F]{6}$/i.test(hex);
}

/**
 * Normalize hex color string (ensure it has # prefix)
 * @param hex - Hex color string
 * @returns Normalized hex color string
 */
export function normalizeHex(hex: string): string {
  if (hex.startsWith('#')) {
    return hex;
  }
  return `#${hex}`;
}
