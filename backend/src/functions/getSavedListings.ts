import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

// Initialize DB Client
const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING!);
const database = client.database("sublet-db");
const savedContainer = database.container("savedListings");
const listingsContainer = database.container("listings");

/**
 * Gets all saved listings for a user with full listing details.
 * 
 * @param request - HTTP GET request
 * @param request.query.userId - User ID to get saved listings for (required)
 * 
 * @returns 200 - Array of saved listings with full details
 * @returns 400 - Missing userId parameter
 * @returns 500 - Database error
 */
export async function getSavedListings(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const userId = request.query.get('userId');
    context.log(`Getting saved listings for user: ${userId}`);

    if (!userId) {
        return {
            status: 400,
            jsonBody: { error: "userId query parameter is required" }
        };
    }

    try {
        // Get saved listing records for user
        const savedQuery = {
            query: "SELECT c.listingId, c.savedAt FROM c WHERE c.userId = @userId ORDER BY c.savedAt DESC",
            parameters: [{ name: "@userId", value: userId }]
        };

        const { resources: savedRecords } = await savedContainer.items.query(savedQuery).fetchAll();

        if (savedRecords.length === 0) {
            return {
                status: 200,
                jsonBody: {
                    savedListings: [],
                    count: 0
                }
            };
        }

        // Get full listing details for each saved listing
        const listingIds = savedRecords.map(s => s.listingId);
        const listingsQuery = {
            query: `SELECT * FROM c WHERE ARRAY_CONTAINS(@listingIds, c.id)`,
            parameters: [{ name: "@listingIds", value: listingIds }]
        };

        const { resources: listings } = await listingsContainer.items.query(listingsQuery).fetchAll();

        // Merge savedAt with listing data
        const savedListings = savedRecords.map(saved => {
            const listing = listings.find(l => l.id === saved.listingId);
            return listing ? { ...listing, savedAt: saved.savedAt } : null;
        }).filter(Boolean);

        return {
            status: 200,
            jsonBody: {
                savedListings,
                count: savedListings.length
            }
        };

    } catch (err: any) {
        context.error("Error getting saved listings:", err);
        return {
            status: 500,
            jsonBody: { error: "Error fetching saved listings" }
        };
    }
}

app.http('get-saved-listings', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'saved',
    handler: getSavedListings
});
