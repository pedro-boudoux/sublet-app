import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { v4 as uuidv4 } from "uuid";

// Initialize DB Client
const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING!);
const database = client.database("sublet-db");
const container = database.container("listings");

// Listing interface
interface CreateListingRequest {
    ownerId: string;
    title: string;
    price: number;
    availableDate: string;
    location: string;
    distanceTo?: string;
    type: "studio" | "1br" | "2br" | "room";
    amenities?: string[];
    lifestyleTags?: string[];  // Offering-version lifestyle tags like "Dog Friendly", "Smoke-Free"
    images?: string[];
    description?: string;
}

interface Listing extends CreateListingRequest {
    id: string;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

/**
 * Creates a new sublet listing.
 * 
 * @param request - HTTP POST request
 * @param request.body.ownerId - ID of the user creating the listing (required)
 * @param request.body.title - Listing title, e.g. "Sunny Studio in West Village" (required)
 * @param request.body.price - Monthly rent in dollars (required)
 * @param request.body.availableDate - When the sublet becomes available, ISO date string (required)
 * @param request.body.location - Address or neighborhood (required)
 * @param request.body.type - "studio" | "1br" | "2br" | "room" (required)
 * @param request.body.distanceTo - e.g. "12 mins to NYU" (optional)
 * @param request.body.amenities - Array of strings like ["Utilities included", "Furnished"] (optional)
 * @param request.body.lifestyleTags - Array of offering-style tags like ["Dog Friendly", "Smoke-Free"] (optional)
 * @param request.body.images - Array of image URLs (optional)
 * @param request.body.description - Detailed description (optional)
 * 
 * @returns 201 - Created listing object with id and timestamps
 * @returns 400 - Missing required fields or invalid type
 * @returns 500 - Database error
 */
export async function createListing(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Creating new listing`);

    try {
        const body = await request.json() as CreateListingRequest;

        // Validate required fields
        const requiredFields = ["ownerId", "title", "price", "availableDate", "location", "type"] as const;
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

        // Validate type
        const validTypes = ["studio", "1br", "2br", "room"];
        if (!validTypes.includes(body.type)) {
            return {
                status: 400,
                jsonBody: {
                    error: "Invalid type. Must be 'studio', '1br', '2br', or 'room'"
                }
            };
        }

        // Create listing object
        const now = new Date().toISOString();
        const listingId = uuidv4();
        const newListing = {
            id: listingId,
            listingId: listingId,  // Partition key - must match /listingId
            ownerId: body.ownerId,
            title: body.title,
            price: body.price,
            availableDate: body.availableDate,
            location: body.location,
            distanceTo: body.distanceTo || "",
            type: body.type,
            amenities: body.amenities || [],
            lifestyleTags: body.lifestyleTags || [],
            images: body.images || [],
            description: body.description || "",
            isVerified: false,
            createdAt: now,
            updatedAt: now
        };

        // Insert into Cosmos DB
        const { resource: createdListing } = await container.items.create(newListing);

        context.log(`Listing created with id: ${newListing.id}`);

        return {
            status: 201,
            jsonBody: createdListing
        };

    } catch (err: any) {
        if (err instanceof SyntaxError) {
            return {
                status: 400,
                jsonBody: { error: "Invalid JSON in request body" }
            };
        }

        context.error("Error creating listing:", err);
        return {
            status: 500,
            jsonBody: { error: "Error creating listing in database" }
        };
    }
}

app.http('create-listing', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'listings',
    handler: createListing
});
