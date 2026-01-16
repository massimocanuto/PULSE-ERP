const { contextBridge, ipcRenderer } = require('electron');

// Espone API sicure al renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Sincronizzazione
    sync: {
        getStatus: () => ipcRenderer.invoke('sync:getStatus'),
        forceSync: () => ipcRenderer.invoke('sync:forceSync'),
        configure: (config) => ipcRenderer.invoke('sync:configure', config),
    },

    // Utils
    dialog: {
        openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
    },

    // Informazioni sistema
    platform: process.platform,
    version: process.versions.electron,
});
