
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "..", "data", "pulse.db");

console.log("🔍 Eseguo diagnostica completa del database...\n");

const db = new Database(dbPath);

const tablesToCheck = [
    "users", "projects", "tasks", "anagrafica_clienti", "crm_leads",
    "anagrafica_personale", "finanza_movimenti", "emails"
];

let errors = 0;

// 1. Verifica Tabelle
console.log("📊 Verifica Strutturaabelle:");
for (const table of tablesToCheck) {
    try {
        const info = db.pragma(`table_info(${table})`);
        if (info.length === 0) {
            console.error(`❌ Tabella MANCANTE: ${table}`);
            errors++;
        } else {
            console.log(`✅ Tabella trovata: ${table} (${info.length} colonne)`);
        }
    } catch (e) {
        console.error(`❌ Errore verifica tabella ${table}:`, e.message);
        errors++;
    }
}

// 2. Test Inserimento (Salvataggio)
console.log("\n💾 Test Salvataggio Dati:");

// Test Utente
try {
    const testId = randomUUID();
    db.prepare(`
    INSERT INTO users (id, name, email, username, role, status)
    VALUES (?, ?, ?, ?, ?, 'Active')
  `).run(testId, "Test User", "test@example.com", "testuser", "Member");
    console.log("✅ Insert User: OK");

    // Clean up
    db.prepare("DELETE FROM users WHERE id = ?").run(testId);
} catch (e) {
    console.error("❌ Insert User FALLITO:", e.message);
    errors++;
}

// Test Progetto
try {
    const testId = randomUUID();
    // Nota: SQLite usa stringhe per gli array JSON, quindi '[]' invece di '{}' di Postgres
    db.prepare(`
    INSERT INTO projects (id, title, status, priority, team_members, files)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(testId, "Test Project", "Not Started", "Medium", "[]", "[]");
    console.log("✅ Insert Project: OK");
    db.prepare("DELETE FROM projects WHERE id = ?").run(testId);
} catch (e) {
    console.error("❌ Insert Project FALLITO:", e.message);
    // Se fallisce, stampiamo le colonne per capire perché
    const cols = db.pragma(`table_info(projects)`);
    console.log("   Colonne presenti:", cols.map(c => c.name).join(", "));
    errors++;
}

// Test Cliente (Anagrafica)
try {
    const testId = randomUUID();
    db.prepare(`
    INSERT INTO anagrafica_clienti (id, ragione_sociale, email, stato, attivo)
    VALUES (?, ?, ?, ?, ?)
  `).run(testId, "Cliente Test SRL", "info@clientetest.it", "attivo", 1);
    console.log("✅ Insert Cliente: OK");
    db.prepare("DELETE FROM anagrafica_clienti WHERE id = ?").run(testId);
} catch (e) {
    console.error("❌ Insert Cliente FALLITO:", e.message);
    const cols = db.pragma(`table_info(anagrafica_clienti)`);
    console.log("   Colonne presenti:", cols.map(c => c.name).join(", "));
    errors++;
}

console.log(`\n🏁 Diagnostica completata con ${errors} errori.\n`);
process.exit(errors > 0 ? 1 : 0);
