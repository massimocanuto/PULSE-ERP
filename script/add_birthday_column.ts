
import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    try {
        console.log("Adding birthday column to contacts table...");
        await db.run(sql`ALTER TABLE contacts ADD COLUMN birthday text`);
        console.log("Column added successfully.");
    } catch (e) {
        console.error("Error adding column:", e);
    }
}

main();
