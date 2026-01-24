import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '../components/layout/Header';
import { CardStack, type SwipeDirection } from '../components/discovery';
import { CardSkeleton, EmptyState, ErrorState } from '../components/ui';
import { useStore } from '../stores/useStore';
import { MOCK_LISTINGS } from '../hooks/useCandidates';
import type { Listing, User } from '../types';

interface CardData {
  id: string;
  type: 'listing' | 'user';
  data: Listing | User;
}

export function DiscoverPage() {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const setCurrentMatch = useStore((state) => state.setCurrentMatch);
  const addMatch = useStore((state) => state.addMatch);
  
  // Simulate loading state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<CardData[]>([]);
  const [isEmpty, setIsEmpty] = useState(false);
  
  // Simulate fetching data
  const loadCards = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsEmpty(false);
    
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // In production, this would be: const data = await fetch('/api/get-candidates')
      const data = MOCK_LISTINGS.map((listing) => ({
        id: listing.id,
        type: 'listing' as const,
        data: listing,
      }));
      
      setCards(data);
      setIsEmpty(data.length === 0);
    } catch (err) {
      setError('Failed to load listings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Load cards on mount
  useEffect(() => {
    if (user) {
      loadCards();
    }
  }, [user, loadCards]);
  
  const handleSwipe = useCallback((_id: string, direction: SwipeDirection, card: CardData) => {
    if (direction === 'right') {
      toast.success(`Liked ${card.type === 'listing' ? (card.data as Listing).title : (card.data as User).fullName}!`);
      
      // Simulate a match (30% chance)
      if (Math.random() < 0.3) {
        const match = {
          id: crypto.randomUUID(),
          tenantId: user?.id || 'demo-user',
          landlordId: card.type === 'listing' ? (card.data as Listing).ownerId : card.data.id,
          listingId: card.type === 'listing' ? card.data.id : '',
          createdAt: Date.now(),
        };
        
        addMatch(match);
        
        setCurrentMatch({
          user: {
            id: 'match-user',
            username: 'sarah',
            email: 'sarah@example.com',
            fullName: 'Sarah',
            age: 26,
            searchLocation: 'New York, NY',
            mode: 'offering',
            profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face',
            bio: '',
            lifestyleTags: [],
            isVerified: true,
            createdAt: '',
            updatedAt: '',
          },
        });
      }
    } else if (direction === 'left') {
      toast('Passed', { icon: '👋' });
    }
  }, [user, addMatch, setCurrentMatch]);
  
  const handleEmpty = useCallback(() => {
    setIsEmpty(true);
  }, []);
  
  // If no user profile, prompt to create one
  if (!user) {
    return (
      <div className="flex flex-col h-full">
        <Header />
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
      </div>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <Header />
        <div className="flex-1 flex flex-col px-4 py-2">
          {/* Skeleton card stack effect */}
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
          
          {/* Skeleton action buttons */}
          <div className="flex items-center justify-center gap-10 py-4">
            <div className="h-16 w-16 rounded-full bg-white/5 animate-pulse" />
            <div className="h-20 w-20 rounded-full bg-white/5 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex flex-col h-full">
        <Header />
        <ErrorState
          title="Couldn't load listings"
          message={error}
          onRetry={loadCards}
          className="flex-1"
        />
      </div>
    );
  }
  
  // Empty state (no more cards)
  if (isEmpty || cards.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <Header />
        <EmptyState
          icon={Layers}
          title="No more listings"
          description="You've seen all available listings. Check back later for new ones!"
          action={{
            label: 'Refresh',
            onClick: loadCards,
          }}
          className="flex-1"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header />
      
      {/* Refresh hint */}
      <div className="flex justify-center py-1">
        <button 
          onClick={loadCards}
          className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Refresh</span>
        </button>
      </div>
      
      {/* Card Stack */}
      <div className="flex-1 overflow-hidden">
        <CardStack
          cards={cards}
          onSwipe={handleSwipe}
          onEmpty={handleEmpty}
        />
      </div>
    </div>
  );
}
