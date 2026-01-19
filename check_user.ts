
import { db } from "./server/db";
import { users } from "./shared/schema";
import { eq } from "drizzle-orm";

async function checkUser() {
    try {
        const user = await db.select().from(users).where(eq(users.username, "massimo.canuto"));
        console.log("User found:", user);
    } catch (error) {
        console.error("Error fetching user:", error);
    } finally {
        process.exit(0);
    }
}

checkUser();
