import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { v4 as uuidv4 } from "uuid";

// Initialize DB Client
const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING!);
const database = client.database("sublet-db");
const swipesContainer = database.container("swipes");
const matchesContainer = database.container("matches");

// Swipe request interface
interface CreateSwipeRequest {
    swiperId: string;
    swipedUserId: string;
    direction: "like" | "pass" | "superlike";
}

/**
 * Records a swipe action and creates a match if mutual like is detected.
 * 
 * @param request - HTTP POST request
 * @param request.body.swiperId - ID of the user performing the swipe (required)
 * @param request.body.swipedUserId - ID of the user being swiped on (required)
 * @param request.body.direction - "like" | "pass" | "superlike" (required)
 * 
 * @returns 201 - Swipe recorded successfully, includes { matched: false }
 * @returns 201 - Swipe recorded + match created, includes { matched: true, matchId: "..." }
 * @returns 400 - Missing required fields or invalid direction
 * @returns 409 - Already swiped on this user
 * @returns 500 - Database error
 */
export async function createSwipe(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Recording swipe action`);

    try {
        const body = await request.json() as CreateSwipeRequest;

        // Validate required fields
        const requiredFields = ["swiperId", "swipedUserId", "direction"] as const;
        const missingFields = requiredFields.filter(field => !body[field]);

        if (missingFields.length > 0) {
            return {
                status: 400,
                jsonBody: {
                    error: "Missing required fields",
                    missingFields
                }
            };
        }

        // Validate direction
        // could be due to errors with swiping, etc
        const validDirections = ["like", "pass", "superlike"];
        if (!validDirections.includes(body.direction)) {
            return {
                status: 400,
                jsonBody: {
                    error: "Invalid direction. Must be 'like', 'pass', or 'superlike'"
                }
            };
        }

        // Prevent self-swipe
        // we should prevent the user from *even* getting recommended themselves
        // maybe by either letting you be a subleaser OR a subletter
        // but just in case we don't have time:
        if (body.swiperId === body.swipedUserId) {
            return {
                status: 400,
                jsonBody: { error: "Cannot swipe on yourself" }
            };
        }

        // Create swipe document
        const swipe = {
            id: uuidv4(),
            swiperId: body.swiperId,
            swipedUserId: body.swipedUserId,
            direction: body.direction,
            createdAt: new Date().toISOString()
        };

        // Insert swipe into database
        await swipesContainer.items.create(swipe);
        context.log(`Swipe recorded: ${body.swiperId} -> ${body.swipedUserId} (${body.direction})`);

        // Check for mutual like (only if this was a like or superlike)
        let matched = false;
        let matchId: string | null = null;

        if (body.direction === "like" || body.direction === "superlike") {
            // Check if the other user has already liked the current user
            const reverseQuery = {
                query: `SELECT * FROM c WHERE c.swiperId = @swipedUserId AND c.swipedUserId = @swiperId AND (c.direction = 'like' OR c.direction = 'superlike')`,
                parameters: [
                    { name: "@swipedUserId", value: body.swipedUserId },
                    { name: "@swiperId", value: body.swiperId }
                ]
            };

            const { resources: reverseSwipes } = await swipesContainer.items.query(reverseQuery).fetchAll();

            if (reverseSwipes.length > 0) {
                // Mutual like! Create a match
                matchId = uuidv4();
                const match = {
                    id: matchId,
                    userIds: [body.swiperId, body.swipedUserId].sort(), // Sort for consistency
                    createdAt: new Date().toISOString()
                };

                await matchesContainer.items.create(match);
                matched = true;
                context.log(`Match created: ${matchId}`);
            }
        }

        return {
            status: 201,
            jsonBody: {
                swipeId: swipe.id,
                matched,
                matchId
            }
        };

    } catch (err: any) {
        // Handle duplicate swipe (unique key violation)
        if (err.code === 409) {
            return {
                status: 409,
                jsonBody: { error: "Already swiped on this user" }
            };
        }

        if (err instanceof SyntaxError) {
            return {
                status: 400,
                jsonBody: { error: "Invalid JSON in request body" }
            };
        }

        context.error("Error creating swipe:", err);
        return {
            status: 500,
            jsonBody: { error: "Error recording swipe" }
        };
    }
}

app.http('create-swipe', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'swipes',
    handler: createSwipe
});
