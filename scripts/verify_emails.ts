import 'dotenv/config';
import { db } from "../server/db";
import { emails, userEmailConfigs } from "@shared/schema";
import { sql } from "drizzle-orm";
import Imap from "imap";
import { simpleParser } from "mailparser";

async function main() {
    console.log("--- Email Verification ---");

    // 1. Check DB Count
    try {
        const result = await db.select({ count: sql<number>`count(*)` }).from(emails);
        const count = result[0].count;
        console.log(`Current emails in DB: ${count}`);
    } catch (e) {
        console.error("Error reading DB:", e);
    }

    // 2. Test Credentials
    console.log("\n--- Testing Credentials ---");
    let emailVal = process.env.ARUBA_EMAIL_ADDRESS;
    let password = process.env.ARUBA_EMAIL_PASSWORD;

    if (!emailVal || !password) {
        console.log("Env vars missing. Checking DB...");
        try {
            const configs = await db.select().from(userEmailConfigs).limit(1);
            if (configs.length > 0) {
                emailVal = configs[0].emailAddress;
                password = configs[0].password;
                console.log("Credentials found in DB!");
            } else {
                console.error("No credentials in Env OR DB!");
                process.exit(1);
            }
        } catch (e) {
            console.error("Error reading configs:", e);
            process.exit(1);
        }
    } else {
        console.log(`Creds found in Env: ${emailVal} / ******`);
    }

    const imap = new Imap({
        user: emailVal,
        password: password,
        host: "imaps.aruba.it",
        port: 993,
        tls: true,
        authTimeout: 10000,
    });

    function openInbox(cb: any) {
        imap.openBox("INBOX", true, cb);
    }

    await new Promise<void>((resolve, reject) => {
        imap.once("ready", function () {
            console.log("IMAP Connection successful!");
            openInbox(function (err: any, box: any) {
                if (err) {
                    console.error("Error opening inbox:", err);
                    imap.end();
                    resolve(); // unexpected but resolved
                    return;
                }
                console.log(`Inbox contains ${box.messages.total} messages.`);

                // Fetch last 1 message
                const f = imap.seq.fetch(box.messages.total + ':*', {
                    bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
                    struct: true
                });

                f.on('message', function (msg: any, seqno: any) {
                    console.log('Message #%d', seqno);
                    msg.on('body', function (stream: any, info: any) {
                        let buffer = '';
                        stream.on('data', function (chunk: any) {
                            buffer += chunk.toString('utf8');
                        });
                        stream.once('end', function () {
                            console.log('Header: %s', Imap.parseHeader(buffer).date);
                        });
                    });
                });

                f.once('error', function (err: any) {
                    console.log('Fetch error: ' + err);
                });

                f.once('end', function () {
                    console.log('Done fetching 1 message.');
                    imap.end();
                });
            });
        });

        imap.once("error", function (err: any) {
            console.log("IMAP Error:", err);
            reject(err);
        });

        imap.once("end", function () {
            console.log("Connection ended");
            resolve();
        });

        imap.connect();
    });

    console.log("Test execution finished.");
    process.exit(0);
}

main();
