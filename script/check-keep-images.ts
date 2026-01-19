import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "database.sqlite");
const db = new Database(dbPath);

console.log("\n=== VERIFICA KEEP NOTES CON IMMAGINI ===\n");

try {
  const notes = db.prepare(`
    SELECT id, title, image_url, content, updatedAt 
    FROM keep_notes 
    ORDER BY updatedAt DESC 
    LIMIT 10
  `).all();

  console.log(`Trovate ${notes.length} note recenti:\n`);

  notes.forEach((note: any) => {
    console.log(`ID: ${note.id}`);
    console.log(`Titolo: ${note.title || '(senza titolo)'}`);
    console.log(`ImageUrl (image_url): ${note.image_url || '(nessuna)'}`);
    console.log(`Content length: ${note.content?.length || 0} chars`);
    console.log(`Updated: ${note.updatedAt}`);
    console.log('---');
  });
} catch (e) {
  console.error("Errore:", e.message);
}

db.close();
