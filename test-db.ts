import Database from 'better-sqlite3';
try {
    const db = new Database(':memory:');
    console.log('Better-sqlite3 is working correctly!');
    db.close();
} catch (err) {
    console.error('Better-sqlite3 error:', err);
}
