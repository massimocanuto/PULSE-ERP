
import { db } from "./server/db";

async function check() {
    // @ts-ignore
    console.log("db.$client exists:", !!db.$client);
    // @ts-ignore
    if (db.$client) {
        // @ts-ignore
        console.log("db.$client.backup exists:", !!db.$client.backup);
    }
}

check().catch(console.error);
