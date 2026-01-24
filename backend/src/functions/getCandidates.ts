import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

// Initialize DB Client
const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING!);
const database = client.database("sublet-db");
const usersContainer = database.container("users");
const listingsContainer = database.container("listings");
const swipesContainer = database.container("swipes");

/**
 * Fetches candidates for the discovery feed based on user mode.
 * 
 * - "looking" users see LISTINGS (properties to rent)
 * - "offering" users see USERS (potential tenants looking for a place)
 * 
 * @param request - HTTP GET request
 * @param request.query.userId - Current user's ID (required)
 * @param request.query.location - Filter by location (optional)
 * @param request.query.limit - Max number of candidates to return (optional, default: 20, max: 50)
 * 
 * @returns 200 - { candidates: [...], type: "listings" | "users", count: number }
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
        // 1. Get current user to determine their mode
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

        // 2. Get IDs of items already swiped on by current user
        const swipesQuery = {
            query: "SELECT c.swipedId FROM c WHERE c.swiperId = @userId",
            parameters: [{ name: "@userId", value: userId }]
        };
        const { resources: swipes } = await swipesContainer.items.query(swipesQuery).fetchAll();
        const swipedIds = swipes.map((s: { swipedId: string }) => s.swipedId);

        let candidates: any[] = [];
        let candidateType: "listings" | "users";

        if (currentUser.mode === "looking") {
            // LOOKING users see LISTINGS
            candidateType = "listings";

            let listingsQuery = `
                SELECT * FROM c 
                WHERE c.ownerId != @userId
            `;
            const parameters: { name: string; value: string }[] = [
                { name: "@userId", value: userId }
            ];

            // Add location filter if provided
            if (location) {
                listingsQuery += ` AND c.location = @location`;
                parameters.push({ name: "@location", value: location });
            }

            listingsQuery += ` OFFSET 0 LIMIT ${limit}`;

            const { resources: allListings } = await listingsContainer.items.query({
                query: listingsQuery,
                parameters
            }).fetchAll();

            // Filter out already-swiped listings
            candidates = allListings.filter(
                (listing: { id: string }) => !swipedIds.includes(listing.id)
            );

        } else {
            // OFFERING users see USERS who are looking
            candidateType = "users";

            let usersQuery = `
                SELECT * FROM c 
                WHERE c.mode = 'looking' 
                AND c.id != @userId
            `;
            const parameters: { name: string; value: string }[] = [
                { name: "@userId", value: userId }
            ];

            // Add location filter if provided
            if (location) {
                usersQuery += ` AND c.searchLocation = @location`;
                parameters.push({ name: "@location", value: location });
            }

            usersQuery += ` OFFSET 0 LIMIT ${limit}`;

            const { resources: allUsers } = await usersContainer.items.query({
                query: usersQuery,
                parameters
            }).fetchAll();

            // Filter out already-swiped users
            candidates = allUsers.filter(
                (user: { id: string }) => !swipedIds.includes(user.id)
            );
        }

        return {
            status: 200,
            jsonBody: {
                candidates,
                type: candidateType,
                count: candidates.length,
                filters: {
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

