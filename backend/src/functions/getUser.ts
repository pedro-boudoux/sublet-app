import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

// Initialize DB Client
const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING!);
const database = client.database("sublet-db");
const container = database.container("users");

/**
 * Retrieves a user profile by ID.
 * 
 * @param request - HTTP GET request
 * @param request.params.userId - The unique user ID (required, in URL path)
 * 
 * @returns 200 - User object
 * @returns 404 - User not found
 * @returns 500 - Database error
 */
export async function getUser(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const userId = request.params.userId;
    context.log(`Fetching user with id: ${userId}`);

    if (!userId) {
        return {
            status: 400,
            jsonBody: { error: "userId parameter is required" }
        };
    }

    try {
        const { resource: user } = await container.item(userId, userId).read();

        if (!user) {
            return {
                status: 404,
                jsonBody: { error: "User not found" }
            };
        }

        return {
            status: 200,
            jsonBody: user
        };

    } catch (err: any) {
        // Cosmos returns 404 as an error
        if (err.code === 404) {
            return {
                status: 404,
                jsonBody: { error: "User not found" }
            };
        }

        context.error("Error fetching user:", err);
        return {
            status: 500,
            jsonBody: { error: "Error fetching user from database" }
        };
    }
}

app.http('get-user', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'users/{userId}',
    handler: getUser
});
