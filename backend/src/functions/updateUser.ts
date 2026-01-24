import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

// Initialize DB Client
const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING!);
const database = client.database("sublet-db");
const container = database.container("users");

// Fields that can be updated
interface UpdateUserRequest {
    fullName?: string;
    age?: number;
    searchLocation?: string;
    mode?: "looking" | "offering";
    profilePicture?: string;
    bio?: string;
    lifestyleTags?: string[];
}

/**
 * Updates an existing user profile (partial update).
 * 
 * @param request - HTTP PATCH request
 * @param request.params.userId - The unique user ID (required, in URL path)
 * @param request.body.fullName - Updated display name (optional)
 * @param request.body.age - Updated age (optional)
 * @param request.body.searchLocation - Updated location (optional)
 * @param request.body.mode - "looking" | "offering" (optional)
 * @param request.body.profilePicture - Updated profile image URL (optional)
 * @param request.body.bio - Updated about me text (optional)
 * @param request.body.lifestyleTags - Updated lifestyle tags array (optional)
 * 
 * @returns 200 - Updated user object
 * @returns 400 - Invalid request body or invalid mode
 * @returns 404 - User not found
 * @returns 500 - Database error
 */
export async function updateUser(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const userId = request.params.userId;
    context.log(`Updating user with id: ${userId}`);

    if (!userId) {
        return {
            status: 400,
            jsonBody: { error: "userId parameter is required" }
        };
    }

    try {
        // Parse update data
        const updates = await request.json() as UpdateUserRequest;

        // Validate mode if provided
        if (updates.mode && updates.mode !== "looking" && updates.mode !== "offering") {
            return {
                status: 400,
                jsonBody: { error: "Invalid mode. Must be 'looking' or 'offering'" }
            };
        }

        // Fetch existing user
        const { resource: existingUser } = await container.item(userId, userId).read();

        if (!existingUser) {
            return {
                status: 404,
                jsonBody: { error: "User not found" }
            };
        }

        // Merge updates with existing user
        const updatedUser = {
            ...existingUser,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        // Replace in database
        const { resource: result } = await container.item(userId, userId).replace(updatedUser);

        return {
            status: 200,
            jsonBody: result
        };

    } catch (err: any) {
        if (err.code === 404) {
            return {
                status: 404,
                jsonBody: { error: "User not found" }
            };
        }

        if (err instanceof SyntaxError) {
            return {
                status: 400,
                jsonBody: { error: "Invalid JSON in request body" }
            };
        }

        context.error("Error updating user:", err);
        return {
            status: 500,
            jsonBody: { error: "Error updating user in database" }
        };
    }
}

app.http('update-user', {
    methods: ['PATCH'],
    authLevel: 'anonymous',
    route: 'users/{userId}',
    handler: updateUser
});
