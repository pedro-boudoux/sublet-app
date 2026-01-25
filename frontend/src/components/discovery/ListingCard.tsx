import { MapPin, Check } from 'lucide-react';
import { VerifiedBadge, Badge } from '../ui/Badge';
import { formatPrice, formatDate } from '../../lib/utils';
import type { ApiListing } from '../../lib/api';

interface ListingCardProps {
  listing: ApiListing;
  onTap?: () => void;
}

export function ListingCard({ listing, onTap }: ListingCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    // Only trigger onTap if it's a click (not a drag)
    if (onTap) {
      e.stopPropagation();
      onTap();
    }
  };

  return (
    <div
      className="group relative w-full h-full rounded-2xl overflow-hidden shadow-fluent border border-white/10 bg-[#1a1a1a] transform-gpu"
      onClick={handleClick}
    >
      {/* Main Image */}
      {listing.images?.[0] ? (
        <img
          src={listing.images[0]}
          alt={listing.title}
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div
          className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#1a1a2e] to-[#16213e] transition-transform duration-700 group-hover:scale-105"
        />
      )}

      {/* Top Gradient for Readability */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

      {/* Verified Badge */}
      {listing.isVerified && (
        <div className="absolute top-4 left-4">
          <VerifiedBadge label="Verified Listing" />
        </div>
      )}

      {/* Bottom Information Overlay */}
      <div className="absolute inset-x-0 bottom-0 pt-24 pb-6 px-5 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col justify-end">
        {/* Price and Type Row */}
        <div className="flex items-end justify-between mb-2">
          <div className="flex flex-col">
            {/* Availability */}
            <span className="text-primary font-bold text-sm tracking-wider uppercase mb-1 drop-shadow-md">
              Available {formatDate(listing.availableDate)}
            </span>

            {/* Price */}
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
                {formatPrice(listing.price)}
              </span>
              <span className="text-lg text-white/80 font-medium">/mo</span>
            </div>
          </div>

          {/* Type Badge */}
          <Badge variant="type">{listing.type}</Badge>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-white leading-tight mb-3 drop-shadow-md">
          {listing.title}
        </h2>

        {/* Location & Tags */}
        <div className="flex flex-col gap-2">
          {/* Location */}
          <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
            <MapPin className="h-[18px] w-[18px] text-primary" />
            <span className="truncate">
              {listing.location} {listing.distanceTo && `• ${listing.distanceTo}`}
            </span>
          </div>

          {/* Lifestyle Tags (offering tags like Dog Friendly, Smoke-Free) */}
          {listing.lifestyleTags && listing.lifestyleTags.length > 0 && (
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <Check className="h-[18px] w-[18px]" />
              <span>{listing.lifestyleTags.slice(0, 3).join(' • ')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

