
import { fetchEmailsFromFolderWithConfig } from "../server/emailService";
import { db } from "../server/db";
import { userEmailConfigs } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
    const configs = await db.select().from(userEmailConfigs);
    const config = configs[0];

    if (!config) {
        console.error("No config found");
        return;
    }

    console.log(`Testing connection for ${config.emailAddress}...`);
    console.log(`Host: ${config.imapHost}:${config.imapPort} (Secure: ${config.imapSecure})`);

    try {
        const emails = await fetchEmailsFromFolderWithConfig({
            emailAddress: config.emailAddress,
            password: config.password,
            imapHost: config.imapHost,
            imapPort: config.imapPort,
            imapSecure: config.imapSecure,
            smtpHost: config.smtpHost,
            smtpPort: config.smtpPort,
            smtpSecure: config.smtpSecure,
            displayName: config.displayName || ""
        }, "INBOX", 5, true);

        console.log("Connection Successful!");
        console.log(`Fetched ${emails.length} emails.`);
        if (emails.length > 0) {
            console.log("First email subject:", emails[0].subject);
        }
    } catch (err) {
        console.error("Connection Failed:", err);
    }
}

main().catch(console.error).finally(() => process.exit());
