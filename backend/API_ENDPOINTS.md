# Sublet App — API Endpoints

This document defines all the backend API endpoints for the SubletConnect app.
Use this as a reference when building the frontend.

---

## Quick Reference

| Category | Endpoints |
|----------|-----------|
| Users | `POST /api/users`, `GET/PATCH/DELETE /api/users/:userId` |
| Listings | `POST /api/listings`, `GET/PATCH/DELETE /api/listings/:listingId` |
| Discovery | `GET /api/candidates` |
| Swipes | `POST /api/swipes` |
| Matches | `GET /api/matches`, `GET /api/matches/:matchId` |
| Upload | `POST /api/upload/profile`, `POST /api/upload/listing` |

---

## 1. User/Profile Endpoints

| Method   | Endpoint            | Purpose                                                      |
|----------|---------------------|--------------------------------------------------------------|
| `POST`   | `/api/users`        | Create a new user profile (after Azure Auth login)          |
| `GET`    | `/api/users/:userId`| Get a specific user's profile                                |
| `PATCH`  | `/api/users/:userId`| Update user profile (about, lifestyle tags, location, mode) |
| `DELETE` | `/api/users/:userId`| Delete a user account                                        |

**User Model Fields:**
```typescript
{
  id: string;              // UUID - auto-generated
  username: string;        // Required
  fullName: string;        // Required
  email: string;           // Required
  age?: number;
  searchLocation?: string; // City/region for discovery
  mode: "looking" | "offering";  // Required - determines swipe behavior
  profilePicture?: string; // URL from /api/upload/profile
  bio?: string;            // "About Me" text
  lifestyleTags?: string[]; // e.g. ["Non-Smoker", "Pet Friendly"]
  isVerified: boolean;     // Default: false
  createdAt: string;       // ISO timestamp
  updatedAt: string;       // ISO timestamp
}
```

---

## 2. Listing Endpoints

| Method   | Endpoint                 | Purpose                        |
|----------|--------------------------|--------------------------------|
| `POST`   | `/api/listings`          | Create a new sublet listing    |
| `GET`    | `/api/listings/:listingId`| Get a specific listing         |
| `PATCH`  | `/api/listings/:listingId`| Update a listing               |
| `DELETE` | `/api/listings/:listingId`| Delete a listing               |

**Listing Model Fields:**
```typescript
{
  id: string;              // UUID - auto-generated
  listingId: string;       // Same as id (partition key)
  ownerId: string;         // Required - user ID of the person offering
  title: string;           // Required - e.g. "Sunny Studio in West Village"
  price: number;           // Required - monthly rent in dollars
  availableDate: string;   // Required - ISO date string
  location: string;        // Required - address or neighborhood
  distanceTo?: string;     // e.g. "12 mins to NYU"
  type: "studio" | "1br" | "2br" | "room";  // Required
  amenities?: string[];    // e.g. ["Utilities included", "Furnished"]
  lifestyleTags?: string[]; // Offering-style tags e.g. ["Dog Friendly", "Smoke-Free"]
  images?: string[];       // URLs from /api/upload/listing
  description?: string;
  isVerified: boolean;     // Default: false
  createdAt: string;
  updatedAt: string;
}
```

---

## 3. Image Upload Endpoints

Two separate endpoints for different use cases:

| Method | Endpoint              | Purpose                    | Max Size |
|--------|----------------------|----------------------------|----------|
| `POST` | `/api/upload/profile` | Upload profile picture     | 5 MB     |
| `POST` | `/api/upload/listing` | Upload listing image       | 10 MB    |

### Profile Image Upload

**Request:**
```json
{
  "image": "base64-encoded-image-data",
  "mimeType": "image/jpeg"
}
```

**Response:**
```json
{
  "url": "https://storage.blob.core.windows.net/profiles/uuid.jpg",
  "blobName": "uuid.jpg",
  "size": 12345,
  "mimeType": "image/jpeg"
}
```

### Listing Image Upload

**Request:**
```json
{
  "listingId": "listing-uuid",
  "image": "base64-encoded-image-data",
  "mimeType": "image/jpeg"
}
```

**Response:**
```json
{
  "url": "https://storage.blob.core.windows.net/listings/listing-uuid/image-uuid.jpg",
  "blobName": "listing-uuid/image-uuid.jpg",
  "size": 12345,
  "mimeType": "image/jpeg",
  "listingId": "listing-uuid",
  "totalImages": 3
}
```

**Important:** The listing image endpoint automatically adds the URL to the listing's `images` array. You don't need to call PATCH afterward.

---

## 4. Discovery/Feed Endpoints

| Method | Endpoint          | Purpose                                                |
|--------|-------------------|--------------------------------------------------------|
| `GET`  | `/api/candidates` | Fetch swipeable candidates for the current user       |

**Query Parameters:**
- `userId` (required) — the current user's ID
- `location` — optional filter by city/region
- `limit` — number of candidates to return (default: 20)

**Logic:**
- Returns users with the **opposite mode** (if user is "looking", returns "offering" users)
- Excludes users the current user has already swiped on
- Excludes the current user

---

## 5. Swipe Endpoints

| Method | Endpoint      | Purpose                                      |
|--------|---------------|----------------------------------------------|
| `POST` | `/api/swipes` | Record a swipe action on a candidate         |

**Request:**
```json
{
  "swiperId": "current-user-uuid",
  "swipedUserId": "other-user-uuid",
  "direction": "like"
}
```

**Response (no match):**
```json
{
  "swipeId": "swipe-uuid",
  "matched": false,
  "matchId": null
}
```

**Response (match!):**
```json
{
  "swipeId": "swipe-uuid",
  "matched": true,
  "matchId": "match-uuid"
}
```

---

## 6. Match Endpoints

| Method | Endpoint              | Purpose                                |
|--------|-----------------------|----------------------------------------|
| `GET`  | `/api/matches`        | Get all matches for the current user   |
| `GET`  | `/api/matches/:matchId`| Get details of a specific match       |

---

## Frontend Integration Guides

### User Registration Flow

```
1. User signs up via Azure Auth (get auth token)

2. Create user profile:
   POST /api/users
   {
     "username": "johndoe",
     "fullName": "John Doe",
     "email": "john@example.com",
     "mode": "looking"
   }
   → Returns user with generated `id`

3. (Optional) Upload profile picture:
   POST /api/upload/profile
   {
     "image": "<base64-image>",
     "mimeType": "image/jpeg"
   }
   → Returns { "url": "https://..." }

4. Update user with profile picture:
   PATCH /api/users/:userId
   {
     "profilePicture": "https://..."
   }
```

### Listing Creation Flow

```
1. Create listing first (without images):
   POST /api/listings
   {
     "ownerId": "user-uuid",
     "title": "Sunny Studio Downtown",
     "price": 1200,
     "availableDate": "2026-02-01",
     "location": "123 Main St, Guelph",
     "type": "studio"
   }
   → Returns listing with generated `id`

2. Upload images (one at a time):
   POST /api/upload/listing
   {
     "listingId": "listing-uuid",
     "image": "<base64-image>",
     "mimeType": "image/jpeg"
   }
   → Automatically adds URL to listing's images array
   → Returns { "totalImages": 1 }

3. Repeat step 2 for additional images
   → Each call returns updated totalImages count
```

### Swiping Flow

```
1. Fetch candidates:
   GET /api/candidates?userId=current-user-uuid&limit=20
   → Returns array of user profiles

2. User swipes on a candidate:
   POST /api/swipes
   {
     "swiperId": "current-user-uuid",
     "swipedUserId": "candidate-uuid",
     "direction": "like"
   }

3. Check response for match:
   - If matched: true → Show match animation, navigate to matches
   - If matched: false → Continue to next candidate
```

### Viewing Matches

```
1. Get all matches:
   GET /api/matches?userId=current-user-uuid
   → Returns array of matches with other user's profile

2. Get specific match details:
   GET /api/matches/:matchId
   → Returns match with both users' full profiles
```

---

## Error Handling

All endpoints return errors in this format:
```json
{
  "error": "Human-readable error message",
  "details": "Optional additional details"
}
```

**Common Status Codes:**
- `200` — Success (GET, PATCH)
- `201` — Created (POST)
- `204` — No Content (DELETE)
- `400` — Bad Request (missing/invalid fields)
- `404` — Not Found
- `409` — Conflict (duplicate)
- `500` — Server Error

---

## Base URL

**Local Development:** `http://localhost:7071/api`
**Production:** TBD (Azure Functions URL)

---

## Messaging Endpoints *(Future / V2)*

Not currently implemented. Will only be built if time permits before deadline.

| Method | Endpoint                                     | Purpose                          |
|--------|----------------------------------------------|----------------------------------|
| `GET`  | `/api/conversations`                         | Get all conversations for user   |
| `GET`  | `/api/conversations/:conversationId/messages`| Get messages in a conversation   |
| `POST` | `/api/conversations/:conversationId/messages`| Send a new message               |

---

## Database Containers (Cosmos DB)

| Container       | Partition Key | Purpose                      |
|-----------------|---------------|------------------------------|
| `users`         | `/id`         | User profiles                |
| `listings`      | `/listingId`  | Sublet listings              |
| `swipes`        | `/swiperId`   | Swipe actions                |
| `matches`       | `/id`         | Mutual matches               |
| `messages`      | `/conversationId` | Chat messages (v2)       |

## Blob Storage Containers

| Container  | Purpose                          |
|------------|----------------------------------|
| `profiles` | Profile pictures                 |
| `listings` | Listing images (organized by listingId) |
