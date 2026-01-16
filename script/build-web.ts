import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

console.log('🌐 Build Web/PWA - PULSE ERP\n');

async function buildWeb() {
    try {
        // 1. Usa lo script di build esistente
        console.log('📦 Building application (client + server)...');

        const { stdout, stderr } = await execPromise('npm run build', {
            cwd: rootDir
        });

        if (stdout) console.log(stdout);
        if (stderr && !stderr.includes('DeprecationWarning')) console.error(stderr);

        console.log('✅ Build completato\n');

        // 2. Verifica PWA assets
        console.log('📱 Verifying PWA assets...');
        const manifestPath = path.join(rootDir, 'dist/public/manifest.json');
        const swPath = path.join(rootDir, 'dist/public/service-worker.js');

        if (fs.existsSync(manifestPath)) {
            console.log('  ✓ manifest.json presente');
        } else {
            console.warn('  ⚠ manifest.json non trovato - verifica che sia in client/public/');
        }

        if (fs.existsSync(swPath)) {
            console.log('  ✓ service-worker.js presente');
        } else {
            console.warn('  ⚠ service-worker.js non trovato - verifica che sia in client/public/');
        }

        // 3. Analisi dimensioni bundle
        const distPath = path.join(rootDir, 'dist/public');
        if (fs.existsSync(distPath)) {
            const files = fs.readdirSync(distPath);
            const jsFiles = files.filter(f => f.endsWith('.js'));
            let totalSize = 0;

            jsFiles.forEach(file => {
                const filePath = path.join(distPath, file);
                const stats = fs.statSync(filePath);
                totalSize += stats.size;
            });

            console.log(`  📊 Total JS bundle size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

            if (totalSize > 5 * 1024 * 1024) {
                console.warn('  ⚠ Bundle size is large, consider code splitting');
            }
        }

        console.log('✅ PWA assets verificati\n');

        // Riepilogo
        console.log('✨ Build Web Completato!\n');
        console.log('📁 Output:');
        console.log('   • Client (PWA): dist/public/');
        console.log('   • Server: dist/index.cjs\n');
        console.log('🚀 Deployment Web:');
        console.log('   1. Copia la cartella dist/ sul tuo server');
        console.log('   2. Configura le variabili d\'ambiente (.env)');
        console.log('   3. Installa dipendenze: npm ci --production');
        console.log('   4. Avvia server: npm start\n');
        console.log('📚 Per maggiori dettagli: WEB_DEPLOYMENT_GUIDE.md');

    } catch (error: any) {
        console.error('❌ Errore durante il build:', error.message || error);
        process.exit(1);
    }
}

buildWeb();
