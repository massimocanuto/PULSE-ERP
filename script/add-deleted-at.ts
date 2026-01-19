
import * as dotenv from "dotenv";
import { sql } from "drizzle-orm";
import path from "path";

// Load .env explicitly
dotenv.config({ path: path.join(process.cwd(), ".env") });

async function main() {
    const { db } = await import("../server/db");
    try {
        console.log("Adding deleted_at column to contacts table...");
        await db.run(sql`ALTER TABLE contacts ADD COLUMN deleted_at text`);
        console.log("Column added successfully!");
    } catch (e: any) {
        if (e.message.includes("duplicate column name")) {
            console.log("Column already exists.");
        } else {
            console.error("Error adding column:", e);
        }
    }
    process.exit(0);
}

main();
