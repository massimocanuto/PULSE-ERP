
import { db } from "../server/db";
import { users, userEmailConfigs } from "../shared/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

async function configureEmail() {
    const username = "massimo.canuto";

    console.log(`Searching for user: ${username}...`);
    const user = await db.query.users.findFirst({
        where: eq(users.username, username)
    });

    if (!user) {
        console.error(`❌ User '${username}' not found!`);
        process.exit(1);
    }

    console.log(`✅ User found: ${user.id}`);

    const config = {
        emailAddress: "massimo.canuto@dolomitifood.eu",
        password: "Dolomitifood@77",
        imapHost: "imap.aruba.it",
        imapPort: 993,
        imapSecure: true,
        smtpHost: "smtp.aruba.it",
        smtpPort: 465,
        smtpSecure: true,
        displayName: "Massimo Canuto", // Optional: nicer display
        userId: user.id
    };

    const existingConfig = await db.query.userEmailConfigs.findFirst({
        where: eq(userEmailConfigs.userId, user.id)
    });

    if (existingConfig) {
        console.log("Updating existing email configuration...");
        await db.update(userEmailConfigs)
            .set({
                ...config,
                updatedAt: new Date().toISOString()
            })
            .where(eq(userEmailConfigs.id, existingConfig.id));
    } else {
        console.log("Creating new email configuration...");
        await db.insert(userEmailConfigs).values({
            ...config,
            id: randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }

    console.log("✅ Email configuration saved successfully!");
    process.exit(0);
}

configureEmail().catch(err => {
    console.error(err);
    process.exit(1);
});
