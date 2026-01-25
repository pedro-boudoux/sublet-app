import { CosmosClient } from "@azure/cosmos";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.COSMOS_CONNECTION_STRING;
if (!connectionString) {
    console.error("Please set COSMOS_CONNECTION_STRING in your environment variables or local.settings.json");
    process.exit(1);
}

const client = new CosmosClient(connectionString);

async function init() {
    const databaseId = "sublet-db";
    const containerId = "savedListings";
    const partitionKey = "/userId"; // Users save listings, so partition by userId for efficient retrieval

    console.log(`Connecting to database: ${databaseId}...`);
    const { database } = await client.databases.createIfNotExists({ id: databaseId });

    console.log(`Creating container: ${containerId}...`);
    await database.containers.createIfNotExists({
        id: containerId,
        partitionKey: { paths: [partitionKey] }
    });

    console.log("Setup complete! 'savedListings' container is ready.");
}

init().catch((err) => {
    console.error(err);
    process.exit(1);
});
