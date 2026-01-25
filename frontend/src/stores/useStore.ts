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

  // Filter state for discovery
  selectedFilters: string[];
  setSelectedFilters: (filters: string[]) => void;
  toggleFilter: (filter: string) => void;
  selectedListingTypes: string[];
  toggleListingType: (type: string) => void;
  selectedGenders: string[];
  toggleGender: (gender: string) => void;
  clearFilters: () => void;

  // Hydration state
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

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

      // Filters
      selectedFilters: [],
      setSelectedFilters: (selectedFilters) => set({ selectedFilters }),
      toggleFilter: (filter) => set((state) => ({
        selectedFilters: state.selectedFilters.includes(filter)
          ? state.selectedFilters.filter((f) => f !== filter)
          : [...state.selectedFilters, filter],
      })),
      selectedListingTypes: [],
      toggleListingType: (type) => set((state) => ({
        selectedListingTypes: state.selectedListingTypes.includes(type)
          ? state.selectedListingTypes.filter((t) => t !== type)
          : [...state.selectedListingTypes, type],
      })),
      selectedGenders: [],
      toggleGender: (gender) => set((state) => ({
        selectedGenders: state.selectedGenders.includes(gender)
          ? state.selectedGenders.filter((g) => g !== gender)
          : [...state.selectedGenders, gender],
      })),
      clearFilters: () => set({ selectedFilters: [], selectedListingTypes: [], selectedGenders: [] }),

      // Hydration
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      // Clear user data
      clearUser: () => set({ user: null, isOnboarded: false, currentMatch: null, selectedFilters: [], selectedListingTypes: [], selectedGenders: [] }),
    }),
    {
      name: 'sublet-storage', // localStorage key
      partialize: (state) => ({
        user: state.user,
        isOnboarded: state.isOnboarded,
        selectedFilters: state.selectedFilters,
        selectedListingTypes: state.selectedListingTypes,
        selectedGenders: state.selectedGenders,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
