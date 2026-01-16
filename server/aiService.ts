import OpenAI from "openai";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = (process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY)
  ? new OpenAI({
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY
  })
  : null;

const DEFAULT_MODEL = "gpt-4o-mini";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function chatWithAI(
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<string> {
  if (!openai) {
    return "Servizio AI non disponibile. Configura OPENAI_API_KEY per abilitare questa funzionalità.";
  }
  try {
    const allMessages: ChatMessage[] = [];

    if (systemPrompt) {
      allMessages.push({ role: "system", content: systemPrompt });
    }

    allMessages.push(...messages);

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: allMessages,
      max_completion_tokens: 2048,
    });

    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("chatWithAI error:", error);
    return "Mi dispiace, si è verificato un errore temporaneo. Riprova tra qualche momento.";
  }
}

export async function generateTasksFromGoal(goal: string, projectContext?: string): Promise<{
  tasks: Array<{ title: string; priority: string; estimatedHours?: number }>;
}> {
  if (!openai) return { tasks: [] };
  try {
    const systemPrompt = `Sei un assistente di project management esperto. Genera una lista di attività concrete e actionable per raggiungere l'obiettivo specificato.
Rispondi SOLO con JSON valido nel seguente formato:
{
  "tasks": [
    { "title": "Titolo attività", "priority": "high|medium|low", "estimatedHours": numero }
  ]
}`;

    const userPrompt = projectContext
      ? `Obiettivo: ${goal}\n\nContesto del progetto: ${projectContext}`
      : `Obiettivo: ${goal}`;

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    });

    const content = response.choices[0]?.message?.content || '{"tasks": []}';
    try {
      return JSON.parse(content);
    } catch {
      return { tasks: [] };
    }
  } catch (error) {
    console.error("generateTasksFromGoal error:", error);
    return { tasks: [] };
  }
}

export async function summarizeDocument(content: string, title?: string): Promise<string> {
  try {
    const systemPrompt = `Sei un assistente che crea riassunti chiari e ben strutturati di documenti.
Genera un riassunto formattato in Markdown con questa struttura:

## 📋 Panoramica
[Breve descrizione del documento in 2-3 frasi]

## 🔑 Punti Chiave
- Punto 1
- Punto 2
- Punto 3

## 📌 Informazioni Importanti
[Dettagli rilevanti, numeri, date, nomi]

## ✅ Azioni Richieste
- [ ] Azione 1
- [ ] Azione 2

Usa sempre il formato Markdown con emoji per le intestazioni delle sezioni.
Sii conciso ma completo. Se non ci sono azioni richieste, ometti quella sezione.`;

    const userPrompt = title
      ? `Titolo documento: ${title}\n\nContenuto:\n${content}`
      : `Contenuto documento:\n${content}`;

    const result = await chatWithAI([{ role: "user", content: userPrompt }], systemPrompt);
    return result || "Impossibile generare il riassunto. Riprova.";
  } catch {
    return "Errore durante la generazione del riassunto. Riprova più tardi.";
  }
}

export async function analyzeEmail(emailContent: string, subject: string, from: string): Promise<{
  summary: string;
  priority: string;
  suggestedActions: string[];
  sentiment: string;
}> {
  if (!openai) return { summary: "AI non disponibile", priority: "medium", suggestedActions: [], sentiment: "neutral" };
  try {
    const systemPrompt = `Sei un assistente che analizza email aziendali.
Analizza l'email e rispondi SOLO con JSON valido nel seguente formato:
{
  "summary": "Breve riassunto dell'email",
  "priority": "high|medium|low",
  "suggestedActions": ["Azione 1", "Azione 2"],
  "sentiment": "positive|neutral|negative"
}`;

    const userPrompt = `Da: ${from || "Sconosciuto"}\nOggetto: ${subject || "Nessun oggetto"}\n\nContenuto:\n${emailContent}`;

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1024,
    });

    const content = response.choices[0]?.message?.content || '{}';
    try {
      return JSON.parse(content);
    } catch {
      return { summary: "", priority: "medium", suggestedActions: [], sentiment: "neutral" };
    }
  } catch (error) {
    console.error("analyzeEmail error:", error);
    return { summary: "Errore nell'analisi dell'email", priority: "medium", suggestedActions: [], sentiment: "neutral" };
  }
}

export async function generateProjectReport(project: {
  title: string;
  status: string;
  tasks: Array<{ title: string; done: boolean; priority?: string }>;
  teamMembers?: string[];
  dueDate?: string;
}): Promise<string> {
  try {
    const systemPrompt = `Sei un assistente che genera report professionali sui progetti.
Crea un report dettagliato in italiano che includa:
- Stato generale del progetto
- Progressi raggiunti
- Attività completate e in sospeso
- Rischi o problemi potenziali
- Raccomandazioni per procedere`;

    const completedTasks = project.tasks.filter(t => t.done).length;
    const totalTasks = project.tasks.length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const userPrompt = `Progetto: ${project.title}
Stato: ${project.status}
Progresso: ${progress}% (${completedTasks}/${totalTasks} attività completate)
Scadenza: ${project.dueDate || "Non definita"}
Team: ${project.teamMembers?.join(", ") || "Non assegnato"}

Attività:
${project.tasks.map(t => `- [${t.done ? "✓" : " "}] ${t.title} (${t.priority || "medium"})`).join("\n")}`;

    const result = await chatWithAI([{ role: "user", content: userPrompt }], systemPrompt);
    return result || "Impossibile generare il report. Riprova.";
  } catch {
    return "Errore durante la generazione del report. Riprova più tardi.";
  }
}

export async function analyzeChatAndRespond(
  messages: Array<{ content: string; senderId: string; senderName: string; createdAt: string }>,
  userQuestion: string,
  channelName?: string,
  aiConversationHistory?: Array<{ role: 'user' | 'ai'; content: string }>
): Promise<string> {
  try {
    const systemPrompt = `Sei PULSE AI, un assistente intelligente integrato nella chat di PULSE ERP.
Il tuo ruolo è:
- Analizzare le conversazioni della chat
- Rispondere alle domande degli utenti basandoti sul contesto della conversazione
- Fornire riassunti delle discussioni
- Suggerire azioni o soluzioni
- Aiutare a organizzare le informazioni discusse

Rispondi sempre in italiano, in modo professionale ma amichevole.
Se la domanda non è chiara o non hai abbastanza contesto, chiedi chiarimenti.
Formatta le risposte in modo leggibile usando markdown quando appropriato.
Mantieni il contesto delle domande precedenti nella conversazione con te.`;

    const conversationContext = messages.length > 0
      ? `Conversazione nel canale "${channelName || 'Chat'}":\n${messages.map(m =>
        `[${m.senderName}]: ${m.content}`
      ).join('\n')}`
      : "Nessun messaggio precedente nella conversazione.";

    // Costruisci i messaggi includendo lo storico della conversazione AI
    const aiMessages: ChatMessage[] = [];

    // Aggiungi il contesto della chat del canale come primo messaggio
    aiMessages.push({ role: "user", content: `Contesto del canale:\n${conversationContext}` });
    aiMessages.push({ role: "assistant", content: "Ho compreso il contesto della conversazione nel canale. Come posso aiutarti?" });

    // Aggiungi lo storico della conversazione AI precedente
    if (aiConversationHistory && aiConversationHistory.length > 0) {
      for (const msg of aiConversationHistory) {
        aiMessages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      }
    }

    // Aggiungi la nuova domanda
    aiMessages.push({ role: "user", content: userQuestion });

    const result = await chatWithAI(aiMessages, systemPrompt);
    return result || "Non sono riuscito a elaborare la richiesta. Riprova.";
  } catch (error) {
    console.error("analyzeChatAndRespond error:", error);
    return "Si è verificato un errore durante l'analisi. Riprova tra qualche momento.";
  }
}

export async function generateEmailWiki(emails: Array<{
  id: string;
  subject: string;
  from: string;
  to: string;
  body: string;
  date: string;
  isIncoming: boolean;
}>, contactEmail: string, contactName: string): Promise<{
  summary: string;
  timeline: Array<{ date: string; subject: string; summary: string; direction: string }>;
  topics: string[];
  keyPoints: string[];
  chronology: Array<{ date: string; dateFormatted: string; from: string; to: string; subject: string; body: string; direction: string }>;
}> {
  if (!openai) return { summary: "AI non disponibile", timeline: [], topics: [], keyPoints: [], chronology: [] };
  try {
    const systemPrompt = `Sei un assistente esperto nell'analisi di corrispondenza email aziendale.
Il tuo compito è creare una "Wikipedia" completa della corrispondenza con un contatto specifico.

REGOLE DI FORMATTAZIONE OBBLIGATORIE:
- Scrivi testo pulito e ben impaginato
- RIMUOVI tutti gli spazi inutili e le righe vuote in eccesso
- NON inserire spazi multipli consecutivi
- Usa un solo a capo tra paragrafi, mai più di uno
- Scrivi frasi complete e ben strutturate
- Evita ripetizioni e ridondanze
- Il testo deve essere leggibile come un libro

Analizza tutte le email fornite e genera:
1. Un riassunto generale della relazione/corrispondenza con questo contatto
2. Una timeline cronologica delle comunicazioni più importanti
3. I temi principali discussi
4. I punti chiave e le decisioni prese

Rispondi SOLO con JSON valido nel seguente formato:
{
  "summary": "Riassunto completo e ben formattato della corrispondenza (2-3 paragrafi dettagliati, testo pulito senza spazi inutili)",
  "timeline": [
    { "date": "YYYY-MM-DD", "subject": "Oggetto email", "summary": "Breve riassunto", "direction": "incoming|outgoing" }
  ],
  "topics": ["Tema 1", "Tema 2"],
  "keyPoints": ["Punto chiave 1", "Decisione importante 2"]
}

Ordina la timeline dalla più recente alla più vecchia.
Limita la timeline ai 20 scambi più significativi.
Scrivi tutto in italiano con formattazione impeccabile.`;

    const emailsText = emails.map(e =>
      `[${e.date}] ${e.isIncoming ? '📥 RICEVUTA' : '📤 INVIATA'}
Da: ${e.from}
A: ${e.to}
Oggetto: ${e.subject}
---
${e.body?.substring(0, 500) || 'Nessun contenuto'}
---`
    ).join('\n\n');

    const userPrompt = `Contatto: ${contactName} <${contactEmail}>
Numero totale email: ${emails.length}

CORRISPONDENZA COMPLETA:
${emailsText}`;

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 4096,
    });

    const content = response.choices[0]?.message?.content || '{}';

    // Crea la cronologia completa con testo integrale delle email
    const sortedEmails = [...emails].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB; // Ordine cronologico (dalla più vecchia alla più recente)
    });

    const chronology = sortedEmails.map(e => {
      // Formatta la data in italiano
      let dateFormatted = e.date;
      try {
        const d = new Date(e.date);
        if (!isNaN(d.getTime())) {
          const day = d.getDate().toString().padStart(2, '0');
          const month = (d.getMonth() + 1).toString().padStart(2, '0');
          const year = d.getFullYear();
          const hours = d.getHours().toString().padStart(2, '0');
          const minutes = d.getMinutes().toString().padStart(2, '0');
          dateFormatted = `${day}/${month}/${year} ${hours}:${minutes}`;
        }
      } catch { }

      // Pulisci il corpo dell'email da HTML preservando la formattazione
      let cleanBody = e.body || '';

      // Converti tag HTML di formattazione in newline
      cleanBody = cleanBody.replace(/<br\s*\/?>/gi, '\n');
      cleanBody = cleanBody.replace(/<\/p>/gi, '\n\n');
      cleanBody = cleanBody.replace(/<\/div>/gi, '\n');
      cleanBody = cleanBody.replace(/<\/li>/gi, '\n');
      cleanBody = cleanBody.replace(/<\/tr>/gi, '\n');
      cleanBody = cleanBody.replace(/<hr\s*\/?>/gi, '\n────────────────\n');

      // Rimuovi tutti gli altri tag HTML
      cleanBody = cleanBody.replace(/<[^>]*>/g, '');

      // Rimuovi entità HTML
      cleanBody = cleanBody.replace(/&nbsp;/g, ' ');
      cleanBody = cleanBody.replace(/&amp;/g, '&');
      cleanBody = cleanBody.replace(/&lt;/g, '<');
      cleanBody = cleanBody.replace(/&gt;/g, '>');
      cleanBody = cleanBody.replace(/&quot;/g, '"');
      cleanBody = cleanBody.replace(/&#39;/g, "'");
      cleanBody = cleanBody.replace(/&apos;/g, "'");

      // ===== RIMUOVI FIRME, DISCLAIMER E FOOTER INUTILI =====

      // Rimuovi disclaimer di confidenzialità (multilingue)
      cleanBody = cleanBody.replace(/AVVISO[\s\S]*?conseguenze\.?/gi, '');
      cleanBody = cleanBody.replace(/Confidentiality notice[\s\S]*?manner\.?/gi, '');
      cleanBody = cleanBody.replace(/This e-mail transmission[\s\S]*?manner\.?/gi, '');
      cleanBody = cleanBody.replace(/Please do not read it if you are not[\s\S]*?saving it in any manner\.?/gi, '');

      // Rimuovi informazioni bancarie/legali (Albo, Registro Imprese, P.IVA, etc.)
      cleanBody = cleanBody.replace(/Iscritt[ao] all['']Albo[\s\S]*?(?=\n\n|\n[A-Z]|$)/gi, '');
      cleanBody = cleanBody.replace(/Aderente al (?:Gruppo|Fondo)[\s\S]*?(?=\n\n|\n[A-Z]|$)/gi, '');
      cleanBody = cleanBody.replace(/Iscrizione al Registro delle Imprese[\s\S]*?(?=\n\n|\n[A-Z]|$)/gi, '');
      cleanBody = cleanBody.replace(/Società partecipante al Gruppo IVA[\s\S]*?(?=\n\n|\n[A-Z]|$)/gi, '');
      cleanBody = cleanBody.replace(/Soggett[ao] all['']attività di direzione[\s\S]*?(?=\n\n|\n[A-Z]|$)/gi, '');

      // Rimuovi linee di separazione lunghe (---- o ==== o ____)
      cleanBody = cleanBody.replace(/[-=_]{20,}/g, '');

      // Rimuovi URL e indirizzi email nelle firme
      cleanBody = cleanBody.replace(/Sito web:\s*\n?www\.[^\s]+/gi, '');
      cleanBody = cleanBody.replace(/E-mail:\s*\n?[^\s@]+@[^\s]+/gi, '');
      cleanBody = cleanBody.replace(/PEC:\s*\n?[^\s@]+@[^\s]+/gi, '');

      // Rimuovi codici fiscali e P.IVA isolati
      cleanBody = cleanBody.replace(/(?:Codice Fiscale|C\.F\.|P\.IVA|Partita IVA)[:\s]*[\d\w]+/gi, '');

      // Rimuovi "Cordiali saluti" e varianti seguite da firme
      cleanBody = cleanBody.replace(/(?:Cordiali saluti|Distinti saluti|Saluti|Cordialmente|Best regards|Kind regards)[,.]?\s*\n+[A-Z][a-zA-Z\s]+(?:\n|$)/gi, '');

      // ===== FINE PULIZIA FIRME =====

      // Rimuovi solo spazi multipli orizzontali (preserva newline)
      cleanBody = cleanBody.replace(/[ \t]+/g, ' ');
      // Riduci newline multipli a massimo 2
      cleanBody = cleanBody.replace(/\n{3,}/g, '\n\n');
      // Rimuovi spazi a inizio/fine riga
      cleanBody = cleanBody.split('\n').map(line => line.trim()).join('\n');
      cleanBody = cleanBody.trim();

      // Limita a 8000 caratteri per email (più generoso)
      if (cleanBody.length > 8000) {
        cleanBody = cleanBody.substring(0, 8000) + '\n\n[... contenuto troncato per lunghezza ...]';
      }

      return {
        date: e.date,
        dateFormatted,
        from: e.from,
        to: e.to,
        subject: e.subject || '(Nessun oggetto)',
        body: cleanBody || '(Nessun contenuto)',
        direction: e.isIncoming ? 'incoming' : 'outgoing'
      };
    });

    try {
      const result = JSON.parse(content);

      // Funzione per pulire e formattare il testo
      const cleanText = (text: string): string => {
        if (!text) return text;
        return text
          // Rimuovi spazi multipli
          .replace(/[ \t]+/g, ' ')
          // Rimuovi righe vuote multiple (max 1 riga vuota)
          .replace(/\n{3,}/g, '\n\n')
          // Rimuovi spazi a inizio/fine riga
          .split('\n').map(line => line.trim()).join('\n')
          // Rimuovi spazi prima della punteggiatura
          .replace(/\s+([.,;:!?])/g, '$1')
          // Rimuovi spazi multipli dopo punteggiatura
          .replace(/([.,;:!?])\s+/g, '$1 ')
          // Trim finale
          .trim();
      };

      return {
        summary: cleanText(result.summary) || "Nessun riassunto disponibile",
        timeline: result.timeline || [],
        topics: result.topics || [],
        keyPoints: (result.keyPoints || []).map((kp: string) => cleanText(kp)),
        chronology
      };
    } catch {
      return {
        summary: "Errore nel parsing della risposta AI",
        timeline: [],
        topics: [],
        keyPoints: [],
        chronology
      };
    }
  } catch (error) {
    console.error("generateEmailWiki error:", error);
    return {
      summary: "Errore durante la generazione del wiki",
      timeline: [],
      topics: [],
      keyPoints: [],
      chronology: []
    };
  }
}

export async function textToSpeech(text: string, voice: string = "alloy"): Promise<Buffer> {
  if (!openai) throw new Error("Servizio AI non disponibile");
  try {
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
      input: text,
    });

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("textToSpeech error:", error);
    throw new Error("Errore nella generazione dell'audio");
  }
}

export async function getSuggestions(context: {
  recentTasks?: Array<{ title: string; done: boolean }>;
  upcomingDeadlines?: Array<{ title: string; dueDate: string }>;
  projectStatus?: string;
}): Promise<string[]> {
  if (!openai) return [];
  try {
    const systemPrompt = `Sei un assistente di produttività intelligente.
Basandoti sul contesto fornito, suggerisci 3-5 azioni concrete che l'utente potrebbe fare per migliorare la produttività.
Rispondi SOLO con JSON valido nel seguente formato:
{
  "suggestions": ["Suggerimento 1", "Suggerimento 2", "Suggerimento 3"]
}`;

    const hasContext = context.recentTasks?.length || context.upcomingDeadlines?.length || context.projectStatus;

    const userPrompt = hasContext ? `Contesto attuale:
${context.recentTasks?.length ? `Attività recenti: ${context.recentTasks.map(t => `${t.title} (${t.done ? "completata" : "in corso"})`).join(", ")}` : "Nessuna attività recente"}
${context.upcomingDeadlines?.length ? `Scadenze imminenti: ${context.upcomingDeadlines.map(d => `${d.title} - ${d.dueDate}`).join(", ")}` : "Nessuna scadenza imminente"}
${context.projectStatus ? `Stato progetti: ${context.projectStatus}` : "Nessun progetto attivo"}` : "Non ci sono attività o progetti. Suggerisci come iniziare a organizzare il lavoro.";

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1024,
    });

    const content = response.choices[0]?.message?.content || '{"suggestions": []}';
    try {
      const result = JSON.parse(content);
      return result.suggestions || [];
    } catch {
      return [];
    }
  } catch (error) {
    console.error("getSuggestions error:", error);
    return [];
  }
}

export async function parseCedolino(textContent: string): Promise<{
  nome?: string;
  cognome?: string;
  codiceFiscale?: string;
  indirizzo?: string;
  citta?: string;
  cap?: string;
  provincia?: string;
  ccnl?: string;
  livelloContrattuale?: string;
  oreSettimanali?: string;
  percentualePartTime?: string;
  ralAnnua?: string;
  superminimo?: string;
  indennitaMensile?: string;
  contributiInps?: string;
  iban?: string;
  dataAssunzione?: string;
  tipoContratto?: string;
}> {
  if (!openai) return {};
  try {
    const systemPrompt = `Sei un assistente esperto nell'analisi di buste paga (cedolini) italiane.
Estrai tutte le informazioni rilevanti dal cedolino fornito.

Rispondi SOLO con JSON valido nel seguente formato:
{
  "nome": "Nome del dipendente",
  "cognome": "Cognome del dipendente",
  "codiceFiscale": "Codice fiscale (16 caratteri)",
  "indirizzo": "Via e numero civico",
  "citta": "Città di residenza",
  "cap": "CAP",
  "provincia": "Sigla provincia (2 lettere)",
  "ccnl": "Tipo di contratto collettivo (es: Commercio, Metalmeccanico)",
  "livelloContrattuale": "Livello contrattuale (es: 3, 4, 5S)",
  "oreSettimanali": "Ore settimanali (es: 40)",
  "percentualePartTime": "Percentuale part-time (100 se full-time)",
  "ralAnnua": "RAL annua lorda stimata",
  "superminimo": "Importo superminimo mensile",
  "indennitaMensile": "Eventuali indennità mensili",
  "contributiInps": "Percentuale contributi INPS dipendente",
  "iban": "IBAN per accredito stipendio",
  "dataAssunzione": "Data assunzione (formato YYYY-MM-DD)",
  "tipoContratto": "Tipo contratto (Indeterminato, Determinato, ecc)"
}

Estrai solo i dati che riesci a trovare nel documento.
Per i campi non trovati, usa stringa vuota "".
Per la RAL, se non indicata esplicitamente, calcola moltiplicando lo stipendio lordo mensile x 13 o 14 mensilità.`;

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analizza questo cedolino:\n\n${textContent}` }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    });

    const content = response.choices[0]?.message?.content || '{}';
    try {
      return JSON.parse(content);
    } catch {
      return {};
    }
  } catch (error) {
    console.error("parseCedolino error:", error);
    return {};
  }
}

export async function extractTaskFromEmail(emailBody: string, subject: string): Promise<{
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  dueDate: string | null;
}> {
  if (!openai) return { title: subject, description: "", priority: "medium", dueDate: null };
  try {
    const systemPrompt = `Sei un assistente che estrae attività (task) dalle email.
Analizza l'email e genera un task strutturato.
Rispondi SOLO con JSON valido nel seguente formato:
{
  "title": "Titolo breve e azionabile del task (es: 'Pagare fattura X', 'Rispondere a cliente Y')",
  "description": "Descrizione sintetica basata sul contenuto",
  "priority": "low|medium|high",
  "dueDate": "YYYY-MM-DD" (solo se menzionata esplicitamente o deducibile con certezza, altrimenti null)
}`;

    const userPrompt = `Oggetto: ${subject}\n\nCorpo:\n${emailBody}`;

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 512,
    });

    const content = response.choices[0]?.message?.content || '{}';
    try {
      const result = JSON.parse(content);
      return {
        title: result.title || subject,
        description: result.description || "",
        priority: ["low", "medium", "high"].includes(result.priority) ? result.priority : "medium",
        dueDate: result.dueDate || null
      };
    } catch {
      return { title: subject, description: "", priority: "medium", dueDate: null };
    }
  } catch (error) {
    console.error("extractTaskFromEmail error:", error);
    return { title: subject, description: "", priority: "medium", dueDate: null };
  }
}
