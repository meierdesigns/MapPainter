# 🎨 PixelPainter - Professional Pixel Art Editor

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)](https://github.com/meierdesigns/PixelPainter)
[![Version](https://img.shields.io/badge/Version-1.0.0-blue.svg)](https://github.com/meierdesigns/PixelPainter/releases)

Ein moderner, professioneller Pixel Art Editor mit erweiterten Features für Game Development und digitale Kunst. PixelPainter bietet eine intuitive Benutzeroberfläche mit leistungsstarken Tools für die Erstellung von Pixel Art, Sprites und Game Assets.

## 🚀 Neueste Updates (v1.0.0)

### ✨ Neue Features
- **Channel-basierte Farbtabelle**: RGB-Kanal-Mapping für Game Development mit individueller Kanal-Zuweisung
- **Multi-Layer System**: Drei separate Layer (Environment, Entities, Functions) mit eigenen Farbpaletten
- **Erweiterte Color Picker**: RGB-Slider mit Hex-Input und Layer-spezifische Paletten
- **Color Modal System**: Detaillierte Farbbearbeitung mit Kanal-Slidern
- **Channel Slider Component**: Präzise Kanal-Wert-Einstellung mit visueller Vorschau
- **Color Table Cards**: Übersichtliche Darstellung der Kanal-Zuweisungen
- **Server Integration**: Express.js Backend für Palette-Management und JSON-Export
- **Color Table Service**: Zentrale Verwaltung der Farbtabellen mit localStorage-Synchronisation

### 🔧 Technische Verbesserungen
- **TypeScript Integration**: Vollständige Type-Safety für alle Komponenten
- **Modulare Architektur**: Saubere Trennung von Services, Utils und Komponenten
- **Performance Optimierung**: Debounced localStorage-Operationen und effiziente Re-Renders
- **Error Handling**: Robuste Fehlerbehandlung mit Fallback-Mechanismen
- **Code Quality**: Strict Mode, ESLint-Konfiguration und konsistente Code-Struktur

## 🌟 Features Overview

### 🚀 Wave 1: Core Features (✅ Vollständig implementiert)
- **Multi-Layer Canvas**: Drei separate Layer (Environment, Entities, Functions) mit individueller Sichtbarkeit und Transparenz
- **Advanced Color Picker**: RGB-Slider mit Hex-Input, vordefinierte Farbpalette, Layer-spezifische Paletten
- **Comprehensive Toolset**: Pinsel, Radiergummi, Pipette, Füllwerkzeug, Linie, Rechteck mit konfigurierbarer Größe
- **Color Table System**: Channel-basierte Farbzuweisung mit RGB-Kanal-Mapping für Game Development
- **Advanced Grid System**: Konfigurierbares Raster mit anpassbarer Farbe und Stärke
- **Zoom & Pan Controls**: Präzise Navigation mit Mouse-Wheel-Zoom und Right-Click-Pan
- **File Operations**: Canvas-Größe ändern (16x16 bis 256x256), PNG-Export, Bild-Import
- **Undo/Redo System**: Vollständige Historie mit 50-Level-Undo/Redo
- **Real-time Preview**: Sofortige Vorschau aller Tools und Hover-Effekte
- **Local Storage**: Automatische Speicherung von Einstellungen und Paletten
- **Responsive UI**: Moderne, anpassbare Benutzeroberfläche mit Tab-System

### 🎯 Wave 2: Advanced Tools (🚧 In Entwicklung)
- **Enhanced Layer System**: Erweiterte Layer-Management mit Drag & Drop, Layer-Gruppen
- **Animation Support**: Frame-basierte Animationen mit Timeline-Editor und Onion-Skinning
- **Advanced Brushes**: Verschiedene Pinselformen (Rund, Quadrat, Custom), Texturierte Pinsel
- **Selection Tools**: Rechteckige und freie Auswahl mit Transformation (Move, Scale, Rotate)
- **Enhanced Undo/Redo**: Multi-Level-Undo mit Vorschau und selektive Rückgängig-Funktionen
- **Grid & Snap System**: Snap-to-Grid, Pixel-Perfect Mode, konfigurierbare Raster-Visualisierung
- **Custom Brush Creator**: Tool zur Erstellung eigener Pinselformen und Texturen
- **Magic Wand Tool**: Automatische Farbbereichsauswahl
- **Copy/Paste System**: Zwischenablage-Funktionen für Selections

### 🎮 Wave 3: Game Development (📅 Geplant Q2 2024)
- **Sprite Sheet Generator**: Automatische Sprite-Sheet-Erstellung mit verschiedenen Packing-Algorithmen
- **Tile Map Editor**: Spezialisierte Tools für Tile-basierte Spiele mit Auto-Tiling
- **Advanced Palette Management**: Palette-Import aus verschiedenen Formaten, Color-Reduction Tools
- **Multiple Export Formats**: PNG, GIF, SVG, JSON, Game Engine-spezifische Formate
- **Asset Library**: Integrierte Bibliothek für Game Assets mit Community-Sharing
- **Collision Editor**: Tools für Collision-Map-Erstellung mit verschiedenen Shapes
- **Game Engine Integration**: Unity, Unreal Engine, Godot Export-Funktionen
- **Animation Export**: GIF-Export für Sprite-Animationen
- **Batch Processing**: Automatische Verarbeitung mehrerer Assets

### 🔧 Wave 4: Professional Features (📅 Geplant Q3 2024)
- **Plugin System**: JavaScript-basierte Plugin-API mit Marketplace und Custom Tool Development
- **Advanced Batch Processing**: Script-basierte Automatisierung mit Scheduled Processing
- **Version Control Integration**: Git-Integration mit Branch-basierter Entwicklung
- **Real-time Collaboration**: Multi-User-Bearbeitung mit Comment und Review System
- **Advanced Filters**: GPU-accelerated Bildfilter und Custom Filter Development
- **Custom Scripts**: JavaScript-basierte Workflow-Automation und API-Integration
- **Enterprise Features**: Team-Management, Cloud-Synchronisation, Advanced Analytics
- **Performance Optimization**: WebGL-Acceleration, Web Workers für Background-Processing

## 🛠️ Installation

### Voraussetzungen
- Node.js 18+ ([Download](https://nodejs.org/))
- npm oder yarn
- Git

### Schnellstart
```bash
# Repository klonen
git clone git@github.com:meierdesigns/PixelPainter.git
cd PixelPainter

# Dependencies installieren
npm install

# Development Server starten
npm start

# Oder mit dem bereitgestellten Batch-Script (Windows)
start.bat
```

### Production Build
```bash
# Production Build erstellen
npm run build

# Build-Server starten
npm run serve
```

## 🎨 Verwendung

### Grundlegende Bedienung
1. **Canvas**: Klicken und ziehen zum Zeichnen auf dem aktiven Layer
2. **Layer-Wechsel**: Verwende die Layer-Tabs (Environment, Entities, Functions)
3. **Farbauswahl**: RGB-Slider, Hex-Input oder vordefinierte Farben
4. **Tools**: Wechsel zwischen Pinsel, Radiergummi, Pipette, Füllwerkzeug, Linie, Rechteck
5. **Zoom & Pan**: Mouse-Wheel für Zoom, Right-Click + Drag für Pan
6. **Speichern**: PNG-Export über File Menu
7. **Canvas-Größe**: Dropdown-Menü für verschiedene Größen (16x16 bis 256x256)

### Tastaturkürzel
- `Ctrl + S`: PNG-Export
- `Ctrl + O`: Bild laden
- `Ctrl + Z`: Rückgängig (50-Level-Historie)
- `Ctrl + Y`: Wiederholen
- `Right-Click + Drag`: Canvas verschieben (Pan)
- `Mouse Wheel`: Zoom in/out (0.5x bis 32x)
- `B`: Pinsel-Tool
- `E`: Radiergummi-Tool
- `R`: Pipette-Tool
- `F`: Füllwerkzeug
- `L`: Linie-Tool
- `Q`: Rechteck-Tool

### Erweiterte Features
- **Multi-Layer System**: Drei separate Layer (Environment, Entities, Functions) mit individueller Sichtbarkeit und Transparenz
- **Channel-basierte Farbtabelle**: RGB-Kanal-Mapping für Game Development mit individueller Kanal-Zuweisung
- **Layer Palettes**: Jeder Layer hat seine eigene Farbpalette mit automatischer Synchronisation
- **Color Modal System**: Detaillierte Farbbearbeitung mit Kanal-Slidern und visueller Vorschau
- **Grid System**: Konfigurierbares Raster mit anpassbarer Farbe und Stärke
- **Real-time Preview**: Hover-Effekte zeigen Vorschau der Tools
- **Auto-Save**: Einstellungen und Paletten werden automatisch gespeichert
- **Brush Size**: Konfigurierbare Pinselgröße (1px bis 32px)
- **Canvas Sizes**: Unterstützung für 16x16, 32x32, 64x64, 128x128, 256x256 Pixel
- **Server Integration**: Express.js Backend für Palette-Management und JSON-Export
- **Color Table Service**: Zentrale Verwaltung der Farbtabellen mit localStorage-Synchronisation

## 🏗️ Projektstruktur

```
PixelPainter/
├── public/
│   └── index.html                    # HTML Template
├── src/
│   ├── components/                   # React Komponenten
│   │   ├── ColorPicker.tsx          # Erweiterte Farbauswahl mit RGB-Slidern
│   │   ├── ColorPicker.css          # Styles für Color Picker
│   │   ├── ColorTable.tsx           # Channel-basierte Farbtabelle
│   │   ├── ColorTable.css           # Styles für Color Table
│   │   ├── ColorTableNew.tsx        # Neue Color Table Implementierung
│   │   ├── ColorTableNew.css        # Styles für neue Color Table
│   │   ├── ColorTableCards.tsx      # Card-basierte Color Table Darstellung
│   │   ├── ColorTableCards.css      # Styles für Color Table Cards
│   │   ├── ColorModal.tsx           # Modal für detaillierte Farbbearbeitung
│   │   ├── ColorModal.css           # Styles für Color Modal
│   │   ├── ChannelSlider.tsx        # Kanal-Slider Component
│   │   ├── FileOperations.tsx       # Datei-Operationen und Canvas-Größe
│   │   ├── FileOperations.css       # Styles für File Operations
│   │   ├── PixelCanvas.tsx          # Multi-Layer Canvas mit Zoom/Pan
│   │   ├── PixelCanvas.css          # Styles für Pixel Canvas
│   │   ├── Toolbar.tsx              # Toolbar mit Tools und Grid-Controls
│   │   └── Toolbar.css              # Styles für Toolbar
│   ├── services/                    # API Services
│   │   ├── paletteApi.ts            # Palette-Management (Server-Integration)
│   │   └── colorTableService.ts     # Zentrale Color Table Verwaltung
│   ├── data/                        # Daten-Dateien
│   │   └── colorTables.json         # Color Table Konfiguration
│   ├── utils/                       # Utility Functions
│   │   └── colorUtils.ts            # Farb-Konvertierungs-Funktionen
│   ├── styles/                      # CSS Stylesheets
│   │   ├── App.css                  # Haupt-Styles
│   │   └── global.css               # Globale Styles
│   ├── App.tsx                      # Haupt-App-Komponente mit State-Management
│   └── index.tsx                    # App Entry Point
├── server.js                        # Express Server für API-Endpoints
├── webpack.config.js                # Webpack Konfiguration
├── tsconfig.json                    # TypeScript Konfiguration
├── package.json                     # Dependencies und Scripts
├── palettes.json                    # Palette-Konfiguration
├── start.bat                        # Windows Start-Script
├── test_color_tables.html           # Test-Datei für Color Tables
└── test_sync.html                   # Test-Datei für Synchronisation
```

## 🔧 Entwicklung

### Development Setup
```bash
# Development Server mit Hot Reload
npm start

# TypeScript Compilation überwachen
npm run watch

# Linting
npm run lint

# Tests ausführen
npm run test
```

### Code-Struktur
- **React 18+**: Moderne React Features mit Hooks
- **TypeScript**: Type-safe Development
- **CSS Modules**: Scoped Styling
- **Webpack**: Module Bundling und Hot Reload
- **Express**: Development Server

### Contributing Guidelines
1. Fork das Repository
2. Erstelle einen Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Committe deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

## 📋 Roadmap

### Wave 1 (Vollständig implementiert) ✅
- [x] Multi-Layer Canvas System
- [x] Advanced Color Picker mit RGB-Slidern
- [x] Comprehensive Toolset (Pinsel, Radiergummi, Pipette, Füllwerkzeug, Linie, Rechteck)
- [x] Color Table System für Game Development
- [x] File Operations (PNG-Export, Bild-Import, Canvas-Größe)
- [x] Advanced Grid System
- [x] Zoom & Pan Controls
- [x] Undo/Redo System (50-Level)
- [x] Real-time Preview
- [x] Local Storage Integration
- [x] Responsive UI mit Tab-System

### Wave 2 (Q1 2024) 🚧
- [ ] Enhanced Layer System (Drag & Drop, Layer-Gruppen)
- [ ] Animation Support (Timeline-Editor, Onion-Skinning)
- [ ] Advanced Brushes (Custom Shapes, Texturen)
- [ ] Selection Tools (Magic Wand, Transformation)
- [ ] Enhanced Undo/Redo (Multi-Level mit Vorschau)
- [ ] Grid & Snap System (Pixel-Perfect Mode)
- [ ] Custom Brush Creator
- [ ] Copy/Paste System

### Wave 3 (Q2 2024) 📅
- [ ] Sprite Sheet Generator (Auto-Packing)
- [ ] Tile Map Editor (Auto-Tiling)
- [ ] Advanced Palette Management (Import/Export)
- [ ] Multiple Export Formats (GIF, SVG, Game Engine)
- [ ] Asset Library (Community-Sharing)
- [ ] Collision Editor
- [ ] Game Engine Integration (Unity, Unreal, Godot)
- [ ] Animation Export (GIF)
- [ ] Batch Processing

### Wave 4 (Q3 2024) 📅
- [ ] Plugin System (JavaScript API, Marketplace)
- [ ] Advanced Batch Processing (Script-Automation)
- [ ] Version Control Integration (Git)
- [ ] Real-time Collaboration (Multi-User)
- [ ] Advanced Filters (GPU-accelerated)
- [ ] Custom Scripts (Workflow-Automation)
- [ ] Enterprise Features (Team-Management, Cloud-Sync)
- [ ] Performance Optimization (WebGL, Web Workers)

## 🤝 Mitwirken

Wir freuen uns über Beiträge! Bitte lies unsere [Contributing Guidelines](CONTRIBUTING.md) für Details.

### Bug Reports
- Verwende das [Issue Template](.github/ISSUE_TEMPLATE/bug_report.md)
- Beschreibe das Problem detailliert
- Füge Screenshots oder GIFs hinzu wenn möglich

### Feature Requests
- Verwende das [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md)
- Beschreibe den Use Case
- Erkläre warum das Feature nützlich wäre

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert - siehe [LICENSE](LICENSE) für Details.

## 🙏 Danksagungen

- [React](https://reactjs.org/) - UI Framework
- [TypeScript](https://www.typescriptlang.org/) - Type Safety
- [Webpack](https://webpack.js.org/) - Module Bundler
- [Express](https://expressjs.com/) - Web Server
- Alle Contributors und Beta-Tester

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/meierdesigns/PixelPainter/issues)
- **Discussions**: [GitHub Discussions](https://github.com/meierdesigns/PixelPainter/discussions)
- **Email**: support@meierdesigns.com

---

**Entwickelt mit ❤️ von MeierDesigns**

*PixelPainter - Where creativity meets precision*