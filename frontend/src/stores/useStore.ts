import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ApiUser } from '../lib/api';

interface AppState {
  // Current user (persisted to localStorage)
  user: ApiUser | null;
  setUser: (user: ApiUser | null) => void;
  
  // Current match (for showing match overlay)
  currentMatch: { matchedUser: ApiUser } | null;
  setCurrentMatch: (match: { matchedUser: ApiUser } | null) => void;
  
  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Onboarding complete flag
  isOnboarded: boolean;
  setIsOnboarded: (onboarded: boolean) => void;
  
  // Clear all user data (logout)
  clearUser: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // User
      user: null,
      setUser: (user) => set({ user }),
      
      // Current Match Overlay
      currentMatch: null,
      setCurrentMatch: (currentMatch) => set({ currentMatch }),
      
      // Loading
      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),
      
      // Onboarding
      isOnboarded: false,
      setIsOnboarded: (isOnboarded) => set({ isOnboarded }),
      
      // Clear user data
      clearUser: () => set({ user: null, isOnboarded: false, currentMatch: null }),
    }),
    {
      name: 'sublet-storage', // localStorage key
      partialize: (state) => ({ 
        user: state.user, 
        isOnboarded: state.isOnboarded 
      }),
    }
  )
);
