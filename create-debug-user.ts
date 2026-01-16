
import "dotenv/config";
import { db } from "./server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";

async function main() {
    console.log("Creating debug user...");
    try {
        const existing = await db.select().from(users).where(eq(users.username, "debug"));
        const hashedPassword = await hash("debug", 10);

        if (existing.length > 0) {
            console.log("Updating existing debug user...");
            await db.update(users)
                .set({ password: hashedPassword })
                .where(eq(users.username, "debug"));
        } else {
            console.log("Inserting new debug user...");
            await db.insert(users).values({
                id: "debug-" + Date.now(),
                name: "Debug User",
                email: "debug@pulse-erp.local",
                username: "debug",
                password: hashedPassword,
                role: "Admin",
                status: "Active"
            });
        }
        console.log("Done. Login with debug / debug");
    } catch (error: any) {
        console.error("Error:", error);
    }
}

main().catch(console.error);
