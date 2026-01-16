import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";
import fs from "fs";

export async function seedInitialUser() {
    console.log('[Seed] Starting initialization...');

    // 1. Run Migrations
    try {
        console.log('[Seed] Running migrations...');

        // Default to CWD/migrations (works in Dev)
        let migrationsFolder = path.join(process.cwd(), "migrations");

        // In Electron Production
        if (process.env.ELECTRON_MODE === 'true') {
            const resourcesPath = process.env.RESOURCES_PATH || (process as any).resourcesPath;
            if (resourcesPath) {
                migrationsFolder = path.join(resourcesPath, 'app', 'migrations');
            }
        }

        console.log(`[Seed] Looking for migrations in: ${migrationsFolder}`);

        await migrate(db, { migrationsFolder });
        console.log('[Seed] Migrations completed successfully.');
    } catch (error) {
        console.error('[Seed] Migration failed:', error);
        // Proceeding might fail if tables don't exist, but we log the error
    }

    // 2. Seed User
    console.log('[Seed] Checking initial user...');
    try {
        const username = "massimo.canuto";
        const password = "1234";

        // Check if user exists
        const existing = await db.select().from(users).where(eq(users.username, username));

        if (existing.length === 0) {
            console.log(`[Seed] Creating user ${username}...`);
            const hashedPassword = await hash(password, 10);

            await db.insert(users).values({
                id: "init-" + Date.now(),
                name: "Massimo Canuto",
                email: "massimo.canuto@pulse-erp.local",
                username: username,
                password: hashedPassword,
                role: "Admin",
                status: "Active"
            });
            console.log(`[Seed] User ${username} created successfully.`);
        } else {
            console.log(`[Seed] User ${username} already exists.`);
        }
    } catch (error) {
        console.error('[Seed] Error seeding initial user:', error);
    }
}
