import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import path from "path";
import fs from "fs";

interface UserSession {
  client: any | null;
  qrCodeData: string;
  isReady: boolean;
  isInitializing: boolean;
  error: string;
}

const userSessions: Map<string, UserSession> = new Map();

function getOrCreateSession(userId: string): UserSession {
  if (!userSessions.has(userId)) {
    userSessions.set(userId, {
      client: null,
      qrCodeData: "",
      isReady: false,
      isInitializing: false,
      error: "",
    });
  }
  return userSessions.get(userId)!;
}

export function getWhatsAppStatus(userId: string) {
  const session = getOrCreateSession(userId);
  return {
    connected: session.isReady,
    initializing: session.isInitializing,
    hasQR: !!session.qrCodeData,
    error: session.error,
  };
}

export function getQRCode(userId: string): string {
  const session = getOrCreateSession(userId);
  return session.qrCodeData;
}

export function isWhatsAppReady(userId: string): boolean {
  const session = getOrCreateSession(userId);
  return session.isReady;
}

export async function initializeWhatsApp(userId: string): Promise<void> {
  const session = getOrCreateSession(userId);

  if (session.client || session.isInitializing) {
    return;
  }

  session.isInitializing = true;
  session.error = "";
  session.qrCodeData = "";

  const authPath = path.join(process.cwd(), ".wwebjs_auth", userId);
  if (!fs.existsSync(authPath)) {
    fs.mkdirSync(authPath, { recursive: true });
  }

  try {
    session.client = new Client({
      authStrategy: new LocalAuth({
        clientId: userId,
        dataPath: path.join(process.cwd(), ".wwebjs_auth"),
      }),
      puppeteer: {
        headless: true,
        // executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--disable-gpu",
          "--start-maximized",
        ],
      },
    });

    session.client.on("qr", async (qr: string) => {
      console.log(`[WhatsApp:${userId}] QR code received`);
      // Return raw QR string - client will render it
      session.qrCodeData = qr;
    });

    session.client.on("ready", () => {
      console.log(`[WhatsApp:${userId}] Client is ready!`);
      try {
        fs.appendFileSync(path.join(process.cwd(), 'whatsapp_debug.log'), `${new Date().toISOString()} - Client is ready!\n`);
      } catch (e) { }
      session.isReady = true;
      session.isInitializing = false;
      session.qrCodeData = "";
    });

    session.client.on("authenticated", () => {
      console.log(`[WhatsApp:${userId}] Authenticated successfully`);
      try {
        fs.appendFileSync(path.join(process.cwd(), 'whatsapp_debug.log'), `${new Date().toISOString()} - Authenticated successfully\n`);
      } catch (e) { }
      // Don't set isReady here, wait for 'ready' event
    });

    session.client.on("auth_failure", (msg: any) => {
      console.error(`[WhatsApp:${userId}] Authentication failure:`, msg);
      try {
        fs.appendFileSync(path.join(process.cwd(), 'whatsapp_debug.log'), `${new Date().toISOString()} - Auth Failure: ${msg}\n`);
      } catch (e) { }
      session.error = "Autenticazione fallita: " + msg;
      session.isInitializing = false;
    });

    session.client.on("disconnected", (reason: any) => {
      console.log(`[WhatsApp:${userId}] Client disconnected:`, reason);
      try {
        fs.appendFileSync(path.join(process.cwd(), 'whatsapp_debug.log'), `${new Date().toISOString()} - Disconnected: ${reason}\n`);
      } catch (e) { }
      session.isReady = false;
      session.client = null;
    });

    session.client.on("message", async (message: any) => {
      console.log(`[WhatsApp:${userId}] Message received:`, message.from, message.body);

      try {
        // Basic implementation: Log to file for debug, skip DB for now to avoid circular deps or complex logic
        // The user just needs to "see" messages, but without DB support in this service, it's hard.
        // However, I will implement a robust DB save if storage is available.
        // Actually, importing storage here might cause circular dependency if storage imports routes imports whatsappService.
        // server/routes.ts imports whatsappService.
        // server/routes.ts imports storage.
        // server/storage.ts DOES NOT import whatsappService.
        // So safe.

        const { storage } = await import("./storage");

        const isGroup = message.from.includes("@g.us");
        const rawPhone = message.from.replace("@c.us", "").replace("@s.whatsapp.net", "").replace("@g.us", "");
        const phone = rawPhone.replace(/\D/g, ""); // Digits only

        // Find or create contact
        // Note: getWhatsappContacts might be expensive, ideally we need getByPhone
        const contacts = await storage.getWhatsappContacts();
        let contact = contacts.find(c => c.phoneNumber === phone);

        if (!contact) {
          contact = await storage.createWhatsappContact({
            name: message._data?.notifyName || phone,
            phoneNumber: phone,
            isGroup: isGroup ? 1 : 0
          });
        }

        // Save message
        await storage.createWhatsappMessage({
          contactId: contact.id,
          content: message.body,
          type: "received"
        });

      } catch (error) {
        console.error(`[WhatsApp:${userId}] Failed to save message:`, error);
      }
    });

    await session.client.initialize();
  } catch (error: any) {
    console.error(`[WhatsApp:${userId}] Initialization error:`, error);
    try {
      fs.appendFileSync(path.join(process.cwd(), 'whatsapp_debug.log'), `${new Date().toISOString()} - Init Error: ${error.message}\nStack: ${error.stack}\n`);
    } catch (e) { }
    session.error = error.message || "Errore inizializzazione";
    session.isInitializing = false;
    session.client = null;
  }
}

export async function sendWhatsAppMessage(
  userId: string,
  phoneNumber: string,
  message: string
): Promise<boolean> {
  const session = getOrCreateSession(userId);

  if (!session.client || !session.isReady) {
    throw new Error("WhatsApp non è connesso");
  }

  try {
    const chatId = phoneNumber.includes("@c.us")
      ? phoneNumber
      : `${phoneNumber.replace(/\D/g, "")}@c.us`;

    await session.client.sendMessage(chatId, message);

    // Save sent message
    try {
      const { storage } = await import("./storage");
      const phone = phoneNumber.replace(/\D/g, "");

      const contacts = await storage.getWhatsappContacts();
      let contact = contacts.find(c => c.phoneNumber === phone);

      if (!contact) {
        contact = await storage.createWhatsappContact({
          name: phone,
          phoneNumber: phone,
          isGroup: 0
        });
      }

      await storage.createWhatsappMessage({
        contactId: contact.id,
        content: message,
        type: "sent"
      });
    } catch (dbError) {
      console.error("Failed to save sent message to DB:", dbError);
      // Don't fail the sending process just because DB save failed
    }

    return true;
  } catch (error: any) {
    console.error(`[WhatsApp:${userId}] Error sending message:`, error);
    throw error;
  }
}

export async function disconnectWhatsApp(userId: string): Promise<void> {
  const session = getOrCreateSession(userId);

  if (session.client) {
    try {
      await session.client.logout();
      await session.client.destroy();
    } catch (error) {
      console.error(`[WhatsApp:${userId}] Error disconnecting:`, error);
    }
    session.client = null;
    session.isReady = false;
    session.qrCodeData = "";
  }

  userSessions.delete(userId);
}

export function getClient(userId: string): any | null {
  const session = getOrCreateSession(userId);
  return session.client;
}
