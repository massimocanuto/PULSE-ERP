import "dotenv/config";
import { db } from "../server/db";
import { userEmailConfigs } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Checking Env Vars for ARUBA...");
    console.log("ARUBA_EMAIL_ADDRESS:", process.env.ARUBA_EMAIL_ADDRESS ? "Set" : "Not Set");
    console.log("ARUBA_EMAIL_PASSWORD:", process.env.ARUBA_EMAIL_PASSWORD ? "Set" : "Not Set");

    console.log("Checking DB for userEmailConfigs...");
    try {
        const configs = await db.select().from(userEmailConfigs);
        console.log("Total Configs found:", configs.length);
        configs.forEach((c, i) => {
            console.log(`Config ${i}: userId=${c.userId}, email=${c.emailAddress}`);
        });
    } catch (e) {
        console.error("Error querying DB:", e);
    }
}

main().catch(console.error).finally(() => process.exit());
