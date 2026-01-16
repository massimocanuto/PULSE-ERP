CREATE TABLE `activity_feed` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`entity_title` text,
	`details` text,
	`created_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `anagrafica_clienti` (
	`id` text PRIMARY KEY NOT NULL,
	`ragione_sociale` text NOT NULL,
	`partita_iva` text,
	`codice_fiscale` text,
	`indirizzo` text,
	`citta` text,
	`cap` text,
	`provincia` text,
	`nazione` text DEFAULT 'Italia',
	`telefono` text,
	`cellulare` text,
	`email` text,
	`pec` text,
	`sdi` text,
	`website` text,
	`referente` text,
	`categoria` text,
	`condizioni_pagamento` text,
	`sconto` text,
	`note` text,
	`stato` text DEFAULT 'attivo' NOT NULL,
	`tags` text,
	`attivo` integer DEFAULT 1 NOT NULL,
	`stesso_indirizzo_spedizione` integer DEFAULT 1,
	`categoria_cliente` text DEFAULT 'standard',
	`settore_merceologico` text,
	`fatturato_totale` text DEFAULT '0',
	`fatturato_anno_corrente` text DEFAULT '0',
	`numero_ordini` integer DEFAULT 0,
	`ultimo_ordine` text,
	`data_ultimo_contatto` text,
	`giorni_inattivita` integer DEFAULT 0,
	`limite_credito` text,
	`esposizione_credito` text DEFAULT '0',
	`affidabilita` text DEFAULT 'buona',
	`origine_cliente` text,
	`agente` text,
	`note_private` text,
	`documenti_count` integer DEFAULT 0,
	`latitudine` text,
	`longitudine` text,
	`portale_abilitato` integer DEFAULT 0,
	`portale_username` text,
	`portale_password` text,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `anagrafica_fornitori` (
	`id` text PRIMARY KEY NOT NULL,
	`ragione_sociale` text NOT NULL,
	`partita_iva` text,
	`codice_fiscale` text,
	`indirizzo` text,
	`citta` text,
	`cap` text,
	`provincia` text,
	`nazione` text DEFAULT 'Italia',
	`telefono` text,
	`cellulare` text,
	`email` text,
	`pec` text,
	`sdi` text,
	`website` text,
	`referente` text,
	`categoria` text,
	`condizioni_pagamento` text,
	`iban` text,
	`note` text,
	`stato` text DEFAULT 'attivo' NOT NULL,
	`tags` text,
	`attivo` integer DEFAULT 1 NOT NULL,
	`portale_abilitato` integer DEFAULT 0,
	`portale_username` text,
	`portale_password` text,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `anagrafica_personale` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`cognome` text NOT NULL,
	`codice_fiscale` text,
	`data_nascita` text,
	`luogo_nascita` text,
	`indirizzo` text,
	`citta` text,
	`cap` text,
	`provincia` text,
	`telefono` text,
	`cellulare` text,
	`email` text,
	`email_privata` text,
	`email_cedolini` text,
	`ruolo` text,
	`reparto` text,
	`data_assunzione` text,
	`data_fine_periodo_prova` text,
	`email_benvenuto_inviata` integer DEFAULT 0,
	`tipo_contratto` text,
	`stipendio` text,
	`iban` text,
	`banca` text,
	`abi` text,
	`cab` text,
	`sito_banca` text,
	`livello_contrattuale` text,
	`ccnl` text,
	`ore_settimanali` text,
	`percentuale_part_time` text,
	`ral_annua` text,
	`superminimo` text,
	`indennita_mensile` text,
	`buoni_pasto` text,
	`familiari_a_carico` integer DEFAULT 0,
	`coniuge_a_carico` integer DEFAULT 0,
	`figlio_disabile` integer DEFAULT 0,
	`aliquota_irpef` text,
	`contributi_inps` text,
	`tfr` text,
	`fondi_pensione` text,
	`note` text,
	`stato` text DEFAULT 'attivo' NOT NULL,
	`tags` text,
	`attivo` integer DEFAULT 1 NOT NULL,
	`portal_username` text,
	`portal_password_hash` text,
	`portal_enabled` integer DEFAULT 0,
	`portal_last_access` text,
	`portal_token` text,
	`biometric_credential_id` text,
	`biometric_public_key` text,
	`biometric_counter` integer DEFAULT 0,
	`biometric_enabled` integer DEFAULT 0,
	`responsabile_id` text,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `app_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`value` text,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `app_settings_key_unique` ON `app_settings` (`key`);--> statement-breakpoint
CREATE TABLE `archive_folders` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT 'gray',
	`icon` text DEFAULT 'folder',
	`parent_id` text,
	`project_id` text,
	`created_by` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `archived_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`folder_id` text,
	`file_path` text NOT NULL,
	`file_name` text NOT NULL,
	`file_type` text NOT NULL,
	`file_size` integer,
	`tags` text DEFAULT '[]',
	`starred` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`ai_summary` text,
	`archived_at` text,
	`updated_at` text,
	`deleted_at` text,
	`uploaded_by` text,
	`updated_by` text,
	`share_token` text,
	`share_expires_at` text,
	`download_count` integer DEFAULT 0,
	`last_download_at` text,
	`last_download_ip` text,
	`share_created_at` text,
	FOREIGN KEY (`folder_id`) REFERENCES `archive_folders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `azienda_conti_bancari` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`iban` text NOT NULL,
	`banca` text,
	`swift` text,
	`abi` text,
	`cab` text,
	`intestatario` text,
	`filiale` text,
	`note` text,
	`principale` integer DEFAULT 0,
	`attivo` integer DEFAULT 1,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `backup_schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`frequency` text NOT NULL,
	`day_of_week` integer,
	`day_of_month` integer,
	`hour` integer DEFAULT 2 NOT NULL,
	`minute` integer DEFAULT 0 NOT NULL,
	`enabled` integer DEFAULT 1 NOT NULL,
	`retention_days` integer DEFAULT 30 NOT NULL,
	`last_run` text,
	`next_run` text,
	`created_by` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `backups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`type` text DEFAULT 'manual' NOT NULL,
	`size` text,
	`file_path` text,
	`tables` text,
	`created_by` text,
	`created_at` text,
	`completed_at` text,
	`error_message` text,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bill_of_materials` (
	`id` text PRIMARY KEY NOT NULL,
	`prodotto_finito` text NOT NULL,
	`nome` text NOT NULL,
	`versione` text DEFAULT '1.0',
	`descrizione` text,
	`tempo_lavorazione` integer,
	`costo` text,
	`attiva` integer DEFAULT 1 NOT NULL,
	`note` text,
	`created_by` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`prodotto_finito`) REFERENCES `warehouse_products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bom_components` (
	`id` text PRIMARY KEY NOT NULL,
	`bom_id` text NOT NULL,
	`componente_id` text NOT NULL,
	`quantita` text NOT NULL,
	`unita_misura` text,
	`note` text,
	`ordine` integer DEFAULT 0,
	FOREIGN KEY (`bom_id`) REFERENCES `bill_of_materials`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`componente_id`) REFERENCES `warehouse_products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `budgets` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`tipo` text DEFAULT 'mensile' NOT NULL,
	`categoria_id` text,
	`project_id` text,
	`importo_previsto` text NOT NULL,
	`importo_speso` text DEFAULT '0',
	`data_inizio` text NOT NULL,
	`data_fine` text NOT NULL,
	`alert_soglia` integer DEFAULT 80,
	`note` text,
	`attivo` integer DEFAULT 1 NOT NULL,
	`created_by` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`categoria_id`) REFERENCES `finance_categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `catalog_article_prices` (
	`id` text PRIMARY KEY NOT NULL,
	`articolo_id` text NOT NULL,
	`listino_id` text NOT NULL,
	`prezzo` text DEFAULT '0',
	`created_at` text,
	FOREIGN KEY (`articolo_id`) REFERENCES `catalog_articles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`listino_id`) REFERENCES `catalog_price_lists`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `catalog_articles` (
	`id` text PRIMARY KEY NOT NULL,
	`codice` text(50) NOT NULL,
	`barcode` text(50),
	`nome` text NOT NULL,
	`descrizione` text,
	`categoria_id` text,
	`prezzo_listino` text DEFAULT '0',
	`costo` text DEFAULT '0',
	`ricarico` text DEFAULT '0',
	`unita_misura` text DEFAULT 'pz',
	`immagine` text,
	`giacenza` integer DEFAULT 0,
	`stock_minimo` integer DEFAULT 0,
	`stock_massimo` integer DEFAULT 0,
	`ubicazione_scaffale` text,
	`ubicazione_corsia` text,
	`ubicazione_ripiano` text,
	`lotto` text,
	`data_scadenza` text,
	`visibile` integer DEFAULT 1,
	`attivo` integer DEFAULT 1,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`categoria_id`) REFERENCES `catalog_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `catalog_articles_codice_unique` ON `catalog_articles` (`codice`);--> statement-breakpoint
CREATE TABLE `catalog_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`descrizione` text,
	`icona` text DEFAULT 'Box',
	`ordine` integer DEFAULT 0,
	`attivo` integer DEFAULT 1,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `catalog_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`articolo_id` text NOT NULL,
	`tipo` text NOT NULL,
	`quantita` integer NOT NULL,
	`giacenza_precedente` integer,
	`giacenza_successiva` integer,
	`causale` text,
	`documento_rif` text,
	`note` text,
	`created_by` text,
	`created_at` text,
	FOREIGN KEY (`articolo_id`) REFERENCES `catalog_articles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `catalog_price_history` (
	`id` text PRIMARY KEY NOT NULL,
	`articolo_id` text NOT NULL,
	`prezzo_vecchio` text,
	`prezzo_nuovo` text,
	`tipo_prezzo` text DEFAULT 'listino',
	`data_modifica` text,
	`note` text,
	FOREIGN KEY (`articolo_id`) REFERENCES `catalog_articles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `catalog_price_lists` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`descrizione` text,
	`tipo` text DEFAULT 'standard',
	`attivo` integer DEFAULT 1,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `cedolini` (
	`id` text PRIMARY KEY NOT NULL,
	`personale_id` text NOT NULL,
	`mese` integer NOT NULL,
	`anno` integer NOT NULL,
	`filename` text NOT NULL,
	`filepath` text NOT NULL,
	`filesize` integer,
	`mimetype` text,
	`stipendio_lordo` text,
	`stipendio_netto` text,
	`contributi_inps` text,
	`irpef` text,
	`bonus` text,
	`straordinari` text,
	`note` text,
	`created_at` text,
	FOREIGN KEY (`personale_id`) REFERENCES `anagrafica_personale`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `chat_channels` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'channel' NOT NULL,
	`description` text,
	`color` text DEFAULT 'blue',
	`members` text DEFAULT '[]',
	`created_by` text,
	`unread_count` integer DEFAULT 0 NOT NULL,
	`last_message_at` text,
	`created_at` text,
	`is_archived` integer DEFAULT 0 NOT NULL,
	`archived_at` text,
	`archived_by` text,
	`project_id` text,
	`task_id` text,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`archived_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `chat_folder_items` (
	`id` text PRIMARY KEY NOT NULL,
	`folder_id` text NOT NULL,
	`saved_conversation_id` text NOT NULL,
	`added_at` text,
	FOREIGN KEY (`folder_id`) REFERENCES `chat_folders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`saved_conversation_id`) REFERENCES `chat_saved_conversations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `chat_folders` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT 'blue',
	`icon` text DEFAULT 'folder',
	`created_by` text NOT NULL,
	`created_at` text,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`channel_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`sender_name` text NOT NULL,
	`sender_avatar` text,
	`content` text NOT NULL,
	`attachments` text,
	`is_read` integer DEFAULT 0 NOT NULL,
	`created_at` text,
	FOREIGN KEY (`channel_id`) REFERENCES `chat_channels`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `chat_saved_conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`channel_id` text NOT NULL,
	`channel_name` text NOT NULL,
	`title` text NOT NULL,
	`notes` text,
	`saved_by` text NOT NULL,
	`saved_by_name` text NOT NULL,
	`transcript` text NOT NULL,
	`message_count` integer DEFAULT 0 NOT NULL,
	`date_from` text,
	`date_to` text,
	`created_at` text,
	FOREIGN KEY (`saved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `company_info` (
	`id` text PRIMARY KEY NOT NULL,
	`ragione_sociale` text NOT NULL,
	`partita_iva` text,
	`codice_fiscale` text,
	`codice_destinatario` text,
	`pec` text,
	`indirizzo_sede` text,
	`cap_sede` text,
	`citta_sede` text,
	`provincia_sede` text,
	`nazione_sede` text DEFAULT 'Italia',
	`indirizzo_operativo` text,
	`cap_operativo` text,
	`citta_operativo` text,
	`provincia_operativo` text,
	`nazione_operativo` text DEFAULT 'Italia',
	`latitudine` text,
	`longitudine` text,
	`telefono` text,
	`fax` text,
	`email` text,
	`website` text,
	`iban` text,
	`banca` text,
	`swift` text,
	`logo` text,
	`colore_aziendale` text,
	`note` text,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `condizioni_pagamento` (
	`id` text PRIMARY KEY NOT NULL,
	`codice` text NOT NULL,
	`descrizione` text NOT NULL,
	`giorni_scadenza` integer DEFAULT 0,
	`note` text,
	`attivo` integer DEFAULT 1,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `corrieri` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`codice` text,
	`telefono` text,
	`email` text,
	`website` text,
	`url_tracking` text,
	`costo_base` text DEFAULT '0',
	`note` text,
	`attivo` integer DEFAULT 1,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `courier_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`spedizione_id` text NOT NULL,
	`token` text(64) NOT NULL,
	`pin` text(6),
	`expires_at` text NOT NULL,
	`used_at` text,
	`created_at` text,
	FOREIGN KEY (`spedizione_id`) REFERENCES `spedizioni`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `courier_tokens_token_unique` ON `courier_tokens` (`token`);--> statement-breakpoint
CREATE TABLE `crm_attivita` (
	`id` text PRIMARY KEY NOT NULL,
	`tipo` text NOT NULL,
	`oggetto` text NOT NULL,
	`descrizione` text,
	`cliente_id` text,
	`lead_id` text,
	`opportunita_id` text,
	`data_ora` text NOT NULL,
	`durata` integer,
	`stato` text DEFAULT 'pianificata' NOT NULL,
	`esito` text,
	`priorita` text DEFAULT 'normale',
	`promemoria` text,
	`luogo` text,
	`partecipanti` text,
	`risultato` text,
	`assegnato_a` text,
	`created_by` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`cliente_id`) REFERENCES `anagrafica_clienti`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lead_id`) REFERENCES `crm_leads`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`opportunita_id`) REFERENCES `crm_opportunita`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assegnato_a`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `crm_interazioni` (
	`id` text PRIMARY KEY NOT NULL,
	`tipo` text NOT NULL,
	`oggetto` text,
	`contenuto` text,
	`cliente_id` text,
	`lead_id` text,
	`opportunita_id` text,
	`attivita_id` text,
	`email_id` text,
	`preventivo_id` text,
	`fattura_id` text,
	`direzione` text,
	`durata` integer,
	`esito` text,
	`created_by` text,
	`created_at` text,
	FOREIGN KEY (`cliente_id`) REFERENCES `anagrafica_clienti`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lead_id`) REFERENCES `crm_leads`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`opportunita_id`) REFERENCES `crm_opportunita`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`attivita_id`) REFERENCES `crm_attivita`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `crm_leads` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`cognome` text,
	`azienda` text,
	`email` text,
	`telefono` text,
	`cellulare` text,
	`indirizzo` text,
	`citta` text,
	`cap` text,
	`provincia` text,
	`nazione` text DEFAULT 'Italia',
	`fonte` text,
	`stato` text DEFAULT 'nuovo' NOT NULL,
	`valutazione` text DEFAULT 'freddo',
	`budget_stimato` text,
	`settore` text,
	`interesse` text,
	`note` text,
	`tags` text,
	`assegnato_a` text,
	`data_prossimo_contatto` text,
	`cliente_id` text,
	`created_by` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`assegnato_a`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cliente_id`) REFERENCES `anagrafica_clienti`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `crm_opportunita` (
	`id` text PRIMARY KEY NOT NULL,
	`titolo` text NOT NULL,
	`descrizione` text,
	`cliente_id` text,
	`lead_id` text,
	`fase` text DEFAULT 'prospetto' NOT NULL,
	`valore` text,
	`probabilita` integer DEFAULT 20,
	`data_chiusura_stimata` text,
	`data_chiusura_effettiva` text,
	`motivo_perdita` text,
	`concorrente` text,
	`prodotti_servizi` text,
	`preventivo_id` text,
	`project_id` text,
	`assegnato_a` text,
	`priorita` text DEFAULT 'normale',
	`note` text,
	`tags` text,
	`created_by` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`cliente_id`) REFERENCES `anagrafica_clienti`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lead_id`) REFERENCES `crm_leads`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assegnato_a`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `customer_portal_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`cliente_id` text NOT NULL,
	`token` text NOT NULL,
	`nome` text,
	`attivo` integer DEFAULT 1 NOT NULL,
	`scadenza` text,
	`ultimo_accesso` text,
	`accessi_totali` integer DEFAULT 0 NOT NULL,
	`ultimo_ip` text,
	`connessione_attiva` integer DEFAULT 0,
	`ultima_attivita` text,
	`created_by` text,
	`created_at` text,
	FOREIGN KEY (`cliente_id`) REFERENCES `anagrafica_clienti`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customer_portal_tokens_token_unique` ON `customer_portal_tokens` (`token`);--> statement-breakpoint
CREATE TABLE `ddt` (
	`id` text PRIMARY KEY NOT NULL,
	`numero` text NOT NULL,
	`stato` text DEFAULT 'bozza' NOT NULL,
	`data_emissione` text NOT NULL,
	`data_trasporto` text,
	`ora_trasporto` text,
	`cliente_id` text,
	`ragione_sociale` text NOT NULL,
	`partita_iva` text,
	`codice_fiscale` text,
	`indirizzo` text,
	`cap` text,
	`citta` text,
	`provincia` text,
	`email` text,
	`telefono` text,
	`destinazione_diversa` integer DEFAULT 0,
	`destinazione_ragione_sociale` text,
	`destinazione_indirizzo` text,
	`destinazione_cap` text,
	`destinazione_citta` text,
	`destinazione_provincia` text,
	`causale_trasporto` text DEFAULT 'Vendita',
	`tipo_trasporto` text DEFAULT 'Mittente',
	`vettore` text,
	`aspetto_beni` text DEFAULT 'Scatole',
	`porto` text DEFAULT 'Franco',
	`peso_lordo` text,
	`peso_netto` text,
	`colli` text,
	`note` text,
	`note_interne` text,
	`riferimento_ordine` text,
	`sales_order_id` text,
	`invoice_id` text,
	`quote_id` text,
	`project_id` text,
	`created_by` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`cliente_id`) REFERENCES `anagrafica_clienti`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ddt_counters` (
	`id` text PRIMARY KEY NOT NULL,
	`anno` integer NOT NULL,
	`ultimo_numero` integer DEFAULT 0 NOT NULL,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `ddt_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`ddt_id` text NOT NULL,
	`codice_articolo` text,
	`descrizione` text NOT NULL,
	`quantita` text DEFAULT '1',
	`unita_misura` text DEFAULT 'pz',
	`note` text,
	`ordine` integer DEFAULT 0,
	FOREIGN KEY (`ddt_id`) REFERENCES `ddt`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `document_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`user_id` text NOT NULL,
	`content` text NOT NULL,
	`resolved` integer DEFAULT 0 NOT NULL,
	`created_at` text,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `document_shares` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`user_id` text NOT NULL,
	`shared_by_id` text,
	`permission` text DEFAULT 'view' NOT NULL,
	`shared_at` text,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`shared_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content` text DEFAULT '',
	`icon` text DEFAULT '📄',
	`cover_image` text,
	`attachments` text,
	`parent_id` text,
	`owner_id` text,
	`last_editor_id` text,
	`last_edited_at` text,
	`is_public` integer DEFAULT 0 NOT NULL,
	`is_archived` integer DEFAULT 0 NOT NULL,
	`needs_review` integer DEFAULT 0 NOT NULL,
	`tags` text DEFAULT '[]',
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`last_editor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `email_attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`email_cache_id` text NOT NULL,
	`filename` text NOT NULL,
	`mime_type` text,
	`size` integer,
	`content_id` text,
	`is_inline` integer DEFAULT 0,
	`storage_path` text,
	`downloaded` integer DEFAULT 0,
	`downloaded_at` text,
	`created_at` text,
	FOREIGN KEY (`email_cache_id`) REFERENCES `email_cache`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `email_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`message_id` text,
	`uid` integer NOT NULL,
	`folder` text DEFAULT 'INBOX' NOT NULL,
	`from_address` text NOT NULL,
	`from_name` text,
	`to_address` text NOT NULL,
	`cc_address` text,
	`bcc_address` text,
	`subject` text NOT NULL,
	`preview` text,
	`body` text,
	`body_html` text,
	`unread` integer DEFAULT 1 NOT NULL,
	`starred` integer DEFAULT 0 NOT NULL,
	`flagged` integer DEFAULT 0 NOT NULL,
	`answered` integer DEFAULT 0 NOT NULL,
	`deleted` integer DEFAULT 0 NOT NULL,
	`draft` integer DEFAULT 0 NOT NULL,
	`has_attachments` integer DEFAULT 0 NOT NULL,
	`importance` text DEFAULT 'normal',
	`received_at` text,
	`sent_at` text,
	`cached_at` text,
	`updated_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `email_folders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`path` text NOT NULL,
	`type` text DEFAULT 'custom' NOT NULL,
	`icon` text,
	`color` text,
	`parent_id` text,
	`unread_count` integer DEFAULT 0,
	`total_count` integer DEFAULT 0,
	`is_default` integer DEFAULT 0,
	`sort_order` integer DEFAULT 0,
	`created_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `email_label_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`email_id` text NOT NULL,
	`label_id` text NOT NULL,
	`assigned_at` text,
	FOREIGN KEY (`label_id`) REFERENCES `email_labels`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `email_labels` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#3B82F6' NOT NULL,
	`user_id` text,
	`created_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `email_sync_state` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`folder` text NOT NULL,
	`last_uid` integer DEFAULT 0,
	`uid_validity` integer,
	`last_sync_at` text,
	`sync_status` text DEFAULT 'idle',
	`sync_error` text,
	`email_count` integer DEFAULT 0,
	`unread_count` integer DEFAULT 0,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `emails` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`uid` integer DEFAULT 0 NOT NULL,
	`message_id` text,
	`folder` text DEFAULT 'INBOX' NOT NULL,
	`account_id` text,
	`from_address` text,
	`from_name` text,
	`to_address` text,
	`subject` text,
	`preview` text,
	`body` text,
	`unread` integer DEFAULT false,
	`starred` integer DEFAULT false,
	`has_attachments` integer DEFAULT false,
	`received_at` text,
	`created_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `finance_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`tipo` text DEFAULT 'banca' NOT NULL,
	`iban` text,
	`bic` text,
	`istituto` text,
	`saldo_iniziale` text DEFAULT '0',
	`saldo_attuale` text DEFAULT '0',
	`valuta` text DEFAULT 'EUR',
	`colore` text DEFAULT '#3B82F6',
	`icona` text DEFAULT 'building-2',
	`attivo` integer DEFAULT 1 NOT NULL,
	`predefinito` integer DEFAULT 0 NOT NULL,
	`note` text,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `finance_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`tipo` text NOT NULL,
	`icona` text DEFAULT 'folder',
	`colore` text DEFAULT '#6B7280',
	`parent_id` text,
	`ordine` integer DEFAULT 0,
	`attivo` integer DEFAULT 1 NOT NULL,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `finance_integrations` (
	`id` text PRIMARY KEY NOT NULL,
	`tipo` text NOT NULL,
	`nome` text NOT NULL,
	`attivo` integer DEFAULT 0 NOT NULL,
	`configurato` integer DEFAULT 0 NOT NULL,
	`ambiente` text DEFAULT 'sandbox',
	`client_id` text,
	`client_secret` text,
	`access_token` text,
	`codice_destinatario` text,
	`partita_iva` text,
	`webhook_url` text,
	`ultima_sincronizzazione` text,
	`configurazione` text,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `finance_share_links` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`tipo` text NOT NULL,
	`resource_id` text NOT NULL,
	`created_by` text,
	`expires_at` text,
	`password` text,
	`view_count` integer DEFAULT 0 NOT NULL,
	`max_views` integer,
	`is_active` integer DEFAULT 1 NOT NULL,
	`note` text,
	`last_viewed_at` text,
	`last_viewed_ip` text,
	`created_at` text,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `finance_share_links_token_unique` ON `finance_share_links` (`token`);--> statement-breakpoint
CREATE TABLE `finance_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`tipo` text NOT NULL,
	`descrizione` text NOT NULL,
	`importo` text NOT NULL,
	`data` text NOT NULL,
	`conto_id` text,
	`conto_destinazione_id` text,
	`categoria_id` text,
	`invoice_id` text,
	`project_id` text,
	`cliente_id` text,
	`fornitore_id` text,
	`riconciliato` integer DEFAULT 0 NOT NULL,
	`note` text,
	`allegato` text,
	`deleted_at` text,
	`created_by` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`conto_id`) REFERENCES `finance_accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`conto_destinazione_id`) REFERENCES `finance_accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`categoria_id`) REFERENCES `finance_categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cliente_id`) REFERENCES `anagrafica_clienti`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`fornitore_id`) REFERENCES `anagrafica_fornitori`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `google_business_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text,
	`location_id` text,
	`nome_attivita` text NOT NULL,
	`indirizzo` text,
	`telefono` text,
	`sito_web` text,
	`categoria` text,
	`orari_apertura` text,
	`access_token` text,
	`refresh_token` text,
	`token_expires_at` text,
	`is_connected` integer DEFAULT 0,
	`last_sync` text,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `google_business_insights` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text,
	`data_rilevazione` text NOT NULL,
	`visualizzazioni_mappa` integer DEFAULT 0,
	`visualizzazioni_ricerca` integer DEFAULT 0,
	`chiamate` integer DEFAULT 0,
	`richieste_direzioni` integer DEFAULT 0,
	`click_sito_web` integer DEFAULT 0,
	`foto_visualizzate` integer DEFAULT 0,
	`recensioni_totali` integer DEFAULT 0,
	`rating_medio` text,
	`created_at` text,
	FOREIGN KEY (`account_id`) REFERENCES `google_business_accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `google_business_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text,
	`post_id` text,
	`tipo` text DEFAULT 'update',
	`titolo` text,
	`contenuto` text,
	`call_to_action` text,
	`link_cta` text,
	`media_url` text,
	`stato` text DEFAULT 'bozza',
	`data_pubblicazione` text,
	`data_scadenza` text,
	`views` integer DEFAULT 0,
	`clicks` integer DEFAULT 0,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`account_id`) REFERENCES `google_business_accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `google_business_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text,
	`review_id` text,
	`autore` text,
	`rating` integer,
	`testo` text,
	`data_recensione` text,
	`risposta` text,
	`data_risposta` text,
	`risposto_tramite_app` integer DEFAULT 0,
	`created_at` text,
	FOREIGN KEY (`account_id`) REFERENCES `google_business_accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `indirizzi_spedizione_clienti` (
	`id` text PRIMARY KEY NOT NULL,
	`cliente_id` text NOT NULL,
	`nome` text NOT NULL,
	`ragione_sociale` text,
	`indirizzo` text NOT NULL,
	`cap` text,
	`citta` text,
	`provincia` text,
	`nazione` text DEFAULT 'Italia',
	`telefono` text,
	`email` text,
	`referente` text,
	`orari_lunedi` text,
	`orari_martedi` text,
	`orari_mercoledi` text,
	`orari_giovedi` text,
	`orari_venerdi` text,
	`orari_sabato` text,
	`orari_domenica` text,
	`orari_consegna` text,
	`note_consegna` text,
	`google_place_id` text,
	`principale` integer DEFAULT 0,
	`attivo` integer DEFAULT 1,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`cliente_id`) REFERENCES `anagrafica_clienti`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `invoice_counters` (
	`id` text PRIMARY KEY NOT NULL,
	`anno` integer NOT NULL,
	`ultimo_numero` integer DEFAULT 0 NOT NULL,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `invoice_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`descrizione` text NOT NULL,
	`quantita` text DEFAULT '1',
	`unita_misura` text DEFAULT 'pz',
	`prezzo_unitario` text DEFAULT '0',
	`sconto` text DEFAULT '0',
	`aliquota_iva` text DEFAULT '22',
	`importo` text DEFAULT '0',
	`ordine` integer DEFAULT 0,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `invoice_reminders` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`tracking_token` text NOT NULL,
	`recipient_email` text NOT NULL,
	`recipient_name` text,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`sent_by` text,
	`sent_at` text,
	`delivery_status` text DEFAULT 'pending' NOT NULL,
	`delivery_error` text,
	`opened_at` text,
	`open_count` integer DEFAULT 0 NOT NULL,
	`last_open_ip` text,
	`last_open_user_agent` text,
	`created_at` text,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sent_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoice_reminders_tracking_token_unique` ON `invoice_reminders` (`tracking_token`);--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`numero` text NOT NULL,
	`tipo` text DEFAULT 'emessa' NOT NULL,
	`stato` text DEFAULT 'bozza' NOT NULL,
	`data_emissione` text NOT NULL,
	`data_scadenza` text,
	`data_pagamento` text,
	`cliente_id` text,
	`fornitore_id` text,
	`ragione_sociale` text NOT NULL,
	`partita_iva` text,
	`codice_fiscale` text,
	`indirizzo` text,
	`imponibile` text DEFAULT '0',
	`iva` text DEFAULT '0',
	`totale` text DEFAULT '0',
	`totale_pagato` text DEFAULT '0',
	`valuta` text DEFAULT 'EUR',
	`oggetto` text,
	`note` text,
	`note_interne` text,
	`metodo_pagamento` text,
	`conto_id` text,
	`sdi` text,
	`pec` text,
	`xml_path` text,
	`pdf_path` text,
	`created_by` text,
	`project_id` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`cliente_id`) REFERENCES `anagrafica_clienti`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`fornitore_id`) REFERENCES `anagrafica_fornitori`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`conto_id`) REFERENCES `finance_accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `keep_labels` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT 'gray',
	`created_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `keep_note_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`title` text,
	`content` text,
	`color` text DEFAULT 'default',
	`is_checklist` integer DEFAULT 0 NOT NULL,
	`checklist_items` text,
	`created_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `keep_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text,
	`content` text,
	`color` text DEFAULT 'default',
	`pinned` integer DEFAULT false NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`deleted` integer DEFAULT false NOT NULL,
	`deleted_at` text,
	`labels` text DEFAULT '[]',
	`checklist_items` text DEFAULT '[]',
	`reminder` text,
	`image_url` text,
	`order_index` integer DEFAULT 0,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `machinery` (
	`id` text PRIMARY KEY NOT NULL,
	`codice` text NOT NULL,
	`nome` text NOT NULL,
	`tipo` text,
	`categoria` text,
	`marca` text,
	`modello` text,
	`numero_serie` text,
	`anno_acquisto` text,
	`data_acquisto` text,
	`valore_acquisto` text,
	`valore_residuo` text,
	`anni_ammortamento` integer,
	`ubicazione` text,
	`reparto` text,
	`stato` text DEFAULT 'attivo',
	`potenza` text,
	`consumo_orario` text,
	`unita_consumo` text,
	`ore_lavoro` integer DEFAULT 0,
	`responsabile_id` text,
	`fornitore_id` text,
	`note` text,
	`immagine` text,
	`documenti` text DEFAULT '[]',
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`responsabile_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `machinery_consumptions` (
	`id` text PRIMARY KEY NOT NULL,
	`machinery_id` text NOT NULL,
	`data` text NOT NULL,
	`tipo_consumo` text NOT NULL,
	`quantita` text NOT NULL,
	`unita_misura` text,
	`costo_unitario` text,
	`costo_totale` text,
	`ore_lavoro` text,
	`ordine_produzione_id` text,
	`lettura_precedente` text,
	`lettura_attuale` text,
	`note` text,
	`registrato_da` text,
	`created_at` text,
	FOREIGN KEY (`machinery_id`) REFERENCES `machinery`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`registrato_da`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `machinery_costs` (
	`id` text PRIMARY KEY NOT NULL,
	`machinery_id` text NOT NULL,
	`data` text NOT NULL,
	`tipo_costo` text NOT NULL,
	`descrizione` text,
	`importo` text NOT NULL,
	`fornitore_id` text,
	`fattura_rif` text,
	`categoria` text,
	`note` text,
	`registrato_da` text,
	`created_at` text,
	FOREIGN KEY (`machinery_id`) REFERENCES `machinery`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`registrato_da`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `maintenance_alerts` (
	`id` text PRIMARY KEY NOT NULL,
	`machinery_id` text NOT NULL,
	`plan_id` text,
	`tipo` text NOT NULL,
	`messaggio` text NOT NULL,
	`priorita` text DEFAULT 'normale',
	`data_scadenza` text,
	`letto` integer DEFAULT 0,
	`archiviato` integer DEFAULT 0,
	`created_at` text,
	FOREIGN KEY (`machinery_id`) REFERENCES `machinery`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`plan_id`) REFERENCES `maintenance_plans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `maintenance_events` (
	`id` text PRIMARY KEY NOT NULL,
	`machinery_id` text NOT NULL,
	`plan_id` text,
	`tipo` text NOT NULL,
	`titolo` text NOT NULL,
	`descrizione` text,
	`data_pianificata` text,
	`data_esecuzione` text,
	`stato` text DEFAULT 'pianificato',
	`tecnico_id` text,
	`ore_fermo` text,
	`ore_lavoro` text,
	`costo_manodopera` text,
	`costo_ricambi` text,
	`costo_totale` text,
	`ricambi_usati` text,
	`checklist_completata` text,
	`note` text,
	`allegati` text DEFAULT '[]',
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`machinery_id`) REFERENCES `machinery`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`plan_id`) REFERENCES `maintenance_plans`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tecnico_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `maintenance_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`machinery_id` text NOT NULL,
	`nome` text NOT NULL,
	`tipo` text NOT NULL,
	`descrizione` text,
	`frequenza` text,
	`intervallo_giorni` integer,
	`intervallo_ore` integer,
	`prossima_scadenza` text,
	`ultima_esecuzione` text,
	`checklist` text,
	`responsabile_id` text,
	`costo_stimato` text,
	`durata_stimata` text,
	`priorita` text DEFAULT 'normale',
	`attivo` integer DEFAULT 1,
	`notifica_giorni_prima` integer DEFAULT 7,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`machinery_id`) REFERENCES `machinery`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`responsabile_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `marketing_campagne` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`descrizione` text,
	`obiettivo` text,
	`data_inizio` text,
	`data_fine` text,
	`budget` text,
	`spesa_effettiva` text,
	`stato` text DEFAULT 'bozza',
	`canali` text DEFAULT '[]',
	`target_audience` text,
	`kpi_target` text,
	`kpi_raggiunto` text,
	`note` text,
	`created_by` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `media_library` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`tipo` text DEFAULT 'immagine',
	`url` text,
	`dimensione` text,
	`formato` text,
	`categoria` text,
	`tags` text DEFAULT '[]',
	`usato_in` text DEFAULT '[]',
	`created_by` text,
	`created_at` text,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`resource_type` text,
	`resource_id` text,
	`from_user_id` text,
	`read` integer DEFAULT 0 NOT NULL,
	`created_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`from_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notifiche_hr` (
	`id` text PRIMARY KEY NOT NULL,
	`personale_id` text NOT NULL,
	`tipo` text NOT NULL,
	`titolo` text NOT NULL,
	`messaggio` text,
	`data_scadenza` text,
	`letta` integer DEFAULT 0,
	`email_inviata` integer DEFAULT 0,
	`data_email_inviata` text,
	`created_at` text,
	FOREIGN KEY (`personale_id`) REFERENCES `anagrafica_personale`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `office_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`file_name` text NOT NULL,
	`file_path` text NOT NULL,
	`owner_id` text,
	`last_editor_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`is_locked` integer DEFAULT false,
	`locked_by` text,
	`last_opened_at` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`last_editor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`locked_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payment_reminders` (
	`id` text PRIMARY KEY NOT NULL,
	`titolo` text NOT NULL,
	`tipo` text NOT NULL,
	`importo` text NOT NULL,
	`data_scadenza` text NOT NULL,
	`invoice_id` text,
	`cliente_id` text,
	`fornitore_id` text,
	`stato` text DEFAULT 'attivo' NOT NULL,
	`ricorrente` integer DEFAULT 0 NOT NULL,
	`frequenza_ricorrenza` text,
	`note` text,
	`created_by` text,
	`created_at` text,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cliente_id`) REFERENCES `anagrafica_clienti`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`fornitore_id`) REFERENCES `anagrafica_fornitori`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `personal_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`nome` text NOT NULL,
	`tipo` text NOT NULL,
	`istituto` text,
	`iban` text,
	`saldo_iniziale` text DEFAULT '0',
	`saldo_attuale` text DEFAULT '0',
	`valuta` text DEFAULT 'EUR',
	`colore` text,
	`icona` text,
	`attivo` integer DEFAULT 1,
	`predefinito` integer DEFAULT 0,
	`includi_in_totale` integer DEFAULT 1,
	`note` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `personal_budgets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`category_id` text,
	`nome` text NOT NULL,
	`importo_limite` text NOT NULL,
	`importo_speso` text DEFAULT '0',
	`periodo` text NOT NULL,
	`mese_anno` text,
	`anno` text,
	`colore` text,
	`notifica_soglia` integer DEFAULT 80,
	`attivo` integer DEFAULT 1,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `personal_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `personal_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`nome` text NOT NULL,
	`tipo` text NOT NULL,
	`icona` text,
	`colore` text,
	`predefinita` integer DEFAULT 0,
	`attiva` integer DEFAULT 1,
	`created_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `personal_goal_contributions` (
	`id` text PRIMARY KEY NOT NULL,
	`goal_id` text NOT NULL,
	`importo` text NOT NULL,
	`data` text NOT NULL,
	`note` text,
	`created_at` text,
	FOREIGN KEY (`goal_id`) REFERENCES `personal_goals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `personal_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`nome` text NOT NULL,
	`descrizione` text,
	`importo_obiettivo` text NOT NULL,
	`importo_attuale` text DEFAULT '0',
	`data_inizio` text,
	`data_scadenza` text,
	`priorita` text DEFAULT 'normale',
	`stato` text DEFAULT 'in_corso',
	`icona` text,
	`colore` text,
	`account_id` text,
	`note` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `personal_accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `personal_todos` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`completed` integer DEFAULT false NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`due_date` text,
	`category` text,
	`starred` integer DEFAULT false NOT NULL,
	`user_id` text,
	`project_id` text,
	`recurrence_type` text,
	`recurrence_end_date` text,
	`reminder_before` integer,
	`reminder_sent` integer DEFAULT false,
	`depends_on` text DEFAULT '[]',
	`pomodoro_sessions` integer DEFAULT 0,
	`pomodoro_minutes` integer DEFAULT 0,
	`google_calendar_event_id` text,
	`google_calendar_id` text,
	`created_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `personal_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`account_id` text NOT NULL,
	`category_id` text,
	`tipo` text NOT NULL,
	`importo` text NOT NULL,
	`data` text NOT NULL,
	`descrizione` text,
	`beneficiario` text,
	`account_destinazione_id` text,
	`ricorrente` integer DEFAULT 0,
	`frequenza_ricorrenza` text,
	`data_fine_ricorrenza` text,
	`tags` text DEFAULT '[]',
	`allegato` text,
	`note` text,
	`created_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `personal_accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `personal_categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`account_destinazione_id`) REFERENCES `personal_accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `production_order_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`ordine_id` text NOT NULL,
	`codice_articolo` text NOT NULL,
	`descrizione` text NOT NULL,
	`quantita` text NOT NULL,
	`unita_misura` text,
	`note` text,
	`ordine` integer DEFAULT 0,
	`created_at` text,
	FOREIGN KEY (`ordine_id`) REFERENCES `production_orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `production_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`numero` text NOT NULL,
	`prodotto_id` text NOT NULL,
	`articolo_catalogo_id` text,
	`bom_id` text,
	`quantita_richiesta` text NOT NULL,
	`quantita_prodotta` text DEFAULT '0',
	`stato` text DEFAULT 'pianificato' NOT NULL,
	`priorita` text DEFAULT 'normale' NOT NULL,
	`data_inizio` text,
	`data_fine_stimata` text,
	`data_fine_effettiva` text,
	`cliente_id` text,
	`project_id` text,
	`responsabile_id` text,
	`note` text,
	`note_interne` text,
	`created_by` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`prodotto_id`) REFERENCES `warehouse_products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`articolo_catalogo_id`) REFERENCES `catalog_articles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`bom_id`) REFERENCES `bill_of_materials`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cliente_id`) REFERENCES `anagrafica_clienti`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`responsabile_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `production_orders_numero_unique` ON `production_orders` (`numero`);--> statement-breakpoint
CREATE TABLE `production_phases` (
	`id` text PRIMARY KEY NOT NULL,
	`ordine_id` text NOT NULL,
	`nome` text NOT NULL,
	`descrizione` text,
	`ordine` integer DEFAULT 0 NOT NULL,
	`stato` text DEFAULT 'da_iniziare' NOT NULL,
	`tempo_stimato` integer,
	`tempo_effettivo` integer,
	`data_inizio` text,
	`data_fine` text,
	`operatore_id` text,
	`note` text,
	`created_at` text,
	FOREIGN KEY (`ordine_id`) REFERENCES `production_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`operatore_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `project_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`user_id` text NOT NULL,
	`content` text NOT NULL,
	`mentions` text DEFAULT '[]',
	`created_at` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `project_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`document_id` text NOT NULL,
	`added_at` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `project_emails` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`email_id` text NOT NULL,
	`email_subject` text NOT NULL,
	`email_from` text NOT NULL,
	`email_preview` text,
	`email_date` text,
	`added_at` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `project_shares` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`user_id` text NOT NULL,
	`shared_by_id` text,
	`permission` text DEFAULT 'view' NOT NULL,
	`shared_at` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`shared_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'Not Started' NOT NULL,
	`priority` text DEFAULT 'Medium' NOT NULL,
	`start_date` text,
	`due_date` text,
	`team_members` text DEFAULT '[]',
	`owner` text,
	`notes` text,
	`budget` text,
	`files` text DEFAULT '[]',
	`created_at` text,
	`share_token` text,
	`share_expires_at` text,
	`is_public` integer DEFAULT false
);
--> statement-breakpoint
CREATE TABLE `promemoria_anagrafica` (
	`id` text PRIMARY KEY NOT NULL,
	`tipo` text NOT NULL,
	`entita_id` text NOT NULL,
	`titolo` text NOT NULL,
	`descrizione` text,
	`data_scadenza` text,
	`priorita` text DEFAULT 'normale',
	`stato` text DEFAULT 'attivo',
	`colore` text DEFAULT '#3B82F6',
	`notifica_email` integer DEFAULT 0,
	`notificato` integer DEFAULT 0,
	`completato_at` text,
	`completato_da` text,
	`created_by` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`completato_da`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `quote_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`quote_id` text NOT NULL,
	`descrizione` text NOT NULL,
	`quantita` text DEFAULT '1',
	`unita_misura` text DEFAULT 'pz',
	`prezzo_unitario` text DEFAULT '0',
	`sconto` text DEFAULT '0',
	`aliquota_iva` text DEFAULT '22',
	`importo` text DEFAULT '0',
	`ordine` integer DEFAULT 0,
	FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` text PRIMARY KEY NOT NULL,
	`numero` text NOT NULL,
	`stato` text DEFAULT 'bozza' NOT NULL,
	`data_emissione` text NOT NULL,
	`data_validita` text,
	`cliente_id` text,
	`ragione_sociale` text NOT NULL,
	`partita_iva` text,
	`codice_fiscale` text,
	`indirizzo` text,
	`email` text,
	`telefono` text,
	`imponibile` text DEFAULT '0',
	`iva` text DEFAULT '0',
	`totale` text DEFAULT '0',
	`sconto` text DEFAULT '0',
	`valuta` text DEFAULT 'EUR',
	`oggetto` text,
	`descrizione` text,
	`termini_pagamento` text,
	`note` text,
	`note_interne` text,
	`invoice_id` text,
	`project_id` text,
	`created_by` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`cliente_id`) REFERENCES `anagrafica_clienti`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `referenti_clienti` (
	`id` text PRIMARY KEY NOT NULL,
	`cliente_id` text NOT NULL,
	`nome` text NOT NULL,
	`cognome` text,
	`ruolo` text,
	`dipartimento` text,
	`email` text,
	`telefono_fisso` text,
	`cellulare` text,
	`linkedin` text,
	`principale` integer DEFAULT 0,
	`riceve_newsletter` integer DEFAULT 0,
	`riceve_offerte` integer DEFAULT 1,
	`note` text,
	`attivo` integer DEFAULT 1,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`cliente_id`) REFERENCES `anagrafica_clienti`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `richieste_assenza` (
	`id` text PRIMARY KEY NOT NULL,
	`personale_id` text NOT NULL,
	`tipo` text DEFAULT 'ferie' NOT NULL,
	`data_inizio` text NOT NULL,
	`data_fine` text NOT NULL,
	`giorni_totali` text DEFAULT '1' NOT NULL,
	`ore_totali` text,
	`motivo` text,
	`stato` text DEFAULT 'richiesta' NOT NULL,
	`approvato_da` text,
	`data_approvazione` text,
	`note_approvazione` text,
	`allegato` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`personale_id`) REFERENCES `anagrafica_personale`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`approvato_da`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`module` text NOT NULL,
	`can_view` integer DEFAULT false NOT NULL,
	`can_create` integer DEFAULT false NOT NULL,
	`can_edit` integer DEFAULT false NOT NULL,
	`can_delete` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `saldi_ferie_permessi` (
	`id` text PRIMARY KEY NOT NULL,
	`personale_id` text NOT NULL,
	`anno` integer NOT NULL,
	`ferie_totali` text DEFAULT '26' NOT NULL,
	`ferie_godute` text DEFAULT '0' NOT NULL,
	`ferie_residue_anno_prec` text DEFAULT '0',
	`permessi_totali` text DEFAULT '32' NOT NULL,
	`permessi_goduti` text DEFAULT '0' NOT NULL,
	`malattia_giorni` text DEFAULT '0',
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`personale_id`) REFERENCES `anagrafica_personale`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sales_order_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`articolo_id` text,
	`codice_articolo` text,
	`descrizione` text NOT NULL,
	`quantita` text DEFAULT '1',
	`unita_misura` text DEFAULT 'pz',
	`prezzo_unitario` text DEFAULT '0',
	`sconto` text DEFAULT '0',
	`aliquota_iva` text DEFAULT '22',
	`importo` text DEFAULT '0',
	`ordine` integer DEFAULT 0,
	`quantita_allocata` text DEFAULT '0',
	`quantita_in_produzione` text DEFAULT '0',
	`quantita_spedita` text DEFAULT '0',
	`quantita_fatturata` text DEFAULT '0',
	`produzione_ordine_id` text,
	FOREIGN KEY (`order_id`) REFERENCES `sales_orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`articolo_id`) REFERENCES `catalog_articles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`produzione_ordine_id`) REFERENCES `production_orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sales_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`numero` text NOT NULL,
	`stato` text DEFAULT 'confermato' NOT NULL,
	`workflow_status` text DEFAULT 'preventivo_accettato',
	`data_ordine` text NOT NULL,
	`data_consegna_prevista` text,
	`data_consegna_effettiva` text,
	`quote_id` text,
	`cliente_id` text,
	`ragione_sociale` text NOT NULL,
	`partita_iva` text,
	`codice_fiscale` text,
	`indirizzo` text,
	`cap` text,
	`citta` text,
	`provincia` text,
	`email` text,
	`telefono` text,
	`imponibile` text DEFAULT '0',
	`iva` text DEFAULT '0',
	`totale` text DEFAULT '0',
	`valuta` text DEFAULT 'EUR',
	`oggetto` text,
	`note` text,
	`note_interne` text,
	`termini_pagamento` text,
	`priorita` text DEFAULT 'normale',
	`materiale_verificato` integer DEFAULT 0,
	`materiale_disponibile` integer DEFAULT 0,
	`produzione_richiesta` integer DEFAULT 0,
	`ddt_id` text,
	`invoice_id` text,
	`spedizione_id` text,
	`project_id` text,
	`created_by` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cliente_id`) REFERENCES `anagrafica_clienti`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ddt_id`) REFERENCES `ddt`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sales_orders_numero_unique` ON `sales_orders` (`numero`);--> statement-breakpoint
CREATE TABLE `scadenze_hr` (
	`id` text PRIMARY KEY NOT NULL,
	`personale_id` text NOT NULL,
	`tipo` text DEFAULT 'altro' NOT NULL,
	`titolo` text NOT NULL,
	`descrizione` text,
	`data_scadenza` text NOT NULL,
	`data_avviso` text,
	`giorni_anticipo` integer DEFAULT 30,
	`priorita` text DEFAULT 'normale',
	`completata` integer DEFAULT 0,
	`data_completamento` text,
	`allegato` text,
	`note` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`personale_id`) REFERENCES `anagrafica_personale`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `shared_links` (
	`id` text PRIMARY KEY NOT NULL,
	`resource_type` text NOT NULL,
	`resource_id` text NOT NULL,
	`token` text NOT NULL,
	`permission` text DEFAULT 'view' NOT NULL,
	`password` text,
	`expires_at` text,
	`created_by` text,
	`created_at` text,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shared_links_token_unique` ON `shared_links` (`token`);--> statement-breakpoint
CREATE TABLE `social_analytics` (
	`id` text PRIMARY KEY NOT NULL,
	`piattaforma` text NOT NULL,
	`data_rilevazione` text NOT NULL,
	`followers` integer DEFAULT 0,
	`followers_variazione` integer DEFAULT 0,
	`engagement` text,
	`impressions` integer DEFAULT 0,
	`reach` integer DEFAULT 0,
	`clicks` integer DEFAULT 0,
	`likes` integer DEFAULT 0,
	`commenti` integer DEFAULT 0,
	`condivisioni` integer DEFAULT 0,
	`note` text,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `social_contenuti` (
	`id` text PRIMARY KEY NOT NULL,
	`titolo` text NOT NULL,
	`tipo` text DEFAULT 'post',
	`piattaforma` text,
	`contenuto` text,
	`media_url` text,
	`media_type` text,
	`hashtags` text DEFAULT '[]',
	`stato` text DEFAULT 'bozza',
	`data_pubblicazione` text,
	`ora_pubblicazione` text,
	`campagna_id` text,
	`link_esterno` text,
	`note` text,
	`created_by` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`campagna_id`) REFERENCES `marketing_campagne`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `spedizioni` (
	`id` text PRIMARY KEY NOT NULL,
	`numero` text NOT NULL,
	`data` text NOT NULL,
	`cliente_id` text,
	`corriere_id` text,
	`destinatario` text,
	`indirizzo_destinazione` text,
	`cap_destinazione` text,
	`citta_destinazione` text,
	`provincia_destinazione` text,
	`nazione_destinazione` text DEFAULT 'Italia',
	`telefono_destinazione` text,
	`referente_destinazione` text,
	`stato` text DEFAULT 'da_preparare' NOT NULL,
	`numero_tracking` text,
	`data_spedizione` text,
	`data_consegna_stimata` text,
	`data_consegna_effettiva` text,
	`numero_colli` integer DEFAULT 1,
	`peso_totale` text,
	`volume_totale` text,
	`costo_spedizione` text DEFAULT '0',
	`ddt_id` text,
	`ordine_produzione_id` text,
	`note_preparazione` text,
	`note_consegna` text,
	`firma_destinatario` text,
	`nome_firmatario` text,
	`data_ora_firma` text,
	`email_destinatario` text,
	`notifica_partenza_inviata` integer DEFAULT 0,
	`notifica_consegna_inviata` integer DEFAULT 0,
	`data_notifica_partenza` text,
	`data_notifica_consegna` text,
	`created_by` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`cliente_id`) REFERENCES `anagrafica_clienti`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`corriere_id`) REFERENCES `corrieri`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `spedizioni_righe` (
	`id` text PRIMARY KEY NOT NULL,
	`spedizione_id` text NOT NULL,
	`prodotto_id` text,
	`descrizione` text NOT NULL,
	`quantita` text DEFAULT '1' NOT NULL,
	`unita_misura` text DEFAULT 'pz',
	`peso` text,
	`note` text,
	`prelevato` integer DEFAULT 0,
	`created_at` text,
	FOREIGN KEY (`spedizione_id`) REFERENCES `spedizioni`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`prodotto_id`) REFERENCES `warehouse_products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `straordinari` (
	`id` text PRIMARY KEY NOT NULL,
	`personale_id` text NOT NULL,
	`data` text NOT NULL,
	`ore` text NOT NULL,
	`motivo` text,
	`stato` text DEFAULT 'richiesto' NOT NULL,
	`approvato_da` text,
	`data_approvazione` text,
	`note_approvazione` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`personale_id`) REFERENCES `anagrafica_personale`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`approvato_da`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `subtasks` (
	`id` text PRIMARY KEY NOT NULL,
	`todo_id` text NOT NULL,
	`title` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`order` integer DEFAULT 0,
	`created_at` text,
	FOREIGN KEY (`todo_id`) REFERENCES `personal_todos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `task_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`user_id` text NOT NULL,
	`content` text NOT NULL,
	`mentions` text DEFAULT '[]',
	`created_at` text,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`done` integer DEFAULT false NOT NULL,
	`start_date` text,
	`due_date` text,
	`tag` text,
	`assigned_to` text,
	`priority` text DEFAULT 'medium',
	`estimated_hours` integer,
	`actual_hours` integer,
	`project_id` text,
	`created_at` text,
	FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `team_availability` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`availability_type` text DEFAULT 'available' NOT NULL,
	`title` text,
	`description` text,
	`created_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `telegram_chats` (
	`id` text PRIMARY KEY NOT NULL,
	`chat_id` text NOT NULL,
	`username` text,
	`first_name` text,
	`last_name` text,
	`type` text DEFAULT 'private' NOT NULL,
	`unread_count` integer DEFAULT 0 NOT NULL,
	`last_message_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `telegram_chats_chat_id_unique` ON `telegram_chats` (`chat_id`);--> statement-breakpoint
CREATE TABLE `telegram_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`chat_id` text NOT NULL,
	`telegram_message_id` text,
	`content` text NOT NULL,
	`direction` text DEFAULT 'incoming' NOT NULL,
	`created_at` text,
	FOREIGN KEY (`chat_id`) REFERENCES `telegram_chats`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `timbrature` (
	`id` text PRIMARY KEY NOT NULL,
	`personale_id` text NOT NULL,
	`tipo` text NOT NULL,
	`data_ora` text NOT NULL,
	`latitudine` text,
	`longitudine` text,
	`indirizzo` text,
	`dispositivo` text,
	`note` text,
	`created_at` text,
	FOREIGN KEY (`personale_id`) REFERENCES `anagrafica_personale`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `time_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`todo_id` text,
	`project_id` text,
	`task_id` text,
	`description` text,
	`start_time` text NOT NULL,
	`end_time` text,
	`duration_minutes` integer,
	`billable` integer DEFAULT 0,
	`created_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`todo_id`) REFERENCES `personal_todos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `todo_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`priority` text DEFAULT 'medium' NOT NULL,
	`category` text,
	`estimated_minutes` integer,
	`recurrence_type` text,
	`reminder_before` integer,
	`user_id` text,
	`created_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `turni` (
	`id` text PRIMARY KEY NOT NULL,
	`personale_id` text NOT NULL,
	`data` text NOT NULL,
	`ora_inizio` text NOT NULL,
	`ora_fine` text NOT NULL,
	`pausa` integer DEFAULT 0,
	`tipologia` text DEFAULT 'ordinario',
	`note` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`personale_id`) REFERENCES `anagrafica_personale`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `turni_predefiniti` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`ora_inizio` text NOT NULL,
	`ora_fine` text NOT NULL,
	`pausa` integer DEFAULT 60,
	`colore` text DEFAULT '#3b82f6',
	`attivo` integer DEFAULT 1,
	`ordine` integer DEFAULT 0,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `user_access_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`login_at` text,
	`ip_address` text,
	`user_agent` text,
	`device` text,
	`browser` text,
	`os` text,
	`success` integer DEFAULT true,
	`logout_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_email_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email_address` text NOT NULL,
	`imap_host` text NOT NULL,
	`imap_port` integer DEFAULT 993 NOT NULL,
	`imap_secure` integer DEFAULT true NOT NULL,
	`smtp_host` text NOT NULL,
	`smtp_port` integer DEFAULT 465 NOT NULL,
	`smtp_secure` integer DEFAULT true NOT NULL,
	`password` text NOT NULL,
	`display_name` text,
	`signature` text,
	`is_active` integer DEFAULT true NOT NULL,
	`last_sync_at` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`module` text NOT NULL,
	`can_view` integer DEFAULT 0 NOT NULL,
	`can_create` integer DEFAULT 0 NOT NULL,
	`can_edit` integer DEFAULT 0 NOT NULL,
	`can_delete` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_whatsapp_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`session_data` text,
	`phone_number` text,
	`is_connected` integer DEFAULT 0 NOT NULL,
	`last_connected_at` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_whatsapp_configs_user_id_unique` ON `user_whatsapp_configs` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`username` text,
	`password` text,
	`role` text DEFAULT 'Member' NOT NULL,
	`department` text,
	`status` text DEFAULT 'Active' NOT NULL,
	`avatar` text,
	`allowed_ip` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE TABLE `warehouse_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`prefisso` text DEFAULT 'GEN' NOT NULL,
	`descrizione` text,
	`colore` text DEFAULT '#3B82F6',
	`parent_id` text,
	`ordine` integer DEFAULT 0,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `warehouse_code_counters` (
	`prefisso` text PRIMARY KEY NOT NULL,
	`ultimo_progressivo` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `warehouse_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`prodotto_id` text NOT NULL,
	`tipo` text NOT NULL,
	`causale` text NOT NULL,
	`quantita` text NOT NULL,
	`giacenza_precedente` text,
	`giacenza_successiva` text,
	`prezzo_unitario` text,
	`documento_rif` text,
	`ordine_produzione_id` text,
	`note` text,
	`created_by` text,
	`created_at` text,
	FOREIGN KEY (`prodotto_id`) REFERENCES `warehouse_products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `warehouse_products` (
	`id` text PRIMARY KEY NOT NULL,
	`codice` text NOT NULL,
	`nome` text NOT NULL,
	`descrizione` text,
	`categoria_id` text,
	`unita_misura` text DEFAULT 'pz' NOT NULL,
	`prezzo_acquisto` text DEFAULT '0',
	`prezzo_vendita` text DEFAULT '0',
	`aliquota_iva` text DEFAULT '22',
	`giacenza` text DEFAULT '0' NOT NULL,
	`giacenza_minima` text DEFAULT '0',
	`giacenza_massima` text,
	`ubicazione` text,
	`barcode` text,
	`fornitore_id` text,
	`note` text,
	`attivo` integer DEFAULT 1 NOT NULL,
	`immagine` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`categoria_id`) REFERENCES `warehouse_categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`fornitore_id`) REFERENCES `anagrafica_fornitori`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `warehouse_products_codice_unique` ON `warehouse_products` (`codice`);--> statement-breakpoint
CREATE TABLE `whatsapp_contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone_number` text NOT NULL,
	`avatar` text,
	`is_group` integer DEFAULT 0,
	`unread_count` integer DEFAULT 0,
	`last_message_time` text,
	`last_message_preview` text,
	`is_online` integer DEFAULT 0,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `whatsapp_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`contact_id` text NOT NULL,
	`content` text,
	`type` text DEFAULT 'text',
	`media_url` text,
	`direction` text NOT NULL,
	`status` text DEFAULT 'sent',
	`timestamp` text NOT NULL,
	`whatsapp_id` text,
	`is_deleted` integer DEFAULT 0,
	FOREIGN KEY (`contact_id`) REFERENCES `whatsapp_contacts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `whiteboard_elements` (
	`id` text PRIMARY KEY NOT NULL,
	`whiteboard_id` text NOT NULL,
	`type` text NOT NULL,
	`x` integer DEFAULT 0 NOT NULL,
	`y` integer DEFAULT 0 NOT NULL,
	`width` integer DEFAULT 200,
	`height` integer DEFAULT 200,
	`rotation` integer DEFAULT 0,
	`content` text,
	`color` text DEFAULT '#fef08a',
	`font_size` integer DEFAULT 14,
	`font_weight` text DEFAULT 'normal',
	`border_color` text,
	`border_width` integer DEFAULT 0,
	`shape_type` text,
	`points` text,
	`z_index` integer DEFAULT 0,
	`locked` integer DEFAULT 0,
	`created_by` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`whiteboard_id`) REFERENCES `whiteboards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `whiteboards` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`owner_id` text,
	`project_id` text,
	`is_public` integer DEFAULT 0 NOT NULL,
	`background_color` text DEFAULT '#ffffff',
	`grid_enabled` integer DEFAULT 1,
	`collaborators` text DEFAULT '[]',
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `youtube_videos` (
	`id` text PRIMARY KEY NOT NULL,
	`titolo` text NOT NULL,
	`descrizione` text,
	`tags` text DEFAULT '[]',
	`thumbnail_url` text,
	`video_url` text,
	`youtube_id` text,
	`stato` text DEFAULT 'bozza',
	`data_pubblicazione` text,
	`durata` text,
	`categoria` text,
	`script` text,
	`storyboard` text,
	`views` integer DEFAULT 0,
	`likes` integer DEFAULT 0,
	`commenti` integer DEFAULT 0,
	`campagna_id` text,
	`note` text,
	`created_by` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`campagna_id`) REFERENCES `marketing_campagne`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
