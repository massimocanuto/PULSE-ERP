export interface ManualSection {
  title: string;
  content: string;
  tips?: string[];
}

export interface ManualModule {
  id: string;
  name: string;
  icon: string;
  description: string;
  sections: ManualSection[];
}

export const appVersion = "5.0";

export const manualContent: ManualModule[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    icon: "LayoutDashboard",
    description: "La pagina principale che mostra una panoramica di tutte le attività e informazioni importanti.",
    sections: [
      {
        title: "Panoramica",
        content: "La Dashboard è il punto di partenza dell'applicazione. Qui puoi vedere rapidamente lo stato dei tuoi progetti, le attività in scadenza, le email non lette, il meteo e le statistiche di produttività. Mostra anche informazioni sul dispositivo come il livello della batteria.",
        tips: ["Controlla la Dashboard ogni mattina per avere una visione chiara della giornata"]
      },
      {
        title: "Data e Ora in Tempo Reale",
        content: "Nella barra superiore è visualizzata la data e l'ora corrente in formato italiano, aggiornata in tempo reale. Mostra il giorno della settimana, la data completa e l'orario attuale.",
      },
      {
        title: "Widget Attività",
        content: "Il widget 'Le Mie Attività' mostra il conteggio totale delle attività, quelle completate, quelle in sospeso e quelle urgenti. Clicca su ogni box per vedere i dettagli.",
      },
      {
        title: "Notifiche Email",
        content: "Puoi inviare promemoria delle attività in scadenza o report settimanali direttamente dalla Dashboard cliccando sui pulsanti dedicati. Le notifiche vengono inviate all'email configurata.",
      },
      {
        title: "Google Calendar",
        content: "Se connesso, puoi sincronizzare le tue attività e progetti con Google Calendar direttamente dalla Dashboard. Le scadenze dei progetti vengono create come eventi sul calendario selezionato.",
        tips: ["Connetti Google Calendar per non perdere mai una scadenza importante"]
      },
      {
        title: "Profilo Utente",
        content: "Dalla Dashboard puoi accedere al tuo profilo cliccando sull'avatar in alto a destra. Puoi modificare i tuoi dati e disconnetterti dall'applicazione.",
      },
      {
        title: "Interfaccia Grafica v5.0",
        content: "La versione 5.0 presenta un design moderno e unificato con header gradiente grigio in tutti i moduli, icone stilizzate, layout responsive ottimizzato per desktop e mobile.",
      }
    ]
  },
  {
    id: "todolist",
    name: "To-Do List",
    icon: "CheckSquare",
    description: "Gestisci le tue attività personali con viste multiple, timer Pomodoro, ricorrenze e integrazione calendario.",
    sections: [
      {
        title: "Panoramica",
        content: "La To-Do List è uno spazio personale per gestire le tue attività quotidiane. A differenza delle attività dei progetti, queste sono solo tue. Supporta cinque modalità di visualizzazione.",
      },
      {
        title: "Viste Disponibili",
        content: "Puoi scegliere tra cinque viste: Lista (classica), Kanban (colonne drag-and-drop), Calendario Mensile (panoramica mensile), Calendario Settimanale (vista settimanale), Calendario Giornaliero (vista giornata). Passa tra le viste cliccando i pulsanti in alto.",
        tips: ["Usa la vista calendario per pianificare le scadenze", "La vista Kanban è perfetta per visualizzare il flusso di lavoro"]
      },
      {
        title: "Vista Kanban",
        content: "Passa alla vista Kanban per organizzare le attività in colonne: Da Fare, In Corso, Completate. Trascina le attività tra le colonne per aggiornare lo stato.",
      },
      {
        title: "Viste Calendario",
        content: "Le viste calendario mostrano le attività organizzate per data di scadenza. Il calendario mensile mostra badge colorati per ogni giorno con attività. Il calendario settimanale e giornaliero offrono una vista più dettagliata.",
        tips: ["I badge colorati indicano la priorità: rosso = alta, giallo = media, verde = bassa"]
      },
      {
        title: "Creare un'Attività",
        content: "Clicca su 'Nuova Attività' per aggiungere un nuovo elemento. Puoi impostare titolo, descrizione, priorità (Alta, Media, Bassa), data di scadenza, categoria e collegamento a un progetto.",
        tips: ["Usa le priorità per organizzare meglio il tuo lavoro", "Imposta sempre una data di scadenza per non dimenticare"]
      },
      {
        title: "Timer Pomodoro",
        content: "Ogni attività ha un timer Pomodoro integrato. Clicca sull'icona del timer per avviare una sessione di 25 minuti di lavoro concentrato.",
      },
      {
        title: "Ricorrenze",
        content: "Puoi impostare attività ricorrenti: giornaliere, settimanali o mensili. L'attività verrà ricreata automaticamente dopo il completamento.",
      },
      {
        title: "Dipendenze",
        content: "Puoi collegare attività tra loro indicando le dipendenze. Un'attività bloccata non può essere completata finché le sue dipendenze non sono risolte.",
      },
      {
        title: "Preferiti e Filtri",
        content: "Clicca sulla stella per aggiungere un'attività ai preferiti. Usa i filtri per visualizzare solo le attività completate, in sospeso, o filtrare per priorità e categoria.",
      },
      {
        title: "Template",
        content: "Puoi salvare un'attività come template per riutilizzarla in futuro. Utile per attività ripetitive.",
      },
      {
        title: "Sincronizzazione Google Calendar",
        content: "Le attività della To-Do List possono essere sincronizzate con Google Calendar. Puoi selezionare il calendario specifico su cui creare gli eventi per ogni attività.",
        tips: ["Scegli calendari diversi per separare attività personali e lavorative"]
      },
      {
        title: "Invio Email",
        content: "Puoi inviare un riepilogo dell'attività via email a un collega cliccando sull'icona email.",
      }
    ]
  },
  {
    id: "pulseKeep",
    name: "Pulse Keep",
    icon: "StickyNote",
    description: "Note personali stile Google Keep con formattazione testo, immagini, colori vivaci e cestino.",
    sections: [
      {
        title: "Panoramica",
        content: "Pulse Keep è un modulo per note personali ispirato a Google Keep. Permette di creare note colorate con formattazione ricca, immagini, checklist e organizzarle come preferisci.",
      },
      {
        title: "Creare una Nota",
        content: "Clicca su 'Nuova Nota' per iniziare. Inserisci titolo e contenuto, scegli un colore tra gli 11 disponibili. Puoi anche creare note con checklist.",
        tips: ["Usa colori diversi per categorizzare le note visivamente"]
      },
      {
        title: "Formattazione Testo",
        content: "Usa la barra degli strumenti per formattare il testo: grassetto, corsivo, sottolineato, barrato, elenchi puntati, numerati e checklist. Puoi anche evidenziare il testo.",
        tips: ["Seleziona il testo prima di applicare la formattazione"]
      },
      {
        title: "Inserimento Immagini",
        content: "Clicca sull'icona immagine nella barra degli strumenti per caricare un'immagine dal tuo dispositivo. L'immagine viene incorporata direttamente nella nota.",
      },
      {
        title: "Colori Vivaci",
        content: "Scegli tra 11 colori vivaci e distinguibili: Predefinito, Rosso, Arancione, Giallo, Verde, Teal, Blu, Viola, Rosa, Marrone, Grigio. Il selettore colore mostra anteprime vivide per una facile scelta.",
      },
      {
        title: "Checklist",
        content: "Attiva la modalità checklist per creare liste di controllo. Puoi spuntare gli elementi completati e aggiungere nuovi elementi in qualsiasi momento.",
      },
      {
        title: "Drag and Drop",
        content: "Riordina le note trascinandole nella posizione desiderata. L'ordine viene salvato automaticamente.",
        tips: ["Metti le note più importanti in cima alla lista"]
      },
      {
        title: "Vista Griglia e Lista",
        content: "Passa dalla vista griglia alla vista lista cliccando sui pulsanti in alto. La vista griglia mostra più note contemporaneamente, la vista lista mostra più dettagli.",
      },
      {
        title: "Fissa e Archivia",
        content: "Puoi fissare una nota in alto per averla sempre visibile. Archivia le note che non ti servono più ma vuoi conservare.",
      },
      {
        title: "Duplica Nota",
        content: "Clicca sui tre puntini di una nota e seleziona 'Duplica' per creare una copia identica della nota.",
      },
      {
        title: "Cestino e Recupero",
        content: "Le note eliminate vanno nel cestino dove restano per 30 giorni. Dal cestino puoi ripristinare una nota o eliminarla definitivamente.",
        tips: ["Controlla il cestino prima di eliminare definitivamente le note"]
      }
    ]
  },
  {
    id: "whiteboard",
    name: "Lavagna Condivisa",
    icon: "PenTool",
    description: "Spazio di brainstorming visivo con lavagne collaborative e disegno libero.",
    sections: [
      {
        title: "Panoramica",
        content: "La Lavagna Condivisa è uno spazio per brainstorming e collaborazione visiva. Puoi creare lavagne, aggiungere note adesive, forme e disegnare liberamente.",
      },
      {
        title: "Creare una Lavagna",
        content: "Clicca su 'Nuova Lavagna' per creare uno spazio di lavoro. Inserisci un titolo descrittivo e una breve descrizione.",
        tips: ["Usa nomi descrittivi per trovare facilmente le lavagne"]
      },
      {
        title: "Strumenti di Disegno",
        content: "Usa la matita per disegnare liberamente, la gomma per cancellare. Puoi cambiare colore e dimensione del tratto.",
      },
      {
        title: "Forme e Elementi",
        content: "Aggiungi rettangoli, cerchi, linee e frecce per creare diagrammi. Ogni elemento può essere spostato e ridimensionato.",
      },
      {
        title: "Note Adesive",
        content: "Aggiungi note adesive colorate per annotare idee. Puoi modificare il testo cliccando sulla nota.",
      },
      {
        title: "Collaborazione",
        content: "Le lavagne sono condivise con il team. Tutti i membri possono vedere e modificare le lavagne.",
      }
    ]
  },
  {
    id: "documents",
    name: "Documenti",
    icon: "FileText",
    description: "Crea e gestisci documenti in stile Notion con formattazione ricca, media e sintassi avanzata.",
    sections: [
      {
        title: "Panoramica",
        content: "Il modulo Documenti ti permette di creare note, documentazione e contenuti formattati. È ispirato a Notion per un'esperienza di scrittura fluida.",
      },
      {
        title: "Creare un Documento",
        content: "Clicca su 'Nuovo Documento' per iniziare. Puoi inserire un titolo e iniziare a scrivere immediatamente. Scegli un'icona per identificare rapidamente il documento.",
        tips: ["Usa titoli chiari per trovare facilmente i documenti", "Collega i documenti ai progetti per una migliore organizzazione"]
      },
      {
        title: "Barra Formattazione",
        content: "Usa la barra degli strumenti per formattare il testo: grassetto, corsivo, sottolineato, evidenziato. Puoi anche inserire link, immagini e video.",
      },
      {
        title: "Formattazione Testo",
        content: "Puoi formattare il testo con grassetto (**testo**), corsivo (*testo*), sottolineato (__testo__), evidenziato (==testo==). Usa intestazioni con # per strutturare il contenuto.",
      },
      {
        title: "Inserimento Media",
        content: "Inserisci immagini e video direttamente nei documenti usando i pulsanti nella barra degli strumenti. I media vengono visualizzati inline nel documento.",
      },
      {
        title: "Elenchi e Checklist",
        content: "Crea elenchi puntati con - o numerati con 1. Usa - [ ] per creare checklist con caselle di spunta.",
      },
      {
        title: "Blocchi Speciali",
        content: "Usa [callout]testo[/callout] per creare box evidenziati. Usa [align:center]testo[/align] per allineare il testo a sinistra, centro o destra.",
      },
      {
        title: "Collegamento ai Progetti",
        content: "Ogni documento può essere collegato a uno o più progetti. Questo ti permette di trovare rapidamente la documentazione relativa a un progetto specifico.",
      },
      {
        title: "Condivisione",
        content: "Puoi condividere i documenti con altri utenti del team assegnando permessi di visualizzazione o modifica.",
      },
      {
        title: "Flag di Revisione",
        content: "Puoi contrassegnare un documento come 'Da Rivedere' per ricordarti di controllarlo successivamente. Il filtro 'Da Rivedere' mostra solo questi documenti.",
      }
    ]
  },
  {
    id: "archivio",
    name: "Archivio",
    icon: "Archive",
    description: "Archivia e gestisci file come PDF, immagini, Word ed Excel con anteprima e categorizzazione.",
    sections: [
      {
        title: "Panoramica",
        content: "L'Archivio è il luogo dove conservare tutti i file importanti: contratti, fatture, certificazioni e altri documenti aziendali.",
      },
      {
        title: "Caricare un File",
        content: "Clicca su 'Carica Documento' e seleziona il file dal tuo computer. Formati supportati: PDF, immagini (JPG, PNG, GIF), Word (DOC, DOCX), Excel (XLS, XLSX). Dimensione massima: 10MB.",
        tips: ["Usa nomi descrittivi per i file", "Assegna sempre una categoria per trovare facilmente i documenti"]
      },
      {
        title: "Categorie",
        content: "I documenti sono organizzati in categorie: Contratti, Fatture, Documenti Legali, Certificazioni, Altro. Usa i filtri per visualizzare solo una categoria.",
      },
      {
        title: "Collegamento ai Progetti",
        content: "Puoi collegare i documenti dell'archivio a progetti specifici. Questo facilita il ritrovamento dei file relativi a un progetto.",
      },
      {
        title: "Anteprima",
        content: "Le immagini e i PDF mostrano un'anteprima. Per i documenti Word ed Excel viene mostrata un'icona rappresentativa.",
      },
      {
        title: "Download",
        content: "Clicca sul pulsante di download per scaricare il file originale sul tuo computer.",
      }
    ]
  },
  {
    id: "anagrafica",
    name: "Anagrafica",
    icon: "BookUser",
    description: "Gestione completa di personale interno, clienti e fornitori con validazione dati italiani.",
    sections: [
      {
        title: "Panoramica",
        content: "Il modulo Anagrafica è il registro centrale per la gestione di dipendenti interni, clienti e fornitori. Presenta tre schede dedicate con funzionalità complete di inserimento, modifica e ricerca.",
      },
      {
        title: "Tab Personale",
        content: "Gestisce i dipendenti interni dell'azienda. Puoi registrare dati anagrafici, contatti, ruolo, reparto, tipo di contratto, data assunzione, stipendio e IBAN per i pagamenti.",
        tips: ["Usa i tag per categorizzare i dipendenti (es. remote, senior, part-time)"]
      },
      {
        title: "Tab Clienti",
        content: "Registro dei clienti aziendali. Include ragione sociale, partita IVA, codice fiscale, dati di contatto, indirizzo, codice SDI per fatturazione elettronica, categoria e condizioni di pagamento.",
        tips: ["Imposta le condizioni di pagamento per ogni cliente (30gg, 60gg, RiBa)"]
      },
      {
        title: "Tab Fornitori",
        content: "Gestisce i fornitori. Simile ai clienti ma include anche l'IBAN per i pagamenti. Puoi categorizzare i fornitori (Materiali, Servizi, IT) e impostare le condizioni di pagamento.",
      },
      {
        title: "Validazione Automatica",
        content: "Il sistema valida automaticamente Codice Fiscale (con algoritmo checksum italiano), Partita IVA (con cifra di controllo) e IBAN (con verifica mod-97). Gli errori vengono mostrati in tempo reale durante l'inserimento.",
        tips: ["I campi con errori di validazione sono evidenziati in rosso"]
      },
      {
        title: "Rilevamento Duplicati",
        content: "Il sistema rileva automaticamente possibili duplicati basandosi su Codice Fiscale (per il personale) o Partita IVA (per clienti e fornitori). I record sospetti sono evidenziati con un bordo giallo.",
      },
      {
        title: "Stati Record",
        content: "Ogni record può avere uno stato: Attivo (operativo), Sospeso (temporaneamente inattivo), Cessato (non più attivo). Lo stato è visualizzato con badge colorati: verde, giallo, rosso.",
      },
      {
        title: "Filtri Avanzati",
        content: "Usa la barra di ricerca per trovare rapidamente un record. Puoi filtrare per stato (Attivo/Sospeso/Cessato) e per reparto (personale) o categoria (clienti/fornitori).",
        tips: ["Combina più filtri per ricerche precise"]
      },
      {
        title: "Tag Personalizzati",
        content: "Aggiungi tag separati da virgola per categorizzare liberamente i record (es. 'vip, puntuale, estero' per un cliente). I tag sono visualizzati come badge sulle card.",
      },
      {
        title: "Selezione Provincia",
        content: "Il campo provincia presenta un menu a tendina con tutte le 107 province italiane per evitare errori di digitazione.",
      },
      {
        title: "Duplica Record",
        content: "Dal menu azioni (tre puntini) puoi duplicare un record esistente per crearne uno simile velocemente.",
      },
      {
        title: "Punti Consegna",
        content: "Per ogni cliente puoi definire uno o piu punti consegna/magazzini con indirizzo, contatti e orari di apertura settimanali. Ogni giorno della settimana (da Lunedi a Domenica) ha un proprio orario configurabile o puo essere impostato come 'Chiuso'.",
        tips: ["Imposta un punto come principale per usarlo di default nelle spedizioni", "Usa le note orari per indicazioni speciali come pause pranzo"]
      },
      {
        title: "Promemoria e Tag",
        content: "Aggiungi promemoria per ogni cliente o fornitore con titolo, descrizione, data scadenza, priorita (Bassa, Normale, Alta, Urgente) e colore personalizzato. I promemoria possono essere completati o eliminati. Utili per ricordare follow-up, pagamenti in sospeso o azioni da compiere.",
        tips: ["I promemoria urgenti mostrano un badge rosso", "Usa colori diversi per categorizzare i tipi di promemoria"]
      },
      {
        title: "Portale Cliente",
        content: "Genera un link univoco per ogni cliente per permettergli di accedere al portale e visualizzare fatture e preventivi senza necessita di registrazione.",
        tips: ["Il link e valido per 30 giorni", "Puoi rigenerare il link in qualsiasi momento"]
      },
      {
        title: "Importazione Excel",
        content: "Importa clienti da file Excel o CSV. Il sistema mappa automaticamente le colonne (Ragione Sociale, Partita IVA, Codice Fiscale, Email, Telefono, Indirizzo, ecc). Puoi visualizzare in anteprima i dati prima dell'importazione."
      },
      {
        title: "Mappa Clienti",
        content: "Visualizza tutti i clienti su una mappa interattiva. I marker sono colorati in base alla provincia di appartenenza per una rapida identificazione geografica."
      }
    ]
  },
  {
    id: "communications",
    name: "Comunicazioni",
    icon: "MessageSquare",
    description: "Hub unificato per Email, Chat di team, WhatsApp e Telegram con configurazione personalizzata.",
    sections: [
      {
        title: "Panoramica",
        content: "Il modulo Comunicazioni raggruppa tutti i canali di comunicazione in un unico posto: Email aziendale, Chat di team, WhatsApp e Telegram Bot.",
      },
      {
        title: "Configurazione Personale",
        content: "Ogni utente può configurare le proprie integrazioni email, WhatsApp e Telegram indipendentemente. Le configurazioni sono salvate nel profilo personale.",
        tips: ["Le configurazioni sono private e visibili solo all'utente"]
      },
      {
        title: "Email",
        content: "Connetti la tua casella email per leggere e inviare email direttamente dall'applicazione. Supporta 12 provider preconfigurati: Aruba, Aruba PEC, Gmail, Outlook, Libero, Virgilio, TIM/Alice, Yahoo, iCloud, Register.it, Legalmail PEC e configurazione personalizzata.",
        tips: ["Collega le email importanti ai progetti per non perderle", "Usa il pulsante di aggiornamento per caricare nuove email"]
      },
      {
        title: "Configurazione Email",
        content: "Vai nelle impostazioni email per configurare il tuo account. Seleziona il provider dalla lista e inserisci email e password. Il sistema configura automaticamente i server IMAP e SMTP.",
      },
      {
        title: "Cartelle Email",
        content: "Le cartelle email vengono sincronizzate automaticamente. Puoi navigare tra Posta in Arrivo, Posta Inviata, Bozze, Spam, Cestino e Archivio.",
      },
      {
        title: "Chat di Team",
        content: "La Chat permette ai membri del team di comunicare in tempo reale. Puoi creare canali pubblici o conversazioni private (DM). Gli indicatori di stato mostrano chi è online.",
      },
      {
        title: "WhatsApp",
        content: "Integrazione con WhatsApp per gestire conversazioni con clienti e fornitori. Richiede la connessione tramite QR code. Nota: a causa delle restrizioni di sicurezza, WhatsApp Web non può essere incorporato direttamente.",
      },
      {
        title: "Telegram Bot",
        content: "Connetti un Bot Telegram per ricevere e inviare messaggi automatici. Richiede la configurazione del token del bot da @BotFather e l'impostazione del webhook.",
        tips: ["Usa il bot Telegram per notifiche automatiche di scadenze"]
      }
    ]
  },
  {
    id: "projects",
    name: "Progetti e Attività",
    icon: "Briefcase",
    description: "Gestisci progetti con vista Board e Timeline, attività drag-and-drop e visualizzazione Montagna.",
    sections: [
      {
        title: "Panoramica",
        content: "Questo è il cuore dell'applicazione. Qui gestisci tutti i progetti aziendali e le relative attività. La visualizzazione a Montagna mostra il progresso in modo visivo e intuitivo.",
      },
      {
        title: "Interfaccia Rinnovata",
        content: "La versione 3.0 presenta una nuova barra gradiente viola-fucsia con icona stilizzata. L'interfaccia è più moderna e coerente con gli altri moduli.",
      },
      {
        title: "Vista Board",
        content: "La vista Board mostra i progetti organizzati per stato: Da Iniziare, In Corso, Completati. Puoi trascinare i progetti tra le colonne per cambiarne lo stato.",
      },
      {
        title: "Vista Timeline",
        content: "La vista Timeline mostra i progetti su un calendario mensile. Vedi la distribuzione temporale dei progetti e le sovrapposizioni.",
        tips: ["Usa la Timeline per pianificare il lavoro del mese"]
      },
      {
        title: "Creare un Progetto",
        content: "Clicca su 'Nuovo Progetto' e inserisci: titolo, stato, priorità, data di scadenza, budget, note e proprietario. Puoi anche aggiungere membri del team.",
        tips: ["Imposta sempre una data di scadenza realistica", "Assegna un proprietario responsabile per ogni progetto"]
      },
      {
        title: "Gestione Attività",
        content: "Ogni progetto contiene attività (task). Clicca su un progetto per vedere le schede: Panoramica, Attività, Email e Documenti. Nella scheda Attività puoi aggiungere, modificare, completare o eliminare task.",
      },
      {
        title: "Tutte le Attività",
        content: "Clicca sul pulsante 'Tutte le Attività' per vedere l'elenco completo di tutti i task indipendentemente dal progetto di appartenenza.",
      },
      {
        title: "Visualizzazione Montagna",
        content: "La Montagna è una rappresentazione visiva del progresso del progetto. Man mano che completi le attività, la montagna si riempie dal basso verso l'alto, fino al picco con la bandiera.",
      },
      {
        title: "Commenti sulle Attività",
        content: "Ogni attività ha un sistema di commenti. Clicca sull'icona messaggio per aggiungere commenti. Puoi menzionare colleghi con @nome.",
      },
      {
        title: "Email del Progetto",
        content: "Nella scheda Email puoi collegare email al progetto e vederne lo storico. Utile per tracciare le comunicazioni relative a un progetto.",
      },
      {
        title: "Documenti del Progetto",
        content: "Nella scheda Documenti puoi vedere e caricare documenti collegati al progetto. I documenti caricati vanno anche nell'Archivio.",
      },
      {
        title: "Sincronizzazione Calendario",
        content: "I progetti possono essere sincronizzati con Google Calendar. Puoi selezionare il calendario specifico per ogni progetto.",
      }
    ]
  },
  {
    id: "analytics",
    name: "Analisi",
    icon: "BarChart3",
    description: "Visualizza statistiche dettagliate, timeline, capacità del team e report avanzati.",
    sections: [
      {
        title: "Panoramica",
        content: "Il modulo Analisi fornisce una visione approfondita della produttività e dello stato dei progetti attraverso grafici, tabelle e indicatori di performance.",
      },
      {
        title: "Portfolio Dashboard",
        content: "Visualizza tutti i progetti con indicatori di salute: Verde (in tempo), Giallo (a rischio), Rosso (in ritardo). Mostra anche le statistiche di completamento e il budget totale.",
      },
      {
        title: "Timeline/Roadmap",
        content: "Una vista Gantt che mostra la timeline di tutti i progetti. Vedi quando iniziano, quando devono terminare e le sovrapposizioni.",
      },
      {
        title: "Capacity Planner",
        content: "Mostra il carico di lavoro di ogni membro del team con barre colorate. Verde = carico normale, Giallo = carico elevato, Rosso = sovraccarico.",
        tips: ["Controlla regolarmente il carico di lavoro del team", "Ridistribuisci le attività se qualcuno è sovraccarico"]
      },
      {
        title: "Activity Feed",
        content: "Uno storico delle attività recenti del team: chi ha creato, modificato o completato cosa. Include timestamp e avatar degli utenti.",
      },
      {
        title: "Report Avanzati",
        content: "Genera report personalizzati sulla produttività, sull'avanzamento dei progetti e sul tempo impiegato. Puoi esportare i dati per analisi esterne.",
      }
    ]
  },
  {
    id: "aiAssistant",
    name: "Assistente AI",
    icon: "Bot",
    description: "Assistente intelligente GPT-4o per task, documenti, email e suggerimenti di produttività.",
    sections: [
      {
        title: "Panoramica",
        content: "L'Assistente AI è alimentato da OpenAI GPT-4o-mini e ti aiuta in varie attività quotidiane. Puoi chattare, generare task, analizzare documenti e ricevere suggerimenti.",
      },
      {
        title: "Chat AI",
        content: "Nella scheda Chat puoi conversare con l'assistente. Poni domande, chiedi consigli o fai brainstorming. L'assistente ricorda il contesto della conversazione.",
        tips: ["Sii specifico nelle domande per ottenere risposte migliori"]
      },
      {
        title: "Generazione Task",
        content: "Nella scheda Task descrivi un obiettivo e l'AI genera automaticamente una lista di attività per raggiungerlo. Puoi poi aggiungerle alla tua To-Do List.",
      },
      {
        title: "Analisi Documenti",
        content: "Incolla il testo di un documento e l'AI lo analizza, creando un riepilogo e identificando i punti chiave.",
      },
      {
        title: "Analisi Email",
        content: "Incolla un'email e l'AI la analizza, identificando il tono, le richieste principali e suggerendo una possibile risposta.",
      },
      {
        title: "Report Progetto",
        content: "Seleziona un progetto e l'AI genera un report completo sullo stato di avanzamento, le criticità e i prossimi passi consigliati.",
      },
      {
        title: "Suggerimenti Produttività",
        content: "L'AI analizza le tue attività e i tuoi pattern di lavoro, offrendo suggerimenti personalizzati per migliorare la produttività.",
      }
    ]
  },
  {
    id: "controlPanel",
    name: "Pannello di Controllo",
    icon: "Settings",
    description: "Gestione centralizzata di utenti, permessi granulari e accesso al database.",
    sections: [
      {
        title: "Panoramica",
        content: "Il Pannello di Controllo è accessibile solo agli amministratori e permette di gestire utenti, permessi e accedere al database dell'applicazione.",
      },
      {
        title: "Gestione Utenti",
        content: "Nella scheda Utenti puoi vedere tutti gli account, aggiungere nuovi utenti, modificare i dati esistenti, resettare password e attivare/disattivare account.",
        tips: ["Disattiva gli account invece di eliminarli per mantenere lo storico"]
      },
      {
        title: "Configurazione Email Utenti",
        content: "Gli amministratori possono configurare l'email per qualsiasi utente cliccando sui tre puntini accanto all'utente e selezionando 'Configura Email'.",
      },
      {
        title: "Ruoli Utente",
        content: "Assegna ruoli agli utenti: Admin (accesso completo), Manager (gestione team), Member (collaborazione), Viewer (solo lettura). Ogni ruolo ha permessi predefiniti.",
      },
      {
        title: "Gestione Permessi Granulari",
        content: "Nella scheda Permessi configura cosa può fare ogni ruolo e ogni singolo utente. Puoi impostare permessi granulari per ogni modulo: Visualizza, Crea, Modifica, Elimina. I permessi possono essere personalizzati per singolo utente.",
      },
      {
        title: "Database Explorer",
        content: "Nella scheda Database puoi esplorare le tabelle del database, vedere i dati e le relazioni tra le entità. Utile per debug e analisi avanzate.",
        tips: ["Usa il Database Explorer solo se sai cosa stai facendo"]
      }
    ]
  },
  {
    id: "settings",
    name: "Impostazioni",
    icon: "Settings",
    description: "Personalizza tema, carattere e preferenze dell'applicazione.",
    sections: [
      {
        title: "Tema",
        content: "Puoi scegliere tra nove temi: Chiaro (sfondo luminoso), Scuro (perfetto per lavorare di sera), Sabbia (toni caldi), Celeste (toni freddi), Liquid Glass (effetto vetro sfumato), Ubuntu (ispirato a Linux), Apple (stile macOS), Google (Material Design), Windows (Fluent Design). Clicca su 'Tema' nel menu laterale per cambiare.",
      },
      {
        title: "Carattere",
        content: "Scegli tra cinque font: JetBrains Mono (monospace, ideale per sviluppatori), Segoe UI (sans-serif), San Francisco (Apple), Ubuntu e Google Inter (moderno e leggibile). La scelta viene salvata automaticamente.",
      },
      {
        title: "Preferenze Personali",
        content: "Le preferenze come tema e font vengono salvate nel browser e ricordate alla prossima visita.",
      }
    ]
  },
  {
    id: "googleCalendar",
    name: "Google Calendar",
    icon: "Calendar",
    description: "Sincronizzazione bidirezionale con Google Calendar per task e progetti con selezione calendario.",
    sections: [
      {
        title: "Panoramica",
        content: "L'integrazione con Google Calendar permette di sincronizzare le scadenze dei progetti e delle attività con il tuo calendario Google.",
      },
      {
        title: "Connessione",
        content: "Clicca su 'Connetti Google Calendar' nella Dashboard. Verrai reindirizzato a Google per autorizzare l'accesso al calendario.",
        tips: ["Usa un account Google aziendale per separare lavoro e vita privata"]
      },
      {
        title: "Selezione Calendario",
        content: "Una volta connesso, puoi selezionare il calendario specifico su cui creare gli eventi. La lista mostra tutti i tuoi calendari Google (personali e condivisi).",
        tips: ["Crea un calendario dedicato per le attività PULSE ERP"]
      },
      {
        title: "Sincronizzazione Attività",
        content: "Le attività della To-Do List e i task dei progetti possono essere sincronizzati come eventi sul calendario selezionato. Ogni evento include titolo, descrizione e data di scadenza.",
      },
      {
        title: "Persistenza Eventi",
        content: "Il sistema memorizza l'ID degli eventi creati. Questo permette di aggiornare o eliminare eventi esistenti invece di crearne duplicati.",
      },
      {
        title: "Promemoria",
        content: "Gli eventi creati includono promemoria automatici per non dimenticare le scadenze importanti.",
      }
    ]
  },
  {
    id: "finanza",
    name: "Finanza",
    icon: "Wallet",
    description: "Gestione completa di fatture, preventivi, DDT, pagamenti e solleciti con fatturazione elettronica.",
    sections: [
      {
        title: "Panoramica",
        content: "Il modulo Finanza è il centro di gestione contabile dell'applicazione. Include fatture attive e passive, preventivi, DDT (Documenti di Trasporto), pagamenti parziali, solleciti email e importazione estratti conto.",
      },
      {
        title: "Fatture Attive",
        content: "Crea e gestisci le fatture emesse ai clienti. Ogni fattura include: numero progressivo, data, cliente (da anagrafica), righe articoli con quantità e prezzi, IVA, totale, stato (Bozza, Emessa, Pagata, Scaduta).",
        tips: ["Usa i clienti dall'anagrafica per compilare automaticamente i dati", "Controlla sempre l'anteprima prima di emettere"]
      },
      {
        title: "Fatture Passive",
        content: "Registra le fatture ricevute dai fornitori. Traccia scadenze, importi e stati di pagamento. Utile per la gestione del cash flow.",
      },
      {
        title: "Preventivi",
        content: "Crea preventivi per i clienti con stati: Bozza, Inviato, Accettato, Rifiutato, Scaduto, Convertito. Puoi convertire un preventivo accettato in fattura con un click.",
        tips: ["Imposta una data di scadenza per i preventivi", "Usa la conversione rapida per trasformare preventivi in fatture"]
      },
      {
        title: "DDT - Documenti di Trasporto",
        content: "Gestisci i DDT per le spedizioni. Ogni DDT include: destinatario, indirizzo di consegna, righe articoli, colli, peso. Puoi convertire un DDT in fattura dopo la consegna.",
        tips: ["Compila sempre l'indirizzo di destinazione diversa se necessario"]
      },
      {
        title: "Pagamenti Parziali",
        content: "Registra pagamenti parziali sulle fatture. Il sistema aggiorna automaticamente lo stato: Parzialmente Pagata quando c'è un acconto, Pagata quando il saldo è completo. Visualizza lo storico di tutti i pagamenti.",
      },
      {
        title: "Solleciti Email",
        content: "Invia solleciti di pagamento via email per le fatture scadute. Personalizza il testo del sollecito e traccia quali solleciti sono stati aperti dal destinatario.",
        tips: ["Invia solleciti a intervalli regolari per i pagamenti in ritardo"]
      },
      {
        title: "Import Estratto Conto",
        content: "Importa estratti conto bancari in formato CSV, Excel o CBI. Il sistema analizza automaticamente i movimenti e li categorizza per tipo (incasso, pagamento, bonifico).",
      },
      {
        title: "Stampa PDF",
        content: "Genera PDF professionali per fatture, preventivi e DDT con i dati aziendali, logo e formattazione italiana.",
      }
    ]
  },
  {
    id: "crm",
    name: "CRM",
    icon: "Users",
    description: "Gestione lead, opportunità di vendita, pipeline commerciale e storico interazioni clienti.",
    sections: [
      {
        title: "Panoramica",
        content: "Il modulo CRM (Customer Relationship Management) ti permette di gestire lead, opportunità commerciali e tracciare tutte le interazioni con i clienti potenziali e acquisiti.",
      },
      {
        title: "Dashboard KPI",
        content: "La dashboard mostra i principali indicatori: numero lead attivi, opportunità in pipeline, valore totale pipeline, tasso di conversione, lead per fonte.",
      },
      {
        title: "Gestione Lead",
        content: "Registra nuovi lead con: nome, azienda, email, telefono, fonte (Web, Referral, Fiera, Cold Call), stato (Nuovo, Contattato, Qualificato, Perso). Aggiungi note e programma follow-up.",
        tips: ["Qualifica i lead prima di convertirli in opportunità", "Traccia sempre la fonte per analizzare i canali più efficaci"]
      },
      {
        title: "Pipeline Opportunità",
        content: "Visualizza le opportunità in una pipeline Kanban con fasi: Prospecting, Qualificazione, Proposta, Negoziazione, Chiuso Vinto, Chiuso Perso. Trascina le card per aggiornare lo stato.",
      },
      {
        title: "Valore Opportunità",
        content: "Ogni opportunità ha un valore stimato e una probabilità di chiusura. Il sistema calcola il valore ponderato della pipeline.",
      },
      {
        title: "Attività e Follow-up",
        content: "Programma attività di follow-up: chiamate, email, meeting. Ricevi promemoria per le attività in scadenza.",
      },
      {
        title: "Storico Interazioni",
        content: "Visualizza lo storico completo di tutte le interazioni con un lead/cliente: email inviate, chiamate effettuate, meeting, note aggiunte.",
      },
      {
        title: "Conversione Lead",
        content: "Converti un lead qualificato in cliente con un click. I dati vengono trasferiti automaticamente all'anagrafica clienti.",
      }
    ]
  },
  {
    id: "produzione",
    name: "Produzione e Magazzino",
    icon: "Factory",
    description: "Gestione magazzino, spedizioni, corrieri, firme digitali e tracciamento consegne.",
    sections: [
      {
        title: "Panoramica",
        content: "Il modulo Produzione gestisce il magazzino prodotti, le spedizioni, il workflow corriere e il tracciamento delle consegne con firma digitale.",
      },
      {
        title: "Magazzino",
        content: "Gestisci l'inventario prodotti con: codice articolo (generato automaticamente), nome, categoria, giacenza, prezzo. Visualizza movimenti di carico e scarico.",
        tips: ["Usa i codici articolo con prefisso categoria per una migliore organizzazione"]
      },
      {
        title: "Generazione Codici",
        content: "I codici articolo vengono generati automaticamente con prefisso basato sulla categoria (es. ELE001 per Elettronica, ABB001 per Abbigliamento) e numero progressivo.",
      },
      {
        title: "Spedizioni",
        content: "Crea e gestisci spedizioni con: destinatario, indirizzo, corriere, tracking number, stato (Preparazione, Spedito, In Transito, Consegnato). Collega DDT alle spedizioni.",
      },
      {
        title: "Dashboard Spedizioni",
        content: "Visualizza tutte le spedizioni con filtri per stato, corriere e data. Badge colorati indicano lo stato: giallo preparazione, blu spedito, verde consegnato.",
      },
      {
        title: "Foglio di Viaggio",
        content: "Genera PDF del foglio di viaggio per i corrieri con tutte le consegne del giorno, ottimizzate per percorso.",
      },
      {
        title: "Workflow Corriere",
        content: "I corrieri accedono via link con token per confermare le consegne. Possono raccogliere la firma digitale del destinatario direttamente su smartphone.",
      },
      {
        title: "Firma Digitale",
        content: "Cattura la firma del destinatario su dispositivo touch. La firma viene salvata come immagine e allegata alla conferma di consegna.",
      },
      {
        title: "Notifiche Consegna",
        content: "Invia automaticamente email al cliente quando la spedizione è consegnata, con link per visualizzare la prova di consegna.",
      },
      {
        title: "Mappa Consegne",
        content: "Visualizza le consegne del giorno su mappa interattiva con percorso ottimizzato basato su coordinate GPS.",
      }
    ]
  },
  {
    id: "catalogo",
    name: "Catalogo Articoli",
    icon: "Package",
    description: "Gestione articoli, categorie, prezzi, giacenze e listino pubblico per il portale clienti.",
    sections: [
      {
        title: "Panoramica",
        content: "Il Catalogo Articoli è il registro centrale di tutti i prodotti e servizi. Ogni articolo può essere usato in fatture, preventivi, DDT e nel listino pubblico.",
      },
      {
        title: "Gestione Articoli",
        content: "Crea articoli con: codice (auto-generato o manuale), nome, descrizione, categoria, unità di misura, prezzo di acquisto, prezzo di vendita, IVA, giacenza.",
        tips: ["Usa descrizioni dettagliate per facilitare la ricerca"]
      },
      {
        title: "Categorie",
        content: "Organizza gli articoli in categorie gerarchiche. Ogni categoria ha un prefisso per la generazione automatica dei codici.",
      },
      {
        title: "Visibilità Listino",
        content: "Imposta quali articoli sono visibili nel listino pubblico del Portale Clienti. Gli articoli nascosti sono usabili internamente ma non visibili ai clienti.",
      },
      {
        title: "Importazione",
        content: "Importa articoli da file Excel o CSV per caricare rapidamente un catalogo esistente.",
      },
      {
        title: "Ricerca Avanzata",
        content: "Cerca articoli per codice, nome, categoria o descrizione. Filtra per disponibilità, fascia di prezzo o categoria.",
      }
    ]
  },
  {
    id: "customerPortal",
    name: "Portale Clienti",
    icon: "Globe",
    description: "Accesso pubblico per clienti per visualizzare fatture, preventivi e listino prezzi.",
    sections: [
      {
        title: "Panoramica",
        content: "Il Portale Clienti è un'area pubblica accessibile tramite token dove i clienti possono visualizzare le proprie fatture, preventivi e il listino prezzi.",
      },
      {
        title: "Accesso Token",
        content: "Ogni cliente riceve un link univoco con token di accesso. Non è richiesta registrazione, il token identifica il cliente.",
        tips: ["Invia il link del portale insieme alle fatture per facilitare l'accesso"]
      },
      {
        title: "Fatture Cliente",
        content: "Il cliente visualizza le proprie fatture con stato, importo e possibilità di scaricare il PDF.",
      },
      {
        title: "Preventivi Cliente",
        content: "Il cliente visualizza i preventivi ricevuti e può accettarli o rifiutarli direttamente dal portale.",
      },
      {
        title: "Listino Pubblico",
        content: "Mostra il catalogo articoli pubblici con prezzi. Il cliente può consultare i prodotti disponibili.",
      },
      {
        title: "Tracciamento Accessi",
        content: "Il sistema registra quando un cliente accede al portale e quali documenti visualizza.",
      }
    ]
  },
  {
    id: "meeting",
    name: "Meeting",
    icon: "Video",
    description: "Videoconferenze integrate per riunioni di team con condivisione schermo.",
    sections: [
      {
        title: "Panoramica",
        content: "Il modulo Meeting permette di organizzare e partecipare a videoconferenze direttamente dall'applicazione senza software esterni.",
      },
      {
        title: "Creare un Meeting",
        content: "Clicca su 'Nuovo Meeting' e inserisci: titolo, data e ora, partecipanti, descrizione. Puoi collegare il meeting a un progetto.",
      },
      {
        title: "Partecipare",
        content: "Clicca sul link del meeting per entrare nella stanza. Attiva video e audio quando sei pronto.",
      },
      {
        title: "Condivisione Schermo",
        content: "Durante il meeting puoi condividere il tuo schermo per mostrare presentazioni, documenti o applicazioni.",
      },
      {
        title: "Inviti",
        content: "Invia inviti via email ai partecipanti con link diretto al meeting.",
      }
    ]
  },
  {
    id: "monitor",
    name: "Monitor Sistema",
    icon: "Activity",
    description: "Monitoraggio prestazioni server, database e stato dei servizi in tempo reale.",
    sections: [
      {
        title: "Panoramica",
        content: "Il Monitor mostra lo stato di salute del sistema: server, database, servizi esterni e utilizzo risorse.",
      },
      {
        title: "Stato Server",
        content: "Visualizza: uptime, utilizzo CPU, memoria RAM, spazio disco. Indicatori verdi/gialli/rossi segnalano lo stato.",
      },
      {
        title: "Database",
        content: "Mostra: connessioni attive, query recenti, dimensione database, tempo risposta medio.",
      },
      {
        title: "Servizi Esterni",
        content: "Stato delle integrazioni: Email (IMAP/SMTP), Telegram Bot, Google Calendar, OpenAI API.",
      },
      {
        title: "Log Sistema",
        content: "Visualizza i log di sistema con filtri per livello (Info, Warning, Error) e data.",
      }
    ]
  },
  {
    id: "hr-manager",
    name: "HR Manager",
    icon: "UserCog",
    description: "Gestione completa del personale con presenze, turni, ferie, straordinari e cedolini.",
    sections: [
      {
        title: "Panoramica",
        content: "Il modulo HR Manager offre una gestione completa delle risorse umane. Include dashboard KPI, gestione collaboratori, presenze con timbrature GPS, pianificazione turni, richieste ferie e permessi, straordinari, scadenzario HR, accessi portale e report cedolini.",
        tips: ["Configura le regole timbrature nella sezione Turni per gestire i limiti giornalieri"]
      },
      {
        title: "Dashboard KPI",
        content: "Visualizza metriche in tempo reale: collaboratori attivi, online nel portale, tasso assenteismo, ore straordinario mensili, richieste in attesa, giorni malattia e turni programmati.",
      },
      {
        title: "Collaboratori",
        content: "Gestione anagrafica completa dei collaboratori con dati personali, contratto, orario settimanale, tariffa oraria, responsabile gerarchico e accesso al portale dipendenti.",
        tips: ["I nomi vengono automaticamente convertiti in maiuscolo per uniformità"]
      },
      {
        title: "Presenze (Timbrature)",
        content: "Sistema di timbrature con validazione GPS, tolleranza 15 minuti rispetto al turno, calcolo automatico ore lavorate. Gli amministratori possono modificare le timbrature.",
      },
      {
        title: "Turni e Regole",
        content: "Pianificazione turni con orari predefiniti (08:00-17:00, 09:00-18:00, ecc.), calcolo automatico ore, tipologia (ordinario, notturno, festivo). Configurazione regole: limite timbrature giornaliere e giorni lavorativi.",
      },
      {
        title: "Ferie e Permessi",
        content: "Gestione richieste ferie, permessi ROL, malattia, maternità, paternità, lutto. Workflow approvazione con stati: in attesa, approvata, rifiutata. Notifiche badge nel menu.",
      },
      {
        title: "Straordinari",
        content: "Registro ore straordinario con motivo, workflow approvazione. Calcolo automatico costo (tariffa base + 25%).",
      },
      {
        title: "Scadenzario HR",
        content: "Gestione scadenze: visite mediche, contratti, formazione, documenti, certificazioni. Priorità con colori, indicatori urgenza, tracciamento completamento.",
      },
      {
        title: "Report Cedolini",
        content: "Report dettagliato timbrature per consulente paghe: data, giorno, entrata (verde), uscita (rosso), ore ordinarie, straordinari (arancione), costo. Evidenziazione weekend e giorni con straordinari. Export Excel, invio email, stampa.",
      },
      {
        title: "Organigramma",
        content: "Visualizzazione gerarchica dell'organizzazione con struttura ad albero espandibile, colori per ruolo, distribuzione reparti.",
      },
      {
        title: "Portale Dipendenti",
        content: "Accesso autonomo per collaboratori con login biometrico (WebAuthn), timbratura personale, richieste ferie, visualizzazione cedolini.",
      }
    ]
  },
  {
    id: "social-marketing",
    name: "Social & Marketing",
    icon: "Share2",
    description: "Gestione social media, campagne marketing, contenuti e Google Business Profile.",
    sections: [
      {
        title: "Panoramica",
        content: "Modulo completo per gestione social media e marketing con 5 sezioni: Calendario, Campagne, Contenuti, Analytics e Google Business.",
      },
      {
        title: "Calendario Social",
        content: "Vista mensile e settimanale per pianificare post su tutte le piattaforme. Drag-and-drop per spostare contenuti, vista rapida dei post programmati.",
      },
      {
        title: "Campagne",
        content: "Gestione campagne marketing con budget, target audience, KPI, calcolo ROI, supporto multi-canale. Stati: bozza, attiva, in pausa, completata.",
      },
      {
        title: "Contenuti",
        content: "Libreria contenuti social per post, stories, reels, video. Impostazioni specifiche per piattaforma: YouTube, Instagram, Facebook, LinkedIn, Twitter, TikTok.",
      },
      {
        title: "Analytics",
        content: "Dashboard con metriche: follower, engagement, reach per piattaforma. Tracking performance campagne con grafici temporali.",
      },
      {
        title: "Google Business",
        content: "Gestione Google Business Profile: registrazione account, monitoraggio e risposta recensioni, creazione post, statistiche (visualizzazioni, chiamate, indicazioni, click sito web).",
      }
    ]
  },
  {
    id: "novita",
    name: "Novità v5.0",
    icon: "Lightbulb",
    description: "Tutte le nuove funzionalità della versione 5.0 di PULSE ERP.",
    sections: [
      {
        title: "HR Manager Completo",
        content: "Nuovo modulo HR con gestione presenze GPS, turni con regole configurabili, ferie con workflow approvazione, straordinari, scadenzario, organigramma, portale dipendenti con autenticazione biometrica.",
      },
      {
        title: "Social & Marketing",
        content: "Modulo social media con calendario editoriale, gestione campagne con ROI, libreria contenuti, analytics per piattaforma, integrazione Google Business Profile.",
      },
      {
        title: "Report Cedolini Avanzato",
        content: "Report timbrature per consulente paghe con tabella stile fatture: entrata in verde, uscita in rosso, evidenziazione straordinari con bordo arancione, legenda colori, export Excel e stampa.",
      },
      {
        title: "Autenticazione Biometrica",
        content: "Login con Touch ID, Face ID, Windows Hello o impronta digitale tramite WebAuthn per il portale dipendenti.",
      },
      {
        title: "Finanza Tab Verticali",
        content: "Nuova interfaccia Finanza con icone grandi sopra e testo sotto, 12 tab organizzati in griglia responsive.",
      },
      {
        title: "Validazione IBAN Fornitori",
        content: "Controllo duplicati IBAN in tempo reale durante inserimento fornitori con alert automatico.",
      },
      {
        title: "Visualizzazione Montagna",
        content: "Visualizzazione grafica del progresso progetti con montagna a tier colorati. Ogni tier rappresenta un'attività, le etichette sono posizionate a destra della montagna allineate ai tier.",
      },
      {
        title: "Modulo CRM Completo",
        content: "CRM per gestione lead, pipeline opportunità con Kanban, storico interazioni, conversione lead in clienti e dashboard KPI.",
      },
      {
        title: "Produzione e Magazzino",
        content: "Gestione magazzino con codici articolo auto-generati, spedizioni con tracciamento, workflow corriere mobile, firma digitale su consegna, mappa consegne.",
      },
      {
        title: "Portale Clienti",
        content: "Area pubblica per clienti con accesso via token, visualizzazione fatture e preventivi, listino pubblico, tracciamento accessi.",
      },
      {
        title: "Interfaccia Grafica Unificata",
        content: "Design moderno con header gradiente grigio uniforme in tutti i moduli, icone stilizzate, layout responsive ottimizzato.",
      },
      {
        title: "Permessi Granulari",
        content: "Sistema permessi migliorato con controllo per modulo (Visualizza, Crea, Modifica, Elimina) configurabile per ruolo e singolo utente.",
      }
    ]
  }
];

export function searchManual(query: string): ManualModule[] {
  if (!query.trim()) return manualContent;
  
  const lowerQuery = query.toLowerCase();
  return manualContent.filter(module => 
    module.name.toLowerCase().includes(lowerQuery) ||
    module.description.toLowerCase().includes(lowerQuery) ||
    module.sections.some(section => 
      section.title.toLowerCase().includes(lowerQuery) ||
      section.content.toLowerCase().includes(lowerQuery)
    )
  );
}
