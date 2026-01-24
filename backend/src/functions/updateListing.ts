import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

// Initialize DB Client
const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING!);
const database = client.database("sublet-db");
const container = database.container("listings");

// Fields that can be updated
interface UpdateListingRequest {
    title?: string;
    price?: number;
    availableDate?: string;
    location?: string;
    distanceTo?: string;
    type?: "studio" | "1br" | "2br" | "room";
    amenities?: string[];
    images?: string[];
    description?: string;
}

/**
 * Updates an existing listing (partial update).
 * 
 * @param request - HTTP PATCH request
 * @param request.params.listingId - The unique listing ID (required, in URL path)
 * @param request.body.title - Updated title (optional)
 * @param request.body.price - Updated price (optional)
 * @param request.body.availableDate - Updated availability date (optional)
 * @param request.body.location - Updated location (optional)
 * @param request.body.distanceTo - Updated distance info (optional)
 * @param request.body.type - Updated type (optional)
 * @param request.body.amenities - Updated amenities array (optional)
 * @param request.body.images - Updated images array (optional)
 * @param request.body.description - Updated description (optional)
 * 
 * @returns 200 - Updated listing object
 * @returns 400 - Invalid request body or invalid type
 * @returns 404 - Listing not found
 * @returns 500 - Database error
 */
export async function updateListing(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const listingId = request.params.listingId;
    context.log(`Updating listing: ${listingId}`);

    if (!listingId) {
        return {
            status: 400,
            jsonBody: { error: "listingId parameter is required" }
        };
    }

    try {
        const updates = await request.json() as UpdateListingRequest;

        // Validate type if provided
        if (updates.type) {
            const validTypes = ["studio", "1br", "2br", "room"];
            if (!validTypes.includes(updates.type)) {
                return {
                    status: 400,
                    jsonBody: { error: "Invalid type. Must be 'studio', '1br', '2br', or 'room'" }
                };
            }
        }

        // Fetch existing listing
        const listingQuery = {
            query: "SELECT * FROM c WHERE c.id = @listingId",
            parameters: [{ name: "@listingId", value: listingId }]
        };

        const { resources: listings } = await container.items.query(listingQuery).fetchAll();
        const existingListing = listings[0];

        if (!existingListing) {
            return {
                status: 404,
                jsonBody: { error: "Listing not found" }
            };
        }

        // Merge updates with existing listing
        const updatedListing = {
            ...existingListing,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        // Upsert is more reliable than replace (doesn't require exact partition key match)
        const { resource: result } = await container.items.upsert(updatedListing);

        return {
            status: 200,
            jsonBody: result
        };

    } catch (err: any) {
        if (err instanceof SyntaxError) {
            return {
                status: 400,
                jsonBody: { error: "Invalid JSON in request body" }
            };
        }

        context.error("Error updating listing:", err);
        context.error("Error code:", err.code);
        context.error("Error message:", err.message);

        return {
            status: 500,
            jsonBody: {
                error: "Error updating listing in database",
                details: err.message || "Unknown error"
            }
        };
    }
}

app.http('update-listing', {
    methods: ['PATCH'],
    authLevel: 'anonymous',
    route: 'listings/{listingId}',
    handler: updateListing
});
