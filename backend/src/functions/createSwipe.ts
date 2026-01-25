import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { v4 as uuidv4 } from "uuid";

// Initialize DB Client
const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING!);
const database = client.database("sublet-db");
const swipesContainer = database.container("swipes");
const matchesContainer = database.container("matches");
const listingsContainer = database.container("listings");
const usersContainer = database.container("users");

// Swipe request interface
interface CreateSwipeRequest {
    swiperId: string;
    swipedId: string;          // Can be a userId or listingId
    swipedType: "user" | "listing";  // Type of item being swiped on
    direction: "like" | "pass" | "superlike";
}

/**
 * Records a swipe action and creates a match if mutual like is detected.
 */
export async function createSwipe(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Recording swipe action`);

    try {
        const body = await request.json() as CreateSwipeRequest;

        // Validate required fields
        const requiredFields = ["swiperId", "swipedId", "swipedType", "direction"] as const;
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
        const validDirections = ["like", "pass", "superlike"];
        if (!validDirections.includes(body.direction)) {
            return {
                status: 400,
                jsonBody: {
                    error: "Invalid direction. Must be 'like', 'pass', or 'superlike'"
                }
            };
        }

        // Validate swipedType
        if (body.swipedType !== "user" && body.swipedType !== "listing") {
            return {
                status: 400,
                jsonBody: {
                    error: "Invalid swipedType. Must be 'user' or 'listing'"
                }
            };
        }

        // Prevent self-swipe (only for user type)
        if (body.swipedType === "user" && body.swiperId === body.swipedId) {
            return {
                status: 400,
                jsonBody: { error: "Cannot swipe on yourself" }
            };
        }

        // Create swipe document
        const swipe = {
            id: uuidv4(),
            swiperId: body.swiperId,
            swipedId: body.swipedId,
            swipedType: body.swipedType,
            direction: body.direction,
            createdAt: new Date().toISOString()
        };

        // Insert swipe into database
        await swipesContainer.items.create(swipe);
        context.log(`Swipe recorded: ${body.swiperId} -> ${body.swipedId} (${body.swipedType}, ${body.direction})`);

        // Check for mutual like (only if this was a like or superlike)
        let matched = false;
        let matchId: string | null = null;

        if (body.direction === "like" || body.direction === "superlike") {
            if (body.swipedType === "user") {
                // User-to-user swipe: check if the other user has liked back
                const reverseQuery = {
                    query: `SELECT * FROM c WHERE c.swiperId = @swipedId AND c.swipedId = @swiperId AND c.swipedType = 'user' AND (c.direction = 'like' OR c.direction = 'superlike')`,
                    parameters: [
                        { name: "@swipedId", value: body.swipedId },
                        { name: "@swiperId", value: body.swiperId }
                    ]
                };

                const { resources: reverseSwipes } = await swipesContainer.items.query(reverseQuery).fetchAll();

                if (reverseSwipes.length > 0) {
                    // Mutual like! Create a match
                    matchId = uuidv4();
                    const match = {
                        id: matchId,
                        type: "user-user",
                        userIds: [body.swiperId, body.swipedId].sort(),
                        createdAt: new Date().toISOString()
                    };

                    await matchesContainer.items.create(match);
                    matched = true;
                    context.log(`Match created: ${matchId}`);
                } else {
                    // Check if the other user liked any of THIS user's listings
                    // (Case: Host swipes Seeker, checking if Seeker liked Host's Listing)

                    // 1. Get host's identityId to identify their listings
                    const { resource: hostUser } = await usersContainer.item(body.swiperId, body.swiperId).read();

                    if (hostUser && hostUser.identityId) {
                        // 2. Get all listings owned by swiper (Host)
                        const myListingQuery = {
                            query: "SELECT c.id FROM c WHERE c.ownerId = @ownerId",
                            parameters: [{ name: "@ownerId", value: hostUser.identityId }]
                        };
                        const { resources: myListings } = await listingsContainer.items.query(myListingQuery).fetchAll();

                        if (myListings.length > 0) {
                            const listingIds = myListings.map(l => l.id);

                            // 3. Check if swiped user (Seeker) liked ANY of these listings
                            const idsList = listingIds.map(id => `'${id}'`).join(",");
                            const listingSwipeQuery = `
                                SELECT * FROM c 
                                WHERE c.swiperId = '${body.swipedId}' 
                                AND c.swipedType = 'listing' 
                                AND ARRAY_CONTAINS([${idsList}], c.swipedId)
                                AND (c.direction = 'like' OR c.direction = 'superlike')
                            `;

                            const { resources: listingSwipes } = await swipesContainer.items.query(listingSwipeQuery).fetchAll();

                            if (listingSwipes.length > 0) {
                                // Match! Seeker liked one of Host's listings
                                matchId = uuidv4();
                                const matchedListingId = listingSwipes[0].swipedId;
                                const match = {
                                    id: matchId,
                                    type: "user-listing",
                                    userIds: [body.swiperId, body.swipedId].sort(),
                                    listingId: matchedListingId,
                                    createdAt: new Date().toISOString()
                                };

                                await matchesContainer.items.create(match);
                                matched = true;
                                context.log(`Match created (host-listing): ${matchId}`);
                            }
                        }
                    }
                }
            } else {
                // Listing swipe: check if listing owner has liked this user
                // First, get the listing to find its owner
                // Note: Listing ownerId is identityId, but swipes use userId (Cosmos ID)
                // We need to resolve the owner's cosmos ID to check swipes

                // 1. Get listing
                const listingQuery = {
                    query: "SELECT c.ownerId FROM c WHERE c.id = @listingId",
                    parameters: [{ name: "@listingId", value: body.swipedId }]
                };
                const { resources: listings } = await listingsContainer.items.query(listingQuery).fetchAll();

                if (listings.length > 0) {
                    const ownerIdentityId = listings[0].ownerId;

                    // 2. Resolve owner's Cosmos ID from identityId
                    const userQuery = {
                        query: "SELECT c.id FROM c WHERE c.identityId = @identityId",
                        parameters: [{ name: "@identityId", value: ownerIdentityId }]
                    };
                    const { resources: owners } = await usersContainer.items.query(userQuery).fetchAll();

                    if (owners.length > 0) {
                        const ownerId = owners[0].id;

                        // 3. Check if owner has liked this user
                        const reverseQuery = {
                            query: `SELECT * FROM c WHERE c.swiperId = @ownerId AND c.swipedId = @swiperId AND c.swipedType = 'user' AND (c.direction = 'like' OR c.direction = 'superlike')`,
                            parameters: [
                                { name: "@ownerId", value: ownerId },
                                { name: "@swiperId", value: body.swiperId }
                            ]
                        };

                        const { resources: reverseSwipes } = await swipesContainer.items.query(reverseQuery).fetchAll();

                        if (reverseSwipes.length > 0) {
                            // Match! The looking user liked the listing and the owner liked the user
                            matchId = uuidv4();
                            const match = {
                                id: matchId,
                                type: "user-listing",
                                userIds: [body.swiperId, ownerId].sort(),
                                listingId: body.swipedId,
                                createdAt: new Date().toISOString()
                            };

                            await matchesContainer.items.create(match);
                            matched = true;
                            context.log(`Match created (user-listing): ${matchId}`);
                        }
                    }
                }
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
                jsonBody: { error: "Already swiped on this item" }
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
