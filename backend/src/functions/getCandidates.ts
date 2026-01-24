import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

// Initialize DB Client
const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING!);
const database = client.database("sublet-db");
const usersContainer = database.container("users");
const swipesContainer = database.container("swipes");

/**
 * Fetches candidate users for the discovery feed.
 * Returns users with the opposite mode who haven't been swiped on yet.
 * 
 * @param request - HTTP GET request
 * @param request.query.userId - Current user's ID (required) — used to filter out self and already-swiped users
 * @param request.query.location - Filter by searchLocation (optional)
 * @param request.query.limit - Max number of candidates to return (optional, default: 20, max: 50)
 * 
 * @returns 200 - Array of candidate user objects to swipe on
 * @returns 400 - Missing userId parameter
 * @returns 404 - Current user not found
 * @returns 500 - Database error
 */
export async function getCandidates(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Fetching candidates for discovery feed`);

    // Get query parameters
    const userId = request.query.get("userId");
    const location = request.query.get("location");
    const limitParam = request.query.get("limit");
    const limit = Math.min(parseInt(limitParam || "20"), 50); // Cap at 50

    if (!userId) {
        return {
            status: 400,
            jsonBody: { error: "userId query parameter is required" }
        };
    }

    try {
        // 1. Get current user to determine their mode (using query for partition key flexibility)
        const userQuery = {
            query: "SELECT * FROM c WHERE c.id = @userId",
            parameters: [{ name: "@userId", value: userId }]
        };
        const { resources: users } = await usersContainer.items.query(userQuery).fetchAll();
        const currentUser = users[0];

        if (!currentUser) {
            return {
                status: 404,
                jsonBody: { error: "User not found" }
            };
        }

        // Determine opposite mode (if looking, show offering users and vice versa)
        const targetMode = currentUser.mode === "looking" ? "offering" : "looking";

        // 2. Get IDs of users already swiped on by current user
        const swipesQuery = {
            query: "SELECT c.swipedUserId FROM c WHERE c.swiperId = @userId",
            parameters: [{ name: "@userId", value: userId }]
        };

        const { resources: swipes } = await swipesContainer.items.query(swipesQuery).fetchAll();
        const swipedUserIds = swipes.map((s: { swipedUserId: string }) => s.swipedUserId);

        // 3. Build query for candidates
        let candidatesQuery = `
            SELECT * FROM c 
            WHERE c.mode = @targetMode 
            AND c.id != @userId
        `;
        const parameters: { name: string; value: string | string[] }[] = [
            { name: "@targetMode", value: targetMode },
            { name: "@userId", value: userId }
        ];

        // Add location filter if provided
        if (location) {
            candidatesQuery += ` AND c.searchLocation = @location`;
            parameters.push({ name: "@location", value: location });
        }

        // Note: LIMIT cannot be parameterized in Cosmos DB, must be interpolated directly
        candidatesQuery += ` OFFSET 0 LIMIT ${limit}`;

        const { resources: allCandidates } = await usersContainer.items.query({
            query: candidatesQuery,
            parameters
        }).fetchAll();

        // 4. Filter out already-swiped users (done in JS since Cosmos doesn't support NOT IN well)
        const candidates = allCandidates.filter(
            (candidate: { id: string }) => !swipedUserIds.includes(candidate.id)
        );

        return {
            status: 200,
            jsonBody: {
                candidates,
                count: candidates.length,
                filters: {
                    targetMode,
                    location: location || null,
                    limit
                }
            }
        };

    } catch (err: any) {
        context.error("Error fetching candidates:", err);

        if (err.code === 404) {
            return {
                status: 404,
                jsonBody: { error: "User not found" }
            };
        }

        return {
            status: 500,
            jsonBody: { error: "Error fetching candidates from database" }
        };
    }
}

app.http('get-candidates', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'candidates',
    handler: getCandidates
});
