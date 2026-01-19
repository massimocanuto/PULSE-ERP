
import { storage } from "../server/storage";
import { insertAnagraficaClientiSchema } from "../shared/schema";

async function main() {
    try {
        console.log("Tentativo di inserimento cliente di test...");

        const testClient = {
            ragioneSociale: "Cliente Test SRL",
            partitaIva: "12345678901",
            codiceFiscale: "12345678901",
            indirizzo: "Via Roma 1",
            citta: "Milano",
            provincia: "MI",
            cap: "20100",
            nazione: "Italia",
            email: "info@clientetest.it",
            telefono: "0212345678",
            latitudine: "45.4642",
            longitudine: "9.1900", // Milano coords
            note: "Cliente inserito automaticamente per test"
        };

        // Validate using the schema
        const parsed = insertAnagraficaClientiSchema.parse(testClient);

        // Use storage to create (handles ID generation and timestamps)
        const created = await storage.createAnagraficaCliente(parsed);

        console.log("✅ Cliente creato con successo!");
        console.log(JSON.stringify(created, null, 2));

        process.exit(0);
    } catch (e) {
        console.error("❌ Errore durante l'inserimento:", e);
        process.exit(1);
    }
}

main();
