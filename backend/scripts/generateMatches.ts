// @ts-nocheck
import { CosmosClient } from "@azure/cosmos";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const API_BASE = "http://localhost:7071/api";

// Helper to load env files
function loadEnv() {
    // Get script directory safely for ESM/Bun
    const scriptDir = path.dirname(fileURLToPath(import.meta.url));
    const backendDir = path.resolve(scriptDir, ".."); // backend/
    const rootDir = path.resolve(backendDir, "..");   // project root

    const filesToCheck = [
        path.join(backendDir, "local.settings.json"),
        path.join(backendDir, "local.settings.json.example"), // Fallback if user edited example
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
                            return; // Found it, we are good
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
    console.error("Checked: backend/local.settings.json and root .env");
    process.exit(1);
}

const client = new CosmosClient(connectionString);
const database = client.database("sublet-db");
const usersContainer = database.container("users");
const listingsContainer = database.container("listings");

async function apiSwipe(swiperId: string, swipedId: string, swipedType: "user" | "listing", direction: "like") {
    const res = await fetch(`${API_BASE}/swipes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ swiperId, swipedId, swipedType, direction })
    });
    if (!res.ok) throw new Error(`Swipe failed: ${await res.text()}`);
    return await res.json();
}

async function main() {
    let targetUserId = process.argv[2];

    if (!targetUserId) {
        const rl = readline.createInterface({ input, output });
        try {
            targetUserId = await rl.question("Enter Target User ID: ");
        } finally {
            rl.close();
        }
    }

    targetUserId = targetUserId?.trim();

    if (!targetUserId) {
        console.error("No user ID provided.");
        return;
    }

    console.log(`Fetching target user: ${targetUserId}...`);

    // Fetch target user
    const { resource: user } = await usersContainer.item(targetUserId, targetUserId).read();
    if (!user) {
        console.error("User not found in database.");
        return;
    }

    console.log(`Found user: ${user.fullName} (${user.mode})`);

    // Generate FORCE matches
    const TARGET_MIN_MATCHES = 6;
    const CHANCE_TO_LIKE = 0.6; // 60% of users will like the target

    // Fisher-Yates shuffle helper
    function shuffle<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    if (user.mode === "looking") {
        // Target is SEEKER. Needs matches with HOSTS.
        console.log("Finding offering users (hosts)...");
        const { resources: hosts } = await usersContainer.items
            .query("SELECT * FROM c WHERE c.mode = 'offering' AND STARTSWITH(c.username, 'host_guelph_')")
            .fetchAll();

        console.log(`Found ${hosts.length} potential hosts.`);

        const shuffledHosts = shuffle(hosts);
        const countToMatch = Math.min(hosts.length, Math.max(TARGET_MIN_MATCHES, Math.floor(hosts.length * CHANCE_TO_LIKE)));
        const selectedHosts = shuffledHosts.slice(0, countToMatch);

        console.log(`Selected ${selectedHosts.length} hosts to FORCE match with.`);

        for (const host of selectedHosts) {
            try {
                // Find host's listing (using identityId as ownerId)
                const { resources: listings } = await listingsContainer.items
                    .query(`SELECT * FROM c WHERE c.ownerId = '${host.identityId}'`)
                    .fetchAll();

                if (listings.length === 0) continue;
                const listing = listings[0];

                console.log(`Creating match with ${host.username} (Listing: ${listing.title}, Tags: ${listing.lifestyleTags.join(", ")})...`);

                // 1. Target likes Listing via API
                await apiSwipe(user.id, listing.id, "listing", "like");

                // 2. Host likes Target via API (Triggers Match)
                const matchRes = await apiSwipe(host.id, user.id, "user", "like"); // Use 'any' to avoid type check on json return

                if ((matchRes as any).matched) {
                    console.log(`  ✅ [MATCHED] Match ID: ${(matchRes as any).matchId}`);
                    console.log(`     Listing: ${listing.title}`);
                    console.log(`     Tags: ${(listing.lifestyleTags || []).join(", ")}`);
                } else {
                    console.log("  [WARNING] Did not match (maybe already swiped?)");
                }

            } catch (e: any) {
                console.error(`  [ERROR] with ${host.username}: ${e.message}`);
            }
        }

    } else if (user.mode === "offering") {
        // Target is HOST. Needs matches with SEEKERS.
        console.log("Finding your listing...");
        const { resources: myListings } = await listingsContainer.items
            .query(`SELECT * FROM c WHERE c.ownerId = '${user.identityId}'`)
            .fetchAll();

        if (myListings.length === 0) {
            console.error("You don't have a listing! Looking users cannot swipe on you.");
            return;
        }
        const myListing = myListings[0];
        console.log(`Using listing: ${myListing.title}`);

        console.log("Finding looking users (seekers)...");
        const { resources: seekers } = await usersContainer.items
            .query("SELECT * FROM c WHERE c.mode = 'looking' AND STARTSWITH(c.username, 'seeker_guelph_')")
            .fetchAll();

        console.log(`Found ${seekers.length} potential seekers.`);

        const shuffledSeekers = shuffle(seekers);
        const countToMatch = Math.min(seekers.length, Math.max(TARGET_MIN_MATCHES, Math.floor(seekers.length * CHANCE_TO_LIKE)));
        const selectedSeekers = shuffledSeekers.slice(0, countToMatch);

        console.log(`Selected ${selectedSeekers.length} seekers to FORCE match with.`);

        for (const seeker of selectedSeekers) {
            try {
                console.log(`Creating match with ${seeker.username} (Tags: ${(seeker.lifestyleTags || []).join(", ")})...`);

                // 1. Target likes Seeker
                await apiSwipe(user.id, seeker.id, "user", "like");

                // 2. Seeker likes Target's Listing
                const matchRes = await apiSwipe(seeker.id, myListing.id, "listing", "like");

                if ((matchRes as any).matched) {
                    console.log(`  ✅ [MATCHED] Match ID: ${(matchRes as any).matchId}`);
                    console.log(`     User: ${seeker.fullName}`);
                    console.log(`     Tags: ${(seeker.lifestyleTags || []).join(", ")}`);
                } else {
                    console.log("  [WARNING] Did not match (maybe already swiped?)");
                }

            } catch (e: any) {
                console.error(`  [ERROR] with ${seeker.username}: ${e.message}`);
            }
        }
    } else {
        console.error(`Unknown mode: ${user.mode}`);
    }
}

main().catch(console.error);
