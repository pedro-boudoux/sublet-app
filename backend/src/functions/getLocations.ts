import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

// Initialize DB Client
const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING!);
const database = client.database("sublet-db");
const listingsContainer = database.container("listings");
const usersContainer = database.container("users");

/**
 * Normalizes a location string to title case for consistent display.
 * "guelph" -> "Guelph"
 * "NEW YORK, NY" -> "New York, Ny"
 */
function normalizeLocation(location: string): string {
    return location
        .toLowerCase()
        .split(/(\s|,)/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
}

/**
 * Gets all unique locations from listings and users.
 * Returns normalized locations for consistent display.
 * 
 * @returns 200 - Array of unique location strings
 * @returns 500 - Database error
 */
export async function getLocations(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log("Fetching unique locations");

    try {
        // Get locations from listings
        const listingsQuery = {
            query: "SELECT DISTINCT VALUE c.location FROM c WHERE c.location != null"
        };
        const { resources: listingLocations } = await listingsContainer.items.query<string>(listingsQuery).fetchAll();

        // Get searchLocation from users
        const usersQuery = {
            query: "SELECT DISTINCT VALUE c.searchLocation FROM c WHERE c.searchLocation != null"
        };
        const { resources: userLocations } = await usersContainer.items.query<string>(usersQuery).fetchAll();

        // Combine and normalize all locations
        const allLocations = [...listingLocations, ...userLocations];

        // Use a map to deduplicate case-insensitively while preserving a nice display format
        const locationMap = new Map<string, string>();

        for (const loc of allLocations) {
            if (loc && typeof loc === 'string' && loc.trim()) {
                const key = loc.toLowerCase().trim();
                // Keep the first occurrence's capitalization, or use normalized version
                if (!locationMap.has(key)) {
                    locationMap.set(key, normalizeLocation(loc.trim()));
                }
            }
        }

        // Sort alphabetically
        const uniqueLocations = Array.from(locationMap.values()).sort((a, b) =>
            a.localeCompare(b, undefined, { sensitivity: 'base' })
        );

        return {
            status: 200,
            jsonBody: {
                locations: uniqueLocations,
                count: uniqueLocations.length
            }
        };

    } catch (err: any) {
        context.error("Error fetching locations:", err);
        return {
            status: 500,
            jsonBody: { error: "Error fetching locations" }
        };
    }
}

app.http('get-locations', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'locations',
    handler: getLocations
});
