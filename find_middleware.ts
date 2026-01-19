
import fs from "fs";

const content = fs.readFileSync("./server/routes.ts", "utf-8");
const lines = content.split("\n");

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("finanzaAuthMiddleware")) {
        console.log(`Found at line ${i + 1}:`);
        for (let j = Math.max(0, i - 10); j < Math.min(lines.length, i + 20); j++) {
            console.log(`${j + 1}: ${lines[j]}`);
        }
        // Stop after finding definition (usually const or function, but we print all occurances if few)
        if (lines[i].includes("const ") || lines[i].includes("function ")) {
            break;
        }
    }
}
