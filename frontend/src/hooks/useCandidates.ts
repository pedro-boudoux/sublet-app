import useSWR from 'swr';
import { ENDPOINTS } from '../lib/constants';
import type { Listing, User } from '../types';

// Generic fetcher for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch candidates');
  }
  return res.json();
};

interface UseCandidatesResult {
  candidates: (Listing | User)[];
  isLoading: boolean;
  isError: boolean;
  error: Error | undefined;
  mutate: () => void;
}

/**
 * Hook to fetch candidates for swiping
 * Returns listings for tenants, or user profiles for landlords
 */
export function useCandidates(): UseCandidatesResult {
  const { data, error, isLoading, mutate } = useSWR(
    ENDPOINTS.getCandidates,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      // Keep stale data while revalidating
      revalidateIfStale: false,
    }
  );

  return {
    candidates: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

// Mock data for development/demo
export const MOCK_LISTINGS: Listing[] = [
  {
    id: '1',
    ownerId: 'owner1',
    title: 'Sunny Studio in West Village',
    price: 1250,
    type: 'Studio',
    location: 'W 4th St',
    distanceInfo: '12 mins to NYU',
    availableDate: '2024-05-15',
    features: ['Utilities included', 'Furnished'],
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=1200&fit=crop'],
    isVerified: true,
  },
  {
    id: '2',
    ownerId: 'owner2',
    title: 'Modern 1BR in SoHo',
    price: 2100,
    type: '1BR',
    location: 'Prince St',
    distanceInfo: '5 mins to subway',
    availableDate: '2024-06-01',
    features: ['Rooftop access', 'Doorman'],
    images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=1200&fit=crop'],
    isVerified: true,
  },
  {
    id: '3',
    ownerId: 'owner3',
    title: 'Cozy Room in Brooklyn Heights',
    price: 950,
    type: '1BR',
    location: 'Montague St',
    distanceInfo: '20 mins to Manhattan',
    availableDate: '2024-05-20',
    features: ['Laundry in building', 'Pet friendly'],
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=1200&fit=crop'],
    isVerified: false,
  },
  {
    id: '4',
    ownerId: 'owner4',
    title: 'Bright 2BR in East Village',
    price: 2800,
    type: '2BR',
    location: 'Avenue B',
    distanceInfo: '3 mins to Tompkins Square',
    availableDate: '2024-06-15',
    features: ['Newly renovated', 'Dishwasher'],
    images: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=1200&fit=crop'],
    isVerified: true,
  },
  {
    id: '5',
    ownerId: 'owner5',
    title: 'Penthouse Studio in Midtown',
    price: 1800,
    type: 'Studio',
    location: '5th Ave',
    distanceInfo: 'Near Central Park',
    availableDate: '2024-05-25',
    features: ['City views', 'Gym access'],
    images: ['https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&h=1200&fit=crop'],
    isVerified: true,
  },
];

export const MOCK_USERS: User[] = [
  {
    id: 'user1',
    username: 'sarah_dev',
    email: 'sarah@example.com',
    fullName: 'Sarah Chen',
    age: 26,
    searchLocation: 'New York, NY',
    mode: 'looking',
    profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face',
    bio: 'Software engineer at a startup. Looking for a quiet place to work from home.',
    lifestyleTags: ['Non-Smoker', 'Early Bird', 'Very Clean', 'Works from Home'],
    isVerified: true,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
  },
  {
    id: 'user2',
    username: 'mike_j',
    email: 'mike@example.com',
    fullName: 'Mike Johnson',
    age: 29,
    searchLocation: 'Brooklyn, NY',
    mode: 'looking',
    profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    bio: 'Graduate student at NYU. I enjoy cooking and keeping things organized.',
    lifestyleTags: ['Non-Smoker', 'Student', 'Vegetarian'],
    isVerified: false,
    createdAt: '2024-02-01',
    updatedAt: '2024-02-01',
  },
];
