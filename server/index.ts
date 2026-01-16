import "dotenv/config"; // restart-trigger-1718
import express from "express";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

// Intercept console logs
import { addLog } from "./logStore";
const originalLog = console.log;
const originalError = console.error;

console.log = (...args) => {
  originalLog.apply(console, args);
  addLog({ type: 'stdout', message: args.map(a => String(a)).join(' ') });
};

console.error = (...args) => {
  originalError.apply(console, args);
  addLog({ type: 'stderr', message: args.map(a => String(a)).join(' ') });
};

// Health check - ALWAYS respond immediately
app.get("/health", (_req, res) => res.status(200).send("OK"));

// Root route - short-circuit for health probes
app.get("/", (req, res, next) => {
  const ua = req.headers["user-agent"] || "";
  // Always return OK for health checkers, bots, or during initialization
  if (!appReady || ua.includes("HealthChecker") || ua.includes("curl") || ua.includes("ELB") || ua.includes("Replit")) {
    return res.status(200).send("OK");
  }
  next();
});

let appReady = false;
const port = parseInt(process.env.PORT || "5000", 10);

httpServer.listen({ port, host: "0.0.0.0" }, () => {
  console.log(`${new Date().toLocaleTimeString()} [express] serving on port ${port}`);
  initApp().catch(err => {
    console.error('❌❌❌ CRITICAL ERROR DURING INITIALIZATION:');
    console.error(err);
    console.error('Stack trace:', err.stack);
    process.exit(1);
  });
});

async function initApp() {
  console.log('[DEBUG] Step 1: Starting initialization...');

  try {
    console.log('[DEBUG] Step 2: Importing session...');
    const session = (await import("express-session")).default;

    console.log('[DEBUG] Step 3: Importing routes...');
    const { registerRoutes } = await import("./routes");

    console.log('[DEBUG] Step 4: Importing static...');
    const { serveStatic } = await import("./static");

    console.log('[DEBUG] Step 5: Importing document collaboration...');
    const { setupDocumentCollaboration } = await import("./documentCollaboration");

    console.log('[DEBUG] Step 6: Setting up document collaboration...');
    setupDocumentCollaboration(httpServer);

    // Trust proxy for HTTPS behind Replit's reverse proxy
    if (process.env.NODE_ENV === "production") {
      app.set("trust proxy", 1);
    }

    console.log('[DEBUG] Step 7: Setting up session middleware...');
    // Use memory store for sessions (compatible with SQLite)
    app.use(
      session({
        secret: process.env.SESSION_SECRET || "pulse-erp-secret-key-2024",
        resave: false,
        saveUninitialized: false,
        proxy: process.env.NODE_ENV === "production",
        cookie: {
          secure: process.env.NODE_ENV === "production",
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60 * 1000,
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        },
      })
    );

    console.log('[DEBUG] Step 8: Setting up body parsers...');
    app.use(express.json({ verify: (req: any, _res, buf) => { req.rawBody = buf; } }));
    app.use(express.urlencoded({ extended: false }));

    console.log('[DEBUG] Step 9: Setting up request logger...');
    app.use((req, res, next) => {
      const start = Date.now();
      res.on("finish", () => {
        if (req.path.startsWith("/api")) {
          console.log(`${req.method} ${req.path} ${res.statusCode} in ${Date.now() - start}ms`);
        }
      });
      next();
    });

    console.log('[DEBUG] Step 9.5: Seeding initial user...');
    const { seedInitialUser } = await import("./seed-init");
    await seedInitialUser();

    console.log('[DEBUG] Step 10: Registering routes...');
    await registerRoutes(httpServer, app);

    console.log('[DEBUG] Step 11: Setting up error handler...');
    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
    });

    console.log('[DEBUG] Step 12: Setting up static/vite...');
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }

    appReady = true;
    console.log(`${new Date().toLocaleTimeString()} [express] ✅ Application fully initialized`);
  } catch (error) {
    console.error('❌ Error during initialization:', error);
    throw error;
  }
}

export function log(message: string, source = "express") {
  console.log(`${new Date().toLocaleTimeString()} [${source}] ${message}`);
}

// Global error handlers to prevent crash
process.on('uncaughtException', (err) => {
  console.error('❌❌❌ CRITICAL ERROR (Uncaught Exception):', err);
  console.error('Stack:', err.stack);
  // Do not exit process
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌❌❌ CRITICAL ERROR (Unhandled Rejection):', reason);
  // Do not exit process
});

