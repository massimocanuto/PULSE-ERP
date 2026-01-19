import { storage } from "../server/storage";
import { randomUUID } from "crypto";

async function checkAndCreateProjectTables() {
    try {
        console.log("🔍 Checking projects table...\n");

        // Try to create a test project
        const testProject = {
            title: "Test Project - " + new Date().toLocaleTimeString(),
            status: "Not Started" as const,
            priority: "Medium",
            dueDate: "TBD",
            owner: "test-user-123"
        };

        console.log("Creating test project:", testProject);

        const created = await storage.createProject(testProject);
        console.log("✅ Test project created successfully:", {
            id: created.id,
            title: created.title,
            owner: created.owner,
            status: created.status
        });

        // List all projects
        console.log("\n📊 Fetching all projects...");
        const allProjects = await storage.getProjects();
        console.log(`Found ${allProjects.length} total projects in database`);

        if (allProjects.length > 0) {
            console.log("\nProjects:");
            allProjects.forEach(p => {
                console.log(`  - ${p.title} (${p.status}) - Owner: ${p.owner || 'none'}`);
            });
        }

        // Clean up test project
        console.log(`\n🗑️  Cleaning up test project...`);
        await storage.deleteProject(created.id);
        console.log("✅ Test project deleted");

    } catch (error: any) {
        console.error("\n❌ Error:", error.message);

        if (error.message.includes("no such table")) {
            console.log("\n🔧 SOLUTION: The projects table doesn't exist in the database!");
            console.log("Run database migration or create the table manually.");
        }

        throw error;
    }
}

checkAndCreateProjectTables()
    .then(() => {
        console.log("\n✅ All checks passed!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Check failed");
        process.exit(1);
    });
