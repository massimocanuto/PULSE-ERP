const http = require('http');
const https = require('https');

/**
 * Servizio per la sincronizzazione tra database locale (SQLite) e remoto (PostgreSQL)
 * quando l'applicazione desktop ha connessione internet
 */
class SyncService {
    constructor() {
        this.isOnline = false;
        this.isSyncing = false;
        this.lastSyncTime = null;
        this.syncInterval = null;
        this.remoteServerUrl = null;
        this.authToken = null;

        // Tabelle da sincronizzare
        this.syncTables = [
            'customers',
            'suppliers',
            'products',
            'orders',
            'invoices',
            'projects',
            'tasks',
            'documents',
            'users',
            'activities',
            'contacts',
            'notes',
            // Aggiungi altre tabelle secondo necessità
        ];
    }

    /**
     * Inizializza il servizio di sincronizzazione
     */
    async initialize(remoteServerUrl, authToken) {
        this.remoteServerUrl = remoteServerUrl;
        this.authToken = authToken;

        // Controlla subito se siamo online
        await this.checkOnlineStatus();

        // Controlla ogni 30 secondi
        this.syncInterval = setInterval(async () => {
            await this.checkOnlineStatus();

            if (this.isOnline && !this.isSyncing) {
                await this.performSync();
            }
        }, 30000);

        console.log('[SyncService] Inizializzato con server:', remoteServerUrl);
    }

    /**
     * Controlla se c'è connessione al server remoto
     */
    async checkOnlineStatus() {
        if (!this.remoteServerUrl) {
            this.isOnline = false;
            return false;
        }

        try {
            const wasOnline = this.isOnline;
            this.isOnline = await this.pingServer();

            if (this.isOnline && !wasOnline) {
                console.log('[SyncService] ✓ Connessione al server remoto ripristinata');
                // Avvia sincronizzazione automatica quando torniamo online
                await this.performSync();
            } else if (!this.isOnline && wasOnline) {
                console.log('[SyncService] ✗ Persa connessione al server remoto');
            }

            return this.isOnline;
        } catch (error) {
            this.isOnline = false;
            return false;
        }
    }

    /**
     * Ping al server remoto
     */
    pingServer() {
        return new Promise((resolve) => {
            try {
                const url = new URL(this.remoteServerUrl);
                const protocol = url.protocol === 'https:' ? https : http;

                const req = protocol.get(`${this.remoteServerUrl}/api/health`, {
                    timeout: 5000,
                    headers: {
                        'Authorization': `Bearer ${this.authToken}`
                    }
                }, (res) => {
                    resolve(res.statusCode === 200);
                });

                req.on('error', () => resolve(false));
                req.on('timeout', () => {
                    req.destroy();
                    resolve(false);
                });
            } catch (error) {
                resolve(false);
            }
        });
    }

    /**
     * Esegue la sincronizzazione bidirezionale
     */
    async performSync() {
        if (this.isSyncing || !this.isOnline) {
            return;
        }

        this.isSyncing = true;
        console.log('[SyncService] Inizio sincronizzazione...');

        try {
            const startTime = Date.now();

            // 1. Pull: Scarica modifiche dal server remoto
            await this.pullFromRemote();

            // 2. Push: Invia modifiche locali al server remoto
            await this.pushToRemote();

            this.lastSyncTime = new Date();
            const duration = Date.now() - startTime;
            console.log(`[SyncService] ✓ Sincronizzazione completata in ${duration}ms`);

            // Notifica l'UI dell'avvenuta sincronizzazione
            this.notifyUI('sync-complete', {
                timestamp: this.lastSyncTime,
                duration
            });

        } catch (error) {
            console.error('[SyncService] Errore sincronizzazione:', error);
            this.notifyUI('sync-error', { error: error.message });
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Scarica modifiche dal server remoto (PULL)
     */
    async pullFromRemote() {
        console.log('[SyncService] Pull da server remoto...');

        try {
            const response = await this.fetchFromRemote('/api/sync/changes', {
                method: 'POST',
                body: JSON.stringify({
                    lastSyncTime: this.lastSyncTime,
                    tables: this.syncTables
                })
            });

            if (response.changes && response.changes.length > 0) {
                console.log(`[SyncService] Ricevute ${response.changes.length} modifiche remote`);

                // Applica le modifiche al database locale
                // Questo deve essere implementato nel server Express
                await this.applyChangesToLocal(response.changes);
            } else {
                console.log('[SyncService] Nessuna modifica remota da sincronizzare');
            }
        } catch (error) {
            console.error('[SyncService] Errore durante il pull:', error);
            throw error;
        }
    }

    /**
     * Invia modifiche locali al server remoto (PUSH)
     */
    async pushToRemote() {
        console.log('[SyncService] Push verso server remoto...');

        try {
            // Ottieni le modifiche locali non sincronizzate
            const localChanges = await this.getLocalChanges();

            if (localChanges.length === 0) {
                console.log('[SyncService] Nessuna modifica locale da sincronizzare');
                return;
            }

            console.log(`[SyncService] Invio ${localChanges.length} modifiche locali`);

            const response = await this.fetchFromRemote('/api/sync/apply', {
                method: 'POST',
                body: JSON.stringify({
                    changes: localChanges
                })
            });

            if (response.success) {
                // Marca le modifiche come sincronizzate
                await this.markAsSynced(localChanges);
                console.log('[SyncService] ✓ Modifiche locali inviate con successo');
            } else if (response.conflicts) {
                console.warn('[SyncService] ⚠ Rilevati conflitti:', response.conflicts);
                await this.handleConflicts(response.conflicts);
            }
        } catch (error) {
            console.error('[SyncService] Errore durante il push:', error);
            throw error;
        }
    }

    /**
     * Fetch wrapper con autenticazione
     */
    async fetchFromRemote(endpoint, options = {}) {
        const url = `${this.remoteServerUrl}${endpoint}`;

        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.authToken}`,
                ...options.headers
            }
        });

        if (!response.ok) {
            throw new Error(`Server remoto ha risposto con ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Ottiene le modifiche locali non ancora sincronizzate
     * Questa funzione deve essere implementata nel server Express
     */
    async getLocalChanges() {
        // Placeholder - da implementare nel server Express
        // Dovrebbe interrogare una tabella "sync_queue" o simile
        return [];
    }

    /**
     * Applica le modifiche remote al database locale
     */
    async applyChangesToLocal(changes) {
        // Placeholder - da implementare nel server Express
        // Dovrebbe applicare le modifiche al database SQLite locale
        console.log('[SyncService] Applicazione modifiche locali...');
    }

    /**
     * Marca le modifiche come sincronizzate
     */
    async markAsSynced(changes) {
        // Placeholder - da implementare nel server Express
        console.log('[SyncService] Marcatura modifiche come sincronizzate...');
    }

    /**
     * Gestisce i conflitti di sincronizzazione
     */
    async handleConflicts(conflicts) {
        console.warn('[SyncService] Gestione conflitti...');

        // Strategia di default: server vince (last-write-wins dal server)
        // Puoi implementare strategie più sofisticate
        for (const conflict of conflicts) {
            console.log(`[SyncService] Conflitto su ${conflict.table} ID ${conflict.id}`);
            // Implementa la logica di risoluzione
        }
    }

    /**
     * Notifica l'UI degli eventi di sincronizzazione
     */
    notifyUI(event, data) {
        // Questo può essere implementato con WebSocket o IPC di Electron
        console.log(`[SyncService] Evento UI: ${event}`, data);
    }

    /**
     * Forza una sincronizzazione manuale
     */
    async forcSync() {
        console.log('[SyncService] Sincronizzazione manuale richiesta');
        await this.checkOnlineStatus();

        if (!this.isOnline) {
            throw new Error('Nessuna connessione al server remoto');
        }

        await this.performSync();
    }

    /**
     * Ottiene lo stato corrente della sincronizzazione
     */
    getStatus() {
        return {
            isOnline: this.isOnline,
            isSyncing: this.isSyncing,
            lastSyncTime: this.lastSyncTime,
            remoteServerUrl: this.remoteServerUrl
        };
    }

    /**
     * Ferma il servizio di sincronizzazione
     */
    stop() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        console.log('[SyncService] Servizio fermato');
    }
}

module.exports = SyncService;
