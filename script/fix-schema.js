
import fs from 'fs';

const filePath = 'shared/schema.ts';

try {
    const fileContent = fs.readFileSync(filePath, 'utf8'); // Read as UTF-8, might behave weirdly with binary but usually stops or replaces.

    // Find the end of valid content
    const marker = 'export type PersonalGoalContribution = typeof personalGoalContributions.$inferSelect;';
    const index = fileContent.indexOf(marker);

    if (index !== -1) {
        console.log("Found marker at index:", index);
        const cleanContent = fileContent.substring(0, index + marker.length);
        // Don't append anything this time, effectively reverting the append.
        fs.writeFileSync(filePath, cleanContent);
        console.log("Fixed schema.ts (removed duplicates).");
    } else {
        console.log("Marker not found, could not fix.");
        // Log last 100 chars to see what's wrong
        console.log("Last 200 chars:", fileContent.slice(-200));
    }
} catch (e) {
    console.error("Error:", e);
}
