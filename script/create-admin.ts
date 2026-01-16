/**
 * Script per creare un utente Admin nel database
 * Eseguire con: npx tsx script/create-admin.ts
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

async function createAdmin() {
    console.log("🔧 Creazione utente Admin per PULSE ERP...\n");

    try {
        // Apri il database
        const db = new Database(dbPath);

        // Dati utente admin
        const adminData = {
            id: randomUUID(),
            name: "Amministratore",
            email: "admin@pulse-erp.local",
            username: "admin",
            password: await bcrypt.hash("admin123", 10), // Password: admin123
            role: "Admin",
            department: "IT",
            status: "Active",
            avatar: null,
            allowedIp: null,
        };

        // Verifica se esiste già un utente admin
        const existing = db.prepare("SELECT id FROM users WHERE username = ?").get("admin");

        if (existing) {
            console.log("⚠️  Utente 'admin' già esistente. Aggiorno la password...");
            db.prepare("UPDATE users SET password = ? WHERE username = ?").run(adminData.password, "admin");
            console.log("✅ Password aggiornata!");
        } else {
            // Inserisci il nuovo utente
            db.prepare(`
        INSERT INTO users (id, name, email, username, password, role, department, status, avatar, allowed_ip)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
                adminData.id,
                adminData.name,
                adminData.email,
                adminData.username,
                adminData.password,
                adminData.role,
                adminData.department,
                adminData.status,
                adminData.avatar,
                adminData.allowedIp
            );
            console.log("✅ Utente Admin creato con successo!");
        }

        // Imposta setup_complete
        const settingExists = db.prepare("SELECT id FROM app_settings WHERE key = ?").get("setup_complete");
        if (!settingExists) {
            db.prepare("INSERT INTO app_settings (id, key, value) VALUES (?, ?, ?)").run(randomUUID(), "setup_complete", "true");
            console.log("✅ Setup marcato come completato!");
        }

        db.close();

        console.log("\n========================================");
        console.log("🎉 Operazione completata!");
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

createAdmin();
