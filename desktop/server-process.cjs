const { fork } = require('child_process');
const path = require('path');
const http = require('http');
const fs = require('fs');

class ServerProcess {
    constructor() {
        this.serverProcess = null;
        this.port = 5000;
        this.maxRetries = 30;
        this.retryDelay = 250;
    }

    /**
     * Avvia il server Express come processo figlio
     */
    async start(userDataPath) {
        return new Promise((resolve, reject) => {
            try {
                // Determina il percorso del server in base all'ambiente
                const isDev = process.env.NODE_ENV === 'development';

                // In development, il server è già in esecuzione separatamente
                if (isDev) {
                    console.log('[ServerProcess] Modalità sviluppo: server già in esecuzione');
                    this.waitForServer()
                        .then(() => {
                            console.log('[ServerProcess] Server esterno pronto!');
                            resolve();
                        })
                        .catch(reject);
                    return;
                }

                // In produzione, avvia il server come subprocess
                const serverPath = path.join(__dirname, '..', 'dist', 'index.cjs');

                console.log('[ServerProcess] Avvio server da:', serverPath);
                console.log('[ServerProcess] User data path:', userDataPath);

                // --- DATABASE SETUP LOGIC ---
                const dbTarget = path.join(userDataPath, 'pulse-erp.db');

                // Se il DB non esiste, prova a copiare quello iniziale
                if (!fs.existsSync(dbTarget)) {
                    try {
                        const exeDir = path.dirname(process.execPath);
                        // Cerca in vari percorsi possibili
                        const searchPaths = [
                            path.join(exeDir, 'Database_Iniziale.db'),
                            path.join(process.cwd(), 'Database_Iniziale.db'),
                            path.join(exeDir, '..', 'Database_Iniziale.db')
                        ];

                        let initialDbPath = null;
                        for (const p of searchPaths) {
                            if (fs.existsSync(p)) {
                                initialDbPath = p;
                                break;
                            }
                        }

                        if (initialDbPath) {
                            console.log('[ServerProcess] Trovato DB iniziale in:', initialDbPath);
                            console.log('[ServerProcess] Copia Database_Iniziale.db in corso...');
                            fs.copyFileSync(initialDbPath, dbTarget);
                            console.log('[ServerProcess] DB Iniziale copiato con successo');
                        } else {
                            console.log('[ServerProcess] Nessun DB iniziale trovato. Verrà creato un nuovo DB vuoto.');
                        }
                    } catch (err) {
                        console.error('[ServerProcess] Errore copia DB iniziale:', err);
                    }
                }

                // Configura le variabili d'ambiente per il server
                const env = {
                    ...process.env,
                    NODE_ENV: 'production',
                    PORT: this.port.toString(),
                    DATABASE_URL: `file:${dbTarget}`,
                    ELECTRON_MODE: 'true',
                    RESOURCES_PATH: process.resourcesPath,
                    SESSION_SECRET: 'pulse-erp-desktop-secret-' + Date.now(),
                };

                // In produzione il server è già compilato in JavaScript
                if (!fs.existsSync(serverPath)) {
                    reject(new Error(`Server non trovato: ${serverPath}`));
                    return;
                }

                this.serverProcess = fork(serverPath, [], {
                    env,
                    stdio: 'pipe',
                });

                // Log dell'output del server
                this.serverProcess.stdout?.on('data', (data) => {
                    console.log('[Server]', data.toString().trim());
                });

                this.serverProcess.stderr?.on('data', (data) => {
                    console.error('[Server Error]', data.toString().trim());
                });

                this.serverProcess.on('error', (error) => {
                    console.error('[ServerProcess] Errore processo:', error);
                    reject(error);
                });

                this.serverProcess.on('exit', (code, signal) => {
                    console.log(`[ServerProcess] Server terminato (code: ${code}, signal: ${signal})`);
                });

                // Attendi che il server sia pronto
                this.waitForServer()
                    .then(() => {
                        console.log('[ServerProcess] Server pronto!');
                        resolve();
                    })
                    .catch(reject);

            } catch (error) {
                console.error('[ServerProcess] Errore avvio:', error);
                reject(error);
            }
        });
    }

    /**
     * Verifica che il server sia pronto ad accettare connessioni
     */
    async waitForServer() {
        let serverExited = false;
        let exitCode = null;

        const exitHandler = (code, signal) => {
            serverExited = true;
            exitCode = code;
        };

        this.serverProcess.once('exit', exitHandler);

        try {
            for (let i = 0; i < this.maxRetries; i++) {
                if (serverExited) {
                    throw new Error(`Server terminato inaspettatamente (code: ${exitCode})`);
                }

                try {
                    await this.checkServerHealth();
                    this.serverProcess.removeListener('exit', exitHandler);
                    return;
                } catch (error) {
                    console.log(`[ServerProcess] Tentativo ${i + 1}/${this.maxRetries}...`);
                    await this.sleep(this.retryDelay);
                }
            }
            throw new Error('Server non ha risposto dopo ' + this.maxRetries + ' tentativi');
        } finally {
            this.serverProcess.removeListener('exit', exitHandler);
        }
    }

    /**
     * Controlla lo stato di salute del server
     */
    checkServerHealth() {
        return new Promise((resolve, reject) => {
            const req = http.get(`http://localhost:${this.port}/api/health`, (res) => {
                if (res.statusCode === 200 || res.statusCode === 404) {
                    // 404 è ok se l'endpoint /api/health non esiste
                    resolve();
                } else {
                    reject(new Error(`Server health check fallito: ${res.statusCode}`));
                }
            });

            req.on('error', reject);
            req.setTimeout(500, () => {
                req.destroy();
                reject(new Error('Timeout'));
            });
        });
    }

    /**
     * Utility per attendere
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Ferma il server
     */
    stop() {
        return new Promise((resolve) => {
            if (!this.serverProcess) {
                resolve();
                return;
            }

            console.log('[ServerProcess] Arresto server...');

            this.serverProcess.once('exit', () => {
                console.log('[ServerProcess] Server arrestato');
                this.serverProcess = null;
                resolve();
            });

            // Prova a terminare gentilmente
            this.serverProcess.kill('SIGTERM');

            // Se non si ferma entro 5 secondi, forza la terminazione
            setTimeout(() => {
                if (this.serverProcess) {
                    console.log('[ServerProcess] Terminazione forzata...');
                    this.serverProcess.kill('SIGKILL');
                    this.serverProcess = null;
                    resolve();
                }
            }, 5000);
        });
    }

    /**
     * Ottiene l'URL del server
     */
    getServerUrl() {
        return `http://localhost:${this.port}`;
    }
}

module.exports = ServerProcess;
