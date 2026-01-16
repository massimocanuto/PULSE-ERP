import 'dotenv/config';
import { storage } from './server/storage';

async function testCreateOfficeDoc() {
    try {
        // First, get a valid user ID
        const users = await storage.getUsers();
        console.log('Available users:', users.map(u => ({ id: u.id, name: u.name })));
        
        if (users.length === 0) {
            console.error('No users in database!');
            return;
        }

        const userId = users[0].id;
        console.log(`\nUsing user ID: ${userId}`);

        // Try to create a document
        const doc = await storage.createOfficeDocument({
            title: 'Test Doc',
            type: 'xlsx',
            fileName: 'test_123.xlsx',
            filePath: 'uploads/office/test_123.xlsx',
            ownerId: userId,
            lastEditorId: userId,
            version: 1
        });

        console.log('\n✅ Success! Created document:', doc);
    } catch (err: any) {
        console.error('\n❌ Error:', err.message);
        console.error('Stack:', err.stack);
    }
}

testCreateOfficeDoc();
