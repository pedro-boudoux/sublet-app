import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

// Initialize DB Client
const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING!);
const database = client.database("sublet-db");
const container = database.container("listings");

/**
 * Deletes a listing by ID.
 * 
 * @param request - HTTP DELETE request
 * @param request.params.listingId - The unique listing ID (required, in URL path)
 * 
 * @returns 204 - Listing deleted successfully (no content)
 * @returns 404 - Listing not found
 * @returns 500 - Database error
 */
export async function deleteListing(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const listingId = request.params.listingId;
    context.log(`Deleting listing: ${listingId}`);

    if (!listingId) {
        return {
            status: 400,
            jsonBody: { error: "listingId parameter is required" }
        };
    }

    try {
        // First, find the listing to get the ownerId (partition key)
        const listingQuery = {
            query: "SELECT * FROM c WHERE c.id = @listingId",
            parameters: [{ name: "@listingId", value: listingId }]
        };

        const { resources: listings } = await container.items.query(listingQuery).fetchAll();
        const listing = listings[0];

        if (!listing) {
            return {
                status: 404,
                jsonBody: { error: "Listing not found" }
            };
        }

        context.log(`Found listing with id: ${listing.id}`);

        // Delete using the id as partition key (container uses /listingId which equals id)
        // If listingId field exists, use it; otherwise use id
        const partitionKey = listing.listingId || listing.id;
        await container.item(listingId, partitionKey).delete();

        return {
            status: 204,
            body: null
        };

    } catch (err: any) {
        context.error("Error deleting listing:", err);
        return {
            status: 500,
            jsonBody: {
                error: "Error deleting listing from database",
                details: err.message || "Unknown Error"
            }
        };
    }
}

app.http('delete-listing', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'listings/{listingId}',
    handler: deleteListing
});
