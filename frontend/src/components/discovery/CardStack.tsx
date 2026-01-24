import { useState, useRef, useCallback } from 'react';
import { SwipeCard, type SwipeDirection } from './SwipeCard';
import { ActionButtons } from './ActionButtons';
import type { Listing, User } from '../../types';

interface CardData {
  id: string;
  type: 'listing' | 'user';
  data: Listing | User;
}

interface CardStackProps {
  cards: CardData[];
  onSwipe: (id: string, direction: SwipeDirection, data: CardData) => void;
  onEmpty?: () => void;
  onCardTap?: (card: CardData) => void;
}

export function CardStack({ cards, onSwipe, onEmpty, onCardTap }: CardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(cards.length - 1);
  const currentIndexRef = useRef(currentIndex);
  
  // Track which cards have left the screen
  const childRefs = useRef<Map<string, any>>(new Map());
  
  const updateCurrentIndex = useCallback((val: number) => {
    setCurrentIndex(val);
    currentIndexRef.current = val;
  }, []);
  
  const canSwipe = currentIndex >= 0;
  
  const handleSwipe = useCallback((cardId: string, direction: SwipeDirection, data: CardData) => {
    onSwipe(cardId, direction, data);
  }, [onSwipe]);
  
  const handleCardLeftScreen = useCallback((cardIndex: number) => {
    // When card leaves screen, move to next card
    if (cardIndex === currentIndexRef.current) {
      const newIndex = currentIndexRef.current - 1;
      updateCurrentIndex(newIndex);
      
      if (newIndex < 0 && onEmpty) {
        onEmpty();
      }
    }
  }, [updateCurrentIndex, onEmpty]);
  
  const swipe = useCallback(async (dir: SwipeDirection) => {
    if (canSwipe && currentIndex < cards.length) {
      const card = cards[currentIndex];
      const cardRef = childRefs.current.get(card.id);
      if (cardRef) {
        await cardRef.swipe(dir);
      }
    }
  }, [canSwipe, currentIndex, cards]);
  
  // Calculate visible cards (show max 3 for performance)
  const visibleCards = cards.slice(Math.max(0, currentIndex - 2), currentIndex + 1);
  
  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Card Stack Area */}
      <div className="flex-1 relative w-full px-4 py-2">
        {/* Background cards for depth effect */}
        {currentIndex > 1 && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[85%] h-[calc(100%-80px)] bg-gray-800/40 rounded-2xl border border-white/5 card-stack-1 z-10" />
        )}
        {currentIndex > 0 && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[90%] h-[calc(100%-80px)] bg-gray-700/60 rounded-2xl border border-white/5 card-stack-2 z-20" />
        )}
        
        {/* Active Cards */}
        <div className="relative w-full h-[calc(100%-80px)] z-30">
          {visibleCards.map((card) => {
            const cardIndex = cards.indexOf(card);
            const isTop = cardIndex === currentIndex;
            return (
              <SwipeCard
                key={card.id}
                ref={(el: any) => {
                  if (el) childRefs.current.set(card.id, el);
                }}
                data={card.data}
                type={card.type}
                onSwipe={(dir) => handleSwipe(card.id, dir, card)}
                onCardLeftScreen={() => handleCardLeftScreen(cardIndex)}
                onTap={isTop && onCardTap ? () => onCardTap(card) : undefined}
                className={isTop ? 'z-30' : 'z-20'}
                preventSwipe={isTop ? ['up', 'down'] : ['left', 'right', 'up', 'down']}
              />
            );
          })}
        </div>
        
        {/* Empty State */}
        {!canSwipe && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white/60">
              <p className="text-lg font-medium mb-2">No more cards</p>
              <p className="text-sm">Check back later for new listings</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="relative z-50 pb-4">
        <ActionButtons
          onPass={() => swipe('left')}
          onLike={() => swipe('right')}
          disabled={!canSwipe}
        />
      </div>
    </div>
  );
}
