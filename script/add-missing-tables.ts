/**
 * Script per aggiungere le tabelle mancanti al database SQLite
 * Eseguire con: npx tsx script/add-missing-tables.ts
 */

import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "..", "data", "pulse.db");

function addMissingTables() {
    console.log("🔧 Aggiunta tabelle mancanti per PULSE ERP...\n");
    console.log("📁 Database path:", dbPath, "\n");

    try {
        const db = new Database(dbPath);
        db.pragma("foreign_keys = ON");

        // Richieste assenza
        db.exec(`
            CREATE TABLE IF NOT EXISTS richieste_assenza (
                id TEXT PRIMARY KEY,
                personale_id TEXT NOT NULL,
                tipo TEXT NOT NULL DEFAULT 'ferie',
                data_inizio TEXT NOT NULL,
                data_fine TEXT NOT NULL,
                giorni_totali TEXT NOT NULL DEFAULT '1',
                ore_totali TEXT,
                motivo TEXT,
                stato TEXT NOT NULL DEFAULT 'richiesta',
                approvato_da TEXT,
                data_approvazione TEXT,
                note_approvazione TEXT,
                allegato TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella richieste_assenza creata");

        // CRM Leads
        db.exec(`
            CREATE TABLE IF NOT EXISTS crm_leads (
                id TEXT PRIMARY KEY,
                nome TEXT NOT NULL,
                cognome TEXT,
                azienda TEXT,
                email TEXT,
                telefono TEXT,
                cellulare TEXT,
                fonte TEXT,
                stato TEXT DEFAULT 'nuovo',
                priorita TEXT DEFAULT 'media',
                valore_stimato TEXT,
                probabilita INTEGER,
                note TEXT,
                assegnato_a TEXT,
                ultima_attivita TEXT,
                prossima_attivita TEXT,
                tags TEXT DEFAULT '[]',
                custom_fields TEXT DEFAULT '{}',
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella crm_leads creata");

        // Notifiche HR
        db.exec(`
            CREATE TABLE IF NOT EXISTS notifiche_hr (
                id TEXT PRIMARY KEY,
                personale_id TEXT NOT NULL,
                tipo TEXT NOT NULL,
                titolo TEXT NOT NULL,
                messaggio TEXT,
                data_scadenza TEXT,
                letta INTEGER DEFAULT 0,
                email_inviata INTEGER DEFAULT 0,
                data_email_inviata TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella notifiche_hr creata");

        // Cedolini
        db.exec(`
            CREATE TABLE IF NOT EXISTS cedolini (
                id TEXT PRIMARY KEY,
                personale_id TEXT NOT NULL,
                mese INTEGER NOT NULL,
                anno INTEGER NOT NULL,
                filename TEXT NOT NULL,
                filepath TEXT NOT NULL,
                filesize INTEGER,
                mimetype TEXT,
                stipendio_lordo TEXT,
                stipendio_netto TEXT,
                contributi_inps TEXT,
                irpef TEXT,
                bonus TEXT,
                straordinari TEXT,
                note TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella cedolini creata");

        // Timbrature
        db.exec(`
            CREATE TABLE IF NOT EXISTS timbrature (
                id TEXT PRIMARY KEY,
                personale_id TEXT NOT NULL,
                tipo TEXT NOT NULL,
                data_ora TEXT NOT NULL,
                latitudine TEXT,
                longitudine TEXT,
                indirizzo TEXT,
                dispositivo TEXT,
                note TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella timbrature creata");

        // Turni
        db.exec(`
            CREATE TABLE IF NOT EXISTS turni (
                id TEXT PRIMARY KEY,
                personale_id TEXT NOT NULL,
                data TEXT NOT NULL,
                ora_inizio TEXT NOT NULL,
                ora_fine TEXT NOT NULL,
                pausa INTEGER DEFAULT 0,
                tipologia TEXT DEFAULT 'ordinario',
                note TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella turni creata");

        // Turni predefiniti
        db.exec(`
            CREATE TABLE IF NOT EXISTS turni_predefiniti (
                id TEXT PRIMARY KEY,
                nome TEXT NOT NULL,
                ora_inizio TEXT NOT NULL,
                ora_fine TEXT NOT NULL,
                pausa INTEGER DEFAULT 60,
                colore TEXT DEFAULT '#3b82f6',
                attivo INTEGER DEFAULT 1,
                ordine INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella turni_predefiniti creata");

        // Straordinari
        db.exec(`
            CREATE TABLE IF NOT EXISTS straordinari (
                id TEXT PRIMARY KEY,
                personale_id TEXT NOT NULL,
                data TEXT NOT NULL,
                ore TEXT NOT NULL,
                motivo TEXT,
                stato TEXT NOT NULL DEFAULT 'richiesto',
                approvato_da TEXT,
                data_approvazione TEXT,
                note_approvazione TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella straordinari creata");

        // Saldi ferie/permessi
        db.exec(`
            CREATE TABLE IF NOT EXISTS saldi_ferie_permessi (
                id TEXT PRIMARY KEY,
                personale_id TEXT NOT NULL,
                anno INTEGER NOT NULL,
                ferie_totali TEXT NOT NULL DEFAULT '26',
                ferie_godute TEXT NOT NULL DEFAULT '0',
                ferie_residue_anno_prec TEXT DEFAULT '0',
                permessi_totali TEXT NOT NULL DEFAULT '32',
                permessi_goduti TEXT NOT NULL DEFAULT '0',
                malattia_giorni TEXT DEFAULT '0',
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella saldi_ferie_permessi creata");

        // Scadenze HR
        db.exec(`
            CREATE TABLE IF NOT EXISTS scadenze_hr (
                id TEXT PRIMARY KEY,
                personale_id TEXT NOT NULL,
                tipo TEXT NOT NULL DEFAULT 'altro',
                titolo TEXT NOT NULL,
                descrizione TEXT,
                data_scadenza TEXT NOT NULL,
                data_avviso TEXT,
                giorni_anticipo INTEGER DEFAULT 30,
                priorita TEXT DEFAULT 'normale',
                completata INTEGER DEFAULT 0,
                data_completamento TEXT,
                allegato TEXT,
                note TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella scadenze_hr creata");

        // Referenti clienti
        db.exec(`
            CREATE TABLE IF NOT EXISTS referenti_clienti (
                id TEXT PRIMARY KEY,
                cliente_id TEXT NOT NULL,
                nome TEXT NOT NULL,
                cognome TEXT,
                ruolo TEXT,
                dipartimento TEXT,
                email TEXT,
                telefono_fisso TEXT,
                cellulare TEXT,
                linkedin TEXT,
                principale INTEGER DEFAULT 0,
                riceve_newsletter INTEGER DEFAULT 0,
                riceve_offerte INTEGER DEFAULT 1,
                note TEXT,
                attivo INTEGER DEFAULT 1,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella referenti_clienti creata");

        // Indirizzi spedizione clienti
        db.exec(`
            CREATE TABLE IF NOT EXISTS indirizzi_spedizione_clienti (
                id TEXT PRIMARY KEY,
                cliente_id TEXT NOT NULL,
                nome TEXT NOT NULL,
                ragione_sociale TEXT,
                indirizzo TEXT NOT NULL,
                cap TEXT,
                citta TEXT,
                provincia TEXT,
                nazione TEXT DEFAULT 'Italia',
                telefono TEXT,
                email TEXT,
                referente TEXT,
                orari_lunedi TEXT,
                orari_martedi TEXT,
                orari_mercoledi TEXT,
                orari_giovedi TEXT,
                orari_venerdi TEXT,
                orari_sabato TEXT,
                orari_domenica TEXT,
                orari_consegna TEXT,
                note_consegna TEXT,
                google_place_id TEXT,
                principale INTEGER DEFAULT 0,
                attivo INTEGER DEFAULT 1,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella indirizzi_spedizione_clienti creata");

        // Aggiungo colonna cellulare ad anagrafica_personale se manca
        try {
            db.exec(`ALTER TABLE anagrafica_personale ADD COLUMN cellulare TEXT`);
            console.log("  ✅ Colonna cellulare aggiunta a anagrafica_personale");
        } catch (e) {
            // Colonna già esistente
        }

        // Aggiungo colonna cellulare ad anagrafica_clienti se manca
        try {
            db.exec(`ALTER TABLE anagrafica_clienti ADD COLUMN cellulare TEXT`);
            console.log("  ✅ Colonna cellulare aggiunta a anagrafica_clienti");
        } catch (e) {
            // Colonna già esistente
        }

        // Aggiungo colonna cellulare ad anagrafica_fornitori se manca
        try {
            db.exec(`ALTER TABLE anagrafica_fornitori ADD COLUMN cellulare TEXT`);
            console.log("  ✅ Colonna cellulare aggiunta a anagrafica_fornitori");
        } catch (e) {
            // Colonna già esistente
        }

        // CRM Attività
        db.exec(`
            CREATE TABLE IF NOT EXISTS crm_attivita (
                id TEXT PRIMARY KEY,
                lead_id TEXT,
                cliente_id TEXT,
                tipo TEXT NOT NULL DEFAULT 'nota',
                titolo TEXT NOT NULL,
                descrizione TEXT,
                data_pianificata TEXT,
                data_completamento TEXT,
                completata INTEGER DEFAULT 0,
                assegnato_a TEXT,
                priorita TEXT DEFAULT 'normale',
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella crm_attivita creata");

        // CRM Opportunità
        db.exec(`
            CREATE TABLE IF NOT EXISTS crm_opportunita (
                id TEXT PRIMARY KEY,
                lead_id TEXT,
                cliente_id TEXT,
                titolo TEXT NOT NULL,
                valore TEXT,
                fase TEXT DEFAULT 'qualifica',
                probabilita INTEGER DEFAULT 50,
                data_chiusura_prevista TEXT,
                assegnato_a TEXT,
                note TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella crm_opportunita creata");

        // Produzione - Ordini
        db.exec(`
            CREATE TABLE IF NOT EXISTS produzione_ordini (
                id TEXT PRIMARY KEY,
                numero_ordine TEXT NOT NULL UNIQUE,
                cliente_id TEXT,
                data_ordine TEXT NOT NULL,
                data_consegna_richiesta TEXT,
                data_consegna_prevista TEXT,
                stato TEXT DEFAULT 'nuovo',
                priorita TEXT DEFAULT 'normale',
                note TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella produzione_ordini creata");

        // Produzione - Righe ordine
        db.exec(`
            CREATE TABLE IF NOT EXISTS produzione_righe_ordine (
                id TEXT PRIMARY KEY,
                ordine_id TEXT NOT NULL,
                codice_articolo TEXT NOT NULL,
                descrizione TEXT,
                quantita TEXT NOT NULL,
                quantita_prodotta TEXT DEFAULT '0',
                unita_misura TEXT DEFAULT 'pz',
                stato TEXT DEFAULT 'da_produrre',
                note TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella produzione_righe_ordine creata");

        // Produzione - Commesse
        db.exec(`
            CREATE TABLE IF NOT EXISTS produzione_commesse (
                id TEXT PRIMARY KEY,
                numero_commessa TEXT NOT NULL UNIQUE,
                ordine_id TEXT,
                descrizione TEXT,
                data_inizio TEXT,
                data_fine_prevista TEXT,
                data_fine_effettiva TEXT,
                stato TEXT DEFAULT 'pianificata',
                priorita TEXT DEFAULT 'normale',
                responsabile TEXT,
                note TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella produzione_commesse creata");

        // Finanza - Movimenti
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
            )
        `);
        console.log("  ✅ Tabella finanza_movimenti creata");

        // Finanza - Categorie
        db.exec(`
            CREATE TABLE IF NOT EXISTS finanza_categorie (
                id TEXT PRIMARY KEY,
                nome TEXT NOT NULL,
                tipo TEXT NOT NULL,
                colore TEXT DEFAULT '#3b82f6',
                icona TEXT,
                parent_id TEXT,
                user_id TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella finanza_categorie creata");

        // Finanza - Obiettivi risparmio
        db.exec(`
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
            )
        `);
        console.log("  ✅ Tabella finanza_obiettivi creata");

        db.close();

        console.log("\n========================================");
        console.log("🎉 Tabelle mancanti aggiunte con successo!");
        console.log("========================================\n");

    } catch (error) {
        console.error("❌ Errore:", error);
        process.exit(1);
    }
}

addMissingTables();
