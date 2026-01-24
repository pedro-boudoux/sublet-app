# Sublet App — API Endpoints

This document defines all the backend API endpoints needed for the SubletConnect app.

---

## 1. User/Profile Endpoints

| Method   | Endpoint            | Purpose                                                      |
|----------|---------------------|--------------------------------------------------------------|
| `POST`   | `/api/users`        | Create a new user profile (after Azure Auth login)          |
| `GET`    | `/api/users/:userId`| Get a specific user's profile                                |
| `PATCH`  | `/api/users/:userId`| Update user profile (about, lifestyle tags, location, mode) |
| `DELETE` | `/api/users/:userId`| Delete a user account                                        |

**User Model Fields:**
- `id` — unique identifier (UUID)
- `name`, `age`, `location`
- `profilePicture` — URL
- `bio` — "About Me" text
- `mode` — `"looking"` | `"offering"`
- `lifestyleTags` — array of strings (e.g. `["Non-Smoker", "Pet Friendly"]`)
- `isVerified` — boolean (social verification status)
- `createdAt`, `updatedAt`

---

## 2. Discovery/Feed Endpoints

| Method | Endpoint          | Purpose                                                |
|--------|-------------------|--------------------------------------------------------|
| `GET`  | `/api/candidates` | Fetch swipeable candidates for the current user       |

**Query Parameters:**
- `userId` — the current user (to exclude already-swiped and self)
- `location` — optional filter by city/region
- `limit` — number of candidates to return (default: 20)

**Logic:**
- Returns users with the **opposite mode** (if I'm "looking", show "offering" users)
- Excludes users the current user has already swiped on
- Excludes the current user themselves

---

## 3. Swipe Endpoints

| Method | Endpoint      | Purpose                                      |
|--------|---------------|----------------------------------------------|
| `POST` | `/api/swipes` | Record a swipe action on a candidate         |

**Request Body:**
```json
{
  "swiperId": "uuid",
  "swipedUserId": "uuid",
  "direction": "like" | "pass" | "superlike"
}
```

**Logic:**
- Store the swipe in the `swipes` container
- If `direction` is `"like"` or `"superlike"`, check if the other user has already liked the current user
- If mutual like → create a new **match** and return `{ matched: true, matchId: "..." }`

---

## 4. Match Endpoints

| Method | Endpoint              | Purpose                                |
|--------|-----------------------|----------------------------------------|
| `GET`  | `/api/matches`        | Get all matches for the current user   |
| `GET`  | `/api/matches/:matchId`| Get details of a specific match       |

**Match Model Fields:**
- `id` — unique match ID
- `userIds` — array of two user IDs involved in the match
- `listingId` — the listing they matched on (if applicable)
- `createdAt`

---

## 5. Listing Endpoints

For users in **"offering"** mode who create sublet listings.

| Method   | Endpoint                 | Purpose                        |
|----------|--------------------------|--------------------------------|
| `POST`   | `/api/listings`          | Create a new sublet listing    |
| `GET`    | `/api/listings/:listingId`| Get a specific listing         |
| `PATCH`  | `/api/listings/:listingId`| Update a listing               |
| `DELETE` | `/api/listings/:listingId`| Delete a listing               |

**Listing Model Fields:**
- `id` — unique listing ID
- `ownerId` — user ID of the person offering the sublet
- `title` — e.g. "Sunny Studio in West Village"
- `price` — monthly rent in dollars
- `availableDate` — when the sublet becomes available
- `location` — address or neighborhood
- `distanceTo` — e.g. "12 mins to NYU"
- `type` — `"studio"` | `"1br"` | `"2br"` | `"room"`
- `amenities` — array of strings (e.g. `["Utilities included", "Furnished"]`)
- `images` — array of image URLs
- `isVerified` — boolean
- `createdAt`, `updatedAt`

---

## 6. Messaging Endpoints *(Future / V2)*

For in-app communication after a match occurs.

| Method | Endpoint                                     | Purpose                          |
|--------|----------------------------------------------|----------------------------------|
| `GET`  | `/api/conversations`                         | Get all conversations for user   |
| `GET`  | `/api/conversations/:conversationId/messages`| Get messages in a conversation   |
| `POST` | `/api/conversations/:conversationId/messages`| Send a new message               |

---

## Implementation Priority

1. **Users** — Core identity and auth integration
2. **Listings** — What users swipe on
3. **Candidates** — Enhanced filtering (already partially done)
4. **Swipes** — Core mechanic of the app
5. **Matches** — Result of mutual likes
6. **Messaging** — Post-match communication (v2)

---

## Database Containers (Cosmos DB)

| Container       | Partition Key | Purpose                      |
|-----------------|---------------|------------------------------|
| `users`         | `/id`         | User profiles                |
| `listings`      | `/ownerId`    | Sublet listings              |
| `swipes`        | `/swiperId`   | Swipe actions                |
| `matches`       | `/id`         | Mutual matches               |
| `messages`      | `/conversationId` | Chat messages (v2)       |
