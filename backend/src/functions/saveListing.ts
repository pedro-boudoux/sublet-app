import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { v4 as uuidv4 } from "uuid";

// Initialize DB Client
const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING!);
const database = client.database("sublet-db");
const savedContainer = database.container("savedListings");
const listingsContainer = database.container("listings");

interface SaveListingRequest {
    userId: string;
    listingId: string;
}

/**
 * Saves/bookmarks a listing for a user.
 * 
 * @param request - HTTP POST request
 * @param request.body.userId - ID of the user saving the listing (required)
 * @param request.body.listingId - ID of the listing to save (required)
 * 
 * @returns 201 - Listing saved successfully
 * @returns 400 - Missing required fields
 * @returns 409 - Already saved
 * @returns 500 - Database error
 */
export async function saveListing(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Saving listing`);

    try {
        const body = await request.json() as SaveListingRequest;

        // Validate required fields
        if (!body.userId || !body.listingId) {
            return {
                status: 400,
                jsonBody: {
                    error: "Missing required fields",
                    missingFields: [!body.userId && "userId", !body.listingId && "listingId"].filter(Boolean)
                }
            };
        }

        // Check if already saved
        const existingQuery = {
            query: "SELECT * FROM c WHERE c.userId = @userId AND c.listingId = @listingId",
            parameters: [
                { name: "@userId", value: body.userId },
                { name: "@listingId", value: body.listingId }
            ]
        };

        const { resources: existing } = await savedContainer.items.query(existingQuery).fetchAll();
        if (existing.length > 0) {
            return {
                status: 409,
                jsonBody: { error: "Listing already saved" }
            };
        }

        // Verify listing exists
        const listingQuery = {
            query: "SELECT c.id FROM c WHERE c.id = @listingId",
            parameters: [{ name: "@listingId", value: body.listingId }]
        };
        const { resources: listings } = await listingsContainer.items.query(listingQuery).fetchAll();
        if (listings.length === 0) {
            return {
                status: 404,
                jsonBody: { error: "Listing not found" }
            };
        }

        // Create saved listing record
        const savedListing = {
            id: uuidv4(),
            savedId: uuidv4(),  // Partition key
            userId: body.userId,
            listingId: body.listingId,
            savedAt: new Date().toISOString()
        };

        await savedContainer.items.create(savedListing);
        context.log(`Listing saved: ${body.listingId} by user ${body.userId}`);

        return {
            status: 201,
            jsonBody: {
                id: savedListing.id,
                listingId: body.listingId,
                savedAt: savedListing.savedAt
            }
        };

    } catch (err: any) {
        if (err instanceof SyntaxError) {
            return {
                status: 400,
                jsonBody: { error: "Invalid JSON in request body" }
            };
        }

        context.error("Error saving listing:", err);
        return {
            status: 500,
            jsonBody: { error: "Error saving listing" }
        };
    }
}

app.http('save-listing', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'saved',
    handler: saveListing
});
