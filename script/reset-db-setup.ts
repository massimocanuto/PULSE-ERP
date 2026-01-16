
import { seedInitialUser } from "../server/seed-init";

async function run() {
    console.log("Resetting Setup DB...");
    await seedInitialUser();
    console.log("Setup DB Reset Complete.");
}

run().catch(console.error);
