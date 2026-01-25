import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

// Initialize DB Client
const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING!);
const database = client.database("sublet-db");
const messagesContainer = database.container("messages");
const matchesContainer = database.container("matches"); // To verify access

/**
 * Retrieves messages for a specific match.
 * 
 * @param request - HTTP GET request
 * @param request.params.matchId - ID of the match (route parameter)
 * @param request.query.userId - Current user's ID (to verify access security)
 * 
 * @returns 200 - Array of messages
 * @returns 400 - Missing userId
 * @returns 403 - User forbidden
 * @returns 404 - Match not found
 * @returns 500 - Server error
 */
export async function getMessages(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const matchId = request.params.matchId;
    const userId = request.query.get("userId");

    context.log(`Fetching messages for match: ${matchId}, user: ${userId}`);

    if (!matchId || !userId) {
        return {
            status: 400,
            jsonBody: { error: "matchId and userId are required" }
        };
    }

    try {
        // 1. Verify user is part of the match (Security)
        const matchQuery = {
            query: "SELECT * FROM c WHERE c.id = @matchId",
            parameters: [{ name: "@matchId", value: matchId }]
        };
        const { resources: matches } = await matchesContainer.items.query(matchQuery).fetchAll();
        const match = matches[0];

        if (!match) {
            return {
                status: 404,
                jsonBody: { error: "Match not found" }
            };
        }

        if (!match.userIds.includes(userId)) {
            return {
                status: 403,
                jsonBody: { error: "Access denied: User is not part of this match" }
            };
        }

        // 2. Fetch messages
        // Partitioned by matchId, so this is efficient.
        const messagesQuery = {
            query: "SELECT * FROM c WHERE c.matchId = @matchId ORDER BY c.timestamp ASC",
            parameters: [{ name: "@matchId", value: matchId }]
        };

        const { resources: messages } = await messagesContainer.items.query(messagesQuery).fetchAll();

        return {
            status: 200,
            jsonBody: {
                messages,
                count: messages.length
            }
        };

    } catch (err: any) {
        context.error("Error fetching messages:", err);
        return {
            status: 500,
            jsonBody: {
                error: "Error fetching messages",
                details: err.message || "Unknown error"
            }
        };
    }
}

app.http('get-messages', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'messages/{matchId}',
    handler: getMessages
});
