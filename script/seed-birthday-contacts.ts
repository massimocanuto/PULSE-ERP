import "dotenv/config";
import { db } from "../server/db";
import { contacts } from "../shared/schema";

async function seedBirthdayContacts() {
    console.log("🎂 Creating test contacts with today's birthday...");

    const today = new Date();
    const birthdayDate = `${today.getFullYear() - 30}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const testContacts = [
        {
            id: `contact-birthday-test-${Date.now()}-1`,
            userId: "init-1768661451295", // User massimo.canuto
            givenName: "Mario",
            familyName: "Rossi",
            birthday: birthdayDate,
            emailAddresses: JSON.stringify([{ value: "mario.rossi@example.com" }]),
            phoneNumbers: JSON.stringify([{ value: "+39 123 456 7890" }])
        },
        {
            id: `contact-birthday-test-${Date.now()}-2`,
            userId: "init-1768661451295",
            givenName: "Laura",
            familyName: "Bianchi",
            birthday: birthdayDate,
            emailAddresses: JSON.stringify([{ value: "laura.bianchi@example.com" }]),
            phoneNumbers: JSON.stringify([{ value: "+39 098 765 4321" }])
        }
    ];

    try {
        for (const contact of testContacts) {
            await db.insert(contacts).values(contact);
            console.log(`✅ Created contact: ${contact.givenName} ${contact.familyName} with birthday ${birthdayDate}`);
        }

        console.log("🎉 Done! Go to the Dashboard to see birthday notifications!");
    } catch (error) {
        console.error("❌ Error:", error);
    }

    process.exit(0);
}

seedBirthdayContacts();
