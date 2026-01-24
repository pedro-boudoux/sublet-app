import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { v4 as uuidv4 } from "uuid";

// Initialize DB Client
const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING!);
const database = client.database("sublet-db");
const container = database.container("users");

// User interface
interface CreateUserRequest {
    username: string;
    email: string;
    fullName: string;
    age: number;
    searchLocation: string;
    mode: "looking" | "offering";
    profilePicture?: string;
    bio?: string;
    lifestyleTags?: string[];
}

interface User extends CreateUserRequest {
    id: string;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

/**
 * Creates a new user profile in the database.
 * 
 * @param request - HTTP request containing user data in the body
 * @param request.body.username - User's username (required)
 * @param request.body.email - User's email (required)
 * @param request.body.fullName - User's display name (required)
 * @param request.body.age - User's age (required)
 * @param request.body.searchLocation - User's city/location (required)
 * @param request.body.mode - "looking" | "offering" (required)
 * @param request.body.profilePicture - URL to profile image (optional)
 * @param request.body.bio - About me text (optional)
 * @param request.body.lifestyleTags - Array of lifestyle tags like ["Non-Smoker", "Pet Friendly"] (optional)
 * 
 * @returns 201 - Created user object with id, timestamps, and isVerified: false
 * @returns 400 - Missing required fields or invalid mode
 * @returns 500 - Database error
 */
export async function createUser(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Creating new user profile`);

    try {
        // Parse request body
        const body = await request.json() as CreateUserRequest;

        // Validate required fields
        const requiredFields = ["username", "email", "fullName", "age", "searchLocation", "mode"] as const;
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

        // Validate mode
        if (body.mode !== "looking" && body.mode !== "offering") {
            return {
                status: 400,
                jsonBody: {
                    error: "Invalid mode. Must be 'looking' or 'offering'"
                }
            };
        }

        // Create user object
        const now = new Date().toISOString();
        const newUser: User = {
            id: uuidv4(),
            username: body.username,
            email: body.email,
            fullName: body.fullName,
            age: body.age,
            searchLocation: body.searchLocation,
            mode: body.mode,
            profilePicture: body.profilePicture || "",
            bio: body.bio || "",
            lifestyleTags: body.lifestyleTags || [],
            isVerified: false,
            createdAt: now,
            updatedAt: now
        };

        // Insert into Cosmos DB
        const { resource: createdUser } = await container.items.create(newUser);

        context.log(`User created with id: ${newUser.id}`);

        return {
            status: 201,
            jsonBody: createdUser
        };

    } catch (err) {
        context.error("Error creating user:", err);

        // Handle JSON parse errors
        if (err instanceof SyntaxError) {
            return {
                status: 400,
                jsonBody: { error: "Invalid JSON in request body" }
            };
        }

        return {
            status: 500,
            jsonBody: { error: "Error creating user in database" }
        };
    }
}

app.http('create-user', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'users',
    handler: createUser
});
