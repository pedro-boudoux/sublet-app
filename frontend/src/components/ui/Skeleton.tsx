import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-white/10',
        className
      )}
    />
  );
}

// Card Skeleton for Discovery Feed
export function CardSkeleton() {
  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 bg-[#1a1a1a]">
      {/* Image placeholder */}
      <Skeleton className="absolute inset-0" />
      
      {/* Top badge */}
      <div className="absolute top-4 left-4">
        <Skeleton className="h-8 w-32 rounded-full" />
      </div>
      
      {/* Bottom content */}
      <div className="absolute inset-x-0 bottom-0 p-5 space-y-3">
        {/* Price */}
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="h-6 w-16 rounded-lg" />
        </div>
        
        {/* Title */}
        <Skeleton className="h-6 w-3/4" />
        
        {/* Location */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
    </div>
  );
}

// Profile Header Skeleton
export function ProfileHeaderSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar */}
      <Skeleton className="h-28 w-28 rounded-full" />
      
      {/* Name and location */}
      <div className="text-center space-y-2">
        <Skeleton className="h-7 w-40 mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
    </div>
  );
}

// Profile Section Skeleton
export function ProfileSectionSkeleton() {
  return (
    <div className="acrylic-panel rounded-2xl p-5 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-5 w-24" />
      </div>
      
      {/* Content lines */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}

// Chip/Tag Skeleton
export function ChipsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-24 rounded-full" />
      ))}
    </div>
  );
}

// List Item Skeleton
export function ListItemSkeleton() {
  return (
    <div className="acrylic-panel rounded-2xl p-4 flex items-center gap-4">
      <Skeleton className="h-14 w-14 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

// Full Page Loading
export function PageLoadingSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-white/10 border-t-primary animate-spin" />
      </div>
      <p className="text-white/60 text-sm">Loading...</p>
    </div>
  );
}
