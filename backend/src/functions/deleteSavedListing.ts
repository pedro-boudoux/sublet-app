import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

// Initialize DB Client
const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING!);
const database = client.database("sublet-db");
const savedContainer = database.container("savedListings");

/**
 * Removes a saved listing (unsave/unbookmark).
 * 
 * @param request - HTTP DELETE request
 * @param request.params.listingId - Listing ID to unsave (required, in URL path)
 * @param request.query.userId - User ID who saved it (required)
 * 
 * @returns 200 - Listing unsaved successfully
 * @returns 400 - Missing listingId or userId
 * @returns 404 - Saved listing not found
 * @returns 500 - Database error
 */
export async function deleteSavedListing(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const listingId = request.params.listingId;
    const userId = request.query.get('userId');

    context.log(`Unsaving listing: ${listingId} for user: ${userId}`);

    if (!listingId) {
        return {
            status: 400,
            jsonBody: { error: "listingId parameter is required" }
        };
    }

    if (!userId) {
        return {
            status: 400,
            jsonBody: { error: "userId query parameter is required" }
        };
    }

    try {
        // Find the saved record
        const query = {
            query: "SELECT * FROM c WHERE c.userId = @userId AND c.listingId = @listingId",
            parameters: [
                { name: "@userId", value: userId },
                { name: "@listingId", value: listingId }
            ]
        };

        const { resources: savedRecords } = await savedContainer.items.query(query).fetchAll();

        if (savedRecords.length === 0) {
            return {
                status: 404,
                jsonBody: { error: "Saved listing not found" }
            };
        }

        // Delete the saved record
        const savedRecord = savedRecords[0];
        await savedContainer.item(savedRecord.id, savedRecord.savedId).delete();

        context.log(`Listing unsaved: ${listingId} by user ${userId}`);

        return {
            status: 200,
            jsonBody: { message: "Listing unsaved successfully" }
        };

    } catch (err: any) {
        context.error("Error unsaving listing:", err);
        return {
            status: 500,
            jsonBody: { error: "Error unsaving listing" }
        };
    }
}

app.http('delete-saved-listing', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'saved/{listingId}',
    handler: deleteSavedListing
});
