# Guida Build Desktop - PULSE ERP

Questa guida spiega come creare la versione desktop standalone di PULSE ERP.

## 📋 Prerequisiti

- Node.js 18+ installato
- Windows 10/11 (per build Windows)
- npm o yarn

## 🏗️ Build Dell'Applicazione Desktop

### 1. Installazione Dipendenze

```bash
npm install
```

### 2. Build Standalone

Questo comando compila sia il client che il server e prepara i file per Electron:

```bash
npm run build:desktop
```

Output:
- `dist/public/` - Client React compilato
- `dist/index.cjs` - Server Express compilato
- `desktop/` - File Electron (main.cjs, preload.js, sync-service.cjs)

### 3. Creazione Installer

Per creare l'installer .exe Windows:

```bash
npm run electron:build
```

Oppure per creare solo il pacchetto senza installer:

```bash
npm run electron:package
```

L'installer verrà creato in `dist-desktop/`:
- `PULSE ERP Setup X.X.X.exe` - Installer per Windows

## ⚙️ Configurazione

### Database

La versione desktop usa **SQLite** locale. Il database viene creato automaticamente in:
```
%APPDATA%/pulse-erp-desktop/pulse-erp.db
```

### Sincronizzazione Offline-Online

L'applicazione supporta la sincronizzazione con un server remoto:

1. All'avvio dell'app, vai in **Impostazioni**
2. Configura l'URL del server remoto (es: `https://tuoserver.com`)
3. Inserisci il token di autenticazione
4. Salva la configurazione

La sincronizzazione avverrà automaticamente ogni 30 secondi quando c'è connessione internet.

#### File di configurazione manuale

Puoi anche creare manualmente il file di configurazione in:
```
%APPDATA%/pulse-erp-desktop/sync-config.json
```

Contenuto:
```json
{
  "remoteServerUrl": "https://tuoserver.com",
  "authToken": "your-auth-token-here"
}
```

## 🚀 Test in Sviluppo

Per testare l'applicazione Electron in modalità sviluppo:

```bash
# Terminale 1: Avvia il server di sviluppo
npm run dev

# Terminale 2: Avvia Electron
npm run electron:dev
```

## 🔧 Troubleshooting

### L'installer non viene creato

Verifica che:
1. Hai eseguito `npm run build:desktop` prima di `electron:build`
2. La directory `desktop/` contenga tutti i file necessari
3. Non ci siano errori nella console durante il build

### Errore "Server non risponde"

1. Verifica che la porta 5000 sia libera
2. Controlla il firewall di Windows
3. Verifica i log in `%APPDATA%/pulse-erp-desktop/logs/`

### Database non si crea

1. Verifica i permessi della directory `%APPDATA%`
2. Esegui l'applicazione come amministratore
3. Controlla i log di Electron

## 📦 Distribuzione

### Installazione Utente Finale

1. Distribuisci il file `PULSE ERP Setup X.X.X.exe`
2. L'utente esegue l'installer
3. L'applicazione viene installata in `C:\Program Files\PULSE ERP\`
4. Viene creato un collegamento sul desktop e nel menu Start

### Funzionamento Standalone

L'applicazione desktop include:
- ✅ Server Express integrato (avviato automaticamente)
- ✅ Database SQLite locale (zero configurazione)
- ✅ Tutte le dipendenze necessarie
- ✅ Supporto offline completo
- ✅ Sincronizzazione opzionale con server remoto

L'utente non deve installare o configurare nulla, basta eseguire l'applicazione.

## 🔄 Aggiornamenti

### Auto-update (Futuro)

Per implementare auto-update, integra electron-updater nel file `desktop/main.cjs`.

### Aggiornamento Manuale

1. Crea nuovo installer con versione aggiornata in `package.json`
2. Distribuisci nuovo installer agli utenti
3. Gli utenti eseguono il nuovo installer che aggiorna l'installazione esistente

## 📝 Note Importanti

- **Monoutente**: La versione desktop è pensata per un singolo computer
- **Sincronizzazione**: I dati locali possono sincronizzarsi con il server quando online
- **Backup**: I dati sono salvati in `%APPDATA%/pulse-erp-desktop/pulse-erp.db`
- **Portabilità**: Per rendere l'app portabile, modifica `electron-builder` config

## 📊 Dimensioni

- **Installer**: ~150-200 MB (include Node.js runtime e dipendenze)
- **Installazione**: ~300-400 MB
- **Database**: Varia in base ai dati (inizialmente ~1 MB)
