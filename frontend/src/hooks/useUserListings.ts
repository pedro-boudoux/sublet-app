import useSWR from 'swr';
import { useStore } from '../stores/useStore';
import type { ApiListing } from '../lib/api';

// Note: The backend doesn't have a getUserListings endpoint yet,
// so we'll use a mock implementation that can be swapped out later
// when the endpoint is added.

interface UseUserListingsResult {
  listings: ApiListing[];
  isLoading: boolean;
  isError: boolean;
  error: Error | undefined;
  mutate: () => void;
}

/**
 * Hook to fetch listings owned by the current user
 * Currently returns empty array - backend endpoint needed
 */
export function useUserListings(): UseUserListingsResult {
  const user = useStore((state) => state.user);
  const userId = user?.id;

  // TODO: Replace with actual API call when endpoint exists
  // For now, return empty listings
  const { data, error, isLoading, mutate } = useSWR<ApiListing[]>(
    userId ? ['user-listings', userId] : null,
    // Mock fetcher - replace with actual API call
    async () => {
      // Placeholder: In production, this would call GET /api/listings?ownerId={userId}
      return [];
    },
    {
      revalidateOnFocus: false,
    }
  );

  return {
    listings: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
