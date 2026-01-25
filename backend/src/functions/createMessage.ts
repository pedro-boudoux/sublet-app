import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { v4 as uuidv4 } from "uuid";

// Initialize DB Client
const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING!);
const database = client.database("sublet-db");
const messagesContainer = database.container("messages");
const matchesContainer = database.container("matches");

interface CreateMessageRequest {
    matchId: string;
    senderId: string;
    content: string;
}

/**
 * Sends a message in a match.
 * 
 * @param request - HTTP POST request
 * @param request.body.matchId - ID of the match
 * @param request.body.senderId - ID of the user sending the message
 * @param request.body.content - Message content
 * 
 * @returns 201 - Message created
 * @returns 400 - Missing fields
 * @returns 403 - User not part of match
 * @returns 404 - Match not found
 * @returns 500 - Server error
 */
export async function createMessage(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Processing create message request`);

    try {
        const body = await request.json() as CreateMessageRequest;

        // Validate required fields
        if (!body.matchId || !body.senderId || !body.content) {
            return {
                status: 400,
                jsonBody: {
                    error: "Missing required fields",
                    missingFields: [
                        ...(!body.matchId ? ["matchId"] : []),
                        ...(!body.senderId ? ["senderId"] : []),
                        ...(!body.content ? ["content"] : [])
                    ]
                }
            };
        }

        // 1. Verify match exists and user is part of it
        const matchQuery = {
            query: "SELECT * FROM c WHERE c.id = @matchId",
            parameters: [{ name: "@matchId", value: body.matchId }]
        };
        const { resources: matches } = await matchesContainer.items.query(matchQuery).fetchAll();
        const match = matches[0];

        if (!match) {
            return {
                status: 404,
                jsonBody: { error: "Match not found" }
            };
        }

        if (!match.userIds.includes(body.senderId)) {
            return {
                status: 403,
                jsonBody: { error: "User is not part of this match" }
            };
        }

        // 2. Create message
        const message = {
            id: uuidv4(),
            matchId: body.matchId,
            senderId: body.senderId,
            content: body.content,
            timestamp: new Date().toISOString()
        };

        await messagesContainer.items.create(message);

        // 3. Update match with last message info for preview/sorting
        // Note: We use atomic patch if possible, or read-modify-write. 
        // Here we do RMW since we already read it. 
        // Ideally we should handle concurrency but for MVP RMW is okay.

        match.lastMessage = body.content;
        match.lastMessageTimestamp = message.timestamp;

        await matchesContainer.item(match.id, match.id).replace(match);

        return {
            status: 201,
            jsonBody: message
        };

    } catch (err: any) {
        if (err instanceof SyntaxError) {
            return {
                status: 400,
                jsonBody: { error: "Invalid JSON in request body" }
            };
        }

        context.error("Error creating message:", err);
        return {
            status: 500,
            jsonBody: {
                error: "Error creating message",
                details: err.message || "Unknown error"
            }
        };
    }
}

app.http('create-message', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'messages',
    handler: createMessage
});
