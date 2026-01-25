import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

// Initialize DB Client
const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING!);
const database = client.database("sublet-db");
const container = database.container("users");

/**
 * Retrieves a user profile by their Azure identity ID.
 * This is used after SWA authentication to check if the user has completed onboarding.
 * 
 * @param request - HTTP GET request
 * @param request.params.identityId - The Azure identity ID (from /.auth/me clientPrincipal.userId)
 * 
 * @returns 200 - User object
 * @returns 404 - User not found (user needs to complete onboarding)
 * @returns 500 - Database error
 */
export async function getUserByIdentity(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const identityId = request.params.identityId;
    context.log(`Fetching user with identityId: ${identityId}`);

    if (!identityId) {
        return {
            status: 400,
            jsonBody: { error: "identityId parameter is required" }
        };
    }

    try {
        // Query for user by identityId field
        const querySpec = {
            query: "SELECT * FROM c WHERE c.identityId = @identityId",
            parameters: [
                { name: "@identityId", value: identityId }
            ]
        };

        const { resources: users } = await container.items.query(querySpec).fetchAll();

        if (users.length === 0) {
            return {
                status: 404,
                jsonBody: { error: "User not found" }
            };
        }

        return {
            status: 200,
            jsonBody: users[0]
        };

    } catch (err: any) {
        context.error("Error fetching user by identity:", err);
        return {
            status: 500,
            jsonBody: { error: "Error fetching user from database" }
        };
    }
}

app.http('get-user-by-identity', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'users/identity/{identityId}',
    handler: getUserByIdentity
});
