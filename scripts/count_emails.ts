import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "../shared/schema.ts";
import { sql } from "drizzle-orm";
import path from "path";

// Initialize DB
const dbPath = path.resolve(process.cwd(), "data/pulse.db");
const sqlite = new Database(dbPath);
const db = drizzle(sqlite, { schema });

async function check() {
    try {
        const result = await db.select({
            userId: schema.emails.userId,
            count: sql<number>`count(*)`
        }).from(schema.emails).groupBy(schema.emails.userId);
        console.log(JSON.stringify(result, null, 2));
    } catch (e) { console.error(e); }
}
check();
