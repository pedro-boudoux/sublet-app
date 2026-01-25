import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";

// Lazy initialization - only connect when needed
let containerClient: ContainerClient | null = null;

async function getContainerClient(): Promise<ContainerClient> {
    if (!containerClient) {
        const connectionString = process.env.BLOB_CONNECTION_STRING;
        if (!connectionString) {
            throw new Error("BLOB_CONNECTION_STRING environment variable is not set");
        }
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        containerClient = blobServiceClient.getContainerClient("profiles");

        // Ensure container exists and has public access
        await containerClient.createIfNotExists();
        await containerClient.setAccessPolicy('blob');

        // Enable CORS for the Blob Service to allow browser access
        const serviceProperties = await blobServiceClient.getProperties();
        const corsRules = serviceProperties.cors || [];

        // Check if our rule already exists to avoid overwriting
        const hasOpenCors = corsRules.some(rule => rule.allowedOrigins === '*');

        if (!hasOpenCors) {
            corsRules.push({
                allowedOrigins: '*',
                allowedMethods: "GET,HEAD,OPTIONS",
                allowedHeaders: "*",
                exposedHeaders: "*",
                maxAgeInSeconds: 3600
            });

            await blobServiceClient.setProperties({
                ...serviceProperties,
                cors: corsRules
            });
        }
    }
    return containerClient;
}

// Allowed image types
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

interface UploadRequest {
    image: string;      // Base64 encoded image data
    mimeType: string;   // e.g. "image/jpeg"
    fileName?: string;  // Optional original filename
}

/**
 * Uploads an image to Azure Blob Storage.
 * 
 * @param request - HTTP POST request
 * @param request.body.image - Base64 encoded image data (required)
 * @param request.body.mimeType - MIME type e.g. "image/jpeg", "image/png" (required)
 * @param request.body.fileName - Optional original filename for reference
 * 
 * @returns 201 - Upload successful, returns { url: "https://...", blobName: "..." }
 * @returns 400 - Missing required fields, invalid MIME type, or file too large
 * @returns 500 - Storage error
 */
export async function uploadProfileImage(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Processing image upload`);

    try {
        const body = await request.json() as UploadRequest;

        // Validate required fields
        if (!body.image || !body.mimeType) {
            return {
                status: 400,
                jsonBody: {
                    error: "Missing required fields",
                    missingFields: [
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

        // Generate unique blob name
        const extension = body.mimeType.split("/")[1]; // e.g. "jpeg" from "image/jpeg"
        const blobName = `${uuidv4()}.${extension}`;

        // Get blob client
        const container = await getContainerClient();
        const blockBlobClient = container.getBlockBlobClient(blobName);

        // Upload to Azure Blob Storage
        await blockBlobClient.uploadData(imageBuffer, {
            blobHTTPHeaders: {
                blobContentType: body.mimeType
            }
        });

        const blobUrl = blockBlobClient.url;
        context.log(`Image uploaded successfully: ${blobName}`);

        return {
            status: 201,
            jsonBody: {
                url: blobUrl,
                blobName: blobName,
                size: imageBuffer.length,
                mimeType: body.mimeType
            }
        };

    } catch (err: any) {
        if (err instanceof SyntaxError) {
            return {
                status: 400,
                jsonBody: { error: "Invalid JSON in request body" }
            };
        }

        context.error("Error uploading image:", err);
        return {
            status: 500,
            jsonBody: {
                error: "Error uploading image to storage",
                details: err.message || "Unknown error"
            }
        };
    }
}

app.http('upload-profile-image', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'upload/profile',
    handler: uploadProfileImage
});
