import useSWR from 'swr';
import { getCandidates, type ApiUser, type ApiListing, type CandidatesResponse } from '../lib/api';
import { useStore } from '../stores/useStore';

interface UseCandidatesResult {
  candidates: (ApiUser | ApiListing)[];
  candidateType: 'users' | 'listings' | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | undefined;
  mutate: () => void;
}

/**
 * Hook to fetch candidates for swiping
 * Returns listings for "looking" users, users for "offering" users
 */
export function useCandidates(): UseCandidatesResult {
  const user = useStore((state) => state.user);
  const userId = user?.id;

  const { data, error, isLoading, mutate } = useSWR<CandidatesResponse>(
    userId ? ['candidates', userId] : null,
    () => getCandidates(userId!, { limit: 20 }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    }
  );

  return {
    candidates: data?.candidates || [],
    candidateType: data?.type || null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

// Mock data for development/demo when API is unavailable
export const MOCK_LISTINGS: ApiUser[] = [
  {
    id: 'mock-1',
    username: 'sunny_studio',
    email: 'owner1@example.com',
    fullName: 'Sunny Studio Owner',
    age: 28,
    searchLocation: 'New York, NY',
    mode: 'offering',
    profilePicture: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=1200&fit=crop',
    bio: 'Offering a sunny studio in West Village. Great natural light, close to NYU.',
    lifestyleTags: ['Non-Smoker', 'Pet Friendly', 'Quiet'],
    isVerified: true,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
  },
  {
    id: 'mock-2',
    username: 'soho_modern',
    email: 'owner2@example.com',
    fullName: 'SoHo Apartment Owner',
    age: 32,
    searchLocation: 'New York, NY',
    mode: 'offering',
    profilePicture: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=1200&fit=crop',
    bio: 'Modern 1BR in SoHo with rooftop access and doorman.',
    lifestyleTags: ['Professional', 'Very Clean'],
    isVerified: true,
    createdAt: '2024-02-01',
    updatedAt: '2024-02-01',
  },
  {
    id: 'mock-3',
    username: 'brooklyn_cozy',
    email: 'owner3@example.com',
    fullName: 'Brooklyn Heights Host',
    age: 26,
    searchLocation: 'Brooklyn, NY',
    mode: 'offering',
    profilePicture: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=1200&fit=crop',
    bio: 'Cozy room in Brooklyn Heights. Laundry in building, pet friendly.',
    lifestyleTags: ['Dog Lover', 'Social'],
    isVerified: false,
    createdAt: '2024-02-10',
    updatedAt: '2024-02-10',
  },
  {
    id: 'mock-4',
    username: 'east_village',
    email: 'owner4@example.com',
    fullName: 'East Village Lister',
    age: 30,
    searchLocation: 'New York, NY',
    mode: 'offering',
    profilePicture: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=1200&fit=crop',
    bio: 'Bright 2BR in East Village. Newly renovated with dishwasher.',
    lifestyleTags: ['Non-Smoker', 'Early Bird'],
    isVerified: true,
    createdAt: '2024-02-15',
    updatedAt: '2024-02-15',
  },
  {
    id: 'mock-5',
    username: 'midtown_penthouse',
    email: 'owner5@example.com',
    fullName: 'Midtown Host',
    age: 35,
    searchLocation: 'New York, NY',
    mode: 'offering',
    profilePicture: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&h=1200&fit=crop',
    bio: 'Penthouse studio near Central Park with city views and gym access.',
    lifestyleTags: ['Professional', 'Very Clean', 'Works from Home'],
    isVerified: true,
    createdAt: '2024-02-20',
    updatedAt: '2024-02-20',
  },
];
