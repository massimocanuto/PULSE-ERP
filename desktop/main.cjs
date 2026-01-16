const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const ServerProcess = require('./server-process.cjs');
const SyncService = require('./sync-service.cjs');

const isDev = process.env.NODE_ENV === 'development';
const serverProcess = new ServerProcess();
const syncService = new SyncService();

let mainWindow = null;
let splashWindow = null;

async function createSplashWindow() {
    splashWindow = new BrowserWindow({
        width: 340,
        height: 340,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        resizable: false,
        movable: true,
        icon: path.join(__dirname, '../dist/public/icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    await splashWindow.loadFile(path.join(__dirname, 'splash.html'));
    splashWindow.center();
}

async function startApp() {
    try {
        // 1. Mostra Splash Screen
        await createSplashWindow();

        // 2. Avvia il server Express in background
        const userDataPath = app.getPath('userData');
        console.log('[Main] Avvio server Express...');

        // Piccola pausa per mostrare l'animazione almeno un istante se il server è veloce
        const serverPromise = serverProcess.start(userDataPath);
        const minSplashTime = new Promise(resolve => setTimeout(resolve, 2000));

        await Promise.all([serverPromise, minSplashTime]);

        // 3. Server pronto, definisci URL
        const serverUrl = serverProcess.getServerUrl();
        console.log('[Main] Caricamento applicazione da:', serverUrl);

        // 4. Crea Finestra Principale (nascosta)
        mainWindow = new BrowserWindow({
            width: 1280,
            height: 800,
            show: false, // Importante: nascosta all'inizio
            icon: path.join(__dirname, '../dist/public/favicon.png'),
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js')
            },
            title: "PULSE ERP",
            backgroundColor: '#0f172a'
        });

        Menu.setApplicationMenu(null);

        // 5. Carica la pagina
        await mainWindow.loadURL(serverUrl);

        // 6. Configura DevTools e Sync
        if (isDev) {
            mainWindow.webContents.openDevTools();
        }

        const configPath = path.join(userDataPath, 'sync-config.json');
        const fs = require('fs');
        if (fs.existsSync(configPath)) {
            try {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                if (config.remoteServerUrl && config.authToken) {
                    await syncService.initialize(config.remoteServerUrl, config.authToken);
                }
            } catch (error) {
                console.error('[Main] Errore caricamento configurazione sync:', error);
            }
        }

        // 7. Swap: Mostra Main, Chiudi Splash
        mainWindow.once('ready-to-show', () => {
            if (splashWindow) {
                splashWindow.close();
                splashWindow = null;
            }
            mainWindow.show();
            mainWindow.focus();
        });

        mainWindow.on('closed', function () {
            mainWindow = null;
            app.quit();
        });

    } catch (error) {
        console.error('[Main] Errore avvio:', error);

        if (splashWindow) {
            splashWindow.close();
            splashWindow = null;
        }

        // Fallback: crea finestra per mostrare errore
        mainWindow = new BrowserWindow({
            width: 800,
            height: 600,
            title: "Errore Avvio",
            backgroundColor: '#0f172a'
        });

        mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
            <!DOCTYPE html>
            <html>
                <body style="background: #0f172a; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh;">
                <div style="text-align: center; max-width: 600px; padding: 20px;">
                    <h1 style="color: #ef4444;">Errore di Avvio</h1>
                    <p>Impossibile comunicare con il server locale.</p>
                    <pre style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 5px; text-align: left; overflow: auto;">${error.message}</pre>
                </div>
                </body>
            </html>
        `)}`);
        mainWindow.show();
    }
}

app.whenReady().then(async () => {
    await startApp();

    app.on('activate', async function () {
        if (BrowserWindow.getAllWindows().length === 0) {
            await startApp();
        }
    });
});

app.on('window-all-closed', async function () {
    // Arresta il server e la sincronizzazione prima di chiudere l'app
    syncService.stop();
    await serverProcess.stop();

    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Gestisci la chiusura pulita
app.on('before-quit', async (event) => {
    if (serverProcess.serverProcess) {
        event.preventDefault();
        syncService.stop();
        await serverProcess.stop();
        app.quit();
    }
});

// IPC Handlers per la sincronizzazione
ipcMain.handle('sync:getStatus', () => {
    return syncService.getStatus();
});

ipcMain.handle('sync:forceSync', async () => {
    try {
        await syncService.forcSync();
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('sync:configure', async (event, config) => {
    try {
        const userDataPath = app.getPath('userData');
        const configPath = path.join(userDataPath, 'sync-config.json');
        const fs = require('fs');

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        // Reinizializza il servizio con la nuova configurazione
        if (config.remoteServerUrl && config.authToken) {
            await syncService.initialize(config.remoteServerUrl, config.authToken);
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('dialog:openDirectory', async () => {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });
    if (result.canceled) return null;
    return result.filePaths[0];
});
