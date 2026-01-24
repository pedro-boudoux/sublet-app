import { forwardRef } from 'react';
import TinderCard from 'react-tinder-card';
import { UserCard } from './UserCard';
import type { ApiUser } from '../../lib/api';
import { cn } from '../../lib/utils';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

interface SwipeCardProps {
  data: ApiUser;
  onSwipe: (direction: SwipeDirection) => void;
  onCardLeftScreen: () => void;
  onTap?: () => void;
  className?: string;
  preventSwipe?: SwipeDirection[];
}

export const SwipeCard = forwardRef<any, SwipeCardProps>(({
  data,
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
        <UserCard user={data} onTap={onTap} />
      </div>
    </TinderCard>
  );
});

SwipeCard.displayName = 'SwipeCard';
