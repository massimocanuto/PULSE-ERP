/**
 * Offline Manager - Gestisce lo stato online/offline e la sincronizzazione
 */

export type ConnectionStatus = 'online' | 'offline' | 'syncing';

export interface PendingOperation {
    id: string;
    timestamp: number;
    endpoint: string;
    method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    data: any;
    retries: number;
}

class OfflineManager {
    private isOnline: boolean = navigator.onLine;
    private listeners: Set<(status: ConnectionStatus) => void> = new Set();
    private pendingOperations: PendingOperation[] = [];
    private syncInProgress: boolean = false;
    private readonly STORAGE_KEY = 'pulse_offline_queue';
    private readonly MAX_RETRIES = 3;

    constructor() {
        this.loadPendingOperations();
        this.setupEventListeners();
        this.checkConnection();
    }

    private setupEventListeners() {
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());

        // Verifica periodica ogni 30 secondi
        setInterval(() => this.checkConnection(), 30000);
    }

    private async checkConnection(): Promise<void> {
        try {
            const response = await fetch('/api/health', {
                method: 'HEAD',
                cache: 'no-cache',
            });

            if (response.ok && !this.isOnline) {
                this.handleOnline();
            }
        } catch (error) {
            if (this.isOnline) {
                this.handleOffline();
            }
        }
    }

    private handleOnline() {
        console.log('🌐 Connessione rilevata');
        this.isOnline = true;
        this.notifyListeners('online');

        // Mostra notifica all'utente
        this.showNotification('🌐 Connessione ripristinata', 'Avvio sincronizzazione dati...');

        // Avvia sincronizzazione
        this.syncPendingOperations();
    }

    private handleOffline() {
        console.log('📡 Modalità offline attivata');
        this.isOnline = false;
        this.notifyListeners('offline');
        this.showNotification('📡 Modalità Offline', 'Continua a lavorare, i dati verranno sincronizzati.');
    }

    private showNotification(title: string, message: string) {
        // Usa l'API Notification se disponibile
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body: message, icon: '/favicon.png' });
        }

        // Emetti evento personalizzato per UI
        window.dispatchEvent(new CustomEvent('pulse-notification', {
            detail: { title, message, type: this.isOnline ? 'success' : 'warning' }
        }));
    }

    public getStatus(): ConnectionStatus {
        if (this.syncInProgress) return 'syncing';
        return this.isOnline ? 'online' : 'offline';
    }

    public onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
        this.listeners.add(callback);
        // Chiama subito con lo stato attuale
        callback(this.getStatus());

        // Ritorna funzione per rimuovere il listener
        return () => this.listeners.delete(callback);
    }

    private notifyListeners(status: ConnectionStatus) {
        this.listeners.forEach(callback => callback(status));
    }

    // Aggiunge un'operazione alla queue
    public queueOperation(endpoint: string, method: PendingOperation['method'], data: any): string {
        const operation: PendingOperation = {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            endpoint,
            method,
            data,
            retries: 0,
        };

        this.pendingOperations.push(operation);
        this.savePendingOperations();

        console.log(`📝 Operazione accodata: ${method} ${endpoint}`);

        // Se siamo online, prova subito a sincronizzare
        if (this.isOnline && !this.syncInProgress) {
            this.syncPendingOperations();
        }

        return operation.id;
    }

    // Sincronizza tutte le operazioni in coda
    private async syncPendingOperations(): Promise<void> {
        if (this.syncInProgress || this.pendingOperations.length === 0 || !this.isOnline) {
            return;
        }

        this.syncInProgress = true;
        this.notifyListeners('syncing');

        console.log(`🔄 Sincronizzazione di ${this.pendingOperations.length} operazioni...`);

        const operationsToSync = [...this.pendingOperations];
        const failed: PendingOperation[] = [];

        for (const operation of operationsToSync) {
            try {
                const response = await fetch(operation.endpoint, {
                    method: operation.method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(operation.data),
                });

                if (response.ok) {
                    console.log(`✅ Sincronizzato: ${operation.method} ${operation.endpoint}`);
                    // Rimuovi dalla queue
                    this.pendingOperations = this.pendingOperations.filter(op => op.id !== operation.id);
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
            } catch (error) {
                console.error(`❌ Errore sincronizzazione ${operation.endpoint}:`, error);
                operation.retries++;

                if (operation.retries < this.MAX_RETRIES) {
                    failed.push(operation);
                } else {
                    console.error(`🚫 Operazione scartata dopo ${this.MAX_RETRIES} tentativi:`, operation);
                }
            }
        }

        // Mantieni solo le operazioni fallite che non hanno superato il limite di retry
        this.pendingOperations = failed;
        this.savePendingOperations();

        this.syncInProgress = false;
        this.notifyListeners(this.isOnline ? 'online' : 'offline');

        if (this.pendingOperations.length === 0) {
            this.showNotification('✅ Sincronizzazione completata', 'Tutti i dati sono aggiornati');
        } else {
            this.showNotification('⚠️ Sincronizzazione parziale', `${this.pendingOperations.length} operazioni in attesa`);
        }
    }

    private loadPendingOperations() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                this.pendingOperations = JSON.parse(stored);
                console.log(`📦 Caricate ${this.pendingOperations.length} operazioni offline`);
            }
        } catch (error) {
            console.error('Errore caricamento queue offline:', error);
        }
    }

    private savePendingOperations() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.pendingOperations));
        } catch (error) {
            console.error('Errore salvataggio queue offline:', error);
        }
    }

    public getPendingCount(): number {
        return this.pendingOperations.length;
    }

    public clearQueue(): void {
        this.pendingOperations = [];
        this.savePendingOperations();
    }

    // Richiedi i permessi per le notifiche
    public async requestNotificationPermission(): Promise<void> {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }
}

// Singleton
export const offlineManager = new OfflineManager();

// Hook per React
export function useOfflineStatus() {
    const [status, setStatus] = React.useState<ConnectionStatus>(offlineManager.getStatus());
    const [pendingCount, setPendingCount] = React.useState(offlineManager.getPendingCount());

    React.useEffect(() => {
        const unsubscribe = offlineManager.onStatusChange((newStatus) => {
            setStatus(newStatus);
            setPendingCount(offlineManager.getPendingCount());
        });

        // Aggiorna il conteggio ogni 2 secondi
        const interval = setInterval(() => {
            setPendingCount(offlineManager.getPendingCount());
        }, 2000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, []);

    return { status, pendingCount, isOnline: status === 'online' };
}

import React from 'react';
