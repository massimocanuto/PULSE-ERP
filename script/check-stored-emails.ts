
import { db } from "../server/db";
import { emails } from "../shared/schema";
import { count } from "drizzle-orm";

async function main() {
    const result = await db.select({ count: count() }).from(emails);
    const total = result[0]?.count || 0;

    console.log(`Total emails in DB: ${total}`);

    if (total > 0) {
        const someEmails = await db.select().from(emails).limit(3);
        console.log("Sample emails:", someEmails.map(e => ({
            id: e.id,
            userId: e.userId,
            subject: e.subject,
            receivedAt: e.receivedAt
        })));
    }
}

main().catch(console.error).finally(() => process.exit());
