import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

// Initialize DB Client
const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING!);
const database = client.database("sublet-db");
const swipesContainer = database.container("swipes");

/**
 * Resets (deletes) all swipes for a user, allowing them to see previously swiped candidates again.
 * 
 * @param request - HTTP DELETE request
 * @param request.query.userId - ID of the user whose swipes to reset (required)
 * 
 * @returns 200 - Swipes reset successfully with count
 * @returns 400 - Missing userId query parameter
 * @returns 500 - Database error
 */
export async function resetSwipes(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const userId = request.query.get("userId");

    if (!userId) {
        return {
            status: 400,
            jsonBody: { error: "Missing required query parameter: userId" }
        };
    }

    context.log(`Resetting swipes for user: ${userId}`);

    try {
        // Find all swipes made by this user
        const query = {
            query: "SELECT c.id FROM c WHERE c.swiperId = @userId",
            parameters: [{ name: "@userId", value: userId }]
        };

        const { resources: swipes } = await swipesContainer.items.query(query).fetchAll();

        if (swipes.length === 0) {
            return {
                status: 200,
                jsonBody: {
                    message: "No swipes to reset",
                    deletedCount: 0
                }
            };
        }

        // Delete all swipes
        let deletedCount = 0;
        for (const swipe of swipes) {
            try {
                await swipesContainer.item(swipe.id, swipe.id).delete();
                deletedCount++;
            } catch (deleteError: any) {
                context.warn(`Failed to delete swipe ${swipe.id}:`, deleteError.message);
            }
        }

        context.log(`Reset ${deletedCount} swipes for user: ${userId}`);

        return {
            status: 200,
            jsonBody: {
                message: "Swipes reset successfully",
                deletedCount
            }
        };

    } catch (err: any) {
        context.error("Error resetting swipes:", err);
        return {
            status: 500,
            jsonBody: { error: "Error resetting swipes" }
        };
    }
}

app.http('reset-swipes', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'swipes/reset',
    handler: resetSwipes
});
