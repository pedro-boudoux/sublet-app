import useSWR from 'swr';
import { useStore } from '../stores/useStore';
import { getListings, type ApiListing } from '../lib/api';

interface UseUserListingResult {
  listing: ApiListing | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | undefined;
  mutate: () => void;
}

/**
 * Hook to fetch the single listing owned by the current user
 */
export function useUserListing(): UseUserListingResult {
  const user = useStore((state) => state.user);
  const hasHydrated = useStore((state) => state._hasHydrated);
  const userId = user?.id;

  const { data, error, isLoading, mutate } = useSWR<ApiListing[]>(
    // Only fetch after hydration and when we have a userId
    hasHydrated && userId ? ['user-listing', userId] : null,
    ([, ownerId]) => getListings({ ownerId }),
    {
      revalidateOnFocus: false,
      revalidateOnMount: true,
      revalidateIfStale: true,
    }
  );

  return {
    listing: data?.[0], // Users only have one listing
    isLoading: !hasHydrated || (!userId ? false : isLoading), // Loading if not hydrated
    isError: !!error,
    error,
    mutate,
  };
}
