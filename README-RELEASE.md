# PULSE-ERP - Versione Release

Questa è la versione pulita di PULSE-ERP pronta per la distribuzione.

## 📦 Contenuto

Questa directory contiene:
- ✅ Tutti i file sorgente aggiornati
- ✅ Configurazione Electron per versione desktop
- ✅ Configurazione PWA per versione web
- ✅ Sistema di sincronizzazione offline-online
- ✅ Script di build ottimizzati
- ✅ Documentazione completa

**Escluso** (da installare/generare):
- `node_modules/` - Da installare con `npm install`
- `dist/` - Generato dal build
- `dist-desktop/` - Generato da electron-builder
- File temporanei e cache

## 🚀 Quick Start

### 1. Installa Dipendenze

```powershell
cd C:\PULSE-ERP-Release
npm install
```

### 2. Build Versione Desktop

```powershell
# Build client + server + prepara Electron
npm run build:desktop

# Crea installer Windows .exe
npm run electron:build
```

L'installer sarà in: `C:\PULSE-ERP-Release\dist-desktop\PULSE ERP Setup X.X.X.exe`

### 3. Build Versione Web

```powershell
# Build ottimizzato per web/PWA
npm run build:web

# Test locale
npm start
```

## 📚 Documentazione

- **[DESKTOP_BUILD_GUIDE.md](./DESKTOP_BUILD_GUIDE.md)** - Guida completa per build desktop
- **[WEB_DEPLOYMENT_GUIDE.md](./WEB_DEPLOYMENT_GUIDE.md)** - Guida deployment web
- **[package.json](./package.json)** - Tutti gli script disponibili

## 🔧 Script Disponibili

```bash
# Sviluppo
npm run dev              # Server backend
npm run dev:client       # Solo frontend Vite
npm run electron:dev     # Test Electron in sviluppo

# Build
npm run build            # Build standard (client + server)
npm run build:desktop    # Build per Electron
npm run build:web        # Build per PWA/Web

# Desktop
npm run electron:build   # Crea installer .exe
npm run electron:package # Crea solo package (no installer)

# Utilità
npm run check            # TypeScript check
npm run db:push          # Aggiorna schema database
```

## 📁 Struttura Progetto

```
PULSE-ERP-Release/
├── client/              # Frontend React
│   ├── src/            # Codice sorgente
│   └── public/         # Asset statici (manifest, service-worker, etc.)
├── server/             # Backend Express
├── desktop/            # File Electron
│   ├── main.cjs       # Main process
│   ├── preload.js     # Preload script
│   ├── server-process.cjs  # Gestione server integrato
│   └── sync-service.cjs    # Sincronizzazione offline-online
├── script/             # Script di build
│   ├── build-desktop.ts
│   ├── build-web.ts
│   └── build.ts
├── shared/             # Codice condiviso
├── package.json        # Dipendenze e script
├── DESKTOP_BUILD_GUIDE.md
└── WEB_DEPLOYMENT_GUIDE.md
```

## ✨ Novità in Questa Versione

### Versione Desktop
- 🚀 Server Express integrato (avvio automatico)
- 💾 Database SQLite locale (zero config)
- 🔄 Sincronizzazione offline-online
  - Lavora senza internet
  - Sincronizza automaticamente quando torni online
  - Risoluzione conflitti automatica
- 🎨 UI loading professionale
- 📦 Installer Windows one-click

### Versione Web/PWA
- 📱 Installabile come app nativa
- 🔌 Service Worker con cache intelligente
- 📴 Funziona offline
- 🎯 Shortcuts per funzioni rapide
- ⚡ Build ottimizzato con code splitting

## 🎯 Prossimi Passi

1. **Per testing locale**:
   ```bash
   npm install
   npm run build:desktop
   npm run electron:dev
   ```

2. **Per creare installer distribuibile**:
   ```bash
   npm install
   npm run electron:build
   ```

3. **Per deployment web**:
   - Vedi [WEB_DEPLOYMENT_GUIDE.md](./WEB_DEPLOYMENT_GUIDE.md)

## 📝 Note

- **Versione Node.js**: 18+ richiesta
- **Sistema Operativo**: Windows 10/11 per build desktop
- **Database Desktop**: SQLite (automatico)
- **Database Web**: PostgreSQL consigliato

## 🆘 Supporto

In caso di problemi:
1. Controlla [DESKTOP_BUILD_GUIDE.md](./DESKTOP_BUILD_GUIDE.md) - sezione Troubleshooting
2. Verifica versione Node.js: `node --version`
3. Pulisci e reinstalla: `rmdir /s /q node_modules && npm install`

---

**Data creazione**: 13/01/2026  
**Versione**: 1.0.0  
**Branch**: main
