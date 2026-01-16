
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "..", "data", "pulse.db");

const db = new Database(dbPath);

console.log("🔧 Ripristino tabelle Finanza...");

db.exec(`
  CREATE TABLE IF NOT EXISTS finanza_movimenti (
    id TEXT PRIMARY KEY,
    tipo TEXT NOT NULL,
    categoria TEXT,
    descrizione TEXT,
    importo TEXT NOT NULL,
    data TEXT NOT NULL,
    conto TEXT,
    note TEXT,
    user_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS finanza_categorie (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL,
    colore TEXT DEFAULT '#3b82f6',
    icona TEXT,
    parent_id TEXT,
    user_id TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS finanza_obiettivi (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    importo_obiettivo TEXT NOT NULL,
    importo_attuale TEXT DEFAULT '0',
    data_inizio TEXT,
    data_obiettivo TEXT,
    colore TEXT DEFAULT '#10b981',
    icona TEXT,
    completato INTEGER DEFAULT 0,
    user_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

console.log("✅ Tabelle Finanza ripristinate.");
