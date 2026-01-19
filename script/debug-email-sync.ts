
process.env.DATABASE_URL = process.env.DATABASE_URL || "file:sqlite.db";

import { db } from "../server/db";
import { userEmailConfigs, emails } from "../shared/schema";
import { eq } from "drizzle-orm";
import { fetchEmailsFromFolderWithConfig, fetchNewEmails } from "../server/emailService";
import { storage as dbStorage } from "../server/storage";
import { UserEmailCredentials } from "../server/emailService";

// Mocking the sync logic from routes.ts
async function syncEmailsBackground(userId: string, folder: string = 'INBOX') {
    console.log(`[Debug Sync] Starting sync for user ${userId}, folder ${folder}`);

    const userConfigs = await db.select().from(userEmailConfigs).where(eq(userEmailConfigs.userId, userId));
    const userConfig = userConfigs[0];

    let userCreds: UserEmailCredentials;

    if (!userConfig) {
        console.log("No user config found in DB");
        // Fallback
        if (process.env.ARUBA_EMAIL_ADDRESS && process.env.ARUBA_EMAIL_PASSWORD) {
            userCreds = {
                emailAddress: process.env.ARUBA_EMAIL_ADDRESS,
                password: process.env.ARUBA_EMAIL_PASSWORD,
                imapHost: "imaps.aruba.it",
                imapPort: 993,
                imapSecure: true,
                smtpHost: "smtps.aruba.it",
                smtpPort: 465,
                smtpSecure: true,
                displayName: "Aruba Email"
            };
        } else {
            console.error("No creds available");
            return;
        }
    } else {
        console.log("Using DB credentials");
        userCreds = {
            emailAddress: userConfig.emailAddress,
            password: userConfig.password,
            imapHost: userConfig.imapHost,
            imapPort: userConfig.imapPort,
            imapSecure: userConfig.imapSecure,
            smtpHost: userConfig.smtpHost,
            smtpPort: userConfig.smtpPort,
            smtpSecure: userConfig.smtpSecure,
            displayName: userConfig.displayName || undefined,
        };
    }

    const lastUid = await dbStorage.getLastEmailUid(userId, folder);
    console.log("Last UID:", lastUid);

    let fetchedEmails: any[] = [];
    try {
        if (lastUid > 0) {
            console.log(`Fetching new emails since UID ${lastUid}`);
            fetchedEmails = await fetchNewEmails(userCreds, folder, lastUid);
        } else {
            console.log(`Initial sync, fetching last 5 emails`);
            fetchedEmails = await fetchEmailsFromFolderWithConfig(userCreds, folder, 5, true);
        }
        console.log(`Fetched ${fetchedEmails.length} emails`);
    } catch (err) {
        console.error("Fetch error:", err);
        return;
    }

    for (const email of fetchedEmails) {
        const uid = email.uid || 0;
        const existing = await dbStorage.getEmailCacheByUid(userId, folder, uid);

        if (!existing) {
            console.log(`Saving email UID ${uid}: ${email.subject}`);
            try {
                await dbStorage.createEmailCache({
                    userId,
                    uid,
                    folder,
                    messageId: email.id,
                    fromAddress: email.fromAddress,
                    fromName: email.fromName || null,
                    toAddress: email.toAddress,
                    subject: email.subject,
                    preview: email.preview,
                    body: email.body,
                    bodyHtml: email.body,
                    unread: email.unread,
                    starred: email.starred || false,
                    receivedAt: email.receivedAt ? new Date(email.receivedAt).toISOString() : new Date().toISOString(),
                });
            } catch (saveErr) {
                console.error("Save error:", saveErr);
            }
        } else {
            console.log(`Skipping existing UID ${uid}`);
        }
    }
}

async function main() {
    // Get the first user config to find the userId
    const configs = await db.select().from(userEmailConfigs);
    if (configs.length === 0) {
        console.error("No configs found to test with.");
        return;
    }
    const userId = configs[0].userId;
    console.log("Testing with userId:", userId);

    await syncEmailsBackground(userId);
}

main().catch(console.error).finally(() => process.exit());
