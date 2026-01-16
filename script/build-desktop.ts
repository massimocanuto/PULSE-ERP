import { build as viteBuild } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

console.log('🏗️  Build Desktop Standalone - PULSE ERP\n');

async function buildDesktop() {
    try {
        // 1. Usa lo script di build esistente (che funziona già)
        console.log('📦 Building application (client + server)...');

        const { stdout, stderr } = await execPromise('npm run build', {
            cwd: rootDir
        });

        if (stdout) console.log(stdout);
        if (stderr && !stderr.includes('DeprecationWarning')) console.error(stderr);

        console.log('✅ Build completato\n');

        // 2. Verifica che i file desktop esistano
        console.log('📦 Verifying Electron files...');
        const desktopDir = path.join(rootDir, 'desktop');
        const requiredFiles = ['main.cjs', 'preload.js', 'server-process.cjs', 'sync-service.cjs'];

        for (const file of requiredFiles) {
            const filePath = path.join(desktopDir, file);
            if (!fs.existsSync(filePath)) {
                throw new Error(`File mancante: desktop/${file}`);
            }
            console.log(`  ✓ ${file}`);
        }

        // 3. Verifica build output
        const distPublic = path.join(rootDir, 'dist/public');
        const distServer = path.join(rootDir, 'dist/index.cjs');

        if (!fs.existsSync(distPublic)) {
            throw new Error('Client build non trovato');
        }
        if (!fs.existsSync(distServer)) {
            throw new Error('Server build non trovato');
        }

        console.log('✅ Electron package verificato\n');

        // Riepilogo
        console.log('✨ Build Desktop Completato!\n');
        console.log('📁 Output:');
        console.log('   • Client: dist/public/');
        console.log('   • Server: dist/index.cjs');
        console.log('   • Desktop: desktop/*\n');
        console.log('🚀 Prossimo passo:');
        console.log('   npm run electron:build    - Crea installer .exe Windows\n');
        console.log('   oppure');
        console.log('   npm run electron:package  - Crea solo il pacchetto\n');

    } catch (error: any) {
        console.error('❌ Errore durante il build:', error.message || error);
        process.exit(1);
    }
}

buildDesktop();
