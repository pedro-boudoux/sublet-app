// @ts-nocheck
import { CosmosClient } from "@azure/cosmos";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

// Helper to load env files
function loadEnv() {
    // Get script directory safely for ESM/Bun
    const scriptDir = path.dirname(fileURLToPath(import.meta.url));
    const backendDir = path.resolve(scriptDir, ".."); // backend/
    const rootDir = path.resolve(backendDir, "..");   // project root

    const filesToCheck = [
        path.join(backendDir, "local.settings.json"),
        path.join(backendDir, "local.settings.json.example"),
        path.join(rootDir, ".env")
    ];

    console.log("Searching for configs in:");
    filesToCheck.forEach(f => console.log(" - " + f));

    for (const filePath of filesToCheck) {
        try {
            if (fs.existsSync(filePath)) {
                console.log(`Loading config from: ${filePath}`);
                const content = fs.readFileSync(filePath, "utf-8");

                // Try parsing as JSON (local.settings.json)
                if (filePath.endsWith(".json") || filePath.endsWith(".json.example")) {
                    try {
                        const settings = JSON.parse(content);
                        if (settings.Values?.COSMOS_CONNECTION_STRING) {
                            process.env.COSMOS_CONNECTION_STRING = settings.Values.COSMOS_CONNECTION_STRING;
                            return;
                        }
                    } catch (e) { }
                }

                // Try parsing as .env (key=value)
                for (const line of content.split("\n")) {
                    const match = line.match(/^([^=]+)=(.*)$/);
                    if (match) {
                        const key = match[1].trim();
                        let value = match[2].trim();
                        if (value.startsWith('"') && value.endsWith('"')) {
                            value = value.slice(1, -1);
                        }
                        if (!process.env[key] || key === "COSMOS_CONNECTION_STRING") {
                            process.env[key] = value;
                        }
                    }
                }
            }
        } catch (e) { /* ignore */ }
    }
}

loadEnv();

// DB Setup
const connectionString = process.env.COSMOS_CONNECTION_STRING;
if (!connectionString) {
    console.error("Error: COSMOS_CONNECTION_STRING not found in environment.");
    process.exit(1);
}

const client = new CosmosClient(connectionString);
const database = client.database("sublet-db");

const CONTAINERS = [
    "users",
    "listings",
    "swipes",
    "matches",
    "messages"
];

async function clearContainer(containerName: string) {
    console.log(`Cleaning container: ${containerName}...`);
    const container = database.container(containerName);

    try {
        const { resources: items } = await container.items.query("SELECT * FROM c").fetchAll();
        console.log(`  Found ${items.length} items.`);

        if (items.length === 0) return;

        let deletedCount = 0;
        for (const item of items) {
            // Cosmos DB requires partition key for delete if it's partitioned. 
            // Most of our containers might be partitioned by 'id' or 'partitionKey'.
            // For simplicity in this script, we'll try to delete using id and partition key if present.
            // If checking partition key is complex, we might just try `id` as partition key (common default) 
            // or pass the item itself if sdk supports it.
            // Usually item.id is the id. Partition key depends on container settings.

            // Getting partition key definition is an extra call. 
            // Let's try to delete with id as partition key (usual default) or just id.
            // Safest for generic cleanup is often just passing the known partition key value if available in item.
            // We blindly try deleting with item.id (default PK is often /id).

            // Check for common partition keys patterns in our app
            // Users -> /id
            // Listings -> /id or /ownerId? (Usually /id for simple apps)
            // Swipes -> /swiperId ?
            // Let's inspect the item. 

            // Validating partition key from item requires knowing the definition.
            // We will assume /id is PK for now, or try to read definition.

            // Actually, best way is to fetch container definition first.
            const { resource: containerDef } = await container.read();
            const pkPath = containerDef?.partitionKey?.paths?.[0];

            let partitionKeyValue = item.id;
            if (pkPath && pkPath !== "/id") {
                // Extract property from path, e.g. /swiperId -> swiperId
                const propName = pkPath.substring(1);
                partitionKeyValue = item[propName];
            }

            await container.item(item.id, partitionKeyValue).delete();
            deletedCount++;
            if (deletedCount % 10 === 0) process.stdout.write(".");
        }
        console.log(`\n  Deleted ${deletedCount} items.`);

    } catch (error) {
        console.error(`  Error cleaning ${containerName}:`, error.message);
    }
}

async function main() {
    const rl = readline.createInterface({ input, output });

    console.log("⚠️  DANGER ZONE ⚠️");
    console.log("This will permanently delete ALL data from the following containers:");
    CONTAINERS.forEach(c => console.log(` - ${c}`));
    console.log("The containers themselves will be PRESERVED.");
    console.log("");

    try {
        const answer = await rl.question("Are you sure you want to proceed? Type 'DELETE' to confirm: ");
        if (answer.trim() !== "DELETE") {
            console.log("Operation cancelled.");
            return;
        }

        console.log("Starting cleanup...");

        for (const containerName of CONTAINERS) {
            await clearContainer(containerName);
        }

        console.log("\n✅ Database cleanup complete!");

    } finally {
        rl.close();
    }
}

main().catch(console.error);
