import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'pulse.db');
const db = new Database(dbPath, { readonly: true });

console.log('='.repeat(80));
console.log('DATABASE INSPECTION REPORT');
console.log('='.repeat(80));
console.log(`Database: ${dbPath}`);
console.log('');

// List all tables
console.log('📋 TABELLE NEL DATABASE:');
console.log('-'.repeat(80));
const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' 
  ORDER BY name
`).all();

tables.forEach((table: any, index: number) => {
    console.log(`${index + 1}. ${table.name}`);
});

console.log('');
console.log(`Totale tabelle: ${tables.length}`);
console.log('');

// Check for specific tables we need
console.log('🔍 VERIFICA TABELLE CRITICHE:');
console.log('-'.repeat(80));

const criticalTables = [
    'company_info',
    'azienda_conti_bancari',
    'personal_todos',
    'projects',
    'tasks',
    'keep_notes',
    'anagrafica_clienti',
    'anagrafica_fornitori',
    'anagrafica_personale'
];

criticalTables.forEach(tableName => {
    const exists = tables.find((t: any) => t.name === tableName);
    console.log(`${exists ? '✅' : '❌'} ${tableName}`);
});

console.log('');

// Show schema for missing tables
console.log('📐 SCHEMA TABELLE MANCANTI:');
console.log('-'.repeat(80));

const missingTables = criticalTables.filter(
    tableName => !tables.find((t: any) => t.name === tableName)
);

if (missingTables.length === 0) {
    console.log('✅ Tutte le tabelle critiche sono presenti!');
} else {
    console.log(`❌ Tabelle mancanti: ${missingTables.join(', ')}`);
}

console.log('');

// Check for duplicate or problematic table names
console.log('⚠️  VERIFICA DUPLICATI/PROBLEMI:');
console.log('-'.repeat(80));

const duplicateCheck = db.prepare(`
  SELECT name, COUNT(*) as count 
  FROM sqlite_master 
  WHERE type='table' 
  GROUP BY name 
  HAVING count > 1
`).all();

if (duplicateCheck.length > 0) {
    console.log('❌ Tabelle duplicate trovate:');
    duplicateCheck.forEach((dup: any) => {
        console.log(`  - ${dup.name} (${dup.count} occorrenze)`);
    });
} else {
    console.log('✅ Nessun duplicato trovato');
}

console.log('');
console.log('='.repeat(80));

db.close();
