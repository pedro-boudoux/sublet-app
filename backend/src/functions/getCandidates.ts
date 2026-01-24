import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

// Initialize DB Client
const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);

/**
 * Fetches a list of candidate users for the discovery feed.
 * 
 * @param request - HTTP GET request
 * @param request.query.limit - Max number of candidates to return (optional, default: 20)
 * 
 * @returns 200 - Array of user objects (candidates to swipe on)
 * @returns 500 - Database connection error
 */
export async function getCandidates(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    // querying for users
    const database = client.database("sublet-db");
    const container = database.container("users");

    const querySpec = {
        query: "SELECT * FROM c OFFSET 0 LIMIT 20"
    };

    try {
        const { resources: items } = await container.items.query(querySpec).fetchAll();

        return {
            status: 200,
            jsonBody: items
        };
    } catch (err) {
        context.error(err);
        return {
            status: 500,
            body: "Error connecting to Cosmos DB"
        };
    }
}

app.http('get-candidates', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getCandidates
});
