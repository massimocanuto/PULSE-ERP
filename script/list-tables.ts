import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "database.sqlite");
const db = new Database(dbPath);

console.log("\n=== LISTA TABELLE NEL DATABASE ===\n");

const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' 
  ORDER BY name
`).all();

console.log("Tabelle trovate:");
tables.forEach((table: any) => {
    console.log(`- ${table.name}`);
});

console.log("\n=== RICERCA TABELLE CON 'NOTE' NEL NOME ===\n");
const noteTables = tables.filter((t: any) => t.name.toLowerCase().includes('note'));
console.log("Tabelle con 'note':");
noteTables.forEach((table: any) => {
    console.log(`- ${table.name}`);

    // Mostra struttura
    const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
    console.log("  Colonne:");
    columns.forEach((col: any) => {
        console.log(`    - ${col.name}: ${col.type}`);
    });
});

db.close();
