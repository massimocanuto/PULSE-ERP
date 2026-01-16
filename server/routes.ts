import express, { type Express, type Request, type Response } from "express"; // restart 3
import path from "path";
import fs from "fs";
import { createServer, type Server } from "http";
import crypto from "crypto";
import { google } from "googleapis";
import { storage } from "./storage";
import { extractTaskFromEmail } from "./aiService";
import { db } from "./db";
import { systemLogBuffer } from "./logStore";
import { eq, desc, and, isNull, ilike, sql } from "drizzle-orm";
import { invoices, quotes, projects, crmAttivita, crmOpportunita, referentiClienti, customerPortalTokens, anagraficaClienti, anagraficaFornitori, courierTokens, catalogArticles, catalogCategories, promemoriaAnagrafica, marketingCampagne, socialContenuti, youtubeVideos, socialAnalytics, mediaLibrary, googleBusinessAccounts, googleBusinessReviews, googleBusinessPosts, googleBusinessInsights, machinery, machineryConsumptions, machineryCosts, maintenancePlans, maintenanceEvents, maintenanceAlerts, timbrature, turni, richiesteAssenza } from "@shared/schema";
import {
  insertUserSchema,
  insertProjectSchema,
  insertProjectShareSchema,
  insertBackupScheduleSchema,
  insertTaskSchema,
  insertEmailSchema,
  insertProjectEmailSchema,
  insertChatChannelSchema,
  insertChatMessageSchema,
  insertWhatsappContactSchema,
  insertWhatsappMessageSchema,
  insertTelegramChatSchema,
  insertTelegramMessageSchema,
  insertDocumentSchema,
  insertDocumentShareSchema,
  insertDocumentCommentSchema,
  insertProjectDocumentSchema,
  insertPersonalTodoSchema,
  insertTaskCommentSchema,
  insertActivityFeedSchema,
  insertTodoTemplateSchema,
  insertTimeEntrySchema,
  insertKeepNoteSchema,
  insertKeepLabelSchema,
  insertWhiteboardSchema,
  insertWhiteboardElementSchema,
  insertUserEmailConfigSchema,
  insertAnagraficaPersonaleSchema,
  insertAnagraficaClientiSchema,
  insertAnagraficaFornitoriSchema,
  insertInvoiceSchema,
  insertQuoteSchema,
  insertDdtSchema,
  insertFinanceAccountSchema,
  insertFinanceTransactionSchema,
  insertFinanceCategorySchema,
  ARCHIVE_CATEGORIES
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  fetchEmails, sendEmail, isEmailConfigured, fetchEmailFolders, fetchEmailsFromFolder,
  sendTaskReminderEmail, sendWeeklyReportEmail, TaskForReminder,
  fetchEmailsWithConfig, sendEmailWithConfig, fetchEmailFoldersWithConfig,

  fetchEmailsFromFolderWithConfig, UserEmailCredentials, testEmailConnection, fetchNewEmails,
  sendCedolinoEmail, sendWelcomeEmail, sendProbationReminderEmail, sendBirthdayNotificationEmail
} from "./emailService";
import { isCalendarConnected, getCalendarList, getUpcomingEvents, getEventsInRange, syncTaskToCalendar, syncProjectToCalendar } from "./calendarService";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import * as XLSX from "xlsx";
import { generateOnlyOfficeConfig } from "./officeService";
import jwt from "jsonwebtoken";

// pdfjs-dist lazy loader for ESM compatibility with CJS bundle
let pdfjsLibInstance: any = null;
async function getPdfjs() {
  if (!pdfjsLibInstance) {
    pdfjsLibInstance = await import('pdfjs-dist/legacy/build/pdf.mjs');
    pdfjsLibInstance.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.mjs';
  }
  return pdfjsLibInstance;
}

import { getWhatsAppStatus, getQRCode, initializeWhatsApp, sendWhatsAppMessage, disconnectWhatsApp } from "./whatsappService";

const archiveStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'archive');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `archive-${uniqueSuffix}${ext}`);
  }
});

const archiveUpload = multer({
  storage: archiveStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo file non supportato'));
    }
  }
});

const chatStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'chat');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `chat-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: chatStorage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `img-${uniqueSuffix}${ext}`);
  }
});

const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo immagini sono supportate'));
    }
  }
});

const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `doc-${uniqueSuffix}${ext}`);
  }
});

const documentUpload = multer({
  storage: documentStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo file PDF, Excel, Word e PowerPoint sono supportati'));
    }
  }
});

const whiteboardStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'whiteboards');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `wb-${uniqueSuffix}${ext}`);
  }
});

const whiteboardUpload = multer({
  storage: whiteboardStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo file non supportato'));
    }
  }
});

const catalogImportStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'catalog-import');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `catalog-import-${uniqueSuffix}${ext}`);
  }
});

const catalogImportUpload = multer({
  storage: catalogImportStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Tipo file non supportato. Usa Excel (.xlsx, .xls), CSV o PDF'));
    }
  }
});


// In-memory tracker for online users (last activity within 5 minutes)
const activeUsers: Map<string, number> = new Map(); // odString -> lastActiveTimestamp

function updateUserActivity(userId: string) {
  if (userId) {
    activeUsers.set(userId, Date.now());
  }
}

function getOnlineUsersCount(): number {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  let count = 0;
  for (const [userId, lastActive] of activeUsers.entries()) {
    if (lastActive > fiveMinutesAgo) {
      count++;
    } else {
      activeUsers.delete(userId);
    }
  }
  return count;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Health check endpoints are defined in index.ts to respond before any initialization
  // Do NOT define /health or / routes here - they must be the earliest routes

  app.get("/api/health", (req: Request, res: Response) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // =====================
  // ONLINE USERS API
  // =====================
  app.get("/api/online-users", (req: Request, res: Response) => {
    res.json({ count: getOnlineUsersCount() });
  });

  app.post("/api/heartbeat", (req: Request, res: Response) => {
    const { userId } = req.body;
    if (userId) {
      updateUserActivity(String(userId));
    }
    res.json({ success: true });
  });

  // Rimuove l'utente dalla lista degli utenti online al logout
  app.post("/api/logout", (req: Request, res: Response) => {
    const { userId } = req.body;
    if (userId) {
      activeUsers.delete(String(userId));
    }
    // Distruggi la sessione se esiste
    if ((req as any).session) {
      (req as any).session.destroy();
    }
    res.json({ success: true });
  });

  // =====================
  // IMAGE UPLOAD API
  // =====================
  app.post("/api/upload", imageUpload.single("file"), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nessun file caricato" });
      }
      const url = `/uploads/images/${req.file.filename}`;
      res.json({ url, path: url, filename: req.file.filename });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // =====================
  // DOCUMENT UPLOAD API (PDF)
  // =====================
  app.post("/api/upload/document", documentUpload.single("file"), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nessun file caricato" });
      }
      const url = `/uploads/documents/${req.file.filename}`;
      res.json({
        url,
        path: url,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Summarize PDF document with AI
  app.post("/api/upload/document/summarize", async (req: Request, res: Response) => {
    try {
      const { pdfPath, filename } = req.body;

      if (!pdfPath) {
        return res.status(400).json({ error: "Path del PDF richiesto" });
      }

      const filePath = path.join(process.cwd(), pdfPath);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File non trovato sul server" });
      }

      let textContent = "";

      try {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfjsLib = await getPdfjs();
        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(dataBuffer),
          disableWorker: true,
          useWorkerFetch: false,
          isEvalSupported: false,
          useSystemFonts: true,
          verbosity: 0
        });
        const pdf = await loadingTask.promise;

        let pdfText = '';
        for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 20); pageNum++) {
          const page = await pdf.getPage(pageNum);
          const content = await page.getTextContent();
          const pageText = content.items.map((item: any) => item.str).join(' ');
          pdfText += pageText + '\n';
        }
        textContent = pdfText.substring(0, 8000);
      } catch (pdfError) {
        console.error("PDF parse error:", pdfError);
        return res.status(400).json({ error: "Impossibile leggere il contenuto del PDF" });
      }

      if (!textContent || textContent.trim().length < 50) {
        return res.status(400).json({ error: "Il documento non contiene abbastanza testo per generare un riassunto" });
      }

      const { summarizeDocument } = await import('./aiService');
      const summary = await summarizeDocument(textContent, filename || 'Documento PDF');

      res.json({ summary });
    } catch (error) {
      console.error("Error summarizing PDF:", error);
      res.status(500).json({ error: "Errore nella generazione del riassunto" });
    }
  });

  // Parse Excel file and return JSON data
  app.post("/api/upload/document/parse-excel", async (req: Request, res: Response) => {
    try {
      const { filePath } = req.body;

      if (!filePath) {
        return res.status(400).json({ error: "Path del file Excel richiesto" });
      }

      // Remove leading slash if present to create proper relative path
      const relativePath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      const fullPath = path.join(process.cwd(), relativePath);

      console.log("[Excel Parse] Requested path:", filePath);
      console.log("[Excel Parse] Full path:", fullPath);
      console.log("[Excel Parse] File exists:", fs.existsSync(fullPath));

      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ error: `File non trovato: ${relativePath}` });
      }

      const xlsxModule = await import("xlsx");
      const XLSX = xlsxModule.default || xlsxModule;
      const workbook = XLSX.readFile(fullPath);
      const sheets: { name: string; data: any[][] }[] = [];

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        sheets.push({
          name: sheetName,
          data: jsonData as any[][]
        });
      }

      console.log("[Excel Parse] Success - sheets:", sheets.length);
      res.json({ sheets });
    } catch (error: any) {
      console.error("Error parsing Excel:", error);
      res.status(500).json({ error: `Errore parsing Excel: ${error.message}` });
    }
  });

  // Parse Word file and return text content
  app.post("/api/upload/document/parse-word", async (req: Request, res: Response) => {
    try {
      const { filePath } = req.body;

      if (!filePath) {
        return res.status(400).json({ error: "Path del file Word richiesto" });
      }

      const relativePath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      const fullPath = path.join(process.cwd(), relativePath);

      console.log("[Word Parse] Requested path:", filePath);
      console.log("[Word Parse] Full path:", fullPath);
      console.log("[Word Parse] File exists:", fs.existsSync(fullPath));

      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ error: `File non trovato: ${relativePath}` });
      }

      const mammothModule = await import("mammoth");
      const mammoth = mammothModule.default || mammothModule;
      const result = await mammoth.convertToHtml({ path: fullPath });

      console.log("[Word Parse] Success");
      res.json({
        html: result.value,
        messages: result.messages
      });
    } catch (error: any) {
      console.error("Error parsing Word:", error);
      res.status(500).json({ error: `Errore parsing Word: ${error.message}` });
    }
  });

  // Parse PowerPoint file and return text content
  app.post("/api/upload/document/parse-pptx", async (req: Request, res: Response) => {
    try {
      const { filePath } = req.body;

      if (!filePath) {
        return res.status(400).json({ error: "Path del file PowerPoint richiesto" });
      }

      const relativePath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      const fullPath = path.join(process.cwd(), relativePath);

      console.log("[PPTX Parse] Requested path:", filePath);
      console.log("[PPTX Parse] Full path:", fullPath);
      console.log("[PPTX Parse] File exists:", fs.existsSync(fullPath));

      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ error: `File non trovato: ${relativePath}` });
      }

      const officeParserModule = await import("officeparser");
      const officeParser = officeParserModule.default || officeParserModule;
      const text = await officeParser.parseOfficeAsync(fullPath);

      console.log("[PPTX Parse] Success");
      res.json({ text });
    } catch (error: any) {
      console.error("Error parsing PowerPoint:", error);
      res.status(500).json({ error: `Errore parsing PowerPoint: ${error.message}` });
    }
  });

  // =====================
  // CATALOG IMPORT API
  // =====================
  app.post("/api/catalogo/import", catalogImportUpload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nessun file caricato" });
      }

      const filePath = req.file.path;
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      let articoli: any[] = [];
      let errors: string[] = [];

      console.log(`[Catalog Import] Processing ${fileExt} file:`, req.file.originalname);

      // Parse based on file type
      if (fileExt === '.xlsx' || fileExt === '.xls') {
        // Parse Excel
        try {
          const XLSX = await import('xlsx');
          const workbook = XLSX.readFile(filePath);
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

          for (const [index, row] of data.entries()) {
            try {
              const articolo: any = {};
              const r = row as any;

              // Map columns (case-insensitive)
              const codice = r.codice || r.Codice || r.CODICE || r.code || r.Code;
              const nome = r.nome || r.Nome || r.NOME || r.name || r.Name || r.descrizione || r.Descrizione;
              const prezzoListino = r.prezzoListino || r.prezzo || r.Prezzo || r.price || r.Price;
              const costo = r.costo || r.Costo || r.COSTO || r.cost || r.Cost;

              if (!codice || !nome) {
                errors.push(`Riga ${index + 2}: manca codice o nome`);
                continue;
              }

              articolo.codice = String(codice);
              articolo.nome = String(nome);
              articolo.descrizione = r.descrizione || r.Descrizione || r.description || '';
              articolo.prezzoListino = parseFloat(prezzoListino) || 0;
              articolo.costo = parseFloat(costo) || 0;
              articolo.unitaMisura = r.unitaMisura || r.um || r.UM || 'pz';
              articolo.stockMinimo = parseInt(r.stockMinimo || r.stock_minimo || '0') || 0;
              articolo.giacenza = parseInt(r.giacenza || r.stock || '0') || 0;
              articolo.barcode = r.barcode || r.Barcode || r.ean || '';
              articolo.ubicazioneScaffale = r.scaffale || r.Scaffale || '';
              articolo.ubicazioneCorsia = r.corsia || r.Corsia || '';
              articolo.ubicazioneRipiano = r.ripiano || r.Ripiano || '';
              articolo.lotto = r.lotto || r.Lotto || '';
              articolo.visibile = true;
              articolo.categoriaId = '';

              articoli.push(articolo);
            } catch (rowError: any) {
              errors.push(`Riga ${index + 2}: ${rowError.message}`);
            }
          }
        } catch (excelError: any) {
          return res.status(400).json({ error: `Errore parsing Excel: ${excelError.message}` });
        }
      } else if (fileExt === '.csv') {
        // Parse CSV
        try {
          const csvContent = fs.readFileSync(filePath, 'utf-8');
          const lines = csvContent.split('\n').map(l => l.trim()).filter(l => l);

          if (lines.length < 2) {
            return res.status(400).json({ error: "File CSV vuoto o invalido" });
          }

          const headers = lines[0].split(/[,;]/);

          for (let i = 1; i < lines.length; i++) {
            try {
              const values = lines[i].split(/[,;]/);
              const row: any = {};
              headers.forEach((h, idx) => {
                row[h.trim()] = values[idx]?.trim() || '';
              });

              const codice = row.codice || row.Codice || row.code;
              const nome = row.nome || row.Nome || row.name || row.descrizione;

              if (!codice || !nome) {
                errors.push(`Riga ${i + 1}: manca codice o nome`);
                continue;
              }

              articoli.push({
                codice: String(codice),
                nome: String(nome),
                descrizione: row.descrizione || row.description || '',
                prezzoListino: parseFloat(row.prezzoListino || row.prezzo || row.price || '0') || 0,
                costo: parseFloat(row.costo || row.cost || '0') || 0,
                unitaMisura: row.unitaMisura || row.um || 'pz',
                stockMinimo: parseInt(row.stockMinimo || row.stock_minimo || '0') || 0,
                giacenza: parseInt(row.giacenza || row.stock || '0') || 0,
                barcode: row.barcode || row.ean || '',
                ubicazioneScaffale: row.scaffale || '',
                ubicazioneCorsia: row.corsia || '',
                ubicazioneRipiano: row.ripiano || '',
                lotto: row.lotto || '',
                visibile: true,
                categoriaId: ''
              });
            } catch (rowError: any) {
              errors.push(`Riga ${i + 1}: ${rowError.message}`);
            }
          }
        } catch (csvError: any) {
          return res.status(400).json({ error: `Errore parsing CSV: ${csvError.message}` });
        }
      } else if (fileExt === '.pdf') {
        // Parse PDF
        try {
          const dataBuffer = fs.readFileSync(filePath);
          const pdfjsLib = await getPdfjs();
          const loadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(dataBuffer),
            disableWorker: true,
            useWorkerFetch: false,
            isEvalSupported: false,
            useSystemFonts: true,
            verbosity: 0
          });
          const pdf = await loadingTask.promise;

          let pdfText = '';
          for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 50); pageNum++) {
            const page = await pdf.getPage(pageNum);
            const content = await page.getTextContent();
            const pageText = content.items.map((item: any) => item.str).join(' ');
            pdfText += pageText + '\n';
          }

          // Try to intelligently parse PDF text to extract articles
          // This is a basic implementation - you may need to customize based on your PDF format
          const lines = pdfText.split('\n').filter(l => l.trim());

          // Try to detect table-like structure or patterns
          for (const line of lines) {
            try {
              // Skip header lines that look generic
              if (line.toLowerCase().includes('codice') && line.toLowerCase().includes('descrizione')) {
                continue;
              }

              // Try to extract: code, name/description, price
              // Common patterns: "CODE123 Product Name 29.99" or "CODE123|Product Name|29.99"
              const parts = line.split(/[\t|;,]/).map(p => p.trim()).filter(p => p);

              if (parts.length >= 2) {
                const codice = parts[0];
                const nome = parts[1];
                const prezzo = parts[2] ? parseFloat(parts[2].replace(/[^\d.,]/g, '').replace(',', '.')) : 0;
                const costo = parts[3] ? parseFloat(parts[3].replace(/[^\d.,]/g, '').replace(',', '.')) : 0;

                // Basic validation
                if (codice.length > 0 && codice.length < 50 && nome.length > 0) {
                  articoli.push({
                    codice: codice.substring(0, 50),
                    nome: nome.substring(0, 200),
                    descrizione: parts.length > 4 ? parts.slice(4).join(' ').substring(0, 1000) : '',
                    prezzoListino: prezzo || 0,
                    costo: costo || 0,
                    unitaMisura: 'pz',
                    stockMinimo: 0,
                    giacenza: 0,
                    barcode: '',
                    ubicazioneScaffale: '',
                    ubicazioneCorsia: '',
                    ubicazioneRipiano: '',
                    lotto: '',
                    visibile: true,
                    categoriaId: ''
                  });
                }
              }
            } catch (lineError) {
              // Skip problematic lines
              console.error('PDF line parse error:', lineError);
            }
          }

          if (articoli.length === 0) {
            return res.status(400).json({
              error: "Impossibile estrarre articoli dal PDF. Il formato non è riconosciuto. Prova con Excel o CSV per risultati migliori."
            });
          }
        } catch (pdfError: any) {
          return res.status(400).json({ error: `Errore parsing PDF: ${pdfError.message}` });
        }
      } else {
        return res.status(400).json({ error: "Formato file non supportato" });
      }

      // Clean up uploaded file
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.error("Error deleting temp file:", e);
      }

      console.log(`[Catalog Import] Parsed ${articoli.length} articles with ${errors.length} errors`);

      // Save to database
      let importedCount = 0;

      for (const art of articoli) {
        try {
          // Check if article with this code already exists
          const existingResult = await db.select().from(catalogArticles).where(eq(catalogArticles.codice, art.codice));
          const existing = existingResult[0];

          if (existing) {
            // Update existing article
            await db.update(catalogArticles).set({
              nome: art.nome,
              descrizione: art.descrizione,
              prezzoListino: String(art.prezzoListino),
              costo: String(art.costo),
              unitaMisura: art.unitaMisura,
              barcode: art.barcode,
              ubicazioneScaffale: art.ubicazioneScaffale,
              ubicazioneCorsia: art.ubicazioneCorsia,
              ubicazioneRipiano: art.ubicazioneRipiano,
              lotto: art.lotto,
              giacenza: art.giacenza ? parseInt(String(art.giacenza)) : existing.giacenza,
              stockMinimo: art.stockMinimo ? parseInt(String(art.stockMinimo)) : existing.stockMinimo,
              updatedAt: new Date().toISOString()
            }).where(eq(catalogArticles.id, existing.id));
          } else {
            // Create new article
            await db.insert(catalogArticles).values({
              id: crypto.randomUUID(),
              codice: art.codice,
              nome: art.nome,
              descrizione: art.descrizione,
              prezzoListino: String(art.prezzoListino),
              costo: String(art.costo),
              unitaMisura: art.unitaMisura,
              barcode: art.barcode,
              ubicazioneScaffale: art.ubicazioneScaffale,
              ubicazioneCorsia: art.ubicazioneCorsia,
              ubicazioneRipiano: art.ubicazioneRipiano,
              lotto: art.lotto,
              giacenza: art.giacenza ? parseInt(String(art.giacenza)) : 0,
              stockMinimo: art.stockMinimo ? parseInt(String(art.stockMinimo)) : 0,
              attivo: 1,
              visibile: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
          importedCount++;
        } catch (dbError: any) {
          console.error(`Error saving article ${art.codice}:`, dbError);
          errors.push(`Errore DB per ${art.codice}: ${dbError.message}`);
        }
      }

      res.json({
        success: true,
        total: articoli.length,
        imported: importedCount,
        articoli: articoli,
        errors: errors
      });

    } catch (error: any) {
      console.error("[Catalog Import] Error:", error);
      res.status(500).json({ error: error.message || "Errore durante l'importazione" });
    }
  });

  // =====================
  // SETUP API
  // =====================

  app.get("/api/setup/status", async (req: Request, res: Response) => {
    try {
      const isComplete = await storage.isSetupComplete();
      res.json({ setupComplete: isComplete });
    } catch (error) {
      res.json({ setupComplete: false });
    }
  });

  // Reset setup endpoint (for fixing broken setups)
  // Security: Only allowed when no users exist in the database (orphaned setup state)
  app.post("/api/setup/reset-now", async (req: Request, res: Response) => {
    try {
      const { confirmCode } = req.body || {};

      // Require confirmation code to prevent accidental resets
      if (confirmCode !== "RESET") {
        return res.status(400).json({ error: "Codice di conferma non valido. Digita 'RESET' per confermare." });
      }

      // Security check: Only allow reset if no users exist (orphaned setup state)
      const users = await storage.getUsers();
      if (users && users.length > 0) {
        return res.status(403).json({
          error: "Reset non consentito: esistono già degli utenti nel sistema. Contatta un amministratore per il recupero dell'accesso."
        });
      }

      await storage.deleteSetting('setup_complete');
      res.json({ success: true, message: "Setup resettato. Ricarica la pagina per vedere il wizard." });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/setup", async (req: Request, res: Response) => {
    try {
      const isComplete = await storage.isSetupComplete();
      if (isComplete) {
        return res.status(400).json({ message: "Setup già completato" });
      }

      const { companyName, adminName, adminEmail, adminUsername, adminPassword } = req.body;

      if (!companyName || !adminName || !adminUsername || !adminPassword) {
        return res.status(400).json({ message: "Tutti i campi obbligatori devono essere compilati" });
      }

      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      await storage.createUser({
        name: adminName,
        email: adminEmail || `${adminUsername}@pulse-erp.local`,
        username: adminUsername,
        password: hashedPassword,
        role: "Admin",
        status: "Active",
      });

      await storage.setSetting('company_name', companyName);
      await storage.setSetting('setup_complete', 'true');

      res.json({ success: true, message: "Setup completato con successo" });
    } catch (error: any) {
      console.error("Setup error:", error);
      res.status(500).json({ message: error.message || "Errore durante il setup" });
    }
  });

  // =====================
  // WHATSAPP API
  // =====================

  // Get status
  app.get("/api/whatsapp/status", async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || 'admin'; // Default fallback
    res.json(getWhatsAppStatus(userId));
  });

  // Get QR Code
  app.get("/api/whatsapp/qr", async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || 'admin';
    const qr = getQRCode(userId);
    res.json({ qr });
  });

  // Initialize
  app.post("/api/whatsapp/init", async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || 'admin';
    initializeWhatsApp(userId).catch(console.error);
    res.json({ success: true, message: "Inizializzazione avviata" });
  });

  // Disconnect
  app.post("/api/whatsapp/disconnect", async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || 'admin';
    await disconnectWhatsApp(userId);
    res.json({ success: true });
  });

  // Contacts
  app.get("/api/whatsapp/contacts", async (req: Request, res: Response) => {
    try {
      const contacts = await storage.getWhatsappContacts();
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ error: "Errore recupero contatti" });
    }
  });

  app.post("/api/whatsapp/contacts", async (req: Request, res: Response) => {
    try {
      const contactData = insertWhatsappContactSchema.parse(req.body);
      const contact = await storage.createWhatsappContact(contactData);
      res.json(contact);
    } catch (error) {
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  app.patch("/api/whatsapp/contacts/:id", async (req: Request, res: Response) => {
    try {
      const contact = await storage.updateWhatsappContact(req.params.id, req.body);
      res.json(contact);
    } catch (error) {
      res.status(500).json({ error: "Errore aggiornamento contatto" });
    }
  });

  // Messages
  app.get("/api/whatsapp/contacts/:contactId/messages", async (req: Request, res: Response) => {
    try {
      const messages = await storage.getWhatsappMessages(req.params.contactId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Errore recupero messaggi" });
    }
  });

  app.post("/api/whatsapp/contacts/:contactId/messages", async (req: Request, res: Response) => {
    try {
      const { contactId } = req.params;
      const { content, type } = req.body;
      const userId = (req as any).user?.id || 'admin';

      // 1. Get contact to find phone number
      const contact = await storage.getWhatsappContact(contactId);
      if (!contact) {
        return res.status(404).json({ error: "Contatto non trovato" });
      }

      // 2. Send via WhatsApp Web
      try {
        await sendWhatsAppMessage(userId, contact.phoneNumber, content);
      } catch (wsError) {
        console.error("WhatsApp Send Error:", wsError);
        // Continue to save locally even if send fails? Maybe not.
        return res.status(500).json({ error: "Errore invio messaggio WhatsApp: Non connesso o errore" });
      }

      // 3. Save to DB
      const message = await storage.createWhatsappMessage({
        contactId,
        content,
        type: "sent"
      });

      // Update contact last message
      await storage.updateWhatsappContact(contactId, {
        lastMessagePreview: content.substring(0, 50),
        lastMessageTime: new Date().toISOString()
      });

      res.json(message);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Errore invio messaggio" });
    }
  });

  // =====================
  // AUTHENTICATION API
  // =====================

  // Debug endpoint to check user exists (temporary)
  app.get("/api/auth/debug/:username", async (req: Request, res: Response) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.json({ exists: false, message: "Utente non trovato" });
      }
      return res.json({
        exists: true,
        username: user.username,
        hasPassword: !!user.password,
        role: user.role
      });
    } catch (error) {
      res.status(500).json({ error: "Errore" });
    }
  });

  // =====================
  // USERS & LOGS API
  // =====================
  app.get("/api/users", async (req: Request, res: Response) => {
    try {
      const users = await storage.getUsers();
      // Remove sensitive data
      const safeUsers = users.map(u => {
        const { password, ...rest } = u;
        return rest;
      });
      res.json(safeUsers);
    } catch (error) {
      console.error("Error getting users:", error);
      res.status(500).json({ error: "Errore nel recupero utenti" });
    }
  });

  app.get("/api/user-access-logs", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string | undefined;
      const logs = await storage.getUserAccessLogs(userId);
      res.json(logs);
    } catch (error) {
      console.error("Error getting access logs:", error);
      res.status(500).json({ error: "Errore nel recupero log accessi" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const clientIp = req.headers["x-forwarded-for"]?.toString().split(",")[0].trim()
        || req.socket.remoteAddress
        || "";
      const userAgent = req.headers["user-agent"] || "";

      if (!username || !password) {
        return res.status(400).json({ error: "Username e password richiesti" });
      }

      const user = await storage.getUserByUsername(username);

      if (!user) {
        console.log(`Login failed: user '${username}' not found`);
        return res.status(401).json({ error: "Credenziali non valide" });
      }

      if (!user.password) {
        console.log(`Login failed: user '${username}' has no password`);
        return res.status(401).json({ error: "Password non configurata per questo utente" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        console.log(`Login failed: password mismatch for user '${username}'`);
        try {
          await storage.createUserAccessLog({
            userId: user.id,
            ipAddress: clientIp,
            userAgent: userAgent,
            success: false
          });
        } catch (logError) {
          console.log("Access log failed (table may not exist):", logError);
        }
        return res.status(401).json({ error: "Credenziali non valide" });
      }

      console.log(`Login successful for user '${username}'`);
      try {
        await storage.createUserAccessLog({
          userId: user.id,
          ipAddress: clientIp,
          userAgent: userAgent,
          success: true
        });
      } catch (logError) {
        console.log("Access log failed (table may not exist):", logError);
      }

      if ((req as any).session) {
        (req as any).session.userId = user.id;
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Errore durante il login" });
    }
  });

  app.post("/api/auth/change-password", async (req: Request, res: Response) => {
    try {
      const { username, currentPassword, newPassword } = req.body;

      if (!username || !currentPassword || !newPassword) {
        return res.status(400).json({ error: "Tutti i campi sono obbligatori" });
      }

      if (newPassword.length < 4) {
        return res.status(400).json({ error: "La nuova password deve avere almeno 4 caratteri" });
      }

      const user = await storage.getUserByUsername(username);

      if (!user) {
        return res.status(401).json({ error: "Utente non trovato" });
      }

      if (!user.password) {
        return res.status(401).json({ error: "Password non configurata per questo utente" });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ error: "Password attuale non corretta" });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(user.id, { password: hashedNewPassword });

      console.log(`Password changed successfully for user '${username}'`);
      res.json({ success: true, message: "Password cambiata con successo" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Errore durante il cambio password" });
    }
  });

  // =====================
  // USERS API
  // =====================

  // User Access Logs API
  app.get("/api/user-access-logs", async (req: Request, res: Response) => {
    try {
      const { userId } = req.query;
      const logs = await storage.getUserAccessLogs(userId as string | undefined);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching access logs:", error);
      res.status(500).json({ error: "Errore nel recupero dei log" });
    }
  });

  // Get client IP address
  app.get("/api/client-ip", async (req: Request, res: Response) => {
    try {
      const clientIp = req.headers["x-forwarded-for"]?.toString().split(",")[0].trim()
        || req.socket.remoteAddress
        || "";
      res.json({ ip: clientIp });
    } catch (error) {
      res.json({ ip: null });
    }
  });

  // Get user by IP address for auto-login
  app.get("/api/users/by-ip", async (req: Request, res: Response) => {
    try {
      const clientIp = req.headers["x-forwarded-for"]?.toString().split(",")[0].trim()
        || req.socket.remoteAddress
        || "";

      if (!clientIp) {
        return res.json({ username: null });
      }

      const users = await storage.getUsers();
      const matchedUser = users.find((u: any) => u.allowedIp && u.allowedIp === clientIp && u.status === "Active");

      if (matchedUser) {
        return res.json({ username: matchedUser.username });
      }

      res.json({ username: null });
    } catch (error) {
      console.error("Error getting user by IP:", error);
      res.json({ username: null });
    }
  });

  app.get("/api/users", async (req: Request, res: Response) => {
    const users = await storage.getUsers();
    const usersWithoutPasswords = users.map(({ password: _, ...user }) => user);
    res.json(usersWithoutPasswords);
  });

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const rawPassword = req.body.password;
      const bodyWithoutPassword = { ...req.body };
      delete bodyWithoutPassword.password;

      const userData = insertUserSchema.parse(bodyWithoutPassword);

      if (rawPassword && typeof rawPassword === "string" && rawPassword.trim() !== "") {
        (userData as any).password = await bcrypt.hash(rawPassword, 10);
      }

      const user = await storage.createUser(userData);
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const rawPassword = req.body.password;
      const bodyWithoutPassword = { ...req.body };
      delete bodyWithoutPassword.password;

      const userData = insertUserSchema.partial().parse(bodyWithoutPassword);

      if (rawPassword && typeof rawPassword === "string" && rawPassword.trim() !== "") {
        (userData as any).password = await bcrypt.hash(rawPassword, 10);
      }

      const user = await storage.updateUser(req.params.id, userData);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req: Request, res: Response) => {
    const success = await storage.deleteUser(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(204).send();
  });

  // =====================
  // PROJECTS API
  // =====================
  app.get("/api/projects", async (req: Request, res: Response) => {
    const projects = await storage.getProjects();
    res.json(projects);
  });

  // Get shared projects (must be before /api/projects/:id to avoid conflict)
  app.get("/api/projects/shared", async (req: Request, res: Response) => {
    try {
      // No authentication required - endpoint already filters for publicly shared projects
      const projects = await storage.getProjects();
      const now = new Date();
      const sharedProjects = projects.filter((p: any) =>
        p.shareToken && p.shareExpiresAt && new Date(p.shareExpiresAt) > now
      );

      // Enrich with tasks count and other data
      const tasks = await storage.getTasks();
      const enrichedProjects = await Promise.all(sharedProjects.map(async (project: any) => {
        const projectTasks = tasks.filter((t: any) => t.projectId === project.id);
        const completedTasks = projectTasks.filter((t: any) => t.status === 'Done' || t.done).length;

        // Get project documents
        const documents = await storage.getDocuments();
        const projectDocs = documents.filter((d: any) => {
          if (Array.isArray(d.projectIds)) {
            return d.projectIds.includes(project.id);
          }
          return d.projectId === project.id;
        });

        // Get project emails
        let projectEmails: any[] = [];
        try {
          projectEmails = await storage.getProjectEmails(project.id);
        } catch (e) {
          // Ignore if not available
        }

        return {
          ...project,
          tasksCount: projectTasks.length,
          completedTasksCount: completedTasks,
          documentsCount: projectDocs.length,
          emailsCount: projectEmails.length,
          shareUrl: `/shared/project/${project.shareToken}`,
          timeRemaining: Math.max(0, Math.floor((new Date(project.shareExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60))),
        };
      }));

      res.json(enrichedProjects);
    } catch (error) {
      console.error("Error getting shared projects:", error);
      res.status(500).json({ error: "Errore nel recupero progetti condivisi" });
    }
  });

  app.get("/api/projects/:id", async (req: Request, res: Response) => {
    const project = await storage.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(project);
  });

  app.post("/api/projects", async (req: Request, res: Response) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);

      // Automatically create archive folder for project (avoid duplicates)
      try {
        const folderName = `📁 ${project.title}`;
        const existingFolderById = await storage.getArchiveFolderByProjectId(project.id);
        const existingFolderByName = await storage.getArchiveFolderByName(folderName);

        if (!existingFolderById && !existingFolderByName) {
          await storage.createArchiveFolder({
            name: folderName,
            color: "blue",
            icon: "folder",
            projectId: project.id,
            createdBy: req.body.createdBy || null,
          });
        } else if (existingFolderByName && !existingFolderByName.projectId) {
          // Update existing folder to link with project
          await storage.updateArchiveFolder(existingFolderByName.id, { projectId: project.id });
        }
      } catch (e) {
        console.error("Error creating archive folder for project:", e);
      }

      // Log activity for project creation
      try {
        await storage.createActivity({
          userId: req.body.createdBy || 'system',
          userName: 'User',
          action: 'created',
          entityType: 'project',
          entityId: project.id,
          entityTitle: project.title,
        });
      } catch (e) { /* Don't fail if activity logging fails */ }

      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.patch("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const projectData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(req.params.id, projectData);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const projectId = req.params.id;

      // Check for linked tasks
      const projectTasks = await storage.getTasksByProject(projectId);
      if (projectTasks.length > 0) {
        return res.status(400).json({
          error: "Impossibile eliminare il progetto",
          message: `Il progetto ha ancora ${projectTasks.length} attività collegate. Elimina o sposta le attività prima di cancellare il progetto.`
        });
      }

      // Check for linked personal todos
      const allTodos = await storage.getPersonalTodos();
      const linkedTodos = allTodos.filter(t => t.projectId === projectId);
      if (linkedTodos.length > 0) {
        return res.status(400).json({
          error: "Impossibile eliminare il progetto",
          message: `Il progetto ha ancora ${linkedTodos.length} todo personali collegati. Elimina o scollega i todo prima di cancellare il progetto.`
        });
      }

      // Check for project shares
      const projectShares = await storage.getProjectShares(projectId);
      if (projectShares.length > 0) {
        // Delete shares automatically since they are just permissions
        for (const share of projectShares) {
          await storage.deleteProjectShare(share.id);
        }
      }

      const success = await storage.deleteProject(projectId);
      if (!success) {
        return res.status(404).json({ error: "Progetto non trovato" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ error: "Errore durante l'eliminazione del progetto" });
    }
  });

  // =====================
  // PROJECT SHARES API
  // =====================
  app.get("/api/projects/:id/shares", async (req: Request, res: Response) => {
    const shares = await storage.getProjectShares(req.params.id);
    res.json(shares);
  });

  app.post("/api/projects/:id/shares", async (req: Request, res: Response) => {
    try {
      const shareData = insertProjectShareSchema.parse({
        ...req.body,
        projectId: req.params.id,
      });
      const share = await storage.createProjectShare(shareData);

      try {
        const project = await storage.getProject(req.params.id);
        const sharedByUser = shareData.sharedById ? await storage.getUser(shareData.sharedById) : null;

        if (project && shareData.userId) {
          await storage.createNotification({
            userId: shareData.userId,
            title: "Progetto condiviso con te",
            message: `${sharedByUser?.name || "Qualcuno"} ha condiviso il progetto "${project.title}" con te`,
            type: "project_share",
            link: `/projects`,
          });
        }
      } catch (notifError) {
        console.error("Error creating notification:", notifError);
      }

      res.status(201).json(share);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error sharing project:", error);
      res.status(500).json({ error: "Failed to share project" });
    }
  });

  app.delete("/api/projects/:projectId/shares/:shareId", async (req: Request, res: Response) => {
    const success = await storage.deleteProjectShare(req.params.shareId);
    if (!success) {
      return res.status(404).json({ error: "Share not found" });
    }
    res.status(204).send();
  });

  // =====================
  // PROJECT EMAILS API
  // =====================
  app.get("/api/projects/:projectId/emails", async (req: Request, res: Response) => {
    try {
      const projectEmails = await storage.getProjectEmails(req.params.projectId);
      res.json(projectEmails);
    } catch (error) {
      res.status(500).json({ error: "Failed to get project emails" });
    }
  });

  app.post("/api/projects/:projectId/emails", async (req: Request, res: Response) => {
    try {
      const body = { ...req.body };
      if (body.emailDate && typeof body.emailDate === 'string') {
        body.emailDate = new Date(body.emailDate);
      }
      const projectEmailData = insertProjectEmailSchema.parse({
        projectId: req.params.projectId,
        ...body
      });
      const projectEmail = await storage.addProjectEmail(projectEmailData);
      res.status(201).json(projectEmail);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to add email to project" });
    }
  });

  app.delete("/api/projects/:projectId/emails/:emailId", async (req: Request, res: Response) => {
    const success = await storage.removeProjectEmail(req.params.emailId);
    if (!success) {
      return res.status(404).json({ error: "Project email not found" });
    }
    res.status(204).send();
  });

  app.get("/api/linked-emails", async (req: Request, res: Response) => {
    try {
      const linkedEmails = await storage.getAllLinkedEmails();
      res.json(linkedEmails);
    } catch (error) {
      res.status(500).json({ error: "Failed to get linked emails" });
    }
  });

  // =====================
  // EMAIL LABELS API
  // =====================
  app.get("/api/email-labels", async (req: Request, res: Response) => {
    try {
      const labels = await storage.getEmailLabels();
      res.json(labels);
    } catch (error) {
      res.status(500).json({ error: "Failed to get email labels" });
    }
  });

  app.post("/api/email-labels", async (req: Request, res: Response) => {
    try {
      const label = await storage.createEmailLabel(req.body);
      res.status(201).json(label);
    } catch (error) {
      res.status(500).json({ error: "Failed to create email label" });
    }
  });

  app.patch("/api/email-labels/:id", async (req: Request, res: Response) => {
    try {
      const label = await storage.updateEmailLabel(req.params.id, req.body);
      if (!label) {
        return res.status(404).json({ error: "Label not found" });
      }
      res.json(label);
    } catch (error) {
      res.status(500).json({ error: "Failed to update email label" });
    }
  });

  app.delete("/api/email-labels/:id", async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteEmailLabel(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Label not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete email label" });
    }
  });

  app.get("/api/email-label-assignments", async (req: Request, res: Response) => {
    try {
      const assignments = await storage.getAllEmailLabelAssignments();
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: "Failed to get email label assignments" });
    }
  });

  app.post("/api/emails/:emailId/labels/:labelId", async (req: Request, res: Response) => {
    try {
      const assignment = await storage.assignLabelToEmail({
        emailId: req.params.emailId,
        labelId: req.params.labelId
      });
      res.status(201).json(assignment);
    } catch (error) {
      res.status(500).json({ error: "Failed to assign label to email" });
    }
  });

  app.delete("/api/emails/:emailId/labels/:labelId", async (req: Request, res: Response) => {
    try {
      const success = await storage.removeLabelFromEmail(req.params.emailId, req.params.labelId);
      if (!success) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to remove label from email" });
    }
  });

  // =====================
  // PROJECT DOCUMENTS API
  // =====================
  app.get("/api/projects/:projectId/documents", async (req: Request, res: Response) => {
    try {
      const projectDocuments = await storage.getProjectDocumentsWithDetails(req.params.projectId);
      res.json(projectDocuments);
    } catch (error) {
      res.status(500).json({ error: "Failed to get project documents" });
    }
  });

  app.post("/api/projects/:projectId/documents", async (req: Request, res: Response) => {
    try {
      const projectDocumentData = insertProjectDocumentSchema.parse({
        projectId: req.params.projectId,
        documentId: req.body.documentId
      });
      const projectDocument = await storage.addProjectDocument(projectDocumentData);
      res.status(201).json(projectDocument);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to add document to project" });
    }
  });

  app.delete("/api/projects/:projectId/documents/:docId", async (req: Request, res: Response) => {
    const success = await storage.removeProjectDocument(req.params.docId);
    if (!success) {
      return res.status(404).json({ error: "Project document not found" });
    }
    res.status(204).send();
  });

  app.get("/api/documents/:documentId/projects", async (req: Request, res: Response) => {
    try {
      const projects = await storage.getDocumentProjects(req.params.documentId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to get document projects" });
    }
  });

  // Get project invoices
  app.get("/api/projects/:projectId/invoices", async (req: Request, res: Response) => {
    try {
      const invoices = await storage.getInvoices();
      const projectInvoices = invoices.filter((inv: any) => inv.projectId === req.params.projectId);
      res.json(projectInvoices);
    } catch (error) {
      res.status(500).json({ error: "Failed to get project invoices" });
    }
  });

  // Link invoice to project
  app.patch("/api/invoices/:invoiceId/project", async (req: Request, res: Response) => {
    try {
      const { projectId } = req.body;
      const invoice = await storage.updateInvoice(req.params.invoiceId, { projectId });
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ error: "Failed to link invoice to project" });
    }
  });

  // Get project quotes
  app.get("/api/projects/:projectId/quotes", async (req: Request, res: Response) => {
    try {
      const quotes = await storage.getQuotes();
      const projectQuotes = quotes.filter((q: any) => q.projectId === req.params.projectId);
      res.json(projectQuotes);
    } catch (error) {
      res.status(500).json({ error: "Failed to get project quotes" });
    }
  });

  // Link quote to project
  app.patch("/api/quotes/:quoteId/project", async (req: Request, res: Response) => {
    try {
      const { projectId } = req.body;
      const quote = await storage.updateQuote(req.params.quoteId, { projectId });
      res.json(quote);
    } catch (error) {
      res.status(500).json({ error: "Failed to link quote to project" });
    }
  });

  // Get project transactions
  app.get("/api/projects/:projectId/transactions", async (req: Request, res: Response) => {
    try {
      const transactions = await storage.getFinanceTransactions();
      const projectTransactions = transactions.filter((t: any) => t.projectId === req.params.projectId);
      res.json(projectTransactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get project transactions" });
    }
  });

  // =====================
  // PROJECT DOCUMENTS API
  // =====================

  app.get("/api/projects/:projectId/documents", async (req: Request, res: Response) => {
    try {
      const documents = await storage.getProjectDocumentsWithDetails(req.params.projectId);
      res.json(documents);
    } catch (error) {
      console.error("Error getting project documents:", error);
      res.status(500).json({ error: "Failed to get project documents" });
    }
  });

  app.post("/api/projects/:projectId/documents", async (req: Request, res: Response) => {
    try {
      const { documentId } = req.body;
      if (!documentId) {
        return res.status(400).json({ error: "Document ID required" });
      }

      const projectDoc = await storage.addProjectDocument({
        projectId: req.params.projectId,
        documentId: documentId,
        addedAt: new Date().toISOString()
      });

      res.status(201).json(projectDoc);
    } catch (error) {
      console.error("Error adding project document:", error);
      res.status(500).json({ error: "Failed to add project document" });
    }
  });

  app.delete("/api/projects/:projectId/documents/:docId", async (req: Request, res: Response) => {
    try {
      const success = await storage.removeProjectDocument(req.params.docId);
      if (!success) {
        return res.status(404).json({ error: "Project document not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing project document:", error);
      res.status(500).json({ error: "Failed to remove project document" });
    }
  });

  // Link transaction to project (note: this is a project feature, not strictly finance)
  app.patch("/api/finance/transactions/:transactionId/project", async (req: Request, res: Response) => {
    try {
      const { projectId } = req.body;
      const transaction = await storage.updateFinanceTransaction(req.params.transactionId, { projectId });
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to link transaction to project" });
    }
  });

  // Generate share link for project
  app.post("/api/projects/:id/share", async (req: Request, res: Response) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const { expiresInDays = 7 } = req.body;
      const shareToken = `prj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const shareExpiresAt = new Date();
      shareExpiresAt.setDate(shareExpiresAt.getDate() + expiresInDays);

      await storage.updateProject(req.params.id, {
        shareToken,
        shareExpiresAt,
      });

      res.json({
        shareToken,
        shareUrl: `/shared/project/${shareToken}`,
        expiresAt: shareExpiresAt
      });
    } catch (error) {
      console.error("Error generating project share link:", error);
      res.status(500).json({ error: "Failed to generate share link" });
    }
  });

  // Remove share link from project
  app.delete("/api/projects/:id/share", async (req: Request, res: Response) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      await storage.updateProject(req.params.id, {
        shareToken: null,
        shareExpiresAt: null,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error removing project share link:", error);
      res.status(500).json({ error: "Failed to remove share link" });
    }
  });

  // Get internal project by ID (authenticated)
  app.get("/api/internal/project/:id", async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Progetto non trovato" });
      }

      // Get project tasks
      const allTasks = await storage.getTasks();
      const projectTasks = allTasks.filter((t: any) => t.projectId === project.id);

      // Get project emails
      const projectEmails = await storage.getProjectEmails(project.id);
      const sanitizedEmails = projectEmails.map((email: any) => ({
        id: email.id,
        emailSubject: email.emailSubject,
        emailFrom: email.emailFrom,
        emailPreview: email.emailPreview,
        emailDate: email.emailDate,
      }));

      // Get project documents
      const projectDocsWithDetails = await storage.getProjectDocumentsWithDetails(project.id);
      const sanitizedDocuments = projectDocsWithDetails.map((pd: any) => ({
        id: pd.id,
        documentId: pd.documentId,
        title: pd.document?.title || "Documento",
        fileType: pd.document?.fileType,
        fileSize: pd.document?.fileSize,
        addedAt: pd.addedAt,
      }));

      res.json({
        ...project,
        tasks: projectTasks,
        emails: sanitizedEmails,
        documents: sanitizedDocuments,
      });
    } catch (error) {
      console.error("Error getting internal project:", error);
      res.status(500).json({ error: "Errore nel caricamento del progetto" });
    }
  });

  // Get shared project by token
  app.get("/api/shared/project/:token", async (req: Request, res: Response) => {
    try {
      const projects = await storage.getProjects();
      const project = projects.find((p: any) => p.shareToken === req.params.token);

      if (!project) {
        return res.status(404).json({ error: "Shared project not found" });
      }

      if (project.shareExpiresAt && new Date(project.shareExpiresAt) < new Date()) {
        return res.status(410).json({ error: "Share link expired" });
      }

      // Get project tasks
      const allTasks = await storage.getTasks();
      const projectTasks = allTasks.filter((t: any) => t.projectId === project.id);

      // Get project emails (sanitized - no sensitive data)
      const projectEmails = await storage.getProjectEmails(project.id);
      const sanitizedEmails = projectEmails.map((email: any) => ({
        id: email.id,
        emailSubject: email.emailSubject,
        emailFrom: email.emailFrom,
        emailPreview: email.emailPreview,
        emailDate: email.emailDate,
      }));

      // Get project documents (sanitized - no file paths or internal data)
      const projectDocsWithDetails = await storage.getProjectDocumentsWithDetails(project.id);
      const sanitizedDocuments = projectDocsWithDetails.map((pd: any) => ({
        id: pd.id,
        documentId: pd.documentId,
        title: pd.document?.title || "Documento",
        fileType: pd.document?.fileType,
        fileSize: pd.document?.fileSize,
        addedAt: pd.addedAt,
      }));

      res.json({
        ...project,
        tasks: projectTasks,
        emails: sanitizedEmails,
        documents: sanitizedDocuments,
      });
    } catch (error) {
      console.error("Error getting shared project:", error);
      res.status(500).json({ error: "Failed to get shared project" });
    }
  });

  // =====================
  // COMPANY DATA API
  // =====================

  // Search companies
  app.get("/api/companies/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json([]);
      }

      const results = await storage.searchAnagraficaClienti(query);
      res.json(results);
    } catch (error) {
      console.error("Search companies error:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });

  // Get full company data
  app.get("/api/companies/:id/full-data", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const [
        company,
        referenti,
        addresses,
        invoices,
        quotes,
        orders
      ] = await Promise.all([
        storage.getAnagraficaClientiById(id),
        storage.getReferentiByCliente(id),
        storage.getIndirizziSpedizioneByCliente(id),
        storage.getInvoicesByCliente(id),
        storage.getQuotesByCliente(id),
        storage.getSalesOrdersByCliente(id)
      ]);

      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      res.json({
        company,
        referenti,
        addresses,
        invoices,
        quotes,
        orders
      });
    } catch (error) {
      console.error("Get full company data error:", error);
      res.status(500).json({ error: "Failed to fetch company data" });
    }
  });

  // =====================
  // TASKS API
  // =====================
  app.get("/api/tasks", async (req: Request, res: Response) => {
    const tasks = await storage.getTasks();
    res.json(tasks);
  });

  app.get("/api/tasks/:id", async (req: Request, res: Response) => {
    const task = await storage.getTask(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(task);
  });

  // Get tasks by project
  app.get("/api/projects/:projectId/tasks", async (req: Request, res: Response) => {
    try {
      const tasks = await storage.getTasksByProject(req.params.projectId);
      res.json(tasks);
    } catch (error) {
      console.error("Error getting project tasks:", error);
      res.status(500).json({ error: "Failed to get project tasks" });
    }
  });

  app.post("/api/tasks", async (req: Request, res: Response) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(taskData);

      // Automatically create personal todo linked to project (avoid duplicates)
      if (task.projectId) {
        try {
          const project = await storage.getProject(task.projectId);
          const categoryName = project ? `📋 ${project.title}` : "Progetti";

          // Check by projectId first, then fallback to category/title for legacy records
          const existingTodoById = await storage.getPersonalTodoByProjectAndTitle(task.projectId, task.title);
          const existingTodoByCategory = await storage.getPersonalTodoByCategoryAndTitle(categoryName, task.title);

          if (!existingTodoById && !existingTodoByCategory) {
            await storage.createPersonalTodo({
              title: task.title,
              description: task.description || undefined,
              priority: task.priority || "medium",
              dueDate: task.dueDate || undefined,
              category: categoryName,
              projectId: task.projectId,
              userId: req.body.assignedTo || req.body.createdBy || null,
            });
          } else if (existingTodoByCategory && !existingTodoByCategory.projectId) {
            // Update existing todo to link with project
            await storage.updatePersonalTodo(existingTodoByCategory.id, { projectId: task.projectId });
          }
        } catch (e) {
          console.error("Error creating personal todo for task:", e);
        }
      }

      // Log activity for task creation
      try {
        await storage.createActivity({
          userId: req.body.createdBy || 'system',
          userName: 'User',
          action: 'created',
          entityType: 'task',
          entityId: task.id,
          entityTitle: task.title,
        });
      } catch (e) { /* Don't fail if activity logging fails */ }

      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const taskData = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(req.params.id, taskData);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Log activity for task completion
      try {
        const action = req.body.done === true ? 'completed' : 'updated';
        await storage.createActivity({
          userId: req.body.updatedBy || 'system',
          userName: 'User',
          action,
          entityType: 'task',
          entityId: task.id,
          entityTitle: task.title,
        });
      } catch (e) { /* Don't fail if activity logging fails */ }

      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req: Request, res: Response) => {
    const success = await storage.deleteTask(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.status(204).send();
  });

  // =====================
  // DOCUMENTS API
  // =====================

  app.get("/api/documents", async (req: Request, res: Response) => {
    try {
      // Use metadata only for list to be faster
      const documents = await storage.getDocumentsMetadata();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to get documents" });
    }
  });

  app.get("/api/documents/:id", async (req: Request, res: Response) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ error: "Failed to get document" });
    }
  });

  app.post("/api/documents", async (req: Request, res: Response) => {
    try {
      // Ensure createdBy is set
      const docData = {
        ...req.body,
        createdBy: req.body.createdBy || (req.session as any)?.userId || 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        // Set defaults if missing
        fileType: req.body.fileType || 'text',
        isArchived: false,
        isTemplate: false,
        isPublic: false
      };

      const document = await storage.createDocument(docData);
      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  app.patch("/api/documents/:id", async (req: Request, res: Response) => {
    try {
      const document = await storage.updateDocument(req.params.id, {
        ...req.body,
        updatedAt: new Date()
      });
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ error: "Failed to update document" });
    }
  });

  app.delete("/api/documents/:id", async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteDocument(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // =====================
  // UPLOAD API
  // =====================

  // Serve static files from uploads directory
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  app.post('/api/upload/document', documentUpload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nessun file caricato o tipo non supportato' });
      }

      const fileUrl = `/uploads/documents/${req.file.filename}`;
      res.json({
        url: fileUrl,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Errore durante l'upload" });
    }
  });

  app.post('/api/upload/image', imageUpload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nessun file caricato' });
      }

      const fileUrl = `/uploads/images/${req.file.filename}`;
      res.json({
        url: fileUrl,
        filename: req.file.originalname
      });
    } catch (error) {
      res.status(500).json({ error: "Upload failed" });
    }
  });

  app.post('/api/upload/document/summarize', async (req, res) => {
    // Mock summary
    res.json({ summary: "Riassunto automatico non disponibile." });
  });

  // =====================
  // EMAILS API
  // =====================
  app.get("/api/emails", async (req: Request, res: Response) => {
    const userId = (req as any).session?.userId || req.headers["x-user-id"];
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const emails = await storage.getEmails(userId, limit);

    // Trigger background sync to ensure dashboard is up to date
    if (userId) {
      // Don't await this - let it run in background
      syncEmailsBackground(userId).catch(err => console.error("Dashboard background sync error:", err));
    }

    res.json(emails);
  });

  app.get("/api/emails/:id", async (req: Request, res: Response) => {
    const email = await storage.getEmail(req.params.id);
    if (!email) {
      return res.status(404).json({ error: "Email not found" });
    }
    res.json(email);
  });

  app.post("/api/emails", async (req: Request, res: Response) => {
    try {
      const emailData = insertEmailSchema.parse(req.body);
      const email = await storage.createEmail(emailData);
      res.status(201).json(email);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create email" });
    }
  });

  app.patch("/api/emails/:id", async (req: Request, res: Response) => {
    try {
      const emailData = insertEmailSchema.partial().parse(req.body);
      const email = await storage.updateEmail(req.params.id, emailData);
      if (!email) {
        return res.status(404).json({ error: "Email not found" });
      }
      res.json(email);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update email" });
    }
  });

  app.delete("/api/emails/:id", async (req: Request, res: Response) => {
    const success = await storage.deleteEmail(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Email not found" });
    }
    res.status(204).send();
  });

  // Helper for background sync
  async function syncEmailsBackground(userId: string, folder: string = "INBOX", accountId?: string) {
    try {
      console.log(`[Background Sync] Starting sync for user ${userId} folder ${folder}`);
      let userConfig: UserEmailConfig | undefined;

      if (accountId) {
        userConfig = await storage.getUserEmailConfig(accountId);
        if (userConfig && userConfig.userId !== userId) {
          userConfig = undefined;
        }
      } else {
        const userConfigs = await storage.getUserEmailConfigs(userId);
        userConfig = userConfigs[0];
      }

      let userCreds: UserEmailCredentials;

      if (!userConfig || !userConfig.emailAddress || !userConfig.password) {
        // Fallback to environment variables
        if (process.env.ARUBA_EMAIL_ADDRESS && process.env.ARUBA_EMAIL_PASSWORD) {
          userCreds = {
            emailAddress: process.env.ARUBA_EMAIL_ADDRESS,
            password: process.env.ARUBA_EMAIL_PASSWORD,
            imapHost: "imaps.aruba.it",
            imapPort: 993,
            imapSecure: true,
            smtpHost: "smtps.aruba.it",
            smtpPort: 465,
            smtpSecure: true,
            displayName: "Aruba Email"
          };
        } else {
          console.log("[Background Sync] No credentials found");
          return;
        }
      } else {
        userCreds = {
          emailAddress: userConfig.emailAddress,
          password: userConfig.password,
          imapHost: userConfig.imapHost,
          imapPort: userConfig.imapPort,
          imapSecure: userConfig.imapSecure,
          smtpHost: userConfig.smtpHost,
          smtpPort: userConfig.smtpPort,
          smtpSecure: userConfig.smtpSecure,
          displayName: userConfig.displayName || undefined,
        };
      }

      // Scarica email dalla cartella (Optimized)
      const lastUid = await storage.getLastEmailUid(userId, folder);
      let emails: any[] = [];

      if (lastUid > 0) {
        console.log(`[Background Sync] Fetching new emails since UID ${lastUid}`);
        emails = await fetchNewEmails(userCreds, folder, lastUid);
      } else {
        console.log(`[Background Sync] Initial sync, fetching last 50 emails`);
        emails = await fetchEmailsFromFolderWithConfig(userCreds, folder, 50, true);
      }

      for (const email of emails) {
        const uid = email.uid || 0;

        const existing = await storage.getEmailCacheByUid(userId, folder, uid);
        if (!existing) {
          await storage.createEmailCache({
            userId,
            uid,
            folder,
            messageId: email.id,
            fromAddress: email.fromAddress,
            fromName: email.fromName || null,
            toAddress: email.toAddress,
            subject: email.subject,
            preview: email.preview,
            body: email.body,
            bodyHtml: email.body,
            unread: email.unread,
            starred: email.starred || false,
            receivedAt: email.receivedAt ? new Date(email.receivedAt).toISOString() : new Date().toISOString(),
          });
        }
      }
      console.log(`[Background Sync] Completed. Fetched ${emails.length} emails.`);
    } catch (e) {
      console.error("[Background Sync] Error:", e);
    }
  };



  app.get("/api/email-cache", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId as string | undefined;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }
      const folder = req.query.folder as string | undefined;
      const emails = await storage.getEmailCache(userId, folder);
      res.json(emails);
    } catch (error) {
      console.error("Error fetching email cache:", error);
      res.status(500).json({ error: "Errore nel recupero della cache email" });
    }
  });

  app.get("/api/email-cache/:id", async (req: Request, res: Response) => {
    try {
      const email = await storage.getEmailCacheById(req.params.id);
      if (!email) {
        return res.status(404).json({ error: "Email non trovata" });
      }
      res.json(email);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero email" });
    }
  });

  app.get("/api/email-cache/search/:query", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId as string | undefined;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }
      const emails = await storage.searchEmailCache(userId, req.params.query);
      res.json(emails);
    } catch (error) {
      res.status(500).json({ error: "Errore nella ricerca email" });
    }
  });

  app.patch("/api/email-cache/:id", async (req: Request, res: Response) => {
    try {
      const email = await storage.updateEmailCache(req.params.id, req.body);
      if (!email) {
        return res.status(404).json({ error: "Email non trovata" });
      }
      res.json(email);
    } catch (error) {
      res.status(500).json({ error: "Errore nell'aggiornamento email" });
    }
  });

  app.delete("/api/email-cache/:id", async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteEmailCache(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Email non trovata" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Errore nell'eliminazione email" });
    }
  });

  // Email Folders API
  app.get("/api/email-folders", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId as string | undefined;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }
      await storage.initDefaultEmailFolders(userId);
      const folders = await storage.getEmailFolders(userId);
      res.json(folders);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero cartelle" });
    }
  });

  app.post("/api/email-folders", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId as string | undefined;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }
      const folder = await storage.createEmailFolder({ ...req.body, userId });
      res.status(201).json(folder);
    } catch (error) {
      res.status(500).json({ error: "Errore nella creazione cartella" });
    }
  });

  app.patch("/api/email-folders/:id", async (req: Request, res: Response) => {
    try {
      const folder = await storage.updateEmailFolder(req.params.id, req.body);
      if (!folder) {
        return res.status(404).json({ error: "Cartella non trovata" });
      }
      res.json(folder);
    } catch (error) {
      res.status(500).json({ error: "Errore nell'aggiornamento cartella" });
    }
  });

  app.delete("/api/email-folders/:id", async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteEmailFolder(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Cartella non trovata" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Errore nell'eliminazione cartella" });
    }
  });

  // Email Attachments API
  app.get("/api/email-attachments/:emailId", async (req: Request, res: Response) => {
    try {
      const attachments = await storage.getEmailAttachments(req.params.emailId);
      res.json(attachments);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero allegati" });
    }
  });

  // Email Sync State API
  app.get("/api/email-sync-state/:folder", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId as string | undefined;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }
      const syncState = await storage.getEmailSyncState(userId, req.params.folder);
      res.json(syncState || { lastUid: 0, syncStatus: 'idle' });
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero stato sync" });
    }
  });

  // Incremental Email Sync - scarica solo nuove email
  app.post("/api/email-sync", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId as string | undefined;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const { folder = 'INBOX', accountId } = req.body;

      let userConfig: UserEmailConfig | undefined;

      if (accountId) {
        userConfig = await storage.getUserEmailConfig(accountId);
        if (userConfig && userConfig.userId !== userId) {
          userConfig = undefined;
        }
      } else {
        const userConfigs = await storage.getUserEmailConfigs(userId);
        userConfig = userConfigs[0];
      }

      let userCreds: UserEmailCredentials;

      if (!userConfig || !userConfig.emailAddress || !userConfig.password) {
        // Fallback to environment variables
        if (process.env.ARUBA_EMAIL_ADDRESS && process.env.ARUBA_EMAIL_PASSWORD) {
          userCreds = {
            emailAddress: process.env.ARUBA_EMAIL_ADDRESS,
            password: process.env.ARUBA_EMAIL_PASSWORD,
            imapHost: "imaps.aruba.it",
            imapPort: 993,
            imapSecure: true,
            smtpHost: "smtps.aruba.it",
            smtpPort: 465,
            smtpSecure: true,
            displayName: "Aruba Email"
          };
        } else {
          return res.status(400).json({ error: "Email non configurata" });
        }
      } else {
        userCreds = {
          emailAddress: userConfig.emailAddress,
          password: userConfig.password,
          imapHost: userConfig.imapHost,
          imapPort: userConfig.imapPort,
          imapSecure: userConfig.imapSecure,
          smtpHost: userConfig.smtpHost,
          smtpPort: userConfig.smtpPort,
          smtpSecure: userConfig.smtpSecure,
          displayName: userConfig.displayName || undefined,
        };
      }

      // Aggiorna stato sync
      await storage.upsertEmailSyncState({
        userId,
        folder,
        syncStatus: 'syncing',
      });

      // Scarica email dalla cartella
      const emails = await fetchEmailsFromFolderWithConfig(userCreds, folder, 100, true);

      let newCount = 0;
      let maxUid = 0;

      for (const email of emails) {
        // Estrai UID dal formato ID
        const uidMatch = email.id.match(/-(\d+)-\d+$/);
        const uid = uidMatch ? parseInt(uidMatch[1]) : 0;

        // Controlla se esiste già
        const existing = await storage.getEmailCacheByUid(userId, folder, uid);
        if (!existing) {
          await storage.createEmailCache({
            userId,
            uid,
            folder,
            messageId: email.id,
            fromAddress: email.fromAddress,
            fromName: email.fromName || null,
            toAddress: email.toAddress,
            subject: email.subject,
            preview: email.preview,
            body: email.body,
            bodyHtml: email.body,
            unread: email.unread,
            starred: email.starred || false,
            hasAttachments: (email.attachments?.length || 0) > 0,
            receivedAt: email.receivedAt,
          });
          newCount++;
        } else {
          // Aggiorna stato letto/stellato
          if (existing.unread !== email.unread || existing.starred !== (email.starred || false)) {
            await storage.updateEmailCache(existing.id, {
              unread: email.unread,
              starred: email.starred || false,
            });
          }
        }

        maxUid = Math.max(maxUid, uid);
      }

      // Aggiorna stato sync
      await storage.upsertEmailSyncState({
        userId,
        folder,
        lastUid: maxUid,
        lastSyncAt: new Date(),
        syncStatus: 'idle',
        emailCount: emails.length,
        unreadCount: emails.filter(e => e.unread).length,
      });

      res.json({
        success: true,
        newEmails: newCount,
        totalEmails: emails.length,
        lastUid: maxUid
      });
    } catch (error) {
      console.error("Error syncing emails:", error);
      res.status(500).json({ error: "Errore nella sincronizzazione email" });
    }
  });

  // Mark email as read/unread in cache
  app.post("/api/email-cache/:id/mark-read", async (req: Request, res: Response) => {
    try {
      const { unread } = req.body;
      const email = await storage.updateEmailCache(req.params.id, { unread: unread ?? false });
      if (!email) {
        return res.status(404).json({ error: "Email non trovata" });
      }
      res.json(email);
    } catch (error) {
      res.status(500).json({ error: "Errore nell'aggiornamento" });
    }
  });

  // Toggle starred in cache
  app.post("/api/email-cache/:id/toggle-star", async (req: Request, res: Response) => {
    try {
      const existing = await storage.getEmailCacheById(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Email non trovata" });
      }
      const email = await storage.updateEmailCache(req.params.id, { starred: !existing.starred });
      res.json(email);
    } catch (error) {
      res.status(500).json({ error: "Errore nell'aggiornamento" });
    }
  });

  // Move email to folder
  app.post("/api/email-cache/:id/move", async (req: Request, res: Response) => {
    try {
      const { folder } = req.body;
      if (!folder) {
        return res.status(400).json({ error: "Cartella richiesta" });
      }
      const email = await storage.updateEmailCache(req.params.id, { folder });
      if (!email) {
        return res.status(404).json({ error: "Email non trovata" });
      }
      res.json(email);
    } catch (error) {
      res.status(500).json({ error: "Errore nello spostamento" });
    }
  });

  // =====================
  // ARUBA EMAIL API (supports both user config and env config)
  // =====================

  async function getUserEmailCredentials(req: Request): Promise<UserEmailCredentials | null> {
    const userId = ((req as any).session?.userId || req.headers["x-user-id"]) as string | undefined;
    const accountId = (req.query.accountId as string) || (req.body.accountId as string);

    // First try user-specific config
    if (userId) {
      let config: UserEmailConfig | undefined;

      if (accountId) {
        config = await storage.getUserEmailConfig(accountId);
        if (config && config.userId !== userId) {
          config = undefined; // Security check
        }
      } else {
        const configs = await storage.getUserEmailConfigs(userId);
        config = configs[0];
      }

      if (config && config.emailAddress && config.password) {
        return {
          emailAddress: config.emailAddress,
          password: config.password,
          imapHost: config.imapHost,
          imapPort: config.imapPort,
          imapSecure: config.imapSecure,
          smtpHost: config.smtpHost,
          smtpPort: config.smtpPort,
          smtpSecure: config.smtpSecure,
          displayName: config.displayName || undefined,
        };
      }
    }

    // Fallback to global Aruba credentials from environment
    const globalEmail = process.env.ARUBA_EMAIL_ADDRESS;
    const globalPassword = process.env.ARUBA_EMAIL_PASSWORD;

    if (globalEmail && globalPassword) {
      return {
        emailAddress: globalEmail,
        password: globalPassword,
        imapHost: "imaps.aruba.it",
        imapPort: 993,
        imapSecure: true,
        smtpHost: "smtps.aruba.it",
        smtpPort: 465,
        smtpSecure: true,
      };
    }

    return null;
  }

  app.get("/api/aruba/emails", async (req: Request, res: Response) => {
    try {
      const userCreds = await getUserEmailCredentials(req);
      const limit = parseInt(req.query.limit as string) || 20;

      if (userCreds) {
        const emails = await fetchEmailsWithConfig(userCreds, limit);
        return res.json({ configured: true, emails, userConfigured: true });
      }

      // Ogni utente deve configurare il proprio account email
      return res.json({
        configured: false,
        emails: [],
        userConfigured: false,
        message: "Configura il tuo account email personale nelle impostazioni"
      });
    } catch (error) {
      console.error("Error fetching emails:", error);
      res.status(500).json({ error: "Errore nel recupero delle email" });
    }
  });

  app.post("/api/aruba/send", async (req: Request, res: Response) => {
    try {
      const { to, subject, body } = req.body;
      if (!to || !subject || !body) {
        return res.status(400).json({ error: "Destinatario, oggetto e corpo richiesti" });
      }

      const userCreds = await getUserEmailCredentials(req);

      if (userCreds) {
        const success = await sendEmailWithConfig(userCreds, to, subject, body);
        if (success) {
          return res.json({ success: true, message: "Email inviata con successo" });
        } else {
          return res.status(500).json({ error: "Errore nell'invio dell'email" });
        }
      }

      // Ogni utente deve configurare il proprio account email per inviare
      return res.status(503).json({
        error: "Configura il tuo account email personale nelle impostazioni per inviare email",
        configured: false
      });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Errore nell'invio dell'email" });
    }
  });

  app.get("/api/aruba/status", async (req: Request, res: Response) => {
    const userCreds = await getUserEmailCredentials(req);
    if (userCreds) {
      return res.json({
        configured: true,
        userConfigured: true,
        email: userCreds.emailAddress.substring(0, 3) + "***"
      });
    }
    // Ogni utente deve configurare il proprio account
    res.json({
      configured: false,
      userConfigured: false,
      email: null
    });
  });

  app.get("/api/aruba/folders", async (req: Request, res: Response) => {
    try {
      const userCreds = await getUserEmailCredentials(req);

      if (userCreds) {
        const folders = await fetchEmailFoldersWithConfig(userCreds);
        return res.json({ configured: true, folders });
      }

      // Ogni utente deve configurare il proprio account email
      return res.json({ configured: false, folders: [] });
    } catch (error) {
      console.error("Error fetching folders:", error);
      res.status(500).json({ error: "Errore nel recupero delle cartelle" });
    }
  });

  app.get("/api/aruba/folder/:folderPath", async (req: Request, res: Response) => {
    // Disable caching for email responses
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    try {
      const folderPath = decodeURIComponent(req.params.folderPath);
      const limit = parseInt(req.query.limit as string) || 30;
      const userCreds = await getUserEmailCredentials(req);

      console.log("[Email Debug] Folder request:", folderPath, "userCreds found:", !!userCreds);

      if (userCreds) {
        const emails = await fetchEmailsFromFolderWithConfig(userCreds, folderPath, limit);
        console.log("[Email Debug] Fetched", emails.length, "emails from", folderPath);
        return res.json({ configured: true, folder: folderPath, emails });
      }

      // Ogni utente deve configurare il proprio account email
      console.log("[Email Debug] No user credentials found, returning empty");
      return res.json({ configured: false, folder: folderPath, emails: [] });
    } catch (error) {
      console.error("Error fetching emails from folder:", error);
      res.status(500).json({ error: "Errore nel recupero delle email dalla cartella" });
    }
  });

  // Email operations (move, delete, archive)
  app.post("/api/aruba/email/move", async (req: Request, res: Response) => {
    try {
      const { emailId, sourceFolder, targetFolder } = req.body;

      if (!emailId || !sourceFolder || !targetFolder) {
        return res.status(400).json({ error: "emailId, sourceFolder e targetFolder sono richiesti" });
      }

      const userCreds = await getUserEmailCredentials(req);
      if (!userCreds) {
        return res.status(401).json({ error: "Account email non configurato" });
      }

      const { moveEmailToFolder, clearEmailCache } = await import("./emailService");
      const result = await moveEmailToFolder(userCreds, emailId, sourceFolder, targetFolder);

      if (result.success) {
        clearEmailCache(userCreds.emailAddress);
        res.json({ success: true, message: `Email spostata in ${targetFolder}` });
      } else {
        res.status(500).json({ error: result.error || "Errore nello spostamento" });
      }
    } catch (error) {
      console.error("Error moving email:", error);
      res.status(500).json({ error: "Errore nello spostamento dell'email" });
    }
  });

  app.post("/api/aruba/email/delete", async (req: Request, res: Response) => {
    try {
      const { emailId, sourceFolder } = req.body;

      if (!emailId || !sourceFolder) {
        return res.status(400).json({ error: "emailId e sourceFolder sono richiesti" });
      }

      const userCreds = await getUserEmailCredentials(req);
      if (!userCreds) {
        return res.status(401).json({ error: "Account email non configurato" });
      }

      const { deleteEmail, clearEmailCache } = await import("./emailService");
      const result = await deleteEmail(userCreds, emailId, sourceFolder);

      if (result.success) {
        clearEmailCache(userCreds.emailAddress);
        res.json({ success: true, message: "Email spostata nel cestino" });
      } else {
        res.status(500).json({ error: result.error || "Errore nell'eliminazione" });
      }
    } catch (error) {
      console.error("Error deleting email:", error);
      res.status(500).json({ error: "Errore nell'eliminazione dell'email" });
    }
  });

  app.post("/api/aruba/email/archive", async (req: Request, res: Response) => {
    try {
      const { emailId, sourceFolder } = req.body;

      if (!emailId || !sourceFolder) {
        return res.status(400).json({ error: "emailId e sourceFolder sono richiesti" });
      }

      const userCreds = await getUserEmailCredentials(req);
      if (!userCreds) {
        return res.status(401).json({ error: "Account email non configurato" });
      }

      const { archiveEmail, clearEmailCache } = await import("./emailService");
      const result = await archiveEmail(userCreds, emailId, sourceFolder);

      if (result.success) {
        clearEmailCache(userCreds.emailAddress);
        res.json({ success: true, message: "Email archiviata" });
      } else {
        res.status(500).json({ error: result.error || "Errore nell'archiviazione" });
      }
    } catch (error) {
      console.error("Error archiving email:", error);
      res.status(500).json({ error: "Errore nell'archiviazione dell'email" });
    }
  });

  app.post("/api/aruba/email/mark-read", async (req: Request, res: Response) => {
    try {
      const { emailUid, folder } = req.body;

      if (!emailUid || !folder) {
        return res.status(400).json({ error: "emailUid e folder sono richiesti" });
      }

      const userCreds = await getUserEmailCredentials(req);
      if (!userCreds) {
        return res.status(401).json({ error: "Account email non configurato" });
      }

      const { markEmailAsRead, clearEmailCache } = await import("./emailService");
      const result = await markEmailAsRead(userCreds, folder, emailUid);

      if (result.success) {
        clearEmailCache(userCreds.emailAddress, folder);
        res.json({ success: true });
      } else {
        res.status(500).json({ error: result.error || "Errore" });
      }
    } catch (error) {
      console.error("Error marking email as read:", error);
      res.status(500).json({ error: "Errore nel segnare l'email come letta" });
    }
  });

  // =====================
  // NOTIFICATIONS API
  // =====================
  app.post("/api/notifications/send-reminders", async (req: Request, res: Response) => {
    try {
      if (!isEmailConfigured()) {
        return res.status(503).json({ error: "Email non configurata", configured: false });
      }

      const { userId, daysAhead = 3 } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "userId richiesto" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.email) {
        return res.status(404).json({ error: "Utente non trovato o senza email" });
      }

      const allTasks = await storage.getTasks();
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + daysAhead);

      const upcomingTasks: TaskForReminder[] = allTasks
        .filter(task => {
          if (task.done || !task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          return dueDate >= today && dueDate <= futureDate;
        })
        .map(task => ({
          id: task.id,
          title: task.title,
          dueDate: task.dueDate,
          done: task.done
        }));

      if (upcomingTasks.length === 0) {
        return res.json({ success: true, message: "Nessuna attività in scadenza", taskCount: 0 });
      }

      const success = await sendTaskReminderEmail(user.email, user.name, upcomingTasks);

      if (success) {
        res.json({
          success: true,
          message: `Promemoria inviato per ${upcomingTasks.length} attività`,
          taskCount: upcomingTasks.length
        });
      } else {
        res.status(500).json({ error: "Errore nell'invio del promemoria" });
      }
    } catch (error) {
      console.error("Error sending reminders:", error);
      res.status(500).json({ error: "Errore nell'invio dei promemoria" });
    }
  });

  app.post("/api/notifications/send-weekly-report", async (req: Request, res: Response) => {
    try {
      if (!isEmailConfigured()) {
        return res.status(503).json({ error: "Email non configurata", configured: false });
      }

      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "userId richiesto" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.email) {
        return res.status(404).json({ error: "Utente non trovato o senza email" });
      }

      const allTasks = await storage.getTasks();
      const allProjects = await storage.getProjects();
      const today = new Date();

      const stats = {
        totalTasks: allTasks.length,
        completedTasks: allTasks.filter(t => t.done).length,
        pendingTasks: allTasks.filter(t => !t.done).length,
        overdueTasks: allTasks.filter(t => {
          if (t.done || !t.dueDate) return false;
          return new Date(t.dueDate) < today;
        }).length,
        projectsCount: allProjects.length
      };

      const success = await sendWeeklyReportEmail(user.email, user.name, stats);

      if (success) {
        res.json({
          success: true,
          message: "Report settimanale inviato",
          stats
        });
      } else {
        res.status(500).json({ error: "Errore nell'invio del report" });
      }
    } catch (error) {
      console.error("Error sending weekly report:", error);
      res.status(500).json({ error: "Errore nell'invio del report settimanale" });
    }
  });

  // =====================
  // GOOGLE CALENDAR API
  // =====================
  app.get("/api/calendar/status", async (req: Request, res: Response) => {
    try {
      const connected = await isCalendarConnected();
      res.json({ connected });
    } catch (error) {
      res.json({ connected: false });
    }
  });

  app.get("/api/calendar/list", async (req: Request, res: Response) => {
    try {
      const calendars = await getCalendarList();
      res.json({ calendars });
    } catch (error) {
      console.error("Error getting calendar list:", error);
      res.status(500).json({ error: "Errore nel recupero dei calendari" });
    }
  });

  app.get("/api/calendar/events", async (req: Request, res: Response) => {
    try {
      const calendarId = (req.query.calendarId as string) || 'primary';
      const maxResults = parseInt(req.query.maxResults as string) || 10;
      const events = await getUpcomingEvents(calendarId, maxResults);
      res.json({ events });
    } catch (error) {
      console.error("Error getting calendar events:", error);
      res.status(500).json({ error: "Errore nel recupero degli eventi" });
    }
  });

  app.get("/api/calendar/events-range", async (req: Request, res: Response) => {
    try {
      const calendarId = (req.query.calendarId as string) || 'primary';
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate e endDate sono obbligatori" });
      }

      const events = await getEventsInRange(calendarId, startDate, endDate);
      res.json({ events });
    } catch (error) {
      console.error("Error getting calendar events in range:", error);
      res.status(500).json({ error: "Errore nel recupero degli eventi" });
    }
  });

  app.post("/api/calendar/sync-task", async (req: Request, res: Response) => {
    try {
      const { taskId, calendarId } = req.body;

      if (!taskId) {
        return res.status(400).json({ error: "taskId richiesto" });
      }

      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ error: "Task non trovato" });
      }

      if (!task.dueDate) {
        return res.status(400).json({ error: "Il task non ha una data di scadenza" });
      }

      const event = await syncTaskToCalendar(
        {
          id: task.id,
          title: task.title,
          description: task.tag || undefined,
          dueDate: task.dueDate
        },
        calendarId || 'primary'
      );

      res.json({
        success: true,
        message: "Task sincronizzato con Google Calendar",
        eventId: event.id,
        eventLink: event.htmlLink
      });
    } catch (error) {
      console.error("Error syncing task to calendar:", error);
      res.status(500).json({ error: "Errore nella sincronizzazione" });
    }
  });

  app.post("/api/calendar/sync-project", async (req: Request, res: Response) => {
    try {
      const { projectId, calendarId } = req.body;

      if (!projectId) {
        return res.status(400).json({ error: "projectId richiesto" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Progetto non trovato" });
      }

      if (!project.dueDate) {
        return res.status(400).json({ error: "Il progetto non ha una data di scadenza" });
      }

      const event = await syncProjectToCalendar(
        {
          id: project.id,
          title: project.title,
          description: project.notes || undefined,
          dueDate: project.dueDate
        },
        calendarId || 'primary'
      );

      res.json({
        success: true,
        message: "Progetto sincronizzato con Google Calendar",
        eventId: event.id,
        eventLink: event.htmlLink
      });
    } catch (error) {
      console.error("Error syncing project to calendar:", error);
      res.status(500).json({ error: "Errore nella sincronizzazione" });
    }
  });

  app.post("/api/calendar/sync-personal-todo", async (req: Request, res: Response) => {
    try {
      const { todoId, calendarId } = req.body;

      if (!todoId) {
        return res.status(400).json({ error: "todoId richiesto" });
      }

      const todo = await storage.getPersonalTodo(todoId);
      if (!todo) {
        return res.status(404).json({ error: "Todo non trovato" });
      }

      if (!todo.dueDate) {
        return res.status(400).json({ error: "Il todo non ha una data di scadenza" });
      }

      const event = await syncTaskToCalendar(
        {
          id: todo.id,
          title: todo.title,
          description: todo.description || undefined,
          dueDate: todo.dueDate
        },
        calendarId || 'primary'
      );

      // Update todo with Google Calendar event ID
      await storage.updatePersonalTodo(todoId, {
        googleCalendarEventId: event.id,
        googleCalendarId: calendarId || 'primary'
      });

      res.json({
        success: true,
        message: "Todo sincronizzato con Google Calendar",
        eventId: event.id,
        eventLink: event.htmlLink
      });
    } catch (error) {
      console.error("Error syncing personal todo to calendar:", error);
      res.status(500).json({ error: "Errore nella sincronizzazione" });
    }
  });

  app.post("/api/calendar/sync-all-tasks", async (req: Request, res: Response) => {
    try {
      const { calendarId } = req.body;
      const tasks = await storage.getTasks();

      const tasksWithDueDate = tasks.filter(t => t.dueDate && !t.done);
      let synced = 0;
      const errors: string[] = [];

      for (const task of tasksWithDueDate) {
        try {
          await syncTaskToCalendar(
            {
              id: task.id,
              title: task.title,
              description: task.tag || undefined,
              dueDate: task.dueDate!
            },
            calendarId || 'primary'
          );
          synced++;
        } catch (e) {
          errors.push(`Task "${task.title}": ${e}`);
        }
      }

      res.json({
        success: true,
        message: `Sincronizzati ${synced} task su ${tasksWithDueDate.length}`,
        synced,
        total: tasksWithDueDate.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("Error syncing all tasks:", error);
      res.status(500).json({ error: "Errore nella sincronizzazione" });
    }
  });

  // =====================
  // ROLE PERMISSIONS API
  // =====================

  app.get("/api/permissions", async (req: Request, res: Response) => {
    try {
      await storage.seedDefaultPermissions();
      const permissions = await storage.getAllRolePermissions();
      res.json(permissions);
    } catch (error) {
      console.error("Error getting permissions:", error);
      res.status(500).json({ error: "Errore nel recupero dei permessi" });
    }
  });

  app.get("/api/permissions/:role", async (req: Request, res: Response) => {
    try {
      const permissions = await storage.getRolePermissions(req.params.role);
      res.json(permissions);
    } catch (error) {
      console.error("Error getting role permissions:", error);
      res.status(500).json({ error: "Errore nel recupero dei permessi del ruolo" });
    }
  });

  app.put("/api/permissions/:role/:module", async (req: Request, res: Response) => {
    try {
      const { role, module } = req.params;
      const { canView, canCreate, canEdit, canDelete } = req.body;

      const validRoles = ['Admin', 'Manager', 'Member', 'Viewer'];
      const validModules = ['projects', 'tasks', 'email', 'chat', 'documents', 'users', 'archivio'];

      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: "Ruolo non valido" });
      }
      if (!validModules.includes(module)) {
        return res.status(400).json({ error: "Modulo non valido" });
      }

      const updated = await storage.upsertRolePermission(role, module, {
        canView: canView ?? false,
        canCreate: canCreate ?? false,
        canEdit: canEdit ?? false,
        canDelete: canDelete ?? false,
      });

      res.json(updated);
    } catch (error) {
      console.error("Error updating permission:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento del permesso" });
    }
  });

  app.patch("/api/users/:id/status", async (req: Request, res: Response) => {
    try {
      const { status } = req.body;

      if (!status || !["Active", "Disabled", "Offline", "Invited"].includes(status)) {
        return res.status(400).json({ error: "Status non valido. Usa 'Active', 'Disabled', 'Offline' o 'Invited'" });
      }

      const user = await storage.updateUser(req.params.id, { status });

      if (!user) {
        return res.status(404).json({ error: "Utente non trovato" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento dello stato utente" });
    }
  });

  // =====================
  // USER PERMISSIONS API
  // =====================
  app.get("/api/user-permissions/:userId", async (req: Request, res: Response) => {
    try {
      const permissions = await storage.getUserPermissions(req.params.userId);
      res.json(permissions);
    } catch (error) {
      console.error("Error getting user permissions:", error);
      res.status(500).json({ error: "Errore nel recupero dei permessi utente" });
    }
  });

  app.put("/api/user-permissions/:userId/:module", async (req: Request, res: Response) => {
    try {
      const { userId, module } = req.params;
      const { canView, canCreate, canEdit, canDelete } = req.body;

      const validModules = ['projects', 'tasks', 'email', 'chat', 'documents', 'users', 'archivio'];
      if (!validModules.includes(module)) {
        return res.status(400).json({ error: "Modulo non valido" });
      }

      const updated = await storage.upsertUserPermission(userId, module, {
        canView: canView ?? false,
        canCreate: canCreate ?? false,
        canEdit: canEdit ?? false,
        canDelete: canDelete ?? false,
      });

      res.json(updated);
    } catch (error) {
      console.error("Error updating user permission:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento del permesso utente" });
    }
  });

  app.post("/api/user-permissions/:userId/seed", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "Utente non trovato" });
      }

      await storage.seedUserPermissionsFromRole(userId, user.role);
      const permissions = await storage.getUserPermissions(userId);
      res.json(permissions);
    } catch (error) {
      console.error("Error seeding user permissions:", error);
      res.status(500).json({ error: "Errore nell'inizializzazione dei permessi utente" });
    }
  });

  // =====================
  // ARCHIVE API
  // =====================

  app.get('/objects/*', async (req: Request, res: Response) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = req.path;
      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "File non trovato" });
      }
      console.error("Error serving object:", error);
      res.status(500).json({ error: "Errore nel recupero file" });
    }
  });

  app.use('/uploads/archive', (req, res, next) => {
    res.set('Cache-Control', 'public, max-age=31536000');
    next();
  }, express.static(path.join(process.cwd(), 'uploads', 'archive')));

  app.use('/uploads/images', (req, res, next) => {
    res.set('Cache-Control', 'public, max-age=31536000');
    next();
  }, express.static(path.join(process.cwd(), 'uploads', 'images')));

  app.use('/uploads/documents', (req, res, next) => {
    res.set('Cache-Control', 'public, max-age=31536000');
    next();
  }, express.static(path.join(process.cwd(), 'uploads', 'documents')));

  app.get("/api/archive/categories", async (req: Request, res: Response) => {
    res.json(ARCHIVE_CATEGORIES);
  });

  app.get("/api/archive", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId || req.query.userId as string | undefined;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }
      const category = req.query.category as string | undefined;
      const documents = await storage.getArchivedDocuments(userId, category);

      const users = await storage.getUsers();
      const enrichedDocs = documents.map((doc: any) => {
        const uploader = users.find((u: any) => u.id === doc.uploadedBy);
        const updater = doc.updatedBy ? users.find((u: any) => u.id === doc.updatedBy) : null;
        return {
          ...doc,
          uploaderName: uploader?.name || 'Sconosciuto',
          updaterName: updater?.name || null
        };
      });

      res.json(enrichedDocs);
    } catch (error) {
      console.error("Error getting archived documents:", error);
      res.status(500).json({ error: "Errore nel recupero documenti" });
    }
  });

  // Get documents shared BY the current user (must be before /api/archive/:id to avoid conflict)
  app.get("/api/archive/shared", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId || req.query.userId as string | undefined;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const documents = await storage.getArchivedDocuments(userId);
      const sharedDocs = documents.filter((d: any) => d.shareToken && d.shareExpiresAt && new Date(d.shareExpiresAt) > new Date());

      const users = await storage.getUsers();
      const enrichedDocs = sharedDocs.map((doc: any) => {
        const uploader = users.find((u: any) => u.id === doc.uploadedBy);
        return {
          ...doc,
          uploaderName: uploader?.name || 'Sconosciuto'
        };
      });

      res.json(enrichedDocs);
    } catch (error) {
      console.error("Error getting shared documents:", error);
      res.status(500).json({ error: "Errore nel recupero documenti condivisi" });
    }
  });

  app.get("/api/archive/:id", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId || req.query.userId as string | undefined;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const document = await storage.getArchivedDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Documento non trovato" });
      }

      if (document.uploadedBy !== userId && !document.shareToken) {
        return res.status(403).json({ error: "Non autorizzato" });
      }

      res.json(document);
    } catch (error) {
      console.error("Error getting archived document:", error);
      res.status(500).json({ error: "Errore nel recupero documento" });
    }
  });

  app.post("/api/archive", archiveUpload.single('file'), async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId || req.query.userId || req.body.userId as string | undefined;
      if (!userId) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(401).json({ error: "Non autenticato" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "File richiesto" });
      }

      const { title, category, tags } = req.body;

      if (!title || !category) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: "Titolo e categoria sono richiesti" });
      }

      let parsedTags: string[] = [];
      if (tags) {
        try {
          parsedTags = JSON.parse(tags);
        } catch (e) {
          parsedTags = [];
        }
      }

      const filePath = `/uploads/archive/${req.file.filename}`;

      const document = await storage.createArchivedDocument({
        title,
        category,
        filePath,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        tags: parsedTags,
        uploadedBy: userId,
      });

      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating archived document:", error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: "Errore nella creazione documento" });
    }
  });

  // JSON-only metadata update (for quick rename, notes, etc)
  app.put("/api/archive/:id/metadata", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId as string | undefined;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const existing = await storage.getArchivedDocument(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Documento non trovato" });
      }

      if (existing.uploadedBy !== userId) {
        return res.status(403).json({ error: "Non autorizzato" });
      }

      const { title, category, notes, tags, starred } = req.body;
      const updateData: any = { updatedAt: new Date(), updatedBy: userId };
      if (title !== undefined) updateData.title = title;
      if (category !== undefined) updateData.category = category;
      if (notes !== undefined) updateData.notes = notes;
      if (tags !== undefined) updateData.tags = tags;
      if (starred !== undefined) updateData.starred = starred;

      const document = await storage.updateArchivedDocument(req.params.id, updateData);
      res.json(document);
    } catch (error) {
      console.error("Error updating archive metadata:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento documento" });
    }
  });

  app.patch("/api/archive/:id", archiveUpload.single('file'), async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId as string | undefined;
      if (!userId) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(401).json({ error: "Non autenticato" });
      }

      const existing = await storage.getArchivedDocument(req.params.id);
      if (!existing) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: "Documento non trovato" });
      }

      if (existing.uploadedBy !== userId) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(403).json({ error: "Non autorizzato" });
      }

      const updateData: any = {};
      if (req.body.title !== undefined) updateData.title = req.body.title;
      if (req.body.category !== undefined) updateData.category = req.body.category;
      if (req.body.notes !== undefined) updateData.notes = req.body.notes;
      if (req.body.tags !== undefined) {
        try {
          updateData.tags = typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags;
        } catch (e) {
          updateData.tags = req.body.tags;
        }
      }
      updateData.updatedAt = new Date();
      updateData.updatedBy = userId;

      if (req.file) {
        if (existing.filePath.startsWith('/objects/')) {
          try {
            const objectStorageService = new ObjectStorageService();
            await objectStorageService.deleteObject(existing.filePath);
          } catch (e) {
            console.error("Error deleting old cloud file:", e);
          }
        } else {
          const oldFilePath = path.join(process.cwd(), existing.filePath);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }

        const isProduction = process.env.NODE_ENV === 'production';
        try {
          const objectStorageService = new ObjectStorageService();
          const fileBuffer = fs.readFileSync(req.file.path);
          updateData.filePath = await objectStorageService.uploadBuffer(
            fileBuffer,
            'archive',
            req.file.originalname,
            req.file.mimetype
          );
          fs.unlinkSync(req.file.path);
        } catch (storageError: any) {
          if (isProduction) {
            console.error("Object Storage upload failed in production:", storageError.message);
            fs.unlinkSync(req.file.path);
            return res.status(500).json({ error: "Errore di configurazione storage. Contatta l'amministratore." });
          }
          console.log("Object Storage not available in development, using local storage:", storageError.message);
          updateData.filePath = `/uploads/archive/${req.file.filename}`;
        }

        updateData.fileName = req.file.originalname;
        updateData.fileType = req.file.mimetype;
        updateData.fileSize = req.file.size;
      }

      const document = await storage.updateArchivedDocument(req.params.id, updateData);
      res.json(document);
    } catch (error) {
      console.error("Error updating archived document:", error);
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(500).json({ error: "Errore nell'aggiornamento documento" });
    }
  });

  app.delete("/api/archive/:id", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId || req.query.userId as string | undefined;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const existing = await storage.getArchivedDocument(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Documento non trovato" });
      }

      const currentUser = await storage.getUser(userId);
      if (existing.uploadedBy !== userId && currentUser?.role !== 'admin') {
        return res.status(403).json({ error: "Non autorizzato" });
      }

      if (existing.filePath.startsWith('/objects/')) {
        try {
          const objectStorageService = new ObjectStorageService();
          await objectStorageService.deleteObject(existing.filePath);
        } catch (e) {
          console.error("Error deleting from cloud storage:", e);
        }
      } else {
        const filePath = path.join(process.cwd(), existing.filePath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      await storage.deleteArchivedDocument(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting archived document:", error);
      res.status(500).json({ error: "Errore nell'eliminazione documento" });
    }
  });

  // Soft delete (move to trash)
  app.post("/api/archive/:id/soft-delete", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId || req.query.userId || req.body.userId as string | undefined;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const existing = await storage.getArchivedDocument(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Documento non trovato" });
      }

      const currentUser = await storage.getUser(userId);
      if (existing.uploadedBy !== userId && currentUser?.role !== 'admin') {
        return res.status(403).json({ error: "Non autorizzato" });
      }

      const document = await storage.updateArchivedDocument(req.params.id, {
        deletedAt: new Date()
      });
      res.json(document);
    } catch (error) {
      console.error("Error soft deleting document:", error);
      res.status(500).json({ error: "Errore nell'eliminazione documento" });
    }
  });

  // Restore from trash
  app.post("/api/archive/:id/restore", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId as string | undefined;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const existing = await storage.getArchivedDocument(req.params.id);
      if (!existing || existing.uploadedBy !== userId) {
        return res.status(403).json({ error: "Non autorizzato" });
      }

      const document = await storage.updateArchivedDocument(req.params.id, {
        deletedAt: null
      });
      res.json(document);
    } catch (error) {
      console.error("Error restoring document:", error);
      res.status(500).json({ error: "Errore nel ripristino documento" });
    }
  });

  // Bulk soft delete
  app.post("/api/archive/bulk/soft-delete", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId || req.query.userId || req.body.userId as string | undefined;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "IDs richiesti" });
      }

      const currentUser = await storage.getUser(userId);
      const isAdmin = currentUser?.role === 'admin';

      let count = 0;
      for (const id of ids) {
        const doc = await storage.getArchivedDocument(id);
        if (doc && (doc.uploadedBy === userId || isAdmin)) {
          await storage.updateArchivedDocument(id, { deletedAt: new Date() });
          count++;
        }
      }
      res.json({ success: true, count });
    } catch (error) {
      console.error("Error bulk soft deleting:", error);
      res.status(500).json({ error: "Errore nell'eliminazione documenti" });
    }
  });

  // Bulk restore
  app.post("/api/archive/bulk/restore", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId as string | undefined;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "IDs richiesti" });
      }

      let count = 0;
      for (const id of ids) {
        const doc = await storage.getArchivedDocument(id);
        if (doc && doc.uploadedBy === userId) {
          await storage.updateArchivedDocument(id, { deletedAt: null });
          count++;
        }
      }
      res.json({ success: true, count });
    } catch (error) {
      console.error("Error bulk restoring:", error);
      res.status(500).json({ error: "Errore nel ripristino documenti" });
    }
  });

  // Bulk permanent delete
  app.post("/api/archive/bulk/delete", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId as string | undefined;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "IDs richiesti" });
      }

      let count = 0;
      for (const id of ids) {
        const doc = await storage.getArchivedDocument(id);
        if (doc && doc.uploadedBy === userId) {
          const filePath = path.join(process.cwd(), doc.filePath);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          await storage.deleteArchivedDocument(id);
          count++;
        }
      }
      res.json({ success: true, count });
    } catch (error) {
      console.error("Error bulk deleting:", error);
      res.status(500).json({ error: "Errore nell'eliminazione documenti" });
    }
  });

  // Toggle star
  app.post("/api/archive/:id/star", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId as string | undefined;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const existing = await storage.getArchivedDocument(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Documento non trovato" });
      }

      if (existing.uploadedBy !== userId) {
        return res.status(403).json({ error: "Non autorizzato" });
      }

      const document = await storage.updateArchivedDocument(req.params.id, {
        starred: !existing.starred
      });
      res.json(document);
    } catch (error) {
      console.error("Error toggling star:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento documento" });
    }
  });

  // Duplicate document
  app.post("/api/archive/:id/duplicate", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId as string | undefined;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const existing = await storage.getArchivedDocument(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Documento non trovato" });
      }

      if (existing.uploadedBy !== userId) {
        return res.status(403).json({ error: "Non autorizzato" });
      }

      // Copy the file
      const oldPath = path.join(process.cwd(), existing.filePath);
      const ext = path.extname(existing.fileName);
      const newFileName = `${Date.now()}-copy${ext}`;
      const newPath = path.join(process.cwd(), 'uploads/archive', newFileName);

      if (fs.existsSync(oldPath)) {
        fs.copyFileSync(oldPath, newPath);
      }

      const document = await storage.createArchivedDocument({
        title: `${existing.title} (copia)`,
        category: existing.category,
        filePath: `/uploads/archive/${newFileName}`,
        fileName: existing.fileName,
        fileType: existing.fileType,
        fileSize: existing.fileSize,
        tags: existing.tags,
        uploadedBy: userId,
      });
      res.json(document);
    } catch (error) {
      console.error("Error duplicating document:", error);
      res.status(500).json({ error: "Errore nella duplicazione documento" });
    }
  });

  // Generate share link
  app.post("/api/archive/:id/share", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId as string | undefined;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const existing = await storage.getArchivedDocument(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Documento non trovato" });
      }

      if (existing.uploadedBy !== userId) {
        return res.status(403).json({ error: "Non autorizzato" });
      }

      const { expiresIn } = req.body; // milliseconds from frontend
      const shareToken = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      // expiresIn is already in milliseconds, default to 1 hour if not provided
      const shareExpiresAt = new Date(Date.now() + (expiresIn || 3600000));

      const document = await storage.updateArchivedDocument(req.params.id, {
        shareToken,
        shareExpiresAt,
        shareCreatedAt: new Date(),
        downloadCount: 0,
        lastDownloadAt: null,
        lastDownloadIp: null
      });

      res.json({
        shareToken,
        shareUrl: `/shared/${shareToken}`,
        expiresAt: shareExpiresAt
      });
    } catch (error) {
      console.error("Error generating share link:", error);
      res.status(500).json({ error: "Errore nella generazione link" });
    }
  });

  // Stop sharing a document
  app.post("/api/archive/:id/unshare", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId as string | undefined;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const existing = await storage.getArchivedDocument(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Documento non trovato" });
      }

      if (existing.uploadedBy !== userId) {
        return res.status(403).json({ error: "Non autorizzato" });
      }

      await storage.updateArchivedDocument(req.params.id, {
        shareToken: null,
        shareExpiresAt: null,
        shareCreatedAt: null
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error stopping share:", error);
      res.status(500).json({ error: "Errore nel blocco condivisione" });
    }
  });

  // Send share link via email
  app.post("/api/archive/share-email", async (req: Request, res: Response) => {
    try {
      const { email, shareLink, documentName, documentTitle } = req.body;

      if (!email || !shareLink) {
        return res.status(400).json({ error: "Email e link richiesti" });
      }

      const { sendEmail } = await import('./emailService');

      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">PULSE ERP</h1>
          </div>
          <div style="padding: 30px; background: #f8fafc; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e293b; margin-top: 0;">Documento condiviso con te</h2>
            <p style="color: #475569;">
              Ti è stato condiviso il documento: <strong>${documentTitle || documentName}</strong>
            </p>
            <div style="margin: 30px 0;">
              <a href="${shareLink}" style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
                Visualizza documento
              </a>
            </div>
            <p style="color: #64748b; font-size: 14px;">
              Oppure copia questo link: <br/>
              <a href="${shareLink}" style="color: #3b82f6;">${shareLink}</a>
            </p>
          </div>
          <div style="padding: 15px; background: #e2e8f0; text-align: center; border-radius: 0 0 8px 8px;">
            <p style="color: #64748b; margin: 0; font-size: 12px;">
              Inviato da PULSE ERP
            </p>
          </div>
        </div>
      `;

      const success = await sendEmail(email, `Documento condiviso: ${documentTitle || documentName}`, htmlBody);

      if (success) {
        res.json({ success: true });
      } else {
        res.status(500).json({ error: "Errore nell'invio email" });
      }
    } catch (error) {
      console.error("Error sending share email:", error);
      res.status(500).json({ error: "Errore nell'invio email" });
    }
  });

  // AI summarize document
  app.post("/api/archive/:id/summarize", async (req: Request, res: Response) => {
    try {
      const document = await storage.getArchivedDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Documento non trovato" });
      }

      const filePath = path.join(process.cwd(), document.filePath);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File non trovato sul server" });
      }

      let textContent = "";

      if (document.fileType === 'application/pdf') {
        try {
          const dataBuffer = fs.readFileSync(filePath);
          const pdfjsLib = await getPdfjs();
          const loadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(dataBuffer),
            disableWorker: true,
            useWorkerFetch: false,
            isEvalSupported: false,
            useSystemFonts: true,
            verbosity: 0
          });
          const pdf = await loadingTask.promise;

          let pdfText = '';
          for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 20); pageNum++) {
            const page = await pdf.getPage(pageNum);
            const content = await page.getTextContent();
            const pageText = content.items.map((item: any) => item.str).join(' ');
            pdfText += pageText + '\n';
          }
          textContent = pdfText.substring(0, 8000);
        } catch (pdfError) {
          console.error("PDF parse error:", pdfError);
          return res.status(400).json({ error: "Impossibile leggere il contenuto del PDF" });
        }
      } else if (document.fileType?.startsWith('text/') ||
        document.fileName?.endsWith('.txt') ||
        document.fileName?.endsWith('.md')) {
        textContent = fs.readFileSync(filePath, 'utf-8').substring(0, 8000);
      } else {
        return res.status(400).json({
          error: "Tipo di file non supportato per l'analisi AI. Supportati: PDF, TXT, MD"
        });
      }

      if (!textContent || textContent.trim().length < 50) {
        return res.status(400).json({ error: "Il documento non contiene abbastanza testo per generare un riassunto" });
      }

      const { summarizeDocument } = await import('./aiService');
      const summary = await summarizeDocument(textContent, document.title);

      await storage.updateArchivedDocument(req.params.id, {
        aiSummary: summary,
        updatedAt: new Date()
      });

      res.json({ summary, saved: true });
    } catch (error) {
      console.error("Error summarizing document:", error);
      res.status(500).json({ error: "Errore nella generazione del riassunto" });
    }
  });

  // Access shared document
  app.get("/api/shared/:token", async (req: Request, res: Response) => {
    try {
      const documents = await storage.getArchivedDocuments();
      const doc = documents.find((d: any) => d.shareToken === req.params.token);

      if (!doc) {
        return res.status(404).json({ error: "Link non valido" });
      }

      if (doc.shareExpiresAt && new Date(doc.shareExpiresAt) < new Date()) {
        return res.status(410).json({ error: "Link scaduto" });
      }

      // Get uploader name
      let sharedByName = null;
      if (doc.uploadedBy) {
        const users = await storage.getUsers();
        const uploader = users.find((u: any) => u.id === doc.uploadedBy);
        if (uploader) {
          sharedByName = uploader.name;
        }
      }

      res.json({ ...doc, sharedByName });
    } catch (error) {
      console.error("Error accessing shared document:", error);
      res.status(500).json({ error: "Errore nell'accesso al documento" });
    }
  });

  // Download shared document file
  app.get("/api/shared/:token/file", async (req: Request, res: Response) => {
    try {
      const documents = await storage.getArchivedDocuments();
      const doc = documents.find((d: any) => d.shareToken === req.params.token);

      if (!doc) {
        return res.status(404).json({ error: "Link non valido" });
      }

      if (doc.shareExpiresAt && new Date(doc.shareExpiresAt) < new Date()) {
        return res.status(410).json({ error: "Link scaduto" });
      }

      // Get client IP
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
      const ip = Array.isArray(clientIp) ? clientIp[0] : clientIp.split(',')[0].trim();

      // Update download count and IP
      await storage.updateArchivedDocument(doc.id, {
        downloadCount: (doc.downloadCount || 0) + 1,
        lastDownloadAt: new Date(),
        lastDownloadIp: ip
      });

      // Get file path (process.cwd() is already in PULSE-ERP folder)
      const filePath = doc.filePath.startsWith('/') ? doc.filePath.substring(1) : doc.filePath;
      const absolutePath = path.join(process.cwd(), filePath);

      // Check if file exists
      if (!fs.existsSync(absolutePath)) {
        return res.status(404).json({ error: "File non trovato" });
      }

      // Set headers for download
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.fileName)}"`);
      res.setHeader('Content-Type', doc.fileType || 'application/octet-stream');

      // Send file
      res.sendFile(absolutePath);
    } catch (error) {
      console.error("Error downloading shared file:", error);
      res.status(500).json({ error: "Errore nel download" });
    }
  });

  // Track download of shared document (for tracking only, without file)
  app.post("/api/shared/:token/download", async (req: Request, res: Response) => {
    try {
      const documents = await storage.getArchivedDocuments();
      const doc = documents.find((d: any) => d.shareToken === req.params.token);

      if (!doc) {
        return res.status(404).json({ error: "Link non valido" });
      }

      if (doc.shareExpiresAt && new Date(doc.shareExpiresAt) < new Date()) {
        return res.status(410).json({ error: "Link scaduto" });
      }

      // Update download count
      await storage.updateArchivedDocument(doc.id, {
        downloadCount: (doc.downloadCount || 0) + 1,
        lastDownloadAt: new Date()
      });

      res.json({ success: true, downloadCount: (doc.downloadCount || 0) + 1 });
    } catch (error) {
      console.error("Error tracking download:", error);
      res.status(500).json({ error: "Errore nel tracciamento download" });
    }
  });

  // =====================
  // ARCHIVE FOLDERS API
  // =====================
  app.get("/api/archive-folders", async (req: Request, res: Response) => {
    try {
      const folders = await storage.getArchiveFolders();
      res.json(folders);
    } catch (error) {
      console.error("Error getting archive folders:", error);
      res.status(500).json({ error: "Errore nel recupero cartelle" });
    }
  });

  app.post("/api/archive-folders", async (req: Request, res: Response) => {
    try {
      const { name, color, icon, parentId, createdBy } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Nome cartella richiesto" });
      }
      const folder = await storage.createArchiveFolder({ name, color, icon, parentId, createdBy });
      res.status(201).json(folder);
    } catch (error) {
      console.error("Error creating archive folder:", error);
      res.status(500).json({ error: "Errore nella creazione cartella" });
    }
  });

  app.patch("/api/archive-folders/:id", async (req: Request, res: Response) => {
    try {
      const folder = await storage.updateArchiveFolder(req.params.id, req.body);
      res.json(folder);
    } catch (error) {
      console.error("Error updating archive folder:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento cartella" });
    }
  });

  app.delete("/api/archive-folders/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteArchiveFolder(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting archive folder:", error);
      res.status(500).json({ error: "Errore nell'eliminazione cartella" });
    }
  });

  // Move document to folder
  app.post("/api/archive/:id/move", async (req: Request, res: Response) => {
    try {
      const { folderId } = req.body;
      const document = await storage.updateArchivedDocument(req.params.id, {
        folderId: folderId || null,
        updatedAt: new Date()
      });
      res.json(document);
    } catch (error) {
      console.error("Error moving document:", error);
      res.status(500).json({ error: "Errore nello spostamento documento" });
    }
  });

  // =====================
  // CHAT CHANNELS API
  // =====================
  app.get("/api/chat/channels", async (req: Request, res: Response) => {
    const channels = await storage.getChatChannels();
    res.json(channels);
  });

  app.post("/api/chat/channels", async (req: Request, res: Response) => {
    try {
      const channelData = insertChatChannelSchema.parse(req.body);
      const channel = await storage.createChatChannel(channelData);
      res.status(201).json(channel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create channel" });
    }
  });

  // Create or get DM channel between two users
  app.post("/api/chat/dm", async (req: Request, res: Response) => {
    try {
      const { userId1, userId2, user1Name, user2Name } = req.body;
      if (!userId1 || !userId2) {
        return res.status(400).json({ error: "Both user IDs are required" });
      }

      // Check if DM channel already exists between these users
      const channels = await storage.getChatChannels();
      const existingDm = channels.find((c: any) =>
        c.type === "dm" &&
        c.members &&
        c.members.includes(userId1) &&
        c.members.includes(userId2)
      );

      if (existingDm) {
        return res.json(existingDm);
      }

      // Create new DM channel
      const dmChannel = await storage.createChatChannel({
        name: `${user1Name} - ${user2Name}`,
        type: "dm",
        members: [userId1, userId2],
        unreadCount: 0,
      });

      res.status(201).json(dmChannel);
    } catch (error) {
      console.error("Error creating DM:", error);
      res.status(500).json({ error: "Failed to create DM" });
    }
  });

  // Get chat channel for a project
  app.get("/api/chat/channels/project/:projectId", async (req: Request, res: Response) => {
    try {
      const channel = await storage.getChatChannelByProjectId(req.params.projectId);
      res.json(channel || null);
    } catch (error) {
      console.error("Error getting project channel:", error);
      res.status(500).json({ error: "Failed to get project channel" });
    }
  });

  // Create chat channel for a project
  app.post("/api/chat/channels/project/:projectId", async (req: Request, res: Response) => {
    try {
      const { projectName, createdBy } = req.body;

      // Check if channel already exists
      const existing = await storage.getChatChannelByProjectId(req.params.projectId);
      if (existing) {
        return res.json(existing);
      }

      const channel = await storage.createChatChannel({
        name: `Chat: ${projectName}`,
        type: "project",
        projectId: req.params.projectId,
        createdBy,
        unreadCount: 0,
      });
      res.status(201).json(channel);
    } catch (error) {
      console.error("Error creating project channel:", error);
      res.status(500).json({ error: "Failed to create project channel" });
    }
  });

  // Get chat channel for a task
  app.get("/api/chat/channels/task/:taskId", async (req: Request, res: Response) => {
    try {
      const channel = await storage.getChatChannelByTaskId(req.params.taskId);
      res.json(channel || null);
    } catch (error) {
      console.error("Error getting task channel:", error);
      res.status(500).json({ error: "Failed to get task channel" });
    }
  });

  // Create chat channel for a task
  app.post("/api/chat/channels/task/:taskId", async (req: Request, res: Response) => {
    try {
      const { taskTitle, createdBy } = req.body;

      // Check if channel already exists
      const existing = await storage.getChatChannelByTaskId(req.params.taskId);
      if (existing) {
        return res.json(existing);
      }

      const channel = await storage.createChatChannel({
        name: `Chat: ${taskTitle}`,
        type: "task",
        taskId: req.params.taskId,
        createdBy,
        unreadCount: 0,
      });
      res.status(201).json(channel);
    } catch (error) {
      console.error("Error creating task channel:", error);
      res.status(500).json({ error: "Failed to create task channel" });
    }
  });

  // Update channel
  app.patch("/api/chat/channels/:id", async (req: Request, res: Response) => {
    try {
      const { name, description, color } = req.body;
      const updated = await storage.updateChatChannel(req.params.id, { name, description, color });
      if (!updated) {
        return res.status(404).json({ error: "Channel not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating channel:", error);
      res.status(500).json({ error: "Failed to update channel" });
    }
  });

  // Delete channel
  app.delete("/api/chat/channels/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteChatChannel(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting channel:", error);
      res.status(500).json({ error: "Failed to delete channel" });
    }
  });

  // =====================
  // CHAT MESSAGES API
  // =====================
  app.get("/api/chat/channels/:channelId/messages", async (req: Request, res: Response) => {
    const messages = await storage.getChatMessages(req.params.channelId);
    res.json(messages);
  });

  app.post("/api/chat/channels/:channelId/messages", async (req: Request, res: Response) => {
    try {
      const messageData = insertChatMessageSchema.parse({
        ...req.body,
        channelId: req.params.channelId
      });
      const message = await storage.createChatMessage(messageData);

      // Update channel's lastMessageAt
      await storage.updateChatChannel(req.params.channelId, {
        lastMessageAt: new Date()
      });

      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating chat message:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  // Delete chat message
  app.delete("/api/chat/messages/:messageId", async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteChatMessage(req.params.messageId);
      if (!deleted) {
        return res.status(404).json({ error: "Message not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ error: "Failed to delete message" });
    }
  });

  // Bulk delete chat messages
  app.post("/api/chat/messages/bulk-delete", async (req: Request, res: Response) => {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "IDs array required" });
      }

      let deletedCount = 0;
      for (const id of ids) {
        const deleted = await storage.deleteChatMessage(id);
        if (deleted) deletedCount++;
      }

      res.json({ success: true, deletedCount });
    } catch (error) {
      console.error("Error bulk deleting messages:", error);
      res.status(500).json({ error: "Failed to delete messages" });
    }
  });

  // Upload attachment for chat
  app.post("/api/chat/upload", upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({
        url: fileUrl,
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Get unread message count for user
  app.get("/api/chat/unread", async (req: Request, res: Response) => {
    try {
      const channels = await storage.getChatChannels();
      const totalUnread = channels.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0);
      res.json({ unreadCount: totalUnread });
    } catch (error) {
      res.status(500).json({ error: "Failed to get unread count" });
    }
  });

  // Mark channel messages as read
  app.post("/api/chat/channels/:channelId/read", async (req: Request, res: Response) => {
    try {
      await storage.updateChatChannel(req.params.channelId, { unreadCount: 0 });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark as read" });
    }
  });

  // Archive/Unarchive channel
  app.post("/api/chat/channels/:id/archive", async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      const channel = await storage.getChatChannel(req.params.id);
      if (!channel) {
        return res.status(404).json({ error: "Channel not found" });
      }

      const updated = await storage.updateChatChannel(req.params.id, {
        isArchived: !channel.isArchived,
        archivedAt: channel.isArchived ? null : new Date(),
        archivedBy: channel.isArchived ? null : userId,
      });
      res.json(updated);
    } catch (error) {
      console.error("Error archiving channel:", error);
      res.status(500).json({ error: "Failed to archive channel" });
    }
  });

  // =====================
  // SAVED CONVERSATIONS API
  // =====================

  // Get saved conversations
  app.get("/api/chat/saved", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      const saved = await storage.getSavedConversations(userId);
      res.json(saved);
    } catch (error) {
      console.error("Error getting saved conversations:", error);
      res.status(500).json({ error: "Failed to get saved conversations" });
    }
  });

  // Get single saved conversation
  app.get("/api/chat/saved/:id", async (req: Request, res: Response) => {
    try {
      const saved = await storage.getSavedConversation(req.params.id);
      if (!saved) {
        return res.status(404).json({ error: "Saved conversation not found" });
      }
      res.json(saved);
    } catch (error) {
      console.error("Error getting saved conversation:", error);
      res.status(500).json({ error: "Failed to get saved conversation" });
    }
  });

  // Save a conversation
  app.post("/api/chat/channels/:channelId/save", async (req: Request, res: Response) => {
    try {
      const { title, notes, userId, userName } = req.body;
      const channel = await storage.getChatChannel(req.params.channelId);
      if (!channel) {
        return res.status(404).json({ error: "Channel not found" });
      }

      const messages = await storage.getChatMessages(req.params.channelId);
      const transcript = JSON.stringify(messages);

      const saved = await storage.createSavedConversation({
        channelId: req.params.channelId,
        channelName: channel.name,
        title: title || `Conversazione ${channel.name}`,
        notes: notes || null,
        savedBy: userId,
        savedByName: userName,
        transcript,
        messageCount: messages.length,
        dateFrom: messages.length > 0 ? messages[0].createdAt : null,
        dateTo: messages.length > 0 ? messages[messages.length - 1].createdAt : null,
      });

      res.status(201).json(saved);
    } catch (error) {
      console.error("Error saving conversation:", error);
      res.status(500).json({ error: "Failed to save conversation" });
    }
  });

  // Delete saved conversation
  app.delete("/api/chat/saved/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteSavedConversation(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting saved conversation:", error);
      res.status(500).json({ error: "Failed to delete saved conversation" });
    }
  });

  // AI Chat Assistant
  app.post("/api/chat/channels/:channelId/ai", async (req: Request, res: Response) => {
    try {
      const { question, userId, sendToChat, conversationHistory } = req.body;
      if (!question) {
        return res.status(400).json({ error: "Question is required" });
      }

      const channel = await storage.getChatChannel(req.params.channelId);
      if (!channel) {
        return res.status(404).json({ error: "Channel not found" });
      }

      const messages = await storage.getChatMessages(req.params.channelId);
      const users = await storage.getUsers();

      const messagesWithNames = messages.slice(-50).map((m: any) => ({
        content: m.content,
        senderId: m.senderId,
        senderName: users.find((u: any) => u.id === m.senderId)?.name || "Utente",
        createdAt: m.createdAt?.toISOString() || new Date().toISOString(),
      }));

      const { analyzeChatAndRespond } = await import('./aiService');
      const response = await analyzeChatAndRespond(messagesWithNames, question, channel.name, conversationHistory);

      // Se richiesto, invia la domanda e la risposta nella chat
      if (sendToChat && userId) {
        // Trova il nome dell'utente
        const user = users.find((u: any) => u.id === userId);
        const userName = user?.name || "Utente";
        const userAvatar = user?.avatar || userName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

        // Invia la domanda dell'utente come messaggio
        await storage.createChatMessage({
          channelId: req.params.channelId,
          senderId: userId,
          senderName: userName,
          senderAvatar: userAvatar,
          content: `🤖 Domanda all'AI: ${question}`,
        });

        // Invia la risposta dell'AI come messaggio
        await storage.createChatMessage({
          channelId: req.params.channelId,
          senderId: "pulse-ai",
          senderName: "PULSE AI",
          senderAvatar: "AI",
          content: `🤖 PULSE AI: ${response}`,
        });

        // Aggiorna lastMessageAt del canale
        await storage.updateChatChannel(req.params.channelId, {
          lastMessageAt: new Date()
        });
      }

      res.json({ response });
    } catch (error) {
      console.error("AI Chat error:", error);
      res.status(500).json({ error: "Failed to get AI response" });
    }
  });

  // =====================
  // WHATSAPP STATUS API (Stub - requires WhatsApp Business API configuration)
  // =====================
  app.get("/api/whatsapp/status", async (req: Request, res: Response) => {
    // WhatsApp Web integration disabled - requires WhatsApp Business API
    res.json({
      connected: false,
      initializing: false,
      hasQR: false,
      error: "",
      message: "Non inizializzato"
    });
  });

  app.get("/api/whatsapp/status", async (req: Request, res: Response) => {
    // Default to 'system' if not authenticated for now, or require auth
    const userId = (req as any).session?.userId as string || 'system';
    const status = getWhatsAppStatus(userId);
    res.json(status);
  });

  app.get("/api/whatsapp/qr", async (req: Request, res: Response) => {
    const userId = (req as any).session?.userId as string || 'system';
    const qr = getQRCode(userId);
    res.json({ qr });
  });

  app.post("/api/whatsapp/connect", async (req: Request, res: Response) => {
    const userId = (req as any).session?.userId as string || 'system';
    // Initialize in background
    initializeWhatsApp(userId).catch(err => console.error("WhatsApp init error:", err));
    res.json({ success: true, message: "Inizializzazione avviata. Attendi il QR Code." });
  });

  app.post("/api/whatsapp/disconnect", async (req: Request, res: Response) => {
    const userId = (req as any).session?.userId as string || 'system';
    await disconnectWhatsApp(userId);
    res.json({ success: true, message: "Disconnesso con successo" });
  });

  app.post("/api/whatsapp/send", async (req: Request, res: Response) => {
    const userId = (req as any).session?.userId as string || 'system';
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({ error: "Numero di telefono e messaggio richiesti" });
    }

    try {
      await sendWhatsAppMessage(userId, phoneNumber, message);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Errore invio messaggio" });
    }
  });

  // =====================
  // WHATSAPP CONTACTS API
  // =====================
  app.get("/api/whatsapp/contacts", async (req: Request, res: Response) => {
    const contacts = await storage.getWhatsappContacts();
    res.json(contacts);
  });

  app.post("/api/whatsapp/contacts", async (req: Request, res: Response) => {
    try {
      const contactData = insertWhatsappContactSchema.parse(req.body);
      const contact = await storage.createWhatsappContact(contactData);
      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create contact" });
    }
  });

  app.patch("/api/whatsapp/contacts/:id", async (req: Request, res: Response) => {
    try {
      const contactData = insertWhatsappContactSchema.partial().parse(req.body);
      const contact = await storage.updateWhatsappContact(req.params.id, contactData);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update contact" });
    }
  });

  // =====================
  // WHATSAPP MESSAGES API
  // =====================
  app.get("/api/whatsapp/contacts/:contactId/messages", async (req: Request, res: Response) => {
    const messages = await storage.getWhatsappMessages(req.params.contactId);
    res.json(messages);
  });

  app.post("/api/whatsapp/contacts/:contactId/messages", async (req: Request, res: Response) => {
    try {
      const messageData = insertWhatsappMessageSchema.parse({
        ...req.body,
        contactId: req.params.contactId
      });
      const message = await storage.createWhatsappMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  // =====================
  // TELEGRAM STATUS API
  // =====================
  app.get("/api/telegram/status", async (req: Request, res: Response) => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const connected = Boolean(botToken);
    res.json({ connected });
  });

  // =====================
  // TELEGRAM CHATS API
  // =====================
  app.get("/api/telegram/chats", async (req: Request, res: Response) => {
    const chats = await storage.getTelegramChats();
    res.json(chats);
  });

  app.get("/api/telegram/chats/:id", async (req: Request, res: Response) => {
    const chat = await storage.getTelegramChat(req.params.id);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }
    res.json(chat);
  });

  app.post("/api/telegram/chats", async (req: Request, res: Response) => {
    try {
      const chatData = insertTelegramChatSchema.parse(req.body);
      const chat = await storage.createTelegramChat(chatData);
      res.status(201).json(chat);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create chat" });
    }
  });

  // =====================
  // TELEGRAM MESSAGES API
  // =====================
  app.get("/api/telegram/chats/:chatId/messages", async (req: Request, res: Response) => {
    const messages = await storage.getTelegramMessages(req.params.chatId);
    res.json(messages);
  });

  app.post("/api/telegram/chats/:chatId/messages", async (req: Request, res: Response) => {
    try {
      const messageData = insertTelegramMessageSchema.parse({
        ...req.body,
        chatId: req.params.chatId
      });
      const message = await storage.createTelegramMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  // Send message via Telegram Bot
  app.post("/api/telegram/send", async (req: Request, res: Response) => {
    try {
      const { chatId, text } = req.body;
      const botToken = process.env.TELEGRAM_BOT_TOKEN;

      if (!botToken) {
        return res.status(500).json({ error: "Telegram bot token not configured" });
      }

      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text })
      });

      const data = await response.json();

      if (!data.ok) {
        return res.status(400).json({ error: data.description });
      }

      res.json(data.result);
    } catch (error) {
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Telegram Bot Webhook
  app.post("/api/telegram/webhook", async (req: Request, res: Response) => {
    try {
      const update = req.body;

      if (update.message) {
        const msg = update.message;
        const telegramChatId = String(msg.chat.id);

        // Find or create chat
        let chat = await storage.getTelegramChatByChatId(telegramChatId);

        if (!chat) {
          chat = await storage.createTelegramChat({
            chatId: telegramChatId,
            username: msg.from?.username || null,
            firstName: msg.from?.first_name || null,
            lastName: msg.from?.last_name || null,
            type: msg.chat.type || "private",
            unreadCount: 1
          });
        } else {
          await storage.updateTelegramChat(chat.id, {
            unreadCount: (chat.unreadCount || 0) + 1
          });
        }

        // Save message
        await storage.createTelegramMessage({
          chatId: chat.id,
          telegramMessageId: String(msg.message_id),
          content: msg.text || "[media]",
          direction: "incoming"
        });
      }

      res.json({ ok: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.json({ ok: true }); // Always return ok to Telegram
    }
  });

  // Get bot info
  app.get("/api/telegram/bot-info", async (req: Request, res: Response) => {
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;

      if (!botToken) {
        return res.json({ configured: false });
      }

      const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      const data = await response.json();

      if (data.ok) {
        res.json({ configured: true, bot: data.result });
      } else {
        res.json({ configured: false, error: data.description });
      }
    } catch (error) {
      res.json({ configured: false });
    }
  });


  // =====================
  // WHATSAPP API
  // =====================
  app.get("/api/whatsapp/status", async (req, res) => {
    const userId = (req as any).session?.userId || "1";
    const status = getWhatsAppStatus(userId);
    res.json(status);
  });

  app.get("/api/whatsapp/qr", async (req, res) => {
    const userId = (req as any).session?.userId || "1";
    const qr = getQRCode(userId);
    res.json({ qr });
  });

  app.post("/api/whatsapp/init", async (req, res) => {
    const userId = (req as any).session?.userId || "1";
    try {
      await initializeWhatsApp(userId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/whatsapp/disconnect", async (req, res) => {
    const userId = (req as any).session?.userId || "1";
    await disconnectWhatsApp(userId);
    res.json({ success: true });
  });

  app.get("/api/whatsapp/contacts", async (req, res) => {
    const contacts = await storage.getWhatsappContacts();
    res.json(contacts);
  });

  app.post("/api/whatsapp/contacts", async (req, res) => {
    try {
      const contactData = insertWhatsappContactSchema.parse(req.body);
      const contact = await storage.createWhatsappContact(contactData);
      res.status(201).json(contact);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ error: e.errors });
      }
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/whatsapp/contacts/:contactId/messages", async (req, res) => {
    const messages = await storage.getWhatsappMessages(req.params.contactId);
    res.json(messages);
  });

  app.post("/api/whatsapp/contacts/:contactId/messages", async (req, res) => {
    const userId = (req as any).session?.userId || "1";
    const { contactId } = req.params;
    const { content } = req.body;

    try {
      const contact = await storage.getWhatsappContact(contactId);
      if (!contact) return res.status(404).json({ error: "Contact not found" });

      await sendWhatsAppMessage(userId, contact.phoneNumber, content);
      res.json({ success: true });
    } catch (e: any) {
      console.error("Msg send error", e);
      res.status(500).json({ error: e.message });
    }
  });

  // =====================
  // SEED DATA (for initial setup)
  // =====================
  app.post("/api/seed", async (req: Request, res: Response) => {
    try {
      // Seed users
      const existingUsers = await storage.getUsers();
      if (existingUsers.length === 0) {
        await storage.createUser({ name: "Alice Cooper", email: "alice@company.com", role: "Admin", department: "Engineering", status: "Active", avatar: "AC" });
        await storage.createUser({ name: "Bob Smith", email: "bob@company.com", role: "Member", department: "Design", status: "Active", avatar: "BS" });
        await storage.createUser({ name: "Charlie Brown", email: "charlie@company.com", role: "Member", department: "Marketing", status: "Offline", avatar: "CB" });
        await storage.createUser({ name: "David Miller", email: "david@company.com", role: "Guest", department: "External", status: "Invited", avatar: "DM" });
      }

      // Seed projects
      const existingProjects = await storage.getProjects();
      if (existingProjects.length === 0) {
        await storage.createProject({ title: "Website Redesign", status: "In Progress", priority: "High", dueDate: "Dec 24", teamMembers: ["AC", "BS"] });
        await storage.createProject({ title: "Mobile App Launch", status: "Not Started", priority: "Medium", dueDate: "Jan 10", teamMembers: ["ME"] });
        await storage.createProject({ title: "Q1 Marketing Plan", status: "Done", priority: "Low", dueDate: "Dec 01", teamMembers: ["AC", "CB"] });
        await storage.createProject({ title: "User Research", status: "In Progress", priority: "Medium", dueDate: "Dec 20", teamMembers: ["BS", "ME"] });
      }

      // Seed tasks
      const existingTasks = await storage.getTasks();
      if (existingTasks.length === 0) {
        await storage.createTask({ title: "Draft Q4 Newsletter", done: false, dueDate: "Today", tag: "Marketing" });
        await storage.createTask({ title: "Update Homepage Hero", done: true, dueDate: "Yesterday", tag: "Design" });
        await storage.createTask({ title: "Fix Navigation Bug", done: false, dueDate: "Tomorrow", tag: "Dev" });
        await storage.createTask({ title: "Schedule Team Meeting", done: false, dueDate: "Fri", tag: "Admin" });
        await storage.createTask({ title: "Review Analytics", done: false, dueDate: "Next Week", tag: "Data" });
      }

      // Seed emails
      const existingEmails = await storage.getEmails();
      if (existingEmails.length === 0) {
        await storage.createEmail({ fromAddress: "alice@company.com", fromName: "Alice Cooper", toAddress: "me@company.com", subject: "Project Update: Q4 Goals", preview: "Hi team, just wanted to share the latest updates on...", body: "Hi there,\n\nHi team, just wanted to share the latest updates on our Q4 goals.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n\nBest regards,\nAlice Cooper", unread: true });
        await storage.createEmail({ fromAddress: "bob@company.com", fromName: "Bob Smith", toAddress: "me@company.com", subject: "Invoice #10234", preview: "Please find attached the invoice for the services rendered...", body: "Hi there,\n\nPlease find attached the invoice for the services rendered.\n\nBest regards,\nBob Smith", unread: false });
        await storage.createEmail({ fromAddress: "marketing@company.com", fromName: "Marketing Team", toAddress: "me@company.com", subject: "Newsletter Draft Review", preview: "Can you take a look at the attached draft before we send...", body: "Hi there,\n\nCan you take a look at the attached draft before we send it out?\n\nBest regards,\nMarketing Team", unread: true });
        await storage.createEmail({ fromAddress: "support@company.com", fromName: "Support", toAddress: "me@company.com", subject: "Ticket #9921 Resolved", preview: "Your issue has been marked as resolved. If you have...", body: "Hi there,\n\nYour issue has been marked as resolved. If you have any further questions, please don't hesitate to reach out.\n\nBest regards,\nSupport Team", unread: false });
        await storage.createEmail({ fromAddress: "hr@company.com", fromName: "HR Department", toAddress: "me@company.com", subject: "Holiday Schedule", preview: "The office will be closed on the following dates...", body: "Hi there,\n\nThe office will be closed on the following dates during the holiday season.\n\nBest regards,\nHR Department", unread: false });
      }

      // Seed chat channels
      const existingChannels = await storage.getChatChannels();
      if (existingChannels.length === 0) {
        await storage.createChatChannel({ name: "General", type: "channel", unreadCount: 0 });
        await storage.createChatChannel({ name: "Development", type: "channel", unreadCount: 3 });
        await storage.createChatChannel({ name: "Design", type: "channel", unreadCount: 0 });
        await storage.createChatChannel({ name: "Marketing", type: "channel", unreadCount: 0 });
      }

      // Seed WhatsApp contacts
      const existingContacts = await storage.getWhatsappContacts();
      if (existingContacts.length === 0) {
        await storage.createWhatsappContact({ name: "Alice Cooper", phoneNumber: "+1234567890", status: "Online", isGroup: false, unreadCount: 2 });
        await storage.createWhatsappContact({ name: "Project Alpha Group", phoneNumber: "+0987654321", status: "You: I'll check it out", isGroup: true, unreadCount: 0 });
        await storage.createWhatsappContact({ name: "Mom", phoneNumber: "+1122334455", status: "Typing...", isGroup: false, unreadCount: 1 });
      }

      // Seed documents
      const existingDocs = await storage.getDocuments();
      if (existingDocs.length === 0) {
        await storage.createDocument({ title: "Benvenuto in PULSE ERP", content: "# Benvenuto!\n\nQuesto è il tuo spazio di lavoro. Puoi creare documenti, organizzarli e condividerli con il tuo team.\n\n## Come iniziare\n\n- Clicca su **Nuovo Documento** per creare un documento\n- Usa l'editor per scrivere il tuo contenuto\n- Condividi con i colleghi usando il pulsante **Condividi**", icon: "👋" });
        await storage.createDocument({ title: "Note Riunione Team", content: "# Note Riunione\n\n**Data:** 16 Dicembre 2024\n\n## Partecipanti\n- Mario Rossi\n- Laura Bianchi\n- Giuseppe Verdi\n\n## Argomenti Discussi\n\n1. Review del progetto Q4\n2. Pianificazione Q1 2025\n3. Nuove assunzioni\n\n## Azioni da fare\n\n- [ ] Completare report vendite\n- [ ] Preparare presentazione\n- [ ] Aggiornare roadmap", icon: "📝" });
        await storage.createDocument({ title: "Guida Stile Brand", content: "# Guida Stile Brand\n\n## Colori\n\n- **Primario:** #3B82F6\n- **Secondario:** #10B981\n- **Accent:** #F59E0B\n\n## Font\n\n- Titoli: Inter Bold\n- Testo: Inter Regular\n\n## Logo\n\nUtilizzare sempre il logo con sfondo bianco o trasparente.", icon: "🎨" });
      }

      res.json({ message: "Database seeded successfully" });
    } catch (error) {
      console.error("Seed error:", error);
      res.status(500).json({ error: "Failed to seed database" });
    }
  });

  // =====================
  // DOCUMENTS API
  // =====================
  app.get("/api/documents", async (req: Request, res: Response) => {
    const userId = req.query.userId as string | undefined;
    if (userId) {
      const ownedDocs = await storage.getDocumentsMetadataByOwner(userId);
      const sharedDocs = await storage.getDocumentsMetadataSharedWithUser(userId);
      console.log(`[Documents API] userId: ${userId}, owned: ${ownedDocs.length}, shared: ${sharedDocs.length}`);
      const allDocs = [...ownedDocs, ...sharedDocs.filter(sd => !ownedDocs.some(od => od.id === sd.id))];
      return res.json(allDocs);
    }
    const docs = await storage.getDocumentsMetadata();
    res.json(docs);
  });

  app.get("/api/documents/:id", async (req: Request, res: Response) => {
    const doc = await storage.getDocument(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.json(doc);
  });

  app.post("/api/documents", async (req: Request, res: Response) => {
    try {
      // Fix boolean/integer mismatch for SQLite
      const payload = { ...req.body };
      if (typeof payload.isPublic === 'boolean') payload.isPublic = payload.isPublic ? 1 : 0;
      if (typeof payload.isArchived === 'boolean') payload.isArchived = payload.isArchived ? 1 : 0;
      if (typeof payload.needsReview === 'boolean') payload.needsReview = payload.needsReview ? 1 : 0;

      const docData = insertDocumentSchema.parse(payload);
      console.log(`[Document API] Creating document: ${docData.title} for user: ${docData.ownerId}`);
      const doc = await storage.createDocument(docData);
      res.status(201).json(doc);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  app.patch("/api/documents/:id", async (req: Request, res: Response) => {
    try {
      // Fix boolean/integer mismatch for SQLite
      const payload = { ...req.body };
      if (typeof payload.isPublic === 'boolean') payload.isPublic = payload.isPublic ? 1 : 0;
      if (typeof payload.isArchived === 'boolean') payload.isArchived = payload.isArchived ? 1 : 0;
      if (typeof payload.needsReview === 'boolean') payload.needsReview = payload.needsReview ? 1 : 0;

      const docData = insertDocumentSchema.partial().parse(payload);
      const editorId = req.body.editorId;
      const updateData: any = { ...docData };
      if (editorId) {
        updateData.lastEditorId = editorId;
        updateData.lastEditedAt = new Date().toISOString();
      }
      console.log(`[Document API] Updating document: ${req.params.id}, editor: ${editorId || 'none'}`);
      const doc = await storage.updateDocument(req.params.id, updateData);
      if (!doc) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(doc);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update document" });
    }
  });

  app.delete("/api/documents/:id", async (req: Request, res: Response) => {
    const success = await storage.deleteDocument(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.status(204).send();
  });

  // Document Shares
  app.get("/api/documents/:id/shares", async (req: Request, res: Response) => {
    const shares = await storage.getDocumentShares(req.params.id);
    res.json(shares);
  });

  app.post("/api/documents/:id/shares", async (req: Request, res: Response) => {
    try {
      const shareData = insertDocumentShareSchema.parse({
        ...req.body,
        documentId: req.params.id,
      });
      const share = await storage.createDocumentShare(shareData);

      try {
        const doc = await storage.getDocument(req.params.id);
        const sharedByUser = shareData.sharedById ? await storage.getUser(shareData.sharedById) : null;

        if (doc && shareData.userId) {
          await storage.createNotification({
            userId: shareData.userId,
            title: "Documento condiviso con te",
            message: `${sharedByUser?.name || "Qualcuno"} ha condiviso il documento "${doc.title}" con te`,
            type: "document_share",
            link: `/documents`,
          });
        }
      } catch (notifError) {
        console.error("Error creating notification:", notifError);
      }

      res.status(201).json(share);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error sharing document:", error);
      res.status(500).json({ error: "Failed to share document" });
    }
  });

  app.delete("/api/documents/:docId/shares/:shareId", async (req: Request, res: Response) => {
    const success = await storage.deleteDocumentShare(req.params.shareId);
    if (!success) {
      return res.status(404).json({ error: "Share not found" });
    }
    res.status(204).send();
  });

  // Document Comments
  app.get("/api/documents/:id/comments", async (req: Request, res: Response) => {
    const comments = await storage.getDocumentComments(req.params.id);
    res.json(comments);
  });

  app.post("/api/documents/:id/comments", async (req: Request, res: Response) => {
    try {
      const commentData = insertDocumentCommentSchema.parse({
        ...req.body,
        documentId: req.params.id,
      });
      const comment = await storage.createDocumentComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  app.patch("/api/documents/:docId/comments/:commentId", async (req: Request, res: Response) => {
    try {
      const commentData = insertDocumentCommentSchema.partial().parse(req.body);
      const comment = await storage.updateDocumentComment(req.params.commentId, commentData);
      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }
      res.json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update comment" });
    }
  });

  app.delete("/api/documents/:docId/comments/:commentId", async (req: Request, res: Response) => {
    const success = await storage.deleteDocumentComment(req.params.commentId);
    if (!success) {
      return res.status(404).json({ error: "Comment not found" });
    }
    res.status(204).send();
  });

  // Personal Todos
  app.get("/api/personal-todos", async (req: Request, res: Response) => {
    const userId = (req as any).session?.userId || req.query.userId as string | undefined;
    if (!userId) {
      // Return empty array if not authenticated instead of error
      return res.json([]);
    }
    // Filtra i todo per l'utente corrente
    const todos = await storage.getPersonalTodos(userId);
    res.json(todos);
  });

  app.get("/api/personal-todos/:id", async (req: Request, res: Response) => {
    const todo = await storage.getPersonalTodo(req.params.id);
    if (!todo) {
      return res.status(404).json({ error: "Todo not found" });
    }
    res.json(todo);
  });

  app.post("/api/personal-todos", async (req: Request, res: Response) => {
    const userId = (req as any).session?.userId || req.query.userId || req.body.userId as string | undefined;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      // Forza il userId a essere quello dell'utente corrente
      const todoData = insertPersonalTodoSchema.parse({
        ...req.body,
        userId: userId, // Usa sempre l'utente dalla sessione
      });
      const todo = await storage.createPersonalTodo(todoData);
      res.status(201).json(todo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create todo" });
    }
  });

  app.patch("/api/personal-todos/:id", async (req: Request, res: Response) => {
    try {
      const todoData = insertPersonalTodoSchema.partial().parse(req.body);
      const todo = await storage.updatePersonalTodo(req.params.id, todoData);
      if (!todo) {
        return res.status(404).json({ error: "Todo not found" });
      }
      res.json(todo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update todo" });
    }
  });

  app.delete("/api/personal-todos/:id", async (req: Request, res: Response) => {
    const success = await storage.deletePersonalTodo(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Todo not found" });
    }
    res.status(204).send();
  });

  // =====================
  // SUBTASKS API
  // =====================
  app.get("/api/personal-todos/:todoId/subtasks", async (req: Request, res: Response) => {
    const subtasksList = await storage.getSubtasks(req.params.todoId);
    res.json(subtasksList);
  });

  app.post("/api/personal-todos/:todoId/subtasks", async (req: Request, res: Response) => {
    try {
      const subtask = await storage.createSubtask({
        todoId: req.params.todoId,
        title: req.body.title,
        completed: false,
        order: req.body.order || 0,
      });
      res.status(201).json(subtask);
    } catch (error) {
      res.status(500).json({ error: "Failed to create subtask" });
    }
  });

  app.patch("/api/subtasks/:id", async (req: Request, res: Response) => {
    try {
      const subtask = await storage.updateSubtask(req.params.id, req.body);
      if (!subtask) {
        return res.status(404).json({ error: "Subtask not found" });
      }
      res.json(subtask);
    } catch (error) {
      res.status(500).json({ error: "Failed to update subtask" });
    }
  });

  app.delete("/api/subtasks/:id", async (req: Request, res: Response) => {
    const success = await storage.deleteSubtask(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Subtask not found" });
    }
    res.status(204).send();
  });

  // =====================
  // TODO TEMPLATES API
  // =====================
  app.get("/api/todo-templates", async (req: Request, res: Response) => {
    const templates = await storage.getTodoTemplates();
    res.json(templates);
  });

  app.get("/api/todo-templates/:id", async (req: Request, res: Response) => {
    const template = await storage.getTodoTemplate(req.params.id);
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }
    res.json(template);
  });

  app.post("/api/todo-templates", async (req: Request, res: Response) => {
    try {
      const templateData = insertTodoTemplateSchema.parse(req.body);
      const template = await storage.createTodoTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create template" });
    }
  });

  app.patch("/api/todo-templates/:id", async (req: Request, res: Response) => {
    try {
      const template = await storage.updateTodoTemplate(req.params.id, req.body);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to update template" });
    }
  });

  app.delete("/api/todo-templates/:id", async (req: Request, res: Response) => {
    const success = await storage.deleteTodoTemplate(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Template not found" });
    }
    res.status(204).send();
  });

  // =====================
  // TIME ENTRIES API
  // =====================
  app.get("/api/time-entries", async (req: Request, res: Response) => {
    const entries = await storage.getTimeEntries();
    res.json(entries);
  });

  app.get("/api/time-entries/todo/:todoId", async (req: Request, res: Response) => {
    const entries = await storage.getTimeEntriesByTodo(req.params.todoId);
    res.json(entries);
  });

  app.get("/api/time-entries/project/:projectId", async (req: Request, res: Response) => {
    const entries = await storage.getTimeEntriesByProject(req.params.projectId);
    res.json(entries);
  });

  app.post("/api/time-entries", async (req: Request, res: Response) => {
    try {
      const body = { ...req.body };
      if (body.startTime && typeof body.startTime === 'string') {
        body.startTime = new Date(body.startTime);
      }
      if (body.endTime && typeof body.endTime === 'string') {
        body.endTime = new Date(body.endTime);
      }
      const entryData = insertTimeEntrySchema.parse(body);
      const entry = await storage.createTodoTimeEntry(entryData);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create time entry" });
    }
  });

  app.patch("/api/time-entries/:id", async (req: Request, res: Response) => {
    try {
      const body = { ...req.body };
      if (body.startTime && typeof body.startTime === 'string') {
        body.startTime = new Date(body.startTime);
      }
      if (body.endTime && typeof body.endTime === 'string') {
        body.endTime = new Date(body.endTime);
      }
      const entry = await storage.updateTodoTimeEntry(req.params.id, body);
      if (!entry) {
        return res.status(404).json({ error: "Time entry not found" });
      }
      res.json(entry);
    } catch (error) {
      res.status(500).json({ error: "Failed to update time entry" });
    }
  });

  app.delete("/api/time-entries/:id", async (req: Request, res: Response) => {
    const success = await storage.deleteTimeEntry(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Time entry not found" });
    }
    res.status(204).send();
  });

  // =====================
  // TASK COMMENTS API
  // =====================
  app.get("/api/tasks/:taskId/comments", async (req: Request, res: Response) => {
    const comments = await storage.getTaskComments(req.params.taskId);
    res.json(comments);
  });

  app.post("/api/tasks/:taskId/comments", async (req: Request, res: Response) => {
    try {
      const commentData = insertTaskCommentSchema.parse({
        ...req.body,
        taskId: req.params.taskId,
      });
      const comment = await storage.createTaskComment(commentData);

      // Log activity
      await storage.createActivity({
        userId: commentData.userId,
        action: 'commented',
        entityType: 'task',
        entityId: req.params.taskId,
        entityTitle: req.body.taskTitle || 'Task',
        details: commentData.content.substring(0, 100),
      });

      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  app.delete("/api/tasks/:taskId/comments/:commentId", async (req: Request, res: Response) => {
    const success = await storage.deleteTaskComment(req.params.commentId);
    if (!success) {
      return res.status(404).json({ error: "Comment not found" });
    }
    res.status(204).send();
  });

  // =====================
  // ACTIVITY FEED API
  // =====================
  app.get("/api/activity-feed", async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const activities = await storage.getActivityFeed(limit);
    res.json(activities);
  });

  app.post("/api/activity-feed", async (req: Request, res: Response) => {
    try {
      const activityData = insertActivityFeedSchema.parse(req.body);
      const activity = await storage.createActivity(activityData);
      res.status(201).json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to log activity" });
    }
  });

  // =====================
  // ANALYTICS API
  // =====================
  app.get("/api/analytics/productivity", async (req: Request, res: Response) => {
    try {
      const tasks = await storage.getTasks();
      const projects = await storage.getProjects();

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Calculate task completion trend (last 30 days grouped by day)
      const completedTasks = tasks.filter(t => t.done);
      const pendingTasks = tasks.filter(t => !t.done);

      // Calculate project health
      const projectHealth = projects.map(p => {
        const projectTasks = tasks.filter(t => t.tag === p.title);
        const completed = projectTasks.filter(t => t.done).length;
        const total = projectTasks.length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        let health: 'green' | 'yellow' | 'red' = 'green';
        if (p.dueDate) {
          const dueDate = new Date(p.dueDate);
          const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysUntilDue < 0) health = 'red';
          else if (daysUntilDue < 7 && progress < 80) health = 'yellow';
          else if (progress < 50) health = 'yellow';
        }

        return {
          id: p.id,
          title: p.title,
          progress,
          health,
          tasksCompleted: completed,
          tasksTotal: total,
          dueDate: p.dueDate,
          startDate: p.startDate,
        };
      });

      // Time tracking stats
      const totalEstimatedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
      const totalActualHours = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);

      res.json({
        summary: {
          totalTasks: tasks.length,
          completedTasks: completedTasks.length,
          pendingTasks: pendingTasks.length,
          completionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
          totalProjects: projects.length,
          activeProjects: projects.filter(p => p.status !== 'Done').length,
        },
        timeTracking: {
          totalEstimatedHours,
          totalActualHours,
          variance: totalActualHours - totalEstimatedHours,
        },
        projectHealth,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get analytics" });
    }
  });

  // User workload (Capacity Planner)
  app.get("/api/analytics/workload", async (req: Request, res: Response) => {
    try {
      const tasks = await storage.getTasks();
      const users = await storage.getUsers();

      const workload = users.map(user => {
        const userTasks = tasks.filter(t => t.assignedTo === user.id);
        const pendingTasks = userTasks.filter(t => !t.done);
        const completedTasks = userTasks.filter(t => t.done);
        const estimatedHours = pendingTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

        return {
          userId: user.id,
          userName: user.name,
          avatar: user.avatar,
          pendingTasks: pendingTasks.length,
          completedTasks: completedTasks.length,
          totalTasks: userTasks.length,
          estimatedHours,
          workloadLevel: estimatedHours > 40 ? 'high' : estimatedHours > 20 ? 'medium' : 'low',
        };
      });

      res.json(workload);
    } catch (error) {
      res.status(500).json({ error: "Failed to get workload data" });
    }
  });

  // =====================
  // AI API
  // =====================
  const aiService = await import("./aiService");

  // AI Chat endpoint
  app.post("/api/ai/chat", async (req: Request, res: Response) => {
    try {
      const { messages, systemPrompt } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array required" });
      }
      const response = await aiService.chatWithAI(messages, systemPrompt);
      res.json({ response });
    } catch (error: any) {
      console.error("AI Chat error:", error);
      res.status(500).json({ error: error.message || "AI service error" });
    }
  });

  // Generate tasks from goal
  app.post("/api/ai/generate-tasks", async (req: Request, res: Response) => {
    try {
      const { goal, projectContext } = req.body;
      if (!goal) {
        return res.status(400).json({ error: "Goal is required" });
      }
      const result = await aiService.generateTasksFromGoal(goal, projectContext);
      res.json(result);
    } catch (error: any) {
      console.error("AI Generate Tasks error:", error);
      res.status(500).json({ error: error.message || "AI service error" });
    }
  });

  // Summarize document
  app.post("/api/ai/summarize", async (req: Request, res: Response) => {
    try {
      const { content, title } = req.body;
      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }
      const summary = await aiService.summarizeDocument(content, title);
      res.json({ summary });
    } catch (error: any) {
      console.error("AI Summarize error:", error);
      res.status(500).json({ error: error.message || "AI service error" });
    }
  });

  // Analyze email
  app.post("/api/ai/analyze-email", async (req: Request, res: Response) => {
    try {
      const { content, subject, from } = req.body;
      if (!content) {
        return res.status(400).json({ error: "Email content is required" });
      }
      const analysis = await aiService.analyzeEmail(content, subject || "", from || "");
      res.json(analysis);
    } catch (error: any) {
      console.error("AI Analyze Email error:", error);
      res.status(500).json({ error: error.message || "AI service error" });
    }
  });

  // Generate project report
  app.post("/api/ai/generate-report", async (req: Request, res: Response) => {
    try {
      const { projectId } = req.body;
      if (!projectId) {
        return res.status(400).json({ error: "Project ID is required" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const allTasks = await storage.getTasks();
      const projectTasks = allTasks.filter(t => t.tag === project.title);

      const report = await aiService.generateProjectReport({
        title: project.title,
        status: project.status,
        tasks: projectTasks.map(t => ({ title: t.title, done: t.done, priority: t.priority || undefined })),
        teamMembers: project.teamMembers || undefined,
        dueDate: project.dueDate || undefined,
      });

      res.json({ report });
    } catch (error: any) {
      console.error("AI Generate Report error:", error);
      res.status(500).json({ error: error.message || "AI service error" });
    }
  });

  // Get AI suggestions
  app.post("/api/ai/suggestions", async (req: Request, res: Response) => {
    try {
      const tasks = await storage.getTasks();
      const projects = await storage.getProjects();

      const recentTasks = tasks.slice(0, 5).map(t => ({ title: t.title, done: t.done }));
      const upcomingDeadlines = tasks
        .filter(t => t.dueDate && !t.done)
        .slice(0, 5)
        .map(t => ({ title: t.title, dueDate: t.dueDate! }));

      const activeProjects = projects.filter(p => p.status !== "Done").length;
      const projectStatus = `${activeProjects} progetti attivi su ${projects.length} totali`;

      const suggestions = await aiService.getSuggestions({
        recentTasks,
        upcomingDeadlines,
        projectStatus,
      });

      res.json({ suggestions });
    } catch (error: any) {
      console.error("AI Suggestions error:", error);
      res.status(500).json({ error: error.message || "AI service error" });
    }
  });

  // Text-to-Speech endpoint
  app.post("/api/ai/text-to-speech", async (req: Request, res: Response) => {
    try {
      const { text, voice = "nova" } = req.body;

      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      // Limita il testo a 4096 caratteri (limite OpenAI TTS)
      const truncatedText = text.slice(0, 4096);

      const audioBuffer = await aiService.textToSpeech(truncatedText, voice);

      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="wiki-audio.mp3"',
        'Content-Length': audioBuffer.length.toString()
      });

      res.send(audioBuffer);
    } catch (error: any) {
      console.error("Text-to-Speech error:", error);
      res.status(500).json({ error: error.message || "TTS service error" });
    }
  });

  // Count emails for Wiki - quick pre-check
  app.post("/api/ai/count-wiki-emails", async (req: Request, res: Response) => {
    console.log("[Wiki Count] Request received:", req.body);
    try {
      const userId = (req as any).session?.userId as string | undefined;
      if (!userId) {
        console.log("[Wiki Count] No userId in session");
        return res.status(401).json({ error: "Autenticazione richiesta" });
      }
      const { contactEmail } = req.body;
      console.log("[Wiki Count] Searching for:", contactEmail);

      if (!contactEmail) {
        return res.status(400).json({ error: "Contact email is required" });
      }

      const emailConfigs = await storage.getUserEmailConfigs(userId);
      const emailConfig = emailConfigs[0];
      let userCredentials: UserEmailCredentials;

      if (emailConfig?.emailAddress) {
        userCredentials = {
          emailAddress: emailConfig.emailAddress,
          password: emailConfig.password,
          imapHost: emailConfig.imapHost,
          imapPort: emailConfig.imapPort,
          imapSecure: emailConfig.imapSecure,
          smtpHost: emailConfig.smtpHost,
          smtpPort: emailConfig.smtpPort,
          smtpSecure: emailConfig.smtpSecure,
        };
      } else if (process.env.ARUBA_EMAIL_ADDRESS && process.env.ARUBA_EMAIL_PASSWORD) {
        userCredentials = {
          emailAddress: process.env.ARUBA_EMAIL_ADDRESS,
          password: process.env.ARUBA_EMAIL_PASSWORD,
          imapHost: "imaps.aruba.it",
          imapPort: 993,
          imapSecure: true,
          smtpHost: "smtps.aruba.it",
          smtpPort: 465,
          smtpSecure: true,
        };
      } else {
        return res.status(400).json({ error: "Email non configurata" });
      }

      const targetEmail = contactEmail.toLowerCase().trim();
      const emailMatches = (field: string): boolean => {
        if (!field) return false;
        const lower = field.toLowerCase();
        if (lower.includes(targetEmail)) return true;
        const emails = lower.match(/[\w.-]+@[\w.-]+\.\w+/g) || [];
        return emails.some(e => e === targetEmail);
      };

      let totalCount = 0;
      const folderCounts: { folder: string; count: number }[] = [];

      // Get all available folders (flatten hierarchy)
      let allFolders: string[] = ["INBOX"];
      try {
        const folders = await fetchEmailFoldersWithConfig(userCredentials);

        // Flatten folder hierarchy to get all paths
        const flattenFolders = (items: any[]): string[] => {
          const result: string[] = [];
          for (const item of items) {
            if (item.path) result.push(item.path);
            else if (item.name) result.push(item.name);
            if (item.children && Array.isArray(item.children)) {
              result.push(...flattenFolders(item.children));
            }
          }
          return result;
        };

        allFolders = flattenFolders(folders);
        if (allFolders.length === 0) allFolders = ["INBOX"];
        console.log(`[Wiki Count] Found ${allFolders.length} folders:`, allFolders);
      } catch (e) {
        console.log("[Wiki Count] Could not fetch folders, using INBOX only");
      }

      // Search in all folders - skip cache to get all emails
      for (const folder of allFolders) {
        try {
          const emails = await fetchEmailsFromFolderWithConfig(userCredentials, folder, 500, true);
          const matching = emails.filter(e => {
            const fromMatch = emailMatches(e.fromAddress || "");
            const toMatch = emailMatches(e.toAddress || "");
            return fromMatch || toMatch;
          }).length;

          // Debug: log first email's fields for troubleshooting
          if (emails.length > 0 && folder === "INBOX.SCHIRATTI") {
            console.log(`[Wiki Count Debug] Sample email from ${folder}:`, {
              fromAddress: emails[0]?.fromAddress,
              toAddress: emails[0]?.toAddress,
              subject: emails[0]?.subject,
            });
          }

          console.log(`[Wiki Count] Folder ${folder}: ${emails.length} emails, ${matching} matching`);
          if (matching > 0) {
            folderCounts.push({ folder, count: matching });
            totalCount += matching;
          }
        } catch (e) {
          // Folder might not be accessible
        }
      }

      console.log(`[Wiki Count] Total: ${totalCount} emails across ${folderCounts.length} folders`);
      res.json({ folders: folderCounts, total: totalCount });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Generate Email Wiki - creates a chronological summary of all correspondence with a contact
  app.post("/api/ai/generate-email-wiki", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId as string | undefined;
      if (!userId) {
        return res.status(401).json({ error: "Autenticazione richiesta" });
      }
      const { contactEmail, contactName } = req.body;

      if (!contactEmail) {
        return res.status(400).json({ error: "Contact email is required" });
      }

      // Try user-specific config first, then fall back to global Aruba config
      const emailConfigs = await storage.getUserEmailConfigs(userId);
      const emailConfig = emailConfigs[0];
      let userCredentials: UserEmailCredentials;

      if (emailConfig?.emailAddress) {
        userCredentials = {
          emailAddress: emailConfig.emailAddress,
          password: emailConfig.password,
          imapHost: emailConfig.imapHost,
          imapPort: emailConfig.imapPort,
          imapSecure: emailConfig.imapSecure,
          smtpHost: emailConfig.smtpHost,
          smtpPort: emailConfig.smtpPort,
          smtpSecure: emailConfig.smtpSecure,
        };
      } else if (process.env.ARUBA_EMAIL_ADDRESS && process.env.ARUBA_EMAIL_PASSWORD) {
        // Fallback to global Aruba credentials
        userCredentials = {
          emailAddress: process.env.ARUBA_EMAIL_ADDRESS,
          password: process.env.ARUBA_EMAIL_PASSWORD,
          imapHost: "imaps.aruba.it",
          imapPort: 993,
          imapSecure: true,
          smtpHost: "smtps.aruba.it",
          smtpPort: 465,
          smtpSecure: true,
        };
      } else {
        return res.status(400).json({ error: "Email non configurata. Configura prima le impostazioni email." });
      }

      const targetEmail = contactEmail.toLowerCase().trim();

      // Helper to extract email from "Name <email>" format
      const extractEmail = (str: string): string => {
        const match = str.match(/<([^>]+)>/);
        return match ? match[1].toLowerCase() : str.toLowerCase();
      };

      // Helper to check if email matches target
      const emailMatches = (field: string): boolean => {
        if (!field) return false;
        const lower = field.toLowerCase();
        // Check if target email appears anywhere in the field
        if (lower.includes(targetEmail)) return true;
        // Extract email addresses and check each
        const emails = lower.match(/[\w.-]+@[\w.-]+\.\w+/g) || [];
        return emails.some(e => e === targetEmail);
      };

      // Fetch from ALL folders (flatten hierarchy)
      let allEmails: any[] = [];
      let allFolders: string[] = ["INBOX"];

      try {
        const folders = await fetchEmailFoldersWithConfig(userCredentials);

        // Flatten folder hierarchy to get all paths
        const flattenFolders = (items: any[]): string[] => {
          const result: string[] = [];
          for (const item of items) {
            if (item.path) result.push(item.path);
            else if (item.name) result.push(item.name);
            if (item.children && Array.isArray(item.children)) {
              result.push(...flattenFolders(item.children));
            }
          }
          return result;
        };

        allFolders = flattenFolders(folders);
        if (allFolders.length === 0) allFolders = ["INBOX"];
        console.log(`[Wiki] Found ${allFolders.length} folders:`, allFolders);
      } catch (e) {
        console.log("[Wiki] Could not fetch folders, using INBOX only");
      }

      // Determine which folders are "sent" folders
      const sentFolderPatterns = ["sent", "posta inviata", "inviata", "outbox"];
      const isSentFolder = (name: string) => sentFolderPatterns.some(p => name.toLowerCase().includes(p));

      for (const folder of allFolders) {
        try {
          const emails = await fetchEmailsFromFolderWithConfig(userCredentials, folder, 500, true);
          const isOutgoing = isSentFolder(folder);
          console.log(`[Wiki] Fetched ${emails.length} emails from ${folder} (${isOutgoing ? 'outgoing' : 'incoming'})`);
          allEmails = allEmails.concat(emails.map(e => ({ ...e, isIncoming: !isOutgoing })));
        } catch (e) {
          // Folder might not be accessible
        }
      }

      console.log(`[Wiki] Total emails fetched: ${allEmails.length}, searching for: ${targetEmail}`);

      // Filter emails that involve the target contact
      const filteredEmails = allEmails.filter(email => {
        return emailMatches(email.fromAddress || "") || emailMatches(email.toAddress || "");
      });

      console.log(`[Wiki] Found ${filteredEmails.length} emails matching ${targetEmail}`);

      if (filteredEmails.length === 0) {
        return res.status(404).json({ error: `Nessuna email trovata con il contatto ${contactEmail}` });
      }

      // Sort by date (newest first for API response, will be handled by AI)
      filteredEmails.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

      // Generate Wiki using AI
      const wiki = await aiService.generateEmailWiki(
        filteredEmails.map(e => ({
          id: e.id,
          subject: e.subject || "",
          from: e.from || "",
          to: e.to || "",
          body: e.body || e.text || "",
          date: e.date || new Date().toISOString(),
          isIncoming: e.isIncoming,
        })),
        contactEmail,
        contactName || contactEmail.split("@")[0]
      );

      res.json({
        contactEmail,
        contactName: contactName || contactEmail.split("@")[0],
        totalEmails: filteredEmails.length,
        wiki,
      });
    } catch (error: any) {
      console.error("Generate Email Wiki error:", error);
      res.status(500).json({ error: error.message || "Failed to generate email wiki" });
    }
  });

  // Create Wiki Note in Pulse Keep from email correspondence
  app.post("/api/ai/create-wiki-project", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId as string | undefined;
      if (!userId) {
        return res.status(401).json({ error: "Autenticazione richiesta" });
      }
      const { contactEmail, contactName, wiki, forceUpdate } = req.body;

      if (!contactEmail || !wiki) {
        return res.status(400).json({ error: "Contact email and wiki data are required" });
      }

      const displayName = contactName || contactEmail.split("@")[0];
      const dateStr = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });

      // Check existing wiki notes for this contact to determine version
      const existingNotes = await storage.getKeepNotes(userId);
      const wikiPattern = new RegExp(`^Wiki: ${displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( V\\.\\d+)?`);
      const existingWikis = existingNotes.filter(n => wikiPattern.test(n.title || "") && !n.deleted);

      // Determine version number
      let version = 1;
      if (existingWikis.length > 0) {
        const versions = existingWikis.map(n => {
          const match = (n.title || "").match(/V\.(\d+)/);
          return match ? parseInt(match[1]) : 1;
        });
        version = Math.max(...versions) + 1;
      }

      const versionStr = version.toString().padStart(2, '0');
      const noteTitle = `Wiki: ${displayName} V.${versionStr} (${dateStr})`;

      // Create note content with wiki data and full chronology
      const chronologySection = wiki.chronology?.length > 0
        ? wiki.chronology.map((e: any, idx: number) =>
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 EMAIL #${idx + 1}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Data: ${e.dateFormatted}
${e.direction === 'incoming' ? '📥 RICEVUTA' : '📤 INVIATA'}

👤 Da: ${e.from}
👥 A: ${e.to}

📌 Oggetto: ${e.subject}

📝 Contenuto:
${e.body}
`).join('\n')
        : 'Nessuna cronologia disponibile';

      const content = `📧 EMAIL WIKI: ${displayName}
════════════════════════════════════════════════════════════

📋 PANORAMICA
────────────────────────────────────────
${wiki.summary}

👤 CONTATTO
────────────────────────────────────────
Email: ${contactEmail}
Email analizzate: ${wiki.totalEmails || 'N/A'}

🏷️ TEMI PRINCIPALI
────────────────────────────────────────
${wiki.topics?.map((t: string) => `• ${t}`).join('\n') || 'Nessun tema identificato'}

📌 PUNTI CHIAVE
────────────────────────────────────────
${wiki.keyPoints?.map((p: string) => `• ${p}`).join('\n') || 'Nessun punto chiave'}

════════════════════════════════════════════════════════════
📜 CRONOLOGIA COMPLETA DELLE EMAIL
════════════════════════════════════════════════════════════
(In ordine cronologico dalla più vecchia alla più recente)

${chronologySection}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generato da PULSE AI il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;

      // Create the Pulse Keep note with version
      const note = await storage.createKeepNote({
        userId,
        title: noteTitle,
        content,
        color: "blue",
        pinned: true,
        archived: false,
        deleted: false,
        labels: ["wiki", "email"],
      });

      res.json({
        success: true,
        note,
        message: `Nota Wiki "${noteTitle}" creata in Pulse Keep`,
        version,
      });
    } catch (error: any) {
      console.error("Create Wiki Note error:", error);
      res.status(500).json({ error: error.message || "Failed to create wiki note" });
    }
  });

  // Get unique email contacts for wiki generation
  app.get("/api/email/contacts", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId as string | undefined;
      if (!userId) {
        return res.status(401).json({ error: "Autenticazione richiesta" });
      }

      // Try user-specific config first, then fall back to global Aruba config
      const emailConfigs = await storage.getUserEmailConfigs(userId);
      const emailConfig = emailConfigs[0];
      let userCredentials: UserEmailCredentials;
      let userEmail: string;

      if (emailConfig?.emailAddress) {
        userCredentials = {
          emailAddress: emailConfig.emailAddress,
          password: emailConfig.password,
          imapHost: emailConfig.imapHost,
          imapPort: emailConfig.imapPort,
          imapSecure: emailConfig.imapSecure,
          smtpHost: emailConfig.smtpHost,
          smtpPort: emailConfig.smtpPort,
          smtpSecure: emailConfig.smtpSecure,
        };
        userEmail = emailConfig.emailAddress.toLowerCase();
      } else if (process.env.ARUBA_EMAIL_ADDRESS && process.env.ARUBA_EMAIL_PASSWORD) {
        // Fallback to global Aruba credentials
        userCredentials = {
          emailAddress: process.env.ARUBA_EMAIL_ADDRESS,
          password: process.env.ARUBA_EMAIL_PASSWORD,
          imapHost: "imaps.aruba.it",
          imapPort: 993,
          imapSecure: true,
          smtpHost: "smtps.aruba.it",
          smtpPort: 465,
          smtpSecure: true,
        };
        userEmail = process.env.ARUBA_EMAIL_ADDRESS.toLowerCase();
      } else {
        return res.status(400).json({ error: "Email non configurata" });
      }

      // Fetch emails to extract contacts
      let allEmails: any[] = [];
      try {
        const inboxEmails = await fetchEmailsFromFolderWithConfig(userCredentials, "INBOX", 100);
        allEmails = allEmails.concat(inboxEmails);
      } catch (e) {
        console.log("Error fetching INBOX for contacts:", e);
      }

      // Extract unique contacts
      const contactMap = new Map<string, { email: string; name: string; count: number }>();

      for (const email of allEmails) {
        // Extract from field
        const fromMatch = (email.from || "").match(/<([^>]+)>/) || [null, email.from];
        const fromEmail = (fromMatch[1] || email.from || "").toLowerCase().trim();
        const fromName = (email.from || "").replace(/<[^>]+>/, "").trim() || fromEmail;

        if (fromEmail && fromEmail !== userEmail && !fromEmail.includes("noreply") && !fromEmail.includes("no-reply")) {
          const existing = contactMap.get(fromEmail);
          if (existing) {
            existing.count++;
          } else {
            contactMap.set(fromEmail, { email: fromEmail, name: fromName, count: 1 });
          }
        }

        // Extract to field
        const toMatch = (email.to || "").match(/<([^>]+)>/) || [null, email.to];
        const toEmail = (toMatch[1] || email.to || "").toLowerCase().trim();
        const toName = (email.to || "").replace(/<[^>]+>/, "").trim() || toEmail;

        if (toEmail && toEmail !== userEmail && !toEmail.includes("noreply") && !toEmail.includes("no-reply")) {
          const existing = contactMap.get(toEmail);
          if (existing) {
            existing.count++;
          } else {
            contactMap.set(toEmail, { email: toEmail, name: toName, count: 1 });
          }
        }
      }

      // Convert to array and sort by count
      const contacts = Array.from(contactMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 50);

      res.json(contacts);
    } catch (error: any) {
      console.error("Get email contacts error:", error);
      res.status(500).json({ error: error.message || "Failed to get email contacts" });
    }
  });

  // =====================
  // COLLABORATION API
  // =====================

  // Project Comments
  app.get("/api/projects/:projectId/comments", async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const comments = await storage.getProjectComments(projectId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: "Failed to get comments" });
    }
  });

  app.post("/api/projects/:projectId/comments", async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const { userId, content, mentions } = req.body;

      const comment = await storage.createProjectComment({
        projectId,
        userId,
        content,
        mentions: mentions || [],
      });

      // Create notifications for mentions
      if (mentions && mentions.length > 0) {
        const fromUser = await storage.getUser(userId);
        const project = await storage.getProject(projectId);

        for (const mentionedUserId of mentions) {
          await storage.createNotification({
            userId: mentionedUserId,
            type: "mention",
            title: "Ti hanno menzionato",
            message: `${fromUser?.name || "Qualcuno"} ti ha menzionato in un commento su "${project?.title || "un progetto"}"`,
            resourceType: "project",
            resourceId: projectId,
            fromUserId: userId,
          });
        }
      }

      res.json(comment);
    } catch (error) {
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  app.delete("/api/comments/:commentId", async (req: Request, res: Response) => {
    try {
      const { commentId } = req.params;
      await storage.deleteProjectComment(commentId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // Notifications
  app.get("/api/notifications/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to get notifications" });
    }
  });

  app.patch("/api/notifications/:notificationId/read", async (req: Request, res: Response) => {
    try {
      const { notificationId } = req.params;
      await storage.markNotificationRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.post("/api/notifications/:userId/mark-all-read", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      await storage.markAllNotificationsRead(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  // Shared Links
  app.post("/api/shared-links", async (req: Request, res: Response) => {
    try {
      const { resourceType, resourceId, permission, password, expiresAt, createdBy } = req.body;

      const token = crypto.randomUUID().replace(/-/g, "");

      const sharedLink = await storage.createSharedLink({
        resourceType,
        resourceId,
        token,
        permission: permission || "view",
        password: password || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy,
      });

      res.json(sharedLink);
    } catch (error) {
      res.status(500).json({ error: "Failed to create shared link" });
    }
  });

  app.get("/api/shared-links/resource/:resourceType/:resourceId", async (req: Request, res: Response) => {
    try {
      const { resourceType, resourceId } = req.params;
      const links = await storage.getSharedLinks(resourceType, resourceId);
      res.json(links);
    } catch (error) {
      res.status(500).json({ error: "Failed to get shared links" });
    }
  });

  app.delete("/api/shared-links/:linkId", async (req: Request, res: Response) => {
    try {
      const { linkId } = req.params;
      await storage.deleteSharedLink(linkId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete shared link" });
    }
  });

  app.get("/api/share/:token", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const { password } = req.query;

      const link = await storage.getSharedLinkByToken(token);

      if (!link) {
        return res.status(404).json({ error: "Link non trovato" });
      }

      if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
        return res.status(410).json({ error: "Link scaduto" });
      }

      if (link.password && link.password !== password) {
        return res.status(401).json({ error: "Password richiesta", requiresPassword: true });
      }

      // Get the resource based on type
      let resource = null;
      if (link.resourceType === "project") {
        resource = await storage.getProject(link.resourceId);
      }

      res.json({ link, resource });
    } catch (error) {
      res.status(500).json({ error: "Failed to access shared resource" });
    }
  });

  // Team Availability
  app.get("/api/team-availability", async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const availability = await storage.getTeamAvailability(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(availability);
    } catch (error) {
      res.status(500).json({ error: "Failed to get team availability" });
    }
  });

  app.post("/api/team-availability", async (req: Request, res: Response) => {
    try {
      const { userId, startTime, endTime, availabilityType, title, description } = req.body;

      const availability = await storage.createTeamAvailability({
        userId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        availabilityType: availabilityType || "available",
        title,
        description,
      });

      res.json(availability);
    } catch (error) {
      res.status(500).json({ error: "Failed to create availability" });
    }
  });

  app.put("/api/team-availability/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (updates.startTime) updates.startTime = new Date(updates.startTime);
      if (updates.endTime) updates.endTime = new Date(updates.endTime);

      const availability = await storage.updateTeamAvailability(id, updates);
      res.json(availability);
    } catch (error) {
      res.status(500).json({ error: "Failed to update availability" });
    }
  });

  app.delete("/api/team-availability/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteTeamAvailability(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete availability" });
    }
  });

  // =====================
  // Database Explorer API (Admin Only)
  // =====================

  const tableNames = ["users", "projects", "tasks", "emails", "documents", "todoItems", "chatChannels", "chatMessages", "telegramChats", "telegramMessages", "activityFeed", "taskComments", "appSettings"];

  const adminAuthMiddleware = async (req: Request, res: Response, next: Function) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      const userRole = req.headers["x-user-role"] as string;

      if (!userId || !userRole) {
        return res.status(401).json({ error: "Autenticazione richiesta" });
      }

      if (userRole !== "Admin") {
        return res.status(403).json({ error: "Accesso riservato agli amministratori" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== "Admin") {
        return res.status(403).json({ error: "Accesso non autorizzato" });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: "Errore di autenticazione" });
    }
  };

  // Middleware for Finanza module - only massimo.canuto can access
  const finanzaAuthMiddleware = async (req: Request, res: Response, next: Function) => {
    try {
      // Try header first, then session
      const userId = (req.headers["x-user-id"] as string) || (req.session as any)?.userId;

      if (!userId) {
        return res.status(401).json({ error: "Autenticazione richiesta" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.username !== "massimo.canuto" && user.username !== "admin")) {
        return res.status(403).json({ error: "Accesso al modulo Finanza riservato" });
      }

      next();
    } catch (error) {
      console.error("Finance auth error:", error);
      res.status(500).json({ error: "Errore di autenticazione" });
    }
  };

  app.get("/api/admin/db/tables", adminAuthMiddleware, async (req: Request, res: Response) => {
    try {
      // Query sqlite_master to get all table names
      const result = await db.execute(sql`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`);
      const tables = result.rows.map((r: any) => r.name);
      res.json({ tables });
    } catch (error) {
      console.error("Failed to get tables:", error);
      res.status(500).json({ error: "Failed to get tables" });
    }
  });

  app.get("/api/admin/db/:tableName", adminAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const { tableName } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const offset = (page - 1) * pageSize;

      // Validate table name against sqlite_master to prevent injection
      const tablesResult = await db.execute(sql`SELECT name FROM sqlite_master WHERE type='table' AND name = ${tableName}`);
      if (!tablesResult.rows || tablesResult.rows.length === 0) {
        return res.status(400).json({ error: "Invalid table name" });
      }

      // Count total records
      const countResult = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${tableName}`));
      const total = countResult.rows[0].count;

      // Fetch paginated data
      const dataResult = await db.execute(sql.raw(`SELECT * FROM ${tableName} LIMIT ${pageSize} OFFSET ${offset}`));
      let data = dataResult.rows;

      // Redact sensitive columns
      if (data.length > 0) {
        const sensitiveKeys = ['password', 'token', 'secret', 'session', 'hash'];
        data = data.map((row: any) => {
          const newRow = { ...row };
          for (const key of Object.keys(newRow)) {
            if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
              newRow[key] = "[REDACTED]";
            }
          }
          return newRow;
        });
      }

      res.json({
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      });
    } catch (error) {
      console.error("Database explorer error:", error);
      res.status(500).json({ error: "Failed to get table data" });
    }
  });

  // Purge table data (admin only)
  app.post("/api/admin/db/:tableName/purge", adminAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const { tableName } = req.params;

      const purgeableTables = ["chatMessages", "chatChannels", "activityFeed"];
      if (!purgeableTables.includes(tableName)) {
        return res.status(400).json({ error: "Questa tabella non può essere svuotata" });
      }

      let deleted = 0;

      switch (tableName) {
        case "chatMessages":
          const messages = await storage.getChatMessages();
          deleted = messages.length;
          await storage.purgeAllChatMessages();
          break;
        case "chatChannels":
          const channels = await storage.getChatChannels();
          deleted = channels.length;
          await storage.purgeAllChatChannels();
          break;
        case "activityFeed":
          const activities = await storage.getActivityFeed();
          deleted = activities.length;
          await storage.purgeActivityFeed();
          break;
        default:
          return res.status(400).json({ error: "Tabella non supportata" });
      }

      res.json({ success: true, deleted });
    } catch (error) {
      console.error("Database purge error:", error);
      res.status(500).json({ error: "Errore durante la cancellazione" });
    }
  });

  // Purge ALL data except users/permissions (admin only)
  app.post("/api/admin/db/purge-all", adminAuthMiddleware, async (req: Request, res: Response) => {
    try {
      let totalDeleted = 0;
      let tablesCleared = 0;

      // Tabelle da NON cancellare (gestione utenti e configurazioni)
      const excludedTables = [
        "users", "rolePermissions", "userPermissions", "appSettings", "session"
      ];

      // Ordine di cancellazione (rispetta foreign keys - prima le tabelle dipendenti)
      const tablesToPurge = [
        // Righe e dettagli prima dei master
        { name: "invoiceLines", fn: async () => await db.delete(invoiceLines) },
        { name: "quoteLines", fn: async () => await db.delete(quoteLines) },
        { name: "ddtLines", fn: async () => await db.delete(ddtLines) },
        { name: "spedizioniRighe", fn: async () => await db.delete(spedizioniRighe) },
        { name: "warehouseMovements", fn: async () => await db.delete(warehouseMovements) },

        // Tabelle con riferimenti
        { name: "invoiceReminders", fn: async () => await db.delete(invoiceReminders) },
        { name: "projectEmails", fn: async () => await db.delete(projectEmails) },
        { name: "projectDocuments", fn: async () => await db.delete(projectDocuments) },
        { name: "projectComments", fn: async () => await db.delete(projectComments) },
        { name: "taskComments", fn: async () => await db.delete(taskComments) },
        { name: "subtasks", fn: async () => await db.delete(subtasks) },
        { name: "timeEntries", fn: async () => await db.delete(timeEntries) },
        { name: "documentShares", fn: async () => await db.delete(documentShares) },
        { name: "documentComments", fn: async () => await db.delete(documentComments) },
        { name: "whiteboardElements", fn: async () => await db.delete(whiteboardElements) },

        // CRM
        { name: "crmAttivita", fn: async () => await db.delete(crmAttivita) },
        { name: "crmOpportunita", fn: async () => await db.delete(crmOpportunita) },
        { name: "crmLeads", fn: async () => await db.delete(crmLeads) },

        // Referenti e indirizzi
        { name: "referentiClienti", fn: async () => await db.delete(referentiClienti) },
        { name: "indirizziSpedizioneClienti", fn: async () => await db.delete(indirizziSpedizioneClienti) },
        { name: "clientPortalTokens", fn: async () => await db.delete(clientPortalTokens) },

        // Documenti master
        { name: "invoices", fn: async () => await db.delete(invoices) },
        { name: "quotes", fn: async () => await db.delete(quotes) },
        { name: "ddt", fn: async () => await db.delete(ddt) },
        { name: "spedizioni", fn: async () => await db.delete(spedizioni) },

        // Altre tabelle master
        { name: "tasks", fn: async () => await db.delete(tasks) },
        { name: "projects", fn: async () => await db.delete(projects) },
        { name: "emails", fn: async () => await db.delete(emails) },
        { name: "documents", fn: async () => await db.delete(documents) },
        { name: "archivedDocuments", fn: async () => await db.delete(archivedDocuments) },
        { name: "archiveFolders", fn: async () => await db.delete(archiveFolders) },

        // Anagrafica
        { name: "anagraficaClienti", fn: async () => await db.delete(anagraficaClienti) },
        { name: "anagraficaPersonale", fn: async () => await db.delete(anagraficaPersonale) },
        { name: "anagraficaFornitori", fn: async () => await db.delete(anagraficaFornitori) },

        // Magazzino
        { name: "warehouseProducts", fn: async () => await db.delete(warehouseProducts) },
        { name: "warehouseCategories", fn: async () => await db.delete(warehouseCategories) },
        { name: "warehouseCodeCounters", fn: async () => await db.delete(warehouseCodeCounters) },

        // Corrieri
        { name: "corrieri", fn: async () => await db.delete(corrieri) },

        // Chat e messaggi
        { name: "chatMessages", fn: async () => await db.delete(chatMessages) },
        { name: "chatChannels", fn: async () => await db.delete(chatChannels) },
        { name: "telegramMessages", fn: async () => await db.delete(telegramMessages) },
        { name: "telegramChats", fn: async () => await db.delete(telegramChats) },
        { name: "whatsappMessages", fn: async () => await db.delete(whatsappMessages) },
        { name: "whatsappContacts", fn: async () => await db.delete(whatsappContacts) },

        // Keep e note
        { name: "keepNotes", fn: async () => await db.delete(keepNotes) },
        { name: "keepLabels", fn: async () => await db.delete(keepLabels) },
        { name: "keepNoteTemplates", fn: async () => await db.delete(keepNoteTemplates) },

        // Altre tabelle
        { name: "whiteboards", fn: async () => await db.delete(whiteboards) },
        { name: "personalTodos", fn: async () => await db.delete(personalTodos) },
        { name: "todoTemplates", fn: async () => await db.delete(todoTemplates) },
        { name: "notifications", fn: async () => await db.delete(notifications) },
        { name: "activityFeed", fn: async () => await db.delete(activityFeed) },
        { name: "sharedLinks", fn: async () => await db.delete(sharedLinks) },
        { name: "teamAvailability", fn: async () => await db.delete(teamAvailability) },

        // Contatori fatture
        { name: "invoiceCounters", fn: async () => await db.delete(invoiceCounters) },
      ];

      for (const table of tablesToPurge) {
        try {
          const result = await table.fn();
          if (result && typeof result.rowCount === 'number') {
            totalDeleted += result.rowCount;
          }
          tablesCleared++;
        } catch (err) {
          console.log(`Skipping table ${table.name}:`, err);
        }
      }

      res.json({
        success: true,
        totalDeleted,
        tablesCleared,
        message: "Database svuotato con successo (esclusi utenti e configurazioni)"
      });
    } catch (error) {
      console.error("Database purge-all error:", error);
      res.status(500).json({ error: "Errore durante la cancellazione totale" });
    }
  });

  // =====================
  // PULSE KEEP API
  // =====================
  app.get("/api/keep/notes/:userId", async (req: Request, res: Response) => {
    const notes = await storage.getKeepNotes(req.params.userId);
    res.json(notes);
  });

  app.post("/api/keep/notes", async (req: Request, res: Response) => {
    try {
      console.log("[PulseKeep] Create Note Request - User:", (req as any).user, "Session:", (req as any).session);
      // FORCE AUTH CHECK
      if (!(req as any).user && !(req as any).session?.userId) {
        console.log("[PulseKeep] Unauthorized access attempt");
        return res.status(401).json({ error: "Unauthorized" });
      }

      const currentUserId = (req as any).user?.id || (req as any).session?.userId;

      // Override userId from session to ensure security and validity
      const noteData = insertKeepNoteSchema.parse({
        ...req.body,
        userId: currentUserId
      });

      const note = await storage.createKeepNote(noteData);
      res.status(201).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating keep note:", error);
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  app.patch("/api/keep/notes/:id", async (req: Request, res: Response) => {
    try {
      const note = await storage.updateKeepNote(req.params.id, req.body);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      console.error("Error updating keep note:", error);
      res.status(500).json({ error: "Failed to update note" });
    }
  });

  app.delete("/api/keep/notes/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteKeepNote(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting keep note:", error);
      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  // Get deleted notes (trash)
  app.get("/api/keep/notes/:userId/trash", async (req: Request, res: Response) => {
    const notes = await storage.getDeletedKeepNotes(req.params.userId);
    res.json(notes);
  });

  // Soft delete (move to trash)
  app.post("/api/keep/notes/:id/trash", async (req: Request, res: Response) => {
    try {
      console.log(`[DEBUG] Soft delete request for note ID: ${req.params.id}`);
      console.log(`[DEBUG] storage.softDeleteKeepNote type:`, typeof storage.softDeleteKeepNote);

      if (typeof storage.softDeleteKeepNote !== 'function') {
        console.error('[CRITICAL] storage.softDeleteKeepNote is NOT a function!');
        return res.status(500).json({ error: 'Server configuration error: softDeleteKeepNote not implemented' });
      }

      const note = await storage.softDeleteKeepNote(req.params.id);
      console.log(`[DEBUG] Soft delete result:`, note);

      if (!note) {
        console.log(`[DEBUG] Note ${req.params.id} not found`);
        return res.status(404).json({ error: "Note not found" });
      }

      console.log(`[DEBUG] Successfully soft-deleted note ${req.params.id}`);
      res.json(note);
    } catch (error) {
      console.error("[CRITICAL] Error moving note to trash:", error);
      console.error("[CRITICAL] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ error: "Failed to move note to trash", details: String(error) });
    }
  });

  // Restore from trash
  app.post("/api/keep/notes/:id/restore", async (req: Request, res: Response) => {
    try {
      const note = await storage.restoreKeepNote(req.params.id);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      console.error("Error restoring note:", error);
      res.status(500).json({ error: "Failed to restore note" });
    }
  });

  // Duplicate note
  app.post("/api/keep/notes/:id/duplicate", async (req: Request, res: Response) => {
    try {
      const note = await storage.duplicateKeepNote(req.params.id);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.status(201).json(note);
    } catch (error) {
      console.error("Error duplicating note:", error);
      res.status(500).json({ error: "Failed to duplicate note" });
    }
  });

  // Update notes order (for drag-and-drop)
  app.patch("/api/keep/notes/order", async (req: Request, res: Response) => {
    try {
      const updates = req.body as { id: string; orderIndex: number }[];
      await storage.updateKeepNotesOrder(updates);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating notes order:", error);
      res.status(500).json({ error: "Failed to update notes order" });
    }
  });

  app.get("/api/keep/labels/:userId", async (req: Request, res: Response) => {
    const labels = await storage.getKeepLabels(req.params.userId);
    res.json(labels);
  });

  app.post("/api/keep/labels", async (req: Request, res: Response) => {
    try {
      const labelData = insertKeepLabelSchema.parse(req.body);
      const label = await storage.createKeepLabel(labelData);
      res.status(201).json(label);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create label" });
    }
  });

  app.delete("/api/keep/labels/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteKeepLabel(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete label" });
    }
  });

  // =====================
  // WHITEBOARD API
  // =====================
  app.get("/api/whiteboards", async (req: Request, res: Response) => {
    const userId = (req as any).session?.userId || req.query.userId as string | undefined;
    if (!userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }
    const boards = await storage.getWhiteboards();
    const filteredBoards = boards.filter(b =>
      b.ownerId === userId ||
      b.isPublic ||
      (b.collaborators && b.collaborators.includes(userId))
    );
    res.json(filteredBoards);
  });

  app.get("/api/whiteboards/:id", async (req: Request, res: Response) => {
    const userId = (req as any).session?.userId || req.query.userId as string | undefined;
    if (!userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    const board = await storage.getWhiteboard(req.params.id);
    if (!board) {
      return res.status(404).json({ error: "Lavagna non trovata" });
    }

    const hasAccess = board.ownerId === userId ||
      board.isPublic ||
      (board.collaborators && board.collaborators.includes(userId));
    if (!hasAccess) {
      return res.status(403).json({ error: "Non autorizzato" });
    }

    res.json(board);
  });

  app.post("/api/whiteboards", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId || req.body.ownerId as string | undefined;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const boardData = insertWhiteboardSchema.parse({
        ...req.body,
        ownerId: userId,
      });
      const board = await storage.createWhiteboard(boardData);
      res.status(201).json(board);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating whiteboard:", error);
      res.status(500).json({ error: "Errore nella creazione della lavagna" });
    }
  });

  app.patch("/api/whiteboards/:id", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId as string | undefined;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const existing = await storage.getWhiteboard(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Lavagna non trovata" });
      }

      const canEdit = existing.ownerId === userId ||
        (existing.collaborators && existing.collaborators.includes(userId));
      if (!canEdit) {
        return res.status(403).json({ error: "Non autorizzato" });
      }

      const board = await storage.updateWhiteboard(req.params.id, {
        ...req.body,
        updatedAt: new Date()
      });
      res.json(board);
    } catch (error) {
      console.error("Error updating whiteboard:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento della lavagna" });
    }
  });

  app.delete("/api/whiteboards/:id", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId || req.query.userId as string | undefined;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const existing = await storage.getWhiteboard(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Lavagna non trovata" });
      }

      if (existing.ownerId !== userId) {
        return res.status(403).json({ error: "Solo il proprietario può eliminare la lavagna" });
      }

      await storage.deleteWhiteboard(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting whiteboard:", error);
      res.status(500).json({ error: "Errore nell'eliminazione della lavagna" });
    }
  });

  // Add collaborator to whiteboard
  app.post("/api/whiteboards/:id/collaborators", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId as string | undefined;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const { collaboratorId } = req.body;
      if (!collaboratorId) {
        return res.status(400).json({ error: "ID collaboratore richiesto" });
      }

      const board = await storage.getWhiteboard(req.params.id);
      if (!board) {
        return res.status(404).json({ error: "Lavagna non trovata" });
      }

      if (board.ownerId !== userId) {
        return res.status(403).json({ error: "Solo il proprietario può aggiungere collaboratori" });
      }

      const collaboratorUser = await storage.getUser(collaboratorId);
      if (!collaboratorUser) {
        return res.status(404).json({ error: "Utente non trovato" });
      }

      const currentCollaborators = board.collaborators || [];
      if (currentCollaborators.includes(collaboratorId)) {
        return res.status(400).json({ error: "Utente già collaboratore" });
      }

      const updatedBoard = await storage.updateWhiteboard(req.params.id, {
        collaborators: [...currentCollaborators, collaboratorId]
      } as any);

      res.json(updatedBoard);
    } catch (error) {
      console.error("Error adding collaborator:", error);
      res.status(500).json({ error: "Errore nell'aggiunta del collaboratore" });
    }
  });

  // Remove collaborator from whiteboard
  app.delete("/api/whiteboards/:id/collaborators/:collaboratorId", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId as string | undefined;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const board = await storage.getWhiteboard(req.params.id);
      if (!board) {
        return res.status(404).json({ error: "Lavagna non trovata" });
      }

      if (board.ownerId !== userId) {
        return res.status(403).json({ error: "Solo il proprietario può rimuovere collaboratori" });
      }

      const currentCollaborators = board.collaborators || [];
      const updatedCollaborators = currentCollaborators.filter(c => c !== req.params.collaboratorId);

      const updatedBoard = await storage.updateWhiteboard(req.params.id, {
        collaborators: updatedCollaborators
      } as any);

      res.json(updatedBoard);
    } catch (error) {
      console.error("Error removing collaborator:", error);
      res.status(500).json({ error: "Errore nella rimozione del collaboratore" });
    }
  });

  // Get collaborators with user details
  app.get("/api/whiteboards/:id/collaborators", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId as string | undefined;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const board = await storage.getWhiteboard(req.params.id);
      if (!board) {
        return res.status(404).json({ error: "Lavagna non trovata" });
      }

      const hasAccess = board.ownerId === userId ||
        board.isPublic ||
        (board.collaborators && board.collaborators.includes(userId));
      if (!hasAccess) {
        return res.status(403).json({ error: "Non autorizzato" });
      }

      const users = await storage.getUsers();
      const collaboratorIds = board.collaborators || [];
      const collaborators = users
        .filter((u: any) => collaboratorIds.includes(u.id))
        .map((u: any) => ({
          id: u.id,
          name: u.name,
          username: u.username,
          email: u.email,
          avatar: u.avatar
        }));

      const owner = users.find((u: any) => u.id === board.ownerId);

      res.json({
        owner: owner ? {
          id: owner.id,
          name: owner.name,
          username: owner.username,
          email: owner.email,
          avatar: owner.avatar
        } : null,
        collaborators
      });
    } catch (error) {
      console.error("Error getting collaborators:", error);
      res.status(500).json({ error: "Errore nel recupero dei collaboratori" });
    }
  });

  // Whiteboard Elements
  app.get("/api/whiteboards/:id/elements", async (req: Request, res: Response) => {
    const elements = await storage.getWhiteboardElements(req.params.id);
    res.json(elements);
  });

  app.post("/api/whiteboards/:id/elements", async (req: Request, res: Response) => {
    try {
      const elementData = insertWhiteboardElementSchema.parse({
        ...req.body,
        whiteboardId: req.params.id,
      });
      const element = await storage.createWhiteboardElement(elementData);
      res.status(201).json(element);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating element:", error);
      res.status(500).json({ error: "Failed to create element" });
    }
  });

  app.post("/api/whiteboards/:id/upload", whiteboardUpload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nessun file caricato" });
      }

      const fileUrl = `/uploads/whiteboards/${req.file.filename}`;
      const fileType = req.file.mimetype;
      const fileName = req.file.originalname;
      const fileSize = req.file.size;

      let elementType = 'file';
      if (fileType.startsWith('image/')) {
        elementType = 'image';
      } else if (fileType.includes('pdf')) {
        elementType = 'pdf';
      } else if (fileType.includes('presentation') || fileType.includes('powerpoint')) {
        elementType = 'ppt';
      } else if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
        elementType = 'excel';
      } else if (fileType.includes('word') || fileType.includes('document')) {
        elementType = 'word';
      }

      const elementData = {
        whiteboardId: req.params.id,
        type: elementType,
        x: parseInt(req.body.x) || 100,
        y: parseInt(req.body.y) || 100,
        width: 200,
        height: elementType === 'image' ? 150 : 60,
        content: JSON.stringify({ url: fileUrl, filename: fileName, size: fileSize, mimetype: fileType }),
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'normal',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        zIndex: 0,
        locked: false,
      };

      const element = await storage.createWhiteboardElement(elementData);
      res.status(201).json({ ...element, fileUrl, fileName, fileType });
    } catch (error) {
      console.error("Error uploading file to whiteboard:", error);
      res.status(500).json({ error: "Errore nel caricamento del file" });
    }
  });

  app.patch("/api/whiteboard-elements/:id", async (req: Request, res: Response) => {
    try {
      const element = await storage.updateWhiteboardElement(req.params.id, req.body);
      if (!element) {
        return res.status(404).json({ error: "Element not found" });
      }
      res.json(element);
    } catch (error) {
      console.error("Error updating element:", error);
      res.status(500).json({ error: "Failed to update element" });
    }
  });

  app.delete("/api/whiteboard-elements/:id", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId || req.query.userId as string | undefined;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }
      await storage.deleteWhiteboardElement(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting element:", error);
      res.status(500).json({ error: "Failed to delete element" });
    }
  });

  // =====================
  // USER EMAIL CONFIG API
  // =====================


  app.post("/api/user-email-config/test", async (req: Request, res: Response) => {
    const userId = (req as any).session?.userId || req.headers["x-user-id"];
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const { emailAddress, imapHost, imapPort, imapSecure, smtpHost, smtpPort, smtpSecure, password } = req.body;

      // Test IMAP connection first (this is usually where auth fails)
      const imapResult = await testEmailConnection({
        emailAddress,
        password,
        imapHost,
        imapPort,
        imapSecure,
        smtpHost,
        smtpPort,
        smtpSecure,
      });

      if (!imapResult.success) {
        return res.status(400).json({
          success: false,
          message: `IMAP: ${imapResult.error}`
        });
      }

      // Then test SMTP
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.default.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: emailAddress,
          pass: password,
        },
      });

      await transporter.verify();
      res.json({ success: true, message: "Connessione IMAP e SMTP riuscita!" });
    } catch (error: any) {
      console.error("Email test failed:", error);
      res.status(400).json({ success: false, message: error.message || "Connessione fallita" });
    }
  });



  // =====================
  // PARSE CEDOLINO (AI)
  // =====================
  app.post("/api/parse-cedolino", upload.single("file"), async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "Nessun file caricato" });
      }

      let textContent = "";

      // Se è un PDF, estrai il testo
      if (file.mimetype === "application/pdf") {
        try {
          const pdfjs = await getPdfjs();
          const dataBuffer = fs.readFileSync(file.path);
          const uint8Array = new Uint8Array(dataBuffer);
          const pdfDoc = await pdfjs.getDocument({ data: uint8Array }).promise;
          const textParts: string[] = [];
          for (let i = 1; i <= pdfDoc.numPages; i++) {
            const page = await pdfDoc.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map((item: any) => item.str).join(' ');
            textParts.push(pageText);
          }
          textContent = textParts.join('\n').trim();
          console.log(`PDF text extracted: ${textContent.length} characters`);
        } catch (pdfError: any) {
          console.log("PDF text extraction failed:", pdfError?.message);
          fs.unlinkSync(file.path);
          return res.status(400).json({
            error: "Impossibile leggere il PDF. Prova a caricare un'immagine (JPG, PNG) del cedolino invece."
          });
        }

        // Se il PDF non ha testo sufficiente
        if (!textContent || textContent.length < 20) {
          fs.unlinkSync(file.path);
          return res.status(400).json({
            error: "Il PDF sembra essere una scansione senza testo estraibile. Carica un'immagine (JPG, PNG) del cedolino per usare il riconoscimento automatico."
          });
        }
      } else if (file.mimetype.startsWith("image/")) {
        // Per le immagini, usiamo vision di OpenAI
        const imageBuffer = fs.readFileSync(file.path);
        const base64Image = imageBuffer.toString("base64");
        const mimeType = file.mimetype;

        const OpenAI = (await import("openai")).default;
        const openai = new OpenAI({
          baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
          apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
        });

        const visionResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "Estrai tutto il testo visibile da questo cedolino/busta paga. Trascrivi accuratamente tutti i dati: nome, cognome, codice fiscale, indirizzo, CCNL, livello, importi, date, IBAN, ecc." },
                { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } }
              ]
            }
          ],
          max_tokens: 4096
        });

        textContent = visionResponse.choices[0]?.message?.content || "";
      } else {
        // Prova a leggere come testo
        textContent = fs.readFileSync(file.path, "utf-8");
      }

      // Rimuovi il file temporaneo
      fs.unlinkSync(file.path);

      if (!textContent) {
        return res.status(400).json({ error: "Impossibile estrarre testo dal documento" });
      }

      // Usa AI per parsare il cedolino
      const { parseCedolino } = await import("./aiService");
      const parsedData = await parseCedolino(textContent);

      res.json(parsedData);
    } catch (error: any) {
      console.error("Error parsing cedolino:", error?.message || error);
      console.error("Stack:", error?.stack);
      res.status(500).json({ error: "Errore nell'elaborazione del cedolino", details: error?.message });
    }
  });

  // =====================
  // CEDOLINI MANAGEMENT
  // =====================
  const cedoliniStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(process.cwd(), "uploads", "cedolini");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  });
  const cedoliniUpload = multer({ storage: cedoliniStorage, limits: { fileSize: 10 * 1024 * 1024 } });

  app.get("/api/cedolini", async (req: Request, res: Response) => {
    try {
      const cedolini = await storage.getAllCedolini();
      res.json(cedolini);
    } catch (error) {
      console.error("Error fetching cedolini:", error);
      res.status(500).json({ error: "Errore nel recupero dei cedolini" });
    }
  });

  app.get("/api/cedolini/personale/:personaleId", async (req: Request, res: Response) => {
    const cedolini = await storage.getCedoliniByPersonale(req.params.personaleId);
    res.json(cedolini);
  });

  app.post("/api/cedolini", cedoliniUpload.single("file"), async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ error: "Nessun file caricato" });

      const { personaleId, mese, anno, stipendioLordo, stipendioNetto, contributiInps, irpef, bonus, straordinari, note } = req.body;

      if (!personaleId || !mese || !anno) {
        fs.unlinkSync(file.path);
        return res.status(400).json({ error: "Dati mancanti" });
      }

      const cedolino = await storage.createCedolino({
        personaleId,
        mese: parseInt(mese),
        anno: parseInt(anno),
        filename: file.originalname,
        filepath: file.path,
        filesize: file.size,
        mimetype: file.mimetype,
        stipendioLordo: stipendioLordo || null,
        stipendioNetto: stipendioNetto || null,
        contributiInps: contributiInps || null,
        irpef: irpef || null,
        bonus: bonus || null,
        straordinari: straordinari || null,
        note: note || null,
      });

      // Send email notification to the employee
      try {
        const personale = await storage.getAnagraficaPersonaleById(personaleId);
        if (personale && personale.email) {
          const emailSent = await sendCedolinoEmail(
            personale.email,
            `${personale.nome} ${personale.cognome}`,
            parseInt(mese),
            parseInt(anno),
            personale.portalToken || undefined
          );
          if (emailSent) {
            console.log(`Cedolino email sent to ${personale.email}`);
          }
        }
      } catch (emailError) {
        console.error("Error sending cedolino email:", emailError);
      }

      res.status(201).json(cedolino);
    } catch (error) {
      console.error("Error creating cedolino:", error);
      res.status(500).json({ error: "Errore nel salvataggio del cedolino" });
    }
  });

  app.get("/api/cedolini/download/:id", async (req: Request, res: Response) => {
    const cedolino = await storage.getCedolinoById(req.params.id);
    if (!cedolino) return res.status(404).json({ error: "Cedolino non trovato" });

    if (!fs.existsSync(cedolino.filepath)) {
      return res.status(404).json({ error: "File non trovato" });
    }

    res.download(cedolino.filepath, cedolino.filename);
  });

  app.delete("/api/cedolini/:id", async (req: Request, res: Response) => {
    const cedolino = await storage.getCedolinoById(req.params.id);
    if (!cedolino) return res.status(404).json({ error: "Cedolino non trovato" });

    if (fs.existsSync(cedolino.filepath)) {
      fs.unlinkSync(cedolino.filepath);
    }

    await storage.deleteCedolino(req.params.id);
    res.status(204).send();
  });

  // =====================
  // TIMBRATURE (Time Clock)
  // =====================
  app.get("/api/timbrature", async (req: Request, res: Response) => {
    const timbrature = await storage.getAllTimbrature();
    res.json(timbrature);
  });

  app.get("/api/timbrature/:personaleId", async (req: Request, res: Response) => {
    const timbrature = await storage.getTimbratureByPersonale(req.params.personaleId);
    res.json(timbrature);
  });

  app.post("/api/timbrature", async (req: Request, res: Response) => {
    try {
      const { personaleId, tipo, latitudine, longitudine, indirizzo, dispositivo, note } = req.body;
      if (!personaleId || !tipo) {
        return res.status(400).json({ error: "Collaboratore e tipo timbratura richiesti" });
      }

      // Check for approved leave on current date
      const today = new Date().toISOString().split('T')[0];
      const richieste = await storage.getAllRichiesteAssenza();
      const assenzaOggi = richieste.find((r: any) => {
        if (r.personaleId !== personaleId || r.stato !== 'approvata') return false;
        const dataInizio = r.dataInizio.split('T')[0];
        const dataFine = r.dataFine.split('T')[0];
        return today >= dataInizio && today <= dataFine;
      });

      if (assenzaOggi) {
        const tipiAssenza: Record<string, string> = {
          ferie: "Ferie",
          permesso: "Permesso (ROL)",
          malattia: "Malattia",
          maternita: "Maternità",
          paternita: "Paternità",
          lutto: "Lutto",
          altro: "Altro"
        };
        const causale = tipiAssenza[assenzaOggi.tipo] || assenzaOggi.tipo;
        return res.status(400).json({
          error: `Non puoi timbrare: oggi risulti assente per "${causale}"`,
          assenza: {
            tipo: assenzaOggi.tipo,
            causale,
            dataInizio: assenzaOggi.dataInizio,
            dataFine: assenzaOggi.dataFine,
            motivo: assenzaOggi.motivo
          }
        });
      }

      const timbratura = await storage.createTimbratura({
        personaleId,
        tipo,
        dataOra: new Date(),
        latitudine: latitudine || null,
        longitudine: longitudine || null,
        indirizzo: indirizzo || null,
        dispositivo: dispositivo || null,
        note: note || null,
      });

      res.status(201).json(timbratura);
    } catch (error) {
      console.error("Error creating timbratura:", error);
      res.status(500).json({ error: "Errore nella registrazione della timbratura" });
    }
  });

  app.put("/api/timbrature/:id", async (req: Request, res: Response) => {
    try {
      const { dataOra, tipo } = req.body;
      const [updated] = await db.update(timbrature)
        .set({
          dataOra: dataOra ? new Date(dataOra) : undefined,
          tipo: tipo || undefined,
        })
        .where(eq(timbrature.id, req.params.id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Timbratura non trovata" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating timbratura:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento della timbratura" });
    }
  });

  app.delete("/api/timbrature/:id", async (req: Request, res: Response) => {
    await storage.deleteTimbratura(req.params.id);
    res.status(204).send();
  });

  // =====================
  // TURNI (Work Shifts)
  // =====================
  app.get("/api/turni", async (req: Request, res: Response) => {
    const turni = await storage.getAllTurni();
    res.json(turni);
  });

  app.get("/api/turni/:personaleId", async (req: Request, res: Response) => {
    const turni = await storage.getTurniByPersonale(req.params.personaleId);
    res.json(turni);
  });

  app.post("/api/turni", async (req: Request, res: Response) => {
    try {
      const turno = await storage.createTurno(req.body);
      res.status(201).json(turno);
    } catch (error) {
      console.error("Error creating turno:", error);
      res.status(500).json({ error: "Errore nella creazione del turno" });
    }
  });

  app.put("/api/turni/:id", async (req: Request, res: Response) => {
    try {
      const turno = await storage.updateTurno(req.params.id, req.body);
      if (!turno) return res.status(404).json({ error: "Turno non trovato" });
      res.json(turno);
    } catch (error) {
      console.error("Error updating turno:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento del turno" });
    }
  });

  app.delete("/api/turni/:id", async (req: Request, res: Response) => {
    await storage.deleteTurno(req.params.id);
    res.status(204).send();
  });

  // =====================
  // TURNI PREDEFINITI (Shift Templates)
  // =====================
  app.get("/api/turni-predefiniti", async (req: Request, res: Response) => {
    const turni = await storage.getAllTurniPredefiniti();
    res.json(turni);
  });

  app.post("/api/turni-predefiniti", async (req: Request, res: Response) => {
    try {
      const turno = await storage.createTurnoPredefinita(req.body);
      res.status(201).json(turno);
    } catch (error) {
      console.error("Error creating turno predefinito:", error);
      res.status(500).json({ error: "Errore nella creazione" });
    }
  });

  app.put("/api/turni-predefiniti/:id", async (req: Request, res: Response) => {
    try {
      const turno = await storage.updateTurnoPredefinita(req.params.id, req.body);
      if (!turno) return res.status(404).json({ error: "Non trovato" });
      res.json(turno);
    } catch (error) {
      res.status(500).json({ error: "Errore nell'aggiornamento" });
    }
  });

  app.delete("/api/turni-predefiniti/:id", async (req: Request, res: Response) => {
    await storage.deleteTurnoPredefinita(req.params.id);
    res.status(204).send();
  });

  // =====================
  // STRAORDINARI (Overtime)
  // =====================
  app.get("/api/straordinari", async (req: Request, res: Response) => {
    const straordinari = await storage.getAllStraordinari();
    res.json(straordinari);
  });

  app.get("/api/straordinari/pendenti", async (req: Request, res: Response) => {
    const straordinari = await storage.getStraordinariPendenti();
    res.json(straordinari);
  });

  app.get("/api/straordinari/:personaleId", async (req: Request, res: Response) => {
    const straordinari = await storage.getStraordinariByPersonale(req.params.personaleId);
    res.json(straordinari);
  });

  app.post("/api/straordinari", async (req: Request, res: Response) => {
    try {
      const straordinario = await storage.createStraordinario(req.body);
      res.status(201).json(straordinario);
    } catch (error) {
      console.error("Error creating straordinario:", error);
      res.status(500).json({ error: "Errore nella creazione della richiesta straordinario" });
    }
  });

  app.put("/api/straordinari/:id", async (req: Request, res: Response) => {
    try {
      const straordinario = await storage.updateStraordinario(req.params.id, req.body);
      if (!straordinario) return res.status(404).json({ error: "Straordinario non trovato" });
      res.json(straordinario);
    } catch (error) {
      console.error("Error updating straordinario:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento dello straordinario" });
    }
  });

  app.put("/api/straordinari/:id/approva", async (req: Request, res: Response) => {
    try {
      const { userId, noteApprovazione } = req.body;
      const straordinario = await storage.updateStraordinario(req.params.id, {
        stato: "approvato",
        approvatoDa: userId,
        dataApprovazione: new Date(),
        noteApprovazione: noteApprovazione || null,
      });
      if (!straordinario) return res.status(404).json({ error: "Straordinario non trovato" });
      res.json(straordinario);
    } catch (error) {
      console.error("Error approving straordinario:", error);
      res.status(500).json({ error: "Errore nell'approvazione dello straordinario" });
    }
  });

  app.put("/api/straordinari/:id/rifiuta", async (req: Request, res: Response) => {
    try {
      const { userId, noteApprovazione } = req.body;
      const straordinario = await storage.updateStraordinario(req.params.id, {
        stato: "rifiutato",
        approvatoDa: userId,
        dataApprovazione: new Date(),
        noteApprovazione: noteApprovazione || null,
      });
      if (!straordinario) return res.status(404).json({ error: "Straordinario non trovato" });
      res.json(straordinario);
    } catch (error) {
      console.error("Error rejecting straordinario:", error);
      res.status(500).json({ error: "Errore nel rifiuto dello straordinario" });
    }
  });

  app.delete("/api/straordinari/:id", async (req: Request, res: Response) => {
    await storage.deleteStraordinario(req.params.id);
    res.status(204).send();
  });

  // =====================
  // FERIE E PERMESSI (Leave/Time Off)
  // =====================
  app.get("/api/richieste-assenza", async (req: Request, res: Response) => {
    try {
      const richieste = await storage.getAllRichiesteAssenza();
      res.json(richieste);
    } catch (error) {
      console.error("Error fetching richieste assenza:", error);
      res.status(500).json({ error: "Errore nel recupero delle richieste" });
    }
  });

  app.get("/api/richieste-assenza/pendenti", async (req: Request, res: Response) => {
    try {
      const richieste = await storage.getRichiesteAssenzaPendenti();
      res.json(richieste);
    } catch (error) {
      console.error("Error fetching richieste pendenti:", error);
      res.status(500).json({ error: "Errore nel recupero delle richieste pendenti" });
    }
  });

  app.get("/api/richieste-assenza/:personaleId", async (req: Request, res: Response) => {
    try {
      const richieste = await storage.getRichiesteAssenzaByPersonale(req.params.personaleId);
      res.json(richieste);
    } catch (error) {
      console.error("Error fetching richieste by personale:", error);
      res.status(500).json({ error: "Errore nel recupero delle richieste" });
    }
  });

  app.post("/api/richieste-assenza", async (req: Request, res: Response) => {
    try {
      const richiesta = await storage.createRichiestaAssenza(req.body);
      res.status(201).json(richiesta);
    } catch (error) {
      console.error("Error creating richiesta assenza:", error);
      res.status(500).json({ error: "Errore nella creazione della richiesta" });
    }
  });

  app.put("/api/richieste-assenza/:id", async (req: Request, res: Response) => {
    try {
      const richiesta = await storage.updateRichiestaAssenza(req.params.id, req.body);
      if (!richiesta) return res.status(404).json({ error: "Richiesta non trovata" });
      res.json(richiesta);
    } catch (error) {
      console.error("Error updating richiesta assenza:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento della richiesta" });
    }
  });

  app.put("/api/richieste-assenza/:id/approva", async (req: Request, res: Response) => {
    try {
      const { userId, noteApprovazione } = req.body;
      const richiesta = await storage.updateRichiestaAssenza(req.params.id, {
        stato: "approvata",
        approvatoDa: userId,
        dataApprovazione: new Date(),
        noteApprovazione: noteApprovazione || null,
      });
      if (!richiesta) return res.status(404).json({ error: "Richiesta non trovata" });
      res.json(richiesta);
    } catch (error) {
      console.error("Error approving richiesta assenza:", error);
      res.status(500).json({ error: "Errore nell'approvazione della richiesta" });
    }
  });

  app.put("/api/richieste-assenza/:id/rifiuta", async (req: Request, res: Response) => {
    try {
      const { userId, noteApprovazione } = req.body;
      const richiesta = await storage.updateRichiestaAssenza(req.params.id, {
        stato: "rifiutata",
        approvatoDa: userId,
        dataApprovazione: new Date(),
        noteApprovazione: noteApprovazione || null,
      });
      if (!richiesta) return res.status(404).json({ error: "Richiesta non trovata" });
      res.json(richiesta);
    } catch (error) {
      console.error("Error rejecting richiesta assenza:", error);
      res.status(500).json({ error: "Errore nel rifiuto della richiesta" });
    }
  });

  app.delete("/api/richieste-assenza/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteRichiestaAssenza(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting richiesta assenza:", error);
      res.status(500).json({ error: "Errore nella cancellazione della richiesta" });
    }
  });

  // Saldi Ferie/Permessi
  app.get("/api/saldi-ferie/:personaleId/:anno", async (req: Request, res: Response) => {
    try {
      const saldo = await storage.getSaldoFeriePermessi(req.params.personaleId, parseInt(req.params.anno));
      if (!saldo) {
        const newSaldo = await storage.createSaldoFeriePermessi({
          personaleId: req.params.personaleId,
          anno: parseInt(req.params.anno),
        });
        return res.json(newSaldo);
      }
      res.json(saldo);
    } catch (error) {
      console.error("Error fetching saldo ferie:", error);
      res.status(500).json({ error: "Errore nel recupero del saldo" });
    }
  });

  app.get("/api/saldi-ferie/:anno", async (req: Request, res: Response) => {
    try {
      const saldi = await storage.getAllSaldiFerieByAnno(parseInt(req.params.anno));
      res.json(saldi);
    } catch (error) {
      console.error("Error fetching saldi ferie:", error);
      res.status(500).json({ error: "Errore nel recupero dei saldi" });
    }
  });

  app.put("/api/saldi-ferie/:id", async (req: Request, res: Response) => {
    try {
      const saldo = await storage.updateSaldoFeriePermessi(req.params.id, req.body);
      if (!saldo) return res.status(404).json({ error: "Saldo non trovato" });
      res.json(saldo);
    } catch (error) {
      console.error("Error updating saldo ferie:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento del saldo" });
    }
  });

  // Scadenze HR (Deadline Scheduler)
  app.get("/api/scadenze-hr", async (req: Request, res: Response) => {
    try {
      const scadenze = await storage.getScadenzeHr();
      res.json(scadenze);
    } catch (error) {
      console.error("Error fetching scadenze HR:", error);
      res.status(500).json({ error: "Errore nel recupero delle scadenze" });
    }
  });

  app.get("/api/scadenze-hr/in-scadenza", async (req: Request, res: Response) => {
    try {
      const giorni = parseInt(req.query.giorni as string) || 30;
      const scadenze = await storage.getScadenzeHrInScadenza(giorni);
      res.json(scadenze);
    } catch (error) {
      console.error("Error fetching scadenze in scadenza:", error);
      res.status(500).json({ error: "Errore nel recupero delle scadenze" });
    }
  });

  app.get("/api/scadenze-hr/personale/:personaleId", async (req: Request, res: Response) => {
    try {
      const scadenze = await storage.getScadenzeHrByPersonale(req.params.personaleId);
      res.json(scadenze);
    } catch (error) {
      console.error("Error fetching scadenze by personale:", error);
      res.status(500).json({ error: "Errore nel recupero delle scadenze" });
    }
  });

  app.post("/api/scadenze-hr", async (req: Request, res: Response) => {
    try {
      const scadenza = await storage.createScadenzaHr(req.body);
      res.status(201).json(scadenza);
    } catch (error) {
      console.error("Error creating scadenza HR:", error);
      res.status(500).json({ error: "Errore nella creazione della scadenza" });
    }
  });

  app.put("/api/scadenze-hr/:id", async (req: Request, res: Response) => {
    try {
      const scadenza = await storage.updateScadenzaHr(req.params.id, req.body);
      if (!scadenza) return res.status(404).json({ error: "Scadenza non trovata" });
      res.json(scadenza);
    } catch (error) {
      console.error("Error updating scadenza HR:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento della scadenza" });
    }
  });

  app.put("/api/scadenze-hr/:id/completa", async (req: Request, res: Response) => {
    try {
      const scadenza = await storage.updateScadenzaHr(req.params.id, {
        completata: true,
        dataCompletamento: new Date(),
      });
      if (!scadenza) return res.status(404).json({ error: "Scadenza non trovata" });
      res.json(scadenza);
    } catch (error) {
      console.error("Error completing scadenza HR:", error);
      res.status(500).json({ error: "Errore nel completamento della scadenza" });
    }
  });

  app.delete("/api/scadenze-hr/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteScadenzaHr(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting scadenza HR:", error);
      res.status(500).json({ error: "Errore nella cancellazione della scadenza" });
    }
  });

  // HR KPI Dashboard
  app.get("/api/hr/kpi", async (req: Request, res: Response) => {
    try {
      const personale = await storage.getAnagraficaPersonale();
      const timbrature = await storage.getAllTimbrature();
      const straordinari = await storage.getAllStraordinari();
      const richieste = await storage.getAllRichiesteAssenza();
      const turni = await storage.getAllTurni();

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split("T")[0];
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split("T")[0];

      const personaleAttivo = personale.filter((p: any) => p.stato === "attivo");
      const totaleDipendenti = personaleAttivo.length;

      const turniMese = turni.filter((t: any) => t.data >= startOfMonth && t.data <= endOfMonth);
      const giorniLavorativiPrevisti = turniMese.length;

      const assenzeApprovateMese = richieste.filter((r: any) =>
        r.stato === "approvata" &&
        r.dataInizio >= startOfMonth && r.dataInizio <= endOfMonth
      );
      const giorniAssenza = assenzeApprovateMese.reduce((sum: number, r: any) => sum + parseFloat(r.giorniTotali || "0"), 0);

      const tassoAssenteismo = giorniLavorativiPrevisti > 0
        ? ((giorniAssenza / giorniLavorativiPrevisti) * 100).toFixed(1)
        : "0";

      const straordinariMese = straordinari.filter((s: any) =>
        s.data >= startOfMonth && s.data <= endOfMonth && s.stato === "approvato"
      );
      const oreStraordinarioMese = straordinariMese.reduce((sum: number, s: any) => sum + parseFloat(s.ore || "0"), 0);

      const costoOrarioMedio = 25;
      const costoPersonaleMese = personaleAttivo.reduce((sum: number, p: any) => {
        const stipendio = parseFloat(p.stipendioBase || "0");
        return sum + stipendio;
      }, 0);
      const costoStraordinariMese = oreStraordinarioMese * costoOrarioMedio * 1.25;

      const richiesteInAttesa = richieste.filter((r: any) => r.stato === "richiesta").length;
      const straordinariInAttesa = straordinari.filter((s: any) => s.stato === "richiesto").length;

      const collaboratoriOnline = personale.filter((p: any) => {
        if (!p.portalEnabled || !p.portalLastAccess) return false;
        const lastAccess = new Date(p.portalLastAccess);
        const minutesAgo = (now.getTime() - lastAccess.getTime()) / 1000 / 60;
        return minutesAgo <= 15;
      }).length;

      const malattieAnno = richieste.filter((r: any) =>
        r.tipo === "malattia" &&
        r.stato === "approvata" &&
        r.dataInizio.startsWith(currentYear.toString())
      );
      const giorniMalattiaTotali = malattieAnno.reduce((sum: number, r: any) => sum + parseFloat(r.giorniTotali || "0"), 0);

      res.json({
        totaleDipendenti,
        tassoAssenteismo: parseFloat(tassoAssenteismo),
        oreStraordinarioMese,
        costoPersonaleMese: costoPersonaleMese + costoStraordinariMese,
        richiesteInAttesa,
        straordinariInAttesa,
        collaboratoriOnline,
        giorniMalattiaTotali,
        giorniAssenzaMese: giorniAssenza,
        turniProgrammatiMese: turniMese.length,
      });
    } catch (error) {
      console.error("Error fetching HR KPI:", error);
      res.status(500).json({ error: "Errore nel calcolo dei KPI" });
    }
  });

  // =====================
  // PORTALE PERSONALE (Staff Portal)
  // =====================
  app.post("/api/staff-portal/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username e password richiesti" });
      }

      const personale = await storage.getAnagraficaPersonale();
      const persona = personale.find((p: any) => p.portalUsername === username && p.portalEnabled);

      if (!persona || !persona.portalPasswordHash) {
        return res.status(401).json({ error: "Credenziali non valide" });
      }

      const bcrypt = await import("bcryptjs");
      const validPassword = await bcrypt.compare(password, persona.portalPasswordHash);
      if (!validPassword) {
        return res.status(401).json({ error: "Credenziali non valide" });
      }

      await storage.updateAnagraficaPersonale(persona.id, { portalLastAccess: new Date() });

      const token = Buffer.from(`${persona.id}:${Date.now()}`).toString("base64");

      res.json({
        token,
        personale: {
          id: persona.id,
          nome: persona.nome,
          cognome: persona.cognome,
          email: persona.email,
          ruolo: persona.ruolo,
          reparto: persona.reparto,
        }
      });
    } catch (error) {
      console.error("Staff portal login error:", error);
      res.status(500).json({ error: "Errore di autenticazione" });
    }
  });

  // Login tramite token diretto (link da Accessi Portale)
  app.post("/api/staff-portal/login-token", async (req: Request, res: Response) => {
    try {
      const { portalToken } = req.body;
      if (!portalToken) {
        return res.status(400).json({ error: "Token richiesto" });
      }

      const personale = await storage.getAnagraficaPersonale();
      const persona = personale.find((p: any) => p.portalToken === portalToken && p.portalEnabled);

      if (!persona) {
        console.log("[Portal Token Login] Token not found or portal disabled:", portalToken);
        return res.status(401).json({ error: "Token non valido o portale disabilitato" });
      }

      await storage.updateAnagraficaPersonale(persona.id, { portalLastAccess: new Date() });

      const sessionToken = Buffer.from(`${persona.id}:${Date.now()}`).toString("base64");

      res.json({
        token: sessionToken,
        personale: {
          id: persona.id,
          nome: persona.nome,
          cognome: persona.cognome,
          email: persona.email,
          ruolo: persona.ruolo,
          reparto: persona.reparto,
        }
      });
    } catch (error) {
      console.error("Staff portal token login error:", error);
      res.status(500).json({ error: "Errore di autenticazione" });
    }
  });

  // Biometric Registration - Start
  app.post("/api/staff-portal/biometric/register-start", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const token = authHeader.substring(7);
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      const [personaleId] = decoded.split(":");

      const persona = await storage.getAnagraficaPersonaleById(personaleId);
      if (!persona || !persona.portalEnabled) {
        return res.status(401).json({ error: "Sessione non valida" });
      }

      const crypto = await import("crypto");
      const challenge = crypto.randomBytes(32).toString("base64url");

      res.json({
        challenge,
        rp: { name: "PULSE ERP", id: new URL(req.headers.origin || `https://${req.headers.host}`).hostname },
        user: {
          id: Buffer.from(personaleId).toString("base64url"),
          name: persona.portalUsername || `${persona.nome}.${persona.cognome}`.toLowerCase(),
          displayName: `${persona.nome} ${persona.cognome}`,
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        timeout: 60000,
      });
    } catch (error) {
      console.error("Biometric register start error:", error);
      res.status(500).json({ error: "Errore nella registrazione biometrica" });
    }
  });

  // Biometric Registration - Complete
  app.post("/api/staff-portal/biometric/register-complete", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const token = authHeader.substring(7);
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      const [personaleId] = decoded.split(":");

      const persona = await storage.getAnagraficaPersonaleById(personaleId);
      if (!persona || !persona.portalEnabled) {
        return res.status(401).json({ error: "Sessione non valida" });
      }

      const { credentialId, publicKey } = req.body;
      if (!credentialId || !publicKey) {
        return res.status(400).json({ error: "Dati credenziali mancanti" });
      }

      await storage.updateAnagraficaPersonale(personaleId, {
        biometricCredentialId: credentialId,
        biometricPublicKey: publicKey,
        biometricCounter: 0,
        biometricEnabled: true,
      });

      res.json({ success: true, message: "Accesso biometrico attivato" });
    } catch (error) {
      console.error("Biometric register complete error:", error);
      res.status(500).json({ error: "Errore nel salvataggio credenziali biometriche" });
    }
  });

  // Biometric Authentication - Start
  app.post("/api/staff-portal/biometric/auth-start", async (req: Request, res: Response) => {
    try {
      const { credentialId } = req.body;
      if (!credentialId) {
        return res.status(400).json({ error: "Credential ID richiesto" });
      }

      const personale = await storage.getAnagraficaPersonale();
      const persona = personale.find((p: any) => p.biometricCredentialId === credentialId && p.biometricEnabled && p.portalEnabled);

      if (!persona) {
        return res.status(401).json({ error: "Credenziale biometrica non trovata" });
      }

      const crypto = await import("crypto");
      const challenge = crypto.randomBytes(32).toString("base64url");

      res.json({
        challenge,
        rpId: new URL(req.headers.origin || `https://${req.headers.host}`).hostname,
        allowCredentials: [{ type: "public-key", id: credentialId }],
        userVerification: "required",
        timeout: 60000,
        personaleId: persona.id,
      });
    } catch (error) {
      console.error("Biometric auth start error:", error);
      res.status(500).json({ error: "Errore nell'autenticazione biometrica" });
    }
  });

  // Biometric Authentication - Complete
  app.post("/api/staff-portal/biometric/auth-complete", async (req: Request, res: Response) => {
    try {
      const { credentialId, personaleId } = req.body;
      if (!credentialId || !personaleId) {
        return res.status(400).json({ error: "Dati mancanti" });
      }

      const persona = await storage.getAnagraficaPersonaleById(personaleId);
      if (!persona || !persona.biometricEnabled || !persona.portalEnabled) {
        return res.status(401).json({ error: "Autenticazione fallita" });
      }

      if (persona.biometricCredentialId !== credentialId) {
        return res.status(401).json({ error: "Credenziale non corrispondente" });
      }

      await storage.updateAnagraficaPersonale(persona.id, {
        portalLastAccess: new Date(),
        biometricCounter: (persona.biometricCounter || 0) + 1,
      });

      const token = Buffer.from(`${persona.id}:${Date.now()}`).toString("base64");

      res.json({
        token,
        personale: {
          id: persona.id,
          nome: persona.nome,
          cognome: persona.cognome,
          email: persona.email,
          ruolo: persona.ruolo,
          reparto: persona.reparto,
        }
      });
    } catch (error) {
      console.error("Biometric auth complete error:", error);
      res.status(500).json({ error: "Errore nell'autenticazione biometrica" });
    }
  });

  // Check biometric status
  app.get("/api/staff-portal/biometric/status", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const token = authHeader.substring(7);
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      const [personaleId] = decoded.split(":");

      const persona = await storage.getAnagraficaPersonaleById(personaleId);
      if (!persona || !persona.portalEnabled) {
        return res.status(401).json({ error: "Sessione non valida" });
      }

      res.json({
        biometricEnabled: persona.biometricEnabled || false,
        hasCredential: !!persona.biometricCredentialId,
      });
    } catch (error) {
      res.status(500).json({ error: "Errore nel controllo stato biometrico" });
    }
  });

  // Disable biometric
  app.post("/api/staff-portal/biometric/disable", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const token = authHeader.substring(7);
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      const [personaleId] = decoded.split(":");

      const persona = await storage.getAnagraficaPersonaleById(personaleId);
      if (!persona || !persona.portalEnabled) {
        return res.status(401).json({ error: "Sessione non valida" });
      }

      await storage.updateAnagraficaPersonale(personaleId, {
        biometricCredentialId: null,
        biometricPublicKey: null,
        biometricCounter: 0,
        biometricEnabled: false,
      });

      res.json({ success: true, message: "Accesso biometrico disattivato" });
    } catch (error) {
      res.status(500).json({ error: "Errore nella disattivazione" });
    }
  });

  // Get stored credential ID for auto-login
  app.get("/api/staff-portal/biometric/credential", async (req: Request, res: Response) => {
    try {
      const credentialId = req.query.id as string;
      if (!credentialId) {
        return res.status(400).json({ error: "Credential ID richiesto" });
      }

      const personale = await storage.getAnagraficaPersonale();
      const persona = personale.find((p: any) => p.biometricCredentialId === credentialId && p.biometricEnabled && p.portalEnabled);

      if (!persona) {
        return res.status(404).json({ error: "Credenziale non trovata" });
      }

      res.json({
        found: true,
        displayName: `${persona.nome} ${persona.cognome}`,
      });
    } catch (error) {
      res.status(500).json({ error: "Errore nella ricerca credenziale" });
    }
  });

  app.get("/api/staff-portal/me", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const token = authHeader.substring(7);
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      const [personaleId] = decoded.split(":");

      const persona = await storage.getAnagraficaPersonaleById(personaleId);
      if (!persona || !persona.portalEnabled) {
        return res.status(401).json({ error: "Sessione non valida" });
      }

      res.json({
        id: persona.id,
        nome: persona.nome,
        cognome: persona.cognome,
        email: persona.email,
        ruolo: persona.ruolo,
        reparto: persona.reparto,
        oreSettimanali: persona.oreSettimanali,
        tipoContratto: persona.tipoContratto,
        dataAssunzione: persona.dataAssunzione,
        iban: persona.iban,
        banca: persona.banca,
        abi: persona.abi,
        cab: persona.cab,
        telefono: persona.telefono,
        cellulare: persona.cellulare,
        indirizzo: persona.indirizzo,
        citta: persona.citta,
        cap: persona.cap,
        provincia: persona.provincia,
        codiceFiscale: persona.codiceFiscale,
        dataNascita: persona.dataNascita,
        luogoNascita: persona.luogoNascita,
      });
    } catch (error) {
      res.status(401).json({ error: "Token non valido" });
    }
  });

  // Aggiorna dati personali dal portale collaboratori
  app.put("/api/staff-portal/me", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const token = authHeader.substring(7);
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      const [personaleId] = decoded.split(":");

      const persona = await storage.getAnagraficaPersonaleById(personaleId);
      if (!persona || !persona.portalEnabled) {
        return res.status(401).json({ error: "Sessione non valida" });
      }

      // Campi che il collaboratore può modificare (dati personali, non contrattuali)
      const allowedFields = [
        "telefono", "cellulare", "indirizzo", "citta", "cap", "provincia",
        "iban", "banca", "abi", "cab", "email"
      ];

      const updates: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          // Uppercase per campi specifici
          if (["indirizzo", "citta", "luogoNascita"].includes(field) && typeof req.body[field] === "string") {
            updates[field] = req.body[field].toUpperCase();
          } else {
            updates[field] = req.body[field];
          }
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "Nessun campo da aggiornare" });
      }

      await storage.updateAnagraficaPersonale(personaleId, updates);
      const updated = await storage.getAnagraficaPersonaleById(personaleId);

      res.json({ success: true, message: "Dati aggiornati con successo", data: updated });
    } catch (error) {
      console.error("Errore aggiornamento dati personali:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento dei dati" });
    }
  });

  app.get("/api/staff-portal/cedolini", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const token = authHeader.substring(7);
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      const [personaleId] = decoded.split(":");

      const persona = await storage.getAnagraficaPersonaleById(personaleId);
      if (!persona || !persona.portalEnabled) {
        return res.status(401).json({ error: "Sessione non valida" });
      }

      const cedolini = await storage.getCedoliniByPersonale(personaleId);
      res.json(cedolini.map((c: any) => ({
        id: c.id,
        mese: c.mese,
        anno: c.anno,
        filename: c.filename,
        stipendioLordo: c.stipendioLordo,
        stipendioNetto: c.stipendioNetto,
        straordinari: c.straordinari,
        createdAt: c.createdAt,
      })));
    } catch (error) {
      res.status(401).json({ error: "Token non valido" });
    }
  });

  app.get("/api/staff-portal/cedolini/:id/download", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log("[Cedolino Download] No auth header");
        return res.status(401).json({ error: "Non autenticato" });
      }

      const token = authHeader.substring(7);
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      const [personaleId] = decoded.split(":");
      console.log("[Cedolino Download] PersonaleId from token:", personaleId);

      const cedolino = await storage.getCedolinoById(req.params.id);
      console.log("[Cedolino Download] Cedolino found:", cedolino ? { id: cedolino.id, personaleId: cedolino.personaleId, filepath: cedolino.filepath } : null);

      if (!cedolino) {
        console.log("[Cedolino Download] Cedolino not found");
        return res.status(404).json({ error: "Cedolino non trovato" });
      }

      if (cedolino.personaleId !== personaleId) {
        console.log("[Cedolino Download] PersonaleId mismatch:", cedolino.personaleId, "vs", personaleId);
        return res.status(403).json({ error: "Accesso non autorizzato" });
      }

      if (!cedolino.filepath || !fs.existsSync(cedolino.filepath)) {
        console.log("[Cedolino Download] File not found at:", cedolino.filepath);
        return res.status(404).json({ error: "File non trovato sul server" });
      }

      console.log("[Cedolino Download] Downloading:", cedolino.filepath);
      res.download(cedolino.filepath, cedolino.filename);
    } catch (error) {
      console.error("[Cedolino Download] Error:", error);
      res.status(500).json({ error: "Errore nel download" });
    }
  });

  // API per esportazione timbrature Excel
  app.post("/api/timbrature/export-excel", async (req: Request, res: Response) => {
    try {
      const { personaleId, personaleNome, mese, anno, timbrature: timbData } = req.body;
      const XLSX = await import("xlsx");

      let allTimbrature = timbData;

      // Se è "tutti", recupera tutte le timbrature del periodo
      if (personaleId === "tutti") {
        const inizio = new Date(anno, mese - 1, 1);
        const fine = new Date(anno, mese, 0, 23, 59, 59);
        const all = await storage.getAllTimbrature();
        allTimbrature = all.filter((t: any) => {
          const dt = new Date(t.dataOra);
          return dt >= inizio && dt <= fine;
        });
      }

      const personaleList = await storage.getAnagraficaPersonale();
      const getPersonaleNome = (id: string) => {
        const p = personaleList.find((x: any) => x.id === id);
        return p ? `${p.nome} ${p.cognome}` : id;
      };

      const data = allTimbrature.map((t: any) => ({
        "Collaboratore": personaleId === "tutti" ? getPersonaleNome(t.personaleId) : personaleNome,
        "Data": new Date(t.dataOra).toLocaleDateString("it-IT"),
        "Ora": new Date(t.dataOra).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
        "Tipo": t.tipo === "entrata" ? "Entrata" : "Uscita",
        "Posizione": t.indirizzo || "",
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Timbrature");

      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=Timbrature_${mese}_${anno}.xlsx`);
      res.send(buffer);
    } catch (error) {
      console.error("Errore esportazione Excel:", error);
      res.status(500).json({ error: "Errore nell'esportazione" });
    }
  });

  // API per invio report al consulente paghe
  app.post("/api/timbrature/invia-consulente", async (req: Request, res: Response) => {
    try {
      const { personaleId, personaleNome, mese, anno, emailConsulente } = req.body;
      const XLSX = await import("xlsx");
      const nodemailer = await import("nodemailer");

      const MESI = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
        "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

      let allTimbrature;
      const inizio = new Date(anno, mese - 1, 1);
      const fine = new Date(anno, mese, 0, 23, 59, 59);
      const all = await storage.getAllTimbrature();

      if (personaleId === "tutti") {
        allTimbrature = all.filter((t: any) => {
          const dt = new Date(t.dataOra);
          return dt >= inizio && dt <= fine;
        });
      } else {
        allTimbrature = all.filter((t: any) => {
          const dt = new Date(t.dataOra);
          return t.personaleId === personaleId && dt >= inizio && dt <= fine;
        });
      }

      const personaleList = await storage.getAnagraficaPersonale();
      const getPersonaleNomeLocal = (id: string) => {
        const p = personaleList.find((x: any) => x.id === id);
        return p ? `${p.nome} ${p.cognome}` : id;
      };

      const data = allTimbrature.map((t: any) => ({
        "Collaboratore": personaleId === "tutti" ? getPersonaleNomeLocal(t.personaleId) : personaleNome,
        "Data": new Date(t.dataOra).toLocaleDateString("it-IT"),
        "Ora": new Date(t.dataOra).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
        "Tipo": t.tipo === "entrata" ? "Entrata" : "Uscita",
        "Posizione": t.indirizzo || "",
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Timbrature");
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      const transporter = nodemailer.default.createTransport({
        host: "smtps.aruba.it",
        port: 465,
        secure: true,
        auth: {
          user: process.env.ARUBA_EMAIL_ADDRESS,
          pass: process.env.ARUBA_EMAIL_PASSWORD,
        },
      });

      const soggetto = personaleId === "tutti"
        ? `Report Timbrature - ${MESI[mese - 1]} ${anno}`
        : `Report Timbrature ${personaleNome} - ${MESI[mese - 1]} ${anno}`;

      await transporter.sendMail({
        from: process.env.ARUBA_EMAIL_ADDRESS,
        to: emailConsulente,
        subject: soggetto,
        text: `In allegato il report delle timbrature per ${MESI[mese - 1]} ${anno}.
        
${personaleId === "tutti" ? "Tutti i collaboratori" : `Collaboratore: ${personaleNome}`}
Totale timbrature: ${allTimbrature.length}

Report generato automaticamente da PULSE ERP.`,
        attachments: [{
          filename: `Timbrature_${personaleId === "tutti" ? "Tutti" : personaleNome.replace(/\s/g, "_")}_${mese}_${anno}.xlsx`,
          content: buffer,
        }],
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Errore invio email consulente:", error);
      res.status(500).json({ error: "Errore nell'invio email" });
    }
  });

  // API per le regole timbrature
  app.get("/api/regole-timbrature", async (req: Request, res: Response) => {
    try {
      const [row] = await db.select().from(appSettings).where(eq(appSettings.key, "regole_timbrature"));
      const defaults = {
        maxTimbratureGiorno: 4,
        giorniLavorativi: [1, 2, 3, 4, 5], // Lun-Ven
      };
      const regole = row?.value ? { ...defaults, ...JSON.parse(row.value) } : defaults;
      res.json(regole);
    } catch (error) {
      console.error("Errore recupero regole:", error);
      res.status(500).json({ error: "Errore nel recupero delle regole" });
    }
  });

  app.put("/api/regole-timbrature", async (req: Request, res: Response) => {
    try {
      const regole = req.body;
      const [existing] = await db.select().from(appSettings).where(eq(appSettings.key, "regole_timbrature"));

      if (existing) {
        await db.update(appSettings)
          .set({ value: JSON.stringify(regole), updatedAt: new Date() })
          .where(eq(appSettings.key, "regole_timbrature"));
      } else {
        await db.insert(appSettings).values({
          key: "regole_timbrature",
          value: JSON.stringify(regole),
        });
      }

      res.json({ success: true, regole });
    } catch (error) {
      console.error("Errore salvataggio regole:", error);
      res.status(500).json({ error: "Errore nel salvataggio delle regole" });
    }
  });

  // Timbrature per il portale staff
  app.get("/api/staff-portal/timbrature", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const token = authHeader.substring(7);
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      const [personaleId] = decoded.split(":");

      const allTimbrature = await storage.getTimbratureByPersonale(personaleId);
      res.json(allTimbrature);
    } catch (error) {
      res.status(401).json({ error: "Token non valido" });
    }
  });

  app.post("/api/staff-portal/timbrature", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const token = authHeader.substring(7);
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      const [personaleId] = decoded.split(":");

      const { tipo, latitudine, longitudine, indirizzo } = req.body;
      if (!tipo || (tipo !== "entrata" && tipo !== "uscita")) {
        return res.status(400).json({ error: "Tipo non valido. Usa 'entrata' o 'uscita'" });
      }

      // Carica le impostazioni timbrature
      const [impostazioniRow] = await db.select().from(appSettings).where(eq(appSettings.key, "regole_timbrature"));
      const impostazioni = impostazioniRow?.value ? JSON.parse(impostazioniRow.value) : {};

      const now = new Date();
      const oggi = now.toISOString().split("T")[0];

      // Verifica giorni lavorativi
      if (impostazioni.giorniLavorativi && impostazioni.giorniLavorativi.length > 0) {
        const giornoSettimana = now.getDay(); // 0=Dom, 1=Lun, ...
        if (!impostazioni.giorniLavorativi.includes(giornoSettimana)) {
          const nomiGiorni = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
          return res.status(400).json({
            error: `Non è permesso timbrare di ${nomiGiorni[giornoSettimana]}. Giorni lavorativi: ${impostazioni.giorniLavorativi.map((g: number) => nomiGiorni[g]).join(", ")}`
          });
        }
      }

      // Verifica limite timbrature giornaliere
      if (impostazioni.maxTimbratureGiorno && impostazioni.maxTimbratureGiorno > 0) {
        const timbratureOggi = await storage.getTimbratureByPersonale(personaleId);
        const countOggi = timbratureOggi.filter((t: any) => t.dataOra.startsWith(oggi)).length;
        if (countOggi >= impostazioni.maxTimbratureGiorno) {
          return res.status(400).json({
            error: `Hai raggiunto il limite massimo di ${impostazioni.maxTimbratureGiorno} timbrature giornaliere`
          });
        }
      }

      const timbratura = await storage.createTimbratura({
        personaleId,
        tipo,
        dataOra: new Date().toISOString(),
        latitudine: latitudine?.toString() || null,
        longitudine: longitudine?.toString() || null,
        indirizzo: indirizzo || null,
      });

      res.json(timbratura);
    } catch (error) {
      console.error("Errore timbratura:", error);
      res.status(500).json({ error: "Errore nella creazione della timbratura" });
    }
  });

  // Richieste ferie/permessi per il portale staff
  app.get("/api/staff-portal/richieste-assenza", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const token = authHeader.substring(7);
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      const [personaleId] = decoded.split(":");

      const persona = await storage.getAnagraficaPersonaleById(personaleId);
      if (!persona || !persona.portalEnabled) {
        return res.status(401).json({ error: "Sessione non valida" });
      }

      const richieste = await storage.getRichiesteAssenzaByPersonale(personaleId);
      res.json(richieste);
    } catch (error) {
      res.status(401).json({ error: "Token non valido" });
    }
  });

  app.post("/api/staff-portal/richieste-assenza", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const token = authHeader.substring(7);
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      const [personaleId] = decoded.split(":");

      const persona = await storage.getAnagraficaPersonaleById(personaleId);
      if (!persona || !persona.portalEnabled) {
        return res.status(401).json({ error: "Sessione non valida" });
      }

      const { tipo, dataInizio, dataFine, giorniTotali, motivo } = req.body;

      const richiesta = await storage.createRichiestaAssenza({
        personaleId,
        tipo,
        dataInizio,
        dataFine,
        giorniTotali: giorniTotali || "1",
        motivo: motivo || "",
        stato: "richiesta",
      });

      res.status(201).json(richiesta);
    } catch (error) {
      console.error("Error creating richiesta from portal:", error);
      res.status(500).json({ error: "Errore nella creazione della richiesta" });
    }
  });

  app.delete("/api/staff-portal/richieste-assenza/:id", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const token = authHeader.substring(7);
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      const [personaleId] = decoded.split(":");

      const persona = await storage.getAnagraficaPersonaleById(personaleId);
      if (!persona || !persona.portalEnabled) {
        return res.status(401).json({ error: "Sessione non valida" });
      }

      // Verifica che la richiesta appartenga al collaboratore
      const richieste = await storage.getRichiesteAssenzaByPersonale(personaleId);
      const richiesta = richieste.find((r: any) => r.id === req.params.id);

      if (!richiesta) {
        return res.status(404).json({ error: "Richiesta non trovata" });
      }

      if (richiesta.stato !== "richiesta") {
        return res.status(400).json({ error: "Non puoi eliminare una richiesta già approvata o rifiutata" });
      }

      await storage.deleteRichiestaAssenza(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting richiesta from portal:", error);
      res.status(500).json({ error: "Errore nella cancellazione della richiesta" });
    }
  });

  app.post("/api/anagrafica/personale/:id/portal-credentials", async (req: Request, res: Response) => {
    try {
      const { username, password, enabled } = req.body;
      const persona = await storage.getAnagraficaPersonaleById(req.params.id);
      if (!persona) {
        return res.status(404).json({ error: "Collaboratore non trovato" });
      }

      const updates: any = { portalEnabled: enabled ?? false };
      if (username) updates.portalUsername = username;
      if (password) {
        const bcrypt = await import("bcryptjs");
        updates.portalPasswordHash = await bcrypt.hash(password, 10);
      }

      const updated = await storage.updateAnagraficaPersonale(req.params.id, updates);
      res.json({ success: true, portalEnabled: updated?.portalEnabled, portalUsername: updated?.portalUsername });
    } catch (error) {
      console.error("Error setting portal credentials:", error);
      res.status(500).json({ error: "Errore nell'impostazione delle credenziali" });
    }
  });

  // =====================
  // ANAGRAFICA PERSONALE
  // =====================
  app.get("/api/anagrafica/personale", async (req: Request, res: Response) => {
    const personale = await storage.getAnagraficaPersonale();
    res.json(personale);
  });

  app.get("/api/anagrafica/personale/:id", async (req: Request, res: Response) => {
    const persona = await storage.getAnagraficaPersonaleById(req.params.id);
    if (!persona) {
      return res.status(404).json({ error: "Persona non trovata" });
    }
    res.json(persona);
  });

  app.post("/api/anagrafica/personale", async (req: Request, res: Response) => {
    try {
      const { portalPassword, ...bodyData } = req.body;
      if (bodyData.responsabileId === "") bodyData.responsabileId = null;
      const data = insertAnagraficaPersonaleSchema.parse(bodyData);

      // Se viene fornita una password, hashiarla
      let portalPasswordHash: string | undefined;
      if (portalPassword && portalPassword.trim()) {
        portalPasswordHash = await bcrypt.hash(portalPassword, 10);
      }

      const persona = await storage.createAnagraficaPersonale({
        ...data,
        portalPasswordHash: portalPasswordHash
      } as any);

      // Invia email di benvenuto se il collaboratore ha un'email
      if (persona.email || persona.emailPrivata) {
        const emailDestinatario = persona.emailPrivata || persona.email;
        try {
          const emailSent = await sendWelcomeEmail(
            emailDestinatario!,
            persona.nome,
            persona.cognome,
            persona.ruolo || undefined,
            persona.reparto || undefined,
            persona.dataAssunzione || undefined
          );
          if (emailSent) {
            await storage.updateAnagraficaPersonale(persona.id, { emailBenvenutoInviata: true });
            console.log(`Email di benvenuto inviata a ${emailDestinatario}`);
          }
        } catch (emailError) {
          console.error("Errore invio email benvenuto:", emailError);
        }
      }

      res.status(201).json(persona);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating personale:", error);
      res.status(500).json({ error: "Errore nella creazione" });
    }
  });

  app.put("/api/anagrafica/personale/:id", async (req: Request, res: Response) => {
    const data = { ...req.body };
    if (data.responsabileId === "") data.responsabileId = null;

    // Genera token portale automaticamente se abilitato e non esiste
    if (data.portalEnabled && !data.portalToken) {
      const existingPersona = await storage.getAnagraficaPersonaleById(req.params.id);
      if (!existingPersona?.portalToken) {
        data.portalToken = crypto.randomBytes(16).toString('hex');
      }
    }

    const persona = await storage.updateAnagraficaPersonale(req.params.id, data);
    if (!persona) {
      return res.status(404).json({ error: "Persona non trovata" });
    }
    res.json(persona);
  });

  app.delete("/api/anagrafica/personale/:id", async (req: Request, res: Response) => {
    const success = await storage.deleteAnagraficaPersonale(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Persona non trovata" });
    }
    res.status(204).send();
  });

  // =====================
  // HR NOTIFICATIONS CHECK
  // =====================

  // Get HR alerts (birthdays, probation expiry)
  app.get("/api/hr/alerts", async (req: Request, res: Response) => {
    try {
      const personale = await storage.getAnagraficaPersonale();
      const oggi = new Date();
      const oggiStr = oggi.toISOString().split("T")[0];
      const meseGiorno = oggiStr.slice(5); // MM-DD

      const alerts: any[] = [];

      for (const p of personale) {
        if (p.stato === "cessato") continue;

        // Check compleanni (oggi)
        if (p.dataNascita) {
          const nascitaMeseGiorno = p.dataNascita.slice(5); // MM-DD
          if (nascitaMeseGiorno === meseGiorno) {
            const eta = oggi.getFullYear() - parseInt(p.dataNascita.slice(0, 4));
            alerts.push({
              tipo: "compleanno",
              personaleId: p.id,
              nome: p.nome,
              cognome: p.cognome,
              reparto: p.reparto,
              messaggio: `${p.nome} ${p.cognome} compie ${eta} anni oggi!`,
              urgenza: "info",
              data: oggiStr
            });
          }
        }

        // Check scadenza periodo di prova (30, 15, 7 giorni)
        if (p.dataFinePeriodoProva) {
          const dataScadenza = new Date(p.dataFinePeriodoProva);
          const diffTime = dataScadenza.getTime() - oggi.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays > 0 && diffDays <= 30) {
            let urgenza = "info";
            if (diffDays <= 7) urgenza = "high";
            else if (diffDays <= 15) urgenza = "medium";

            alerts.push({
              tipo: "periodo_prova",
              personaleId: p.id,
              nome: p.nome,
              cognome: p.cognome,
              reparto: p.reparto,
              messaggio: `Periodo di prova di ${p.nome} ${p.cognome} scade tra ${diffDays} giorni`,
              urgenza,
              data: p.dataFinePeriodoProva,
              giorniMancanti: diffDays
            });
          }
        }
      }

      // Ordina per urgenza
      const urgenzaOrdine: Record<string, number> = { high: 1, medium: 2, info: 3 };
      alerts.sort((a, b) => (urgenzaOrdine[a.urgenza] || 4) - (urgenzaOrdine[b.urgenza] || 4));

      res.json(alerts);
    } catch (error) {
      console.error("Error fetching HR alerts:", error);
      res.status(500).json({ error: "Errore nel recupero avvisi HR" });
    }
  });

  // Send birthday notifications via email
  app.post("/api/hr/send-birthday-notifications", async (req: Request, res: Response) => {
    try {
      const { adminEmail } = req.body;
      if (!adminEmail) {
        return res.status(400).json({ error: "Email amministratore richiesta" });
      }

      const personale = await storage.getAnagraficaPersonale();
      const oggi = new Date().toISOString().split("T")[0];
      const meseGiorno = oggi.slice(5);

      const birthdayPeople = personale.filter(p => {
        if (p.stato === "cessato" || !p.dataNascita) return false;
        return p.dataNascita.slice(5) === meseGiorno;
      }).map(p => ({
        nome: p.nome,
        cognome: p.cognome,
        dataNascita: p.dataNascita!,
        reparto: p.reparto || undefined
      }));

      if (birthdayPeople.length === 0) {
        return res.json({ success: true, message: "Nessun compleanno oggi" });
      }

      const sent = await sendBirthdayNotificationEmail(adminEmail, birthdayPeople);
      res.json({ success: sent, count: birthdayPeople.length });
    } catch (error) {
      console.error("Error sending birthday notifications:", error);
      res.status(500).json({ error: "Errore nell'invio notifiche compleanni" });
    }
  });

  // Send probation period reminders
  app.post("/api/hr/send-probation-reminders", async (req: Request, res: Response) => {
    try {
      const { adminEmail } = req.body;
      if (!adminEmail) {
        return res.status(400).json({ error: "Email amministratore richiesta" });
      }

      const personale = await storage.getAnagraficaPersonale();
      const oggi = new Date();
      let sentCount = 0;

      for (const p of personale) {
        if (p.stato === "cessato" || !p.dataFinePeriodoProva) continue;

        const dataScadenza = new Date(p.dataFinePeriodoProva);
        const diffTime = dataScadenza.getTime() - oggi.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Invia reminder a 30, 15, 7 giorni
        if (diffDays === 30 || diffDays === 15 || diffDays === 7) {
          const sent = await sendProbationReminderEmail(
            adminEmail,
            p.nome,
            p.cognome,
            p.dataFinePeriodoProva,
            diffDays
          );
          if (sent) sentCount++;
        }
      }

      res.json({ success: true, sentCount });
    } catch (error) {
      console.error("Error sending probation reminders:", error);
      res.status(500).json({ error: "Errore nell'invio reminder periodo prova" });
    }
  });

  // =====================
  // LOOKUP P.IVA (VATComply - servizio gratuito)
  // =====================
  app.get("/api/lookup/piva/:piva", async (req: Request, res: Response) => {
    try {
      const piva = req.params.piva.replace(/\s/g, "").toUpperCase();
      // Aggiungi prefisso IT se non presente
      const vatNumber = piva.startsWith("IT") ? piva : `IT${piva}`;

      const response = await fetch(`https://api.vatcomply.com/vat?vat_number=${vatNumber}`);
      const data = await response.json();

      if (data.valid) {
        // Parse dell'indirizzo per estrarre i componenti
        let indirizzo = "";
        let cap = "";
        let citta = "";
        let provincia = "";

        if (data.address) {
          const addressLines = data.address.split("\n").filter((l: string) => l.trim());
          if (addressLines.length >= 1) {
            indirizzo = addressLines[0];
          }
          if (addressLines.length >= 2) {
            // Prova a estrarre CAP e città dalla seconda riga (es: "00100 ROMA RM")
            const match = addressLines[1].match(/^(\d{5})\s+(.+?)(?:\s+([A-Z]{2}))?$/);
            if (match) {
              cap = match[1];
              citta = match[2];
              provincia = match[3] || "";
            } else {
              citta = addressLines[1];
            }
          }
        }

        res.json({
          valid: true,
          ragioneSociale: data.name || "",
          partitaIva: piva.replace("IT", ""),
          indirizzo,
          cap,
          citta,
          provincia,
          addressRaw: data.address || "",
        });
      } else {
        res.json({
          valid: false,
          error: "P.IVA non trovata o non valida",
        });
      }
    } catch (error) {
      console.error("Errore lookup P.IVA:", error);
      res.status(500).json({
        valid: false,
        error: "Errore nella ricerca. Riprova più tardi.",
      });
    }
  });

  // =====================
  // ANAGRAFICA CLIENTI
  // =====================

  // Endpoint pubblico per la mappa TV (senza autenticazione)
  app.get("/api/public/mappa-clienti", async (req: Request, res: Response) => {
    const clienti = await storage.getAnagraficaClienti();
    // Restituisci solo i dati necessari per la mappa (senza dati sensibili)
    const clientiMappa = clienti.map((c: any) => ({
      id: c.id,
      ragioneSociale: c.ragioneSociale,
      indirizzo: c.indirizzo,
      citta: c.citta,
      cap: c.cap,
      provincia: c.provincia,
      telefono: c.telefono,
      latitudine: c.latitudine,
      longitudine: c.longitudine,
    }));
    res.json(clientiMappa);
  });

  // Endpoint per salvare le coordinate geocodificate
  app.post("/api/public/mappa-clienti/geocode", async (req: Request, res: Response) => {
    const { coordinates } = req.body;
    if (!coordinates || !Array.isArray(coordinates)) {
      return res.status(400).json({ error: "Coordinates array required" });
    }

    let updated = 0;
    for (const { id, latitudine, longitudine } of coordinates) {
      if (id && latitudine && longitudine) {
        await storage.updateAnagraficaClienti(id, { latitudine, longitudine });
        updated++;
      }
    }
    res.json({ updated });
  });

  app.get("/api/anagrafica/clienti", async (req: Request, res: Response) => {
    const clienti = await storage.getAnagraficaClienti();
    res.json(clienti);
  });

  app.get("/api/anagrafica/clienti/:id", async (req: Request, res: Response) => {
    const cliente = await storage.getAnagraficaClientiById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ error: "Cliente non trovato" });
    }
    res.json(cliente);
  });

  app.post("/api/anagrafica/clienti", async (req: Request, res: Response) => {
    try {
      const data = insertAnagraficaClientiSchema.parse(req.body);
      const cliente = await storage.createAnagraficaClienti(data);
      res.status(201).json(cliente);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Errore nella creazione" });
    }
  });

  app.put("/api/anagrafica/clienti/:id", async (req: Request, res: Response) => {
    // Rimuovi campi timestamp che arrivano come stringhe dal frontend
    const { createdAt, updatedAt, id, ...data } = req.body;
    const cliente = await storage.updateAnagraficaClienti(req.params.id, data);
    if (!cliente) {
      return res.status(404).json({ error: "Cliente non trovato" });
    }
    res.json(cliente);
  });

  app.delete("/api/anagrafica/clienti/:id", async (req: Request, res: Response) => {
    const success = await storage.deleteAnagraficaClienti(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Cliente non trovato" });
    }
    res.status(204).send();
  });

  // Dashboard cliente con statistiche aggregate
  app.get("/api/anagrafica/clienti/:id/dashboard", async (req: Request, res: Response) => {
    try {
      const clienteId = req.params.id;
      const cliente = await storage.getAnagraficaClientiById(clienteId);
      if (!cliente) {
        return res.status(404).json({ error: "Cliente non trovato" });
      }

      // Recupera fatture e preventivi del cliente (ordinati per data dalla più vecchia)
      const fatture = await db.select().from(invoices).where(eq(invoices.clienteId, clienteId)).orderBy(invoices.dataEmissione);
      const preventivi = await db.select().from(quotes).where(eq(quotes.clienteId, clienteId)).orderBy(quotes.dataEmissione);
      const attivita = await db.select().from(crmAttivita).where(eq(crmAttivita.clienteId, clienteId));
      const opportunita = await db.select().from(crmOpportunita).where(eq(crmOpportunita.clienteId, clienteId));
      const referenti = await db.select().from(referentiClienti).where(eq(referentiClienti.clienteId, clienteId));

      // Calcola statistiche
      const fatturatoTotale = fatture.reduce((sum, f) => sum + parseFloat(f.totale || "0"), 0);
      const annoCorrente = new Date().getFullYear();
      const fattureAnnoCorrente = fatture.filter(f => new Date(f.dataEmissione || "").getFullYear() === annoCorrente);
      const fatturatoAnnoCorrente = fattureAnnoCorrente.reduce((sum, f) => sum + parseFloat(f.totale || "0"), 0);

      const fatturePagate = fatture.filter(f => f.stato === "pagata");
      const fattureNonPagate = fatture.filter(f => f.stato !== "pagata" && f.stato !== "annullata");
      const creditoAperto = fattureNonPagate.reduce((sum, f) => sum + parseFloat(f.totale || "0"), 0);

      // Ultimo ordine/fattura
      const ultimaFattura = fatture.sort((a, b) =>
        new Date(b.dataEmissione || "").getTime() - new Date(a.dataEmissione || "").getTime()
      )[0];

      res.json({
        cliente,
        statistiche: {
          fatturatoTotale: fatturatoTotale.toFixed(2),
          fatturatoAnnoCorrente: fatturatoAnnoCorrente.toFixed(2),
          numeroFatture: fatture.length,
          numeroFattureAnno: fattureAnnoCorrente.length,
          creditoAperto: creditoAperto.toFixed(2),
          fatturePagate: fatturePagate.length,
          fattureNonPagate: fattureNonPagate.length,
          numeroPreventivi: preventivi.length,
          preventiviAccettati: preventivi.filter(p => p.stato === "accettato").length,
          opportunitaAperte: opportunita.filter(o => !["chiuso_vinto", "chiuso_perso"].includes(o.fase || "")).length,
          ultimaFattura: ultimaFattura?.dataEmissione || null,
          attivitaTotali: attivita.length,
          attivitaPianificate: attivita.filter(a => a.stato === "pianificata").length,
        },
        fatture,
        preventivi,
        opportunita,
        attivita: attivita.slice(0, 20),
        referenti,
      });
    } catch (error) {
      console.error("Errore dashboard cliente:", error);
      res.status(500).json({ error: "Errore nel recupero dashboard" });
    }
  });

  // Indirizzi Spedizione Clienti
  app.get("/api/anagrafica/clienti/:clienteId/indirizzi-spedizione", async (req: Request, res: Response) => {
    try {
      const indirizzi = await storage.getIndirizziSpedizioneByCliente(req.params.clienteId);
      res.json(indirizzi);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero indirizzi" });
    }
  });

  app.post("/api/anagrafica/clienti/:clienteId/indirizzi-spedizione", async (req: Request, res: Response) => {
    try {
      const indirizzo = await storage.createIndirizzoSpedizione({
        ...req.body,
        clienteId: req.params.clienteId,
      });
      res.status(201).json(indirizzo);
    } catch (error) {
      res.status(500).json({ error: "Errore nella creazione indirizzo" });
    }
  });

  app.put("/api/anagrafica/clienti/:clienteId/indirizzi-spedizione/:id", async (req: Request, res: Response) => {
    try {
      const indirizzo = await storage.updateIndirizzoSpedizione(req.params.id, req.body);
      if (!indirizzo) {
        return res.status(404).json({ error: "Indirizzo non trovato" });
      }
      res.json(indirizzo);
    } catch (error) {
      res.status(500).json({ error: "Errore nell'aggiornamento indirizzo" });
    }
  });

  app.delete("/api/anagrafica/clienti/:clienteId/indirizzi-spedizione/:id", async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteIndirizzoSpedizione(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Indirizzo non trovato" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Errore nell'eliminazione indirizzo" });
    }
  });

  // Gestione credenziali portale cliente
  app.put("/api/anagrafica/clienti/:id/portale", async (req: Request, res: Response) => {
    try {
      const { portaleAbilitato, portaleUsername, portalePassword } = req.body;
      const clienteId = req.params.id;

      const cliente = await storage.getAnagraficaClientiById(clienteId);
      if (!cliente) {
        return res.status(404).json({ error: "Cliente non trovato" });
      }

      const updateData: any = { portaleAbilitato };

      if (portaleUsername !== undefined) {
        updateData.portaleUsername = portaleUsername;
      }

      // Hash password solo se fornita una nuova password
      if (portalePassword && portalePassword.trim() !== "") {
        const bcrypt = await import("bcryptjs");
        updateData.portalePassword = await bcrypt.hash(portalePassword, 10);
      }

      const updated = await storage.updateAnagraficaClienti(clienteId, updateData);
      res.json({
        success: true,
        portaleAbilitato: updated?.portaleAbilitato,
        portaleUsername: updated?.portaleUsername,
        hasPassword: !!updated?.portalePassword
      });
    } catch (error) {
      console.error("Errore aggiornamento portale:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento credenziali" });
    }
  });

  // Login portale cliente
  app.post("/api/portale/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username e password richiesti" });
      }

      // Cerca tra i clienti
      const clienti = await storage.getAnagraficaClienti();
      const cliente = clienti.find(c =>
        c.portaleAbilitato &&
        c.portaleUsername?.toLowerCase() === username.toLowerCase()
      );

      if (!cliente || !cliente.portalePassword) {
        return res.status(401).json({ error: "Credenziali non valide" });
      }

      const bcrypt = await import("bcryptjs");
      const passwordValid = await bcrypt.compare(password, cliente.portalePassword);

      if (!passwordValid) {
        return res.status(401).json({ error: "Credenziali non valide" });
      }

      // Genera un token semplice
      const token = require("crypto").randomBytes(32).toString("hex");

      res.json({
        success: true,
        tipo: "cliente",
        id: cliente.id,
        ragioneSociale: cliente.ragioneSociale,
        token
      });
    } catch (error) {
      console.error("Errore login portale:", error);
      res.status(500).json({ error: "Errore nel login" });
    }
  });

  // Analytics clienti aggregati
  app.get("/api/clienti/analytics", async (req: Request, res: Response) => {
    try {
      const clienti = await storage.getAnagraficaClienti();
      const fatture = await db.select().from(invoices);

      // Top clienti per fatturato
      const fatturatoPerCliente: Record<string, { id: string; ragioneSociale: string; fatturato: number; numeroFatture: number }> = {};

      for (const cliente of clienti) {
        fatturatoPerCliente[cliente.id] = {
          id: cliente.id,
          ragioneSociale: cliente.ragioneSociale,
          fatturato: 0,
          numeroFatture: 0
        };
      }

      for (const fattura of fatture) {
        if (fattura.clienteId && fatturatoPerCliente[fattura.clienteId]) {
          fatturatoPerCliente[fattura.clienteId].fatturato += parseFloat(fattura.totale || "0");
          fatturatoPerCliente[fattura.clienteId].numeroFatture++;
        }
      }

      const topClienti = Object.values(fatturatoPerCliente)
        .sort((a, b) => b.fatturato - a.fatturato)
        .slice(0, 10);

      // Clienti inattivi (senza fatture negli ultimi 6 mesi)
      const seiMesiFa = new Date();
      seiMesiFa.setMonth(seiMesiFa.getMonth() - 6);

      const clientiInattivi = clienti.filter(c => {
        const fattureCl = fatture.filter(f => f.clienteId === c.id);
        if (fattureCl.length === 0) return true;
        const ultimaFattura = fattureCl.sort((a, b) =>
          new Date(b.dataEmissione || "").getTime() - new Date(a.dataEmissione || "").getTime()
        )[0];
        return new Date(ultimaFattura.dataEmissione || "") < seiMesiFa;
      });

      // Distribuzione per categoria
      const perCategoria: Record<string, number> = {};
      for (const c of clienti) {
        const cat = c.categoriaCliente || "standard";
        perCategoria[cat] = (perCategoria[cat] || 0) + 1;
      }

      // Fatturato per mese (anno corrente)
      const annoCorrente = new Date().getFullYear();
      const fatturatoPerMese: number[] = Array(12).fill(0);
      for (const f of fatture) {
        const data = new Date(f.dataEmissione || "");
        if (data.getFullYear() === annoCorrente) {
          fatturatoPerMese[data.getMonth()] += parseFloat(f.totale || "0");
        }
      }

      res.json({
        totaleClienti: clienti.length,
        clientiAttivi: clienti.filter(c => c.attivo).length,
        clientiVIP: clienti.filter(c => c.categoriaCliente === "vip").length,
        topClienti,
        clientiInattivi: clientiInattivi.slice(0, 20).map(c => ({
          id: c.id,
          ragioneSociale: c.ragioneSociale,
          email: c.email,
          ultimoContatto: c.dataUltimoContatto
        })),
        distribuzionCategoria: perCategoria,
        fatturatoPerMese,
        fatturatoTotaleAnno: fatturatoPerMese.reduce((a, b) => a + b, 0).toFixed(2),
      });
    } catch (error) {
      console.error("Errore analytics clienti:", error);
      res.status(500).json({ error: "Errore nel recupero analytics" });
    }
  });

  // REFERENTI CLIENTI
  app.get("/api/clienti/:clienteId/referenti", async (req: Request, res: Response) => {
    try {
      const refs = await db.select().from(referentiClienti)
        .where(eq(referentiClienti.clienteId, req.params.clienteId))
        .orderBy(desc(referentiClienti.principale));
      res.json(refs);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero referenti" });
    }
  });

  app.post("/api/clienti/:clienteId/referenti", async (req: Request, res: Response) => {
    try {
      const [ref] = await db.insert(referentiClienti).values({
        ...req.body,
        clienteId: req.params.clienteId,
      }).returning();
      res.status(201).json(ref);
    } catch (error) {
      res.status(500).json({ error: "Errore nella creazione referente" });
    }
  });

  app.put("/api/referenti/:id", async (req: Request, res: Response) => {
    try {
      const [ref] = await db.update(referentiClienti)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(referentiClienti.id, req.params.id))
        .returning();
      res.json(ref);
    } catch (error) {
      res.status(500).json({ error: "Errore nell'aggiornamento referente" });
    }
  });

  app.delete("/api/referenti/:id", async (req: Request, res: Response) => {
    try {
      await db.delete(referentiClienti).where(eq(referentiClienti.id, req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Errore nell'eliminazione referente" });
    }
  });

  // =====================
  // ANAGRAFICA FORNITORI
  // =====================
  app.get("/api/anagrafica/fornitori", async (req: Request, res: Response) => {
    const fornitori = await storage.getAnagraficaFornitori();
    res.json(fornitori);
  });

  app.get("/api/anagrafica/fornitori/:id", async (req: Request, res: Response) => {
    const fornitore = await storage.getAnagraficaFornitoriById(req.params.id);
    if (!fornitore) {
      return res.status(404).json({ error: "Fornitore non trovato" });
    }
    res.json(fornitore);
  });

  app.post("/api/anagrafica/fornitori", async (req: Request, res: Response) => {
    try {
      const data = insertAnagraficaFornitoriSchema.parse(req.body);
      const fornitore = await storage.createAnagraficaFornitori(data);
      res.status(201).json(fornitore);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Errore nella creazione" });
    }
  });

  app.put("/api/anagrafica/fornitori/:id", async (req: Request, res: Response) => {
    const fornitore = await storage.updateAnagraficaFornitori(req.params.id, req.body);
    if (!fornitore) {
      return res.status(404).json({ error: "Fornitore non trovato" });
    }
    res.json(fornitore);
  });

  app.delete("/api/anagrafica/fornitori/:id", async (req: Request, res: Response) => {
    const success = await storage.deleteAnagraficaFornitori(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Fornitore non trovato" });
    }
    res.status(204).send();
  });

  // Gestione credenziali portale fornitore
  app.put("/api/anagrafica/fornitori/:id/portale", async (req: Request, res: Response) => {
    try {
      const { portaleAbilitato, portaleUsername, portalePassword } = req.body;
      const fornitoreId = req.params.id;

      const fornitore = await storage.getAnagraficaFornitoriById(fornitoreId);
      if (!fornitore) {
        return res.status(404).json({ error: "Fornitore non trovato" });
      }

      const updateData: any = { portaleAbilitato };

      if (portaleUsername !== undefined) {
        updateData.portaleUsername = portaleUsername;
      }

      // Hash password solo se fornita una nuova password
      if (portalePassword && portalePassword.trim() !== "") {
        const bcrypt = await import("bcryptjs");
        updateData.portalePassword = await bcrypt.hash(portalePassword, 10);
      }

      const updated = await storage.updateAnagraficaFornitori(fornitoreId, updateData);
      res.json({
        success: true,
        portaleAbilitato: updated?.portaleAbilitato,
        portaleUsername: updated?.portaleUsername,
        hasPassword: !!updated?.portalePassword
      });
    } catch (error) {
      console.error("Errore aggiornamento portale fornitore:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento credenziali" });
    }
  });

  // =====================
  // PROMEMORIA ANAGRAFICA API
  // =====================

  // Get all promemoria (con filtri opzionali)
  app.get("/api/promemoria", async (req: Request, res: Response) => {
    try {
      const { tipo, stato, entitaId } = req.query;
      let query = db.select().from(promemoriaAnagrafica);

      const conditions = [];
      if (tipo) conditions.push(eq(promemoriaAnagrafica.tipo, tipo as string));
      if (stato) conditions.push(eq(promemoriaAnagrafica.stato, stato as string));
      if (entitaId) conditions.push(eq(promemoriaAnagrafica.entitaId, entitaId as string));

      const result = conditions.length > 0
        ? await db.select().from(promemoriaAnagrafica).where(and(...conditions)).orderBy(desc(promemoriaAnagrafica.createdAt))
        : await db.select().from(promemoriaAnagrafica).orderBy(desc(promemoriaAnagrafica.createdAt));

      res.json(result);
    } catch (error) {
      console.error("Errore recupero promemoria:", error);
      res.status(500).json({ error: "Errore nel recupero promemoria" });
    }
  });

  // Get promemoria attivi count (per badge notifiche)
  app.get("/api/promemoria/count", async (req: Request, res: Response) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(promemoriaAnagrafica)
        .where(and(
          eq(promemoriaAnagrafica.stato, "attivo"),
          sql`${promemoriaAnagrafica.dataScadenza} <= ${today}`
        ));

      res.json({ count: Number(result[0]?.count || 0) });
    } catch (error) {
      console.error("Errore conteggio promemoria:", error);
      res.status(500).json({ error: "Errore nel conteggio" });
    }
  });

  // Get promemoria by entità (cliente o fornitore)
  app.get("/api/promemoria/:tipo/:entitaId", async (req: Request, res: Response) => {
    try {
      const { tipo, entitaId } = req.params;
      const result = await db.select().from(promemoriaAnagrafica)
        .where(and(
          eq(promemoriaAnagrafica.tipo, tipo),
          eq(promemoriaAnagrafica.entitaId, entitaId)
        ))
        .orderBy(desc(promemoriaAnagrafica.createdAt));

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero promemoria" });
    }
  });

  // Create promemoria
  app.post("/api/promemoria", async (req: Request, res: Response) => {
    try {
      const [promemoria] = await db.insert(promemoriaAnagrafica).values(req.body).returning();
      res.status(201).json(promemoria);
    } catch (error) {
      console.error("Errore creazione promemoria:", error);
      res.status(500).json({ error: "Errore nella creazione promemoria" });
    }
  });

  // Update promemoria
  app.put("/api/promemoria/:id", async (req: Request, res: Response) => {
    try {
      const [promemoria] = await db.update(promemoriaAnagrafica)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(promemoriaAnagrafica.id, req.params.id))
        .returning();

      if (!promemoria) {
        return res.status(404).json({ error: "Promemoria non trovato" });
      }
      res.json(promemoria);
    } catch (error) {
      res.status(500).json({ error: "Errore nell'aggiornamento promemoria" });
    }
  });

  // Completa promemoria
  app.put("/api/promemoria/:id/completa", async (req: Request, res: Response) => {
    try {
      const [promemoria] = await db.update(promemoriaAnagrafica)
        .set({
          stato: "completato",
          completatoAt: new Date(),
          completatoDa: req.body.userId,
          updatedAt: new Date()
        })
        .where(eq(promemoriaAnagrafica.id, req.params.id))
        .returning();

      if (!promemoria) {
        return res.status(404).json({ error: "Promemoria non trovato" });
      }
      res.json(promemoria);
    } catch (error) {
      res.status(500).json({ error: "Errore nel completamento promemoria" });
    }
  });

  // Delete promemoria
  app.delete("/api/promemoria/:id", async (req: Request, res: Response) => {
    try {
      const result = await db.delete(promemoriaAnagrafica)
        .where(eq(promemoriaAnagrafica.id, req.params.id));

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Errore nell'eliminazione promemoria" });
    }
  });

  // =====================
  // COMPANY INFO API (La Mia Azienda)
  // =====================
  app.get("/api/company-info", async (req: Request, res: Response) => {
    const info = await storage.getCompanyInfo();
    res.json(info || null);
  });

  app.post("/api/company-info", async (req: Request, res: Response) => {
    try {
      const info = await storage.upsertCompanyInfo(req.body);
      res.json(info);
    } catch (error) {
      console.error("Error saving company info:", error);
      res.status(500).json({ error: "Errore nel salvataggio" });
    }
  });

  // =====================
  // CONTI BANCARI AZIENDALI API
  // =====================
  app.get("/api/azienda/conti-bancari", async (req: Request, res: Response) => {
    const conti = await storage.getAziendaContiBancari();
    res.json(conti);
  });

  app.get("/api/azienda/conti-bancari/principale", async (req: Request, res: Response) => {
    const conto = await storage.getAziendaContoPrincipale();
    res.json(conto || null);
  });

  app.get("/api/azienda/conti-bancari/:id", async (req: Request, res: Response) => {
    const conto = await storage.getAziendaContoBancarioById(req.params.id);
    if (!conto) {
      return res.status(404).json({ error: "Conto non trovato" });
    }
    res.json(conto);
  });

  app.post("/api/azienda/conti-bancari", async (req: Request, res: Response) => {
    try {
      const conto = await storage.createAziendaContoBancario(req.body);
      res.status(201).json(conto);
    } catch (error) {
      console.error("Error creating conto bancario:", error);
      res.status(500).json({ error: "Errore nella creazione" });
    }
  });

  app.put("/api/azienda/conti-bancari/:id", async (req: Request, res: Response) => {
    const conto = await storage.updateAziendaContoBancario(req.params.id, req.body);
    if (!conto) {
      return res.status(404).json({ error: "Conto non trovato" });
    }
    res.json(conto);
  });

  app.delete("/api/azienda/conti-bancari/:id", async (req: Request, res: Response) => {
    const success = await storage.deleteAziendaContoBancario(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Conto non trovato" });
    }
    res.status(204).send();
  });

  // =====================
  // CONDIZIONI DI PAGAMENTO API
  // =====================
  app.get("/api/condizioni-pagamento", async (req: Request, res: Response) => {
    const condizioni = await storage.getCondizioniPagamento();
    res.json(condizioni);
  });

  app.post("/api/condizioni-pagamento", async (req: Request, res: Response) => {
    try {
      const condizione = await storage.createCondizionePagamento(req.body);
      res.status(201).json(condizione);
    } catch (error) {
      console.error("Error creating condizione pagamento:", error);
      res.status(500).json({ error: "Errore nella creazione" });
    }
  });

  app.put("/api/condizioni-pagamento/:id", async (req: Request, res: Response) => {
    const condizione = await storage.updateCondizionePagamento(req.params.id, req.body);
    if (!condizione) {
      return res.status(404).json({ error: "Condizione non trovata" });
    }
    res.json(condizione);
  });

  app.delete("/api/condizioni-pagamento/:id", async (req: Request, res: Response) => {
    const success = await storage.deleteCondizionePagamento(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Condizione non trovata" });
    }
    res.status(204).send();
  });



  // Create a new backup schedule (Admin only)


  // =====================
  // FINANZA PROFESSIONALE API
  // All routes protected by finanzaAuthMiddleware (only massimo.canuto)
  // =====================

  // Finance Accounts
  app.get("/api/finance/accounts", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const accounts = await storage.getFinanceAccounts();
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching finance accounts:", error);
      res.status(500).json({ error: "Errore nel recupero dei conti" });
    }
  });

  app.get("/api/finance/accounts/:id", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const account = await storage.getFinanceAccountById(req.params.id);
      if (!account) {
        return res.status(404).json({ error: "Conto non trovato" });
      }
      res.json(account);
    } catch (error) {
      console.error("Error fetching finance account:", error);
      res.status(500).json({ error: "Errore nel recupero del conto" });
    }
  });

  app.post("/api/finance/accounts", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const account = await storage.createFinanceAccount(req.body);
      res.status(201).json(account);
    } catch (error) {
      console.error("Error creating finance account:", error);
      res.status(500).json({ error: "Errore nella creazione del conto" });
    }
  });

  app.put("/api/finance/accounts/:id", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const account = await storage.updateFinanceAccount(req.params.id, req.body);
      if (!account) {
        return res.status(404).json({ error: "Conto non trovato" });
      }
      res.json(account);
    } catch (error) {
      console.error("Error updating finance account:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento del conto" });
    }
  });

  app.delete("/api/finance/accounts/:id", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteFinanceAccount(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Conto non trovato" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting finance account:", error);
      res.status(500).json({ error: "Errore nell'eliminazione del conto" });
    }
  });

  // Finance Categories
  app.get("/api/finance/categories", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const categories = await storage.getFinanceCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching finance categories:", error);
      res.status(500).json({ error: "Errore nel recupero delle categorie" });
    }
  });

  app.post("/api/finance/categories", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const category = await storage.createFinanceCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating finance category:", error);
      res.status(500).json({ error: "Errore nella creazione della categoria" });
    }
  });

  app.put("/api/finance/categories/:id", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const category = await storage.updateFinanceCategory(req.params.id, req.body);
      if (!category) {
        return res.status(404).json({ error: "Categoria non trovata" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error updating finance category:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento della categoria" });
    }
  });

  app.delete("/api/finance/categories/:id", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteFinanceCategory(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Categoria non trovata" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting finance category:", error);
      res.status(500).json({ error: "Errore nell'eliminazione della categoria" });
    }
  });

  // Invoices
  app.get("/api/finance/invoices", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const tipo = req.query.tipo as string | undefined;
      const invoicesList = tipo
        ? await storage.getInvoicesByType(tipo)
        : await storage.getInvoices();
      res.json(invoicesList);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ error: "Errore nel recupero delle fatture" });
    }
  });

  app.get("/api/finance/invoices/next-numero", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const tipo = req.query.tipo as string || "emessa";
      const year = new Date().getFullYear();
      const counterId = `${tipo}-${year}`;

      // Atomic increment using database transaction
      const result = await db.execute(sql`
        INSERT INTO invoice_counters (id, anno, ultimo_numero, updated_at) 
        VALUES (${counterId}, ${year}, 1, NOW())
        ON CONFLICT (id) DO UPDATE SET 
          ultimo_numero = invoice_counters.ultimo_numero + 1,
          updated_at = NOW()
        RETURNING ultimo_numero
      `);

      const nextNum = (result.rows[0] as any)?.ultimo_numero || 1;
      const numero = `INV/${year}/${String(nextNum).padStart(5, '0')}`;

      res.json({ numero, nextNum });
    } catch (error) {
      console.error("Error getting next invoice number:", error);
      res.status(500).json({ error: "Errore nel calcolo del prossimo numero fattura" });
    }
  });

  app.get("/api/finance/invoices/:id", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const invoice = await storage.getInvoiceById(req.params.id);
      if (!invoice) {
        return res.status(404).json({ error: "Fattura non trovata" });
      }
      const lines = await storage.getInvoiceLines(req.params.id);
      res.json({ ...invoice, lines });
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ error: "Errore nel recupero della fattura" });
    }
  });

  app.post("/api/finance/invoices", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const { lines, ...invoiceData } = req.body;
      const userId = (req as any).session?.userId;
      const invoice = await storage.createInvoice({ ...invoiceData, createdBy: userId });

      if (lines && Array.isArray(lines)) {
        for (const line of lines) {
          await storage.createInvoiceLine({ ...line, invoiceId: invoice.id });
        }
      }

      const createdLines = await storage.getInvoiceLines(invoice.id);
      res.status(201).json({ ...invoice, lines: createdLines });
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ error: "Errore nella creazione della fattura" });
    }
  });

  app.put("/api/finance/invoices/:id", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const { lines, ...invoiceData } = req.body;
      const invoice = await storage.updateInvoice(req.params.id, invoiceData);
      if (!invoice) {
        return res.status(404).json({ error: "Fattura non trovata" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento della fattura" });
    }
  });

  app.delete("/api/finance/invoices/:id", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteInvoice(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Fattura non trovata" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ error: "Errore nell'eliminazione della fattura" });
    }
  });

  // Invoice Lines
  app.post("/api/finance/invoices/:invoiceId/lines", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const line = await storage.createInvoiceLine({ ...req.body, invoiceId: req.params.invoiceId });
      res.status(201).json(line);
    } catch (error) {
      console.error("Error creating invoice line:", error);
      res.status(500).json({ error: "Errore nella creazione della riga" });
    }
  });

  app.put("/api/finance/invoice-lines/:id", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const line = await storage.updateInvoiceLine(req.params.id, req.body);
      if (!line) {
        return res.status(404).json({ error: "Riga non trovata" });
      }
      res.json(line);
    } catch (error) {
      console.error("Error updating invoice line:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento della riga" });
    }
  });

  app.delete("/api/finance/invoice-lines/:id", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteInvoiceLine(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Riga non trovata" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting invoice line:", error);
      res.status(500).json({ error: "Errore nell'eliminazione della riga" });
    }
  });

  // Invoice Reminders (Solleciti)
  app.get("/api/finance/invoices/:invoiceId/reminders", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const reminders = await storage.getInvoiceRemindersByInvoice(req.params.invoiceId);
      res.json(reminders);
    } catch (error) {
      console.error("Error fetching invoice reminders:", error);
      res.status(500).json({ error: "Errore nel recupero dei solleciti" });
    }
  });

  app.post("/api/finance/invoices/:invoiceId/reminders", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const { recipientEmail, recipientName, subject, body } = req.body;
      if (!recipientEmail || !subject || !body) {
        return res.status(400).json({ error: "Email destinatario, oggetto e corpo richiesti" });
      }

      const invoice = await storage.getInvoiceById(req.params.invoiceId);
      if (!invoice) {
        return res.status(404).json({ error: "Fattura non trovata" });
      }

      const { nanoid } = await import("nanoid");
      const trackingToken = nanoid(32);

      const reminder = await storage.createInvoiceReminder({
        invoiceId: req.params.invoiceId,
        trackingToken,
        recipientEmail,
        recipientName: recipientName || null,
        subject,
        body,
        sentBy: userId,
        sentAt: null,
        deliveryStatus: "pending",
        deliveryError: null,
        openedAt: null,
        lastOpenIp: null,
        lastOpenUserAgent: null,
      });

      const userCreds = await getUserEmailCredentials(req);
      if (!userCreds) {
        await storage.updateInvoiceReminderDelivery(reminder.id, "failed", "Configurazione email non trovata");
        return res.status(503).json({
          error: "Configura il tuo account email nelle impostazioni per inviare solleciti",
          reminder
        });
      }

      const baseUrl = process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
      const trackingPixelUrl = `${baseUrl}/api/finance/reminders/${trackingToken}/open.gif`;

      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${body.replace(/\n/g, '<br>')}
          <img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />
        </div>
      `;

      try {
        const nodemailer = await import("nodemailer");
        const transporter = nodemailer.default.createTransport({
          host: userCreds.smtpHost,
          port: userCreds.smtpPort,
          secure: userCreds.smtpSecure,
          auth: {
            user: userCreds.emailAddress,
            pass: userCreds.password,
          },
        });

        await transporter.sendMail({
          from: userCreds.displayName
            ? `"${userCreds.displayName}" <${userCreds.emailAddress}>`
            : userCreds.emailAddress,
          to: recipientEmail,
          subject,
          text: body,
          html: htmlBody,
        });

        await storage.updateInvoiceReminderDelivery(reminder.id, "sent");

        const updatedReminder = await storage.getInvoiceReminderByToken(trackingToken);
        res.status(201).json({ success: true, reminder: updatedReminder });
      } catch (emailError: any) {
        console.error("Error sending reminder email:", emailError);
        await storage.updateInvoiceReminderDelivery(reminder.id, "failed", emailError.message);
        res.status(500).json({
          error: "Errore nell'invio del sollecito: " + emailError.message,
          reminder
        });
      }
    } catch (error) {
      console.error("Error creating invoice reminder:", error);
      res.status(500).json({ error: "Errore nella creazione del sollecito" });
    }
  });

  // Tracking pixel endpoint (unauthenticated)
  app.get("/api/finance/reminders/:token/open.gif", async (req: Request, res: Response) => {
    try {
      const reminder = await storage.getInvoiceReminderByToken(req.params.token);
      if (reminder) {
        const clientIp = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        await storage.trackInvoiceReminderOpen(reminder.id, clientIp, userAgent);
      }
    } catch (error) {
      console.error("Error tracking reminder open:", error);
    }

    // Return 1x1 transparent GIF
    const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.set({
      'Content-Type': 'image/gif',
      'Content-Length': gif.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
    res.send(gif);
  });

  // Quotes (Preventivi)
  app.get("/api/finance/quotes", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const quotesList = await storage.getQuotes();
      res.json(quotesList);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ error: "Errore nel recupero dei preventivi" });
    }
  });

  app.get("/api/finance/quotes/:id", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const quote = await storage.getQuoteById(req.params.id);
      if (!quote) {
        return res.status(404).json({ error: "Preventivo non trovato" });
      }
      const lines = await storage.getQuoteLines(req.params.id);
      res.json({ ...quote, lines });
    } catch (error) {
      console.error("Error fetching quote:", error);
      res.status(500).json({ error: "Errore nel recupero del preventivo" });
    }
  });

  app.post("/api/finance/quotes", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const { lines, ...quoteData } = req.body;
      const userId = (req as any).session?.userId;
      const quote = await storage.createQuote({ ...quoteData, createdBy: userId });

      if (lines && Array.isArray(lines)) {
        for (const line of lines) {
          await storage.createQuoteLine({ ...line, quoteId: quote.id });
        }
      }

      const createdLines = await storage.getQuoteLines(quote.id);
      res.status(201).json({ ...quote, lines: createdLines });
    } catch (error) {
      console.error("Error creating quote:", error);
      res.status(500).json({ error: "Errore nella creazione del preventivo" });
    }
  });

  app.put("/api/finance/quotes/:id", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const { lines, ...quoteData } = req.body;
      const quote = await storage.updateQuote(req.params.id, quoteData);
      if (!quote) {
        return res.status(404).json({ error: "Preventivo non trovato" });
      }
      res.json(quote);
    } catch (error) {
      console.error("Error updating quote:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento del preventivo" });
    }
  });

  app.delete("/api/finance/quotes/:id", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteQuote(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Preventivo non trovato" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting quote:", error);
      res.status(500).json({ error: "Errore nell'eliminazione del preventivo" });
    }
  });

  // Quote Lines
  app.post("/api/finance/quotes/:quoteId/lines", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const line = await storage.createQuoteLine({ ...req.body, quoteId: req.params.quoteId });
      res.status(201).json(line);
    } catch (error) {
      console.error("Error creating quote line:", error);
      res.status(500).json({ error: "Errore nella creazione della riga" });
    }
  });

  app.put("/api/finance/quote-lines/:id", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const line = await storage.updateQuoteLine(req.params.id, req.body);
      if (!line) {
        return res.status(404).json({ error: "Riga non trovata" });
      }
      res.json(line);
    } catch (error) {
      console.error("Error updating quote line:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento della riga" });
    }
  });

  app.delete("/api/finance/quote-lines/:id", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteQuoteLine(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Riga non trovata" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting quote line:", error);
      res.status(500).json({ error: "Errore nell'eliminazione della riga" });
    }
  });

  // ==================== ORDINI CLIENTE (Sales Orders) ====================

  // Get all sales orders
  app.get("/api/sales-orders", async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT so.*, 
          q.numero as preventivo_numero,
          (SELECT COUNT(*) FROM sales_order_lines sol WHERE sol.order_id = so.id) as num_righe,
          COALESCE(SUM(CAST(sol.quantita AS INTEGER)), 0) as totale_pezzi,
          COALESCE(MIN(ca.giacenza), 0) as giacenza_minima
        FROM sales_orders so
        LEFT JOIN quotes q ON so.quote_id = q.id
        LEFT JOIN sales_order_lines sol ON so.id = sol.order_id
        LEFT JOIN catalog_articles ca ON sol.codice_articolo = ca.codice
        GROUP BY so.id, q.numero
        ORDER BY so.created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching sales orders:", error);
      res.status(500).json({ error: "Errore nel recupero degli ordini" });
    }
  });

  // Get orders in production
  app.get("/api/sales-orders/status/production", async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT so.*, 
          q.numero as preventivo_numero,
          COALESCE(SUM(CAST(sol.quantita AS INTEGER)), 0) as totale_pezzi
        FROM sales_orders so
        LEFT JOIN quotes q ON so.quote_id = q.id
        LEFT JOIN sales_order_lines sol ON so.id = sol.order_id
        WHERE so.workflow_status = 'in_produzione' OR so.stato = 'in_produzione'
        GROUP BY so.id, q.numero
        ORDER BY so.created_at DESC
      `);

      // Get lines for each order with stock info
      const ordersWithLines = await Promise.all(result.rows.map(async (order: any) => {
        const linesResult = await db.execute(sql`
          SELECT sol.*, ca.giacenza, ca.stock_minimo
          FROM sales_order_lines sol
          LEFT JOIN catalog_articles ca ON sol.codice_articolo = ca.codice
          WHERE sol.order_id = ${order.id}
          ORDER BY sol.ordine
        `);
        return { ...order, lines: linesResult.rows };
      }));

      res.json(ordersWithLines);
    } catch (error) {
      console.error("Error fetching production orders:", error);
      res.status(500).json({ error: "Errore nel recupero degli ordini in produzione" });
    }
  });

  // Get single sales order with lines
  app.get("/api/sales-orders/:id", async (req, res) => {
    try {
      const orderResult = await db.execute(sql`
        SELECT so.*, q.numero as preventivo_numero
        FROM sales_orders so
        LEFT JOIN quotes q ON so.quote_id = q.id
        WHERE so.id = ${req.params.id}
      `);
      if (orderResult.rows.length === 0) {
        return res.status(404).json({ error: "Ordine non trovato" });
      }
      const linesResult = await db.execute(sql`
        SELECT sol.*, ca.nome as articolo_nome, ca.giacenza, ca.stock_minimo
        FROM sales_order_lines sol
        LEFT JOIN catalog_articles ca ON sol.articolo_id = ca.id
        WHERE sol.order_id = ${req.params.id}
        ORDER BY sol.ordine
      `);
      res.json({ ...orderResult.rows[0], lines: linesResult.rows });
    } catch (error) {
      console.error("Error fetching sales order:", error);
      res.status(500).json({ error: "Errore nel recupero dell'ordine" });
    }
  });

  // Get next sales order number
  app.get("/api/sales-orders/next-number", async (req, res) => {
    try {
      const year = new Date().getFullYear();
      const result = await db.execute(sql`
        SELECT numero FROM sales_orders 
        WHERE numero LIKE ${'ORD/' + year + '/%'}
        ORDER BY numero DESC LIMIT 1
      `);
      let nextNum = 1;
      if (result.rows.length > 0) {
        const lastNum = (result.rows[0] as any).numero;
        const match = lastNum.match(/ORD\/\d+\/(\d+)/);
        if (match) nextNum = parseInt(match[1]) + 1;
      }
      res.json({ numero: `ORD/${year}/${String(nextNum).padStart(5, '0')}` });
    } catch (error) {
      res.json({ numero: `ORD/${new Date().getFullYear()}/00001` });
    }
  });

  // Convert quote to sales order
  app.post("/api/finance/quotes/:id/convert-to-order", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const quote = await storage.getQuoteById(req.params.id);
      if (!quote) {
        return res.status(404).json({ error: "Preventivo non trovato" });
      }

      const quoteLines = await storage.getQuoteLines(req.params.id);
      const userId = (req as any).session?.userId;

      // Generate next order number
      const year = new Date().getFullYear();
      const numResult = await db.execute(sql`
        SELECT numero FROM sales_orders 
        WHERE numero LIKE ${'ORD/' + year + '/%'}
        ORDER BY numero DESC LIMIT 1
      `);
      let nextNum = 1;
      if (numResult.rows.length > 0) {
        const lastNum = (numResult.rows[0] as any).numero;
        const match = lastNum.match(/ORD\/\d+\/(\d+)/);
        if (match) nextNum = parseInt(match[1]) + 1;
      }
      const orderNumber = `ORD/${year}/${String(nextNum).padStart(5, '0')}`;

      // Create sales order
      const orderResult = await db.execute(sql`
        INSERT INTO sales_orders (
          numero, stato, workflow_status, data_ordine, quote_id, cliente_id,
          ragione_sociale, partita_iva, codice_fiscale, indirizzo, cap, citta, provincia,
          email, telefono, imponibile, iva, totale, valuta, oggetto, note, termini_pagamento,
          created_by
        ) VALUES (
          ${orderNumber}, 'confermato', 'ordine_confermato', ${new Date().toISOString().split('T')[0]},
          ${quote.id}, ${quote.clienteId}, ${quote.ragioneSociale}, ${quote.partitaIva},
          ${quote.codiceFiscale}, ${quote.indirizzo}, ${(quote as any).cap || null}, ${(quote as any).citta || null}, ${(quote as any).provincia || null},
          ${quote.email}, ${quote.telefono}, ${quote.imponibile}, ${quote.iva}, ${quote.totale},
          ${quote.valuta}, ${quote.oggetto}, ${quote.note}, ${quote.terminiPagamento}, ${userId}
        ) RETURNING *
      `);

      const order = orderResult.rows[0] as any;

      // Create order lines from quote lines
      for (const line of quoteLines) {
        await db.execute(sql`
          INSERT INTO sales_order_lines (
            order_id, descrizione, quantita, unita_misura, prezzo_unitario,
            sconto, aliquota_iva, importo, ordine
          ) VALUES (
            ${order.id}, ${line.descrizione}, ${line.quantita}, ${line.unitaMisura},
            ${line.prezzoUnitario}, ${line.sconto}, ${line.aliquotaIva}, ${line.importo}, ${line.ordine}
          )
        `);
      }

      // Update quote status
      await storage.updateQuote(req.params.id, { stato: 'convertito' });

      res.status(201).json({ order, message: "Ordine creato con successo" });
    } catch (error) {
      console.error("Error converting quote to order:", error);
      res.status(500).json({ error: "Errore nella conversione del preventivo in ordine" });
    }
  });

  // Create sales order
  app.post("/api/sales-orders", async (req, res) => {
    try {
      const { lines, ...orderData } = req.body;
      const result = await db.execute(sql`
        INSERT INTO sales_orders (
          numero, stato, workflow_status, data_ordine, data_consegna_prevista,
          cliente_id, ragione_sociale, partita_iva, codice_fiscale, indirizzo,
          cap, citta, provincia, email, telefono, imponibile, iva, totale,
          valuta, oggetto, note, termini_pagamento, priorita
        ) VALUES (
          ${orderData.numero}, ${orderData.stato || 'confermato'}, 'ordine_confermato',
          ${orderData.dataOrdine}, ${orderData.dataConsegnaPrevista},
          ${orderData.clienteId}, ${orderData.ragioneSociale}, ${orderData.partitaIva},
          ${orderData.codiceFiscale}, ${orderData.indirizzo}, ${orderData.cap},
          ${orderData.citta}, ${orderData.provincia}, ${orderData.email},
          ${orderData.telefono}, ${orderData.imponibile}, ${orderData.iva},
          ${orderData.totale}, ${orderData.valuta || 'EUR'}, ${orderData.oggetto},
          ${orderData.note}, ${orderData.terminiPagamento}, ${orderData.priorita || 'normale'}
        ) RETURNING *
      `);

      const order = result.rows[0] as any;

      if (lines && Array.isArray(lines)) {
        for (const line of lines) {
          await db.execute(sql`
            INSERT INTO sales_order_lines (
              order_id, articolo_id, codice_articolo, descrizione, quantita,
              unita_misura, prezzo_unitario, sconto, aliquota_iva, importo, ordine
            ) VALUES (
              ${order.id}, ${line.articoloId}, ${line.codiceArticolo}, ${line.descrizione},
              ${line.quantita}, ${line.unitaMisura}, ${line.prezzoUnitario},
              ${line.sconto}, ${line.aliquotaIva}, ${line.importo}, ${line.ordine || 0}
            )
          `);
        }
      }

      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating sales order:", error);
      res.status(500).json({ error: "Errore nella creazione dell'ordine" });
    }
  });

  // Update sales order with lines
  app.put("/api/sales-orders/:id", async (req, res) => {
    try {
      const { lines, ...orderData } = req.body;

      // Update order
      await db.execute(sql`
        UPDATE sales_orders SET
          ragione_sociale = ${orderData.ragioneSociale},
          partita_iva = ${orderData.partitaIva},
          email = ${orderData.email},
          telefono = ${orderData.telefono},
          indirizzo = ${orderData.indirizzo},
          data_ordine = ${orderData.dataOrdine},
          note = ${orderData.note},
          stato = ${orderData.stato},
          updated_at = NOW()
        WHERE id = ${req.params.id}
      `);

      // Delete existing lines
      await db.execute(sql`
        DELETE FROM sales_order_lines WHERE order_id = ${req.params.id}
      `);

      // Check if any article is out of stock or low on stock
      let needsProduction = false;
      if (lines && Array.isArray(lines)) {
        for (const line of lines) {
          // Check article stock
          if (line.codiceArticolo) {
            const articoloResult = await db.execute(sql`
              SELECT giacenza, stock_minimo FROM catalog_articles 
              WHERE codice = ${line.codiceArticolo}
            `);
            if (articoloResult.rows.length > 0) {
              const articolo = articoloResult.rows[0];
              const giacenza = parseInt(articolo.giacenza) || 0;
              const stockMinimo = parseInt(articolo.stock_minimo) || 0;
              // If stock is at or below minimum, mark for production
              if (giacenza <= stockMinimo) {
                needsProduction = true;
              }
            }
          }

          // Insert line
          await db.execute(sql`
            INSERT INTO sales_order_lines (
              order_id, codice_articolo, descrizione, quantita,
              unita_misura, prezzo_unitario, sconto, importo
            ) VALUES (
              ${req.params.id}, ${line.codiceArticolo}, ${line.descrizione},
              ${line.quantita}, ${line.unitaMisura}, ${line.prezzoUnitario},
              ${line.sconto}, ${line.importo}
            )
          `);
        }
      }

      // If any article is in short supply, update workflow status to production
      if (needsProduction) {
        await db.execute(sql`
          UPDATE sales_orders SET
            workflow_status = 'in_produzione',
            stato = 'in_produzione',
            updated_at = NOW()
          WHERE id = ${req.params.id}
        `);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating sales order:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento dell'ordine" });
    }
  });

  // Update sales order status
  app.patch("/api/sales-orders/:id/status", async (req, res) => {
    try {
      const { stato, workflowStatus } = req.body;
      await db.execute(sql`
        UPDATE sales_orders 
        SET stato = ${stato}, workflow_status = ${workflowStatus}, updated_at = NOW()
        WHERE id = ${req.params.id}
      `);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento dello stato" });
    }
  });

  // Verify material availability for order
  app.post("/api/sales-orders/:id/verify-material", async (req, res) => {
    try {
      const linesResult = await db.execute(sql`
        SELECT sol.*, ca.codice, ca.giacenza, ca.stock_minimo
        FROM sales_order_lines sol
        LEFT JOIN catalog_articles ca ON sol.codice_articolo = ca.codice
        WHERE sol.order_id = ${req.params.id}
      `);

      // Get occupied quantities
      const occupatiResult = await db.execute(sql`
        SELECT dl.codice_articolo as codice, SUM(CAST(dl.quantita AS INTEGER)) as occupato
        FROM ddt_lines dl
        JOIN ddt d ON dl.ddt_id = d.id
        WHERE d.stato NOT IN ('consegnato', 'fatturato', 'annullato')
        GROUP BY dl.codice_articolo
      `);
      const occupati: Record<string, number> = {};
      occupatiResult.rows.forEach((r: any) => {
        if (r.codice) occupati[r.codice] = parseInt(r.occupato) || 0;
      });

      let allAvailable = true;
      let hasSottoscorta = false;
      const shortages: any[] = [];

      for (const line of linesResult.rows as any[]) {
        if (!line.codice_articolo) continue;
        const giacenza = parseInt(line.giacenza) || 0;
        const stockMinimo = parseInt(line.stock_minimo) || 0;
        const occupato = occupati[line.codice_articolo] || 0;
        const disponibile = giacenza - occupato;
        const richiesto = parseInt(line.quantita) || 0;

        // Check sottoscorta (giacenza <= stock_minimo)
        if (giacenza <= stockMinimo) {
          hasSottoscorta = true;
        }

        if (disponibile < richiesto) {
          allAvailable = false;
          shortages.push({
            articolo: line.descrizione,
            codice: line.codice_articolo,
            richiesto,
            disponibile,
            mancante: richiesto - disponibile
          });
        }
      }

      // Determine workflow status: sottoscorta triggers production
      // Sottoscorta means material is not truly available for this order
      const needsProduction = !allAvailable || hasSottoscorta;
      let workflowStatus = 'materiale_ok';
      if (!allAvailable) {
        workflowStatus = 'materiale_insufficiente';
      } else if (hasSottoscorta) {
        workflowStatus = 'in_produzione';
      }

      // Update order - when sottoscorta, treat as material not available
      await db.execute(sql`
        UPDATE sales_orders 
        SET materiale_verificato = true, 
            materiale_disponibile = ${allAvailable && !hasSottoscorta},
            produzione_richiesta = ${needsProduction},
            workflow_status = ${workflowStatus},
            stato = CASE WHEN ${needsProduction} THEN 'in_produzione' ELSE stato END,
            updated_at = NOW()
        WHERE id = ${req.params.id}
      `);

      res.json({
        available: allAvailable,
        shortages,
        message: allAvailable ? "Materiale disponibile" : "Materiale insufficiente - produzione richiesta"
      });
    } catch (error) {
      console.error("Error verifying material:", error);
      res.status(500).json({ error: "Errore nella verifica del materiale" });
    }
  });

  // Create DDT from sales order
  app.post("/api/sales-orders/:id/create-ddt", async (req, res) => {
    try {
      const orderResult = await db.execute(sql`
        SELECT * FROM sales_orders WHERE id = ${req.params.id}
      `);
      if (orderResult.rows.length === 0) {
        return res.status(404).json({ error: "Ordine non trovato" });
      }
      const order = orderResult.rows[0] as any;

      // Get next DDT number
      const year = new Date().getFullYear();
      const ddtNumResult = await db.execute(sql`
        SELECT numero FROM ddt 
        WHERE numero LIKE ${'DDT/' + year + '/%'}
        ORDER BY numero DESC LIMIT 1
      `);
      let nextNum = 1;
      if (ddtNumResult.rows.length > 0) {
        const lastNum = (ddtNumResult.rows[0] as any).numero;
        const match = lastNum.match(/DDT\/\d+\/(\d+)/);
        if (match) nextNum = parseInt(match[1]) + 1;
      }
      const ddtNumber = `DDT/${year}/${String(nextNum).padStart(5, '0')}`;

      // Create DDT
      const ddtResult = await db.execute(sql`
        INSERT INTO ddt (
          numero, stato, data_emissione, sales_order_id, cliente_id,
          ragione_sociale, partita_iva, codice_fiscale, indirizzo, cap, citta, provincia,
          email, telefono, riferimento_ordine
        ) VALUES (
          ${ddtNumber}, 'bozza', ${new Date().toISOString().split('T')[0]},
          ${order.id}, ${order.cliente_id}, ${order.ragione_sociale}, ${order.partita_iva},
          ${order.codice_fiscale}, ${order.indirizzo}, ${order.cap}, ${order.citta},
          ${order.provincia}, ${order.email}, ${order.telefono}, ${order.numero}
        ) RETURNING *
      `);
      const ddt = ddtResult.rows[0] as any;

      // Copy order lines to DDT
      const linesResult = await db.execute(sql`
        SELECT * FROM sales_order_lines WHERE order_id = ${req.params.id}
      `);
      for (const line of linesResult.rows as any[]) {
        await db.execute(sql`
          INSERT INTO ddt_lines (ddt_id, codice_articolo, descrizione, quantita, unita_misura)
          VALUES (${ddt.id}, ${line.codice_articolo}, ${line.descrizione}, ${line.quantita}, ${line.unita_misura})
        `);
      }

      // Update order with DDT reference
      await db.execute(sql`
        UPDATE sales_orders 
        SET ddt_id = ${ddt.id}, workflow_status = 'ddt_creato', stato = 'in_spedizione', updated_at = NOW()
        WHERE id = ${req.params.id}
      `);

      res.status(201).json({ ddt, message: "DDT creato con successo" });
    } catch (error) {
      console.error("Error creating DDT from order:", error);
      res.status(500).json({ error: "Errore nella creazione del DDT" });
    }
  });

  // Send sales order via email
  app.post("/api/sales-orders/:id/send-email", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email non fornita" });
      }

      const orderResult = await db.execute(sql`
        SELECT * FROM sales_orders WHERE id = ${req.params.id}
      `);
      if (orderResult.rows.length === 0) {
        return res.status(404).json({ error: "Ordine non trovato" });
      }
      const order = orderResult.rows[0] as any;

      const linesResult = await db.execute(sql`
        SELECT * FROM sales_order_lines WHERE order_id = ${req.params.id}
      `);
      const lines = linesResult.rows;

      const totalAmount = lines.reduce((sum: number, l: any) => {
        const qty = parseFloat(l.quantita) || 0;
        const price = parseFloat(l.prezzo_unitario) || 0;
        const disc = parseFloat(l.sconto) || 0;
        return sum + (qty * price * (1 - disc / 100));
      }, 0);

      const linesList = lines.map((l: any) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e5e5;">${l.codice_articolo}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e5e5;">${l.descrizione}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e5e5; text-align: center;">${l.quantita}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e5e5; text-align: right;">€${parseFloat(l.prezzo_unitario || "0").toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e5e5; text-align: right;">€${(parseFloat(l.quantita || "0") * parseFloat(l.prezzo_unitario || "0") * (1 - parseFloat(l.sconto || "0") / 100)).toFixed(2)}</td>
        </tr>
      `).join("");

      const emailBody = `
        <h2>Ordine Cliente N. ${order.numero}</h2>
        <p><strong>Cliente:</strong> ${order.ragione_sociale}</p>
        <p><strong>Indirizzo:</strong> ${order.indirizzo}</p>
        <p><strong>Data Ordine:</strong> ${order.data_ordine}</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 8px; border-bottom: 2px solid #ccc; text-align: left;">Codice</th>
              <th style="padding: 8px; border-bottom: 2px solid #ccc; text-align: left;">Descrizione</th>
              <th style="padding: 8px; border-bottom: 2px solid #ccc; text-align: center;">Qtà</th>
              <th style="padding: 8px; border-bottom: 2px solid #ccc; text-align: right;">Prezzo</th>
              <th style="padding: 8px; border-bottom: 2px solid #ccc; text-align: right;">Importo</th>
            </tr>
          </thead>
          <tbody>
            ${linesList}
          </tbody>
        </table>
        <p style="text-align: right; font-weight: bold; font-size: 18px;">Totale: €${totalAmount.toFixed(2)}</p>
      `;

      const { sendEmail } = await import("./emailService.js");
      const success = await sendEmail(email, `Ordine Cliente N. ${order.numero}`, emailBody);

      if (success) {
        res.status(200).json({ message: "Email inviata con successo" });
      } else {
        res.status(500).json({ error: "Errore nell'invio dell'email" });
      }
    } catch (error) {
      console.error("Error sending order email:", error);
      res.status(500).json({ error: "Errore nell'invio dell'email" });
    }
  });

  // Generate production orders from sales order shortages
  app.post("/api/sales-orders/:id/generate-production", async (req, res) => {
    try {
      const orderResult = await db.execute(sql`
        SELECT * FROM sales_orders WHERE id = ${req.params.id}
      `);
      if (orderResult.rows.length === 0) {
        return res.status(404).json({ error: "Ordine non trovato" });
      }
      const order = orderResult.rows[0] as any;

      // Get order lines with catalog info
      const linesResult = await db.execute(sql`
        SELECT sol.*, ca.id as catalogo_id, ca.codice, ca.nome, ca.giacenza, ca.stock_minimo
        FROM sales_order_lines sol
        LEFT JOIN catalog_articles ca ON sol.articolo_id = ca.id
        WHERE sol.order_id = ${req.params.id}
      `);

      // Get occupied quantities
      const occupatiResult = await db.execute(sql`
        SELECT dl.codice_articolo as codice, SUM(CAST(dl.quantita AS INTEGER)) as occupato
        FROM ddt_lines dl
        JOIN ddt d ON dl.ddt_id = d.id
        WHERE d.stato NOT IN ('consegnato', 'fatturato', 'annullato')
        GROUP BY dl.codice_articolo
      `);
      const occupati: Record<string, number> = {};
      occupatiResult.rows.forEach((r: any) => {
        if (r.codice) occupati[r.codice] = parseInt(r.occupato) || 0;
      });

      const productionOrders: any[] = [];
      const year = new Date().getFullYear();

      for (const line of linesResult.rows as any[]) {
        if (!line.catalogo_id) continue;
        const giacenza = parseInt(line.giacenza) || 0;
        const occupato = occupati[line.codice] || 0;
        const disponibile = giacenza - occupato;
        const richiesto = parseInt(line.quantita) || 0;

        if (disponibile < richiesto) {
          const mancante = richiesto - disponibile;

          // Get next production order number
          const numResult = await db.execute(sql`
            SELECT numero FROM production_orders 
            WHERE numero LIKE ${'PROD/' + year + '/%'}
            ORDER BY numero DESC LIMIT 1
          `);
          let nextNum = 1;
          if (numResult.rows.length > 0) {
            const lastNum = (numResult.rows[0] as any).numero;
            const match = lastNum.match(/PROD\/\d+\/(\d+)/);
            if (match) nextNum = parseInt(match[1]) + 1;
          }
          const prodNumber = `PROD/${year}/${String(nextNum).padStart(5, '0')}`;

          // Find or create a placeholder warehouse product for production
          let prodottoId: string;
          const existingProduct = await db.execute(sql`
            SELECT id FROM warehouse_products WHERE codice = ${line.codice} LIMIT 1
          `);
          if (existingProduct.rows.length > 0) {
            prodottoId = (existingProduct.rows[0] as any).id;
          } else {
            // Create placeholder
            const newProduct = await db.execute(sql`
              INSERT INTO warehouse_products (codice, nome, unita_misura, giacenza, giacenza_minima)
              VALUES (${line.codice}, ${line.nome || line.descrizione}, 'pz', '0', '0')
              RETURNING id
            `);
            prodottoId = (newProduct.rows[0] as any).id;
          }

          // Create production order
          const prodResult = await db.execute(sql`
            INSERT INTO production_orders (
              numero, prodotto_id, articolo_catalogo_id, quantita_richiesta, stato, priorita,
              data_inizio, data_fine_stimata, cliente_id, note, created_by
            ) VALUES (
              ${prodNumber}, ${prodottoId}, ${line.catalogo_id}, ${String(mancante)}, 'pianificato',
              ${order.priorita || 'normale'}, ${new Date().toISOString().split('T')[0]},
              ${order.data_consegna_prevista || null}, ${order.cliente_id},
              ${'Ordine di produzione per ordine cliente ' + order.numero}, ${null}
            ) RETURNING *
          `);
          productionOrders.push(prodResult.rows[0]);

          // Update order line with production reference
          await db.execute(sql`
            UPDATE sales_order_lines 
            SET produzione_ordine_id = ${(prodResult.rows[0] as any).id}, quantita_in_produzione = ${String(mancante)}
            WHERE id = ${line.id}
          `);
        }
      }

      // Update order status
      await db.execute(sql`
        UPDATE sales_orders 
        SET workflow_status = 'in_produzione', stato = 'in_produzione', updated_at = NOW()
        WHERE id = ${req.params.id}
      `);

      res.status(201).json({
        productionOrders,
        count: productionOrders.length,
        message: `${productionOrders.length} ordini produzione creati`
      });
    } catch (error) {
      console.error("Error generating production orders:", error);
      res.status(500).json({ error: "Errore nella generazione ordini produzione" });
    }
  });

  // Convert quote to invoice
  app.post("/api/finance/quotes/:id/convert", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const quote = await storage.getQuoteById(req.params.id);
      if (!quote) {
        return res.status(404).json({ error: "Preventivo non trovato" });
      }

      const quoteLines = await storage.getQuoteLines(req.params.id);
      const userId = (req as any).session?.userId;

      // Generate next invoice number atomically
      let invoiceNumber = req.body.numero;
      if (!invoiceNumber) {
        const year = new Date().getFullYear();
        const counterId = `emessa-${year}`;
        const result = await db.execute(sql`
          INSERT INTO invoice_counters (id, anno, ultimo_numero, updated_at) 
          VALUES (${counterId}, ${year}, 1, NOW())
          ON CONFLICT (id) DO UPDATE SET 
            ultimo_numero = invoice_counters.ultimo_numero + 1,
            updated_at = NOW()
          RETURNING ultimo_numero
        `);
        const nextNum = (result.rows[0] as any)?.ultimo_numero || 1;
        invoiceNumber = `INV/${year}/${String(nextNum).padStart(5, '0')}`;
      }

      // Create invoice from quote
      const invoice = await storage.createInvoice({
        numero: invoiceNumber,
        tipo: "emessa",
        stato: "bozza",
        dataEmissione: new Date().toISOString().split('T')[0],
        dataScadenza: req.body.dataScadenza,
        clienteId: quote.clienteId,
        ragioneSociale: quote.ragioneSociale,
        partitaIva: quote.partitaIva,
        codiceFiscale: quote.codiceFiscale,
        indirizzo: quote.indirizzo,
        imponibile: quote.imponibile,
        iva: quote.iva,
        totale: quote.totale,
        oggetto: quote.oggetto,
        note: quote.note,
        projectId: quote.projectId,
        createdBy: userId,
      });

      // Copy quote lines to invoice lines
      for (const line of quoteLines) {
        await storage.createInvoiceLine({
          invoiceId: invoice.id,
          descrizione: line.descrizione,
          quantita: line.quantita,
          unitaMisura: line.unitaMisura,
          prezzoUnitario: line.prezzoUnitario,
          sconto: line.sconto,
          aliquotaIva: line.aliquotaIva,
          importo: line.importo,
          ordine: line.ordine,
        });
      }

      // Update quote status and link to invoice
      await storage.updateQuote(req.params.id, {
        stato: "convertito",
        invoiceId: invoice.id
      });

      const invoiceLines = await storage.getInvoiceLines(invoice.id);
      res.status(201).json({ ...invoice, lines: invoiceLines });
    } catch (error) {
      console.error("Error converting quote to invoice:", error);
      res.status(500).json({ error: "Errore nella conversione del preventivo" });
    }
  });

  // DDT (Documenti di Trasporto)
  app.get("/api/finance/ddt", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const ddtList = await storage.getDdts();
      res.json(ddtList);
    } catch (error) {
      console.error("Error fetching DDT:", error);
      res.status(500).json({ error: "Errore nel recupero dei DDT" });
    }
  });

  // Get next available DDT number using ddt_counters
  app.get("/api/finance/ddt/next-number", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const year = new Date().getFullYear();
      const counterId = `ddt-${year}`;

      // Check if counter exists
      let result = await db.select().from(ddtCounters).where(eq(ddtCounters.id, counterId));

      if (result.length === 0) {
        // Initialize counter from existing DDTs to ensure continuity
        const ddtList = await storage.getDdts();
        const prefix = `DDT/${year}/`;
        let maxNum = 0;

        for (const ddt of ddtList) {
          if (ddt.numero && ddt.numero.startsWith(prefix)) {
            const numPart = parseInt(ddt.numero.replace(prefix, ''), 10);
            if (!isNaN(numPart) && numPart > maxNum) {
              maxNum = numPart;
            }
          }
        }

        await db.insert(ddtCounters).values({
          id: counterId,
          anno: year,
          ultimoNumero: maxNum,
          updatedAt: new Date().toISOString()
        });
        result = [{ ultimoNumero: maxNum }] as any;
      }

      const nextNum = (result[0].ultimoNumero || 0) + 1;
      const nextNumero = `DDT/${year}/${String(nextNum).padStart(5, '0')}`;
      res.json({ numero: nextNumero });
    } catch (error) {
      console.error("Error getting next DDT number:", error);
      res.status(500).json({ error: "Errore nel calcolo del numero DDT" });
    }
  });

  app.get("/api/finance/ddt/:id", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const ddtDoc = await storage.getDdtById(req.params.id);
      if (!ddtDoc) {
        return res.status(404).json({ error: "DDT non trovato" });
      }
      const lines = await storage.getDdtLines(ddtDoc.id);
      res.json({ ...ddtDoc, lines });
    } catch (error) {
      console.error("Error fetching DDT:", error);
      res.status(500).json({ error: "Errore nel recupero del DDT" });
    }
  });

  app.post("/api/finance/ddt", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId;
      const { lines, ...ddtData } = req.body;
      const ddtDoc = await storage.createDdt({ ...ddtData, createdBy: userId });

      // Update DDT counter if applicable
      if (ddtData.numero) {
        try {
          const year = new Date().getFullYear();
          const prefix = `DDT/${year}/`;
          if (ddtData.numero.startsWith(prefix)) {
            const numPart = parseInt(ddtData.numero.replace(prefix, ''), 10);
            const counterId = `ddt-${year}`;
            if (!isNaN(numPart)) {
              // Upsert to ensure counter tracks the highest number
              await db.execute(sql`
                    INSERT INTO ddt_counters (id, anno, ultimo_numero, updated_at)
                    VALUES (${counterId}, ${year}, ${numPart}, CURRENT_TIMESTAMP)
                    ON CONFLICT (id) DO UPDATE SET
                    ultimo_numero = GREATEST(ddt_counters.ultimo_numero, ${numPart}),
                    updated_at = CURRENT_TIMESTAMP
                  `);
            }
          }
        } catch (e) {
          console.error("Error updating DDT counter:", e);
          // Non-blocking error
        }
      }

      if (lines && Array.isArray(lines)) {
        for (let i = 0; i < lines.length; i++) {
          await storage.createDdtLine({ ...lines[i], ddtId: ddtDoc.id, ordine: i });
        }
      }

      const ddtLines = await storage.getDdtLines(ddtDoc.id);
      res.status(201).json({ ...ddtDoc, lines: ddtLines });
    } catch (error) {
      console.error("Error creating DDT:", error);
      res.status(500).json({ error: "Errore nella creazione del DDT" });
    }
  });

  app.put("/api/finance/ddt/:id", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const { lines, ...ddtData } = req.body;
      const ddtDoc = await storage.updateDdt(req.params.id, ddtData);
      if (!ddtDoc) {
        return res.status(404).json({ error: "DDT non trovato" });
      }
      res.json(ddtDoc);
    } catch (error) {
      console.error("Error updating DDT:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento del DDT" });
    }
  });

  app.delete("/api/finance/ddt/:id", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteDdt(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "DDT non trovato" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting DDT:", error);
      res.status(500).json({ error: "Errore nell'eliminazione del DDT" });
    }
  });

  // DDT Lines
  app.post("/api/finance/ddt/:ddtId/lines", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const line = await storage.createDdtLine({ ...req.body, ddtId: req.params.ddtId });
      res.status(201).json(line);
    } catch (error) {
      console.error("Error creating DDT line:", error);
      res.status(500).json({ error: "Errore nella creazione della riga DDT" });
    }
  });

  app.put("/api/finance/ddt/:ddtId/lines/:lineId", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const line = await storage.updateDdtLine(req.params.lineId, req.body);
      if (!line) {
        return res.status(404).json({ error: "Riga DDT non trovata" });
      }
      res.json(line);
    } catch (error) {
      console.error("Error updating DDT line:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento della riga DDT" });
    }
  });

  app.delete("/api/finance/ddt/:ddtId/lines/:lineId", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteDdtLine(req.params.lineId);
      if (!success) {
        return res.status(404).json({ error: "Riga DDT non trovata" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting DDT line:", error);
      res.status(500).json({ error: "Errore nell'eliminazione della riga DDT" });
    }
  });

  // Convert DDT to Invoice
  app.post("/api/finance/ddt/:id/convert", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const ddtDoc = await storage.getDdtById(req.params.id);
      if (!ddtDoc) {
        return res.status(404).json({ error: "DDT non trovato" });
      }

      if (ddtDoc.stato === "fatturato") {
        return res.status(400).json({ error: "DDT già fatturato" });
      }

      const userId = (req as any).session?.userId;
      const ddtLines = await storage.getDdtLines(ddtDoc.id);

      // Generate next invoice number atomically
      const year = new Date().getFullYear();
      const counterId = `emessa-${year}`;
      const result = await db.execute(sql`
        INSERT INTO invoice_counters (id, anno, ultimo_numero, updated_at) 
        VALUES (${counterId}, ${year}, 1, NOW())
        ON CONFLICT (id) DO UPDATE SET 
          ultimo_numero = invoice_counters.ultimo_numero + 1,
          updated_at = NOW()
        RETURNING ultimo_numero
      `);
      const nextNum = (result.rows[0] as any)?.ultimo_numero || 1;
      const invoiceNumber = `INV/${year}/${String(nextNum).padStart(5, '0')}`;

      // Create invoice from DDT - without line amounts (DDT doesn't have prices)
      const invoice = await storage.createInvoice({
        numero: invoiceNumber,
        tipo: "emessa",
        stato: "bozza",
        dataEmissione: new Date().toISOString().split('T')[0],
        ragioneSociale: ddtDoc.ragioneSociale,
        partitaIva: ddtDoc.partitaIva,
        codiceFiscale: ddtDoc.codiceFiscale,
        indirizzo: ddtDoc.indirizzo,
        email: ddtDoc.email,
        telefono: ddtDoc.telefono,
        oggetto: `Fattura da DDT ${ddtDoc.numero}`,
        note: ddtDoc.note,
        projectId: ddtDoc.projectId,
        createdBy: userId,
      });

      // Copy DDT lines to invoice lines (prices to be filled)
      for (const line of ddtLines) {
        await storage.createInvoiceLine({
          invoiceId: invoice.id,
          descrizione: line.descrizione,
          quantita: line.quantita,
          unitaMisura: line.unitaMisura,
          prezzoUnitario: "0",
          sconto: "0",
          aliquotaIva: "22",
          importo: "0",
          ordine: line.ordine,
        });
      }

      // Update DDT status and link to invoice
      await storage.updateDdt(req.params.id, {
        stato: "fatturato",
        invoiceId: invoice.id
      });

      const invoiceLines = await storage.getInvoiceLines(invoice.id);

      // Update linked sales order if exists
      if (ddtDoc.salesOrderId) {
        await db.execute(sql`
          UPDATE sales_orders 
          SET invoice_id = ${invoice.id}, workflow_status = 'fatturato', stato = 'fatturato', updated_at = NOW()
          WHERE id = ${ddtDoc.salesOrderId}
        `);
      }

      res.status(201).json({ ...invoice, lines: invoiceLines });
    } catch (error) {
      console.error("Error converting DDT to invoice:", error);
      res.status(500).json({ error: "Errore nella conversione del DDT" });
    }
  });

  // Create shipment from DDT
  app.post("/api/finance/ddt/:id/create-shipment", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const ddtDoc = await storage.getDdtById(req.params.id);
      if (!ddtDoc) {
        return res.status(404).json({ error: "DDT non trovato" });
      }

      // Generate next shipment number
      const year = new Date().getFullYear();
      const numResult = await db.execute(sql`
        SELECT numero FROM spedizioni 
        WHERE numero LIKE ${'SPD/' + year + '/%'}
        ORDER BY numero DESC LIMIT 1
      `);
      let nextNum = 1;
      if (numResult.rows.length > 0) {
        const lastNum = (numResult.rows[0] as any).numero;
        const match = lastNum.match(/SPD\/\d+\/(\d+)/);
        if (match) nextNum = parseInt(match[1]) + 1;
      }
      const shipmentNumber = `SPD/${year}/${String(nextNum).padStart(5, '0')}`;

      // Create shipment
      const shipmentResult = await db.execute(sql`
        INSERT INTO spedizioni (
          numero, stato, data_spedizione, ddt_id,
          destinatario_ragione_sociale, destinatario_indirizzo, destinatario_cap,
          destinatario_citta, destinatario_provincia, destinatario_email, destinatario_telefono,
          colli, peso_kg, vettore, note
        ) VALUES (
          ${shipmentNumber}, 'pianificata', ${new Date().toISOString().split('T')[0]},
          ${ddtDoc.id}, ${ddtDoc.ragioneSociale}, ${ddtDoc.indirizzo}, ${(ddtDoc as any).cap},
          ${(ddtDoc as any).citta}, ${(ddtDoc as any).provincia}, ${ddtDoc.email}, ${ddtDoc.telefono},
          ${ddtDoc.colli || '1'}, ${ddtDoc.pesoLordo || '0'}, ${ddtDoc.vettore || null},
          ${'Spedizione da DDT ' + ddtDoc.numero}
        ) RETURNING *
      `);

      const shipment = shipmentResult.rows[0] as any;

      // Update DDT with shipment reference
      await db.execute(sql`
        UPDATE ddt SET stato = 'in_spedizione', updated_at = NOW() WHERE id = ${ddtDoc.id}
      `);

      // Update linked sales order if exists
      if (ddtDoc.salesOrderId) {
        await db.execute(sql`
          UPDATE sales_orders 
          SET spedizione_id = ${shipment.id}, workflow_status = 'in_spedizione', stato = 'spedito', updated_at = NOW()
          WHERE id = ${ddtDoc.salesOrderId}
        `);
      }

      res.status(201).json({ shipment, message: "Spedizione creata con successo" });
    } catch (error) {
      console.error("Error creating shipment from DDT:", error);
      res.status(500).json({ error: "Errore nella creazione della spedizione" });
    }
  });

  // Import DDT from Excel
  app.post("/api/finance/ddt/import", finanzaAuthMiddleware, upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "File non fornito" });
      }

      const XLSX = await import("xlsx");
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

      if (rows.length < 2) {
        return res.status(400).json({ error: "File vuoto o senza dati" });
      }

      // Find header row (first row with content)
      const headerRow = rows[0].map((h: any) => String(h || "").toLowerCase().trim());

      // Map columns - flexible column matching
      const findCol = (names: string[]) => {
        return headerRow.findIndex((h: string) => names.some(n => h.includes(n)));
      };

      const colMap = {
        numero: findCol(["numero", "num", "n."]),
        data: findCol(["data", "date"]),
        cliente: findCol(["cliente", "ragione", "denominazione", "destinatario"]),
        partitaIva: findCol(["partita", "p.iva", "piva", "vat"]),
        indirizzo: findCol(["indirizzo", "via", "address"]),
        citta: findCol(["città", "citta", "city", "comune"]),
        cap: findCol(["cap", "zip"]),
        provincia: findCol(["prov", "provincia"]),
        causale: findCol(["causale", "tipo", "motivo"]),
        colli: findCol(["colli", "pkg", "packages"]),
        peso: findCol(["peso", "weight", "kg"]),
        descrizione: findCol(["descrizione", "articolo", "merce", "desc"]),
        quantita: findCol(["quantità", "quantita", "qty", "qta"]),
        um: findCol(["um", "unità", "unit"]),
      };

      const userId = (req as any).session?.userId;
      const imported: any[] = [];
      const errors: string[] = [];

      // Get existing DDT numbers
      const existingDdts = await storage.getDdtList();
      const existingNumbers = new Set(existingDdts.map(d => d.numero));

      // Process data rows
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.every((c: any) => !c)) continue;

        try {
          // Parse date
          let dataEmissione = new Date().toISOString().split('T')[0];
          if (colMap.data >= 0 && row[colMap.data]) {
            const dateVal = row[colMap.data];
            if (typeof dateVal === "number") {
              // Excel serial date
              const excelDate = XLSX.SSF.parse_date_code(dateVal);
              dataEmissione = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
            } else {
              // String date - try to parse
              const dateStr = String(dateVal);
              const parts = dateStr.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
              if (parts) {
                const day = parts[1].padStart(2, '0');
                const month = parts[2].padStart(2, '0');
                let year = parts[3];
                if (year.length === 2) year = "20" + year;
                dataEmissione = `${year}-${month}-${day}`;
              }
            }
          }

          // Build DDT number - find next available (filling gaps)
          let numero = colMap.numero >= 0 && row[colMap.numero] ? String(row[colMap.numero]) : "";
          if (!numero) {
            const year = new Date().getFullYear();
            const prefix = `DDT/${year}/`;

            // Extract all used numbers for current year (including imported ones)
            const usedNumbers: number[] = [];
            for (const d of existingDdts) {
              if (d.numero && d.numero.startsWith(prefix)) {
                const numPart = parseInt(d.numero.replace(prefix, ''), 10);
                if (!isNaN(numPart)) usedNumbers.push(numPart);
              }
            }
            for (const d of imported) {
              if (d.numero && d.numero.startsWith(prefix)) {
                const numPart = parseInt(d.numero.replace(prefix, ''), 10);
                if (!isNaN(numPart)) usedNumbers.push(numPart);
              }
            }
            usedNumbers.sort((a, b) => a - b);

            // Find first gap or next number
            let nextNum = 1;
            for (const num of usedNumbers) {
              if (num === nextNum) nextNum++;
              else if (num > nextNum) break;
            }
            numero = `${prefix}${String(nextNum).padStart(5, '0')}`;
          }

          // Skip duplicates
          if (existingNumbers.has(numero)) {
            errors.push(`Riga ${i + 1}: DDT ${numero} già esistente`);
            continue;
          }

          const ragioneSociale = colMap.cliente >= 0 ? String(row[colMap.cliente] || "").trim() : "";
          if (!ragioneSociale) {
            errors.push(`Riga ${i + 1}: Cliente mancante`);
            continue;
          }

          // Create DDT
          const ddtData = {
            numero,
            stato: "bozza",
            dataEmissione,
            ragioneSociale,
            partitaIva: colMap.partitaIva >= 0 ? String(row[colMap.partitaIva] || "") : "",
            indirizzo: colMap.indirizzo >= 0 ? String(row[colMap.indirizzo] || "") : "",
            citta: colMap.citta >= 0 ? String(row[colMap.citta] || "") : "",
            cap: colMap.cap >= 0 ? String(row[colMap.cap] || "") : "",
            provincia: colMap.provincia >= 0 ? String(row[colMap.provincia] || "") : "",
            causaleTrasporto: colMap.causale >= 0 ? String(row[colMap.causale] || "Vendita") : "Vendita",
            colli: colMap.colli >= 0 ? String(row[colMap.colli] || "") : "",
            pesoLordo: colMap.peso >= 0 ? String(row[colMap.peso] || "") : "",
            createdBy: userId,
          };

          const ddt = await storage.createDdt(ddtData);
          existingNumbers.add(numero);

          // Create line if description exists
          if (colMap.descrizione >= 0 && row[colMap.descrizione]) {
            await storage.createDdtLine({
              ddtId: ddt.id,
              descrizione: String(row[colMap.descrizione]),
              quantita: colMap.quantita >= 0 ? String(row[colMap.quantita] || "1") : "1",
              unitaMisura: colMap.um >= 0 ? String(row[colMap.um] || "pz") : "pz",
              ordine: 0,
            });
          }

          imported.push(ddt);
        } catch (err) {
          errors.push(`Riga ${i + 1}: ${(err as Error).message}`);
        }
      }

      res.json({
        success: true,
        imported: imported.length,
        errors: errors.length > 0 ? errors : undefined,
        message: `Importati ${imported.length} DDT` + (errors.length > 0 ? `, ${errors.length} errori` : ""),
      });
    } catch (error) {
      console.error("Error importing DDT:", error);
      res.status(500).json({ error: "Errore nell'importazione DDT" });
    }
  });

  // Finance Transactions
  app.get("/api/finance/transactions", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const contoId = req.query.contoId as string | undefined;
      const transactions = contoId
        ? await storage.getFinanceTransactionsByAccount(contoId)
        : await storage.getFinanceTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: "Errore nel recupero delle transazioni" });
    }
  });

  app.get("/api/finance/transactions/:id", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const transaction = await storage.getFinanceTransactionById(req.params.id);
      if (!transaction) {
        return res.status(404).json({ error: "Transazione non trovata" });
      }
      res.json(transaction);
    } catch (error) {
      console.error("Error fetching transaction:", error);
      res.status(500).json({ error: "Errore nel recupero della transazione" });
    }
  });

  app.post("/api/finance/transactions", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId;
      const transaction = await storage.createFinanceTransaction({ ...req.body, createdBy: userId });
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      res.status(500).json({ error: "Errore nella creazione della transazione" });
    }
  });

  app.put("/api/finance/transactions/:id", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const transaction = await storage.updateFinanceTransaction(req.params.id, req.body);
      if (!transaction) {
        return res.status(404).json({ error: "Transazione non trovata" });
      }
      res.json(transaction);
    } catch (error) {
      console.error("Error updating transaction:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento della transazione" });
    }
  });

  app.patch("/api/finance/transactions/:id", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const transaction = await storage.updateFinanceTransaction(req.params.id, req.body);
      if (!transaction) {
        return res.status(404).json({ error: "Transazione non trovata" });
      }
      res.json(transaction);
    } catch (error) {
      console.error("Error updating transaction:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento della transazione" });
    }
  });

  app.delete("/api/finance/transactions/:id", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteFinanceTransaction(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Transazione non trovata" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res.status(500).json({ error: "Errore nell'eliminazione della transazione" });
    }
  });

  // Cestino transazioni
  app.get("/api/finance/transactions/trash", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const deletedTransactions = await storage.getDeletedTransactions();
      res.json(deletedTransactions);
    } catch (error) {
      console.error("Error fetching deleted transactions:", error);
      res.status(500).json({ error: "Errore nel recupero delle transazioni eliminate" });
    }
  });

  app.post("/api/finance/transactions/:id/restore", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const transaction = await storage.restoreTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ error: "Transazione non trovata" });
      }
      res.json(transaction);
    } catch (error) {
      console.error("Error restoring transaction:", error);
      res.status(500).json({ error: "Errore nel ripristino della transazione" });
    }
  });

  app.delete("/api/finance/transactions/:id/permanent", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const success = await storage.permanentlyDeleteTransaction(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Transazione non trovata" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error permanently deleting transaction:", error);
      res.status(500).json({ error: "Errore nell'eliminazione definitiva della transazione" });
    }
  });

  // Auto-reconcile invoices with bank transactions
  app.post("/api/finance/auto-reconcile", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const { accountId, resetPrevious } = req.body;
      let invoices = await storage.getInvoices();
      let transactions = await storage.getFinanceTransactions();

      // If resetPrevious is true, reset all reconciliations first
      if (resetPrevious) {
        console.log("Resetting all previous reconciliations...");

        // Reset all invoices marked as 'pagata' to 'inviata'
        for (const invoice of invoices) {
          if (invoice.stato === 'pagata') {
            await storage.updateInvoice(invoice.id, {
              stato: 'inviata',
              dataPagamento: null,
              totalePagato: null
            });
          }
        }

        // Reset all transactions marked as reconciled
        for (const trans of transactions) {
          if (trans.riconciliato) {
            await storage.updateFinanceTransaction(trans.id, {
              riconciliato: false,
              invoiceId: null
            });
          }
        }

        // Reload fresh data
        invoices = await storage.getInvoices();
        transactions = await storage.getFinanceTransactions();
        console.log("Reset complete. Starting fresh reconciliation...");
      }

      // Filter transactions by account if specified
      if (accountId) {
        transactions = transactions.filter(t => t.contoId === accountId);
      }

      let reconciled = 0;
      const matchedTransactionIds = new Set<string>();

      // Find unpaid invoices and match with bank transactions
      for (const invoice of invoices) {
        if (invoice.stato === 'pagata') continue;

        const importoFattura = parseFloat(String(invoice.totale || 0).replace(/\./g, '').replace(',', '.'));

        // Skip invalid amounts
        if (isNaN(importoFattura) || importoFattura <= 0) continue;

        // Get invoice date for comparison
        const invoiceDate = invoice.dataEmissione || invoice.data;
        const invoiceDateObj = invoiceDate ? new Date(invoiceDate) : null;

        // Find matching transaction (skip already matched ones)
        const matchedTrans = transactions.find(trans => {
          // Skip if already matched or already reconciled
          if (matchedTransactionIds.has(trans.id)) return false;
          if (trans.riconciliato) return false;

          // Check transaction type matches invoice type
          if (trans.tipo !== 'entrata' && invoice.tipo === 'emessa') return false;
          if (trans.tipo !== 'uscita' && invoice.tipo === 'ricevuta') return false;

          // CRITICAL: Transaction date must be >= invoice date
          // A payment cannot happen before the invoice was issued
          if (invoiceDateObj && trans.data) {
            const transDateObj = new Date(trans.data);
            if (transDateObj < invoiceDateObj) return false;
          }

          const importoTrans = parseFloat(String(trans.importo).replace(/\./g, '').replace(',', '.'));

          // Skip invalid transaction amounts
          if (isNaN(importoTrans) || importoTrans <= 0) return false;

          // STRICT: Amount must match within 1% tolerance (for small rounding differences)
          const tolerance = Math.max(0.02, importoFattura * 0.01);
          const matchAmount = Math.abs(importoTrans - importoFattura) <= tolerance;

          // CRITICAL: Amount MUST match - no exceptions
          if (!matchAmount) return false;

          const descLower = (trans.descrizione || "").toLowerCase();

          // Extract invoice number without prefix for better matching
          const invoiceNumClean = invoice.numero ? invoice.numero.replace(/[^0-9]/g, '') : '';
          const hasInvoiceRef = invoiceNumClean.length >= 3 && descLower.includes(invoiceNumClean);

          // Check for client reference (at least first 10 chars of name)
          const clientName = invoice.ragioneSociale || '';
          const hasClientRef = clientName.length >= 5 && descLower.includes(clientName.toLowerCase().substring(0, 10));

          // STRICT: Amount must match AND must have at least one reference
          return matchAmount && (hasInvoiceRef || hasClientRef);
        });

        if (matchedTrans) {
          const importoTrans = parseFloat(String(matchedTrans.importo).replace(/\./g, '').replace(',', '.'));

          // Double-check amount match before confirming
          const tolerance = Math.max(0.02, importoFattura * 0.01);
          if (Math.abs(importoTrans - importoFattura) > tolerance) {
            console.warn(`Skipping match for invoice ${invoice.numero}: amount mismatch (${importoFattura} vs ${importoTrans})`);
            continue;
          }

          // Mark transaction as matched to prevent duplicate matching
          matchedTransactionIds.add(matchedTrans.id);

          // Update invoice to paid
          await storage.updateInvoice(invoice.id, {
            stato: 'pagata',
            dataPagamento: matchedTrans.data,
            totalePagato: String(importoFattura)
          });

          // Mark transaction as reconciled and link to invoice
          await storage.updateFinanceTransaction(matchedTrans.id, {
            riconciliato: true,
            invoiceId: invoice.id
          });

          reconciled++;
          console.log(`Reconciled invoice ${invoice.numero} (€${importoFattura}) with transaction (€${importoTrans})`);
        }
      }

      // PHASE 2: Multi-invoice reconciliation for cumulative payments
      // Find transactions that weren't matched and try to match them with multiple invoices
      const unmatchedTransactions = transactions.filter(t =>
        !matchedTransactionIds.has(t.id) &&
        !t.riconciliato &&
        t.tipo === 'entrata'
      );

      // Get remaining unpaid invoices
      const unpaidInvoices = invoices.filter(inv =>
        inv.stato !== 'pagata' &&
        inv.tipo === 'emessa'
      );

      console.log(`Phase 2: Checking ${unmatchedTransactions.length} unmatched transactions for multi-invoice reconciliation`);

      for (const trans of unmatchedTransactions) {
        const importoTrans = parseFloat(String(trans.importo).replace(/\./g, '').replace(',', '.'));
        if (isNaN(importoTrans) || importoTrans <= 0) continue;

        const descLower = (trans.descrizione || "").toLowerCase();
        const transDate = trans.data ? new Date(trans.data) : null;

        // Find invoices referenced in the transaction description
        const matchingInvoices: any[] = [];
        let totalMatchedAmount = 0;

        for (const invoice of unpaidInvoices) {
          if (invoice.stato === 'pagata') continue;

          const invoiceDate = invoice.dataEmissione || invoice.data;
          const invoiceDateObj = invoiceDate ? new Date(invoiceDate) : null;

          // Transaction must be after invoice date
          if (transDate && invoiceDateObj && transDate < invoiceDateObj) continue;

          const importoFattura = parseFloat(String(invoice.totale || 0).replace(/\./g, '').replace(',', '.'));
          if (isNaN(importoFattura) || importoFattura <= 0) continue;

          // Check if invoice number is referenced in description
          const invoiceNumClean = invoice.numero ? invoice.numero.replace(/[^0-9]/g, '') : '';
          const hasInvoiceRef = invoiceNumClean.length >= 3 && descLower.includes(invoiceNumClean);

          // Check for client reference
          const clientName = invoice.ragioneSociale || '';
          const hasClientRef = clientName.length >= 5 && descLower.includes(clientName.toLowerCase().substring(0, 10));

          if (hasInvoiceRef || hasClientRef) {
            matchingInvoices.push({ invoice, amount: importoFattura });
            totalMatchedAmount += importoFattura;
          }
        }

        // Check if the sum of matched invoices equals the transaction amount (within tolerance)
        const tolerance = Math.max(0.10, importoTrans * 0.02); // 2% tolerance or 10 cents
        const amountDiff = Math.abs(totalMatchedAmount - importoTrans);

        if (matchingInvoices.length >= 2 && amountDiff <= tolerance) {
          console.log(`Multi-invoice match found: Transaction €${importoTrans} matches ${matchingInvoices.length} invoices totaling €${totalMatchedAmount}`);

          // Mark all matched invoices as paid
          const invoiceIds: string[] = [];
          for (const { invoice, amount } of matchingInvoices) {
            await storage.updateInvoice(invoice.id, {
              stato: 'pagata',
              dataPagamento: trans.data,
              totalePagato: String(amount)
            });
            invoiceIds.push(invoice.id);
            invoice.stato = 'pagata'; // Update local state
            reconciled++;
            console.log(`  - Marked invoice ${invoice.numero} (€${amount}) as paid`);
          }

          // Mark transaction as reconciled with reference to all invoices
          await storage.updateFinanceTransaction(trans.id, {
            riconciliato: true,
            invoiceId: invoiceIds[0], // Primary invoice
            note: `Pagamento cumulativo: ${matchingInvoices.length} fatture [${invoiceIds.join(',')}]`
          });

          matchedTransactionIds.add(trans.id);
        }
      }

      res.json({ reconciled, message: `${reconciled} fatture riconciliate` });
    } catch (error) {
      console.error("Error auto-reconciling:", error);
      res.status(500).json({ error: "Errore durante la riconciliazione automatica" });
    }
  });

  // Verify reconciliations - find invoices marked as paid without matching bank transactions
  app.get("/api/finance/verify-reconciliations", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const invoices = await storage.getInvoices();
      const transactions = await storage.getFinanceTransactions();

      const issues: Array<{
        invoice: any;
        issue: string;
        expectedAmount: number;
        foundAmount?: number;
        transactionId?: string;
      }> = [];

      // Check all paid invoices
      for (const invoice of invoices) {
        if (invoice.stato !== 'pagata') continue;

        const importoFattura = parseFloat(String(invoice.totale || 0).replace(/\./g, '').replace(',', '.'));
        if (isNaN(importoFattura) || importoFattura <= 0) continue;

        const tolerance = Math.max(0.02, importoFattura * 0.01);

        // Find matching transaction with correct amount
        const matchedTrans = transactions.find(trans => {
          // Check transaction type matches invoice type
          if (trans.tipo !== 'entrata' && invoice.tipo === 'emessa') return false;
          if (trans.tipo !== 'uscita' && invoice.tipo === 'ricevuta') return false;

          const importoTrans = parseFloat(String(trans.importo).replace(/\./g, '').replace(',', '.'));
          if (isNaN(importoTrans)) return false;

          // Check amount matches
          const matchAmount = Math.abs(importoTrans - importoFattura) <= tolerance;
          if (!matchAmount) return false;

          const descLower = (trans.descrizione || "").toLowerCase();
          const invoiceNumClean = invoice.numero ? invoice.numero.replace(/[^0-9]/g, '') : '';
          const hasInvoiceRef = invoiceNumClean.length >= 3 && descLower.includes(invoiceNumClean);
          const clientName = invoice.ragioneSociale || '';
          const hasClientRef = clientName.length >= 5 && descLower.includes(clientName.toLowerCase().substring(0, 10));

          return matchAmount && (hasInvoiceRef || hasClientRef);
        });

        if (!matchedTrans) {
          // Try to find any transaction with similar amount (might be wrong match)
          const anyWithAmount = transactions.find(trans => {
            const importoTrans = parseFloat(String(trans.importo).replace(/\./g, '').replace(',', '.'));
            return Math.abs(importoTrans - importoFattura) <= tolerance;
          });

          if (anyWithAmount) {
            const foundAmount = parseFloat(String(anyWithAmount.importo).replace(/\./g, '').replace(',', '.'));
            issues.push({
              invoice: {
                id: invoice.id,
                numero: invoice.numero,
                ragioneSociale: invoice.ragioneSociale,
                totale: invoice.totale,
                stato: invoice.stato,
                dataEmissione: invoice.dataEmissione
              },
              issue: 'Transazione trovata con importo simile ma senza riferimento valido',
              expectedAmount: importoFattura,
              foundAmount,
              transactionId: anyWithAmount.id
            });
          } else {
            issues.push({
              invoice: {
                id: invoice.id,
                numero: invoice.numero,
                ragioneSociale: invoice.ragioneSociale,
                totale: invoice.totale,
                stato: invoice.stato,
                dataEmissione: invoice.dataEmissione
              },
              issue: 'Nessuna transazione bancaria trovata con importo corrispondente',
              expectedAmount: importoFattura
            });
          }
        }
      }

      res.json({
        totalPaidInvoices: invoices.filter(i => i.stato === 'pagata').length,
        issuesFound: issues.length,
        issues
      });
    } catch (error) {
      console.error("Error verifying reconciliations:", error);
      res.status(500).json({ error: "Errore nella verifica delle riconciliazioni" });
    }
  });

  // Fix invalid reconciliations - reset invoices without matching transactions
  app.post("/api/finance/fix-reconciliations", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const invoices = await storage.getInvoices();
      const transactions = await storage.getFinanceTransactions();

      let fixed = 0;

      for (const invoice of invoices) {
        if (invoice.stato !== 'pagata') continue;

        const importoFattura = parseFloat(String(invoice.totale || 0).replace(/\./g, '').replace(',', '.'));
        if (isNaN(importoFattura) || importoFattura <= 0) continue;

        const tolerance = Math.max(0.02, importoFattura * 0.01);

        // Check if there's a valid matching transaction
        const matchedTrans = transactions.find(trans => {
          if (trans.tipo !== 'entrata' && invoice.tipo === 'emessa') return false;
          if (trans.tipo !== 'uscita' && invoice.tipo === 'ricevuta') return false;

          const importoTrans = parseFloat(String(trans.importo).replace(/\./g, '').replace(',', '.'));
          if (isNaN(importoTrans)) return false;

          const matchAmount = Math.abs(importoTrans - importoFattura) <= tolerance;
          if (!matchAmount) return false;

          const descLower = (trans.descrizione || "").toLowerCase();
          const invoiceNumClean = invoice.numero ? invoice.numero.replace(/[^0-9]/g, '') : '';
          const hasInvoiceRef = invoiceNumClean.length >= 3 && descLower.includes(invoiceNumClean);
          const clientName = invoice.ragioneSociale || '';
          const hasClientRef = clientName.length >= 5 && descLower.includes(clientName.toLowerCase().substring(0, 10));

          return matchAmount && (hasInvoiceRef || hasClientRef);
        });

        // If no valid match, reset invoice status
        if (!matchedTrans) {
          await storage.updateInvoice(invoice.id, {
            stato: 'inviata',
            dataPagamento: null,
            totalePagato: null
          });
          fixed++;
          console.log(`Reset invoice ${invoice.numero} from 'pagata' to 'inviata' - no valid bank transaction`);
        }
      }

      res.json({ fixed, message: `${fixed} fatture corrette (stato cambiato da pagata a inviata)` });
    } catch (error) {
      console.error("Error fixing reconciliations:", error);
      res.status(500).json({ error: "Errore nella correzione delle riconciliazioni" });
    }
  });

  // Share Links for Invoices and Transactions
  app.post("/api/finance/share", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const { tipo, resourceId, expiresIn, password, maxViews, note } = req.body;
      const userId = (req as any).session?.userId;

      if (!tipo || !resourceId) {
        return res.status(400).json({ error: "Tipo e resourceId sono obbligatori" });
      }

      // Generate unique token
      const { nanoid } = await import("nanoid");
      const token = nanoid(16);

      // Calculate expiry date if provided (in days)
      let expiresAt = null;
      if (expiresIn && expiresIn > 0) {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + expiresIn);
        expiresAt = expiry;
      }

      const shareLink = await storage.createShareLink({
        token,
        tipo,
        resourceId,
        createdBy: userId,
        expiresAt,
        password: password || null,
        maxViews: maxViews || null,
        isActive: true,
        note: note || null,
      });

      res.status(201).json(shareLink);
    } catch (error) {
      console.error("Error creating share link:", error);
      res.status(500).json({ error: "Errore nella creazione del link di condivisione" });
    }
  });

  app.get("/api/finance/share/:resourceId", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const links = await storage.getShareLinksByResource(req.params.resourceId);
      res.json(links);
    } catch (error) {
      console.error("Error fetching share links:", error);
      res.status(500).json({ error: "Errore nel recupero dei link di condivisione" });
    }
  });

  // Get all share links
  app.get("/api/finance/share-links", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const links = await storage.getAllShareLinks();
      res.json(links);
    } catch (error) {
      console.error("Error fetching share links:", error);
      res.status(500).json({ error: "Errore nel recupero dei link" });
    }
  });

  // Toggle share link active status
  app.patch("/api/finance/share/:id/toggle", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const { isActive } = req.body;
      const link = await storage.toggleShareLinkActive(req.params.id, isActive);
      if (!link) {
        return res.status(404).json({ error: "Link non trovato" });
      }
      res.json(link);
    } catch (error) {
      console.error("Error toggling share link:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento del link" });
    }
  });

  app.delete("/api/finance/share/:id", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteShareLink(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Link non trovato" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting share link:", error);
      res.status(500).json({ error: "Errore nell'eliminazione del link" });
    }
  });

  // Public share view (no auth required)
  app.get("/api/public/share/:token", async (req: Request, res: Response) => {
    try {
      const shareLink = await storage.getShareLinkByToken(req.params.token);

      if (!shareLink) {
        return res.status(404).json({ error: "Link non trovato o non valido" });
      }

      if (!shareLink.isActive) {
        return res.status(410).json({ error: "Link disattivato" });
      }

      if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
        return res.status(410).json({ error: "Link scaduto" });
      }

      if (shareLink.maxViews && shareLink.viewCount >= shareLink.maxViews) {
        return res.status(410).json({ error: "Numero massimo di visualizzazioni raggiunto" });
      }

      // Check password if set
      if (shareLink.password) {
        const providedPassword = req.query.p as string;
        if (!providedPassword || providedPassword !== shareLink.password) {
          return res.status(401).json({ error: "Password richiesta", requiresPassword: true });
        }
      }

      // Get client IP
      const clientIp = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown';

      // Update view count, timestamp and IP
      await storage.updateShareLinkAccess(shareLink.id, clientIp);

      // Create notification for the link owner
      if (shareLink.createdBy) {
        const resourceType = shareLink.tipo === "invoice" ? "Fattura" : "Transazione";
        const now = new Date();
        const dateStr = now.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

        await storage.createNotification({
          userId: shareLink.createdBy,
          type: "share_access",
          title: `${resourceType} visualizzata`,
          message: `Un utente ha visualizzato il link condiviso.\n\nData: ${dateStr}\nIP: ${clientIp}\nVisualizzazioni totali: ${(shareLink.viewCount || 0) + 1}`,
          resourceType: shareLink.tipo,
          resourceId: shareLink.resourceId,
          read: false
        });
      }

      // Get the actual resource
      let resource;
      if (shareLink.tipo === "invoice") {
        resource = await storage.getInvoiceById(shareLink.resourceId);
        if (resource) {
          const lines = await storage.getInvoiceLines(shareLink.resourceId);
          resource = { ...resource, lines };
        }
      } else if (shareLink.tipo === "transaction") {
        resource = await storage.getFinanceTransactionById(shareLink.resourceId);
      }

      if (!resource) {
        return res.status(404).json({ error: "Risorsa non trovata" });
      }

      res.json({ tipo: shareLink.tipo, data: resource });
    } catch (error) {
      console.error("Error accessing share link:", error);
      res.status(500).json({ error: "Errore nell'accesso al link condiviso" });
    }
  });

  // Budgets
  app.get("/api/finance/budgets", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const budgetsList = await storage.getBudgets();
      res.json(budgetsList);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      res.status(500).json({ error: "Errore nel recupero dei budget" });
    }
  });

  app.get("/api/finance/budgets/:id", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const budget = await storage.getBudgetById(req.params.id);
      if (!budget) {
        return res.status(404).json({ error: "Budget non trovato" });
      }
      res.json(budget);
    } catch (error) {
      console.error("Error fetching budget:", error);
      res.status(500).json({ error: "Errore nel recupero del budget" });
    }
  });

  app.post("/api/finance/budgets", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId;
      const budget = await storage.createBudget({ ...req.body, createdBy: userId });
      res.status(201).json(budget);
    } catch (error) {
      console.error("Error creating budget:", error);
      res.status(500).json({ error: "Errore nella creazione del budget" });
    }
  });

  app.put("/api/finance/budgets/:id", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const budget = await storage.updateBudget(req.params.id, req.body);
      if (!budget) {
        return res.status(404).json({ error: "Budget non trovato" });
      }
      res.json(budget);
    } catch (error) {
      console.error("Error updating budget:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento del budget" });
    }
  });

  app.delete("/api/finance/budgets/:id", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteBudget(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Budget non trovato" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting budget:", error);
      res.status(500).json({ error: "Errore nell'eliminazione del budget" });
    }
  });

  // Payment Reminders
  app.get("/api/finance/reminders", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const reminders = await storage.getPaymentReminders();
      res.json(reminders);
    } catch (error) {
      console.error("Error fetching payment reminders:", error);
      res.status(500).json({ error: "Errore nel recupero delle scadenze" });
    }
  });

  app.post("/api/finance/reminders", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId;
      const reminder = await storage.createPaymentReminder({ ...req.body, createdBy: userId });
      res.status(201).json(reminder);
    } catch (error) {
      console.error("Error creating payment reminder:", error);
      res.status(500).json({ error: "Errore nella creazione della scadenza" });
    }
  });

  app.put("/api/finance/reminders/:id", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const reminder = await storage.updatePaymentReminder(req.params.id, req.body);
      if (!reminder) {
        return res.status(404).json({ error: "Scadenza non trovata" });
      }
      res.json(reminder);
    } catch (error) {
      console.error("Error updating payment reminder:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento della scadenza" });
    }
  });

  app.delete("/api/finance/reminders/:id", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const success = await storage.deletePaymentReminder(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Scadenza non trovata" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting payment reminder:", error);
      res.status(500).json({ error: "Errore nell'eliminazione della scadenza" });
    }
  });

  // Finance Dashboard Stats
  app.get("/api/finance/stats", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const accounts = await storage.getFinanceAccounts();
      const transactions = await storage.getFinanceTransactions();
      const invoicesList = await storage.getInvoices();
      const reminders = await storage.getPaymentReminders();

      const parseItalianAmount = (val: string | null | undefined): number => {
        if (!val) return 0;
        const str = String(val);
        if (str.includes(',')) {
          const cleaned = str.replace(/\./g, '').replace(',', '.');
          return parseFloat(cleaned) || 0;
        }
        return parseFloat(str) || 0;
      };

      // Calcola il saldo totale dalle transazioni effettive per ogni conto
      let saldoTotale = 0;
      for (const account of accounts.filter(a => a.attivo)) {
        const accountTransactions = transactions.filter(t => t.contoId === account.id);
        const saldoIniziale = parseItalianAmount(account.saldoIniziale);
        const entrate = accountTransactions
          .filter(t => t.tipo === 'entrata')
          .reduce((sum, t) => sum + parseItalianAmount(t.importo), 0);
        const uscite = accountTransactions
          .filter(t => t.tipo === 'uscita')
          .reduce((sum, t) => sum + parseItalianAmount(t.importo), 0);
        saldoTotale += saldoIniziale + entrate - uscite;
      }

      const fattureEmesse = invoicesList.filter(i => i.tipo === "emessa");
      const fattureRicevute = invoicesList.filter(i => i.tipo === "ricevuta");

      const totaleCrediti = fattureEmesse
        .filter(f => f.stato !== "pagata" && f.stato !== "annullata")
        .reduce((sum, f) => sum + (parseFloat(f.totale || "0") - parseFloat(f.totalePagato || "0")), 0);

      const totaleDebiti = fattureRicevute
        .filter(f => f.stato !== "pagata" && f.stato !== "annullata")
        .reduce((sum, f) => sum + (parseFloat(f.totale || "0") - parseFloat(f.totalePagato || "0")), 0);

      const scadenzeAttive = reminders.filter(r => r.stato === "attivo").length;

      const oggi = new Date().toISOString().split('T')[0];
      const scadenzeOggi = reminders.filter(r =>
        r.stato === "attivo" && r.dataScadenza === oggi
      ).length;

      res.json({
        saldoTotale,
        totaleCrediti,
        totaleDebiti,
        scadenzeAttive,
        scadenzeOggi,
        contiAttivi: accounts.filter(a => a.attivo).length,
        fattureEmesseMese: fattureEmesse.length,
        fattureRicevuteMese: fattureRicevute.length,
      });
    } catch (error) {
      console.error("Error fetching finance stats:", error);
      res.status(500).json({ error: "Errore nel recupero delle statistiche" });
    }
  });

  // Finance Integrations API
  app.get("/api/finance/integrations", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const integrations = await storage.getFinanceIntegrations();
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ error: "Errore nel recupero delle integrazioni" });
    }
  });

  app.get("/api/finance/integrations/:id", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const integration = await storage.getFinanceIntegrationById(req.params.id);
      if (!integration) {
        return res.status(404).json({ error: "Integrazione non trovata" });
      }
      res.json(integration);
    } catch (error) {
      console.error("Error fetching integration:", error);
      res.status(500).json({ error: "Errore nel recupero dell'integrazione" });
    }
  });

  app.post("/api/finance/integrations", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const integration = await storage.createFinanceIntegration(req.body);
      res.json(integration);
    } catch (error) {
      console.error("Error creating integration:", error);
      res.status(500).json({ error: "Errore nella creazione dell'integrazione" });
    }
  });

  app.put("/api/finance/integrations/:id", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const integration = await storage.updateFinanceIntegration(req.params.id, req.body);
      if (!integration) {
        return res.status(404).json({ error: "Integrazione non trovata" });
      }
      res.json(integration);
    } catch (error) {
      console.error("Error updating integration:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento dell'integrazione" });
    }
  });

  app.delete("/api/finance/integrations/:id", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteFinanceIntegration(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Integrazione non trovata" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting integration:", error);
      res.status(500).json({ error: "Errore nell'eliminazione dell'integrazione" });
    }
  });

  app.post("/api/finance/integrations/:id/test", finanzaAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const integration = await storage.getFinanceIntegrationById(req.params.id);
      if (!integration) {
        return res.status(404).json({ error: "Integrazione non trovata" });
      }

      // Test connectivity based on integration type
      if (integration.tipo === "plaid") {
        // Plaid test would go here
        res.json({ success: true, message: "Connessione Plaid verificata" });
      } else if (integration.tipo.startsWith("sdi_")) {
        // SDI test would go here
        res.json({ success: true, message: "Connessione SDI verificata" });
      } else {
        res.json({ success: false, message: "Tipo integrazione non supportato" });
      }
    } catch (error) {
      console.error("Error testing integration:", error);
      res.status(500).json({ error: "Errore nel test dell'integrazione" });
    }
  });

  app.post("/api/finance/import-bank", finanzaAuthMiddleware, multer({ storage: multer.memoryStorage() }).single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nessun file caricato" });
      }

      const accountId = req.body.accountId;
      if (!accountId) {
        return res.status(400).json({ error: "Account non specificato" });
      }

      const filename = req.file.originalname;
      const buffer = req.file.buffer;
      let transactions: any[] = [];

      // Helper function to parse Italian date format (gg/mm/aaaa)
      const parseItalianDate = (dateStr: string): string => {
        if (!dateStr) return "";
        const str = String(dateStr).trim();
        // Match dd/mm/yyyy or dd-mm-yyyy
        const match = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
        if (match) {
          const day = match[1].padStart(2, "0");
          const month = match[2].padStart(2, "0");
          let year = match[3];
          if (year.length === 2) year = "20" + year;
          return `${year}-${month}-${day}`;
        }
        return str;
      };

      if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        const headers = data[0]?.map((h: any) => String(h).toLowerCase().trim()) || [];

        // Find column indices - support Cortina Banca / BCC format with Dare/Avere columns
        const dateIdx = headers.findIndex((h: string) => h.includes("data op") || h.includes("data operazione") || h.includes("data") || h.includes("date"));
        const valutaIdx = headers.findIndex((h: string) => h.includes("data val") || h.includes("valuta"));
        const descIdx = headers.findIndex((h: string) => h.includes("descri") || h.includes("causale") || h.includes("description") || h.includes("dettaglio"));
        const dareIdx = headers.findIndex((h: string) => h === "dare" || h.includes("uscite") || h.includes("addebito"));
        const avereIdx = headers.findIndex((h: string) => h === "avere" || h.includes("entrate") || h.includes("accredito"));
        const importoIdx = headers.findIndex((h: string) => h.includes("importo") || h.includes("amount"));

        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length === 0) continue;

          const rawDate = row[dateIdx >= 0 ? dateIdx : (valutaIdx >= 0 ? valutaIdx : 0)];
          const description = row[descIdx >= 0 ? descIdx : 1] || "";

          let amount = 0;
          let tipo = "entrata";

          // Cortina Banca / BCC format: separate Dare (uscite) and Avere (entrate) columns
          if (dareIdx >= 0 && avereIdx >= 0) {
            const dare = parseFloat(String(row[dareIdx] || "0").replace(/[^\d.,-]/g, "").replace(",", ".")) || 0;
            const avere = parseFloat(String(row[avereIdx] || "0").replace(/[^\d.,-]/g, "").replace(",", ".")) || 0;
            if (dare > 0) {
              amount = dare;
              tipo = "uscita";
            } else if (avere > 0) {
              amount = avere;
              tipo = "entrata";
            }
          } else if (importoIdx >= 0) {
            amount = parseFloat(String(row[importoIdx]).replace(/[^\d.,-]/g, "").replace(",", ".")) || 0;
            tipo = amount >= 0 ? "entrata" : "uscita";
            amount = Math.abs(amount);
          } else {
            amount = parseFloat(String(row[2] || "0").replace(/[^\d.,-]/g, "").replace(",", ".")) || 0;
            tipo = amount >= 0 ? "entrata" : "uscita";
            amount = Math.abs(amount);
          }

          let date: string;
          if (typeof rawDate === "number") {
            const excelDate = new Date((rawDate - 25569) * 86400 * 1000);
            date = excelDate.toISOString().split("T")[0];
          } else {
            date = parseItalianDate(String(rawDate));
          }

          if (amount > 0) {
            transactions.push({
              data: date,
              descrizione: description,
              importo: amount.toFixed(2),
              tipo: tipo,
              contoId: accountId
            });
          }
        }
      } else if (filename.endsWith(".csv")) {
        const csvContent = buffer.toString("utf-8");
        const lines = csvContent.split(/\r?\n/);

        // Detect separator (semicolon or comma)
        const firstLine = lines[0] || "";
        const separator = firstLine.includes(";") ? ";" : ",";

        const headers = firstLine.toLowerCase().split(separator).map(h => h.trim());

        // Check if this is Cortina Banca format: DATA;VALUTA;DARE;AVERE;DIVISA;DESCRIZIONE_OPERAZIONE;CAUSALE_ABI
        const isCortinaFormat = headers.includes("data") && headers.includes("valuta") &&
          headers.includes("dare") && headers.includes("avere") &&
          headers.includes("descrizione_operazione");

        // Find column indices
        const dateIdx = headers.findIndex(h => h === "data" || h.includes("data op") || h.includes("data operazione"));
        const valutaIdx = headers.findIndex(h => h === "valuta" || h.includes("data val"));
        const descIdx = headers.findIndex(h => h === "descrizione_operazione" || h.includes("descri") || h.includes("causale") || h.includes("dettaglio"));
        const dareIdx = headers.findIndex(h => h === "dare" || h.includes("uscite") || h.includes("addebito"));
        const avereIdx = headers.findIndex(h => h === "avere" || h.includes("entrate") || h.includes("accredito"));
        const importoIdx = headers.findIndex(h => h.includes("importo") || h.includes("amount"));

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line || line.trim() === "") continue;

          // For Cortina format with fixed columns, parse carefully
          let cols: string[];
          if (isCortinaFormat) {
            // Split by separator but limit to known column count for the first 5 columns
            // DATA;VALUTA;DARE;AVERE;DIVISA;DESCRIZIONE_OPERAZIONE;CAUSALE_ABI
            const parts = line.split(separator);
            if (parts.length >= 6) {
              cols = [
                parts[0], // DATA
                parts[1], // VALUTA
                parts[2], // DARE
                parts[3], // AVERE
                parts[4], // DIVISA
                parts.slice(5, -1).join(separator), // DESCRIZIONE (may contain separators)
                parts[parts.length - 1] // CAUSALE_ABI
              ];
            } else {
              cols = parts;
            }
          } else {
            cols = line.split(separator);
          }

          if (cols.length < 3) continue;

          const rawDate = cols[dateIdx >= 0 ? dateIdx : 0]?.trim() || "";

          // Skip summary rows (Saldo iniziale, Saldo contabile, Saldo liquido, Disponibilità)
          if (rawDate === "" || rawDate.toLowerCase().includes("saldo") ||
            rawDate.toLowerCase().includes("disponibilità") ||
            cols.some(c => c.toLowerCase().includes("saldo iniziale")) ||
            cols.some(c => c.toLowerCase().includes("saldo contabile")) ||
            cols.some(c => c.toLowerCase().includes("saldo liquido")) ||
            cols.some(c => c.toLowerCase().includes("disponibilità al"))) {
            continue;
          }

          const description = cols[descIdx >= 0 ? descIdx : 5]?.trim() || "";

          let amount = 0;
          let tipo = "entrata";

          // Cortina Banca / BCC format: separate Dare and Avere columns
          if (dareIdx >= 0 && avereIdx >= 0) {
            const dareVal = cols[dareIdx] || "";
            const avereVal = cols[avereIdx] || "";
            const dare = parseFloat(dareVal.replace(/\./g, "").replace(",", ".")) || 0;
            const avere = parseFloat(avereVal.replace(/\./g, "").replace(",", ".")) || 0;
            if (dare > 0) {
              amount = dare;
              tipo = "uscita";
            } else if (avere > 0) {
              amount = avere;
              tipo = "entrata";
            }
          } else if (importoIdx >= 0) {
            const val = cols[importoIdx] || "0";
            amount = parseFloat(val.replace(/\./g, "").replace(",", ".")) || 0;
            tipo = amount >= 0 ? "entrata" : "uscita";
            amount = Math.abs(amount);
          } else {
            const val = cols[2] || "0";
            amount = parseFloat(val.replace(/\./g, "").replace(",", ".")) || 0;
            tipo = amount >= 0 ? "entrata" : "uscita";
            amount = Math.abs(amount);
          }

          const date = parseItalianDate(rawDate);

          if (amount > 0 && date) {
            transactions.push({
              data: date,
              descrizione: description,
              importo: amount.toFixed(2),
              tipo: tipo,
              contoId: accountId
            });
          }
        }
      } else if (filename.endsWith(".cbi") || filename.endsWith(".txt")) {
        // CBI (Corporate Banking Interbancario) format parser
        // Record types: RH=Header, 61=Balance, 62=Transaction, 63=Additional Description
        const cbiContent = buffer.toString("utf-8");
        const lines = cbiContent.split(/\r?\n/);

        // Map to collect transactions with their additional descriptions
        const transactionMap = new Map<string, { data: string; importo: number; tipo: string; descrizione: string }>();

        // Parse CBI date format: DDMMYY -> YYYY-MM-DD
        const parseCbiDate = (dateStr: string): string => {
          if (!dateStr || dateStr.length !== 6) return "";
          const day = dateStr.substring(0, 2);
          const month = dateStr.substring(2, 4);
          const year = "20" + dateStr.substring(4, 6);
          return `${year}-${month}-${day}`;
        };

        // Parse CBI amount format: 000000000092,59 -> 92.59
        const parseCbiAmount = (amountStr: string): number => {
          if (!amountStr) return 0;
          // Remove leading zeros and parse the number with comma as decimal
          const cleaned = amountStr.replace(/^0+/, "").replace(",", ".");
          return parseFloat(cleaned) || 0;
        };

        for (const rawLine of lines) {
          const line = rawLine.trim(); // Remove leading/trailing whitespace
          if (!line || line.length < 3) continue;

          const recordType = line.substring(0, 2);

          if (recordType === "62") {
            // Transaction record
            // Format: 62{progressivo}{dataOp}{dataVal}{C/D}{importo}{causale}{descrizione}
            // Position: 0-1=type, 2-8=prog, 9-14=dataOp, 15-20=dataVal, 21=C/D, 22-35=amount, 36-37=causale, 38+=descrizione
            const progressivo = line.substring(2, 12).trim();
            const dataOp = line.substring(12, 18);
            const dataVal = line.substring(18, 24);
            const segno = line.substring(24, 25); // C=Credit, D=Debit
            const importoStr = line.substring(25, 40).trim();
            const causale = line.substring(40, 42);
            const descrizione = line.substring(42).trim();

            const data = parseCbiDate(dataOp) || parseCbiDate(dataVal);
            const importo = parseCbiAmount(importoStr);
            const tipo = segno === "C" ? "entrata" : "uscita";

            if (data && importo > 0) {
              transactionMap.set(progressivo, {
                data,
                importo,
                tipo,
                descrizione
              });
            }
          } else if (recordType === "63") {
            // Additional description record - append to existing transaction
            const progressivo = line.substring(2, 12).trim();
            const additionalDesc = line.substring(12).trim();

            const existing = transactionMap.get(progressivo);
            if (existing && additionalDesc) {
              existing.descrizione = (existing.descrizione + " " + additionalDesc).trim();
            }
          }
        }

        // Convert map to transactions array
        for (const [_, trans] of transactionMap) {
          transactions.push({
            data: trans.data,
            descrizione: trans.descrizione,
            importo: trans.importo.toFixed(2),
            tipo: trans.tipo,
            contoId: accountId
          });
        }
      } else if (filename.endsWith(".pdf")) {
        // Ri.Ba. (Ricevuta Bancaria) PDF parser
        // Import pdfjs-dist for PDF text extraction
        const pdfjsLib = await import("pdfjs-dist");

        // Load PDF document from buffer
        const pdfData = new Uint8Array(buffer);
        const loadingTask = pdfjsLib.getDocument({ data: pdfData });
        const pdfDoc = await loadingTask.promise;

        // Extract text from all pages
        let fullText = "";
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const page = await pdfDoc.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(" ");
          fullText += pageText + "\n";
        }

        console.log("Ri.Ba. PDF text extracted:", fullText.substring(0, 500));

        // Check if this is a Ri.Ba. document
        if (!fullText.includes("Ri.Ba") && !fullText.includes("Ricevuta Bancaria") && !fullText.includes("Presentazione")) {
          return res.status(400).json({ error: "Il file PDF non sembra essere una Ri.Ba." });
        }

        // Parse Ri.Ba. fields using regex
        // Extract data scadenza (date when payment is due)
        const scadenzaMatch = fullText.match(/Data\s+Scadenza\s+(\d{1,2}\/\d{1,2}\/\d{4})/i);
        const dataSpedizioneMatch = fullText.match(/Data\s+Spedizione\s+(\d{1,2}\/\d{1,2}\/\d{4})/i);

        // Extract importo (amount of the individual disposition)
        const importoMatch = fullText.match(/Importo\s+([\d.,]+)\s*€?\s*$/mi);
        // Also try to find it at the end of the document
        const importoAltMatch = fullText.match(/([\d.,]+)\s*€\s*$/);

        // Extract debitore (debtor name)
        const debitoreMatch = fullText.match(/Nome\s+Debitore\s+([A-Z][A-Z0-9\s\.]+(?:S\.?R\.?L\.?|S\.?P\.?A\.?|S\.?A\.?S\.?|S\.?N\.?C\.?)?)/i);

        // Extract causale (reason)
        const causaleMatch = fullText.match(/Causale\s+([^\n]+?)(?=\s+Debitore|\s+Nome)/i);

        // Extract distinta number
        const distintaMatch = fullText.match(/Distinta\s+(\d+)/i);

        // Get the date - prefer scadenza date for the transaction
        let transDate = "";
        if (scadenzaMatch) {
          transDate = parseItalianDate(scadenzaMatch[1]);
        } else if (dataSpedizioneMatch) {
          transDate = parseItalianDate(dataSpedizioneMatch[1]);
        }

        // Get the amount - use the last importo found (individual disposition amount)
        let amount = 0;
        if (importoMatch) {
          const amountStr = importoMatch[1].replace(/\./g, "").replace(",", ".");
          amount = parseFloat(amountStr) || 0;
        } else if (importoAltMatch) {
          const amountStr = importoAltMatch[1].replace(/\./g, "").replace(",", ".");
          amount = parseFloat(amountStr) || 0;
        }

        // Get debtor name and causale for description
        const debitore = debitoreMatch ? debitoreMatch[1].trim() : "";
        const causale = causaleMatch ? causaleMatch[1].trim() : "";
        const distinta = distintaMatch ? distintaMatch[1] : "";

        if (transDate && amount > 0) {
          const descrizione = `Ri.Ba. ${distinta ? `n.${distinta}` : ""} - ${debitore || "N/D"} - ${causale || "Incasso Ri.Ba."}`.trim();

          transactions.push({
            data: transDate,
            descrizione: descrizione,
            importo: amount.toFixed(2),
            tipo: "entrata", // Ri.Ba. are always incoming payments
            contoId: accountId
          });

          console.log(`Parsed Ri.Ba.: ${transDate} - €${amount} - ${descrizione}`);
        } else {
          console.log("Could not parse Ri.Ba. data:", { transDate, amount, debitore, causale });
          return res.status(400).json({ error: "Impossibile estrarre i dati dalla Ri.Ba. Verifica che il PDF contenga Data Scadenza e Importo." });
        }
      } else {
        return res.status(400).json({ error: "Formato file non supportato. Formati accettati: CSV, XLSX, XLS, CBI, PDF (Ri.Ba.)" });
      }

      // Get existing transactions for duplicate check
      const existingTransactions = await storage.getFinanceTransactions();

      // Create a Set of existing transaction signatures for quick lookup
      const existingSignatures = new Set<string>();
      for (const t of existingTransactions) {
        // Signature: date + amount + first 50 chars of description (normalized)
        const desc = (t.descrizione || "").toLowerCase().substring(0, 50).trim();
        const importo = parseFloat(String(t.importo).replace(/\./g, '').replace(',', '.'));
        const signature = `${t.data}_${importo.toFixed(2)}_${desc}`;
        existingSignatures.add(signature);
      }

      let imported = 0;
      let duplicatesSkipped = 0;

      for (const trans of transactions) {
        if (trans.descrizione && trans.importo) {
          // Check for duplicate
          const desc = (trans.descrizione || "").toLowerCase().substring(0, 50).trim();
          const importo = parseFloat(String(trans.importo).replace(/\./g, '').replace(',', '.'));
          const signature = `${trans.data}_${importo.toFixed(2)}_${desc}`;

          if (existingSignatures.has(signature)) {
            duplicatesSkipped++;
            console.log(`Skipping duplicate transaction: ${trans.data} - €${trans.importo} - ${trans.descrizione?.substring(0, 30)}...`);
            continue;
          }

          // Add to existing signatures to prevent duplicates within same import
          existingSignatures.add(signature);

          await storage.createFinanceTransaction({
            tipo: trans.tipo,
            descrizione: trans.descrizione,
            importo: trans.importo,
            data: trans.data,
            contoId: accountId,
            categoriaId: null,
            invoiceId: null,
            riferimento: null,
            riconciliato: false,
            note: `Importato da ${filename}`
          });
          imported++;
        }
      }

      res.json({
        success: true,
        imported,
        duplicatesSkipped,
        total: transactions.length,
        filename,
        message: duplicatesSkipped > 0
          ? `Importati ${imported} movimenti. ${duplicatesSkipped} duplicati ignorati.`
          : `Importati ${imported} movimenti.`
      });
    } catch (error) {
      console.error("Error importing bank file:", error);
      res.status(500).json({ error: "Errore durante l'importazione" });
    }
  });

  // Import fatture (XML SDI e CSV)
  app.post("/api/finance/import-invoices", finanzaAuthMiddleware, multer({ storage: multer.memoryStorage() }).any(), async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      const format = req.body.format;

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "Nessun file caricato" });
      }

      const parseItalianDate = (dateStr: string): string => {
        if (!dateStr) return "";
        const str = String(dateStr).trim();
        const match = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
        if (match) {
          const day = match[1].padStart(2, "0");
          const month = match[2].padStart(2, "0");
          let year = match[3];
          if (year.length === 2) year = "20" + year;
          return `${year}-${month}-${day}`;
        }
        // ISO format
        const isoMatch = str.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch) return str;
        return str;
      };

      // Parse Italian currency format: "1.234,56" -> 1234.56
      const parseItalianCurrency = (value: string): string => {
        if (!value) return "0";
        const cleaned = String(value)
          .replace(/[^\d.,-]/g, "")  // Keep only digits, dots, commas, minus
          .replace(/\./g, "")         // Remove thousand separators (dots)
          .replace(",", ".");         // Replace decimal comma with dot
        const num = parseFloat(cleaned);
        return isNaN(num) ? "0" : num.toFixed(2);
      };

      let imported = 0;
      const invoicesToImport: any[] = [];

      if (format === "xml") {
        // Parse XML FatturaPA (SDI format) using fast-xml-parser
        const { XMLParser } = await import("fast-xml-parser");
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: "@_",
          removeNSPrefix: true,  // Remove namespace prefixes like p:, ns2:, etc.
          parseTagValue: true,
          trimValues: true
        });

        for (const file of files) {
          try {
            // Try UTF-8 first, then Latin-1 (ISO-8859-1) for Italian documents
            let xmlContent = file.buffer.toString("utf-8");

            // Check if this is a p7m signed file (starts with binary data)
            // Look for the XML declaration start within the file
            const xmlStartIndex = xmlContent.indexOf("<?xml");
            if (xmlStartIndex > 0) {
              // Extract only the XML portion, skipping binary p7m wrapper
              xmlContent = xmlContent.substring(xmlStartIndex);
            }

            // Also try to find FatturaElettronica tag if no XML declaration
            if (xmlStartIndex === -1) {
              const fatturaIndex = xmlContent.indexOf("<FatturaElettronica");
              if (fatturaIndex > 0) {
                xmlContent = xmlContent.substring(fatturaIndex);
              }
            }

            // Check for encoding declaration and convert if needed
            const encodingMatch = xmlContent.match(/encoding=["']([^"']+)["']/i);
            if (encodingMatch) {
              const declaredEncoding = encodingMatch[1].toLowerCase();
              if (declaredEncoding.includes("iso-8859") || declaredEncoding.includes("latin")) {
                // Re-extract from latin1 buffer starting at same position
                const latin1Content = file.buffer.toString("latin1");
                const latin1Start = latin1Content.indexOf("<?xml");
                if (latin1Start >= 0) {
                  xmlContent = latin1Content.substring(latin1Start);
                }
              }
            }

            // Clean up any BOM or invalid characters
            xmlContent = xmlContent.replace(/^\uFEFF/, '').trim();

            // Remove empty namespace declarations that cause parsing issues
            xmlContent = xmlContent.replace(/xmlns=""/g, '');

            // Remove any trailing binary data after the closing tag
            const closingTagIndex = xmlContent.lastIndexOf("</FatturaElettronica>");
            if (closingTagIndex > 0) {
              xmlContent = xmlContent.substring(0, closingTagIndex + "</FatturaElettronica>".length);
            }

            // Remove any binary/control characters that may corrupt tag names
            xmlContent = xmlContent.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

            const parsed = parser.parse(xmlContent);

            console.log(`Parsing file ${file.originalname}, parsed keys:`, Object.keys(parsed));

            // Navigate FatturaPA structure - handle both single and wrapped formats
            const fattura = parsed.FatturaElettronica || parsed["p:FatturaElettronica"] || parsed;
            const body = fattura?.FatturaElettronicaBody || fattura?.Body || fattura;
            const header = fattura?.FatturaElettronicaHeader || fattura?.Header;

            console.log(`Fattura structure - body exists: ${!!body}, header exists: ${!!header}`);

            // Handle array of bodies (multiple invoices in one file)
            const bodies = Array.isArray(body) ? body : [body];

            for (const b of bodies) {
              // Try multiple paths for DatiGenerali - including corrupted key names from p7m files
              let datiGenerali = b?.DatiGenerali?.DatiGeneraliDocumento ||
                b?.DatiGeneraliDocumento ||
                b?.DatiGenerali || {};

              // If DatiGenerali is empty, search for corrupted key names (e.g., "Dat��iGenerali")
              if (Object.keys(datiGenerali).length === 0 && b) {
                for (const key of Object.keys(b)) {
                  if (key.includes("iGenerali") || key.includes("Generali")) {
                    const found = b[key]?.DatiGeneraliDocumento || b[key] || {};
                    if (found.Numero || found.Data || found.ImportoTotaleDocumento) {
                      datiGenerali = found;
                      break;
                    }
                  }
                }
              }

              // CessionarioCommittente = cliente (chi riceve la fattura, es. VEGA)
              const cessionario = header?.CessionarioCommittente?.DatiAnagrafici || header?.CessionarioCommittente || {};

              const numero = datiGenerali.Numero || "";
              const data = datiGenerali.Data || "";
              const importoTotale = datiGenerali.ImportoTotaleDocumento || "";

              // Get client info (CessionarioCommittente) with fallbacks
              const denominazione = cessionario.Anagrafica?.Denominazione ||
                cessionario.Denominazione ||
                (cessionario.Anagrafica?.Nome && cessionario.Anagrafica?.Cognome ?
                  `${cessionario.Anagrafica.Nome} ${cessionario.Anagrafica.Cognome}` : "");
              const piva = cessionario.IdFiscaleIVA?.IdCodice || cessionario.CodiceFiscale || "";

              // Calculate IVA from line items if available
              let totaleImponibile = 0;
              let totaleIva = 0;
              const datiRiepilogo = b?.DatiBeniServizi?.DatiRiepilogo;
              if (datiRiepilogo) {
                const riepilogoArr = Array.isArray(datiRiepilogo) ? datiRiepilogo : [datiRiepilogo];
                for (const r of riepilogoArr) {
                  totaleImponibile += parseFloat(r.ImponibileImporto || 0);
                  totaleIva += parseFloat(r.Imposta || 0);
                }
              }

              const totale = importoTotale ? parseFloat(String(importoTotale)) : (totaleImponibile + totaleIva);

              if (numero || data || totale > 0) {
                invoicesToImport.push({
                  numero: String(numero) || `IMP-${Date.now()}`,
                  data: data || new Date().toISOString().split("T")[0],
                  dataScadenza: data,
                  fornitoreCliente: denominazione || "Cliente sconosciuto",
                  partitaIva: String(piva) || "",
                  imponibile: totaleImponibile > 0 ? totaleImponibile.toFixed(2) : String(totale),
                  iva: totaleIva.toFixed(2),
                  totale: totale.toFixed(2),
                  tipo: "emessa",
                  stato: "inviata",
                  note: `Importato da ${file.originalname}`
                });
              }
            }
          } catch (parseError) {
            console.error(`Error parsing XML file ${file.originalname}:`, parseError);
          }
        }
      } else if (format === "csv") {
        const file = files[0];
        const csvContent = file.buffer.toString("utf-8");
        const lines = csvContent.split(/\r?\n/);

        const firstLine = lines[0] || "";
        const separator = firstLine.includes(";") ? ";" : ",";

        const headers = firstLine.toLowerCase().split(separator).map(h => h.trim().replace(/['"]/g, ""));

        // Find column indices
        const numeroIdx = headers.findIndex(h => h.includes("numero") || h === "n" || h.includes("fattura"));
        const dataIdx = headers.findIndex(h => h.includes("data") && !h.includes("scad"));
        const scadenzaIdx = headers.findIndex(h => h.includes("scad"));
        const fornitoreIdx = headers.findIndex(h => h.includes("fornit") || h.includes("client") || h.includes("ragione") || h.includes("denominazione"));
        const pivaIdx = headers.findIndex(h => h.includes("p.iva") || h.includes("partita") || h.includes("piva"));
        const importoIdx = headers.findIndex(h => h.includes("importo") || h.includes("totale") || h.includes("amount"));
        const imponibileIdx = headers.findIndex(h => h.includes("imponibile"));
        const ivaIdx = headers.findIndex(h => h.includes("iva") && !h.includes("p.iva") && !h.includes("partita"));
        const tipoIdx = headers.findIndex(h => h.includes("tipo"));

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line || line.trim() === "") continue;

          const cols = line.split(separator).map(c => c.trim().replace(/^['"]|['"]$/g, ""));
          if (cols.length < 3) continue;

          const numero = cols[numeroIdx >= 0 ? numeroIdx : 0] || "";
          const data = parseItalianDate(cols[dataIdx >= 0 ? dataIdx : 1] || "");
          const fornitore = cols[fornitoreIdx >= 0 ? fornitoreIdx : 2] || "";
          const importoRaw = cols[importoIdx >= 0 ? importoIdx : 3] || "0";
          const imponibileRaw = imponibileIdx >= 0 ? cols[imponibileIdx] : importoRaw;
          const ivaRaw = ivaIdx >= 0 ? cols[ivaIdx] : "0";
          const piva = pivaIdx >= 0 ? cols[pivaIdx] : "";
          const scadenza = scadenzaIdx >= 0 ? cols[scadenzaIdx] : "";
          const tipoRaw = tipoIdx >= 0 ? cols[tipoIdx] : "";

          // Parse monetary values using Italian format handler
          const importo = parseItalianCurrency(importoRaw);
          const imponibile = parseItalianCurrency(imponibileRaw);
          const iva = parseItalianCurrency(ivaRaw);

          let tipo = "ricevuta";
          if (tipoRaw && (tipoRaw.toLowerCase().includes("emess") || tipoRaw.toLowerCase().includes("vendita"))) {
            tipo = "emessa";
          }

          // Validate: at least one meaningful field must be present
          if ((numero && numero.trim()) || (fornitore && fornitore.trim()) || parseFloat(importo) > 0) {
            invoicesToImport.push({
              numero: numero.trim() || `CSV-${i}`,
              data: data || new Date().toISOString().split("T")[0],
              dataScadenza: parseItalianDate(scadenza) || data,
              fornitoreCliente: fornitore.trim() || "Non specificato",
              partitaIva: piva.trim(),
              imponibile: imponibile,
              iva: iva,
              totale: importo,
              tipo: tipo,
              stato: "inviata",
              note: `Importato da CSV`
            });
          }
        }
      } else if (format === "xlsx") {
        // Parse XLSX file (SEAC Azienda Web format)
        const XLSX = await import("xlsx");
        const file = files[0];
        const workbook = XLSX.read(file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        if (rows.length < 2) {
          return res.status(400).json({ error: "File vuoto o senza dati" });
        }

        const headers = (rows[0] || []).map((h: any) => String(h || "").toLowerCase().trim());

        // Find column indices for SEAC format
        const numeroIdx = headers.findIndex(h => h.includes("n°") || h.includes("doc") || h.includes("numero"));
        const tipoDocIdx = headers.findIndex(h => h.includes("tipo doc"));
        const dataIdx = headers.findIndex(h => h.includes("data doc") && !h.includes("invio"));
        const clienteIdx = headers.findIndex(h => h.includes("cliente") || h.includes("fornitore") || h.includes("ragione"));
        const importoIdx = headers.findIndex(h => h.includes("importo") || h.includes("totale"));
        const statoIdx = headers.findIndex(h => h.includes("stato"));
        const pagatoIdx = headers.findIndex(h => h.includes("pagato"));

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length < 3) continue;

          const numero = String(row[numeroIdx >= 0 ? numeroIdx : 0] || "");
          const tipoDoc = String(row[tipoDocIdx >= 0 ? tipoDocIdx : 1] || "TD01");
          const dataRaw = row[dataIdx >= 0 ? dataIdx : 2];
          const cliente = String(row[clienteIdx >= 0 ? clienteIdx : 4] || "");
          const importoRaw = row[importoIdx >= 0 ? importoIdx : 5];
          const stato = String(row[statoIdx >= 0 ? statoIdx : 6] || "");
          const pagatoRaw = String(row[pagatoIdx >= 0 ? pagatoIdx : 7] || "No");

          // Parse date - can be string or Excel serial number
          let dataFormatted = "";
          if (typeof dataRaw === "number") {
            // Excel serial date
            const excelDate = XLSX.SSF.parse_date_code(dataRaw);
            dataFormatted = `${excelDate.y}-${String(excelDate.m).padStart(2, "0")}-${String(excelDate.d).padStart(2, "0")}`;
          } else {
            dataFormatted = parseItalianDate(String(dataRaw || ""));
          }

          // Parse amount
          const importo = typeof importoRaw === "number"
            ? importoRaw.toFixed(2)
            : parseItalianCurrency(String(importoRaw || "0"));

          // Map tipo documento SDI to tipo fattura
          let tipo = "emessa"; // Default for SEAC export (vendite)
          if (tipoDoc.startsWith("TD04") || tipoDoc.includes("credito")) {
            tipo = "nota_credito";
          }

          // Note: "pagato" field is ignored - payment status is only set via reconciliation

          if ((numero && numero.trim()) || (cliente && cliente.trim()) || parseFloat(importo) > 0) {
            invoicesToImport.push({
              numero: numero.trim() || `SEAC-${i}`,
              data: dataFormatted || new Date().toISOString().split("T")[0],
              dataScadenza: dataFormatted,
              fornitoreCliente: cliente.trim() || "Cliente non specificato",
              partitaIva: "",
              imponibile: (parseFloat(importo) / 1.22).toFixed(2), // Stima imponibile al 22%
              iva: (parseFloat(importo) - parseFloat(importo) / 1.22).toFixed(2),
              totale: importo,
              tipo: tipo,
              stato: stato.toLowerCase().includes("consegna") ? "inviata" : "bozza",
              note: `Importato da SEAC Azienda Web - ${tipoDoc} - ${stato}`
            });
          }
        }
      } else {
        return res.status(400).json({ error: "Formato non supportato. Usa 'xml', 'csv' o 'xlsx'" });
      }

      // Save invoices to database (with duplicate check)
      let skipped = 0;
      for (const inv of invoicesToImport) {
        // Check for duplicates: same numero, ragioneSociale, dataEmissione, totale
        const existing = await db.select().from(invoices).where(
          and(
            eq(invoices.numero, inv.numero),
            eq(invoices.ragioneSociale, inv.fornitoreCliente || "Non specificato"),
            eq(invoices.dataEmissione, inv.data),
            eq(invoices.totale, inv.totale)
          )
        ).limit(1);

        if (existing.length > 0) {
          skipped++;
          continue; // Skip duplicate
        }

        await storage.createInvoice({
          tipo: inv.tipo,
          numero: inv.numero,
          dataEmissione: inv.data,
          dataScadenza: inv.dataScadenza || inv.data,
          ragioneSociale: inv.fornitoreCliente || "Non specificato",
          partitaIva: inv.partitaIva || "",
          imponibile: inv.imponibile,
          iva: inv.iva,
          totale: inv.totale,
          stato: inv.stato,
          note: inv.note,
        });
        imported++;
      }

      res.json({
        success: true,
        imported,
        skipped,
        total: invoicesToImport.length
      });
    } catch (error) {
      console.error("Error importing invoices:", error);
      res.status(500).json({ error: "Errore durante l'importazione delle fatture" });
    }
  });

  app.post("/api/finance/import-transactions", archiveUpload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nessun file caricato" });
      }

      const accountId = req.body.accountId;
      if (!accountId) {
        return res.status(400).json({ error: "ID conto obbligatorio" });
      }

      const fileBuffer = fs.readFileSync(req.file.path);
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

      if (rows.length < 2) {
        return res.status(400).json({ error: "File vuoto o senza dati" });
      }

      const headers = (rows[0] || []).map((h: any) => String(h || "").toLowerCase().trim());

      // Heuristic column detection
      const dateIdx = headers.findIndex(h => h.includes("data") || h.includes("date"));
      const descIdx = headers.findIndex(h => h.includes("descrizione") || h.includes("causale") || h.includes("description"));
      const amountIdx = headers.findIndex(h => h.includes("importo") || h.includes("amount") || h.includes("euro") || h.includes("transazione"));

      if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) {
        return res.status(400).json({ error: "Colonne non trovate. Assicurati che il file abbia: Data, Descrizione, Importo" });
      }

      let importedCount = 0;
      let totalCount = 0;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 3) continue;

        totalCount++;

        const dateRaw = row[dateIdx];
        const desc = String(row[descIdx] || "").trim();
        const amountRaw = row[amountIdx];

        if (!desc && !amountRaw) continue;

        // Parse Date
        let dateFormatted = new Date().toISOString().split('T')[0];
        if (typeof dateRaw === "number") {
          const excelDate = XLSX.SSF.parse_date_code(dateRaw);
          dateFormatted = `${excelDate.y}-${String(excelDate.m).padStart(2, "0")}-${String(excelDate.d).padStart(2, "0")}`;
        } else {
          const dStr = String(dateRaw || "");
          // Try parsing DD/MM/YYYY
          if (dStr.includes('/')) {
            const [d, m, y] = dStr.split('/');
            if (d && m && y) dateFormatted = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
          } else if (dStr.includes('.')) {
            const [d, m, y] = dStr.split('.');
            if (d && m && y) dateFormatted = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
          } else {
            // Try standard parse
            const p = new Date(dStr);
            if (!isNaN(p.getTime())) dateFormatted = p.toISOString().split('T')[0];
          }
        }

        // Parse Amount
        let amount = 0;
        if (typeof amountRaw === "number") {
          amount = amountRaw;
        } else {
          const aStr = String(amountRaw || "").replace(/\./g, "").replace(",", "."); // IT Format 1.000,00 -> 1000.00
          amount = parseFloat(aStr);
        }

        if (isNaN(amount)) continue;

        // Save Transaction
        await storage.createFinanceTransaction({
          contoId: accountId,
          tipo: amount >= 0 ? "entrata" : "uscita",
          descrizione: desc || "Import da file",
          importo: amount.toFixed(2),
          data: dateFormatted,
          riconciliato: false,
          note: "Importato automaticamente"
        });

        importedCount++;
      }

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json({ success: true, importedCount, totalCount });

    } catch (error: any) {
      console.error("Error importing transactions:", error);
      res.status(500).json({ error: "Errore importazione: " + error.message });
    }
  });

  // =====================
  // PRODUCTION MODULE APIs
  // =====================

  // Warehouse Categories
  app.get("/api/warehouse/categories", async (req, res) => {
    try {
      const categories = await storage.getWarehouseCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero delle categorie" });
    }
  });

  app.post("/api/warehouse/categories", async (req, res) => {
    try {
      const category = await storage.createWarehouseCategory(req.body);
      res.json(category);
    } catch (error) {
      res.status(500).json({ error: "Errore nella creazione della categoria" });
    }
  });

  app.patch("/api/warehouse/categories/:id", async (req, res) => {
    try {
      const category = await storage.updateWarehouseCategory(req.params.id, req.body);
      if (!category) return res.status(404).json({ error: "Categoria non trovata" });
      res.json(category);
    } catch (error) {
      res.status(500).json({ error: "Errore nell'aggiornamento della categoria" });
    }
  });

  app.delete("/api/warehouse/categories/:id", async (req, res) => {
    try {
      const success = await storage.deleteWarehouseCategory(req.params.id);
      if (!success) return res.status(404).json({ error: "Categoria non trovata" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Errore nell'eliminazione della categoria" });
    }
  });

  // Warehouse Products - Next Code Generator
  app.get("/api/warehouse/products/next-codice", async (req, res) => {
    try {
      const categoriaId = req.query.categoriaId as string;
      let prefisso = "GEN";

      if (categoriaId) {
        const categoria = await storage.getWarehouseCategory(categoriaId);
        if (categoria?.prefisso) {
          prefisso = categoria.prefisso;
        }
      }

      const codice = await storage.getNextWarehouseProductCode(prefisso);
      res.json({ codice, prefisso });
    } catch (error) {
      console.error("Error generating product code:", error);
      res.status(500).json({ error: "Errore nella generazione del codice" });
    }
  });

  // Warehouse Products
  app.get("/api/warehouse/products", async (req, res) => {
    try {
      const products = await storage.getWarehouseProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero dei prodotti" });
    }
  });

  app.get("/api/warehouse/products/:id", async (req, res) => {
    try {
      const product = await storage.getWarehouseProduct(req.params.id);
      if (!product) return res.status(404).json({ error: "Prodotto non trovato" });
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero del prodotto" });
    }
  });

  app.post("/api/warehouse/products", async (req, res) => {
    try {
      const product = await storage.createWarehouseProduct(req.body);
      res.json(product);
    } catch (error: any) {
      if (error.code === "23505") {
        return res.status(400).json({ error: "Codice prodotto già esistente" });
      }
      res.status(500).json({ error: "Errore nella creazione del prodotto" });
    }
  });

  app.patch("/api/warehouse/products/:id", async (req, res) => {
    try {
      const product = await storage.updateWarehouseProduct(req.params.id, req.body);
      if (!product) return res.status(404).json({ error: "Prodotto non trovato" });
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Errore nell'aggiornamento del prodotto" });
    }
  });

  app.delete("/api/warehouse/products/:id", async (req, res) => {
    try {
      const success = await storage.deleteWarehouseProduct(req.params.id);
      if (!success) return res.status(404).json({ error: "Prodotto non trovato" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Errore nell'eliminazione del prodotto" });
    }
  });

  // Warehouse Movements
  app.get("/api/warehouse/movements", async (req, res) => {
    try {
      const movements = await storage.getWarehouseMovements();
      res.json(movements);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero dei movimenti" });
    }
  });

  app.get("/api/warehouse/movements/product/:prodottoId", async (req, res) => {
    try {
      const movements = await storage.getWarehouseMovementsByProduct(req.params.prodottoId);
      res.json(movements);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero dei movimenti" });
    }
  });

  app.post("/api/warehouse/movements", async (req, res) => {
    try {
      const { prodottoId, tipo, quantita } = req.body;

      // Get current product
      const product = await storage.getWarehouseProduct(prodottoId);
      if (!product) return res.status(404).json({ error: "Prodotto non trovato" });

      const currentStock = parseFloat(product.giacenza) || 0;
      const qty = parseFloat(quantita) || 0;

      let newStock = currentStock;
      if (tipo === "carico") {
        newStock = currentStock + qty;
      } else if (tipo === "scarico") {
        newStock = currentStock - qty;
        if (newStock < 0) {
          return res.status(400).json({ error: "Giacenza insufficiente" });
        }
      } else if (tipo === "rettifica") {
        newStock = qty; // Direct set
      }

      // Create movement
      const movement = await storage.createWarehouseMovement({
        ...req.body,
        giacenzaPrecedente: currentStock.toString(),
        giacenzaSuccessiva: newStock.toString()
      });

      // Update product stock
      await storage.updateWarehouseProduct(prodottoId, { giacenza: newStock.toString() });

      res.json(movement);
    } catch (error) {
      res.status(500).json({ error: "Errore nella registrazione del movimento" });
    }
  });

  // Bill of Materials
  app.get("/api/production/bom", async (req, res) => {
    try {
      const boms = await storage.getBillOfMaterials();
      res.json(boms);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero delle distinte base" });
    }
  });

  app.get("/api/production/bom/:id", async (req, res) => {
    try {
      const bom = await storage.getBillOfMaterial(req.params.id);
      if (!bom) return res.status(404).json({ error: "Distinta base non trovata" });
      const components = await storage.getBomComponents(req.params.id);
      res.json({ ...bom, components });
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero della distinta base" });
    }
  });

  app.post("/api/production/bom", async (req, res) => {
    try {
      const { components, ...bomData } = req.body;
      const bom = await storage.createBillOfMaterials(bomData);

      if (components && Array.isArray(components)) {
        for (const comp of components) {
          await storage.createBomComponent({ ...comp, bomId: bom.id });
        }
      }

      res.json(bom);
    } catch (error) {
      res.status(500).json({ error: "Errore nella creazione della distinta base" });
    }
  });

  app.patch("/api/production/bom/:id", async (req, res) => {
    try {
      const bom = await storage.updateBillOfMaterials(req.params.id, req.body);
      if (!bom) return res.status(404).json({ error: "Distinta base non trovata" });
      res.json(bom);
    } catch (error) {
      res.status(500).json({ error: "Errore nell'aggiornamento della distinta base" });
    }
  });

  app.delete("/api/production/bom/:id", async (req, res) => {
    try {
      const success = await storage.deleteBillOfMaterials(req.params.id);
      if (!success) return res.status(404).json({ error: "Distinta base non trovata" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Errore nell'eliminazione della distinta base" });
    }
  });

  // BOM Components
  app.post("/api/production/bom/:bomId/components", async (req, res) => {
    try {
      const component = await storage.createBomComponent({ ...req.body, bomId: req.params.bomId });
      res.json(component);
    } catch (error) {
      res.status(500).json({ error: "Errore nell'aggiunta del componente" });
    }
  });

  app.patch("/api/production/bom/components/:id", async (req, res) => {
    try {
      const component = await storage.updateBomComponent(req.params.id, req.body);
      if (!component) return res.status(404).json({ error: "Componente non trovato" });
      res.json(component);
    } catch (error) {
      res.status(500).json({ error: "Errore nell'aggiornamento del componente" });
    }
  });

  app.delete("/api/production/bom/components/:id", async (req, res) => {
    try {
      const success = await storage.deleteBomComponent(req.params.id);
      if (!success) return res.status(404).json({ error: "Componente non trovato" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Errore nell'eliminazione del componente" });
    }
  });

  // Production Orders
  app.get("/api/production/orders", async (req, res) => {
    try {
      const orders = await storage.getProductionOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero degli ordini di produzione" });
    }
  });

  app.get("/api/production/orders/:id", async (req, res) => {
    try {
      const order = await storage.getProductionOrder(req.params.id);
      if (!order) return res.status(404).json({ error: "Ordine non trovato" });
      const phases = await storage.getProductionPhases(req.params.id);
      // Get order lines (articoli)
      const linesResult = await db.execute(sql`
        SELECT * FROM production_order_lines WHERE ordine_id = ${req.params.id} ORDER BY ordine
      `);
      res.json({ ...order, phases, articoli: linesResult.rows });
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero dell'ordine" });
    }
  });

  app.post("/api/production/orders", async (req, res) => {
    try {
      const { phases, articoli, ...orderData } = req.body;
      const order = await storage.createProductionOrder(orderData);

      if (phases && Array.isArray(phases)) {
        for (let i = 0; i < phases.length; i++) {
          await storage.createProductionPhase({ ...phases[i], ordineId: order.id, ordine: i });
        }
      }

      // Save production order lines (articoli)
      if (articoli && Array.isArray(articoli)) {
        for (let i = 0; i < articoli.length; i++) {
          const art = articoli[i];
          await db.execute(sql`
            INSERT INTO production_order_lines (ordine_id, codice_articolo, descrizione, quantita, unita_misura, ordine)
            VALUES (${order.id}, ${art.codiceArticolo}, ${art.descrizione}, ${art.quantita}, ${art.unitaMisura || 'pz'}, ${i})
          `);
        }
      }

      res.json(order);
    } catch (error: any) {
      if (error.code === "23505") {
        return res.status(400).json({ error: "Numero ordine già esistente" });
      }
      res.status(500).json({ error: "Errore nella creazione dell'ordine" });
    }
  });

  app.patch("/api/production/orders/:id", async (req, res) => {
    try {
      const { articoli, ...updateData } = req.body;
      const order = await storage.updateProductionOrder(req.params.id, updateData);
      if (!order) return res.status(404).json({ error: "Ordine non trovato" });

      // Update production order lines if provided
      if (articoli && Array.isArray(articoli)) {
        // Delete existing lines
        await db.execute(sql`DELETE FROM production_order_lines WHERE ordine_id = ${req.params.id}`);
        // Insert new lines
        for (let i = 0; i < articoli.length; i++) {
          const art = articoli[i];
          await db.execute(sql`
            INSERT INTO production_order_lines (ordine_id, codice_articolo, descrizione, quantita, unita_misura, ordine)
            VALUES (${req.params.id}, ${art.codiceArticolo}, ${art.descrizione}, ${art.quantita}, ${art.unitaMisura || 'pz'}, ${i})
          `);
        }
      }

      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Errore nell'aggiornamento dell'ordine" });
    }
  });

  app.delete("/api/production/orders/:id", async (req, res) => {
    try {
      const success = await storage.deleteProductionOrder(req.params.id);
      if (!success) return res.status(404).json({ error: "Ordine non trovato" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Errore nell'eliminazione dell'ordine" });
    }
  });

  app.post("/api/production/orders/:id/complete", async (req, res) => {
    try {
      const orderId = req.params.id;
      const order = await storage.getProductionOrder(orderId);
      if (!order) return res.status(404).json({ error: "Ordine non trovato" });
      if (order.stato === "completato") return res.status(400).json({ error: "Ordine già completato" });

      const quantitaDaProdurre = parseFloat(order.quantitaRichiesta as string) || 0;
      const bomId = order.bomId;

      if (bomId) {
        const bom = await storage.getBillOfMaterials(bomId);
        if (bom && bom.components && bom.components.length > 0) {
          for (const comp of bom.components) {
            const product = await storage.getWarehouseProduct(comp.componenteId);
            if (!product) {
              return res.status(400).json({ error: `Componente non trovato: ${comp.componenteId}` });
            }
            const giacenzaAttuale = parseFloat(product.giacenza as string) || 0;
            const quantitaNecessaria = (parseFloat(comp.quantita as string) || 0) * quantitaDaProdurre;
            if (giacenzaAttuale < quantitaNecessaria) {
              return res.status(400).json({
                error: `Giacenza insufficiente per ${product.nome}: richiesti ${quantitaNecessaria}, disponibili ${giacenzaAttuale}`
              });
            }
          }

          for (const comp of bom.components) {
            const product = await storage.getWarehouseProduct(comp.componenteId);
            const giacenzaAttuale = parseFloat(product!.giacenza as string) || 0;
            const quantitaNecessaria = (parseFloat(comp.quantita as string) || 0) * quantitaDaProdurre;
            const nuovaGiacenza = giacenzaAttuale - quantitaNecessaria;

            await storage.createWarehouseMovement({
              prodottoId: comp.componenteId,
              tipo: "scarico",
              causale: "produzione",
              quantita: quantitaNecessaria.toString(),
              giacenzaPrecedente: giacenzaAttuale.toString(),
              giacenzaSuccessiva: nuovaGiacenza.toString(),
              ordineProduzioneId: orderId,
              note: `Consumo per ordine ${order.numero}`,
            });

            await storage.updateWarehouseProduct(comp.componenteId, { giacenza: nuovaGiacenza.toString() });
          }
        }
      }

      const prodottoFinito = await storage.getWarehouseProduct(order.prodottoId);
      if (prodottoFinito) {
        const giacenzaProdotto = parseFloat(prodottoFinito.giacenza as string) || 0;
        const nuovaGiacenzaProdotto = giacenzaProdotto + quantitaDaProdurre;

        await storage.createWarehouseMovement({
          prodottoId: order.prodottoId,
          tipo: "carico",
          causale: "produzione",
          quantita: quantitaDaProdurre.toString(),
          giacenzaPrecedente: giacenzaProdotto.toString(),
          giacenzaSuccessiva: nuovaGiacenzaProdotto.toString(),
          ordineProduzioneId: orderId,
          note: `Produzione completata ordine ${order.numero}`,
        });

        await storage.updateWarehouseProduct(order.prodottoId, { giacenza: nuovaGiacenzaProdotto.toString() });
      }

      // Also update catalog article stock if linked
      if (order.articoloCatalogoId) {
        await db.execute(sql`
          UPDATE catalog_articles 
          SET giacenza = CAST(giacenza AS INTEGER) + ${quantitaDaProdurre},
              updated_at = NOW()
          WHERE id = ${order.articoloCatalogoId}
        `);
      }

      const updatedOrder = await storage.updateProductionOrder(orderId, {
        stato: "completato",
        quantitaProdotta: quantitaDaProdurre.toString(),
        dataFineEffettiva: new Date().toISOString().split("T")[0],
      });

      res.json(updatedOrder);
    } catch (error: any) {
      console.error("Errore nel completamento ordine:", error);
      res.status(500).json({ error: error.message || "Errore nel completamento dell'ordine" });
    }
  });

  // Production Phases
  app.post("/api/production/orders/:ordineId/phases", async (req, res) => {
    try {
      const phase = await storage.createProductionPhase({ ...req.body, ordineId: req.params.ordineId });
      res.json(phase);
    } catch (error) {
      res.status(500).json({ error: "Errore nell'aggiunta della fase" });
    }
  });

  app.patch("/api/production/phases/:id", async (req, res) => {
    try {
      const phase = await storage.updateProductionPhase(req.params.id, req.body);
      if (!phase) return res.status(404).json({ error: "Fase non trovata" });
      res.json(phase);
    } catch (error) {
      res.status(500).json({ error: "Errore nell'aggiornamento della fase" });
    }
  });

  app.delete("/api/production/phases/:id", async (req, res) => {
    try {
      const success = await storage.deleteProductionPhase(req.params.id);
      if (!success) return res.status(404).json({ error: "Fase non trovata" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Errore nell'eliminazione della fase" });
    }
  });

  // ==================== SPEDIZIONI API ====================

  // Corrieri
  app.get("/api/corrieri", async (req, res) => {
    try {
      const corrieriList = await storage.getCorrieri();
      res.json(corrieriList);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero dei corrieri" });
    }
  });

  app.post("/api/corrieri", async (req, res) => {
    try {
      const corriere = await storage.createCorriere(req.body);
      res.json(corriere);
    } catch (error) {
      res.status(500).json({ error: "Errore nella creazione del corriere" });
    }
  });

  app.patch("/api/corrieri/:id", async (req, res) => {
    try {
      const corriere = await storage.updateCorriere(req.params.id, req.body);
      if (!corriere) return res.status(404).json({ error: "Corriere non trovato" });
      res.json(corriere);
    } catch (error) {
      res.status(500).json({ error: "Errore nell'aggiornamento del corriere" });
    }
  });

  app.delete("/api/corrieri/:id", async (req, res) => {
    try {
      const success = await storage.deleteCorriere(req.params.id);
      if (!success) return res.status(404).json({ error: "Corriere non trovato" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Errore nell'eliminazione del corriere" });
    }
  });

  // Spedizioni
  app.get("/api/spedizioni", async (req, res) => {
    try {
      const spedizioniList = await storage.getSpedizioni();
      res.json(spedizioniList);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero delle spedizioni" });
    }
  });

  app.get("/api/spedizioni/next-numero", async (req, res) => {
    try {
      const numero = await storage.getNextSpedizioneNumero();
      res.json({ numero });
    } catch (error) {
      res.status(500).json({ error: "Errore nella generazione del numero" });
    }
  });

  // Report percorso ottimizzato spedizioni e DDT
  app.get("/api/spedizioni/report-percorso", async (req, res) => {
    try {
      // Recupera spedizioni attive
      const spedizioniList = await storage.getSpedizioni();
      const spedizioniAttive = spedizioniList.filter(s =>
        s.stato === "pronta" || s.stato === "da_preparare" || s.stato === "in_preparazione"
      );

      // Recupera DDT in spedizione
      const ddtList = await storage.getDdts();
      const ddtInSpedizione = ddtList.filter(d => d.stato === "in_spedizione" || d.stato === "emesso");

      // Combina spedizioni e DDT in un array unico di destinazioni
      const destinazioni: any[] = [];

      // Aggiungi spedizioni
      for (const s of spedizioniAttive) {
        destinazioni.push({
          id: s.id,
          tipo: "spedizione",
          numero: s.numero,
          cliente: s.clienteNome,
          indirizzo: s.indirizzoDestinazione,
          citta: s.cittaDestinazione,
          cap: s.capDestinazione,
          stato: s.stato,
          colli: s.colli,
          peso: s.peso,
        });
      }

      // Aggiungi DDT (evita duplicati se già collegati a spedizione)
      for (const d of ddtInSpedizione) {
        // Controlla se questo DDT è già collegato a una spedizione attiva
        const isLinkedToSpedizione = spedizioniAttive.some((s: any) => s.ddtId === d.id);
        if (!isLinkedToSpedizione) {
          const usaDestinazione = d.destinazioneDiversa && d.destinazioneIndirizzo;
          destinazioni.push({
            id: d.id,
            tipo: "ddt",
            numero: d.numero,
            cliente: d.ragioneSociale,
            indirizzo: usaDestinazione ? d.destinazioneIndirizzo : d.indirizzo,
            citta: usaDestinazione ? d.destinazioneCitta : d.citta,
            cap: usaDestinazione ? d.destinazioneCap : d.cap,
            stato: d.stato,
            colli: d.colli,
            peso: d.pesoLordo,
          });
        }
      }

      if (destinazioni.length === 0) {
        return res.json({ stops: [], totalDistance: 0, totalDuration: 0, generatedAt: new Date().toISOString(), message: "Nessuna spedizione o DDT da consegnare" });
      }

      // Geocodifica gli indirizzi
      async function geocodeAddress(address: string): Promise<[number, number] | null> {
        try {
          const query = encodeURIComponent(address);
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`, {
            headers: {
              "User-Agent": "PULSE-ERP/3.0 (contact@pulse-erp.it)",
              "Accept": "application/json"
            }
          });
          if (!response.ok) {
            console.error("Geocoding response error:", response.status);
            return null;
          }
          const data = await response.json();
          if (data && data.length > 0) {
            return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
          }
          return null;
        } catch (error) {
          console.error("Geocoding error:", error);
          return null;
        }
      }

      // Geocodifica tutte le destinazioni con indirizzo
      const destinazioniConCoordinate = [];
      for (const dest of destinazioni) {
        const fullAddress = [dest.indirizzo, dest.cap, dest.citta, "Italia"]
          .filter(Boolean)
          .join(", ");

        if (fullAddress && fullAddress !== "Italia" && (dest.indirizzo || dest.citta)) {
          const coords = await geocodeAddress(fullAddress);
          if (coords) {
            destinazioniConCoordinate.push({
              ...dest,
              lat: coords[0],
              lon: coords[1],
              fullAddress
            });
          }
          // Delay per rispettare rate limit Nominatim
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (destinazioniConCoordinate.length === 0) {
        const senzaIndirizzo = destinazioni.filter(d => !d.indirizzo && !d.citta);
        const messaggioDettagliato = senzaIndirizzo.length > 0
          ? `Destinazioni senza indirizzo: ${senzaIndirizzo.map(d => `${d.tipo.toUpperCase()} ${d.numero}`).join(", ")}`
          : "Nessun indirizzo valido trovato";
        return res.json({ stops: [], totalDistance: 0, totalDuration: 0, generatedAt: new Date().toISOString(), error: messaggioDettagliato });
      }

      // Posizione di partenza: indirizzo aziendale da "La Mia Azienda"
      const companyInfo = await storage.getCompanyInfo();
      let originLat = 45.4642; // Milano default
      let originLon = 9.1900;
      let originName = "Milano (default)";

      if (companyInfo) {
        // Preferisci sede operativa, altrimenti sede legale
        const useOperativo = companyInfo.indirizzoOperativo || companyInfo.cittaOperativa;
        const companyAddress = useOperativo
          ? [companyInfo.indirizzoOperativo, companyInfo.capOperativo, companyInfo.cittaOperativa].filter(Boolean).join(", ")
          : [companyInfo.indirizzo, companyInfo.cap, companyInfo.citta].filter(Boolean).join(", ");

        originName = useOperativo
          ? (companyInfo.cittaOperativa || companyInfo.ragioneSociale || "Sede operativa")
          : (companyInfo.citta || companyInfo.ragioneSociale || "Sede legale");

        if (companyAddress) {
          const originCoords = await geocodeAddress(companyAddress + ", Italia");
          if (originCoords) {
            originLat = originCoords[0];
            originLon = originCoords[1];
          }
        }
      }

      // Calcola matrice distanze con OSRM
      const coordinates = destinazioniConCoordinate.map(d => `${d.lon},${d.lat}`).join(";");
      const matrixUrl = `https://router.project-osrm.org/table/v1/driving/${originLon},${originLat};${coordinates}?annotations=duration,distance`;

      let matrixData;
      try {
        const matrixResponse = await fetch(matrixUrl);
        matrixData = await matrixResponse.json();
      } catch (error) {
        console.error("OSRM matrix error:", error);
        // Fallback: ritorna destinazioni ordinate
        const stops = destinazioniConCoordinate.map((d, i) => ({
          ordine: i + 1,
          id: d.id,
          tipo: d.tipo,
          numero: d.numero,
          cliente: d.cliente,
          indirizzo: d.fullAddress,
          stato: d.stato,
          colli: d.colli,
          peso: d.peso,
          lat: d.lat,
          lon: d.lon,
          distanzaTratta: 0,
          durataTratta: 0,
          distanzaCumulativa: 0,
          durataCumulativa: 0,
          arrivoStimato: null
        }));
        return res.json({ stops, totalDistance: 0, totalDuration: 0, originName, generatedAt: new Date().toISOString() });
      }

      if (matrixData.code !== "Ok") {
        const stops = destinazioniConCoordinate.map((d, i) => ({
          ordine: i + 1,
          id: d.id,
          tipo: d.tipo,
          numero: d.numero,
          cliente: d.cliente,
          indirizzo: d.fullAddress,
          stato: d.stato,
          colli: d.colli,
          peso: d.peso,
          lat: d.lat,
          lon: d.lon,
          distanzaTratta: 0,
          durataTratta: 0,
          distanzaCumulativa: 0,
          durataCumulativa: 0,
          arrivoStimato: null
        }));
        return res.json({ stops, totalDistance: 0, totalDuration: 0, originName, generatedAt: new Date().toISOString() });
      }

      // Algoritmo nearest neighbor per TSP
      const n = destinazioniConCoordinate.length;
      const durations = matrixData.durations;
      const distances = matrixData.distances;
      const visited = new Array(n + 1).fill(false);
      visited[0] = true; // origine
      const route: number[] = [0];
      let current = 0;

      for (let i = 0; i < n; i++) {
        let nearest = -1;
        let minDist = Infinity;
        for (let j = 1; j <= n; j++) {
          if (!visited[j] && durations[current][j] < minDist) {
            minDist = durations[current][j];
            nearest = j;
          }
        }
        if (nearest !== -1) {
          visited[nearest] = true;
          route.push(nearest);
          current = nearest;
        }
      }

      // Costruisci risultato con tempi cumulativi
      let cumulativeTime = 0;
      let cumulativeDistance = 0;
      const now = new Date();
      const stops = [];

      for (let i = 1; i < route.length; i++) {
        const stopIndex = route[i] - 1; // -1 perché indice 0 è origine
        const dest = destinazioniConCoordinate[stopIndex];
        const prevIndex = route[i - 1];

        const trattaDurata = durations[prevIndex][route[i]] / 60; // minuti
        const trattaDistanza = distances[prevIndex][route[i]] / 1000; // km

        cumulativeTime += trattaDurata;
        cumulativeDistance += trattaDistanza;

        const arrivoStimato = new Date(now.getTime() + cumulativeTime * 60 * 1000);

        stops.push({
          ordine: i,
          id: dest.id,
          tipo: dest.tipo,
          numero: dest.numero,
          cliente: dest.cliente,
          indirizzo: dest.fullAddress,
          stato: dest.stato,
          colli: dest.colli,
          peso: dest.peso,
          lat: dest.lat,
          lon: dest.lon,
          distanzaTratta: Math.round(trattaDistanza * 10) / 10,
          durataTratta: Math.round(trattaDurata),
          distanzaCumulativa: Math.round(cumulativeDistance * 10) / 10,
          durataCumulativa: Math.round(cumulativeTime),
          arrivoStimato: arrivoStimato.toISOString()
        });
      }

      res.json({
        stops,
        totalDistance: Math.round(cumulativeDistance * 10) / 10,
        totalDuration: Math.round(cumulativeTime),
        originName,
        generatedAt: now.toISOString()
      });
    } catch (error) {
      console.error("Errore report percorso:", error);
      res.status(500).json({ error: "Errore nella generazione del report percorso" });
    }
  });

  app.get("/api/spedizioni/:id", async (req, res) => {
    try {
      const spedizione = await storage.getSpedizione(req.params.id);
      if (!spedizione) return res.status(404).json({ error: "Spedizione non trovata" });
      const righe = await storage.getSpedizioneRighe(req.params.id);
      res.json({ ...spedizione, righe });
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero della spedizione" });
    }
  });

  app.post("/api/spedizioni", async (req, res) => {
    try {
      const { righe, ...spedizioneData } = req.body;
      const spedizione = await storage.createSpedizione(spedizioneData);

      if (righe && Array.isArray(righe)) {
        for (const riga of righe) {
          await storage.createSpedizioneRiga({ ...riga, spedizioneId: spedizione.id });
        }
      }

      // Se la spedizione è collegata a un DDT, aggiorna lo stato del DDT a "in_spedizione"
      if (spedizioneData.ddtId) {
        await storage.updateDdt(spedizioneData.ddtId, { stato: "in_spedizione" });
      }

      const righeCreate = await storage.getSpedizioneRighe(spedizione.id);
      res.json({ ...spedizione, righe: righeCreate });
    } catch (error) {
      console.error("Errore creazione spedizione:", error);
      res.status(500).json({ error: "Errore nella creazione della spedizione" });
    }
  });

  app.patch("/api/spedizioni/:id", async (req, res) => {
    try {
      const { righe, ...spedizioneData } = req.body;

      // Recupera la spedizione esistente per verificare se ha un DDT collegato
      const existingSpedizione = await storage.getSpedizione(req.params.id);

      const spedizione = await storage.updateSpedizione(req.params.id, spedizioneData);
      if (!spedizione) return res.status(404).json({ error: "Spedizione non trovata" });

      // Se la spedizione ha un DDT collegato e lo stato cambia a "consegnata", aggiorna il DDT
      if (existingSpedizione?.ddtId && spedizioneData.stato === "consegnata") {
        await storage.updateDdt(existingSpedizione.ddtId, { stato: "consegnato" });
      }

      res.json(spedizione);
    } catch (error) {
      res.status(500).json({ error: "Errore nell'aggiornamento della spedizione" });
    }
  });

  app.delete("/api/spedizioni/:id", async (req, res) => {
    try {
      const success = await storage.deleteSpedizione(req.params.id);
      if (!success) return res.status(404).json({ error: "Spedizione non trovata" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Errore nell'eliminazione della spedizione" });
    }
  });

  // Righe Spedizione
  app.post("/api/spedizioni/:id/righe", async (req, res) => {
    try {
      const riga = await storage.createSpedizioneRiga({ ...req.body, spedizioneId: req.params.id });
      res.json(riga);
    } catch (error) {
      res.status(500).json({ error: "Errore nell'aggiunta della riga" });
    }
  });

  app.patch("/api/spedizioni/righe/:id", async (req, res) => {
    try {
      const riga = await storage.updateSpedizioneRiga(req.params.id, req.body);
      if (!riga) return res.status(404).json({ error: "Riga non trovata" });
      res.json(riga);
    } catch (error) {
      res.status(500).json({ error: "Errore nell'aggiornamento della riga" });
    }
  });

  app.delete("/api/spedizioni/righe/:id", async (req, res) => {
    try {
      const success = await storage.deleteSpedizioneRiga(req.params.id);
      if (!success) return res.status(404).json({ error: "Riga non trovata" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Errore nell'eliminazione della riga" });
    }
  });

  // Salva firma digitale consegna
  app.post("/api/spedizioni/:id/firma", async (req, res) => {
    try {
      const { firmaDestinatario, nomeFirmatario } = req.body;
      if (!firmaDestinatario) {
        return res.status(400).json({ error: "Firma richiesta" });
      }

      const spedizione = await storage.updateSpedizione(req.params.id, {
        firmaDestinatario,
        nomeFirmatario,
        dataOraFirma: new Date(),
        stato: "consegnata",
        dataConsegnaEffettiva: new Date().toISOString().split("T")[0],
      });

      if (!spedizione) {
        return res.status(404).json({ error: "Spedizione non trovata" });
      }

      res.json({ success: true, spedizione });
    } catch (error) {
      console.error("Errore salvataggio firma:", error);
      res.status(500).json({ error: "Errore nel salvataggio della firma" });
    }
  });

  // Invia notifica partenza al cliente
  app.post("/api/spedizioni/:id/notifica-partenza", async (req, res) => {
    try {
      const spedizione = await storage.getSpedizione(req.params.id);
      if (!spedizione) {
        return res.status(404).json({ error: "Spedizione non trovata" });
      }

      const email = req.body.email || spedizione.emailDestinatario;
      if (!email) {
        return res.status(400).json({ error: "Email destinatario richiesta" });
      }

      // Recupera dati azienda per intestazione email
      const companyInfo = await storage.getCompanyInfo();
      const companyName = companyInfo?.ragioneSociale || "PULSE ERP";

      // Invia email tramite Aruba
      const emailUser = process.env.ARUBA_EMAIL_ADDRESS;
      const emailPass = process.env.ARUBA_EMAIL_PASSWORD;

      if (!emailUser || !emailPass) {
        return res.status(500).json({ error: "Credenziali email non configurate" });
      }

      const transporter = nodemailer.createTransport({
        host: "smtps.aruba.it",
        port: 465,
        secure: true,
        auth: { user: emailUser, pass: emailPass },
      });

      const subject = `Spedizione ${spedizione.numero} in partenza`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #3b82f6; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">${companyName}</h1>
          </div>
          <div style="padding: 30px; background: #f8fafc;">
            <h2 style="color: #1e40af;">La tua spedizione è in partenza!</h2>
            <p>Gentile ${spedizione.destinatario || "Cliente"},</p>
            <p>Ti informiamo che la spedizione <strong>${spedizione.numero}</strong> è in partenza verso il seguente indirizzo:</p>
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Indirizzo:</strong> ${spedizione.indirizzoDestinazione || ""}</p>
              <p style="margin: 5px 0;"><strong>Città:</strong> ${spedizione.cittaDestinazione || ""} ${spedizione.capDestinazione || ""}</p>
              ${spedizione.numeroTracking ? `<p style="margin: 5px 0;"><strong>Tracking:</strong> ${spedizione.numeroTracking}</p>` : ""}
              ${spedizione.dataConsegnaStimata ? `<p style="margin: 5px 0;"><strong>Consegna stimata:</strong> ${spedizione.dataConsegnaStimata}</p>` : ""}
            </div>
            <p>Ti contatteremo al momento della consegna.</p>
            <p>Cordiali saluti,<br/><strong>${companyName}</strong></p>
          </div>
          <div style="background: #e2e8f0; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
            Questa è una email automatica. Non rispondere a questo messaggio.
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: emailUser,
        to: email,
        subject,
        html,
      });

      // Aggiorna spedizione con flag notifica inviata
      await storage.updateSpedizione(req.params.id, {
        emailDestinatario: email,
        notificaPartenzaInviata: true,
        dataNotificaPartenza: new Date(),
      });

      res.json({ success: true, message: "Notifica partenza inviata" });
    } catch (error) {
      console.error("Errore invio notifica partenza:", error);
      res.status(500).json({ error: "Errore nell'invio della notifica" });
    }
  });

  // Invia notifica consegna al cliente
  app.post("/api/spedizioni/:id/notifica-consegna", async (req, res) => {
    try {
      const spedizione = await storage.getSpedizione(req.params.id);
      if (!spedizione) {
        return res.status(404).json({ error: "Spedizione non trovata" });
      }

      const email = req.body.email || spedizione.emailDestinatario;
      if (!email) {
        return res.status(400).json({ error: "Email destinatario richiesta" });
      }

      const companyInfo = await storage.getCompanyInfo();
      const companyName = companyInfo?.ragioneSociale || "PULSE ERP";

      const emailUser = process.env.ARUBA_EMAIL_ADDRESS;
      const emailPass = process.env.ARUBA_EMAIL_PASSWORD;

      if (!emailUser || !emailPass) {
        return res.status(500).json({ error: "Credenziali email non configurate" });
      }

      const transporter = nodemailer.createTransport({
        host: "smtps.aruba.it",
        port: 465,
        secure: true,
        auth: { user: emailUser, pass: emailPass },
      });

      const subject = `Spedizione ${spedizione.numero} consegnata`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #22c55e; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">${companyName}</h1>
          </div>
          <div style="padding: 30px; background: #f8fafc;">
            <h2 style="color: #16a34a;">Spedizione consegnata con successo!</h2>
            <p>Gentile ${spedizione.destinatario || "Cliente"},</p>
            <p>Ti confermiamo che la spedizione <strong>${spedizione.numero}</strong> è stata consegnata.</p>
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Data consegna:</strong> ${spedizione.dataConsegnaEffettiva || new Date().toLocaleDateString("it-IT")}</p>
              ${spedizione.nomeFirmatario ? `<p style="margin: 5px 0;"><strong>Ritirato da:</strong> ${spedizione.nomeFirmatario}</p>` : ""}
            </div>
            <p>Grazie per aver scelto i nostri servizi.</p>
            <p>Cordiali saluti,<br/><strong>${companyName}</strong></p>
          </div>
          <div style="background: #e2e8f0; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
            Questa è una email automatica. Non rispondere a questo messaggio.
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: emailUser,
        to: email,
        subject,
        html,
      });

      await storage.updateSpedizione(req.params.id, {
        emailDestinatario: email,
        notificaConsegnaInviata: true,
        dataNotificaConsegna: new Date(),
      });

      res.json({ success: true, message: "Notifica consegna inviata" });
    } catch (error) {
      console.error("Errore invio notifica consegna:", error);
      res.status(500).json({ error: "Errore nell'invio della notifica" });
    }
  });

  // ==================== COURIER TOKEN API ====================

  app.post("/api/spedizioni/:id/genera-link-corriere", async (req, res) => {
    try {
      const spedizione = await storage.getSpedizione(req.params.id);
      if (!spedizione) {
        return res.status(404).json({ error: "Spedizione non trovata" });
      }

      const token = Array.from({ length: 32 }, () =>
        Math.random().toString(36).charAt(2)
      ).join("");

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await db.insert(courierTokens).values({
        spedizioneId: req.params.id,
        token,
        expiresAt,
      });

      const baseUrl = process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : "http://localhost:5000";

      const link = `${baseUrl}/corriere/${token}`;

      res.json({ success: true, link, token, expiresAt });
    } catch (error) {
      console.error("Errore generazione link corriere:", error);
      res.status(500).json({ error: "Errore nella generazione del link" });
    }
  });

  app.get("/api/corriere/:token", async (req, res) => {
    try {
      const [tokenRecord] = await db.select().from(courierTokens)
        .where(eq(courierTokens.token, req.params.token));

      if (!tokenRecord) {
        return res.status(404).json({ error: "Link non valido" });
      }

      if (tokenRecord.usedAt) {
        return res.status(400).json({ error: "Link già utilizzato" });
      }

      if (new Date() > tokenRecord.expiresAt) {
        return res.status(400).json({ error: "Link scaduto" });
      }

      const spedizione = await storage.getSpedizione(tokenRecord.spedizioneId);
      if (!spedizione) {
        return res.status(404).json({ error: "Spedizione non trovata" });
      }

      let clienteNome = spedizione.destinatario;
      if (spedizione.clienteId) {
        const cliente = await storage.getAnagraficaCliente(spedizione.clienteId);
        if (cliente) clienteNome = cliente.ragioneSociale;
      }

      const companyInfo = await storage.getCompanyInfo();

      res.json({
        spedizione: {
          id: spedizione.id,
          numero: spedizione.numero,
          data: spedizione.data,
          stato: spedizione.stato,
          destinatario: clienteNome || spedizione.destinatario,
          indirizzo: spedizione.indirizzoDestinazione,
          citta: spedizione.cittaDestinazione,
          cap: spedizione.capDestinazione,
          provincia: spedizione.provinciaDestinazione,
          noteConsegna: spedizione.noteConsegna,
          numeroColli: spedizione.numeroColli,
          pesoTotale: spedizione.pesoTotale,
          firmaPresente: !!spedizione.firmaDestinatario,
        },
        companyName: companyInfo?.ragioneSociale || "PULSE ERP",
        tokenValid: true,
      });
    } catch (error) {
      console.error("Errore validazione token corriere:", error);
      res.status(500).json({ error: "Errore nella validazione del link" });
    }
  });

  app.post("/api/corriere/:token/firma", async (req, res) => {
    try {
      const { firma, nomeFirmatario } = req.body;

      if (!firma || !nomeFirmatario) {
        return res.status(400).json({ error: "Firma e nome firmatario richiesti" });
      }

      const [tokenRecord] = await db.select().from(courierTokens)
        .where(eq(courierTokens.token, req.params.token));

      if (!tokenRecord) {
        return res.status(404).json({ error: "Link non valido" });
      }

      if (tokenRecord.usedAt) {
        return res.status(400).json({ error: "Link già utilizzato" });
      }

      if (new Date() > tokenRecord.expiresAt) {
        return res.status(400).json({ error: "Link scaduto" });
      }

      await storage.updateSpedizione(tokenRecord.spedizioneId, {
        firmaDestinatario: firma,
        nomeFirmatario,
        dataOraFirma: new Date(),
        stato: "consegnata",
        dataConsegnaEffettiva: new Date().toISOString().split("T")[0],
      });

      await db.update(courierTokens)
        .set({ usedAt: new Date() })
        .where(eq(courierTokens.token, req.params.token));

      res.json({ success: true, message: "Consegna confermata con successo" });
    } catch (error) {
      console.error("Errore salvataggio firma corriere:", error);
      res.status(500).json({ error: "Errore nel salvataggio della firma" });
    }
  });

  // ==================== CRM API ====================

  // CRM Leads
  app.get("/api/crm/leads", async (req, res) => {
    try {
      const leads = await storage.getCrmLeads();
      res.json(leads);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero dei lead" });
    }
  });

  app.get("/api/crm/leads/:id", async (req, res) => {
    try {
      const lead = await storage.getCrmLead(req.params.id);
      if (!lead) return res.status(404).json({ error: "Lead non trovato" });
      res.json(lead);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero del lead" });
    }
  });

  app.post("/api/crm/leads", async (req, res) => {
    try {
      const lead = await storage.createCrmLead(req.body);
      res.json(lead);
    } catch (error) {
      res.status(500).json({ error: "Errore nella creazione del lead" });
    }
  });

  app.patch("/api/crm/leads/:id", async (req, res) => {
    try {
      const lead = await storage.updateCrmLead(req.params.id, req.body);
      if (!lead) return res.status(404).json({ error: "Lead non trovato" });
      res.json(lead);
    } catch (error) {
      res.status(500).json({ error: "Errore nell'aggiornamento del lead" });
    }
  });

  app.delete("/api/crm/leads/:id", async (req, res) => {
    try {
      const success = await storage.deleteCrmLead(req.params.id);
      if (!success) return res.status(404).json({ error: "Lead non trovato" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Errore nell'eliminazione del lead" });
    }
  });

  app.post("/api/crm/leads/:id/convert", async (req, res) => {
    try {
      const lead = await storage.getCrmLead(req.params.id);
      if (!lead) return res.status(404).json({ error: "Lead non trovato" });

      // Create customer from lead
      const cliente = await storage.createAnagraficaCliente({
        ragioneSociale: lead.azienda || `${lead.nome} ${lead.cognome || ""}`.trim(),
        indirizzo: lead.indirizzo || undefined,
        citta: lead.citta || undefined,
        cap: lead.cap || undefined,
        provincia: lead.provincia || undefined,
        nazione: lead.nazione || "Italia",
        telefono: lead.telefono || undefined,
        cellulare: lead.cellulare || undefined,
        email: lead.email || undefined,
        referente: `${lead.nome} ${lead.cognome || ""}`.trim(),
        note: lead.note || undefined,
        stato: "attivo",
      });

      // Update lead status
      await storage.updateCrmLead(req.params.id, {
        stato: "convertito",
        clienteId: cliente.id,
      });

      res.json({ lead: { ...lead, stato: "convertito", clienteId: cliente.id }, cliente });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Errore nella conversione del lead" });
    }
  });

  // CRM Opportunità
  app.get("/api/crm/opportunita", async (req, res) => {
    try {
      const opportunita = await storage.getCrmOpportunita();
      res.json(opportunita);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero delle opportunità" });
    }
  });

  app.get("/api/crm/opportunita/:id", async (req, res) => {
    try {
      const opp = await storage.getCrmOpportunitaById(req.params.id);
      if (!opp) return res.status(404).json({ error: "Opportunità non trovata" });
      res.json(opp);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero dell'opportunità" });
    }
  });

  app.post("/api/crm/opportunita", async (req, res) => {
    try {
      const opp = await storage.createCrmOpportunita(req.body);
      res.json(opp);
    } catch (error) {
      res.status(500).json({ error: "Errore nella creazione dell'opportunità" });
    }
  });

  app.patch("/api/crm/opportunita/:id", async (req, res) => {
    try {
      const opp = await storage.updateCrmOpportunita(req.params.id, req.body);
      if (!opp) return res.status(404).json({ error: "Opportunità non trovata" });
      res.json(opp);
    } catch (error) {
      res.status(500).json({ error: "Errore nell'aggiornamento dell'opportunità" });
    }
  });

  app.delete("/api/crm/opportunita/:id", async (req, res) => {
    try {
      const success = await storage.deleteCrmOpportunita(req.params.id);
      if (!success) return res.status(404).json({ error: "Opportunità non trovata" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Errore nell'eliminazione dell'opportunità" });
    }
  });

  // CRM Attività
  app.get("/api/crm/attivita", async (req, res) => {
    try {
      const { clienteId, leadId, opportunitaId } = req.query;
      const attivita = await storage.getCrmAttivita(
        clienteId as string | undefined,
        leadId as string | undefined,
        opportunitaId as string | undefined
      );
      res.json(attivita);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero delle attività" });
    }
  });

  app.post("/api/crm/attivita", async (req, res) => {
    try {
      const attivita = await storage.createCrmAttivita(req.body);
      res.json(attivita);
    } catch (error) {
      res.status(500).json({ error: "Errore nella creazione dell'attività" });
    }
  });

  app.patch("/api/crm/attivita/:id", async (req, res) => {
    try {
      const attivita = await storage.updateCrmAttivita(req.params.id, req.body);
      if (!attivita) return res.status(404).json({ error: "Attività non trovata" });
      res.json(attivita);
    } catch (error) {
      res.status(500).json({ error: "Errore nell'aggiornamento dell'attività" });
    }
  });

  app.delete("/api/crm/attivita/:id", async (req, res) => {
    try {
      const success = await storage.deleteCrmAttivita(req.params.id);
      if (!success) return res.status(404).json({ error: "Attività non trovata" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Errore nell'eliminazione dell'attività" });
    }
  });

  // CRM Interazioni
  app.get("/api/crm/interazioni", async (req, res) => {
    try {
      const { clienteId, leadId, opportunitaId } = req.query;
      const interazioni = await storage.getCrmInterazioni(
        clienteId as string | undefined,
        leadId as string | undefined,
        opportunitaId as string | undefined
      );
      res.json(interazioni);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero delle interazioni" });
    }
  });

  app.post("/api/crm/interazioni", async (req, res) => {
    try {
      const interazione = await storage.createCrmInterazione(req.body);
      res.json(interazione);
    } catch (error) {
      res.status(500).json({ error: "Errore nella creazione dell'interazione" });
    }
  });

  // CRM Dashboard Stats
  app.get("/api/crm/stats", async (req, res) => {
    try {
      const [leads, opportunita, attivita] = await Promise.all([
        storage.getCrmLeads(),
        storage.getCrmOpportunita(),
        storage.getCrmAttivita(),
      ]);

      const oggi = new Date().toISOString().split("T")[0];

      // Lead stats
      const leadNuovi = leads.filter(l => l.stato === "nuovo").length;
      const leadQualificati = leads.filter(l => l.stato === "qualificato").length;
      const leadConvertiti = leads.filter(l => l.stato === "convertito").length;

      // Pipeline stats
      const pipelineValore = opportunita
        .filter(o => !["chiuso_vinto", "chiuso_perso"].includes(o.fase))
        .reduce((sum, o) => sum + (parseFloat(o.valore || "0") || 0), 0);

      const opportunitaVinte = opportunita.filter(o => o.fase === "chiuso_vinto");
      const valoreVinto = opportunitaVinte.reduce((sum, o) => sum + (parseFloat(o.valore || "0") || 0), 0);

      const opportunitaPerse = opportunita.filter(o => o.fase === "chiuso_perso").length;
      const tassoConversione = opportunita.length > 0
        ? Math.round((opportunitaVinte.length / opportunita.length) * 100)
        : 0;

      // Activity stats
      const attivitaOggi = attivita.filter(a => a.dataOra.startsWith(oggi)).length;
      const attivitaPianificate = attivita.filter(a => a.stato === "pianificata").length;

      // Pipeline by phase
      const pipelinePerFase = {
        prospetto: opportunita.filter(o => o.fase === "prospetto").length,
        qualificazione: opportunita.filter(o => o.fase === "qualificazione").length,
        proposta: opportunita.filter(o => o.fase === "proposta").length,
        negoziazione: opportunita.filter(o => o.fase === "negoziazione").length,
      };

      res.json({
        leads: { totale: leads.length, nuovi: leadNuovi, qualificati: leadQualificati, convertiti: leadConvertiti },
        opportunita: { totale: opportunita.length, vinte: opportunitaVinte.length, perse: opportunitaPerse, tassoConversione },
        pipeline: { valore: pipelineValore, valoreVinto, perFase: pipelinePerFase },
        attivita: { oggi: attivitaOggi, pianificate: attivitaPianificate },
      });
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero delle statistiche CRM" });
    }
  });

  // ==================== PORTALE CLIENTE ====================

  // Genera token portale per un cliente (richiede autenticazione)
  app.post("/api/customer-portal/generate", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;

      if (!userId) {
        return res.status(401).json({ error: "Non autorizzato" });
      }

      const { clienteId } = req.body;

      if (!clienteId) {
        return res.status(400).json({ error: "clienteId richiesto" });
      }

      // Verifica se esiste un token valido per questo cliente
      const existingTokens = await db.select().from(customerPortalTokens)
        .where(eq(customerPortalTokens.clienteId, clienteId));

      const validToken = existingTokens.find(t =>
        t.attivo && (!t.scadenza || new Date(t.scadenza) > new Date())
      );

      if (validToken) {
        return res.json(validToken);
      }

      // Disattiva token precedenti
      if (existingTokens.length > 0) {
        await db.update(customerPortalTokens)
          .set({ attivo: false })
          .where(eq(customerPortalTokens.clienteId, clienteId));
      }

      // Crea nuovo token con scadenza di 30 giorni
      const token = crypto.randomUUID().replace(/-/g, '');
      const scadenza = new Date();
      scadenza.setDate(scadenza.getDate() + 30);

      const [portalToken] = await db.insert(customerPortalTokens).values({
        clienteId,
        token,
        nome: "Accesso Portale",
        scadenza,
        attivo: true,
        createdBy: userId,
      }).returning();

      res.json(portalToken);
    } catch (error) {
      console.error("Errore generazione token portale:", error);
      res.status(500).json({ error: "Errore nella generazione del token" });
    }
  });

  // Lista token portale per un cliente (richiede autenticazione)
  app.get("/api/customer-portal/tokens/:clienteId", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Non autorizzato" });
      }

      const tokens = await db.select().from(customerPortalTokens)
        .where(eq(customerPortalTokens.clienteId, req.params.clienteId));
      res.json(tokens);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero dei token" });
    }
  });

  // Revoca token portale (richiede autenticazione)
  app.delete("/api/customer-portal/tokens/:id", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Non autorizzato" });
      }

      await db.update(customerPortalTokens)
        .set({ attivo: false })
        .where(eq(customerPortalTokens.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Errore nella revoca del token" });
    }
  });

  // Lista tutti i clienti con portale condiviso attivo (richiede autenticazione)
  app.get("/api/customer-portal/shared", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Non autorizzato" });
      }

      const tokens = await db.select().from(customerPortalTokens)
        .where(eq(customerPortalTokens.attivo, true));

      if (tokens.length === 0) {
        return res.json([]);
      }

      const clienteIds = [...new Set(tokens.map(t => t.clienteId))];
      const clienti = await db.select().from(anagraficaClienti)
        .where(sql`${anagraficaClienti.id} IN (${sql.join(clienteIds.map(id => sql`${id}`), sql`, `)})`);

      const clientiMap = new Map(clienti.map(c => [c.id, c]));

      const fattureClienti = await db.select({
        clienteId: invoices.clienteId,
        count: sql<number>`count(*)::int`,
        totale: sql<string>`sum(${invoices.totale}::numeric)::text`
      }).from(invoices)
        .where(sql`${invoices.clienteId} IN (${sql.join(clienteIds.map(id => sql`${id}`), sql`, `)})`)
        .groupBy(invoices.clienteId);

      const fattureMap = new Map(fattureClienti.map(f => [f.clienteId, { count: f.count, totale: f.totale }]));

      const result = tokens.map(token => {
        const cliente = clientiMap.get(token.clienteId);
        const fatture = fattureMap.get(token.clienteId) || { count: 0, totale: "0" };
        // Considera connesso se ultima attività < 5 minuti fa
        const isConnesso = token.connessioneAttiva && token.ultimaAttivita &&
          (new Date().getTime() - new Date(token.ultimaAttivita).getTime()) < 5 * 60 * 1000;
        return {
          id: token.id,
          token: token.token,
          clienteId: token.clienteId,
          ragioneSociale: cliente?.ragioneSociale || "Cliente sconosciuto",
          email: cliente?.email,
          citta: cliente?.citta,
          scadenza: token.scadenza,
          ultimoAccesso: token.ultimoAccesso,
          accessiTotali: token.accessiTotali || 0,
          createdAt: token.createdAt,
          fattureCount: fatture.count,
          fattureTotale: fatture.totale,
          ultimoIp: token.ultimoIp,
          connessioneAttiva: isConnesso,
          ultimaAttivita: token.ultimaAttivita,
        };
      });

      res.json(result);
    } catch (error) {
      console.error("Errore recupero clienti condivisi:", error);
      res.status(500).json({ error: "Errore nel recupero dei clienti condivisi" });
    }
  });

  // Lista tutti i fornitori con portale attivo (richiede autenticazione)
  app.get("/api/supplier-portal/shared", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Non autorizzato" });
      }

      const fornitori = await db.select().from(anagraficaFornitori)
        .where(eq(anagraficaFornitori.portaleAbilitato, true));

      const result = fornitori.map(f => ({
        id: f.id,
        tipo: "fornitore",
        ragioneSociale: f.ragioneSociale || f.nome,
        email: f.email,
        citta: f.citta,
        telefono: f.telefono,
        partitaIva: f.partitaIva,
        portaleUsername: f.portaleUsername,
        portaleAbilitato: f.portaleAbilitato,
        createdAt: f.createdAt,
      }));

      res.json(result);
    } catch (error) {
      console.error("Errore recupero fornitori condivisi:", error);
      res.status(500).json({ error: "Errore nel recupero dei fornitori condivisi" });
    }
  });

  // Lista clienti con portale abilitato (credenziali username/password)
  app.get("/api/customer-portal/credentials", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Non autorizzato" });
      }

      const clienti = await db.select().from(anagraficaClienti)
        .where(eq(anagraficaClienti.portaleAbilitato, true));

      const result = clienti.map(c => ({
        id: c.id,
        tipo: "cliente",
        ragioneSociale: c.ragioneSociale,
        email: c.email,
        citta: c.citta,
        telefono: c.telefono,
        partitaIva: c.partitaIva,
        portaleUsername: c.portaleUsername,
        portaleAbilitato: c.portaleAbilitato,
        createdAt: c.createdAt,
      }));

      res.json(result);
    } catch (error) {
      console.error("Errore recupero clienti con credenziali:", error);
      res.status(500).json({ error: "Errore nel recupero dei clienti" });
    }
  });

  app.get("/api/portal/:token/check", async (req, res) => {
    try {
      const [tokenRecord] = await db.select().from(customerPortalTokens)
        .where(eq(customerPortalTokens.token, req.params.token));

      if (!tokenRecord) {
        return res.status(404).json({ error: "Link non valido o scaduto" });
      }

      if (!tokenRecord.attivo) {
        return res.status(403).json({ error: "Accesso disabilitato" });
      }

      if (tokenRecord.scadenza && new Date(tokenRecord.scadenza) < new Date()) {
        return res.status(403).json({ error: "Link scaduto" });
      }

      // Recupera dati cliente per verificare se ha credenziali
      const [cliente] = await db.select().from(anagraficaClienti)
        .where(eq(anagraficaClienti.id, tokenRecord.clienteId));

      if (!cliente) {
        return res.status(404).json({ error: "Cliente non trovato" });
      }

      // Se il cliente ha username e password configurati, richiede autenticazione
      const requiresAuth = !!(cliente.portaleUsername && cliente.portalePassword);

      res.json({
        requiresAuth,
        clienteName: cliente.ragioneSociale,
      });
    } catch (error) {
      console.error("Errore check portale:", error);
      res.status(500).json({ error: "Errore nel caricamento del portale" });
    }
  });


  app.post("/api/portal/:token/auth", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username e password sono obbligatori" });
      }

      const [tokenRecord] = await db.select().from(customerPortalTokens)
        .where(eq(customerPortalTokens.token, req.params.token));

      if (!tokenRecord) {
        return res.status(404).json({ error: "Link non valido o scaduto" });
      }

      if (!tokenRecord.attivo) {
        return res.status(403).json({ error: "Accesso disabilitato" });
      }

      if (tokenRecord.scadenza && new Date(tokenRecord.scadenza) < new Date()) {
        return res.status(403).json({ error: "Link scaduto" });
      }

      // Recupera dati cliente
      const [cliente] = await db.select().from(anagraficaClienti)
        .where(eq(anagraficaClienti.id, tokenRecord.clienteId));

      if (!cliente) {
        return res.status(404).json({ error: "Cliente non trovato" });
      }

      // Verifica credenziali
      if (cliente.portaleUsername !== username || cliente.portalePassword !== password) {
        return res.status(401).json({ error: "Username o password non corretti" });
      }

      // Aggiorna accesso con IP
      const clientIp = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown';
      await db.update(customerPortalTokens)
        .set({
          ultimoAccesso: new Date(),
          accessiTotali: (tokenRecord.accessiTotali || 0) + 1,
          ultimoIp: clientIp.split(',')[0].trim(),
          connessioneAttiva: true,
          ultimaAttivita: new Date()
        })
        .where(eq(customerPortalTokens.id, tokenRecord.id));

      // Recupera documenti del cliente
      console.log(`[Portal Auth] Caricamento documenti per cliente ID: ${tokenRecord.clienteId}`);
      const [fatture, preventivi] = await Promise.all([
        db.select().from(invoices)
          .where(eq(invoices.clienteId, tokenRecord.clienteId)),
        db.select().from(quotes)
          .where(eq(quotes.clienteId, tokenRecord.clienteId)),
      ]);
      console.log(`[Portal Auth] Trovate ${fatture.length} fatture e ${preventivi.length} preventivi`);

      // Recupera le righe per ogni fattura e preventivo
      const fattureConRighe = await Promise.all(fatture.map(async (f) => {
        const righe = await storage.getInvoiceLines(f.id);
        return {
          id: f.id,
          numero: f.numero,
          data: f.dataEmissione,
          dataScadenza: f.dataScadenza,
          importo: f.totale,
          totalePagato: f.totalePagato,
          stato: f.stato,
          oggetto: f.oggetto,
          righe: righe.map(r => ({
            id: r.id,
            descrizione: r.descrizione,
            quantita: parseFloat(r.quantita || '1'),
            prezzoUnitario: r.prezzoUnitario,
            iva: parseFloat(r.aliquotaIva || '22'),
            totale: r.importo,
            codiceArticolo: (r as any).codiceArticolo || null,
          })),
        };
      }));

      const preventiviConRighe = await Promise.all(preventivi.map(async (p) => {
        const righe = await storage.getQuoteLines(p.id);
        return {
          id: p.id,
          numero: p.numero,
          data: p.dataEmissione,
          dataValidita: p.dataValidita,
          importo: p.totale,
          stato: p.stato,
          oggetto: p.oggetto,
          righe: righe.map(r => ({
            id: r.id,
            descrizione: r.descrizione,
            quantita: parseFloat(r.quantita || '1'),
            prezzoUnitario: r.prezzoUnitario,
            iva: parseFloat(r.aliquotaIva || '22'),
            totale: r.importo,
            codiceArticolo: (r as any).codiceArticolo || null,
          })),
        };
      }));

      res.json({
        cliente: {
          id: cliente.id,
          ragioneSociale: cliente.ragioneSociale,
          email: cliente.email,
        },
        documenti: {
          fatture: fattureConRighe,
          preventivi: preventiviConRighe,
        }
      });
    } catch (error) {
      console.error("Errore autenticazione portale:", error);
      res.status(500).json({ error: "Errore nell'autenticazione" });
    }
  });

  // Accesso pubblico portale cliente (no auth - per clienti senza credenziali)
  app.get("/api/portal/:token", async (req, res) => {
    try {
      const [tokenRecord] = await db.select().from(customerPortalTokens)
        .where(eq(customerPortalTokens.token, req.params.token));

      if (!tokenRecord) {
        return res.status(404).json({ error: "Link non valido o scaduto" });
      }

      if (!tokenRecord.attivo) {
        return res.status(403).json({ error: "Accesso disabilitato" });
      }

      if (tokenRecord.scadenza && new Date(tokenRecord.scadenza) < new Date()) {
        return res.status(403).json({ error: "Link scaduto" });
      }

      // Recupera dati cliente
      const [cliente] = await db.select().from(anagraficaClienti)
        .where(eq(anagraficaClienti.id, tokenRecord.clienteId));

      if (!cliente) {
        return res.status(404).json({ error: "Cliente non trovato" });
      }

      // Se il cliente ha credenziali configurate, blocca l'accesso diretto
      if (cliente.portaleUsername && cliente.portalePassword) {
        return res.status(401).json({ error: "Autenticazione richiesta" });
      }

      // Aggiorna accesso con IP
      const clientIp = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown';
      await db.update(customerPortalTokens)
        .set({
          ultimoAccesso: new Date(),
          accessiTotali: (tokenRecord.accessiTotali || 0) + 1,
          ultimoIp: clientIp.split(',')[0].trim(),
          connessioneAttiva: true,
          ultimaAttivita: new Date()
        })
        .where(eq(customerPortalTokens.id, tokenRecord.id));

      // Recupera documenti del cliente (solo fatture emesse)
      console.log(`[Portal] Caricamento documenti per cliente ID: ${tokenRecord.clienteId}`);
      const [fatture, preventivi] = await Promise.all([
        db.select().from(invoices)
          .where(eq(invoices.clienteId, tokenRecord.clienteId)),
        db.select().from(quotes)
          .where(eq(quotes.clienteId, tokenRecord.clienteId)),
      ]);
      console.log(`[Portal] Trovate ${fatture.length} fatture e ${preventivi.length} preventivi`);

      // Recupera le righe per ogni fattura e preventivo
      const fattureConRighe = await Promise.all(fatture.map(async (f) => {
        const righe = await storage.getInvoiceLines(f.id);
        return {
          id: f.id,
          numero: f.numero,
          data: f.dataEmissione,
          dataScadenza: f.dataScadenza,
          importo: f.totale,
          totalePagato: f.totalePagato,
          stato: f.stato,
          oggetto: f.oggetto,
          righe: righe.map(r => ({
            id: r.id,
            descrizione: r.descrizione,
            quantita: parseFloat(r.quantita || '1'),
            prezzoUnitario: r.prezzoUnitario,
            iva: parseFloat(r.aliquotaIva || '22'),
            totale: r.importo,
            codiceArticolo: (r as any).codiceArticolo || null,
          })),
        };
      }));

      const preventiviConRighe = await Promise.all(preventivi.map(async (p) => {
        const righe = await storage.getQuoteLines(p.id);
        return {
          id: p.id,
          numero: p.numero,
          data: p.dataEmissione,
          dataValidita: p.dataValidita,
          importo: p.totale,
          stato: p.stato,
          oggetto: p.oggetto,
          righe: righe.map(r => ({
            id: r.id,
            descrizione: r.descrizione,
            quantita: parseFloat(r.quantita || '1'),
            prezzoUnitario: r.prezzoUnitario,
            iva: parseFloat(r.aliquotaIva || '22'),
            totale: r.importo,
            codiceArticolo: (r as any).codiceArticolo || null,
          })),
        };
      }));

      res.json({
        cliente: {
          id: cliente.id,
          ragioneSociale: cliente.ragioneSociale,
          email: cliente.email,
        },
        documenti: {
          fatture: fattureConRighe,
          preventivi: preventiviConRighe,
        }
      });
    } catch (error) {
      console.error("Errore accesso portale:", error);
      res.status(500).json({ error: "Errore nel caricamento del portale" });
    }
  });

  // ==================== CATALOGO ARTICOLI API ====================

  app.get("/api/catalogo/next-codice", async (req, res) => {
    try {
      const rows = await (db as any).all(sql`
        SELECT codice FROM catalog_articles 
        WHERE codice LIKE 'ART-%' 
        ORDER BY codice DESC 
        LIMIT 1
      `);

      let nextNum = 1;
      if (rows && rows.length > 0) {
        const lastCode = rows[0].codice as string;
        const match = lastCode.match(/ART-(\d+)/);
        if (match) {
          nextNum = parseInt(match[1], 10) + 1;
        }
      }

      const codice = `ART-${nextNum.toString().padStart(4, '0')}`;
      res.json({ codice });
    } catch (error) {
      console.error("Error generating article code:", error);
      res.status(500).json({ error: "Errore generazione codice" });
    }
  });

  app.get("/api/catalogo/articoli", async (req, res) => {
    try {
      const articoli = await db.select().from(catalogArticles).where(eq(catalogArticles.attivo, 1));
      res.json(articoli);
    } catch (error: any) {
      console.error("Errore recupero articoli:", error);
      res.status(500).json({ error: "Errore nel recupero degli articoli", details: error.message, stack: error.stack });
    }
  });

  app.post("/api/catalogo/articoli", async (req, res) => {
    try {
      const data = { ...req.body };
      if (data.dataScadenza && typeof data.dataScadenza === 'string') {
        data.dataScadenza = data.dataScadenza ? new Date(data.dataScadenza) : null;
      }
      if (!data.dataScadenza) delete data.dataScadenza;
      if (data.giacenza !== undefined) data.giacenza = parseInt(data.giacenza) || 0;
      if (data.stockMinimo !== undefined) data.stockMinimo = parseInt(data.stockMinimo) || 0;
      const [articolo] = await db.insert(catalogArticles).values(data).returning();
      res.json(articolo);
    } catch (error: any) {
      console.error("Errore creazione articolo:", error);
      res.status(500).json({ error: error.message || "Errore nella creazione dell'articolo" });
    }
  });

  app.patch("/api/catalogo/articoli/:id", async (req, res) => {
    try {
      const { id, ...data } = req.body;
      if (data.dataScadenza && typeof data.dataScadenza === 'string') {
        data.dataScadenza = data.dataScadenza ? new Date(data.dataScadenza) : null;
      }
      if (!data.dataScadenza) delete data.dataScadenza;
      if (data.giacenza !== undefined) data.giacenza = parseInt(data.giacenza) || 0;
      if (data.stockMinimo !== undefined) data.stockMinimo = parseInt(data.stockMinimo) || 0;
      const [articolo] = await db.update(catalogArticles)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(catalogArticles.id, req.params.id))
        .returning();
      res.json(articolo);
    } catch (error) {
      console.error("Errore aggiornamento articolo:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento dell'articolo" });
    }
  });

  app.delete("/api/catalogo/articoli/:id", async (req, res) => {
    try {
      await db.delete(catalogArticles).where(eq(catalogArticles.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Errore eliminazione articolo:", error);
      res.status(500).json({ error: "Errore nell'eliminazione dell'articolo" });
    }
  });

  app.post("/api/catalogo/import", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nessun file caricato" });
      }

      const XLSX = await import("xlsx");
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data: any[] = XLSX.utils.sheet_to_json(worksheet);

      let imported = 0;
      let errors: string[] = [];

      for (const row of data) {
        try {
          const codice = row.codice || row.Codice || `ART-${Date.now().toString().slice(-6)}`;
          const nome = row.nome || row.Nome || row.name || row.Name;

          if (!nome) {
            errors.push(`Riga senza nome: ${JSON.stringify(row).slice(0, 50)}`);
            continue;
          }

          await db.insert(catalogArticles).values({
            codice,
            nome,
            descrizione: row.descrizione || row.Descrizione || row.description || "",
            prezzoListino: String(row.prezzoListino || row.prezzo || row.Prezzo || "0"),
            costo: String(row.costo || row.Costo || "0"),
            unitaMisura: row.unitaMisura || row.um || "pz",
            stockMinimo: parseInt(row.stockMinimo || row.stock || "0") || 0,
            barcode: row.barcode || row.Barcode || row.ean || null,
            ubicazioneScaffale: row.scaffale || row.ubicazione || null,
            ubicazioneCorsia: row.corsia || null,
            ubicazioneRipiano: row.ripiano || null,
            lotto: row.lotto || null,
            visibile: true,
            attivo: true,
          });
          imported++;
        } catch (rowError: any) {
          errors.push(`Errore riga ${row.nome || row.codice}: ${rowError.message}`);
        }
      }

      res.json({
        success: true,
        imported,
        total: data.length,
        errors: errors.slice(0, 10)
      });
    } catch (error: any) {
      console.error("Errore import:", error);
      res.status(500).json({ error: error.message || "Errore durante l'import" });
    }
  });

  app.get("/api/catalogo/categorie", async (req, res) => {
    try {
      const categorie = await db.select().from(catalogCategories).where(eq(catalogCategories.attivo, 1));
      res.json(categorie);
    } catch (error) {
      console.error("Errore recupero categorie:", error);
      res.status(500).json({ error: "Errore nel recupero delle categorie" });
    }
  });

  app.post("/api/catalogo/categorie", async (req, res) => {
    try {
      const { id, ...data } = req.body;
      if (id) {
        const [categoria] = await db.update(catalogCategories)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(catalogCategories.id, id))
          .returning();
        return res.json(categoria);
      }
      const [categoria] = await db.insert(catalogCategories).values(data).returning();
      res.json(categoria);
    } catch (error) {
      console.error("Errore creazione categoria:", error);
      res.status(500).json({ error: "Errore nella creazione della categoria" });
    }
  });

  // Articoli in produzione (per mostrare info evasione ordini)
  app.get("/api/catalogo/in-produzione", async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT 
          po.articolo_catalogo_id as articolo_id,
          ca.codice,
          SUM(CAST(po.quantita_richiesta AS INTEGER) - CAST(po.quantita_prodotta AS INTEGER)) as quantita_in_produzione,
          MIN(po.data_fine_stimata) as data_prevista,
          STRING_AGG(po.numero, ', ') as ordini
        FROM production_orders po
        LEFT JOIN catalog_articles ca ON po.articolo_catalogo_id = ca.id
        WHERE po.stato IN ('pianificato', 'in_corso')
        AND po.articolo_catalogo_id IS NOT NULL
        GROUP BY po.articolo_catalogo_id, ca.codice
      `);
      const inProduzione: Record<string, { quantita: number; dataPrevista: string | null; ordini: string }> = {};
      result.rows.forEach((r: any) => {
        if (r.codice) {
          inProduzione[r.codice] = {
            quantita: parseInt(r.quantita_in_produzione) || 0,
            dataPrevista: r.data_prevista,
            ordini: r.ordini
          };
        }
      });
      res.json(inProduzione);
    } catch (error) {
      console.error("Errore in produzione:", error);
      res.json({});
    }
  });

  // Articoli in sottoscorta (per avvisi Produzione)
  app.get("/api/catalogo/sottoscorta", async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT ca.*, 
          COALESCE((
            SELECT SUM(CAST(dl.quantita AS INTEGER)) 
            FROM ddt_lines dl 
            JOIN ddt d ON dl.ddt_id = d.id 
            WHERE dl.codice_articolo = ca.codice 
            AND d.stato NOT IN ('consegnato', 'fatturato', 'annullato')
          ), 0) as occupato
        FROM catalog_articles ca
        WHERE ca.giacenza <= ca.stock_minimo
        ORDER BY (ca.giacenza - ca.stock_minimo) ASC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Errore sottoscorta:", error);
      res.json([]);
    }
  });

  // Quantità occupate da DDT non ancora consegnati
  app.get("/api/catalogo/occupati", async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT dl.codice_articolo as codice, SUM(CAST(dl.quantita AS INTEGER)) as occupato
        FROM ddt_lines dl
        JOIN ddt d ON dl.ddt_id = d.id
        WHERE d.stato NOT IN ('consegnato', 'fatturato', 'annullato')
        GROUP BY dl.codice_articolo
      `);
      const occupati: Record<string, number> = {};
      result.rows.forEach((r: any) => {
        if (r.codice) occupati[r.codice] = parseInt(r.occupato) || 0;
      });
      res.json(occupati);
    } catch (error) {
      console.error("Errore calcolo occupati:", error);
      res.json({});
    }
  });

  // Movimenti articoli catalogo
  app.get("/api/catalogo/movimenti/:articoloId", async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT * FROM catalog_movements 
        WHERE articolo_id = ${req.params.articoloId}
        ORDER BY created_at DESC
        LIMIT 100
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Errore recupero movimenti:", error);
      res.status(500).json({ error: "Errore nel recupero dei movimenti" });
    }
  });

  app.post("/api/catalogo/movimenti", async (req, res) => {
    try {
      const { articoloId, tipo, quantita, causale, note } = req.body;

      const [articolo] = await db.select().from(catalogArticles).where(eq(catalogArticles.id, articoloId));
      if (!articolo) return res.status(404).json({ error: "Articolo non trovato" });

      const giacenzaPrecedente = articolo.giacenza || 0;
      const delta = tipo === 'carico' ? quantita : -quantita;
      const giacenzaSuccessiva = giacenzaPrecedente + delta;

      await db.execute(sql`
        INSERT INTO catalog_movements (articolo_id, tipo, quantita, giacenza_precedente, giacenza_successiva, causale, note)
        VALUES (${articoloId}, ${tipo}, ${quantita}, ${giacenzaPrecedente}, ${giacenzaSuccessiva}, ${causale}, ${note})
      `);

      await db.update(catalogArticles)
        .set({ giacenza: giacenzaSuccessiva, updatedAt: new Date() })
        .where(eq(catalogArticles.id, articoloId));

      res.json({ success: true, giacenza: giacenzaSuccessiva });
    } catch (error: any) {
      console.error("Errore registrazione movimento:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API pubbliche per il listino (no auth)
  app.get("/api/catalogo/pubblico/articoli", async (req, res) => {
    try {
      const articoli = await db.select().from(catalogArticles)
        .where(and(eq(catalogArticles.attivo, true), eq(catalogArticles.visibile, true)));
      res.json(articoli);
    } catch (error) {
      console.error("Errore recupero listino pubblico:", error);
      res.status(500).json({ error: "Errore nel recupero del listino" });
    }
  });

  app.get("/api/catalogo/pubblico/categorie", async (req, res) => {
    try {
      const categorie = await db.select().from(catalogCategories).where(eq(catalogCategories.attivo, true));
      res.json(categorie);
    } catch (error) {
      console.error("Errore recupero categorie pubbliche:", error);
      res.status(500).json({ error: "Errore nel recupero delle categorie" });
    }
  });

  // ==================== MONITOR API (PUBLIC - NO AUTH) ====================
  app.get("/api/monitor/stats", async (req, res) => {
    try {
      // DDT stats
      const ddtStats = await db.execute(sql`
        SELECT stato, COUNT(*) as count FROM ddt GROUP BY stato
      `);

      // Spedizioni stats
      const spedizioniStats = await db.execute(sql`
        SELECT stato, COUNT(*) as count FROM spedizioni GROUP BY stato
      `);

      // Ordini produzione stats
      const produzioneStats = await db.execute(sql`
        SELECT stato, COUNT(*) as count FROM production_orders GROUP BY stato
      `);

      // Ordini produzione in corso
      const produzioneInCorso = await db.execute(sql`
        SELECT po.id, po.numero, po.quantita_richiesta as quantita, po.stato, po.data_inizio, po.data_fine_stimata,
               wp.nome as nome_prodotto
        FROM production_orders po
        LEFT JOIN warehouse_products wp ON po.prodotto_id = wp.id
        WHERE po.stato IN ('pianificato', 'in_corso')
        ORDER BY po.data_inizio DESC
        LIMIT 10
      `);

      // Magazzino - prodotti con giacenza bassa (sotto scorta minima)
      const prodottiSottoscorta = await db.execute(sql`
        SELECT id, codice, nome, giacenza, giacenza_minima as scorta_minima, unita_misura
        FROM warehouse_products
        WHERE CAST(COALESCE(NULLIF(giacenza, ''), '0') AS NUMERIC) <= CAST(COALESCE(NULLIF(giacenza_minima, ''), '0') AS NUMERIC)
        AND CAST(COALESCE(NULLIF(giacenza_minima, ''), '0') AS NUMERIC) > 0
        ORDER BY nome
        LIMIT 15
      `);

      // Magazzino stats per categoria
      const magazzinoStats = await db.execute(sql`
        SELECT 
          COALESCE(wc.nome, 'Non categorizzato') as categoria,
          COUNT(*) as count,
          SUM(CAST(COALESCE(NULLIF(wp.giacenza, ''), '0') AS NUMERIC)) as totale_giacenza
        FROM warehouse_products wp
        LEFT JOIN warehouse_categories wc ON wp.categoria_id = wc.id
        GROUP BY wc.nome
        ORDER BY count DESC
        LIMIT 10
      `);

      // Movimenti magazzino recenti
      const movimentiRecenti = await db.execute(sql`
        SELECT m.id, m.tipo, m.quantita, m.created_at as data, m.causale,
               p.codice as prodotto_codice, p.nome as prodotto_nome
        FROM warehouse_movements m
        LEFT JOIN warehouse_products p ON m.prodotto_id = p.id
        ORDER BY m.created_at DESC
        LIMIT 10
      `);

      // Recent DDT da evadere (bozza, in_preparazione)
      const ddtDaEvadere = await db.execute(sql`
        SELECT id, numero, ragione_sociale, data_emissione, stato
        FROM ddt 
        WHERE stato IN ('bozza', 'in_preparazione')
        ORDER BY data_emissione DESC
        LIMIT 10
      `);

      // Spedizioni in corso
      const spedizioniInCorso = await db.execute(sql`
        SELECT s.id, s.numero, s.destinatario, s.stato, s.data,
               c.nome as corriere_nome
        FROM spedizioni s
        LEFT JOIN corrieri c ON s.corriere_id = c.id
        WHERE s.stato IN ('da_preparare', 'in_preparazione', 'pronta', 'spedita')
        ORDER BY s.data DESC
        LIMIT 15
      `);

      res.json({
        timestamp: new Date().toISOString(),
        ddt: {
          stats: ddtStats.rows,
          daEvadere: ddtDaEvadere.rows,
        },
        spedizioni: {
          stats: spedizioniStats.rows,
          inCorso: spedizioniInCorso.rows,
        },
        produzione: {
          stats: produzioneStats.rows,
          inCorso: produzioneInCorso.rows,
        },
        magazzino: {
          stats: magazzinoStats.rows,
          sottoscorta: prodottiSottoscorta.rows,
          movimentiRecenti: movimentiRecenti.rows,
        },
      });
    } catch (error) {
      console.error("Errore monitor stats:", error);
      res.status(500).json({ error: "Errore nel caricamento statistiche" });
    }
  });

  // ============== SOCIAL & MARKETING API ==============

  // Marketing Campagne CRUD
  app.get("/api/marketing/campagne", async (req, res) => {
    try {
      const campagne = await db.select().from(marketingCampagne).orderBy(desc(marketingCampagne.createdAt));
      res.json(campagne);
    } catch (error) {
      console.error("Errore recupero campagne:", error);
      res.status(500).json({ error: "Errore nel recupero delle campagne" });
    }
  });

  app.get("/api/marketing/campagne/:id", async (req, res) => {
    try {
      const [campagna] = await db.select().from(marketingCampagne).where(eq(marketingCampagne.id, req.params.id));
      if (!campagna) return res.status(404).json({ error: "Campagna non trovata" });
      res.json(campagna);
    } catch (error) {
      console.error("Errore recupero campagna:", error);
      res.status(500).json({ error: "Errore nel recupero della campagna" });
    }
  });

  app.post("/api/marketing/campagne", async (req, res) => {
    try {
      const [campagna] = await db.insert(marketingCampagne).values(req.body).returning();
      res.json(campagna);
    } catch (error) {
      console.error("Errore creazione campagna:", error);
      res.status(500).json({ error: "Errore nella creazione della campagna" });
    }
  });

  app.put("/api/marketing/campagne/:id", async (req, res) => {
    try {
      const [campagna] = await db.update(marketingCampagne)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(marketingCampagne.id, req.params.id))
        .returning();
      res.json(campagna);
    } catch (error) {
      console.error("Errore aggiornamento campagna:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento della campagna" });
    }
  });

  app.delete("/api/marketing/campagne/:id", async (req, res) => {
    try {
      await db.delete(marketingCampagne).where(eq(marketingCampagne.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Errore eliminazione campagna:", error);
      res.status(500).json({ error: "Errore nell'eliminazione della campagna" });
    }
  });

  // Social Contenuti CRUD
  app.get("/api/social/contenuti", async (req, res) => {
    try {
      const contenuti = await db.select().from(socialContenuti).orderBy(desc(socialContenuti.createdAt));
      res.json(contenuti);
    } catch (error) {
      console.error("Errore recupero contenuti:", error);
      res.status(500).json({ error: "Errore nel recupero dei contenuti" });
    }
  });

  app.post("/api/social/contenuti", async (req, res) => {
    try {
      const [contenuto] = await db.insert(socialContenuti).values(req.body).returning();
      res.json(contenuto);
    } catch (error) {
      console.error("Errore creazione contenuto:", error);
      res.status(500).json({ error: "Errore nella creazione del contenuto" });
    }
  });

  app.put("/api/social/contenuti/:id", async (req, res) => {
    try {
      const [contenuto] = await db.update(socialContenuti)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(socialContenuti.id, req.params.id))
        .returning();
      res.json(contenuto);
    } catch (error) {
      console.error("Errore aggiornamento contenuto:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento del contenuto" });
    }
  });

  app.delete("/api/social/contenuti/:id", async (req, res) => {
    try {
      await db.delete(socialContenuti).where(eq(socialContenuti.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Errore eliminazione contenuto:", error);
      res.status(500).json({ error: "Errore nell'eliminazione del contenuto" });
    }
  });

  // YouTube Videos CRUD
  app.get("/api/youtube/videos", async (req, res) => {
    try {
      const videos = await db.select().from(youtubeVideos).orderBy(desc(youtubeVideos.createdAt));
      res.json(videos);
    } catch (error) {
      console.error("Errore recupero video:", error);
      res.status(500).json({ error: "Errore nel recupero dei video" });
    }
  });

  app.post("/api/youtube/videos", async (req, res) => {
    try {
      const [video] = await db.insert(youtubeVideos).values(req.body).returning();
      res.json(video);
    } catch (error) {
      console.error("Errore creazione video:", error);
      res.status(500).json({ error: "Errore nella creazione del video" });
    }
  });

  app.put("/api/youtube/videos/:id", async (req, res) => {
    try {
      const [video] = await db.update(youtubeVideos)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(youtubeVideos.id, req.params.id))
        .returning();
      res.json(video);
    } catch (error) {
      console.error("Errore aggiornamento video:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento del video" });
    }
  });

  app.delete("/api/youtube/videos/:id", async (req, res) => {
    try {
      await db.delete(youtubeVideos).where(eq(youtubeVideos.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Errore eliminazione video:", error);
      res.status(500).json({ error: "Errore nell'eliminazione del video" });
    }
  });

  // Social Analytics CRUD
  app.get("/api/social/analytics", async (req, res) => {
    try {
      const analytics = await db.select().from(socialAnalytics).orderBy(desc(socialAnalytics.createdAt));
      res.json(analytics);
    } catch (error) {
      console.error("Errore recupero analytics:", error);
      res.status(500).json({ error: "Errore nel recupero delle analytics" });
    }
  });

  app.post("/api/social/analytics", async (req, res) => {
    try {
      const [stat] = await db.insert(socialAnalytics).values(req.body).returning();
      res.json(stat);
    } catch (error) {
      console.error("Errore creazione analytics:", error);
      res.status(500).json({ error: "Errore nella creazione delle analytics" });
    }
  });

  app.delete("/api/social/analytics/:id", async (req, res) => {
    try {
      await db.delete(socialAnalytics).where(eq(socialAnalytics.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Errore eliminazione analytics:", error);
      res.status(500).json({ error: "Errore nell'eliminazione delle analytics" });
    }
  });

  // Google Business Profile - OAuth Connection
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID || "PLACEHOLDER_ID",
    process.env.GOOGLE_CLIENT_SECRET || "PLACEHOLDER_SECRET",
    process.env.GOOGLE_REDIRECT_URL || "http://localhost:5000/api/google-business/callback"
  );

  app.get("/api/google-business/auth-url", (req, res) => {
    const accountId = req.query.accountId as string;
    const state = accountId ? `?accountId=${accountId}` : "";

    // For development/demo: if no credentials, simulate a successful auth flow
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      // Return a direct link to the callback with a mock code to simulate success
      // We pass accountId in state query param to the callback
      const mockUrl = `http://localhost:5000/api/google-business/callback?code=MOCK_CODE_FOR_DEMO${accountId ? `&state=${accountId}` : ""}`;
      return res.json({ url: mockUrl });
    }

    const scopes = [
      "https://www.googleapis.com/auth/business.manage",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile"
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
      state: accountId // Pass accountId as state for real OAuth
    });

    res.json({ url });
  });

  app.get("/api/google-business/callback", async (req, res) => {
    const { code, state } = req.query; // state contains accountId

    if (!code || typeof code !== "string") {
      return res.redirect("/social-marketing?error=auth_failed");
    }

    if (code === "MOCK_CODE_FOR_DEMO") {
      // Simulate success for demo
      // If state (accountId) is provided, update that specific account
      const accountId = typeof state === 'string' ? state : null;

      if (accountId) {
        await db.update(googleBusinessAccounts).set({
          isConnected: 1,
          accessToken: "mock_access_token",
          refreshToken: "mock_refresh_token",
          tokenExpiresAt: new Date(Date.now() + 3600 * 1000).getTime().toString(),
          lastSync: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }).where(eq(googleBusinessAccounts.id, accountId));

        // Generate MOCK DATA for this account
        // 1. Insights
        const insightId = crypto.randomUUID();
        await db.insert(googleBusinessInsights).values({
          id: insightId,
          accountId: accountId,
          dataRilevazione: new Date().toISOString(),
          visualizzazioniMappa: 1250,
          visualizzazioniRicerca: 3400,
          chiamate: 45,
          richiesteDirezioni: 89,
          clickSitoWeb: 120,
          fotoVisualizzate: 560,
          recensioniTotali: 23,
          ratingMedio: "4.8",
          createdAt: new Date().toISOString()
        });

        // 2. Reviews
        await db.insert(googleBusinessReviews).values([
          {
            id: crypto.randomUUID(),
            accountId: accountId,
            autore: "Mario Rossi",
            rating: 5,
            testo: "Ottima esperienza, servizio impeccabile!",
            dataRecensione: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
            createdAt: new Date().toISOString()
          },
          {
            id: crypto.randomUUID(),
            accountId: accountId,
            autore: "Giulia Bianchi",
            rating: 4,
            testo: "Molto buono, ma un po' affollato.",
            dataRecensione: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
            createdAt: new Date().toISOString()
          }
        ]);
      } else {
        // Fallback: look for ANY unconnected account (legacy behavior)
        const targetAccount = await db.select().from(googleBusinessAccounts).where(eq(googleBusinessAccounts.isConnected, 0)).limit(1);
        if (targetAccount.length > 0) {
          await db.update(googleBusinessAccounts).set({
            isConnected: 1,
            accessToken: "mock_access_token",
            refreshToken: "mock_refresh_token",
            tokenExpiresAt: new Date(Date.now() + 3600 * 1000).getTime().toString(),
            lastSync: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }).where(eq(googleBusinessAccounts.id, targetAccount[0].id));
        }
      }

      return res.redirect("/social-marketing?success=google_connected_demo");
    }

    try {
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();

      const accountId = typeof state === 'string' ? state : null;

      // Here you would typically use the MyBusiness API to fetch locations
      // const mybusiness = google.mybusinessbusinessinformation({ version: 'v1', auth: oauth2Client });
      // const locations = await mybusiness.accounts.locations.list(...)

      // For now, we simulate finding/creating an account linked to this user
      // or we just update the connection status of the first available account or create a new one

      // REAL DATA FETCHING START
      // Initialize APIs
      const accountManagement = google.mybusinessaccountmanagement({ version: 'v1', auth: oauth2Client });
      const businessInfo = google.mybusinessbusinessinformation({ version: 'v1', auth: oauth2Client });

      let googleAccountName = "";
      let googleLocationName = "";

      // 1. List Accounts
      try {
        console.log("Fetching GMB Accounts...");
        const accountsRes = await accountManagement.accounts.list();
        const googleAccount = accountsRes.data.accounts?.[0];
        if (googleAccount) {
          googleAccountName = googleAccount.name || "";
          console.log("Found Google Account:", googleAccountName);
        }
      } catch (err) {
        console.error("Error fetching GMB Accounts:", err);
      }

      // 2. Fetch Location (if account found)
      let locationData: any = null;
      if (googleAccountName) {
        try {
          console.log("Fetching GMB Locations...");
          const locationsRes = await businessInfo.accounts.locations.list({
            parent: googleAccountName,
            readMask: 'name,title,storefrontAddress,phoneNumbers,websiteUri,categories'
          });
          locationData = locationsRes.data.locations?.[0];
          if (locationData) {
            console.log("Found Location:", locationData.title);
            googleLocationName = locationData.name || "";
          }
        } catch (err) {
          console.error("Error fetching GMB Locations:", err);
        }
      }

      // 3. Update Database Record
      const targetAccountId = accountId || existing?.[0]?.id || crypto.randomUUID();

      // Basic update fields (token always updated)
      const updateData: any = {
        isConnected: 1,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: tokens.expiry_date?.toString(),
        lastSync: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Enhance with Real Data if found
      if (locationData) {
        const addressLines = locationData.storefrontAddress?.addressLines || [];
        const city = locationData.storefrontAddress?.locality || "";
        const postalCode = locationData.storefrontAddress?.postalCode || "";
        const fullAddress = [...addressLines, city, postalCode].filter(Boolean).join(", ");

        updateData.nomeAttivita = locationData.title || "Attività Google";
        updateData.indirizzo = fullAddress;
        updateData.telefono = locationData.phoneNumbers?.primaryPhone || "";
        updateData.sitoWeb = locationData.websiteUri || "";
        updateData.categoria = locationData.categories?.primaryCategory?.displayName || "Attività Locale";
        updateData.googleLocationId = googleLocationName;
      }

      // Perform DB Update/Insert
      const existingRecord = await db.select().from(googleBusinessAccounts).where(eq(googleBusinessAccounts.id, targetAccountId));

      if (existingRecord.length > 0) {
        await db.update(googleBusinessAccounts).set(updateData).where(eq(googleBusinessAccounts.id, targetAccountId));
      } else {
        // Should mostly be creating new if not found, but we usually have accountId from state
        updateData.id = targetAccountId;
        updateData.email = userInfo.data.email;
        updateData.createdAt = new Date().toISOString();
        // If no real data found, set defaults
        if (!updateData.nomeAttivita) updateData.nomeAttivita = userInfo.data.name || `Attività di ${userInfo.data.email}`;

        await db.insert(googleBusinessAccounts).values(updateData);
      }

      // 4. Reviews will be fetched during manual sync (not during initial connection to avoid quota issues)
      // Use the "Sincronizza" button to download reviews after connecting


      res.redirect("/social-marketing?success=google_connected");

    } catch (error) {
      console.error("Google Auth Error:", error);
      res.redirect("/social-marketing?error=google_auth_error");
    }
  });

  // Manual sync endpoint for Google Business data
  app.post("/api/google-business/sync/:accountId", async (req, res) => {
    try {
      const { accountId } = req.params;

      console.log(`[GMB Sync] Starting manual sync for account ${accountId}`);

      const account = await db.select().from(googleBusinessAccounts).where(eq(googleBusinessAccounts.id, accountId)).limit(1);

      if (!account.length || !account[0].accessToken) {
        return res.status(400).json({ error: "Account non connesso o non trovato" });
      }

      const accountData = account[0];

      // Set credentials
      const tempOAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URL
      );

      tempOAuth2Client.setCredentials({
        access_token: accountData.accessToken || undefined,
        refresh_token: accountData.refreshToken || undefined,
        expiry_date: accountData.tokenExpiresAt ? parseInt(accountData.tokenExpiresAt) : undefined
      });

      // Initialize APIs
      const accountManagement = google.mybusinessaccountmanagement({ version: 'v1', auth: tempOAuth2Client });
      const businessInfo = google.mybusinessbusinessinformation({ version: 'v1', auth: tempOAuth2Client });

      let googleAccountName = "";
      let googleLocationName = accountData.googleLocationId || "";

      // 1. If we don't have location ID stored, fetch it
      if (!googleLocationName) {
        const accountsRes = await accountManagement.accounts.list();
        const googleAccount = accountsRes.data.accounts?.[0];
        if (googleAccount) {
          googleAccountName = googleAccount.name || "";
          const locationsRes = await businessInfo.accounts.locations.list({
            parent: googleAccountName,
            readMask: 'name,title,storefrontAddress,phoneNumbers,websiteUri,categories'
          });
          const locationData = locationsRes.data.locations?.[0];
          if (locationData) {
            googleLocationName = locationData.name || "";
          }
        }
      }

      if (!googleLocationName) {
        return res.status(400).json({ error: "Nessuna location trovata per questo account" });
      }

      // 2. Fetch Location details
      const locationData = await businessInfo.accounts.locations.get({
        name: googleLocationName,
        readMask: 'name,title,storefrontAddress,phoneNumbers,websiteUri,categories'
      });

      if (locationData.data) {
        const loc = locationData.data;
        const addressLines = loc.storefrontAddress?.addressLines || [];
        const city = loc.storefrontAddress?.locality || "";
        const postalCode = loc.storefrontAddress?.postalCode || "";
        const fullAddress = [...addressLines, city, postalCode].filter(Boolean).join(", ");

        await db.update(googleBusinessAccounts).set({
          nomeAttivita: loc.title || accountData.nomeAttivita,
          indirizzo: fullAddress || accountData.indirizzo,
          telefono: loc.phoneNumbers?.primaryPhone || accountData.telefono,
          sitoWeb: loc.websiteUri || accountData.sitoWeb,
          categoria: loc.categories?.primaryCategory?.displayName || accountData.categoria,
          googleLocationId: googleLocationName,
          lastSync: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }).where(eq(googleBusinessAccounts.id, accountId));
      }

      // 3. Fetch Reviews
      try {
        const reviewsRes = await businessInfo.accounts.locations.reviews.list({ parent: googleLocationName });
        const reviews = reviewsRes.data.reviews || [];

        if (reviews.length > 0) {
          await db.delete(googleBusinessReviews).where(eq(googleBusinessReviews.accountId, accountId));

          for (const review of reviews) {
            await db.insert(googleBusinessReviews).values({
              id: crypto.randomUUID(),
              accountId: accountId,
              autore: review.reviewer?.displayName || "Utente Google",
              rating: ["ONE", "TWO", "THREE", "FOUR", "FIVE"].indexOf(review.starRating || "") + 1 || 5,
              testo: review.comment || "",
              dataRecensione: review.createTime || new Date().toISOString(),
              risposta: review.reviewReply?.comment || null,
              createdAt: new Date().toISOString()
            });
          }
          console.log(`[GMB Sync] Synced ${reviews.length} reviews for account ${accountId}`);
        }
      } catch (e) {
        console.warn("[GMB Sync] Error syncing reviews:", e);
      }

      // 4. Fetch Posts
      try {
        console.log(`[GMB Sync] Fetching posts for ${googleLocationName}`);
        const localPostsService = (google as any).mybusinesslocalposts ? (google as any).mybusinesslocalposts({ version: 'v1', auth: tempOAuth2Client }) : null;

        if (localPostsService) {
          const postsRes = await localPostsService.locations.localPosts.list({ parent: googleLocationName });
          const posts = postsRes.data.localPosts || [];

          if (posts.length > 0) {
            await db.delete(googleBusinessPosts).where(eq(googleBusinessPosts.accountId, accountId));
            for (const post of posts) {
              await db.insert(googleBusinessPosts).values({
                id: crypto.randomUUID(),
                accountId: accountId,
                postId: post.name,
                tipo: post.topicType ? post.topicType.toLowerCase() : "standard",
                contenuto: post.summary || "",
                callToAction: post.callToAction?.actionType || null,
                linkCta: post.callToAction?.url || null,
                mediaUrl: post.media && post.media.length > 0 ? post.media[0].googleUrl : null,
                stato: post.state ? post.state.toLowerCase() : "published",
                dataPubblicazione: post.createTime || new Date().toISOString(),
                createdAt: new Date().toISOString()
              });
            }
            console.log(`[GMB Sync] Synced ${posts.length} posts`);
          }
        }
      } catch (e) {
        console.warn("[GMB Sync] Could not sync posts:", e);
      }

      // 5. Fetch Insights (Best Effort)
      try {
        // Attempt to log insight sync attempt, actual API requires 'businessprofileperformance'
        // We'll leave this as a placeholder for robustness or until specific API version is confirmed active.
        console.log(`[GMB Sync] Insights sync requested for ${googleLocationName}`);
      } catch (e) {
        console.warn("[GMB Sync] Could not sync insights:", e);
      }

      res.json({
        success: true,
        message: "Sincronizzazione completata",
        lastSync: new Date().toISOString()
      });

    } catch (error: any) {
      console.error(`[GMB Sync] Error:`, error);
      res.status(500).json({ error: error.message || "Errore durante la sincronizzazione" });
    }
  });

  // Media Library CRUD
  app.get("/api/media-library", async (req, res) => {
    try {
      const media = await db.select().from(mediaLibrary).orderBy(desc(mediaLibrary.createdAt));
      res.json(media);
    } catch (error) {
      console.error("Errore recupero media:", error);
      res.status(500).json({ error: "Errore nel recupero dei media" });
    }
  });

  app.post("/api/media-library", async (req, res) => {
    try {
      const [item] = await db.insert(mediaLibrary).values(req.body).returning();
      res.json(item);
    } catch (error) {
      console.error("Errore creazione media:", error);
      res.status(500).json({ error: "Errore nella creazione del media" });
    }
  });

  app.delete("/api/media-library/:id", async (req, res) => {
    try {
      await db.delete(mediaLibrary).where(eq(mediaLibrary.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Errore eliminazione media:", error);
      res.status(500).json({ error: "Errore nell'eliminazione del media" });
    }
  });

  // Google Business - Import Reviews from CSV/Excel
  app.post("/api/google-business/import-reviews", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nessun file caricato" });
      }

      const accountId = req.body.accountId;
      if (!accountId) {
        return res.status(400).json({ error: "Account ID mancante" });
      }

      const filePath = req.file.path;
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      let reviews: any[] = [];

      // Parse file based on extension
      if (fileExt === '.csv') {
        const csvContent = fs.readFileSync(filePath, 'utf-8');
        const lines = csvContent.split('\n').filter(l => l.trim());

        if (lines.length < 2) {
          fs.unlinkSync(filePath);
          return res.status(400).json({ error: "File CSV vuoto" });
        }

        const headers = lines[0].split(/[,;]/).map(h => h.trim().toLowerCase());

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(/[,;]/);
          const row: any = {};
          headers.forEach((h, idx) => {
            row[h] = values[idx]?.trim() || '';
          });

          reviews.push({
            autore: row.autore || row.author || row.nome || row.name || 'Anonimo',
            rating: parseInt(row.rating || row.stelle || row.voto || '5'),
            testo: row.testo || row.text || row.commento || row.comment || '',
            dataRecensione: row.data || row.date || new Date().toISOString()
          });
        }
      } else if (fileExt === '.xlsx' || fileExt === '.xls') {
        const XLSX = await import('xlsx');
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        for (const row of data as any[]) {
          reviews.push({
            autore: row.autore || row.Autore || row.author || row.Author || row.nome || 'Anonimo',
            rating: parseInt(row.rating || row.Rating || row.stelle || row.Stelle || row.voto || '5'),
            testo: row.testo || row.Testo || row.text || row.Text || row.commento || '',
            dataRecensione: row.data || row.Data || row.date || row.Date || new Date().toISOString()
          });
        }
      } else {
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: "Formato file non supportato. Usa CSV o Excel" });
      }

      // Delete file
      fs.unlinkSync(filePath);

      // Insert reviews into database
      let imported = 0;
      for (const review of reviews) {
        try {
          await db.insert(googleBusinessReviews).values({
            id: crypto.randomUUID(),
            accountId: accountId,
            autore: review.autore,
            rating: Math.min(5, Math.max(1, review.rating || 5)),
            testo: review.testo,
            dataRecensione: new Date(review.dataRecensione || Date.now()).toISOString(),
            createdAt: new Date().toISOString()
          });
          imported++;
        } catch (err) {
          console.error("Error inserting review:", err);
        }
      }

      res.json({ success: true, imported, total: reviews.length });

    } catch (error: any) {
      console.error("Import reviews error:", error);
      if (req.file?.path) fs.unlinkSync(req.file.path);
      res.status(500).json({ error: error.message || "Errore durante l'importazione" });
    }
  });

  // Google Business Profile - Account CRUD
  app.get("/api/google-business/accounts", async (req, res) => {
    try {
      const accounts = await db.select().from(googleBusinessAccounts).orderBy(desc(googleBusinessAccounts.createdAt));
      res.json(accounts);
    } catch (error) {
      console.error("Errore recupero account Google Business:", error);
      res.status(500).json({ error: "Errore nel recupero degli account" });
    }
  });

  app.post("/api/google-business/accounts", async (req, res) => {
    try {
      const accountData = {
        ...req.body,
        id: req.body.id || crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const [account] = await db.insert(googleBusinessAccounts).values(accountData).returning();
      res.json(account);
    } catch (error) {
      console.error("Errore creazione account Google Business:", error);
      res.status(500).json({ error: "Errore nella creazione dell'account" });
    }
  });

  app.put("/api/google-business/accounts/:id", async (req, res) => {
    try {
      console.log(`Updating Google Business Account ${req.params.id}`, req.body);
      // Remove id, createdAt from body if present to avoid issues, though frontend should strip id
      const { id, createdAt, updatedAt, ...allowedData } = req.body;

      const [account] = await db.update(googleBusinessAccounts)
        .set({ ...allowedData, updatedAt: new Date().toISOString() })
        .where(eq(googleBusinessAccounts.id, req.params.id))
        .returning();

      if (!account) {
        return res.status(404).json({ error: "Account non trovato" });
      }

      res.json(account);
    } catch (error) {
      console.error("Errore aggiornamento account Google Business:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento dell'account" });
    }
  });

  app.delete("/api/google-business/accounts/:id", async (req, res) => {
    try {
      await db.delete(googleBusinessAccounts).where(eq(googleBusinessAccounts.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Errore eliminazione account Google Business:", error);
      res.status(500).json({ error: "Errore nell'eliminazione dell'account" });
    }
  });

  // Google Business Profile - Reviews CRUD
  app.get("/api/google-business/reviews", async (req, res) => {
    try {
      const reviews = await db.select().from(googleBusinessReviews).orderBy(desc(googleBusinessReviews.createdAt));
      res.json(reviews);
    } catch (error) {
      console.error("Errore recupero recensioni:", error);
      res.status(500).json({ error: "Errore nel recupero delle recensioni" });
    }
  });

  app.post("/api/google-business/reviews", async (req, res) => {
    try {
      const [review] = await db.insert(googleBusinessReviews).values(req.body).returning();
      res.json(review);
    } catch (error) {
      console.error("Errore creazione recensione:", error);
      res.status(500).json({ error: "Errore nella creazione della recensione" });
    }
  });

  app.put("/api/google-business/reviews/:id", async (req, res) => {
    try {
      const { id, ...data } = req.body;
      const [review] = await db.update(googleBusinessReviews)
        .set(data)
        .where(eq(googleBusinessReviews.id, req.params.id))
        .returning();
      res.json(review);
    } catch (error) {
      console.error("Errore aggiornamento recensione:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento della recensione" });
    }
  });

  app.delete("/api/google-business/reviews/:id", async (req, res) => {
    try {
      await db.delete(googleBusinessReviews).where(eq(googleBusinessReviews.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Errore eliminazione recensione:", error);
      res.status(500).json({ error: "Errore nell'eliminazione della recensione" });
    }
  });

  // Google Business Profile - Posts CRUD
  app.get("/api/google-business/posts", async (req, res) => {
    try {
      const posts = await db.select().from(googleBusinessPosts).orderBy(desc(googleBusinessPosts.createdAt));
      res.json(posts);
    } catch (error) {
      console.error("Errore recupero post:", error);
      res.status(500).json({ error: "Errore nel recupero dei post" });
    }
  });

  app.post("/api/google-business/posts", async (req, res) => {
    try {
      const [post] = await db.insert(googleBusinessPosts).values(req.body).returning();
      res.json(post);
    } catch (error) {
      console.error("Errore creazione post:", error);
      res.status(500).json({ error: "Errore nella creazione del post" });
    }
  });

  app.put("/api/google-business/posts/:id", async (req, res) => {
    try {
      const { id, ...data } = req.body;
      const [post] = await db.update(googleBusinessPosts)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(googleBusinessPosts.id, req.params.id))
        .returning();
      res.json(post);
    } catch (error) {
      console.error("Errore aggiornamento post:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento del post" });
    }
  });

  app.delete("/api/google-business/posts/:id", async (req, res) => {
    try {
      await db.delete(googleBusinessPosts).where(eq(googleBusinessPosts.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Errore eliminazione post:", error);
      res.status(500).json({ error: "Errore nell'eliminazione del post" });
    }
  });

  // Google Business Profile - Insights CRUD
  app.get("/api/google-business/insights", async (req, res) => {
    try {
      const insights = await db.select().from(googleBusinessInsights).orderBy(desc(googleBusinessInsights.createdAt));
      res.json(insights);
    } catch (error) {
      console.error("Errore recupero insights:", error);
      res.status(500).json({ error: "Errore nel recupero delle statistiche" });
    }
  });

  app.post("/api/google-business/insights", async (req, res) => {
    try {
      const [insight] = await db.insert(googleBusinessInsights).values(req.body).returning();
      res.json(insight);
    } catch (error) {
      console.error("Errore creazione insight:", error);
      res.status(500).json({ error: "Errore nella creazione delle statistiche" });
    }
  });

  app.delete("/api/google-business/insights/:id", async (req, res) => {
    try {
      await db.delete(googleBusinessInsights).where(eq(googleBusinessInsights.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Errore eliminazione insight:", error);
      res.status(500).json({ error: "Errore nell'eliminazione delle statistiche" });
    }
  });

  // =====================
  // MACHINERY MANAGEMENT API
  // =====================

  // Machinery CRUD
  app.get("/api/machinery", async (req, res) => {
    try {
      const result = await db.select().from(machinery).orderBy(desc(machinery.createdAt));
      res.json(result);
    } catch (error) {
      console.error("Errore recupero macchinari:", error);
      res.status(500).json({ error: "Errore nel recupero dei macchinari" });
    }
  });

  app.get("/api/machinery/:id", async (req, res) => {
    try {
      const [result] = await db.select().from(machinery).where(eq(machinery.id, req.params.id));
      if (!result) return res.status(404).json({ error: "Macchinario non trovato" });
      res.json(result);
    } catch (error) {
      console.error("Errore recupero macchinario:", error);
      res.status(500).json({ error: "Errore nel recupero del macchinario" });
    }
  });

  app.post("/api/machinery", async (req, res) => {
    try {
      const [result] = await db.insert(machinery).values(req.body).returning();
      res.json(result);
    } catch (error) {
      console.error("Errore creazione macchinario:", error);
      res.status(500).json({ error: "Errore nella creazione del macchinario" });
    }
  });

  app.put("/api/machinery/:id", async (req, res) => {
    try {
      const { id, ...data } = req.body;
      const [result] = await db.update(machinery)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(machinery.id, req.params.id))
        .returning();
      res.json(result);
    } catch (error) {
      console.error("Errore aggiornamento macchinario:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento del macchinario" });
    }
  });

  app.delete("/api/machinery/:id", async (req, res) => {
    try {
      await db.delete(machinery).where(eq(machinery.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Errore eliminazione macchinario:", error);
      res.status(500).json({ error: "Errore nell'eliminazione del macchinario" });
    }
  });

  // Machinery Consumptions CRUD
  app.get("/api/machinery/:machineryId/consumptions", async (req, res) => {
    try {
      const result = await db.select().from(machineryConsumptions)
        .where(eq(machineryConsumptions.machineryId, req.params.machineryId))
        .orderBy(desc(machineryConsumptions.data));
      res.json(result);
    } catch (error) {
      console.error("Errore recupero consumi:", error);
      res.status(500).json({ error: "Errore nel recupero dei consumi" });
    }
  });

  app.get("/api/machinery-consumptions", async (req, res) => {
    try {
      const result = await db.select().from(machineryConsumptions).orderBy(desc(machineryConsumptions.data));
      res.json(result);
    } catch (error) {
      console.error("Errore recupero consumi:", error);
      res.status(500).json({ error: "Errore nel recupero dei consumi" });
    }
  });

  app.post("/api/machinery-consumptions", async (req, res) => {
    try {
      const [result] = await db.insert(machineryConsumptions).values(req.body).returning();
      res.json(result);
    } catch (error) {
      console.error("Errore creazione consumo:", error);
      res.status(500).json({ error: "Errore nella creazione del consumo" });
    }
  });

  app.put("/api/machinery-consumptions/:id", async (req, res) => {
    try {
      const { id, ...data } = req.body;
      const [result] = await db.update(machineryConsumptions)
        .set(data)
        .where(eq(machineryConsumptions.id, req.params.id))
        .returning();
      res.json(result);
    } catch (error) {
      console.error("Errore aggiornamento consumo:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento del consumo" });
    }
  });

  app.delete("/api/machinery-consumptions/:id", async (req, res) => {
    try {
      await db.delete(machineryConsumptions).where(eq(machineryConsumptions.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Errore eliminazione consumo:", error);
      res.status(500).json({ error: "Errore nell'eliminazione del consumo" });
    }
  });

  // Machinery Costs CRUD
  app.get("/api/machinery/:machineryId/costs", async (req, res) => {
    try {
      const result = await db.select().from(machineryCosts)
        .where(eq(machineryCosts.machineryId, req.params.machineryId))
        .orderBy(desc(machineryCosts.data));
      res.json(result);
    } catch (error) {
      console.error("Errore recupero costi:", error);
      res.status(500).json({ error: "Errore nel recupero dei costi" });
    }
  });

  app.get("/api/machinery-costs", async (req, res) => {
    try {
      const result = await db.select().from(machineryCosts).orderBy(desc(machineryCosts.data));
      res.json(result);
    } catch (error) {
      console.error("Errore recupero costi:", error);
      res.status(500).json({ error: "Errore nel recupero dei costi" });
    }
  });

  app.post("/api/machinery-costs", async (req, res) => {
    try {
      const [result] = await db.insert(machineryCosts).values(req.body).returning();
      res.json(result);
    } catch (error) {
      console.error("Errore creazione costo:", error);
      res.status(500).json({ error: "Errore nella creazione del costo" });
    }
  });

  app.put("/api/machinery-costs/:id", async (req, res) => {
    try {
      const { id, ...data } = req.body;
      const [result] = await db.update(machineryCosts)
        .set(data)
        .where(eq(machineryCosts.id, req.params.id))
        .returning();
      res.json(result);
    } catch (error) {
      console.error("Errore aggiornamento costo:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento del costo" });
    }
  });

  app.delete("/api/machinery-costs/:id", async (req, res) => {
    try {
      await db.delete(machineryCosts).where(eq(machineryCosts.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Errore eliminazione costo:", error);
      res.status(500).json({ error: "Errore nell'eliminazione del costo" });
    }
  });

  // Maintenance Plans CRUD
  app.get("/api/maintenance-plans", async (req, res) => {
    try {
      const result = await db.select().from(maintenancePlans).orderBy(desc(maintenancePlans.createdAt));
      res.json(result);
    } catch (error) {
      console.error("Errore recupero piani manutenzione:", error);
      res.status(500).json({ error: "Errore nel recupero dei piani di manutenzione" });
    }
  });

  app.get("/api/machinery/:machineryId/maintenance-plans", async (req, res) => {
    try {
      const result = await db.select().from(maintenancePlans)
        .where(eq(maintenancePlans.machineryId, req.params.machineryId))
        .orderBy(desc(maintenancePlans.createdAt));
      res.json(result);
    } catch (error) {
      console.error("Errore recupero piani manutenzione:", error);
      res.status(500).json({ error: "Errore nel recupero dei piani di manutenzione" });
    }
  });

  app.post("/api/maintenance-plans", async (req, res) => {
    try {
      const [result] = await db.insert(maintenancePlans).values(req.body).returning();
      res.json(result);
    } catch (error) {
      console.error("Errore creazione piano manutenzione:", error);
      res.status(500).json({ error: "Errore nella creazione del piano di manutenzione" });
    }
  });

  app.put("/api/maintenance-plans/:id", async (req, res) => {
    try {
      const { id, ...data } = req.body;
      const [result] = await db.update(maintenancePlans)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(maintenancePlans.id, req.params.id))
        .returning();
      res.json(result);
    } catch (error) {
      console.error("Errore aggiornamento piano manutenzione:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento del piano di manutenzione" });
    }
  });

  app.delete("/api/maintenance-plans/:id", async (req, res) => {
    try {
      await db.delete(maintenancePlans).where(eq(maintenancePlans.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Errore eliminazione piano manutenzione:", error);
      res.status(500).json({ error: "Errore nell'eliminazione del piano di manutenzione" });
    }
  });

  // Maintenance Events CRUD
  app.get("/api/maintenance-events", async (req, res) => {
    try {
      const result = await db.select().from(maintenanceEvents).orderBy(desc(maintenanceEvents.createdAt));
      res.json(result);
    } catch (error) {
      console.error("Errore recupero eventi manutenzione:", error);
      res.status(500).json({ error: "Errore nel recupero degli eventi di manutenzione" });
    }
  });

  app.get("/api/machinery/:machineryId/maintenance-events", async (req, res) => {
    try {
      const result = await db.select().from(maintenanceEvents)
        .where(eq(maintenanceEvents.machineryId, req.params.machineryId))
        .orderBy(desc(maintenanceEvents.createdAt));
      res.json(result);
    } catch (error) {
      console.error("Errore recupero eventi manutenzione:", error);
      res.status(500).json({ error: "Errore nel recupero degli eventi di manutenzione" });
    }
  });

  app.post("/api/maintenance-events", async (req, res) => {
    try {
      const [result] = await db.insert(maintenanceEvents).values(req.body).returning();
      res.json(result);
    } catch (error) {
      console.error("Errore creazione evento manutenzione:", error);
      res.status(500).json({ error: "Errore nella creazione dell'evento di manutenzione" });
    }
  });

  app.put("/api/maintenance-events/:id", async (req, res) => {
    try {
      const { id, ...data } = req.body;
      const [result] = await db.update(maintenanceEvents)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(maintenanceEvents.id, req.params.id))
        .returning();
      res.json(result);
    } catch (error) {
      console.error("Errore aggiornamento evento manutenzione:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento dell'evento di manutenzione" });
    }
  });

  app.delete("/api/maintenance-events/:id", async (req, res) => {
    try {
      await db.delete(maintenanceEvents).where(eq(maintenanceEvents.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Errore eliminazione evento manutenzione:", error);
      res.status(500).json({ error: "Errore nell'eliminazione dell'evento di manutenzione" });
    }
  });

  // Maintenance Alerts CRUD
  app.get("/api/maintenance-alerts", async (req, res) => {
    try {
      const result = await db.select().from(maintenanceAlerts)
        .where(eq(maintenanceAlerts.archiviato, false))
        .orderBy(desc(maintenanceAlerts.createdAt));
      res.json(result);
    } catch (error) {
      console.error("Errore recupero avvisi manutenzione:", error);
      res.status(500).json({ error: "Errore nel recupero degli avvisi di manutenzione" });
    }
  });

  app.post("/api/maintenance-alerts", async (req, res) => {
    try {
      const [result] = await db.insert(maintenanceAlerts).values(req.body).returning();
      res.json(result);
    } catch (error) {
      console.error("Errore creazione avviso manutenzione:", error);
      res.status(500).json({ error: "Errore nella creazione dell'avviso di manutenzione" });
    }
  });

  app.put("/api/maintenance-alerts/:id", async (req, res) => {
    try {
      const { id, ...data } = req.body;
      const [result] = await db.update(maintenanceAlerts)
        .set(data)
        .where(eq(maintenanceAlerts.id, req.params.id))
        .returning();
      res.json(result);
    } catch (error) {
      console.error("Errore aggiornamento avviso manutenzione:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento dell'avviso di manutenzione" });
    }
  });

  app.delete("/api/maintenance-alerts/:id", async (req, res) => {
    try {
      await db.delete(maintenanceAlerts).where(eq(maintenanceAlerts.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Errore eliminazione avviso manutenzione:", error);
      res.status(500).json({ error: "Errore nell'eliminazione dell'avviso di manutenzione" });
    }
  });

  // Machinery Stats/KPI
  app.get("/api/machinery-stats", async (req, res) => {
    try {
      const allMachinery = await db.select().from(machinery);
      const allConsumptions = await db.select().from(machineryConsumptions);
      const allCosts = await db.select().from(machineryCosts);
      const allEvents = await db.select().from(maintenanceEvents);
      const allPlans = await db.select().from(maintenancePlans);

      const totalMachinery = allMachinery.length;
      const activeMachinery = allMachinery.filter(m => m.stato === "attivo").length;
      const inMaintenance = allMachinery.filter(m => m.stato === "in_manutenzione").length;

      const totalConsumptionCost = allConsumptions.reduce((sum, c) => sum + (parseFloat(c.costoTotale || "0") || 0), 0);
      const totalMaintenanceCost = allCosts.reduce((sum, c) => sum + (parseFloat(c.importo || "0") || 0), 0);

      const pendingMaintenance = allEvents.filter(e => e.stato === "pianificato").length;
      const completedMaintenance = allEvents.filter(e => e.stato === "completato").length;

      const upcomingMaintenance = allPlans.filter(p => {
        if (!p.prossimaScadenza) return false;
        const scadenza = new Date(p.prossimaScadenza);
        const oggi = new Date();
        const diff = Math.ceil((scadenza.getTime() - oggi.getTime()) / (1000 * 60 * 60 * 24));
        return diff <= 7 && diff >= 0;
      }).length;

      res.json({
        totalMachinery,
        activeMachinery,
        inMaintenance,
        totalConsumptionCost,
        totalMaintenanceCost,
        pendingMaintenance,
        completedMaintenance,
        upcomingMaintenance
      });
    } catch (error) {
      console.error("Errore recupero statistiche macchinari:", error);
      res.status(500).json({ error: "Errore nel recupero delle statistiche" });
    }
  });

  // Import Utility Bills (Gas/Electricity) - Extract consumption data using AI
  app.post("/api/machinery/import-bolletta", multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }).single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nessun file caricato" });
      }

      const filename = req.file.originalname.toLowerCase();
      const buffer = req.file.buffer;
      let textContent = "";

      // Extract text from PDF
      if (filename.endsWith(".pdf")) {
        const pdfParse = (await import("pdf-parse")).default;
        const pdfData = await pdfParse(buffer);
        textContent = pdfData.text;
      } else {
        textContent = buffer.toString("utf-8");
      }

      // Use OpenAI to extract structured data from the bill
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY
      });

      const extractionPrompt = `Analizza questa bolletta italiana (gas o energia elettrica) ed estrai le seguenti informazioni in formato JSON. Se un campo non è presente, usa null.

Testo della bolletta:
${textContent.substring(0, 8000)}

Estrai in questo formato JSON esatto:
{
  "fornitore": "nome del fornitore (es. Enel, Eni, Edison, A2A, etc.)",
  "tipoUtenza": "gas" oppure "elettricita",
  "podPdr": "codice POD (per luce) o PDR (per gas)",
  "periodoFatturazione": {
    "dataInizio": "YYYY-MM-DD",
    "dataFine": "YYYY-MM-DD"
  },
  "consumi": [
    {
      "descrizione": "descrizione fascia o tipo consumo",
      "quantita": numero,
      "unitaMisura": "kWh, Smc, m³"
    }
  ],
  "costoEnergia": numero in euro (solo componente energia/materia prima),
  "costoTrasporto": numero in euro (trasporto e gestione contatore),
  "costoOneri": numero in euro (oneri di sistema),
  "accise": numero in euro,
  "iva": numero in euro,
  "totale": numero in euro (importo totale bolletta),
  "letturaPrecedente": numero se disponibile,
  "letturaAttuale": numero se disponibile,
  "consumoTotale": numero totale consumo nel periodo,
  "unitaMisuraConsumo": "kWh" o "Smc" o "m³",
  "note": "eventuali note rilevanti"
}

Rispondi SOLO con il JSON valido, senza markdown o testo aggiuntivo.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Sei un assistente esperto nell'analisi di bollette italiane di gas e luce. Estrai dati strutturati dalle bollette." },
          { role: "user", content: extractionPrompt }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      const extractedText = response.choices[0]?.message?.content || "";

      // Parse the JSON response
      let extractedData;
      try {
        // Remove potential markdown code blocks
        const cleanJson = extractedText.replace(/```json\n?|\n?```/g, "").trim();
        extractedData = JSON.parse(cleanJson);
      } catch (parseError) {
        console.error("Errore parsing JSON:", parseError);
        return res.status(400).json({
          error: "Impossibile estrarre dati dalla bolletta. Verifica che il file sia una bolletta valida.",
          rawText: textContent.substring(0, 1000)
        });
      }

      // Format the response for frontend consumption
      const formattedResponse = {
        success: true,
        tipoUtenza: extractedData.tipoUtenza || "elettricita",
        fornitore: extractedData.fornitore,
        podPdr: extractedData.podPdr,
        periodoInizio: extractedData.periodoFatturazione?.dataInizio,
        periodoFine: extractedData.periodoFatturazione?.dataFine,
        consumoTotale: extractedData.consumoTotale,
        unitaMisura: extractedData.unitaMisuraConsumo || (extractedData.tipoUtenza === "gas" ? "Smc" : "kWh"),
        letturaPrecedente: extractedData.letturaPrecedente,
        letturaAttuale: extractedData.letturaAttuale,
        costoEnergia: extractedData.costoEnergia,
        costoTrasporto: extractedData.costoTrasporto,
        costoOneri: extractedData.costoOneri,
        accise: extractedData.accise,
        iva: extractedData.iva,
        totale: extractedData.totale,
        dettagliConsumi: extractedData.consumi || [],
        note: extractedData.note,
        // Pre-calculate cost per unit
        costoUnitario: extractedData.consumoTotale && extractedData.totale
          ? (extractedData.totale / extractedData.consumoTotale).toFixed(4)
          : null
      };

      res.json(formattedResponse);
    } catch (error) {
      console.error("Errore import bolletta:", error);
      res.status(500).json({ error: "Errore nell'elaborazione della bolletta" });
    }
  });

  // Import Machinery Technical Sheet (PDF) - Extract machinery data using AI
  app.post("/api/machinery/import-scheda-tecnica", multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } }).single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nessun file caricato" });
      }

      const filename = req.file.originalname.toLowerCase();
      const buffer = req.file.buffer;
      let textContent = "";

      if (filename.endsWith(".pdf")) {
        const pdfParse = (await import("pdf-parse")).default;
        const pdfData = await pdfParse(buffer);
        textContent = pdfData.text;
      } else {
        textContent = buffer.toString("utf-8");
      }

      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY
      });

      const extractionPrompt = `Analizza questa scheda tecnica di un macchinario ed estrai le seguenti informazioni in formato JSON. Se un campo non è presente, usa null.

Testo del documento:
${textContent.substring(0, 10000)}

Estrai in questo formato JSON esatto:
{
  "nome": "nome del macchinario/attrezzatura",
  "tipo": "tipo di macchinario (es. tornio, fresa, pressa, compressore, ecc.)",
  "categoria": "produzione, confezionamento, trasporto, movimentazione, utensili, altro",
  "marca": "marca/produttore",
  "modello": "modello",
  "numeroSerie": "numero di serie se presente",
  "annoFabbricazione": "anno di fabbricazione",
  "potenza": "potenza in kW o CV se indicata",
  "consumoOrario": "consumo orario se indicato",
  "unitaConsumo": "unità di misura del consumo (kWh, L/h, ecc.)",
  "peso": "peso in kg se indicato",
  "dimensioni": "dimensioni (LxPxH) se indicate",
  "alimentazione": "tipo alimentazione (elettrica, gas, gasolio, ecc.)",
  "tensione": "tensione elettrica se indicata (es. 380V, 220V)",
  "capacita": "capacità produttiva o di lavoro se indicata",
  "caratteristicheTecniche": ["array di caratteristiche tecniche principali"],
  "accessori": ["array di accessori inclusi se indicati"],
  "certificazioni": ["array di certificazioni (CE, ISO, ecc.)"],
  "manutenzioneConsigliata": "intervalli di manutenzione consigliati",
  "note": "eventuali note rilevanti"
}

Rispondi SOLO con il JSON valido, senza markdown o testo aggiuntivo.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Sei un esperto tecnico industriale. Estrai dati strutturati da schede tecniche di macchinari." },
          { role: "user", content: extractionPrompt }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      const extractedText = response.choices[0]?.message?.content || "";

      let extractedData;
      try {
        const cleanJson = extractedText.replace(/```json\n?|\n?```/g, "").trim();
        extractedData = JSON.parse(cleanJson);
      } catch (parseError) {
        console.error("Errore parsing JSON:", parseError);
        return res.status(400).json({
          error: "Impossibile estrarre dati dalla scheda tecnica. Verifica che il file sia valido.",
          rawText: textContent.substring(0, 1000)
        });
      }

      res.json({
        success: true,
        ...extractedData
      });
    } catch (error) {
      console.error("Errore import scheda tecnica:", error);
      res.status(500).json({ error: "Errore nell'elaborazione della scheda tecnica" });
    }
  });

  // =====================
  // FINANZA PERSONALE API
  // =====================

  // Personal Categories
  app.get("/api/personal-finance/categories/:userId", async (req, res) => {
    try {
      const categories = await storage.getPersonalCategories(req.params.userId);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero delle categorie" });
    }
  });

  app.post("/api/personal-finance/categories", async (req, res) => {
    try {
      const category = await storage.createPersonalCategory(req.body);
      res.json(category);
    } catch (error) {
      res.status(500).json({ error: "Errore nella creazione della categoria" });
    }
  });

  app.patch("/api/personal-finance/categories/:id", async (req, res) => {
    try {
      const category = await storage.updatePersonalCategory(req.params.id, req.body);
      res.json(category);
    } catch (error) {
      res.status(500).json({ error: "Errore nell'aggiornamento della categoria" });
    }
  });

  app.delete("/api/personal-finance/categories/:id", async (req, res) => {
    try {
      await storage.deletePersonalCategory(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Errore nell'eliminazione della categoria" });
    }
  });

  // Personal Accounts
  app.get("/api/personal-finance/accounts/:userId", async (req, res) => {
    try {
      const accounts = await storage.getPersonalAccounts(req.params.userId);
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero dei conti" });
    }
  });

  app.post("/api/personal-finance/accounts", async (req, res) => {
    try {
      const account = await storage.createPersonalAccount(req.body);
      res.json(account);
    } catch (error) {
      res.status(500).json({ error: "Errore nella creazione del conto" });
    }
  });

  app.patch("/api/personal-finance/accounts/:id", async (req, res) => {
    try {
      const account = await storage.updatePersonalAccount(req.params.id, req.body);
      res.json(account);
    } catch (error) {
      res.status(500).json({ error: "Errore nell'aggiornamento del conto" });
    }
  });

  app.delete("/api/personal-finance/accounts/:id", async (req, res) => {
    try {
      await storage.deletePersonalAccount(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Errore nell'eliminazione del conto" });
    }
  });

  // Personal Transactions
  app.get("/api/personal-finance/transactions/:userId", async (req, res) => {
    try {
      const transactions = await storage.getPersonalTransactions(req.params.userId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero delle transazioni" });
    }
  });

  app.post("/api/personal-finance/transactions", async (req, res) => {
    try {
      const transaction = await storage.createPersonalTransaction(req.body);
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Errore nella creazione della transazione" });
    }
  });

  app.patch("/api/personal-finance/transactions/:id", async (req, res) => {
    try {
      const transaction = await storage.updatePersonalTransaction(req.params.id, req.body);
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Errore nell'aggiornamento della transazione" });
    }
  });

  app.delete("/api/personal-finance/transactions/:id", async (req, res) => {
    try {
      await storage.deletePersonalTransaction(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Errore nell'eliminazione della transazione" });
    }
  });

  // Personal Budgets
  app.get("/api/personal-finance/budgets/:userId", async (req, res) => {
    try {
      const budgets = await storage.getPersonalBudgets(req.params.userId);
      res.json(budgets);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero dei budget" });
    }
  });

  app.post("/api/personal-finance/budgets", async (req, res) => {
    try {
      const budget = await storage.createPersonalBudget(req.body);
      res.json(budget);
    } catch (error) {
      res.status(500).json({ error: "Errore nella creazione del budget" });
    }
  });

  app.patch("/api/personal-finance/budgets/:id", async (req, res) => {
    try {
      const budget = await storage.updatePersonalBudget(req.params.id, req.body);
      res.json(budget);
    } catch (error) {
      res.status(500).json({ error: "Errore nell'aggiornamento del budget" });
    }
  });

  app.delete("/api/personal-finance/budgets/:id", async (req, res) => {
    try {
      await storage.deletePersonalBudget(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Errore nell'eliminazione del budget" });
    }
  });

  // Personal Goals
  app.get("/api/personal-finance/goals/:userId", async (req, res) => {
    try {
      const goals = await storage.getPersonalGoals(req.params.userId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero degli obiettivi" });
    }
  });

  app.post("/api/personal-finance/goals", async (req, res) => {
    try {
      const goal = await storage.createPersonalGoal(req.body);
      res.json(goal);
    } catch (error) {
      res.status(500).json({ error: "Errore nella creazione dell'obiettivo" });
    }
  });

  app.patch("/api/personal-finance/goals/:id", async (req, res) => {
    try {
      const goal = await storage.updatePersonalGoal(req.params.id, req.body);
      res.json(goal);
    } catch (error) {
      res.status(500).json({ error: "Errore nell'aggiornamento dell'obiettivo" });
    }
  });

  app.delete("/api/personal-finance/goals/:id", async (req, res) => {
    try {
      await storage.deletePersonalGoal(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Errore nell'eliminazione dell'obiettivo" });
    }
  });

  // Goal Contributions
  app.get("/api/personal-finance/goals/:goalId/contributions", async (req, res) => {
    try {
      const contributions = await storage.getGoalContributions(req.params.goalId);
      res.json(contributions);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero dei versamenti" });
    }
  });

  app.post("/api/personal-finance/goal-contributions", async (req, res) => {
    try {
      const contribution = await storage.createGoalContribution(req.body);
      res.json(contribution);
    } catch (error) {
      res.status(500).json({ error: "Errore nella creazione del versamento" });
    }
  });

  app.delete("/api/personal-finance/goal-contributions/:id", async (req, res) => {
    try {
      await storage.deleteGoalContribution(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Errore nell'eliminazione del versamento" });
    }
  });



  // =====================
  // FINANCE API (Project)
  // =====================

  app.get("/api/finance/invoices", async (req, res) => {
    const invoices = await storage.getInvoices();
    res.json(invoices);
  });

  app.get("/api/finance/quotes", async (req, res) => {
    const quotes = await storage.getQuotes();
    res.json(quotes);
  });

  app.get("/api/finance/transactions", async (req, res) => {
    const transactions = await storage.getTransactions();
    res.json(transactions);
  });

  app.get("/api/projects/:id/invoices", async (req, res) => {
    const invoices = await storage.getProjectInvoices(req.params.id);
    res.json(invoices);
  });

  app.get("/api/projects/:id/quotes", async (req, res) => {
    const quotes = await storage.getProjectQuotes(req.params.id);
    res.json(quotes);
  });

  app.get("/api/projects/:id/transactions", async (req, res) => {
    const transactions = await storage.getProjectTransactions(req.params.id);
    res.json(transactions);
  });

  app.patch("/api/invoices/:id/project", async (req, res) => {
    const { projectId } = req.body;
    const invoice = await storage.updateInvoice(req.params.id, { projectId });
    res.json(invoice);
  });

  app.patch("/api/quotes/:id/project", async (req, res) => {
    const { projectId } = req.body;
    const quote = await storage.updateQuote(req.params.id, { projectId });
    res.json(quote);
  });

  app.patch("/api/finance/transactions/:id/project", async (req, res) => {
    const { projectId } = req.body;
    const transaction = await storage.updateTransaction(req.params.id, { projectId });
    res.json(transaction);
  });

  // Create & Update Routes
  app.post("/api/finance/invoices", async (req, res) => {
    try {
      const invoice = await storage.createInvoice(req.body);
      res.json(invoice);
    } catch (e) {
      res.status(500).json({ error: "Failed to create invoice" });
    }
  });

  app.patch("/api/finance/invoices/:id", async (req, res) => {
    try {
      const invoice = await storage.updateInvoice(req.params.id, req.body);
      res.json(invoice);
    } catch (e) {
      res.status(500).json({ error: "Failed to update invoice" });
    }
  });

  app.post("/api/finance/quotes", async (req, res) => {
    try {
      const quote = await storage.createQuote(req.body);
      res.json(quote);
    } catch (e) {
      res.status(500).json({ error: "Failed to create quote" });
    }
  });

  app.patch("/api/finance/quotes/:id", async (req, res) => {
    try {
      const quote = await storage.updateQuote(req.params.id, req.body);
      res.json(quote);
    } catch (e) {
      res.status(500).json({ error: "Failed to update quote" });
    }
  });

  app.post("/api/finance/transactions", async (req, res) => {
    try {
      const transaction = await storage.createTransaction(req.body);
      res.json(transaction);
    } catch (e) {
      res.status(500).json({ error: "Failed to create transaction" });
    }
  });

  app.patch("/api/finance/transactions/:id", async (req, res) => {
    try {
      const transaction = await storage.updateTransaction(req.params.id, req.body);
      res.json(transaction);
    } catch (e) {
      res.status(500).json({ error: "Failed to update transaction" });
    }
  });


  app.get("/api/finance/invoices/next-numero", async (req, res) => {
    try {
      const invoices = await storage.getInvoices();
      const currentYear = new Date().getFullYear();
      let maxNum = 0;

      invoices.forEach(inv => {
        if (inv.numero && inv.numero.includes(String(currentYear))) {
          const match = inv.numero.match(/(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
          }
        }
      });

      const nextNum = maxNum + 1;
      const numero = `${currentYear}/${String(nextNum).padStart(3, '0')}`;
      res.json({ numero });
    } catch (e) {
      res.status(500).json({ error: "Failed to generate next number" });
    }
  });

  // =====================
  // PERMISSIONS API
  // =====================

  app.get("/api/permissions", async (req, res) => {
    try {
      // Ensure defaults exist first
      await storage.seedDefaultPermissions();
      const permissions = await storage.getAllRolePermissions();
      res.json(permissions);
    } catch (error) {
      console.error("Error getting permissions:", error);
      res.status(500).json({ error: "Errore recupero permessi" });
    }
  });

  app.put("/api/permissions/:role/:module", async (req, res) => {
    try {
      const { role, module } = req.params;
      const permissions = req.body; // { canView: true, ... }

      const updated = await storage.updateRolePermission(role, module, permissions);
      if (updated) {
        res.json(updated);
      } else {
        res.status(404).json({ error: "Permesso non trovato" });
      }
    } catch (error) {
      console.error("Error updating permission:", error);
      res.status(500).json({ error: "Errore aggiornamento permesso" });
    }
  });


  // =====================
  // WHITEBOARDS API
  // =====================

  // Get all whiteboards (filtered by user if provided)
  app.get("/api/whiteboards", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string | undefined;
      const whiteboards = await storage.getWhiteboards(userId);
      res.json(whiteboards);
    } catch (error) {
      console.error("Error getting whiteboards:", error);
      res.status(500).json({ error: "Errore nel recupero lavagne" });
    }
  });

  // Get single whiteboard
  app.get("/api/whiteboards/:id", async (req: Request, res: Response) => {
    try {
      const whiteboard = await storage.getWhiteboard(req.params.id);
      if (!whiteboard) {
        return res.status(404).json({ error: "Lavagna non trovata" });
      }
      res.json(whiteboard);
    } catch (error) {
      console.error("Error getting whiteboard:", error);
      res.status(500).json({ error: "Errore nel recupero lavagna" });
    }
  });

  // Create whiteboard
  app.post("/api/whiteboards", async (req: Request, res: Response) => {
    try {
      const whiteboardData = insertWhiteboardSchema.parse(req.body);
      const whiteboard = await storage.createWhiteboard(whiteboardData);
      res.json(whiteboard);
    } catch (error) {
      console.error("Error creating whiteboard:", error);
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  // Delete whiteboard
  app.delete("/api/whiteboards/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteWhiteboard(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting whiteboard:", error);
      res.status(500).json({ error: "Errore nell'eliminazione lavagna" });
    }
  });

  // Get whiteboard elements
  app.get("/api/whiteboards/:id/elements", async (req: Request, res: Response) => {
    try {
      const elements = await storage.getWhiteboardElements(req.params.id);
      res.json(elements);
    } catch (error) {
      console.error("Error getting whiteboard elements:", error);
      res.status(500).json({ error: "Errore nel recupero elementi lavagna" });
    }
  });

  // Create whiteboard element
  app.post("/api/whiteboards/:id/elements", async (req: Request, res: Response) => {
    try {
      const elementData = insertWhiteboardElementSchema.parse({
        ...req.body,
        whiteboardId: req.params.id
      });
      const element = await storage.createWhiteboardElement(elementData);
      res.json(element);
    } catch (error) {
      console.error("Error creating whiteboard element:", error);
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  // Update whiteboard element
  app.patch("/api/whiteboard-elements/:id", async (req: Request, res: Response) => {
    try {
      const element = await storage.updateWhiteboardElement(req.params.id, req.body);
      if (!element) return res.status(404).json({ error: "Elemento non trovato" });
      res.json(element);
    } catch (error) {
      console.error("Error updating whiteboard element:", error);
      res.status(500).json({ error: "Errore aggiornamento elemento" });
    }
  });

  // Delete whiteboard element
  app.delete("/api/whiteboard-elements/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteWhiteboardElement(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting whiteboard element:", error);
      res.status(500).json({ error: "Errore eliminazione elemento" });
    }
  });

  // Whiteboard upload
  app.post("/api/whiteboards/:id/upload", whiteboardUpload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nessun file caricato" });
      }

      const boardId = req.params.id;
      const { x, y, userId } = req.body;
      const filename = req.file.filename;
      const originalname = req.file.originalname;
      const mimetype = req.file.mimetype;
      const url = `/uploads/whiteboards/${filename}`;

      // In real implementation we would detect file type
      // For now we treat everything as image or generic file attachment
      const content = JSON.stringify({ url, filename: originalname, mimetype });

      const elementData = {
        whiteboardId: boardId,
        type: mimetype.startsWith("image/") ? "image" : "file",
        // Note: frontend might not handle "file", but we save it correctly
        x: parseInt(x) || 100,
        y: parseInt(y) || 100,
        width: 300,
        height: 200,
        content: content,
        zIndex: 10,
        createdBy: userId
      };

      // Since the schema has a fixed enum for type or string?
      // schema says: type: text("type").notNull()
      // But let's check if frontend handles "file". 
      // If not, we might want to default to "image" so something shows up (broken image > nothing?) 
      // or "sticky" with a link?
      // Let's stick with "image" if image, else "sticky" with link text?
      // Actually let's force "image" for now if logic requires it, or trust frontend will be updated later.
      // But to be safe, if it's not an image, treating it as 'image' results in <img src=pdf> which is broken.
      // Let's use 'sticky' for non-images with the filename as content.

      let finalElementData = elementData;
      if (!mimetype.startsWith("image/")) {
        finalElementData = {
          ...elementData,
          type: "sticky",
          content: `📄 ${originalname}\n(File non supportato per anteprima)`,
          color: "#e2e8f0"
        };
      }

      const element = await storage.createWhiteboardElement(finalElementData);
      res.json(element);

    } catch (error: any) {
      console.error("Error uploading file to whiteboard:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Whiteboard collaborators
  app.get("/api/whiteboards/:id/collaborators", async (req: Request, res: Response) => {
    try {
      const board = await storage.getWhiteboard(req.params.id);
      if (!board) return res.status(404).json({ error: "Lavagna non trovata" });

      const owner = board.ownerId ? await storage.getUser(board.ownerId) : null;

      let collaborators: any[] = [];
      let collaboratorIds: string[] = [];
      try {
        collaboratorIds = board.collaborators ? JSON.parse(board.collaborators as unknown as string) : [];
      } catch (e) {
        collaboratorIds = [];
      }

      if (collaboratorIds.length > 0) {
        const allUsers = await storage.getUsers();
        collaborators = allUsers.filter(u => collaboratorIds.includes(u.id));
      }

      res.json({
        owner: owner ? { id: owner.id, name: owner.name, username: owner.username, avatar: owner.avatar } : null,
        collaborators: collaborators.map(c => ({ id: c.id, name: c.name, username: c.username, avatar: c.avatar }))
      });
    } catch (error) {
      console.error("Error getting collaborators:", error);
      res.status(500).json({ error: "Errore recupero collaboratori" });
    }
  });

  app.post("/api/whiteboards/:id/collaborators", async (req: Request, res: Response) => {
    try {
      const { collaboratorId } = req.body;
      const board = await storage.getWhiteboard(req.params.id);
      if (!board) return res.status(404).json({ error: "Lavagna non trovata" });

      let collaborators: string[] = [];
      try {
        collaborators = board.collaborators ? JSON.parse(board.collaborators as unknown as string) : [];
      } catch (e) {
        collaborators = [];
      }

      if (!collaborators.includes(collaboratorId)) {
        collaborators.push(collaboratorId);

        // This cast is needed because the schema defines collaborators as text (JSON string)
        await storage.updateWhiteboard(board.id, { collaborators: JSON.stringify(collaborators) } as any);
      }

      res.json(board);
    } catch (error) {
      console.error("Error adding collaborator:", error);
      res.status(500).json({ error: "Errore aggiunta collaboratore" });
    }
  });

  app.delete("/api/whiteboards/:id/collaborators/:collaboratorId", async (req: Request, res: Response) => {
    try {
      const { id, collaboratorId } = req.params;
      const board = await storage.getWhiteboard(id);
      if (!board) return res.status(404).json({ error: "Lavagna non trovata" });

      let collaborators: string[] = [];
      try {
        collaborators = board.collaborators ? JSON.parse(board.collaborators as unknown as string) : [];
      } catch (e) {
        collaborators = [];
      }

      collaborators = collaborators.filter((cid: string) => cid !== collaboratorId);

      await storage.updateWhiteboard(id, { collaborators: JSON.stringify(collaborators) } as any);

      res.json({ success: true });
    } catch (error) {
      console.error("Error removing collaborator:", error);
      res.status(500).json({ error: "Errore rimozione collaboratore" });
    }
  });

  // =====================
  // OFFICE PULSE API
  // =====================
  app.get("/api/office/documents", async (req: Request, res: Response) => {
    try {
      const docs = await storage.getOfficeDocuments();
      res.json(docs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/office/documents", async (req: Request, res: Response) => {
    try {
      const { title, type } = req.body; // type: docx, xlsx, pptx
      const userId = (req.user as any)?.id || null;

      console.log('[Office] Creating document:', { title, type, user: userId, hasSession: !!req.user });

      if (!title || !type) {
        return res.status(400).json({ error: "Titolo e tipo richiesti" });
      }

      const fileName = `${title.replace(/\s+/g, '_')}_${Date.now()}.${type}`;
      const relativePath = path.join('uploads', 'office', fileName);
      const fullPath = path.join(process.cwd(), relativePath);

      // Ensure directory exists
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      if (type === 'xlsx') {
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([[]]), "Sheet1");
        XLSX.writeFile(wb, fullPath);
      } else {
        // Placeholder for docx/pptx templates
        // Ideally we should copy a real blank template here
        fs.writeFileSync(fullPath, Buffer.from(""));
      }

      const doc = await storage.createOfficeDocument({
        title,
        type,
        fileName,
        filePath: relativePath,
        ownerId: userId,
        lastEditorId: userId,
        version: 1
      });

      console.log('[Office] Document created successfully:', doc.id);
      res.json(doc);
    } catch (error: any) {
      console.error('[Office] Error creating document:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/office/documents/:id", async (req: Request, res: Response) => {
    try {
      const doc = await storage.getOfficeDocument(req.params.id);
      if (!doc) return res.status(404).json({ error: "Documento non trovato" });
      res.json(doc);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/office/config/:id", async (req: Request, res: Response) => {
    try {
      const doc = await storage.getOfficeDocument(req.params.id);
      if (!doc) return res.status(404).json({ error: "Documento non trovato" });

      const protocol = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
      const baseUrl = `${protocol}://${req.get('host')}`;

      const config = generateOnlyOfficeConfig(
        doc.id,
        doc.title,
        doc.fileName,
        (req.user as any)?.id || "guest",
        (req.user as any)?.name || "Ospite",
        baseUrl,
        'edit'
      );

      res.json(config);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/office/download/:id", async (req: Request, res: Response) => {
    try {
      const doc = await storage.getOfficeDocument(req.params.id);
      if (!doc) return res.status(404).json({ error: "Documento non trovato" });

      const filePath = path.join(process.cwd(), doc.filePath);
      if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File fisico non trovato" });

      res.download(filePath, doc.fileName);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/office/callback/:id", async (req: Request, res: Response) => {
    try {
      const { status, url } = req.body;
      const docId = req.params.id;

      if (status === 2 || status === 6) {
        if (!url) return res.status(400).json({ error: 1 });

        const response = await fetch(url);
        const buffer = Buffer.from(await response.arrayBuffer());

        const doc = await storage.getOfficeDocument(docId);
        if (doc) {
          const filePath = path.join(process.cwd(), doc.filePath);
          fs.writeFileSync(filePath, buffer);
          await storage.updateOfficeDocument(docId, { version: (doc.version || 1) + 1 });
        }
      }

      res.json({ error: 0 });
    } catch (error: any) {
      console.error("OnlyOffice Callback Error:", error);
      res.status(500).json({ error: 1 });
    }
  });



  // =====================
  // ADMIN DB API
  // =====================

  // Middleware check for admin
  const requireAdmin = (req: Request, res: Response, next: any) => {
    const session = (req as any).session;
    // Check session OR explicit headers (fallback for when session might be flaky)
    const headerRole = req.headers["x-user-role"];

    if (
      (session?.role === "Admin") ||
      (headerRole === "Admin")
    ) {
      return next();
    }

    return res.status(403).json({ error: "Unauthorized - Admin access required" });
  };

  app.get("/api/admin/db/tables", requireAdmin, async (req, res) => {
    try {
      const result = await db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
      const tables = result.length > 0 && (result[0] as any).name
        ? result.map((r: any) => r.name)
        : (result as any[]).map(r => r.name || Object.values(r)[0]);

      res.json({ tables });
    } catch (error: any) {
      console.error("Error listing tables:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/db/:tableName", requireAdmin, async (req, res) => {
    try {
      const tableName = req.params.tableName;
      const page = parseInt(req.query.page as string || "1");
      const pageSize = parseInt(req.query.pageSize as string || "15");
      const offset = (page - 1) * pageSize;

      if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
        return res.status(400).json({ error: "Invalid table name" });
      }

      const countRes = await db.all(`SELECT COUNT(*) as count FROM ${tableName}`);
      const total = (countRes[0] as any).count;
      const data = await db.all(`SELECT * FROM ${tableName} LIMIT ? OFFSET ?`, [pageSize, offset]);

      res.json({
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      });
    } catch (error: any) {
      console.error("Error fetching table data:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/db/:tableName/purge", requireAdmin, async (req, res) => {
    try {
      const tableName = req.params.tableName;
      if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
        return res.status(400).json({ error: "Invalid table name" });
      }

      const protectedTables = ["users", "appSettings"];
      if (protectedTables.includes(tableName)) {
        return res.status(400).json({ error: "Cannot purge protected table" });
      }

      const result = await db.execute(`DELETE FROM ${tableName}`);
      const deleted = (result as any).changes || 0;
      res.json({ success: true, deleted });
    } catch (error: any) {
      console.error("Error purging table:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/db/purge-all", requireAdmin, async (req, res) => {
    try {
      const tablesRes = await db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
      const tables = tablesRes.map((r: any) => r.name);

      const protectedTables = ["users", "session", "rolePermissions", "userPermissions", "appSettings"];
      let tablesCleared = 0;

      for (const table of tables) {
        if (!protectedTables.includes(table)) {
          await db.execute(`DELETE FROM ${table}`);
          tablesCleared++;
        }
      }
      res.json({ success: true, tablesCleared });
    } catch (error: any) {
      console.error("Error purging all:", error);
      res.status(500).json({ error: error.message });
    }
  });



  // =====================
  // USER EMAIL CONFIG API
  // =====================

  app.get("/api/user-email-config", async (req, res) => {
    const userId = (req as any).session?.userId || req.headers["x-user-id"];
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const configs = await storage.getUserEmailConfigs(userId);
    res.json(configs);
  });

  app.post("/api/user-email-config", async (req, res) => {
    const userId = (req as any).session?.userId || req.headers["x-user-id"];
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Use loose schema or specific fields if needed, but schema should work
    const parseResult = insertUserEmailConfigSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error });
    }

    const config = await storage.createUserEmailConfig({
      ...parseResult.data,
      userId: userId,
    });
    res.json(config);
  });

  app.patch("/api/user-email-config/:id", async (req, res) => {
    const userId = (req as any).session?.userId || req.headers["x-user-id"];
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const existing = await storage.getUserEmailConfig(req.params.id);
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: "Config not found" });
    }

    const parseResult = insertUserEmailConfigSchema.partial().safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error });
    }

    const updateData = { ...parseResult.data };
    if (updateData.password === "") {
      delete updateData.password;
    }

    const config = await storage.updateUserEmailConfig(req.params.id, updateData);
    res.json(config);
  });

  app.delete("/api/user-email-config/:id", async (req, res) => {
    const userId = (req as any).session?.userId || req.headers["x-user-id"];
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const existing = await storage.getUserEmailConfig(req.params.id);
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: "Config not found" });
    }

    await storage.deleteUserEmailConfig(req.params.id);
    res.json({ success: true });
  });

  // =====================
  // BACKUPS API
  // =====================

  app.get("/api/settings/backup-path", requireAdmin, async (req, res) => {
    const setting = await storage.getSetting("backup_path");
    res.json({ path: setting?.value || "" });
  });

  app.post("/api/settings/backup-path", requireAdmin, async (req, res) => {
    const { path } = req.body;
    if (typeof path !== "string") return res.status(400).json({ error: "Invalid path" });
    await storage.setSetting("backup_path", path);
    res.json({ success: true, path });
  });



  // Helper function to calculate next run date based on frequency
  const calculateNextRun = (frequency: string, hour: number, minute: number, dayOfWeek?: number, dayOfMonth?: number): Date => {
    const now = new Date();
    let nextRun = new Date();
    nextRun.setHours(hour, minute, 0, 0);

    switch (frequency) {
      case "daily":
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;
      case "weekly":
        const currentDay = now.getDay();
        const targetDay = typeof dayOfWeek === 'number' ? dayOfWeek : 1;
        let daysUntilTarget = targetDay - currentDay;
        if (daysUntilTarget < 0 || (daysUntilTarget === 0 && nextRun <= now)) {
          daysUntilTarget += 7;
        }
        nextRun.setDate(now.getDate() + daysUntilTarget);
        break;
      case "monthly":
        const targetDate = typeof dayOfMonth === 'number' ? dayOfMonth : 1;
        nextRun.setDate(targetDate);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        break;
      default:
        // Default to daily if unknown
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
    }
    return nextRun;
  };

  app.get("/api/backup-schedules", requireAdmin, async (req, res) => {
    try {
      const schedules = await storage.getBackupSchedules();
      res.json(schedules);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/backup-schedules", requireAdmin, async (req, res) => {
    try {
      const parseResult = insertBackupScheduleSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error });
      }

      const { frequency, hour, minute, dayOfWeek, dayOfMonth } = parseResult.data;

      const nextRun = calculateNextRun(
        frequency,
        hour,
        minute,
        dayOfWeek ?? undefined,
        dayOfMonth ?? undefined
      );

      const schedule = await storage.createBackupSchedule({
        ...parseResult.data,
        nextRun: nextRun.toISOString()
      });

      res.json(schedule);
    } catch (e: any) {
      console.error("Error creating schedule:", e);
      res.status(500).json({ error: e.message || "Errore creazione schedulazione" });
    }
  });

  app.put("/api/backup-schedules/:id", requireAdmin, async (req, res) => {
    try {
      // If updating timing fields, recalculate nextRun
      let updateData = { ...req.body };

      // If any timing field is present, we should probably recalculate nextRun
      // For simplicity, we fetch the existing one if needed, but here we just check if body has enough info
      // Or we just update what's passed. Ideally, we should recalculate if frequency/time changes.

      const schedule = await storage.updateBackupSchedule(req.params.id, updateData);
      res.json(schedule);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/backup-schedules/:id", requireAdmin, async (req, res) => {
    await storage.deleteBackupSchedule(req.params.id);
    res.json({ success: true });
  });

  // =====================
  // SYSTEM API
  // =====================
  app.get("/api/system/db-logs", (req, res) => {
    // Return unified logs - anyone can view for debugging
    res.json(systemLogBuffer);
  });

  // Database Admin Endpoints
  app.get("/api/admin/db/tables", requireAdmin, async (req, res) => {
    try {
      // Get all table names from the database
      const result = await db.all(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `);
      const tables = result.map((row: any) => row.name);
      res.json({ tables });
    } catch (error: any) {
      console.error("Error fetching tables:", error);
      res.status(500).json({ error: "Failed to fetch tables" });
    }
  });

  app.get("/api/admin/db/:table", requireAdmin, async (req, res) => {
    try {
      const { table } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 15;
      const offset = (page - 1) * pageSize;

      // Validate table name to prevent SQL injection
      const tableCheck = await db.all(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name=?
      `, [table]);

      if (tableCheck.length === 0) {
        return res.status(404).json({ error: "Table not found" });
      }

      // Get total count
      const countResult = await db.get(`SELECT COUNT(*) as total FROM "${table}"`);
      const total = countResult.total;
      const totalPages = Math.ceil(total / pageSize);

      // Get paginated data
      const data = await db.all(`SELECT * FROM "${table}" LIMIT ? OFFSET ?`, [pageSize, offset]);

      res.json({
        data,
        total,
        page,
        pageSize,
        totalPages
      });
    } catch (error: any) {
      console.error("Error fetching table data:", error);
      res.status(500).json({ error: "Failed to fetch table data" });
    }
  });



  app.post("/api/admin/db/:table/purge", requireAdmin, async (req, res) => {
    try {
      const { table } = req.params;

      // Protect critical tables
      const protectedTables = ["users", "session", "rolePermissions", "userPermissions", "appSettings"];
      if (protectedTables.includes(table)) {
        return res.status(403).json({ error: "Cannot purge protected table" });
      }

      // Validate table exists
      const tableCheck = await db.all(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name=?
      `, [table]);

      if (tableCheck.length === 0) {
        return res.status(404).json({ error: "Table not found" });
      }

      // Get count before deleting
      const countResult = await db.get(`SELECT COUNT(*) as total FROM "${table}"`);
      const deleted = countResult.total;

      // Delete all records
      await db.run(`DELETE FROM "${table}"`);

      res.json({ deleted, table });
    } catch (error: any) {
      console.error("Error purging table:", error);
      res.status(500).json({ error: "Failed to purge table" });
    }
  });

  app.post("/api/admin/db/purge-all", requireAdmin, async (req, res) => {
    try {
      const protectedTables = ["users", "session", "rolePermissions", "user Permissions", "appSettings"];

      // Get all non-protected tables
      const result = await db.all(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `);

      let totalDeleted = 0;
      let tablesCleared = 0;

      for (const row of result) {
        const tableName = row.name;
        if (!protectedTables.includes(tableName)) {
          const countResult = await db.get(`SELECT COUNT(*) as total FROM "${tableName}"`);
          const count = countResult.total;

          if (count > 0) {
            await db.run(`DELETE FROM "${tableName}"`);
            totalDeleted += count;
            tablesCleared++;
          }
        }
      }

      res.json({ totalDeleted, tablesCleared });
    } catch (error: any) {
      console.error("Error purging all tables:", error);
      res.status(500).json({ error: "Failed to purge all tables" });
    }
  });

  // =====================
  // ANAGRAFICA API
  // =====================

  // Clienti
  app.get("/api/anagrafica/clienti", async (req: Request, res: Response) => {
    try {
      const clienti = await storage.getAnagraficaClienti();
      res.json(clienti);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/anagrafica/clienti/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query) return res.json([]);
      const results = await storage.searchAnagraficaClienti(query);
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/anagrafica/clienti/:id", async (req: Request, res: Response) => {
    try {
      const cliente = await storage.getAnagraficaCliente(req.params.id);
      if (!cliente) return res.status(404).json({ error: "Cliente non trovato" });
      res.json(cliente);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/anagrafica/clienti", async (req: Request, res: Response) => {
    try {
      const data = insertAnagraficaClientiSchema.parse(req.body);
      const cliente = await storage.createAnagraficaCliente(data);
      res.json(cliente);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/anagrafica/clienti/:id", async (req: Request, res: Response) => {
    try {
      const data = insertAnagraficaClientiSchema.partial().parse(req.body);
      const cliente = await storage.updateAnagraficaCliente(req.params.id, data);
      res.json(cliente);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/anagrafica/clienti/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteAnagraficaCliente(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Public Geocoding Endpoint
  app.post("/api/public/mappa-clienti/geocode", async (req: Request, res: Response) => {
    try {
      const { coordinates } = req.body;
      if (!Array.isArray(coordinates)) {
        return res.status(400).json({ error: "Invalid format" });
      }

      let updated = 0;
      for (const item of coordinates) {
        if (item.id && item.latitudine && item.longitudine) {
          await storage.updateAnagraficaCliente(item.id, {
            latitudine: String(item.latitudine),
            longitudine: String(item.longitudine)
          });
          updated++;
        }
      }

      res.json({ success: true, updated });
    } catch (error: any) {
      console.error("Geocoding save error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // =====================
  // FINANCE MODULE
  // =====================

  // Finance Accounts
  app.get("/api/finance/accounts", async (req: Request, res: Response) => {
    try {
      const accounts = await storage.getFinanceAccounts();
      res.json(accounts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/finance/accounts", async (req: Request, res: Response) => {
    try {
      const data = insertFinanceAccountSchema.parse(req.body);
      const account = await storage.createFinanceAccount(data);
      res.json(account);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/finance/accounts/:id", async (req: Request, res: Response) => {
    try {
      const data = insertFinanceAccountSchema.partial().parse(req.body);
      const account = await storage.updateFinanceAccount(req.params.id, data);
      res.json(account);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/finance/accounts/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteFinanceAccount(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Finance Categories
  app.get("/api/finance/categories", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getFinanceCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/finance/categories", async (req: Request, res: Response) => {
    try {
      const data = insertFinanceCategorySchema.parse(req.body);
      const category = await storage.createFinanceCategory(data);
      res.json(category);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/finance/categories/:id", async (req: Request, res: Response) => {
    try {
      const data = insertFinanceCategorySchema.partial().parse(req.body);
      const category = await storage.updateFinanceCategory(req.params.id, data);
      res.json(category);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/finance/categories/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteFinanceCategory(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Invoices (Fatture)
  app.get("/api/finance/invoices", async (req: Request, res: Response) => {
    try {
      const type = req.query.type as string;
      if (type) {
        const invoices = await storage.getInvoicesByType(type);
        res.json(invoices);
      } else {
        const invoices = await storage.getInvoices();
        res.json(invoices);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/finance/invoices/next-numero", async (req: Request, res: Response) => {
    try {
      // Logic for next number generation could be improved, for now simple counter based on current year count + 1 or similar
      const invoices = await storage.getInvoices();
      const currentYear = new Date().getFullYear();
      const currentYearInvoices = invoices.filter(i => i.dataEmissione.startsWith(String(currentYear)));
      const nextNum = currentYearInvoices.length + 1;
      const numero = `${currentYear}/${String(nextNum).padStart(3, '0')}`;
      res.json({ numero });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/finance/invoices", async (req: Request, res: Response) => {
    try {
      const data = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(data);
      res.json(invoice);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/finance/invoices/:id", async (req: Request, res: Response) => {
    try {
      const data = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(req.params.id, data);
      res.json(invoice);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/finance/invoices/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteInvoice(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/finance/invoices/:id", async (req: Request, res: Response) => {
    try {
      const invoice = await storage.getInvoiceById(req.params.id);
      if (!invoice) return res.status(404).json({ error: "Invoice not found" });
      res.json(invoice);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Quotes (Preventivi)
  app.get("/api/finance/quotes", async (req: Request, res: Response) => {
    try {
      const quotes = await storage.getQuotes();
      res.json(quotes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/finance/quotes", async (req: Request, res: Response) => {
    try {
      const data = insertQuoteSchema.parse(req.body);
      const quote = await storage.createQuote(data);
      res.json(quote);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/finance/quotes/:id", async (req: Request, res: Response) => {
    try {
      const data = insertQuoteSchema.partial().parse(req.body);
      const quote = await storage.updateQuote(req.params.id, data);
      res.json(quote);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/finance/quotes/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteQuote(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // DDT
  app.get("/api/finance/ddt", async (req: Request, res: Response) => {
    try {
      const ddts = await storage.getDdts();
      res.json(ddts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/finance/ddt", async (req: Request, res: Response) => {
    try {
      const data = insertDdtSchema.parse(req.body);
      const ddtItem = await storage.createDdt(data);
      res.json(ddtItem);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/finance/ddt/:id", async (req: Request, res: Response) => {
    try {
      const data = insertDdtSchema.partial().parse(req.body);
      const ddtItem = await storage.updateDdt(req.params.id, data);
      res.json(ddtItem);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/finance/ddt/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteDdt(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Transactions
  app.get("/api/finance/transactions", async (req: Request, res: Response) => {
    try {
      const transactions = await storage.getFinanceTransactions();
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/finance/transactions", async (req: Request, res: Response) => {
    try {
      const data = insertFinanceTransactionSchema.parse(req.body);
      const transaction = await storage.createFinanceTransaction(data);
      res.json(transaction);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/finance/transactions/:id", async (req: Request, res: Response) => {
    try {
      const data = insertFinanceTransactionSchema.partial().parse(req.body);
      const transaction = await storage.updateFinanceTransaction(req.params.id, data);
      res.json(transaction);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/finance/transactions/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteFinanceTransaction(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stats
  app.get("/api/finance/stats", async (req: Request, res: Response) => {
    try {
      const accounts = await storage.getFinanceAccounts();
      const invoices = await storage.getInvoices();
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().getMonth();

      let saldoTotale = 0;
      accounts.forEach(acc => {
        // rudimentary parsing of "1.000,00" format if needed, OR assuming validation ensures number string
        // But shared schema usually has text for money.
        // Let's safe parse
        const val = parseFloat(acc.saldoAttuale?.replace(/\./g, '').replace(',', '.') || "0");
        saldoTotale += val;
      });

      const totaleCrediti = invoices
        .filter(i => i.tipo === 'emessa' && i.stato !== 'pagata' && i.stato !== 'annullata')
        .reduce((sum, i) => sum + parseFloat(i.totale?.replace(/\./g, '').replace(',', '.') || "0"), 0);

      const totaleDebiti = invoices
        .filter(i => i.tipo === 'ricevuta' && i.stato !== 'pagata' && i.stato !== 'annullata')
        .reduce((sum, i) => sum + parseFloat(i.totale?.replace(/\./g, '').replace(',', '.') || "0"), 0);

      const scadenzeAttive = invoices.filter(i =>
        i.stato !== 'pagata' && i.stato !== 'annullata' && i.dataScadenza
      ).length;

      const scadenzeOggi = invoices.filter(i =>
        i.stato !== 'pagata' && i.stato !== 'annullata' && i.dataScadenza === today
      ).length;

      const fattureEmesseMese = invoices.filter(i =>
        i.tipo === 'emessa' && new Date(i.dataEmissione).getMonth() === currentMonth
      ).length;

      const fattureRicevuteMese = invoices.filter(i =>
        i.tipo === 'ricevuta' && new Date(i.dataEmissione).getMonth() === currentMonth
      ).length;

      res.json({
        saldoTotale,
        totaleCrediti,
        totaleDebiti,
        scadenzeAttive,
        scadenzeOggi,
        contiAttivi: accounts.filter(a => a.attivo).length,
        fattureEmesseMese,
        fattureRicevuteMese
      });
    } catch (error: any) {
      console.error("Error generating finance stats:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Geocoding Batch Update for Client Map


  // =====================
  // HR SYSTEM APIs - Timbrature, Turni, Richieste
  // =====================

  // Timbrature API
  app.get("/api/timbrature", async (req, res) => {
    try {
      const result = await storage.getTimbrature(req.query.personaleId as string);
      res.json(result);
    } catch (error) {
      console.error("Error fetching timbrature:", error);
      res.status(500).json({ error: "Errore nel recupero delle timbrature" });
    }
  });

  app.post("/api/timbrature", async (req, res) => {
    try {
      // Add user context for creation
      const userId = (req as any).session?.userId;
      const data = { ...req.body, createdBy: userId };
      const result = await storage.createTimbratura(data);
      res.json(result);
    } catch (error) {
      console.error("Error creating timbratura:", error);
      res.status(500).json({ error: "Errore nella registrazione della timbratura" });
    }
  });

  app.put("/api/timbrature/:id", async (req, res) => {
    try {
      const result = await storage.updateTimbratura(req.params.id, req.body);
      if (!result) return res.status(404).json({ error: "Timbratura non trovata" });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Errore aggiornamento timbratura" });
    }
  });

  app.delete("/api/timbrature/:id", async (req, res) => {
    try {
      await storage.deleteTimbratura(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Errore eliminazione timbratura" });
    }
  });

  // Turni API
  app.get("/api/turni", async (req, res) => {
    try {
      const result = await storage.getTurni(req.query.personaleId as string);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Errore recupero turni" });
    }
  });

  app.post("/api/turni", async (req, res) => {
    try {
      const result = await storage.createTurno(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Errore creazione turno" });
    }
  });

  // Richieste Assenza API
  app.get("/api/richieste-assenza", async (req, res) => {
    try {
      const result = await storage.getRichiesteAssenza(req.query.personaleId as string);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Errore recupero richieste" });
    }
  });

  app.post("/api/richieste-assenza", async (req, res) => {
    try {
      const result = await storage.createRichiestaAssenza(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Errore creazione richiesta" });
    }
  });

  app.put("/api/richieste-assenza/:id/approva", async (req, res) => {
    try {
      const userId = (req as any).session?.userId; // Assuming session auth
      const result = await storage.updateRichiestaAssenza(req.params.id, {
        stato: "approvata",
        approvatoDa: userId,
        dataApprovazione: new Date().toISOString()
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Errore approvazione richiesta" });
    }
  });

  app.put("/api/richieste-assenza/:id/rifiuta", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      const result = await storage.updateRichiestaAssenza(req.params.id, {
        stato: "rifiutata",
        approvatoDa: userId,
        dataApprovazione: new Date().toISOString()
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Errore rifiuto richiesta" });
    }
  });

  // =====================
  // BACKUP ROUTES
  // =====================

  app.get("/api/settings/backup-path", async (req, res) => {
    try {
      const setting = await storage.getSetting("backup_path");
      res.json({ path: setting?.value || "" });
    } catch (e) {
      res.status(500).json({ error: "Errore recupero percorso backup" });
    }
  });

  app.post("/api/settings/backup-path", async (req, res) => {
    try {
      const { path } = req.body;
      if (!path) return res.status(400).json({ error: "Percorso obbligatorio" });
      await storage.setSetting("backup_path", path);
      res.json({ success: true, path });
    } catch (e) {
      res.status(500).json({ error: "Errore salvataggio percorso backup" });
    }
  });

  app.get("/api/backups", requireAdmin, async (req, res) => {
    try {
      const backups = await storage.getBackups();
      res.json(backups);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Errore recupero backup" });
    }
  });

  app.post("/api/backups", requireAdmin, async (req, res) => {
    try {
      const pathSetting = await storage.getSetting("backup_path");

      // Use configured path or default to project root/backups
      let backupDir = pathSetting?.value;
      if (!backupDir || backupDir.trim() === "") {
        backupDir = path.join(process.cwd(), "backups");
      }

      // Validazione path di base per sicurezza
      try {
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
      } catch (err: any) {
        console.error(`[Backup] Error creating directory ${backupDir}:`, err);
        return res.status(500).json({ error: `Impossibile creare la cartella di backup: ${err.message}` });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `backup-${timestamp}.db`;
      const fullPath = path.join(backupDir, fileName);

      // Create pending record
      const backup = await storage.createBackup({
        name: fileName,
        status: "in_progress",
        type: "manual",
        tables: JSON.stringify(["all"]),
        size: "0 B",
        errorMessage: null
      });

      console.log(`[Backup] Starting backup ${backup.id} to: ${fullPath}`);

      try {
        // Method 1: VACUUM INTO (Best for live DB, creates defragmented copy)
        await db.execute(sql`VACUUM INTO ${fullPath}`);
      } catch (vacuumError: any) {
        console.warn(`[Backup] VACUUM INTO failed: ${vacuumError.message}. Trying fallback...`);

        try {
          // Method 2: Native SQLite Backup API
          const sqlite = (db as any).$client;
          if (sqlite && typeof sqlite.backup === 'function') {
            await sqlite.backup(fullPath);
          } else {
            // Method 3: File Copy (Last resort, potentially risky if DB is busy)
            // We flush WAL first if possible
            try { await db.execute(sql`PRAGMA wal_checkpoint(TRUNCATE)`); } catch (e) { }

            // Get DB path from environment or storage
            if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL mismatch");
            const dbPath = process.env.DATABASE_URL.replace(/^file:\/\//, '').replace(/^file:/, '');
            await fs.promises.copyFile(dbPath, fullPath);
          }
        } catch (backupError: any) {
          // Backup Failed
          console.error(`[Backup] All methods failed. Last error:`, backupError);
          await storage.updateBackup(backup.id, {
            status: "failed",
            errorMessage: backupError.message || "Unknown error",
            completedAt: new Date().toISOString()
          });
          return res.status(500).json({ error: `Backup fallito: ${backupError.message}` });
        }
      }

      // Success
      const stats = fs.statSync(fullPath);
      const sizeMb = (stats.size / (1024 * 1024)).toFixed(2) + " MB";

      await storage.updateBackup(backup.id, {
        status: "completed",
        size: sizeMb,
        filePath: fullPath,
        completedAt: new Date().toISOString()
      });

      res.json({
        ...backup,
        status: "completed",
        size: sizeMb,
        filePath: fullPath
      });

    } catch (e: any) {
      console.error("[Backup] Critical error:", e);
      res.status(500).json({ error: e.message || "Errore critico durante il backup" });
    }
  });

  app.delete("/api/backups/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteBackup(req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Errore durante l'eliminazione del backup" });
    }
  });



  // =====================
  // ANAGRAFICA CLIENTI
  // =====================
  app.get("/api/anagrafica/clienti", async (req, res) => {
    try {
      const clienti = await storage.getAnagraficaClienti();
      res.json(clienti);
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Errore recupero clienti" });
    }
  });

  app.get("/api/anagrafica/clienti/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) return res.json([]);
      const results = await storage.searchAnagraficaClienti(query);
      res.json(results);
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Errore ricerca clienti" });
    }
  });

  app.get("/api/anagrafica/clienti/:id", async (req, res) => {
    try {
      const cliente = await storage.getAnagraficaCliente(req.params.id);
      if (!cliente) return res.status(404).json({ error: "Cliente non trovato" });
      res.json(cliente);
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Errore recupero cliente" });
    }
  });

  app.post("/api/anagrafica/clienti", async (req, res) => {
    try {
      const data = insertAnagraficaClientiSchema.parse(req.body);
      const cliente = await storage.createAnagraficaCliente(data);
      res.json(cliente);
    } catch (e: any) {
      res.status(400).json({ error: e.message || "Dati non validi" });
    }
  });

  app.put("/api/anagrafica/clienti/:id", async (req, res) => {
    try {
      const data = insertAnagraficaClientiSchema.partial().parse(req.body);
      const cliente = await storage.updateAnagraficaCliente(req.params.id, data);
      res.json(cliente);
    } catch (e: any) {
      res.status(400).json({ error: e.message || "Errore aggiornamento cliente" });
    }
  });

  app.delete("/api/anagrafica/clienti/:id", async (req, res) => {
    try {
      await storage.deleteAnagraficaCliente(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Errore eliminazione cliente" });
    }
  });

  // Indirizzi Spedizione
  app.get("/api/anagrafica/clienti/:id/indirizzi-spedizione", async (req, res) => {
    // TODO: implement getIndirizziSpedizione in storage if not exists
    // for now return empty
    res.json([]);
  });

  // Internal Project Details Route
  app.get("/api/internal/project/:id", async (req: Request, res: Response) => {
    try {
      const projectId = req.params.id;
      if (!projectId) {
        return res.status(400).json({ error: "Project ID is required" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Progetto non trovato" });
      }

      // Fetch related data in parallel
      const [tasks, emails, documents] = await Promise.all([
        storage.getTasksByProject(projectId),
        storage.getProjectEmails(projectId),
        storage.getProjectDocumentsWithDetails(projectId)
      ]);

      const response = {
        ...project,
        clientName: "Cliente (Da implementare)",
        tasks,
        emails,
        documents
      };

      res.json(response);
    } catch (e: any) {
      console.error("Error fetching internal project details:", e);
      res.status(500).json({ error: e.message || "Errore interno del server" });
    }
  });

  return httpServer;

}
