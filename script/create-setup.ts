
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const SETUP_DIR = "C:\\Pulse_Setup";
const DIST_DIR = path.resolve("dist-desktop");

async function main() {
    console.log("Starting Setup Creation...");

    // 1. Ensure setup directory exists
    if (!fs.existsSync(SETUP_DIR)) {
        console.log(`Creating directory: ${SETUP_DIR}`);
        fs.mkdirSync(SETUP_DIR, { recursive: true });
    }

    // 2. Run Electron Build
    console.log("Running Electron Build (this may take a while)...");
    try {
        // We use npm run electron:build which triggers the configured build process
        execSync("npm run electron:build", { stdio: "inherit" });
    } catch (error) {
        console.error("Build failed:", error);
        process.exit(1);
    }

    // 3. Copy Setup Files
    console.log("Copying setup files...");
    if (fs.existsSync(DIST_DIR)) {
        const files = fs.readdirSync(DIST_DIR);
        const exeFiles = files.filter(f => f.endsWith(".exe"));

        if (exeFiles.length === 0) {
            console.error("No .exe files found in dist-desktop");
        }

        for (const file of exeFiles) {
            const src = path.join(DIST_DIR, file);
            const dest = path.join(SETUP_DIR, file);
            console.log(`Copying ${file} to ${SETUP_DIR}...`);
            fs.copyFileSync(src, dest);
        }
    } else {
        console.error(`Dist directory not found: ${DIST_DIR}`);
        process.exit(1);
    }

    console.log("Setup creation complete!");
    console.log(`Setup file is located in: ${SETUP_DIR}`);
}

main().catch(console.error);
