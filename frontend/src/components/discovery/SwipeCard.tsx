import { forwardRef } from 'react';
import TinderCard from 'react-tinder-card';
import { UserCard } from './UserCard';
import { ListingCard } from './ListingCard';
import type { ApiUser, ApiListing } from '../../lib/api';
import { cn } from '../../lib/utils';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

interface SwipeCardProps {
  data: ApiUser | ApiListing;
  cardType: 'user' | 'listing';
  onSwipe: (direction: SwipeDirection) => void;
  onCardLeftScreen: () => void;
  onTap?: () => void;
  className?: string;
  preventSwipe?: SwipeDirection[];
}

export const SwipeCard = forwardRef<any, SwipeCardProps>(({
  data,
  cardType,
  onSwipe,
  onCardLeftScreen,
  onTap,
  className,
  preventSwipe = ['up', 'down'],
}, ref) => {
  return (
    <TinderCard
      ref={ref}
      className={cn('absolute w-full h-full', className)}
      onSwipe={onSwipe}
      onCardLeftScreen={onCardLeftScreen}
      preventSwipe={preventSwipe}
      swipeRequirementType="position"
      swipeThreshold={100}
    >
      <div className="w-full h-full cursor-grab active:cursor-grabbing group">
        {cardType === 'listing' ? (
          <ListingCard listing={data as ApiListing} onTap={onTap} />
        ) : (
          <UserCard user={data as ApiUser} onTap={onTap} />
        )}
      </div>
    </TinderCard>
  );
});

SwipeCard.displayName = 'SwipeCard';

