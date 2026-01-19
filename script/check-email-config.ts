
import { db } from "../server/db";
import { userEmailConfigs } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
    const configs = await db.select().from(userEmailConfigs);
    console.log("Current Email Configurations:");
    configs.forEach(config => {
        console.log({
            id: config.id,
            userId: config.userId,
            email: config.emailAddress,
            imapHost: config.imapHost,
            imapPort: config.imapPort,
            imapSecure: config.imapSecure,
            smtpHost: config.smtpHost,
            smtpPort: config.smtpPort,
            smtpSecure: config.smtpSecure
        });
    });

    if (configs.length === 0) {
        console.log("No email configurations found.");
    }
}

main().catch(console.error).finally(() => process.exit());
