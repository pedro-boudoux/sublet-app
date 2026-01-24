import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { CosmosClient } from "@azure/cosmos";
import { v4 as uuidv4 } from "uuid";

// Lazy initialization for Blob Storage
let listingsContainerClient: ContainerClient | null = null;

function getListingsContainerClient(): ContainerClient {
    if (!listingsContainerClient) {
        const connectionString = process.env.BLOB_CONNECTION_STRING;
        if (!connectionString) {
            throw new Error("BLOB_CONNECTION_STRING environment variable is not set");
        }
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        listingsContainerClient = blobServiceClient.getContainerClient("listings");
    }
    return listingsContainerClient;
}

// Cosmos DB for updating listing
const cosmosClient = new CosmosClient(process.env.COSMOS_CONNECTION_STRING!);
const database = cosmosClient.database("sublet-db");
const listingsContainer = database.container("listings");

// Allowed image types
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE_MB = 10; // Larger limit for listing images
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

interface UploadListingImageRequest {
    listingId: string;
    image: string;      // Base64 encoded image data
    mimeType: string;   // e.g. "image/jpeg"
}

/**
 * Uploads an image for a listing and adds it to the listing's images array.
 * 
 * @param request - HTTP POST request
 * @param request.body.listingId - ID of the listing to add image to (required)
 * @param request.body.image - Base64 encoded image data (required)
 * @param request.body.mimeType - MIME type e.g. "image/jpeg", "image/png" (required)
 * 
 * @returns 201 - Upload successful, returns updated listing images array
 * @returns 400 - Missing required fields, invalid MIME type, or file too large
 * @returns 404 - Listing not found
 * @returns 500 - Storage/database error
 */
export async function uploadListingImage(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Processing listing image upload`);

    try {
        const body = await request.json() as UploadListingImageRequest;

        // Validate required fields
        if (!body.listingId || !body.image || !body.mimeType) {
            return {
                status: 400,
                jsonBody: {
                    error: "Missing required fields",
                    missingFields: [
                        ...(!body.listingId ? ["listingId"] : []),
                        ...(!body.image ? ["image"] : []),
                        ...(!body.mimeType ? ["mimeType"] : [])
                    ]
                }
            };
        }

        // Validate MIME type
        if (!ALLOWED_TYPES.includes(body.mimeType)) {
            return {
                status: 400,
                jsonBody: {
                    error: `Invalid image type. Allowed types: ${ALLOWED_TYPES.join(", ")}`
                }
            };
        }

        // Decode base64 image
        const imageBuffer = Buffer.from(body.image, "base64");

        // Validate file size
        if (imageBuffer.length > MAX_SIZE_BYTES) {
            return {
                status: 400,
                jsonBody: {
                    error: `Image too large. Maximum size is ${MAX_SIZE_MB}MB`
                }
            };
        }

        // Fetch the listing to verify it exists
        const listingQuery = {
            query: "SELECT * FROM c WHERE c.id = @listingId",
            parameters: [{ name: "@listingId", value: body.listingId }]
        };
        const { resources: listings } = await listingsContainer.items.query(listingQuery).fetchAll();
        const listing = listings[0];

        if (!listing) {
            return {
                status: 404,
                jsonBody: { error: "Listing not found" }
            };
        }

        // Generate unique blob name with listing prefix
        const extension = body.mimeType.split("/")[1];
        const blobName = `${body.listingId}/${uuidv4()}.${extension}`;

        // Upload to Azure Blob Storage
        const blockBlobClient = getListingsContainerClient().getBlockBlobClient(blobName);
        await blockBlobClient.uploadData(imageBuffer, {
            blobHTTPHeaders: {
                blobContentType: body.mimeType
            }
        });

        const blobUrl = blockBlobClient.url;
        context.log(`Listing image uploaded successfully: ${blobName}`);

        // Update listing's images array
        const currentImages = listing.images || [];
        const updatedImages = [...currentImages, blobUrl];

        const updatedListing = {
            ...listing,
            images: updatedImages,
            updatedAt: new Date().toISOString()
        };

        await listingsContainer.items.upsert(updatedListing);

        return {
            status: 201,
            jsonBody: {
                url: blobUrl,
                blobName: blobName,
                size: imageBuffer.length,
                mimeType: body.mimeType,
                listingId: body.listingId,
                totalImages: updatedImages.length
            }
        };

    } catch (err: any) {
        if (err instanceof SyntaxError) {
            return {
                status: 400,
                jsonBody: { error: "Invalid JSON in request body" }
            };
        }

        context.error("Error uploading listing image:", err);
        return {
            status: 500,
            jsonBody: {
                error: "Error uploading listing image",
                details: err.message || "Unknown error"
            }
        };
    }
}

app.http('upload-listing-image', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'upload/listing',
    handler: uploadListingImage
});
