// @ts-nocheck
import { CosmosClient } from "@azure/cosmos";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const API_BASE = "http://localhost:7071/api";

// Helper to load env files
function loadEnv() {
    const scriptDir = path.dirname(fileURLToPath(import.meta.url));
    const backendDir = path.resolve(scriptDir, "..");
    const rootDir = path.resolve(backendDir, "..");

    const filesToCheck = [
        path.join(backendDir, "local.settings.json"),
        path.join(backendDir, "local.settings.json.example"),
        path.join(rootDir, ".env")
    ];

    for (const filePath of filesToCheck) {
        try {
            if (fs.existsSync(filePath)) {
                console.log(`Loading config from: ${filePath}`);
                const content = fs.readFileSync(filePath, "utf-8");
                if (filePath.endsWith(".json") || filePath.endsWith(".json.example")) {
                    try {
                        const settings = JSON.parse(content);
                        if (settings.Values?.COSMOS_CONNECTION_STRING) {
                            process.env.COSMOS_CONNECTION_STRING = settings.Values.COSMOS_CONNECTION_STRING;
                            return;
                        }
                    } catch (e) { }
                }
                for (const line of content.split("\n")) {
                    const match = line.match(/^([^=]+)=(.*)$/);
                    if (match) {
                        const key = match[1].trim();
                        let value = match[2].trim();
                        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                        if (!process.env[key] || key === "COSMOS_CONNECTION_STRING") process.env[key] = value;
                    }
                }
            }
        } catch (e) { }
    }
}

loadEnv();

const connectionString = process.env.COSMOS_CONNECTION_STRING;
if (!connectionString) {
    console.error("Error: COSMOS_CONNECTION_STRING not found.");
    process.exit(1);
}

const client = new CosmosClient(connectionString);
const database = client.database("sublet-db");
const messagesContainer = database.container("messages");
const matchesContainer = database.container("matches");
const usersContainer = database.container("users");

async function apiMessage(matchId: string, senderId: string, content: string) {
    const res = await fetch(`${API_BASE}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, senderId, content })
    });
    if (!res.ok) throw new Error(`Message failed: ${await res.text()}`);
    return await res.json();
}

const BOT_MESSAGES = [
    "Hey there, how are you doing?",
    "Hello!",
    "Hi!",
    "Hey! How's it going?",
    "Hello there."
];

async function main() {
    console.log("🤖 Starting Bot Auto-Reply Service...");

    // 1. Get all matches
    // In a real app we'd filter or page this. For dev/demo, fetching all is fine.
    const { resources: matches } = await matchesContainer.items
        .query("SELECT * FROM c")
        .fetchAll();

    console.log(`Checking ${matches.length} matches for unread messages...`);

    for (const match of matches) {
        try {
            // Check if last message needs a reply
            // We can check match.lastMessageTimestamp and match.lastMessage properties if we maintain them.
            // Or fetch messages.

            // Let's fetch the very last message for this match
            const { resources: messages } = await messagesContainer.items
                .query(`SELECT TOP 1 * FROM c WHERE c.matchId = '${match.id}' ORDER BY c.timestamp DESC`)
                .fetchAll();

            if (messages.length === 0) {
                // No messages yet. Wait for user to start.
                continue;
            }

            const lastMessage = messages[0];

            // Check if last message is from a BOT (demo user) or REAL user
            // We assume real user is the one running this? No, we need to know who is who.
            // For now, if the last sender is NOT a 'host_guelph_' or 'seeker_guelph_' user, 
            // AND we haven't replied yet (check if previous msg was bot?)

            // Better heuristic:
            // 1. Get the two users in the match.
            // 2. Identify which is the bot (demo user).
            // 3. If last message sender != bot, then bot must reply.

            const user1Id = match.userIds[0];
            const user2Id = match.userIds[1];

            // Resolve users to check usernames
            const { resource: user1 } = await usersContainer.item(user1Id, user1Id).read();
            const { resource: user2 } = await usersContainer.item(user2Id, user2Id).read();

            if (!user1 || !user2) continue;

            let botUser = null;
            let realUser = null;

            if (user1.username.includes("host_guelph_") || user1.username.includes("seeker_guelph_")) {
                botUser = user1;
                realUser = user2;
            } else if (user2.username.includes("host_guelph_") || user2.username.includes("seeker_guelph_")) {
                botUser = user2;
                realUser = user1;
            }

            // If neither is a recognized bot, skip (maybe two real users matched?)
            if (!botUser) continue;

            // If last message was sent by the REAL USER, the bot should reply.
            if (lastMessage.senderId === realUser.id) {
                console.log(`\n📬 Unreplied message from ${realUser.fullName} (${realUser.username})`);
                console.log(`   Content: "${lastMessage.content}"`);

                // Pick a reply
                const reply = BOT_MESSAGES[Math.floor(Math.random() * BOT_MESSAGES.length)];

                console.log(`🤖 Bot ${botUser.fullName} (${botUser.username}) is replying...`);
                await apiMessage(match.id, botUser.id, reply);
                console.log(`   ✅ Sent: "${reply}"`);
            } else {
                // Last message was from the bot (or someone else), waiting for user reply.
                // console.log(`   (Waiting for reply from ${realUser.username} in match ${match.id})`);
            }

        } catch (e) {
            console.error(`Error processing match ${match.id}:`, e);
        }
    }

    console.log("Done checking.");
}

// Run main
main().catch(console.error);
