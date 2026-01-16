/**
 * Script per verificare e inizializzare il database SQLite
 * Eseguire con: npx tsx script/init-db.ts
 */

import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configura il percorso del database
const dbPath = path.join(__dirname, "..", "data", "pulse.db");

async function initDatabase() {
    console.log("🔧 Inizializzazione database PULSE ERP...\n");
    console.log("📁 Database path:", dbPath, "\n");

    try {
        // Apri il database
        const db = new Database(dbPath);

        // Abilita foreign keys
        db.pragma("foreign_keys = ON");

        // Verifica tabelle esistenti
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        console.log("📋 Tabelle esistenti:", tables.map((t: any) => t.name).join(", ") || "(nessuna)");

        // Se non esistono tabelle, crea quelle base
        if (tables.length === 0 || !tables.find((t: any) => t.name === 'users')) {
            console.log("\n🏗️  Creazione tabelle base...\n");

            // Crea tabella users
            db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          username TEXT UNIQUE,
          password TEXT,
          role TEXT NOT NULL DEFAULT 'Member',
          department TEXT,
          status TEXT NOT NULL DEFAULT 'Active',
          avatar TEXT,
          allowed_ip TEXT
        )
      `);
            console.log("  ✅ Tabella users creata");

            // Crea tabella app_settings
            db.exec(`
        CREATE TABLE IF NOT EXISTS app_settings (
          id TEXT PRIMARY KEY,
          key TEXT NOT NULL UNIQUE,
          value TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `);
            console.log("  ✅ Tabella app_settings creata");

            // Crea tabella user_access_logs
            db.exec(`
        CREATE TABLE IF NOT EXISTS user_access_logs (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          login_at TEXT DEFAULT (datetime('now')),
          ip_address TEXT,
          user_agent TEXT,
          device TEXT,
          browser TEXT,
          os TEXT,
          success INTEGER DEFAULT 1,
          logout_at TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
            console.log("  ✅ Tabella user_access_logs creata");
        }

        // Crea utente admin
        console.log("\n👤 Creazione utente Admin...\n");

        const adminId = randomUUID();
        const hashedPassword = await bcrypt.hash("admin123", 10);

        // Verifica se esiste già un utente admin
        const existing = db.prepare("SELECT id FROM users WHERE username = ?").get("admin");

        if (existing) {
            console.log("  ⚠️  Utente 'admin' già esistente. Aggiorno la password...");
            db.prepare("UPDATE users SET password = ? WHERE username = ?").run(hashedPassword, "admin");
        } else {
            db.prepare(`
        INSERT INTO users (id, name, email, username, password, role, department, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(adminId, "Amministratore", "admin@pulse-erp.local", "admin", hashedPassword, "Admin", "IT", "Active");
            console.log("  ✅ Utente Admin creato");
        }

        // Imposta setup_complete
        const settingExists = db.prepare("SELECT id FROM app_settings WHERE key = ?").get("setup_complete");
        if (!settingExists) {
            db.prepare("INSERT INTO app_settings (id, key, value) VALUES (?, ?, ?)")
                .run(randomUUID(), "setup_complete", "true");
            console.log("  ✅ Setup marcato come completato");
        } else {
            db.prepare("UPDATE app_settings SET value = ? WHERE key = ?")
                .run("true", "setup_complete");
            console.log("  ✅ Setup aggiornato come completato");
        }

        db.close();

        console.log("\n========================================");
        console.log("🎉 Database inizializzato con successo!");
        console.log("========================================");
        console.log("📧 Email:    admin@pulse-erp.local");
        console.log("👤 Username: admin");
        console.log("🔑 Password: admin123");
        console.log("========================================\n");

    } catch (error) {
        console.error("❌ Errore:", error);
        process.exit(1);
    }
}

initDatabase();
