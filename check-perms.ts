import 'dotenv/config';
import { db } from './server/db';
import { rolePermissions } from './shared/schema';
import { eq } from 'drizzle-orm';

async function checkPermissions() {
    try {
        const perms = await db.select().from(rolePermissions).where(eq(rolePermissions.module, 'office_pulse'));
        console.log('Permissions for office_pulse:', JSON.stringify(perms, null, 2));
    } catch (err) {
        console.error('Error checking permissions:', err);
    }
}

checkPermissions();
