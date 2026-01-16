
import { db } from "./server/db";
import { invoices, quotes, financeTransactions } from "./shared/schema";
import { randomUUID } from "crypto";

async function main() {
    try {
        console.log("Starting minimal seed...");

        const invId = randomUUID();
        await db.insert(invoices).values({
            id: invId,
            numero: "TEST-INV-001",
            ragioneSociale: "Test Customer",
            dataEmissione: "2024-05-20",
            totale: "1000.00",
            tipo: "emessa",
            stato: "bozza",
            createdAt: new Date().toISOString()
        });
        console.log("Seeded invoice:", invId);

        const quoteId = randomUUID();
        await db.insert(quotes).values({
            id: quoteId,
            numero: "TEST-Q-001",
            ragioneSociale: "Prospect SPA",
            dataEmissione: "2024-05-21",
            totale: "5000.00",
            stato: "inviato",
            createdAt: new Date().toISOString()
        });
        console.log("Seeded quote:", quoteId);

    } catch (err) {
        console.error("Seed failed:", err);
    }
}

main().catch(console.error);
