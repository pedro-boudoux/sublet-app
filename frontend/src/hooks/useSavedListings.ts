import useSWR from 'swr';
import { getSavedListings, type SavedListing, type SavedListingsResponse } from '../lib/api';
import { useStore } from '../stores/useStore';

interface UseSavedListingsResult {
    savedListings: SavedListing[];
    isLoading: boolean;
    isError: boolean;
    error: Error | undefined;
    mutate: () => void;
}

/**
 * Hook to fetch saved listings for the current user
 * Only for users in "looking" mode
 */
export function useSavedListings(): UseSavedListingsResult {
    const user = useStore((state) => state.user);
    const userId = user?.id;

    const { data, error, isLoading, mutate } = useSWR<SavedListingsResponse>(
        userId ? ['savedListings', userId] : null,
        () => getSavedListings(userId!),
        {
            revalidateOnFocus: false,
        }
    );

    return {
        savedListings: data?.savedListings || [],
        isLoading,
        isError: !!error,
        error,
        mutate,
    };
}
