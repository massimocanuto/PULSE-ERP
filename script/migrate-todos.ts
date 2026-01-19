
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Running migration: Adding updatedAt to personal_todos...");
    try {
        await db.run(sql`ALTER TABLE personal_todos ADD COLUMN updated_at TEXT`);
        console.log("Migration successful!");
    } catch (error) {
        if ((error as any).message.includes("duplicate column name")) {
            console.log("Column already exists.");
        } else {
            console.error("Migration failed:", error);
        }
    }
    process.exit(0);
}

main();
