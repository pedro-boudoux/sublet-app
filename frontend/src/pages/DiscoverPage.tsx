import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, RefreshCw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '../components/layout/Header';
import { CardStack, UserDetailModal, ListingDetailModal, FilterModal, type SwipeDirection } from '../components/discovery';
import { CardSkeleton, EmptyState, ErrorState } from '../components/ui';
import { useStore } from '../stores/useStore';
import { useCandidates } from '../hooks/useCandidates';
import { createSwipe, type ApiUser, type ApiListing } from '../lib/api';

interface CardData {
  id: string;
  data: ApiUser | ApiListing;
  type: 'user' | 'listing';
}

export function DiscoverPage() {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const setCurrentMatch = useStore((state) => state.setCurrentMatch);

  // Fetch candidates from API
  const { candidates, candidateType, isLoading: isFetchingCandidates, isValidating, error, mutate } = useCandidates();

  // Local state
  const [cards, setCards] = useState<CardData[]>([]);
  const [isEmpty, setIsEmpty] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [isSwipeLoading, setIsSwipeLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Get filters from store
  const selectedFilters = useStore((state) => state.selectedFilters);
  const selectedListingTypes = useStore((state) => state.selectedListingTypes);
  const selectedGenders = useStore((state) => state.selectedGenders);

  // Track previous mode to detect mode changes
  const prevModeRef = useRef(user?.mode);
  const [isModeTransitioning, setIsModeTransitioning] = useState(false);
  const [minimumLoadingTimeElapsed, setMinimumLoadingTimeElapsed] = useState(true);

  // Track if we've initialized cards to prevent infinite loops
  const hasInitialized = useRef(false);
  const lastCandidatesLength = useRef(-1);

  // Detect mode changes and trigger smooth transition
  useEffect(() => {
    if (user?.mode && prevModeRef.current !== user.mode) {
      prevModeRef.current = user.mode;
      setIsModeTransitioning(true);
      setMinimumLoadingTimeElapsed(false); // Reset for new transition
      setMinimumLoadingTimeElapsed(false); // Reset for new transition
      hasInitialized.current = false;
      lastCandidatesLength.current = -1;
      setCards([]);

      // Start minimum loading time timer
      const timer = setTimeout(() => {
        setMinimumLoadingTimeElapsed(true);
      }, 2500); // 2.5 seconds
      return () => clearTimeout(timer);
    }
  }, [user?.mode, setCards]);

  // Clear transition state when loading completes AND minimum time has passed
  useEffect(() => {
    if (isModeTransitioning && !isFetchingCandidates && !isValidating && minimumLoadingTimeElapsed) {
      // Small delay for smoother animation
      const timer = setTimeout(() => {
        setIsModeTransitioning(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isModeTransitioning, isFetchingCandidates, isValidating, minimumLoadingTimeElapsed]);

  // Detect filter changes and trigger refresh animation
  const [isFiltering, setIsFiltering] = useState(false);
  const prevFiltersRef = useRef(JSON.stringify({ selectedFilters, selectedListingTypes, selectedGenders }));

  useEffect(() => {
    const currentFilters = JSON.stringify({ selectedFilters, selectedListingTypes, selectedGenders });
    if (prevFiltersRef.current !== currentFilters) {
      prevFiltersRef.current = currentFilters;
      setIsFiltering(true);
      const timer = setTimeout(() => {
        setIsFiltering(false);
      }, 800); // 800ms "refresh" animation
      return () => clearTimeout(timer);
    }
  }, [selectedFilters, selectedListingTypes, selectedGenders]);

  // Initialize cards from API candidates
  useEffect(() => {
    // Only update if loading finished and candidates changed
    if (isFetchingCandidates) {
      hasInitialized.current = false;
      return;
    }

    // Map candidates to card data with type
    const itemType = candidateType === 'listings' ? 'listing' : 'user';
    let filteredCandidates = candidates;

    // Apply client-side filtering based on selectedFilters
    if (selectedFilters.length > 0) {
      filteredCandidates = filteredCandidates.filter((candidate) => {
        const candidateTags = candidate.lifestyleTags || [];
        // Check if candidate has ALL selected filter tags
        return selectedFilters.every((filter) => candidateTags.includes(filter));
      });
    }

    // Apply listing type filtering (only for listings)
    if (selectedListingTypes.length > 0 && candidateType === 'listings') {
      filteredCandidates = filteredCandidates.filter((candidate) => {
        const listing = candidate as ApiListing;
        return selectedListingTypes.includes(listing.type);
      });
    }

    // Apply gender filtering (only for users - offerers filtering tenants)
    if (selectedGenders.length > 0 && candidateType === 'users') {
      filteredCandidates = filteredCandidates.filter((candidate) => {
        const user = candidate as ApiUser;
        return selectedGenders.includes(user.gender);
      });
    }

    const cardData = filteredCandidates.map((candidate) => ({
      id: candidate.id,
      data: candidate,
      type: itemType as 'user' | 'listing',
    }));

    setCards(cardData);
    setIsEmpty(cardData.length === 0);
    hasInitialized.current = true;
    lastCandidatesLength.current = candidates.length;
  }, [candidates, candidateType, isFetchingCandidates, selectedFilters, selectedListingTypes, selectedGenders]);

  // Helper to get display name
  const getDisplayName = (card: CardData) => {
    if (card.type === 'listing') {
      return (card.data as ApiListing).title;
    }
    return (card.data as ApiUser).fullName;
  };

  // Handle like action
  const handleLike = useCallback(async (card: CardData) => {
    if (!user || isSwipeLoading) return;

    setIsSwipeLoading(true);

    try {
      // Record swipe via API with correct type
      const result = await createSwipe({
        swiperId: user.id,
        swipedId: card.id,
        swipedType: card.type,
        direction: 'like',
      });

      toast.success(`Liked ${getDisplayName(card)}!`);

      // Check if it's a match
      if (result.matched) {
        if (card.type === 'user') {
          setCurrentMatch({
            matchedUser: card.data as ApiUser,
          });
        } else {
          // For listing matches, we'd need to show a different modal
          // For now, just show a toast
          toast.success("🎉 It's a match! The owner also likes your profile.");
        }
      }
    } catch (error) {
      console.error('Swipe failed:', error);
      toast.success(`Liked ${getDisplayName(card)}!`);
    } finally {
      setIsSwipeLoading(false);
    }
  }, [user, isSwipeLoading, setCurrentMatch]);

  // Handle pass action
  const handlePass = useCallback(async (card: CardData) => {
    if (!user || isSwipeLoading) return;

    try {
      // Record swipe via API
      await createSwipe({
        swiperId: user.id,
        swipedId: card.id,
        swipedType: card.type,
        direction: 'pass',
      });
    } catch (error) {
      console.error('Pass swipe failed:', error);
    }

    toast('Passed', { icon: '👋' });
  }, [user, isSwipeLoading]);

  const handleSwipe = useCallback((_id: string, direction: SwipeDirection, card: CardData) => {
    if (direction === 'right') {
      handleLike(card);
    } else if (direction === 'left') {
      handlePass(card);
    }
  }, [handleLike, handlePass]);

  const handleEmpty = useCallback(() => {
    setIsEmpty(true);
  }, []);

  const handleCardTap = useCallback((card: CardData) => {
    setSelectedCard(card);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedCard(null);
  }, []);

  const handleRefresh = useCallback(() => {
    hasInitialized.current = false;
    lastCandidatesLength.current = -1;
    mutate();
  }, [mutate]);

  // If no user profile, prompt to create one
  if (!user) {
    return (
      <div className="flex flex-col h-full">
        <Header onFilterClick={() => setIsFilterOpen(true)} />
        <EmptyState
          icon={Layers}
          title="Create your profile first"
          description="You need a profile to start discovering listings and connect with landlords."
          action={{
            label: 'Create Profile',
            onClick: () => navigate('/onboarding'),
          }}
          className="flex-1"
        />
        <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
      </div>
    );
  }

  // Loading state (initial load)
  if (isFetchingCandidates && !isModeTransitioning) {
    return (
      <div className="flex flex-col h-full">
        <Header onFilterClick={() => setIsFilterOpen(true)} />
        <div className="flex-1 flex flex-col px-4 py-2">
          <div className="relative flex-1">
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[85%] h-[calc(100%-120px)] rounded-2xl card-stack-1">
              <CardSkeleton />
            </div>
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[90%] h-[calc(100%-120px)] rounded-2xl card-stack-2">
              <CardSkeleton />
            </div>
            <div className="absolute top-0 left-0 right-0 h-[calc(100%-80px)]">
              <CardSkeleton />
            </div>
          </div>
          <div className="flex items-center justify-center gap-10 py-4">
            <div className="h-16 w-16 rounded-full bg-white/5 animate-pulse" />
            <div className="h-20 w-20 rounded-full bg-white/5 animate-pulse" />
          </div>
        </div>
        <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col h-full">
        <Header onFilterClick={() => setIsFilterOpen(true)} />
        <ErrorState
          title="Couldn't load candidates"
          message={error?.message || 'Failed to load. Please try again.'}
          onRetry={handleRefresh}
          className="flex-1"
        />
        <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
      </div>
    );
  }

  // Empty state
  if (isEmpty || cards.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <Header onFilterClick={() => setIsFilterOpen(true)} />
        <EmptyState
          icon={Layers}
          title="No more candidates"
          description="You've seen everyone! Check back later for new people."
          action={{
            label: 'Refresh',
            onClick: handleRefresh,
          }}
          className="flex-1"
        />
        <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      <Header onFilterClick={() => setIsFilterOpen(true)} />

      {/* Refresh hint */}
      <div className="flex justify-center py-1">
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main content area */}
      <div className="flex-1 relative">
        {/* Loading spinner for mode transition */}
        {(isModeTransitioning || isValidating || !minimumLoadingTimeElapsed || isFiltering) && (
          <div className="absolute inset-0 flex items-center justify-center z-10 transition-opacity duration-300 opacity-100">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
        )}

        {/* Card Stack - hidden during transition */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${isModeTransitioning || isValidating || !minimumLoadingTimeElapsed || isFiltering ? 'opacity-0' : 'opacity-100'}`}>
          <CardStack
            cards={cards}
            onSwipe={handleSwipe}
            onEmpty={handleEmpty}
            onCardTap={handleCardTap}
          />
        </div>
      </div>

      {/* Detail Modal - shows user details or listing details based on type */}
      {selectedCard && selectedCard.type === 'user' && (
        <UserDetailModal
          user={selectedCard.data as ApiUser}
          onClose={handleCloseDetail}
          onLike={() => handleLike(selectedCard)}
          onPass={() => handlePass(selectedCard)}
        />
      )}
      {selectedCard && selectedCard.type === 'listing' && (
        <ListingDetailModal
          listing={selectedCard.data as ApiListing}
          onClose={handleCloseDetail}
          onLike={() => handleLike(selectedCard)}
          onPass={() => handlePass(selectedCard)}
        />
      )}

      {/* Filter Modal */}
      <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
    </div>
  );
}



