# Contributing to MapPainter

Vielen Dank für dein Interesse an MapPainter! Wir freuen uns über Beiträge von der Community.

## 🚀 Erste Schritte

### Development Setup
1. Fork das Repository
2. Klone deinen Fork: `git clone git@github.com:dein-username/MapPainter.git`
3. Installiere Dependencies: `npm install`
4. Starte den Development Server: `npm start`

### Branch Strategy
- `main` - Stable Release Branch
- `develop` - Development Branch
- `feature/feature-name` - Feature Branches
- `bugfix/issue-description` - Bug Fix Branches
- `hotfix/critical-fix` - Hotfix Branches

## 📝 Code Standards

### TypeScript
- Verwende strikte TypeScript-Konfiguration
- Definiere Interfaces für alle Props und State
- Vermeide `any` - verwende spezifische Typen
- Dokumentiere komplexe Typen mit JSDoc

### React
- Verwende Functional Components mit Hooks
- Implementiere `useCallback` und `useMemo` für Performance
- Verwende TypeScript für alle Props
- Halte Komponenten klein und fokussiert

### CSS
- Verwende CSS Modules für Scoped Styling
- Folge der BEM-Methodik für Klassennamen
- Verwende CSS Custom Properties für Theming
- Halte Styles responsive und accessible

### Code Style
```typescript
// ✅ Gut
interface CanvasProps {
  width: number;
  height: number;
  onPixelChange: (x: number, y: number, color: string) => void;
}

const PixelCanvas: React.FC<CanvasProps> = ({ width, height, onPixelChange }) => {
  const [pixels, setPixels] = useState<string[][]>([]);
  
  const handlePixelClick = useCallback((x: number, y: number) => {
    // Implementation
  }, []);
  
  return (
    <div className="pixel-canvas">
      {/* JSX */}
    </div>
  );
};
```

## 🐛 Bug Reports

### Vor dem Melden
1. Suche in bestehenden Issues
2. Teste mit der neuesten Version
3. Reproduziere den Bug konsistent

### Bug Report Template
```markdown
**Bug Beschreibung**
Kurze, klare Beschreibung des Bugs.

**Reproduktionsschritte**
1. Gehe zu '...'
2. Klicke auf '...'
3. Scroll zu '...'
4. Siehe Fehler

**Erwartetes Verhalten**
Was sollte passieren?

**Screenshots**
Füge Screenshots hinzu wenn hilfreich.

**Umgebung:**
- OS: [e.g. Windows 10]
- Browser: [e.g. Chrome 120]
- Version: [e.g. 1.2.3]

**Zusätzlicher Kontext**
Weitere Informationen über das Problem.
```

## ✨ Feature Requests

### Feature Request Template
```markdown
**Ist dein Feature Request mit einem Problem verbunden?**
Eine klare Beschreibung des Problems.

**Beschreibe die Lösung die du dir wünschst**
Eine klare Beschreibung der gewünschten Lösung.

**Beschreibe Alternativen die du in Betracht gezogen hast**
Alternative Lösungen oder Features.

**Zusätzlicher Kontext**
Screenshots, Mockups, oder weitere Informationen.
```

## 🔧 Development Workflow

### 1. Issue erstellen
- Beschreibe das Problem oder Feature detailliert
- Verwende die entsprechenden Labels
- Warte auf Review von Maintainern

### 2. Branch erstellen
```bash
git checkout -b feature/feature-name
# oder
git checkout -b bugfix/issue-description
```

### 3. Code schreiben
- Folge den Code Standards
- Schreibe Tests für neue Features
- Dokumentiere komplexe Logik
- Teste deine Änderungen gründlich

### 4. Commit Messages
```bash
# Format: type(scope): description
feat(canvas): add zoom functionality
fix(colorpicker): resolve color selection bug
docs(readme): update installation instructions
style(toolbar): improve button spacing
refactor(components): extract common utilities
test(canvas): add pixel manipulation tests
```

### 5. Pull Request erstellen
- Beschreibe deine Änderungen detailliert
- Verlinke zu relevanten Issues
- Füge Screenshots für UI-Änderungen hinzu
- Stelle sicher dass alle Tests bestehen

### 6. Code Review
- Beantworte Feedback konstruktiv
- Implementiere vorgeschlagene Änderungen
- Teste Änderungen nach Updates

## 🧪 Testing

### Test Guidelines
- Schreibe Unit Tests für Utility Functions
- Teste React Components mit React Testing Library
- Verwende Integration Tests für komplexe Workflows
- Stelle sicher dass alle Tests bestehen

### Test Commands
```bash
# Alle Tests ausführen
npm test

# Tests im Watch Mode
npm run test:watch

# Coverage Report
npm run test:coverage

# E2E Tests
npm run test:e2e
```

## 📚 Dokumentation

### Code Documentation
- Verwende JSDoc für komplexe Funktionen
- Dokumentiere Props und State Interfaces
- Erkläre komplexe Algorithmen
- Füge Beispiele für API Usage hinzu

### README Updates
- Aktualisiere README bei neuen Features
- Dokumentiere Breaking Changes
- Füge neue Installation Steps hinzu
- Update Roadmap bei Änderungen

## 🎯 Prioritäten

### High Priority
- Bug Fixes
- Performance Optimierungen
- Accessibility Verbesserungen
- Security Fixes

### Medium Priority
- Neue Tools und Features
- UI/UX Verbesserungen
- Code Refactoring
- Test Coverage

### Low Priority
- Code Style Verbesserungen
- Dokumentation Updates
- Dependency Updates
- Build Optimierungen

## 🤝 Community Guidelines

### Verhalten
- Sei respektvoll und konstruktiv
- Hilf anderen beim Lernen
- Teile dein Wissen und Erfahrungen
- Feiere Erfolge der Community

### Kommunikation
- Verwende klare, präzise Sprache
- Stelle spezifische Fragen
- Teile deine Gedanken und Ideen
- Sei offen für Feedback

## 📞 Hilfe bekommen

### Ressourcen
- [GitHub Discussions](https://github.com/meierdesigns/MapPainter/discussions)
- [Documentation Wiki](https://github.com/meierdesigns/MapPainter/wiki)
- [Issue Tracker](https://github.com/meierdesigns/MapPainter/issues)

### Kontakt
- **Email**: dev@meierdesigns.com
- **Discord**: [MapPainter Community](https://discord.gg/mappainter)
- **Twitter**: [@MeierDesigns](https://twitter.com/meierdesigns)

---

**Vielen Dank für deinen Beitrag zu MapPainter! 🎨**
