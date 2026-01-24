import { forwardRef } from 'react';
import TinderCard from 'react-tinder-card';
import { ListingCard } from './ListingCard';
import { UserCard } from './UserCard';
import type { Listing, User } from '../../types';
import { cn } from '../../lib/utils';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

interface SwipeCardProps {
  data: Listing | User;
  type: 'listing' | 'user';
  onSwipe: (direction: SwipeDirection) => void;
  onCardLeftScreen: () => void;
  onTap?: () => void;
  className?: string;
  preventSwipe?: SwipeDirection[];
}

export const SwipeCard = forwardRef<any, SwipeCardProps>(({
  data,
  type,
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
        {type === 'listing' ? (
          <ListingCard listing={data as Listing} onTap={onTap} />
        ) : (
          <UserCard user={data as User} onTap={onTap} />
        )}
      </div>
    </TinderCard>
  );
});

SwipeCard.displayName = 'SwipeCard';
