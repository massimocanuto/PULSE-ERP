
import { db } from "../server/db";
import { anagraficaClienti } from "../shared/schema";
import { count, isNotNull } from "drizzle-orm";

async function checkClients() {
    try {
        const allClients = await db.select().from(anagraficaClienti);
        console.log(`Total clients: ${allClients.length}`);

        const clientWithAddress = allClients.filter(c => c.indirizzo && c.citta);
        console.log(`Clients with address: ${clientWithAddress.length}`);

        if (clientWithAddress.length > 0) {
            console.log("Sample client with address:", {
                name: clientWithAddress[0].ragioneSociale,
                address: clientWithAddress[0].indirizzo,
                city: clientWithAddress[0].citta
            });
        }
    } catch (error) {
        console.error("Error checking clients:", error);
    }
    process.exit(0);
}

checkClients();
