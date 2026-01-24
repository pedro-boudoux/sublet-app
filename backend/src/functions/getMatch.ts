import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

// Initialize DB Client
const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING!);
const database = client.database("sublet-db");
const matchesContainer = database.container("matches");
const usersContainer = database.container("users");

/**
 * Retrieves a specific match by ID.
 * 
 * @param request - HTTP GET request
 * @param request.params.matchId - The unique match ID (required, in URL path)
 * 
 * @returns 200 - Match object with both users' details
 * @returns 404 - Match not found
 * @returns 500 - Database error
 */
export async function getMatch(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const matchId = request.params.matchId;
    context.log(`Fetching match: ${matchId}`);

    if (!matchId) {
        return {
            status: 400,
            jsonBody: { error: "matchId parameter is required" }
        };
    }

    try {
        // Query for the match
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

        // Fetch both users' profiles
        const usersQuery = {
            query: "SELECT c.id, c.username, c.fullName, c.profilePicture, c.bio, c.searchLocation, c.mode, c.lifestyleTags FROM c WHERE ARRAY_CONTAINS(@userIds, c.id)",
            parameters: [{ name: "@userIds", value: match.userIds }]
        };

        const { resources: users } = await usersContainer.items.query(usersQuery).fetchAll();

        return {
            status: 200,
            jsonBody: {
                matchId: match.id,
                matchedAt: match.createdAt,
                users
            }
        };

    } catch (err: any) {
        context.error("Error fetching match:", err);
        return {
            status: 500,
            jsonBody: { error: "Error fetching match from database" }
        };
    }
}

app.http('get-match', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'matches/{matchId}',
    handler: getMatch
});
