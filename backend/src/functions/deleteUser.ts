import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

// Initialize DB Client
const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING!);
const database = client.database("sublet-db");
const container = database.container("users");

/**
 * Deletes a user profile by ID.
 * 
 * @param request - HTTP DELETE request
 * @param request.params.userId - The unique user ID (required, in URL path)
 * 
 * @returns 204 - User deleted successfully (no content)
 * @returns 404 - User not found
 * @returns 500 - Database error
 */
export async function deleteUser(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const userId = request.params.userId;
    context.log(`Deleting user with id: ${userId}`);

    if (!userId) {
        return {
            status: 400,
            jsonBody: { error: "userId parameter is required" }
        };
    }

    try {
        // Delete from database
        await container.item(userId, userId).delete();

        return {
            status: 204,
            body: null
        };

    } catch (err: any) {
        if (err.code === 404) {
            return {
                status: 404,
                jsonBody: { error: "User not found" }
            };
        }

        context.error("Error deleting user:", err);
        return {
            status: 500,
            jsonBody: { error: "Error deleting user from database" }
        };
    }
}

app.http('delete-user', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'users/{userId}',
    handler: deleteUser
});
