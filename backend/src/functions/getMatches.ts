import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

// Initialize DB Client
const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING!);
const database = client.database("sublet-db");
const matchesContainer = database.container("matches");
const usersContainer = database.container("users");

/**
 * Retrieves all matches for a given user.
 * 
 * @param request - HTTP GET request
 * @param request.query.userId - Current user's ID (required)
 * 
 * @returns 200 - Array of match objects with user details
 * @returns 400 - Missing userId query parameter
 * @returns 500 - Database error
 */
export async function getMatches(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const userId = request.query.get("userId");
    context.log(`Fetching matches for user: ${userId}`);

    if (!userId) {
        return {
            status: 400,
            jsonBody: { error: "userId query parameter is required" }
        };
    }

    try {
        // Find all matches where this user is in the userIds array
        const matchQuery = {
            query: "SELECT * FROM c WHERE ARRAY_CONTAINS(c.userIds, @userId)",
            parameters: [{ name: "@userId", value: userId }]
        };

        const { resources: matches } = await matchesContainer.items.query(matchQuery).fetchAll();

        // Enrich matches with the other user's profile info
        const enrichedMatches = await Promise.all(
            matches.map(async (match: { id: string; userIds: string[]; createdAt: string }) => {
                // Find the other user's ID
                const otherUserId = match.userIds.find(id => id !== userId);

                // Fetch other user's profile
                let otherUser = null;
                if (otherUserId) {
                    const userQuery = {
                        query: "SELECT c.id, c.username, c.fullName, c.profilePicture, c.searchLocation FROM c WHERE c.id = @otherUserId",
                        parameters: [{ name: "@otherUserId", value: otherUserId }]
                    };
                    const { resources: users } = await usersContainer.items.query(userQuery).fetchAll();
                    otherUser = users[0] || null;
                }

                return {
                    matchId: match.id,
                    matchedAt: match.createdAt,
                    lastMessageTimestamp: (match as any).lastMessageTimestamp,
                    matchedUser: otherUser
                };
            })
        );

        // Sort by last message timestamp (or creation date) descending
        enrichedMatches.sort((a, b) => {
            const dateA = new Date(a.lastMessageTimestamp || a.matchedAt).getTime();
            const dateB = new Date(b.lastMessageTimestamp || b.matchedAt).getTime();
            return dateB - dateA;
        });

        return {
            status: 200,
            jsonBody: {
                matches: enrichedMatches,
                count: enrichedMatches.length
            }
        };

    } catch (err: any) {
        context.error("Error fetching matches:", err);
        return {
            status: 500,
            jsonBody: { error: "Error fetching matches from database" }
        };
    }
}

app.http('get-matches', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'matches',
    handler: getMatches
});
