import 'dotenv/config';
import { storage } from './server/storage';
import { MODULES, ROLES } from './shared/schema';

async function seedOfficePermissions() {
    try {
        console.log('Seeding office_pulse permissions...');
        for (const role of ROLES) {
            const isAdmin = role === 'Admin';
            const isManager = role === 'Manager';

            await storage.upsertRolePermission(role, 'office_pulse', {
                canView: true,
                canCreate: isAdmin || isManager,
                canEdit: isAdmin || isManager,
                canDelete: isAdmin
            });
            console.log(`- Seeded permissions for ${role}`);
        }
        console.log('Done!');
    } catch (err) {
        console.error('Error seeding permissions:', err);
    }
}

seedOfficePermissions();
