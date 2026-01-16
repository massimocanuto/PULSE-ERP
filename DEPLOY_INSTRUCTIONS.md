# Guida al Deployment di PULSE-ERP

Questa guida ti aiuterà a pubblicare la tua applicazione online utilizzando **Railway** (consigliato per facilità e supporto Docker).

## 1. Preparazione GitHub
Poiché hai già inizializzato Git localmente, devi solo inviare il codice a GitHub.

1. Vai su [GitHub.com](https://github.com) e crea un **Nuovo Repository** (chiamalo `pulse-erp` o come preferisci).
2. **Non** inizializzarlo con README, .gitignore o licenza (hai già questi file).
3. Una volta creato, copia l'URL del repository (es. `https://github.com/TUO_USERNAME/pulse-erp.git`).

## 2. Collegamento e Upload
Esegui questi comandi nel tuo terminale (sostituisci l'URL con il tuo):

```powershell
git remote add origin https://github.com/TUO_USERNAME/pulse-erp.git
git branch -M main
git push -u origin main
```

## 3. Configurazione Railway
1. Vai su [Railway.app](https://railway.app/) e fai il login con GitHub.
2. Clicca su **New Project** -> **Deploy from GitHub repo**.
3. Seleziona il repository `pulse-erp` che hai appena creato.
4. Clicca su **Deploy Now**. Noterai che il primo deploy fallirà o non avrà persistenza dei dati finché non configuri il volume.

### Configurazione Volume (IMPORTANTE)
Per evitare di perdere il database ad ogni riavvio:
1. Nel progetto Railway, clicca sul servizio `pulse-erp`.
2. Vai su **Volumes**.
3. Clicca **Add Volume**.
4. Usa il percorso di mount: `/app/data`.

### Variabili d'Ambiente
1. Vai nel tab **Variables**.
2. Aggiungi le seguenti variabili:
   - `DATABASE_URL`: `file:///app/data/sqlite.db`
   - `NODE_ENV`: `production`
   - `PORT`: `5000`

Railway riavvierà automaticamente l'applicazione. Una volta finito, vai su **Settings** -> **Networking** e clicca su **Generate Domain** per ottenere il tuo link pubblico (es. `pulse-erp.up.railway.app`).

## Note Aggiuntive
- **Aggiornamenti**: Ogni volta che fai modifiche, basta fare `git add`, `git commit` e `git push`: Railway aggiornerà l'app automaticamente.
- **Backup**: Il file del database si troverà nel volume persistente su Railway.
