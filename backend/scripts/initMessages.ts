import { CosmosClient } from "@azure/cosmos";
import * as dotenv from "dotenv";
import * as path from "path";

// Load env from current directory (we will run from root)
dotenv.config();

let connectionString = process.env.COSMOS_CONNECTION_STRING;

// Fallback to local.settings.json if not in .env
if (!connectionString) {
    try {
        const fs = require('fs');
        const settingsPath = path.resolve(__dirname, '../local.settings.json');
        if (fs.existsSync(settingsPath)) {
            const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            connectionString = settings.Values?.COSMOS_CONNECTION_STRING;
            if (connectionString) console.log("Loaded connection string from local.settings.json");
        }
    } catch (e) {
        console.warn("Failed to check local.settings.json");
    }
}

if (!connectionString) {
    console.error("Please set COSMOS_CONNECTION_STRING in your .env or backend/local.settings.json");
    process.exit(1);
}

const client = new CosmosClient(connectionString);

async function init() {
    const databaseId = "sublet-db";
    const containerId = "messages";

    // Messages should be partition by matchId so we can query all messages for a match efficiently
    const partitionKey = "/matchId";

    console.log(`Connecting to database: ${databaseId}...`);
    const { database } = await client.databases.createIfNotExists({ id: databaseId });

    console.log(`Creating container: ${containerId}...`);
    await database.containers.createIfNotExists({
        id: containerId,
        partitionKey: { paths: [partitionKey] }
    });

    console.log("Setup complete! 'messages' container is ready.");
}

init().catch((err) => {
    console.error(err);
    process.exit(1);
});
