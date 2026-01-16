import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "../shared/schema.ts";
import path from "path";

// Initialize DB
const dbPath = path.resolve(process.cwd(), "data/pulse.db");
const sqlite = new Database(dbPath);
const db = drizzle(sqlite, { schema });

async function checkUsers() {
    try {
        const users = await db.select().from(schema.users);
        console.log("Registered Users:", JSON.stringify(users.map(u => ({ id: u.id, username: u.username })), null, 2));
    } catch (e) { console.error(e); }
}
checkUsers();
