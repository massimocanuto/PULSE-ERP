import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbPath = path.join(process.cwd(), "database.sqlite");
if (!fs.existsSync(dbPath)) {
    console.log("Database file NOT FOUND at:", dbPath);
    process.exit(1);
}

const db = new Database(dbPath);

console.log("\n=== LISTA TABELLE NEL DATABASE ===\n");

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();

tables.forEach((t: any) => console.log("-", t.name));

db.close();
