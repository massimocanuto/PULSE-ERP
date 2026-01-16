import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Extract file path from DATABASE_URL
const dbPath = process.env.DATABASE_URL.replace(/^file:\/\//, '').replace(/^file:/, '');

// Ensure the directory exists
const dbDir = dirname(dbPath);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

// Custom Logger for Drizzle
import { Logger } from "drizzle-orm/logger";

class CustomLogger implements Logger {
  logQuery(query: string, params: any[]): void {
    // We can't easily measure duration here without wrapping the driver, so we omit it or set 0
    logQuery(query, params, 0);
  }
}

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
const baseDb = drizzle(sqlite, { schema, logger: new CustomLogger() });

// Query Logging for "Terminal" view
import { addLog } from "./logStore";

function logQuery(query: string, params?: any, duration?: number) {
  addLog({
    type: 'db',
    message: query.trim(),
    params,
    duration
  });
}

// Compatibility shim for PostgreSQL-style execute calls
export const db = Object.assign(baseDb, {
  all: (query: string, params: any[] = []) => {
    return sqlite.prepare(query).all(params);
  },
  execute: async (query: any) => {
    const start = performance.now();
    try {
      if (typeof query === 'string') {
        const rows = sqlite.prepare(query).all();
        logQuery(query, undefined, Math.round(performance.now() - start));
        return { rows };
      } else if (query && typeof query === 'object' && 'sql' in query) {
        // Handle Drizzle SQL object
        const stmt = sqlite.prepare(query.sql);
        const rows = stmt.all(query.params || []);
        logQuery(query.sql, query.params, Math.round(performance.now() - start));
        return { rows };
      } else {
        // Fallback or if query is something else
        const rows = await (baseDb as any).all(query);
        // Try to log generic queries if possible, though 'query' might not be a string
        logQuery("Generic/Unknown Query Type", undefined, Math.round(performance.now() - start));
        return { rows };
      }
    } catch (error) {
      console.error("db.execute error:", error);
      logQuery(`ERROR: ${error instanceof Error ? error.message : String(error)}`, undefined, Math.round(performance.now() - start));
      throw error;
    }
  }
});
