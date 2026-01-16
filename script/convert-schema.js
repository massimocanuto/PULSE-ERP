// Correggi schema per SQLite
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, '..', 'shared', 'schema.ts');
let content = fs.readFileSync(schemaPath, 'utf8');

// Correggi import - rimuovi varchar e timestamp che non esistono in sqlite-core
content = content.replace(
    'import { sqliteTable, text, varchar, timestamp, boolean, integer } from "drizzle-orm/sqlite-core";',
    'import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";'
);

// Sostituisci varchar con text
content = content.replace(/varchar\(/g, 'text(');

// Sostituisci timestamp con text  
content = content.replace(/timestamp\(/g, 'text(');

// Sostituisci boolean con integer (SQLite non ha boolean nativo)
content = content.replace(/boolean\(/g, 'integer(');

// Correggi .default(true) e .default(false) per integer
content = content.replace(/\.default\(true\)/g, '.default(1)');
content = content.replace(/\.default\(false\)/g, '.default(0)');

// Correggi .defaultNow() con stringa
content = content.replace(/\.defaultNow\(\)/g, '');

// Correggi unique() syntax se necessario
// content = content.replace(/\.unique\(\)/g, '');

fs.writeFileSync(schemaPath, content);
console.log('Schema fixed for SQLite!');
