/**
 * API Client for SubletConnect Backend
 * 
 * User Endpoints:
 * - POST /api/users - Create user
 * - GET /api/users/{userId} - Get user
 * - PATCH /api/users/{userId} - Update user
 * - DELETE /api/users/{userId} - Delete user
 * 
 * Listing Endpoints:
 * - POST /api/listings - Create listing
 * - GET /api/listings/{listingId} - Get listing
 * - PATCH /api/listings/{listingId} - Update listing
 * - DELETE /api/listings/{listingId} - Delete listing
 * 
 * Discovery Endpoints:
 * - GET /api/candidates - Get candidates for swiping
 * 
 * Swipe Endpoints:
 * - POST /api/swipes - Record swipe
 * 
 * Match Endpoints:
 * - GET /api/matches - Get matches
 * - GET /api/matches/{matchId} - Get specific match
 */

const API_BASE = '/api';

// ============ Type Definitions ============

// User Types
export interface ApiUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  searchLocation: string;
  mode: 'looking' | 'offering';
  profilePicture: string;
  bio: string;
  lifestyleTags: string[];
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  identityId: string;  // Azure SWA identity ID
  username: string;
  email: string;
  fullName: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  searchLocation: string;
  mode: 'looking' | 'offering';
  profilePicture?: string;
  bio?: string;
  lifestyleTags?: string[];
}

export interface UpdateUserRequest {
  fullName?: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
  searchLocation?: string;
  mode?: 'looking' | 'offering';
  profilePicture?: string;
  bio?: string;
  lifestyleTags?: string[];
}

// Listing Types
export type ListingType = 'studio' | '1br' | '2br' | 'room';

export interface ApiListing {
  id: string;
  ownerId: string;
  title: string;
  price: number;
  availableDate: string;
  location: string;
  distanceTo: string;
  type: ListingType;
  amenities: string[];
  lifestyleTags: string[];  // Offering-style tags like "Dog Friendly"
  images: string[];
  description: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateListingRequest {
  ownerId: string;
  title: string;
  price: number;
  availableDate: string;
  location: string;
  type: ListingType;
  distanceTo?: string;
  amenities?: string[];
  lifestyleTags?: string[];
  images?: string[];
  description?: string;
}

export interface UpdateListingRequest {
  title?: string;
  price?: number;
  availableDate?: string;
  location?: string;
  distanceTo?: string;
  type?: ListingType;
  amenities?: string[];
  lifestyleTags?: string[];
  images?: string[];
  description?: string;
}

// Swipe Types
export interface SwipeRequest {
  swiperId: string;
  swipedId: string;  // User ID or Listing ID
  swipedType: 'user' | 'listing';
  direction: 'like' | 'pass';
}

export interface SwipeResponse {
  swipeId: string;
  matched: boolean;
  matchId: string | null;
}

// Match Types
export interface MatchedUser {
  id: string;
  username: string;
  fullName: string;
  profilePicture: string;
  searchLocation: string;
}

export interface Match {
  matchId: string;
  matchedAt: string;
  matchedUser: MatchedUser | null;
}

// Response Types
export interface CandidatesResponse {
  candidates: (ApiUser | ApiListing)[];  // Users or Listings depending on mode
  type: 'users' | 'listings';
  count: number;
  filters: {
    location: string | null;
    limit: number;
  };
}

export interface MatchesResponse {
  matches: Match[];
  count: number;
}

// ============ API Error ============

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// ============ Generic Fetch Wrapper ============

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
  } catch (err) {
    // Network error - server not reachable
    console.error(`API request failed: ${API_BASE}${endpoint}`, err);
    throw new ApiError(
      'Cannot connect to server. Make sure the backend is running.',
      0
    );
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
    throw new ApiError(errorData.error || `Request failed: ${response.statusText}`, response.status);
  }

  return response.json();
}

// ============ User API ============

export async function createUser(data: CreateUserRequest): Promise<ApiUser> {
  return fetchApi<ApiUser>('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getUser(userId: string): Promise<ApiUser> {
  return fetchApi<ApiUser>(`/users/${userId}`);
}

export async function updateUser(userId: string, data: UpdateUserRequest): Promise<ApiUser> {
  return fetchApi<ApiUser>(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteUser(userId: string): Promise<void> {
  await fetchApi(`/users/${userId}`, {
    method: 'DELETE',
  });
}

// ============ Listing API ============

export async function createListing(data: CreateListingRequest): Promise<ApiListing> {
  return fetchApi<ApiListing>('/listings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getListings(filters?: { ownerId?: string }): Promise<ApiListing[]> {
  const params = new URLSearchParams();
  if (filters?.ownerId) params.append('ownerId', filters.ownerId);

  return fetchApi<ApiListing[]>(`/listings?${params}`);
}

export async function getListing(listingId: string): Promise<ApiListing> {
  return fetchApi<ApiListing>(`/listings/${listingId}`);
}

export async function updateListing(listingId: string, data: UpdateListingRequest): Promise<ApiListing> {
  return fetchApi<ApiListing>(`/listings/${listingId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteListing(listingId: string): Promise<void> {
  await fetchApi(`/listings/${listingId}`, {
    method: 'DELETE',
  });
}

// ============ Image Upload API ============

export interface UploadListingImageRequest {
  listingId: string;
  image: string; // Base64 encoded image data
  mimeType: string;
}

export interface UploadListingImageResponse {
  url: string;
  blobName: string;
  size: number;
  mimeType: string;
  listingId: string;
  totalImages: number;
}

export async function uploadListingImage(data: UploadListingImageRequest): Promise<UploadListingImageResponse> {
  return fetchApi<UploadListingImageResponse>('/upload/listing', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Profile Image Upload
export interface UploadProfileImageRequest {
  image: string; // Base64 encoded image data
  mimeType: string;
  fileName?: string;
}

export interface UploadProfileImageResponse {
  url: string;
  blobName: string;
  size: number;
  mimeType: string;
}

export async function uploadProfileImage(data: UploadProfileImageRequest): Promise<UploadProfileImageResponse> {
  return fetchApi<UploadProfileImageResponse>('/upload/profile', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============ Locations API ============

export interface LocationsResponse {
  locations: string[];
  count: number;
}

export async function getLocations(): Promise<LocationsResponse> {
  return fetchApi<LocationsResponse>('/locations');
}

// ============ Candidates API ============

export async function getCandidates(
  userId: string,
  options?: { location?: string; limit?: number }
): Promise<CandidatesResponse> {
  const params = new URLSearchParams({ userId });
  if (options?.location) params.append('location', options.location);
  if (options?.limit) params.append('limit', options.limit.toString());

  return fetchApi<CandidatesResponse>(`/candidates?${params}`);
}

// ============ Swipes API ============

export async function createSwipe(data: SwipeRequest): Promise<SwipeResponse> {
  return fetchApi<SwipeResponse>('/swipes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export interface ResetSwipesResponse {
  message: string;
  deletedCount: number;
}

export async function resetSwipes(userId: string): Promise<ResetSwipesResponse> {
  return fetchApi<ResetSwipesResponse>(`/swipes/reset?userId=${userId}`, {
    method: 'DELETE',
  });
}

// ============ Matches API ============

export async function getMatches(userId: string): Promise<MatchesResponse> {
  return fetchApi<MatchesResponse>(`/matches?userId=${userId}`);
}

export async function getMatch(matchId: string): Promise<Match> {
  return fetchApi<Match>(`/matches/${matchId}`);
}

// ============ Messages API ============

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  timestamp: string;
}

export interface MessagesResponse {
  messages: Message[];
  count: number;
}

export async function getMessages(matchId: string, userId: string): Promise<MessagesResponse> {
  return fetchApi<MessagesResponse>(`/messages/${matchId}?userId=${userId}`);
}

export interface SendMessageRequest {
  matchId: string;
  senderId: string;
  content: string;
}

export async function sendMessage(data: SendMessageRequest): Promise<Message> {
  return fetchApi<Message>('/messages', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============ Saved Listings API ============

export interface SavedListing extends ApiListing {
  savedAt: string;
}

export interface SavedListingsResponse {
  savedListings: SavedListing[];
  count: number;
}

export async function saveListing(userId: string, listingId: string): Promise<{ id: string; listingId: string; savedAt: string }> {
  return fetchApi('/saved', {
    method: 'POST',
    body: JSON.stringify({ userId, listingId }),
  });
}

export async function getSavedListings(userId: string): Promise<SavedListingsResponse> {
  return fetchApi<SavedListingsResponse>(`/saved?userId=${userId}`);
}

export async function unsaveListing(userId: string, listingId: string): Promise<void> {
  await fetchApi(`/saved/${listingId}?userId=${userId}`, {
    method: 'DELETE',
  });
}

