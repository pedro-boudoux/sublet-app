import { create } from 'zustand';
import type { User, Match, SwipeCard } from '../types';

interface AppState {
  // Current user
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Matches list
  matches: Match[];
  addMatch: (match: Match) => void;
  setMatches: (matches: Match[]) => void;
  
  // Current match (for showing match overlay)
  currentMatch: { user: User; listing?: SwipeCard } | null;
  setCurrentMatch: (match: { user: User; listing?: SwipeCard } | null) => void;
  
  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Onboarding complete flag
  isOnboarded: boolean;
  setIsOnboarded: (onboarded: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  // User
  user: null,
  setUser: (user) => set({ user }),
  
  // Matches
  matches: [],
  addMatch: (match) => set((state) => ({ matches: [...state.matches, match] })),
  setMatches: (matches) => set({ matches }),
  
  // Current Match Overlay
  currentMatch: null,
  setCurrentMatch: (currentMatch) => set({ currentMatch }),
  
  // Loading
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
  
  // Onboarding
  isOnboarded: false,
  setIsOnboarded: (isOnboarded) => set({ isOnboarded }),
}));
