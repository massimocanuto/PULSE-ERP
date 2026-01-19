
import { db } from "../server/db";
import { users, userEmailConfigs } from "../shared/schema";
import { eq } from "drizzle-orm";

async function updateEmailConfig() {
    const username = "massimo.canuto";

    const user = await db.query.users.findFirst({
        where: eq(users.username, username)
    });

    if (!user) {
        console.error(`❌ User '${username}' not found!`);
        process.exit(1);
    }

    const existingConfig = await db.query.userEmailConfigs.findFirst({
        where: eq(userEmailConfigs.userId, user.id)
    });

    if (existingConfig) {
        console.log("Updating email configuration hosts...");
        await db.update(userEmailConfigs)
            .set({
                imapHost: "imaps.aruba.it",
                smtpHost: "smtps.aruba.it",
                updatedAt: new Date().toISOString()
            })
            .where(eq(userEmailConfigs.id, existingConfig.id));
        console.log("✅ Updated to imaps.aruba.it and smtps.aruba.it");
    } else {
        console.error("❌ No configuration found to update.");
    }

    process.exit(0);
}

updateEmailConfig().catch(err => {
    console.error(err);
    process.exit(1);
});
