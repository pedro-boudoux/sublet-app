import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

// Initialize DB Client
const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING!);
const database = client.database("sublet-db");
const container = database.container("listings");

/**
 * Retrieves listings with optional filtering.
 * 
 * @param request - HTTP GET request
 * @param request.query.ownerId - Filter by owner ID (optional)
 * 
 * @returns 200 - Array of listing objects
 * @returns 500 - Database error
 */
export async function getListings(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const ownerId = request.query.get('ownerId');
    context.log(`Fetching listings${ownerId ? ` for owner: ${ownerId}` : ''}`);

    try {
        let querySpec;

        if (ownerId) {
            querySpec = {
                query: "SELECT * FROM c WHERE c.ownerId = @ownerId ORDER BY c.createdAt DESC",
                parameters: [{ name: "@ownerId", value: ownerId }]
            };
        } else {
            // Default: get generic listings (maybe limit to most recent 20 for safety if unrestricted)
            // But usually this usage is for owner filtering.
            querySpec = {
                query: "SELECT * FROM c ORDER BY c.createdAt DESC OFFSET 0 LIMIT 50"
            };
        }

        const { resources: listings } = await container.items.query(querySpec).fetchAll();

        return {
            status: 200,
            jsonBody: listings
        };

    } catch (err: any) {
        context.error("Error fetching listings:", err);
        return {
            status: 500,
            jsonBody: { error: "Error fetching listings from database" }
        };
    }
}

app.http('get-listings', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'listings',
    handler: getListings
});
