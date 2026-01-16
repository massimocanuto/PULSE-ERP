/**
 * Script per creare tutte le tabelle necessarie nel database SQLite
 * Eseguire con: npx tsx script/create-all-tables.ts
 */

import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "..", "data", "pulse.db");

function createAllTables() {
    console.log("🔧 Creazione tabelle per PULSE ERP...\n");
    console.log("📁 Database path:", dbPath, "\n");

    try {
        const db = new Database(dbPath);
        db.pragma("foreign_keys = ON");

        // Projects table
        db.exec(`
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'Not Started',
                priority TEXT NOT NULL DEFAULT 'Medium',
                start_date TEXT,
                due_date TEXT,
                team_members TEXT DEFAULT '[]',
                owner TEXT,
                notes TEXT,
                budget TEXT,
                files TEXT DEFAULT '[]',
                created_at TEXT DEFAULT (datetime('now')),
                share_token TEXT,
                share_expires_at TEXT,
                is_public INTEGER DEFAULT 0
            )
        `);
        console.log("  ✅ Tabella projects creata");

        // Tasks table
        db.exec(`
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                done INTEGER NOT NULL DEFAULT 0,
                start_date TEXT,
                due_date TEXT,
                tag TEXT,
                assigned_to TEXT,
                priority TEXT DEFAULT 'medium',
                estimated_hours INTEGER,
                actual_hours INTEGER,
                project_id TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella tasks creata");

        // Archived documents
        db.exec(`
            CREATE TABLE IF NOT EXISTS archived_documents (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                folder_id TEXT,
                file_path TEXT NOT NULL,
                file_name TEXT NOT NULL,
                file_type TEXT NOT NULL,
                file_size INTEGER,
                tags TEXT DEFAULT '[]',
                starred INTEGER NOT NULL DEFAULT 0,
                notes TEXT,
                ai_summary TEXT,
                archived_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT,
                deleted_at TEXT,
                uploaded_by TEXT,
                updated_by TEXT,
                share_token TEXT,
                share_expires_at TEXT,
                download_count INTEGER DEFAULT 0,
                last_download_at TEXT,
                last_download_ip TEXT,
                share_created_at TEXT
            )
        `);
        console.log("  ✅ Tabella archived_documents creata");

        // Archive folders
        db.exec(`
            CREATE TABLE IF NOT EXISTS archive_folders (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                color TEXT DEFAULT 'gray',
                icon TEXT DEFAULT 'folder',
                parent_id TEXT,
                project_id TEXT,
                created_by TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT
            )
        `);
        console.log("  ✅ Tabella archive_folders creata");

        // Documents table
        db.exec(`
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT DEFAULT '',
                icon TEXT DEFAULT '📄',
                cover_image TEXT,
                attachments TEXT,
                parent_id TEXT,
                owner_id TEXT,
                last_editor_id TEXT,
                last_edited_at TEXT,
                is_public INTEGER NOT NULL DEFAULT 0,
                is_archived INTEGER NOT NULL DEFAULT 0,
                needs_review INTEGER NOT NULL DEFAULT 0,
                tags TEXT DEFAULT '[]',
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella documents creata");

        // Personal todos
        db.exec(`
            CREATE TABLE IF NOT EXISTS personal_todos (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                completed INTEGER NOT NULL DEFAULT 0,
                priority TEXT NOT NULL DEFAULT 'medium',
                due_date TEXT,
                category TEXT,
                starred INTEGER NOT NULL DEFAULT 0,
                user_id TEXT,
                project_id TEXT,
                recurrence_type TEXT,
                recurrence_end_date TEXT,
                reminder_before INTEGER,
                reminder_sent INTEGER DEFAULT 0,
                depends_on TEXT DEFAULT '[]',
                pomodoro_sessions INTEGER DEFAULT 0,
                pomodoro_minutes INTEGER DEFAULT 0,
                google_calendar_event_id TEXT,
                google_calendar_id TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella personal_todos creata");

        // Keep notes
        db.exec(`
            CREATE TABLE IF NOT EXISTS keep_notes (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                title TEXT,
                content TEXT,
                color TEXT DEFAULT 'default',
                pinned INTEGER NOT NULL DEFAULT 0,
                archived INTEGER NOT NULL DEFAULT 0,
                deleted INTEGER NOT NULL DEFAULT 0,
                deleted_at TEXT,
                labels TEXT DEFAULT '[]',
                checklist_items TEXT,
                reminder TEXT,
                image_url TEXT,
                order_index INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella keep_notes creata");

        // Chat channels
        db.exec(`
            CREATE TABLE IF NOT EXISTS chat_channels (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL DEFAULT 'channel',
                description TEXT,
                color TEXT DEFAULT 'blue',
                members TEXT,
                created_by TEXT,
                unread_count INTEGER NOT NULL DEFAULT 0,
                last_message_at TEXT DEFAULT (datetime('now')),
                created_at TEXT DEFAULT (datetime('now')),
                is_archived INTEGER NOT NULL DEFAULT 0,
                archived_at TEXT,
                archived_by TEXT,
                project_id TEXT,
                task_id TEXT
            )
        `);
        console.log("  ✅ Tabella chat_channels creata");

        // Chat messages
        db.exec(`
            CREATE TABLE IF NOT EXISTS chat_messages (
                id TEXT PRIMARY KEY,
                channel_id TEXT NOT NULL,
                sender_id TEXT NOT NULL,
                sender_name TEXT NOT NULL,
                sender_avatar TEXT,
                content TEXT NOT NULL,
                attachments TEXT,
                is_read INTEGER NOT NULL DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella chat_messages creata");

        // Emails
        db.exec(`
            CREATE TABLE IF NOT EXISTS emails (
                id TEXT PRIMARY KEY,
                from_address TEXT NOT NULL,
                from_name TEXT NOT NULL,
                to_address TEXT NOT NULL,
                subject TEXT NOT NULL,
                preview TEXT NOT NULL,
                body TEXT NOT NULL,
                unread INTEGER NOT NULL DEFAULT 1,
                starred INTEGER NOT NULL DEFAULT 0,
                received_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella emails creata");

        // Notifications
        db.exec(`
            CREATE TABLE IF NOT EXISTS notifications (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                resource_type TEXT,
                resource_id TEXT,
                from_user_id TEXT,
                read INTEGER NOT NULL DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella notifications creata");

        // Activity feed
        db.exec(`
            CREATE TABLE IF NOT EXISTS activity_feed (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                action TEXT NOT NULL,
                entity_type TEXT NOT NULL,
                entity_id TEXT,
                entity_title TEXT,
                details TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella activity_feed creata");

        // Role permissions
        db.exec(`
            CREATE TABLE IF NOT EXISTS role_permissions (
                id TEXT PRIMARY KEY,
                role TEXT NOT NULL,
                module TEXT NOT NULL,
                can_view INTEGER NOT NULL DEFAULT 0,
                can_create INTEGER NOT NULL DEFAULT 0,
                can_edit INTEGER NOT NULL DEFAULT 0,
                can_delete INTEGER NOT NULL DEFAULT 0
            )
        `);
        console.log("  ✅ Tabella role_permissions creata");

        // User permissions
        db.exec(`
            CREATE TABLE IF NOT EXISTS user_permissions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                module TEXT NOT NULL,
                can_view INTEGER NOT NULL DEFAULT 0,
                can_create INTEGER NOT NULL DEFAULT 0,
                can_edit INTEGER NOT NULL DEFAULT 0,
                can_delete INTEGER NOT NULL DEFAULT 0
            )
        `);
        console.log("  ✅ Tabella user_permissions creata");

        // Subtasks
        db.exec(`
            CREATE TABLE IF NOT EXISTS subtasks (
                id TEXT PRIMARY KEY,
                todo_id TEXT NOT NULL,
                title TEXT NOT NULL,
                completed INTEGER NOT NULL DEFAULT 0,
                "order" INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella subtasks creata");

        // Whiteboards
        db.exec(`
            CREATE TABLE IF NOT EXISTS whiteboards (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                owner_id TEXT,
                project_id TEXT,
                is_public INTEGER NOT NULL DEFAULT 0,
                background_color TEXT DEFAULT '#ffffff',
                grid_enabled INTEGER DEFAULT 1,
                collaborators TEXT DEFAULT '[]',
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella whiteboards creata");

        // Time entries
        db.exec(`
            CREATE TABLE IF NOT EXISTS time_entries (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                todo_id TEXT,
                project_id TEXT,
                task_id TEXT,
                description TEXT,
                start_time TEXT NOT NULL,
                end_time TEXT,
                duration_minutes INTEGER,
                billable INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella time_entries creata");

        // Project shares
        db.exec(`
            CREATE TABLE IF NOT EXISTS project_shares (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                shared_by_id TEXT,
                permission TEXT NOT NULL DEFAULT 'view',
                shared_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella project_shares creata");

        // Document shares
        db.exec(`
            CREATE TABLE IF NOT EXISTS document_shares (
                id TEXT PRIMARY KEY,
                document_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                shared_by_id TEXT,
                permission TEXT NOT NULL DEFAULT 'view',
                shared_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella document_shares creata");

        // Task comments
        db.exec(`
            CREATE TABLE IF NOT EXISTS task_comments (
                id TEXT PRIMARY KEY,
                task_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                content TEXT NOT NULL,
                mentions TEXT DEFAULT '[]',
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella task_comments creata");

        // Project comments
        db.exec(`
            CREATE TABLE IF NOT EXISTS project_comments (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                content TEXT NOT NULL,
                mentions TEXT DEFAULT '[]',
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella project_comments creata");

        // Project documents
        db.exec(`
            CREATE TABLE IF NOT EXISTS project_documents (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                document_id TEXT NOT NULL,
                added_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella project_documents creata");

        // Project emails
        db.exec(`
            CREATE TABLE IF NOT EXISTS project_emails (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                email_id TEXT NOT NULL,
                email_subject TEXT NOT NULL,
                email_from TEXT NOT NULL,
                email_preview TEXT,
                email_date TEXT,
                added_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella project_emails creata");

        // Document comments
        db.exec(`
            CREATE TABLE IF NOT EXISTS document_comments (
                id TEXT PRIMARY KEY,
                document_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                content TEXT NOT NULL,
                resolved INTEGER NOT NULL DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella document_comments creata");

        // Chat saved conversations
        db.exec(`
            CREATE TABLE IF NOT EXISTS chat_saved_conversations (
                id TEXT PRIMARY KEY,
                channel_id TEXT NOT NULL,
                channel_name TEXT NOT NULL,
                title TEXT NOT NULL,
                notes TEXT,
                saved_by TEXT NOT NULL,
                saved_by_name TEXT NOT NULL,
                transcript TEXT NOT NULL,
                message_count INTEGER NOT NULL DEFAULT 0,
                date_from TEXT,
                date_to TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella chat_saved_conversations creata");

        // Chat folders
        db.exec(`
            CREATE TABLE IF NOT EXISTS chat_folders (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                color TEXT DEFAULT 'blue',
                icon TEXT DEFAULT 'folder',
                created_by TEXT NOT NULL,
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella chat_folders creata");

        // Chat folder items
        db.exec(`
            CREATE TABLE IF NOT EXISTS chat_folder_items (
                id TEXT PRIMARY KEY,
                folder_id TEXT NOT NULL,
                saved_conversation_id TEXT NOT NULL,
                added_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella chat_folder_items creata");

        // Todo templates
        db.exec(`
            CREATE TABLE IF NOT EXISTS todo_templates (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                priority TEXT NOT NULL DEFAULT 'medium',
                category TEXT,
                estimated_minutes INTEGER,
                recurrence_type TEXT,
                reminder_before INTEGER,
                user_id TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella todo_templates creata");

        // Keep labels
        db.exec(`
            CREATE TABLE IF NOT EXISTS keep_labels (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                color TEXT DEFAULT 'gray',
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella keep_labels creata");

        // Keep note templates
        db.exec(`
            CREATE TABLE IF NOT EXISTS keep_note_templates (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                title TEXT,
                content TEXT,
                color TEXT DEFAULT 'default',
                is_checklist INTEGER NOT NULL DEFAULT 0,
                checklist_items TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella keep_note_templates creata");

        // Whiteboard elements
        db.exec(`
            CREATE TABLE IF NOT EXISTS whiteboard_elements (
                id TEXT PRIMARY KEY,
                whiteboard_id TEXT NOT NULL,
                type TEXT NOT NULL,
                x INTEGER NOT NULL DEFAULT 0,
                y INTEGER NOT NULL DEFAULT 0,
                width INTEGER DEFAULT 200,
                height INTEGER DEFAULT 200,
                rotation INTEGER DEFAULT 0,
                content TEXT,
                color TEXT DEFAULT '#fef08a',
                font_size INTEGER DEFAULT 14,
                font_weight TEXT DEFAULT 'normal',
                border_color TEXT,
                border_width INTEGER DEFAULT 0,
                shape_type TEXT,
                points TEXT,
                z_index INTEGER DEFAULT 0,
                locked INTEGER DEFAULT 0,
                created_by TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella whiteboard_elements creata");

        // Shared links
        db.exec(`
            CREATE TABLE IF NOT EXISTS shared_links (
                id TEXT PRIMARY KEY,
                resource_type TEXT NOT NULL,
                resource_id TEXT NOT NULL,
                token TEXT NOT NULL UNIQUE,
                permission TEXT NOT NULL DEFAULT 'view',
                password TEXT,
                expires_at TEXT,
                created_by TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella shared_links creata");

        // Team availability
        db.exec(`
            CREATE TABLE IF NOT EXISTS team_availability (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                availability_type TEXT NOT NULL DEFAULT 'available',
                title TEXT,
                description TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella team_availability creata");

        // User email configs
        db.exec(`
            CREATE TABLE IF NOT EXISTS user_email_configs (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL UNIQUE,
                email_address TEXT NOT NULL,
                imap_host TEXT NOT NULL,
                imap_port INTEGER NOT NULL DEFAULT 993,
                imap_secure INTEGER NOT NULL DEFAULT 1,
                smtp_host TEXT NOT NULL,
                smtp_port INTEGER NOT NULL DEFAULT 465,
                smtp_secure INTEGER NOT NULL DEFAULT 1,
                password TEXT NOT NULL,
                display_name TEXT,
                signature TEXT,
                is_active INTEGER NOT NULL DEFAULT 1,
                last_sync_at TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella user_email_configs creata");

        // WhatsApp contacts
        db.exec(`
            CREATE TABLE IF NOT EXISTS whatsapp_contacts (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                phone_number TEXT NOT NULL UNIQUE,
                avatar TEXT,
                status TEXT,
                is_group INTEGER NOT NULL DEFAULT 0,
                unread_count INTEGER NOT NULL DEFAULT 0,
                last_message_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella whatsapp_contacts creata");

        // WhatsApp messages
        db.exec(`
            CREATE TABLE IF NOT EXISTS whatsapp_messages (
                id TEXT PRIMARY KEY,
                contact_id TEXT NOT NULL,
                content TEXT NOT NULL,
                type TEXT NOT NULL DEFAULT 'sent',
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella whatsapp_messages creata");

        // User whatsapp configs
        db.exec(`
            CREATE TABLE IF NOT EXISTS user_whatsapp_configs (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL UNIQUE,
                session_data TEXT,
                phone_number TEXT,
                is_connected INTEGER NOT NULL DEFAULT 0,
                last_connected_at TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella user_whatsapp_configs creata");

        // Telegram chats
        db.exec(`
            CREATE TABLE IF NOT EXISTS telegram_chats (
                id TEXT PRIMARY KEY,
                chat_id TEXT NOT NULL UNIQUE,
                username TEXT,
                first_name TEXT,
                last_name TEXT,
                type TEXT NOT NULL DEFAULT 'private',
                unread_count INTEGER NOT NULL DEFAULT 0,
                last_message_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella telegram_chats creata");

        // Telegram messages
        db.exec(`
            CREATE TABLE IF NOT EXISTS telegram_messages (
                id TEXT PRIMARY KEY,
                chat_id TEXT NOT NULL,
                telegram_message_id TEXT,
                content TEXT NOT NULL,
                direction TEXT NOT NULL DEFAULT 'incoming',
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella telegram_messages creata");

        // Anagrafica personale
        db.exec(`
            CREATE TABLE IF NOT EXISTS anagrafica_personale (
                id TEXT PRIMARY KEY,
                nome TEXT NOT NULL,
                cognome TEXT NOT NULL,
                codice_fiscale TEXT,
                data_nascita TEXT,
                luogo_nascita TEXT,
                indirizzo TEXT,
                citta TEXT,
                cap TEXT,
                provincia TEXT,
                telefono TEXT,
                email TEXT,
                ruolo TEXT,
                reparto TEXT,
                data_assunzione TEXT,
                stato TEXT DEFAULT 'attivo',
                note TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella anagrafica_personale creata");

        // Anagrafica clienti
        db.exec(`
            CREATE TABLE IF NOT EXISTS anagrafica_clienti (
                id TEXT PRIMARY KEY,
                ragione_sociale TEXT NOT NULL,
                partita_iva TEXT,
                codice_fiscale TEXT,
                indirizzo TEXT,
                citta TEXT,
                cap TEXT,
                provincia TEXT,
                nazione TEXT DEFAULT 'Italia',
                telefono TEXT,
                email TEXT,
                pec TEXT,
                codice_sdi TEXT,
                referente TEXT,
                telefono_referente TEXT,
                email_referente TEXT,
                tipo TEXT DEFAULT 'cliente',
                stato TEXT DEFAULT 'attivo',
                note TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella anagrafica_clienti creata");

        // Anagrafica fornitori
        db.exec(`
            CREATE TABLE IF NOT EXISTS anagrafica_fornitori (
                id TEXT PRIMARY KEY,
                ragione_sociale TEXT NOT NULL,
                partita_iva TEXT,
                codice_fiscale TEXT,
                indirizzo TEXT,
                citta TEXT,
                cap TEXT,
                provincia TEXT,
                nazione TEXT DEFAULT 'Italia',
                telefono TEXT,
                email TEXT,
                pec TEXT,
                codice_sdi TEXT,
                referente TEXT,
                telefono_referente TEXT,
                email_referente TEXT,
                iban TEXT,
                banca TEXT,
                categoria TEXT,
                stato TEXT DEFAULT 'attivo',
                note TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("  ✅ Tabella anagrafica_fornitori creata");

        db.close();

        console.log("\n========================================");
        console.log("🎉 Tutte le tabelle create con successo!");
        console.log("========================================\n");

    } catch (error) {
        console.error("❌ Errore:", error);
        process.exit(1);
    }
}

createAllTables();
