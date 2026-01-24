import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Header } from '../components/layout/Header';
import { CardStack, type SwipeDirection } from '../components/discovery';
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
  
  // Convert mock listings to card data
  // In production, this would come from useCandidates hook
  const [cards] = useState<CardData[]>(() =>
    MOCK_LISTINGS.map((listing) => ({
      id: listing.id,
      type: 'listing' as const,
      data: listing,
    }))
  );
  
  const handleSwipe = useCallback((_id: string, direction: SwipeDirection, card: CardData) => {
    if (direction === 'right') {
      // Liked
      toast.success(`Liked ${card.type === 'listing' ? (card.data as Listing).title : (card.data as User).fullName}!`);
      
      // Simulate a match (in production, this would check with the backend)
      // For demo, 30% chance of match
      if (Math.random() < 0.3) {
        // Create match
        const match = {
          id: crypto.randomUUID(),
          tenantId: user?.id || 'demo-user',
          landlordId: card.type === 'listing' ? (card.data as Listing).ownerId : card.data.id,
          listingId: card.type === 'listing' ? card.data.id : '',
          createdAt: Date.now(),
        };
        
        addMatch(match);
        
        // Show match overlay
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
      // Passed
      toast('Passed', { icon: '👋' });
    }
  }, [user, addMatch, setCurrentMatch]);
  
  const handleEmpty = useCallback(() => {
    toast('No more listings! Check back later.', { icon: '📭' });
  }, []);
  
  // If no user profile, prompt to create one
  if (!user) {
    return (
      <div className="flex flex-col h-full">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          <div className="text-center text-white/60">
            <p className="text-lg font-medium mb-2">Create your profile first</p>
            <p className="text-sm">You need a profile to start swiping</p>
          </div>
          <button
            onClick={() => navigate('/onboarding')}
            className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            Create Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header />
      
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
