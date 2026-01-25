import { BlobServiceClient } from "@azure/storage-blob";
import * as dotenv from "dotenv";

import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const connectionString = process.env.BLOB_CONNECTION_STRING;

if (!connectionString) {
    console.error("Please set BLOB_CONNECTION_STRING in your .env file");
    process.exit(1);
}

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

async function configureStorage() {
    console.log("Configuring Azure Storage...");

    // 1. Configure CORS for the Blob Service
    console.log("Setting Service Properties (CORS)...");
    const serviceProperties = await blobServiceClient.getProperties();

    // WIPE ALL EXISTING RULES and set a single permissive rule
    // This ensures no conflicting rules block access
    const corsRules = [{
        allowedOrigins: '*',
        allowedMethods: "GET,HEAD,OPTIONS,PUT,POST,DELETE",
        allowedHeaders: "*",
        exposedHeaders: "*",
        maxAgeInSeconds: 3600
    }];

    await blobServiceClient.setProperties({
        ...serviceProperties,
        cors: corsRules
    });
    console.log("✅ CORS enabled: Wiped old rules, set global wildcard (*)");

    // 2. Configure 'profiles' container
    console.log("Configuring 'profiles' container...");
    const profilesContainer = blobServiceClient.getContainerClient("profiles");
    await profilesContainer.createIfNotExists();
    await profilesContainer.setAccessPolicy('blob'); // Public read access
    console.log("✅ 'profiles' container set to Public Access (Blob)");

    // 3. Configure 'listings' container (just in case)
    console.log("Configuring 'listings' container...");
    const listingsContainer = blobServiceClient.getContainerClient("listings");
    await listingsContainer.createIfNotExists();
    await listingsContainer.setAccessPolicy('blob'); // Public read access
    console.log("✅ 'listings' container set to Public Access (Blob)");

    console.log("\nStorage configuration complete! Images should now be visible.");
}

configureStorage().catch((err) => {
    console.error("Error configuring storage:", err);
    process.exit(1);
});
