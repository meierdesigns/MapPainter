# 🎨 MapPainter - Professional Pixel Art Editor

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)

Ein moderner, professioneller Pixel Art Editor mit erweiterten Features für Game Development und digitale Kunst. MapPainter bietet eine intuitive Benutzeroberfläche mit leistungsstarken Tools für die Erstellung von Pixel Art, Sprites und Game Assets.

## 🌟 Features Overview

### 🚀 Wave 1: Core Features (Aktuell verfügbar)
- **Pixel Canvas**: Hochauflösendes Zeichenfeld mit Zoom und Pan-Funktionalität
- **Color Picker**: Erweiterte Farbauswahl mit RGB/HSV-Unterstützung
- **Basic Tools**: Pinsel, Radiergummi, Pipette, Füllwerkzeug
- **File Operations**: Speichern/Laden von Projekten (PNG, JSON)
- **Responsive UI**: Moderne, anpassbare Benutzeroberfläche
- **Real-time Preview**: Sofortige Vorschau aller Änderungen

### 🎯 Wave 2: Advanced Tools (Geplant)
- **Layer System**: Mehrschichtige Bearbeitung mit Ebenen-Management
- **Animation Support**: Frame-basierte Animationen für Sprites
- **Advanced Brushes**: Verschiedene Pinselformen und Texturen
- **Selection Tools**: Rechteckige und freie Auswahl mit Transformation
- **Undo/Redo System**: Erweiterte Rückgängig-Funktionalität
- **Grid & Snap**: Raster und Snap-to-Grid für präzise Bearbeitung

### 🎮 Wave 3: Game Development (Geplant)
- **Sprite Sheet Generator**: Automatische Sprite-Sheet-Erstellung
- **Tile Map Editor**: Spezialisierte Tools für Tile-basierte Spiele
- **Palette Management**: Erweiterte Paletten-Verwaltung und -Import
- **Export Formats**: Multiple Export-Formate (PNG, GIF, SVG, JSON)
- **Asset Library**: Integrierte Bibliothek für Game Assets
- **Collision Editor**: Tools für Collision-Maps

### 🔧 Wave 4: Professional Features (Geplant)
- **Plugin System**: Erweiterbare Architektur mit Plugin-API
- **Batch Processing**: Automatische Verarbeitung mehrerer Dateien
- **Version Control**: Integrierte Versionskontrolle für Projekte
- **Collaboration**: Multi-User-Bearbeitung und Sharing
- **Advanced Filters**: Bildfilter und Effekte
- **Custom Scripts**: JavaScript-basierte Automatisierung

## 🛠️ Installation

### Voraussetzungen
- Node.js 18+ ([Download](https://nodejs.org/))
- npm oder yarn
- Git

### Schnellstart
```bash
# Repository klonen
git clone git@github.com:meierdesigns/MapPainter.git
cd MapPainter

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
1. **Canvas**: Klicken und ziehen zum Zeichnen
2. **Farbauswahl**: Klick auf Color Picker für Farbauswahl
3. **Tools**: Wechsel zwischen Pinsel, Radiergummi und anderen Tools
4. **Speichern**: Ctrl+S oder über File Menu
5. **Laden**: Ctrl+O oder über File Menu

### Tastaturkürzel
- `Ctrl + S`: Projekt speichern
- `Ctrl + O`: Projekt öffnen
- `Ctrl + Z`: Rückgängig
- `Ctrl + Y`: Wiederholen
- `Space + Drag`: Canvas verschieben
- `Mouse Wheel`: Zoom in/out
- `R`: Pipette-Tool
- `B`: Pinsel-Tool
- `E`: Radiergummi-Tool

### Erweiterte Features
- **Zoom**: Mouse Wheel oder Zoom-Controls
- **Pan**: Space + Drag oder Pan-Tool
- **Color History**: Letzte verwendete Farben werden gespeichert
- **Project Settings**: Canvas-Größe und andere Einstellungen

## 🏗️ Projektstruktur

```
MapPainter/
├── public/
│   └── index.html          # HTML Template
├── src/
│   ├── components/         # React Komponenten
│   │   ├── ColorPicker.tsx # Farbauswahl-Komponente
│   │   ├── FileOperations.tsx # Datei-Operationen
│   │   ├── PixelCanvas.tsx # Haupt-Canvas-Komponente
│   │   └── Toolbar.tsx     # Toolbar mit Tools
│   ├── services/           # API Services
│   │   └── paletteApi.ts   # Palette-Management
│   ├── styles/             # CSS Stylesheets
│   │   ├── App.css         # Haupt-Styles
│   │   └── global.css      # Globale Styles
│   ├── App.tsx             # Haupt-App-Komponente
│   └── index.tsx           # App Entry Point
├── server.js               # Express Server
├── webpack.config.js       # Webpack Konfiguration
├── tsconfig.json           # TypeScript Konfiguration
└── package.json            # Dependencies und Scripts
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

### Wave 1 (Aktuell) ✅
- [x] Basic Canvas Implementation
- [x] Color Picker
- [x] File Operations
- [x] Basic Tools (Pinsel, Radiergummi, Pipette)
- [x] Responsive UI

### Wave 2 (Q1 2024) 🚧
- [ ] Layer System
- [ ] Animation Support
- [ ] Advanced Brushes
- [ ] Selection Tools
- [ ] Enhanced Undo/Redo

### Wave 3 (Q2 2024) 📅
- [ ] Sprite Sheet Generator
- [ ] Tile Map Editor
- [ ] Palette Management
- [ ] Multiple Export Formats
- [ ] Asset Library

### Wave 4 (Q3 2024) 📅
- [ ] Plugin System
- [ ] Batch Processing
- [ ] Version Control
- [ ] Collaboration Features
- [ ] Advanced Filters

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

- **Issues**: [GitHub Issues](https://github.com/meierdesigns/MapPainter/issues)
- **Discussions**: [GitHub Discussions](https://github.com/meierdesigns/MapPainter/discussions)
- **Email**: support@meierdesigns.com

---

**Entwickelt mit ❤️ von MeierDesigns**

*MapPainter - Where creativity meets precision*