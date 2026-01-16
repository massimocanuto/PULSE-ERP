
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const sourcePath = path.resolve('data/pulse.db');
const destPath = 'C:\\Pulse_Setup\\Database_Iniziale.db';

async function main() {
    console.log(`Backing up ${sourcePath} to ${destPath}...`);

    if (!fs.existsSync(sourcePath)) {
        console.error("Source DB not found!");
        process.exit(1);
    }

    try {
        const src = new Database(sourcePath, { readonly: true });
        await src.backup(destPath);
        console.log("Backup complete.");
        src.close();

        console.log("Cleaning destination database...");
        const db = new Database(destPath);

        // Get all tables
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[];

        // Disable foreign keys to allow clearing values
        db.pragma('foreign_keys = OFF');
        console.log("Foreign keys disabled.");

        db.transaction(() => {
            for (const table of tables) {
                if (table.name === '__drizzle_migrations') continue;
                if (table.name === 'sqlite_sequence') continue; // Skip internal table

                console.log(`Clearing table: ${table.name}`);
                db.prepare(`DELETE FROM "${table.name}"`).run();
            }

            // Re-enable/Check
            db.pragma('foreign_keys = ON');
        })();

        console.log("Database cleaned. Re-seeding initial user...");

        // Seed logic manually to avoid import issues
        const stmt = db.prepare("SELECT * FROM users WHERE username = ?");
        const existing = stmt.get('massimo.canuto');

        if (!existing) {
            // Hash for '1234'
            const hash = '$2a$10$w./././././././././././././././././././././././.'; // Placehoder? No need real hash.
            // I need bcryptjs hash.
            // I'll skip re-seeding here and let the app do it on startup?
            // The app startup logic (Step 14) checks if user exists. If I deleted it, it will create it!
            console.log("Users table cleared. App will re-seed on startup.");
        }

        db.close();
        console.log("Success!");

    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

main();
