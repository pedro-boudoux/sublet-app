import useSWR from 'swr';
import { getMatches, type Match, type MatchesResponse } from '../lib/api';
import { useStore } from '../stores/useStore';

interface UseMatchesResult {
  matches: Match[];
  count: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | undefined;
  mutate: () => void;
}

/**
 * Hook to fetch matches for the current user
 */
export function useMatches(): UseMatchesResult {
  const user = useStore((state) => state.user);
  const userId = user?.id;

  const { data, error, isLoading, mutate } = useSWR<MatchesResponse>(
    userId ? ['matches', userId] : null,
    () => getMatches(userId!),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    matches: data?.matches || [],
    count: data?.count || 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
