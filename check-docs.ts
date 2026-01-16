import 'dotenv/config';
import { db } from './server/db';
import { officeDocuments } from './shared/schema';

async function checkDocs() {
    try {
        const docs = await db.select().from(officeDocuments);
        console.log('Office documents:', JSON.stringify(docs, null, 2));
    } catch (err) {
        console.error('Error checking docs:', err);
    }
}

checkDocs();
