import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

// Initialize DB Client
const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING!);
const database = client.database("sublet-db");
const container = database.container("listings");

/**
 * Retrieves a listing by ID.
 * 
 * @param request - HTTP GET request
 * @param request.params.listingId - The unique listing ID (required, in URL path)
 * 
 * @returns 200 - Listing object
 * @returns 404 - Listing not found
 * @returns 500 - Database error
 */
export async function getListing(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const listingId = request.params.listingId;
    context.log(`Fetching listing: ${listingId}`);

    if (!listingId) {
        return {
            status: 400,
            jsonBody: { error: "listingId parameter is required" }
        };
    }

    try {
        // Query for the listing (using query for partition key flexibility)
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

        return {
            status: 200,
            jsonBody: listing
        };

    } catch (err: any) {
        context.error("Error fetching listing:", err);
        return {
            status: 500,
            jsonBody: { error: "Error fetching listing from database" }
        };
    }
}

app.http('get-listing', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'listings/{listingId}',
    handler: getListing
});
