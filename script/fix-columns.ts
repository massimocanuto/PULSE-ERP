/**
 * Script per aggiungere le colonne mancanti
 */

import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "..", "data", "pulse.db");

function fixColumns() {
    console.log("🔧 Correzione colonne database...\n");

    const db = new Database(dbPath);

    // Colonne per anagrafica_clienti
    const clientiCols = [
        'sdi', 'website', 'categoria_cliente', 'settore_merceologico',
        'fatturato_totale', 'fatturato_anno_corrente', 'numero_ordini',
        'ultimo_ordine', 'data_ultimo_contatto', 'giorni_inattivita',
        'limite_credito', 'esposizione_credito', 'affidabilita',
        'origine_cliente', 'agente', 'note_private', 'documenti_count',
        'latitudine', 'longitudine', 'portale_abilitato', 'portale_username',
        'portale_password', 'condizioni_pagamento', 'sconto', 'stesso_indirizzo_spedizione',
        'categoria', 'referente'
    ];

    clientiCols.forEach(col => {
        try {
            db.exec(`ALTER TABLE anagrafica_clienti ADD COLUMN ${col} TEXT`);
            console.log(`  ✅ Aggiunta colonna ${col} a anagrafica_clienti`);
        } catch (e) {
            // Colonna già esistente
        }
    });

    // Colonne per anagrafica_fornitori
    const fornitoriCols = ['sdi', 'website', 'referente', 'categoria', 'condizioni_pagamento'];
    fornitoriCols.forEach(col => {
        try {
            db.exec(`ALTER TABLE anagrafica_fornitori ADD COLUMN ${col} TEXT`);
            console.log(`  ✅ Aggiunta colonna ${col} a anagrafica_fornitori`);
        } catch (e) {
            // Colonna già esistente
        }
    });

    // Colonne per anagrafica_personale
    const personaleCols = [
        'cellulare', 'email_privata', 'email_cedolini', 'data_fine_periodo_prova',
        'email_benvenuto_inviata', 'tipo_contratto', 'stipendio', 'iban', 'banca',
        'abi', 'cab', 'sito_banca', 'livello_contrattuale', 'ccnl', 'ore_settimanali',
        'percentuale_part_time', 'ral_annua', 'superminimo', 'indennita_mensile',
        'buoni_pasto', 'familiari_a_carico', 'coniuge_a_carico', 'figlio_disabile',
        'aliquota_irpef', 'contributi_inps', 'tfr', 'fondi_pensione', 'tags', 'attivo',
        'portal_username', 'portal_password_hash', 'portal_enabled', 'portal_last_access',
        'portal_token', 'biometric_credential_id', 'biometric_public_key', 'biometric_counter',
        'biometric_enabled', 'responsabile_id'
    ];

    personaleCols.forEach(col => {
        try {
            db.exec(`ALTER TABLE anagrafica_personale ADD COLUMN ${col} TEXT`);
            console.log(`  ✅ Aggiunta colonna ${col} a anagrafica_personale`);
        } catch (e) {
            // Colonna già esistente
        }
    });

    // Colonne per crm_leads
    const leadsCols = [
        'nome', 'cognome', 'azienda', 'email', 'telefono', 'cellulare',
        'fonte', 'stato', 'priorita', 'valore_stimato', 'probabilita',
        'note', 'assegnato_a', 'ultima_attivita', 'prossima_attivita',
        'tags', 'custom_fields'
    ];

    // Verifica se crm_leads esiste
    const leadTableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='crm_leads'").get();
    if (!leadTableExists) {
        db.exec(`
            CREATE TABLE crm_leads (
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
        console.log("  ✅ Tabella crm_leads ricreata");
    } else {
        leadsCols.forEach(col => {
            try {
                db.exec(`ALTER TABLE crm_leads ADD COLUMN ${col} TEXT`);
                console.log(`  ✅ Aggiunta colonna ${col} a crm_leads`);
            } catch (e) {
                // Colonna già esistente
            }
        });
    }

    db.close();
    console.log("\n✅ Correzioni completate!");
}

fixColumns();
