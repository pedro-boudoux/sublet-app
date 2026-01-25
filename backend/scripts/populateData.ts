
import { readdir } from "node:fs/promises";
import { join, extname, basename } from "node:path";
import { file, write } from "bun";

const API_BASE = "http://localhost:7071/api";
const DEMOS_DIR = join(import.meta.dir, "..", "..", "demos");
const LISTING_IMAGES_DIR = join(DEMOS_DIR, "listing_images");
const PROFILE_PICTURES_DIR = join(DEMOS_DIR, "profile_pictures");

// Utils
function generateId() {
    return crypto.randomUUID();
}

async function uploadProfileImage(filePath: string) {
    console.log(`Uploading profile image: ${basename(filePath)}`);
    const fileData = await file(filePath).arrayBuffer();
    const base64 = Buffer.from(fileData).toString("base64");

    // Determine mime type
    const ext = extname(filePath).toLowerCase();
    const mimeType = ext === ".png" ? "image/png" : "image/jpeg";

    const res = await fetch(`${API_BASE}/upload/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            image: base64,
            mimeType,
            fileName: basename(filePath)
        })
    });

    if (!res.ok) {
        throw new Error(`Failed to upload profile image: ${await res.text()}`);
    }

    const data = await res.json() as any;
    return data.url;
}

async function uploadListingImage(listingId: string, filePath: string) {
    console.log(`Uploading listing image for ${listingId}: ${basename(filePath)}`);
    const fileData = await file(filePath).arrayBuffer();
    const base64 = Buffer.from(fileData).toString("base64");

    const ext = extname(filePath).toLowerCase();
    const mimeType = ext === ".png" ? "image/png" : "image/jpeg";

    const res = await fetch(`${API_BASE}/upload/listing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            listingId,
            image: base64,
            mimeType
        })
    });

    if (!res.ok) {
        throw new Error(`Failed to upload listing image: ${await res.text()}`);
    }

    return await res.json();
}

async function createUser(userData: any) {
    console.log(`Creating user: ${userData.username} (${userData.mode})`);
    const res = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData)
    });

    if (!res.ok) {
        throw new Error(`Failed to create user: ${await res.text()}`);
    }

    return await res.json();
}

async function createListing(listingData: any) {
    console.log(`Creating listing: ${listingData.title}`);
    const res = await fetch(`${API_BASE}/listings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(listingData)
    });

    if (!res.ok) {
        throw new Error(`Failed to create listing: ${await res.text()}`);
    }

    return await res.json();
}

// Main
async function main() {
    console.log("Starting data population...");
    console.log(`Looking for images in ${DEMOS_DIR}`);

    // Get images
    // Profile pics: person1.jpg to person18.jpg
    const profilePics = [];
    for (let i = 1; i <= 18; i++) {
        // try jpg
        let path = join(PROFILE_PICTURES_DIR, `person${i}.jpg`);
        if (await file(path).exists()) {
            profilePics.push(path);
        } else {
            console.warn(`Warning: ${path} not found`);
        }
    }

    // Listing images: listing1.jpg to listing9.jpg (or png)
    const listingImages = [];
    for (let i = 1; i <= 9; i++) {
        let path = join(LISTING_IMAGES_DIR, `listing${i}.jpg`);
        if (!await file(path).exists()) {
            path = join(LISTING_IMAGES_DIR, `listing${i}.png`);
        }

        if (await file(path).exists()) {
            listingImages.push(path);
        } else {
            console.warn(`Warning: listing image ${i} not found`);
        }
    }

    console.log(`Found ${profilePics.length} profile pics and ${listingImages.length} listing images.`);

    // 1. Create 9 Offering Users (Males, Guelph) with Listings
    for (let i = 0; i < 9; i++) {
        if (i >= profilePics.length) break;

        const profilePicPath = profilePics[i];
        const listingPicPath = listingImages[i % listingImages.length]; // reuse if not enough

        try {
            // Upload Profile Pic
            const profileUrl = await uploadProfileImage(profilePicPath);

            // Create User
            const identityId = generateId(); // Random identity
            const user = await createUser({
                identityId,
                username: `host_guelph_${i + 1}`,
                email: `host${i + 1}@demo.com`,
                fullName: `James ${String.fromCharCode(65 + i)}.`, // James A., James B.
                age: 20 + i,
                gender: "Male",
                searchLocation: "Guelph",
                mode: "offering",
                profilePicture: profileUrl,
                bio: "Hi, I have a great room available in Guelph! I'm a student at UofG.",
                lifestyleTags: ["Student", "Non-Smoker"]
            });

            // Create Listing
            const listing = await createListing({
                ownerId: user.identityId, // Linking by identityId as that's likely the key
                title: `Room in Guelph - Location ${String.fromCharCode(65 + i)}`,
                price: 600 + (i * 50),
                availableDate: new Date(Date.now() + 86400000 * (i + 1)).toISOString(), // Future dates
                location: "Guelph, ON",
                type: "room",
                distanceTo: "10 mins to University",
                amenities: ["Wifi", "Laundry", "Furnished"],
                lifestyleTags: ["Student Friendly", "Quiet"],
                description: "A cozy room in a shared student house. Close to campus and bus routes."
            });

            // Upload Listing Image
            await uploadListingImage(listing.id, listingPicPath);

            console.log(`[OK] Created Offering User ${user.username} with Listing ${listing.title}`);

        } catch (e) {
            console.error(`[ERROR] Failed processing offering user ${i + 1}:`, e);
        }
    }

    // 2. Create 9 Looking Users (Males, Guelph)
    for (let i = 9; i < 18; i++) {
        if (i >= profilePics.length) break;

        const profilePicPath = profilePics[i];

        try {
            // Upload Profile Pic
            const profileUrl = await uploadProfileImage(profilePicPath);

            // Create User
            const identityId = generateId();
            const user = await createUser({
                identityId,
                username: `seeker_guelph_${i + 1}`,
                email: `seeker${i + 1}@demo.com`,
                fullName: `Michael ${String.fromCharCode(65 + (i - 9))}.`,
                age: 19 + (i - 9),
                gender: "Male",
                searchLocation: "Guelph",
                mode: "looking",
                profilePicture: profileUrl,
                bio: "Looking for a place for the upcoming semester. Clean and quiet student.",
                lifestyleTags: ["Student", "Quiet", "Gym"]
            });

            console.log(`[OK] Created Looking User ${user.username}`);

        } catch (e) {
            console.error(`[ERROR] Failed processing looking user ${i + 1}:`, e);
        }
    }

    console.log("Done!");
}

main().catch(console.error);
