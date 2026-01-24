// User Profile
export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  age: number;
  searchLocation: string;
  mode: 'looking' | 'offering';
  profilePicture: string;
  bio: string;
  lifestyleTags: string[];
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Listing (for landlords offering places)
export interface Listing {
  id: string;
  ownerId: string;
  title: string;
  price: number;
  type: 'Studio' | '1BR' | '2BR' | '3BR+';
  location: string;
  distanceInfo: string;
  availableDate: string;
  features: string[];
  images: string[];
  isVerified: boolean;
}

// Swipe Action
export interface Swipe {
  id: string;
  swiperId: string;
  targetId: string;
  targetType: 'listing' | 'user';
  action: 'like' | 'pass';
  timestamp: number;
}

// Match
export interface Match {
  id: string;
  tenantId: string;
  landlordId: string;
  listingId: string;
  createdAt: number;
}

// Card data for swiping (can be either a listing or user profile)
export interface SwipeCard {
  id: string;
  type: 'listing' | 'user';
  data: Listing | User;
}

// Lifestyle tag options
export const LIFESTYLE_TAGS = [
  'Non-Smoker',
  'Social Drinker',
  'Early Bird',
  'Night Owl',
  'Pet Friendly',
  'Dog Lover',
  'Cat Lover',
  'Very Clean',
  'Vegetarian',
  'Vegan',
  'Works from Home',
  'Student',
  'Professional',
  'Quiet',
  'Social',
] as const;

export type LifestyleTag = typeof LIFESTYLE_TAGS[number];
