import { MapPin, Check } from 'lucide-react';
import { VerifiedBadge, Badge } from '../ui/Badge';
import { formatPrice, formatDate } from '../../lib/utils';
import type { Listing } from '../../types';

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-fluent border border-white/10 bg-[#1a1a1a]">
      {/* Main Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
        style={{
          backgroundImage: listing.images?.[0]
            ? `url(${listing.images[0]})`
            : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        }}
      />
      
      {/* Top Gradient for Readability */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
      
      {/* Verified Badge */}
      {listing.isVerified && (
        <div className="absolute top-4 left-4">
          <VerifiedBadge label="Verified Student" />
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
        
        {/* Location & Features */}
        <div className="flex flex-col gap-2">
          {/* Location */}
          <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
            <MapPin className="h-[18px] w-[18px] text-primary" />
            <span className="truncate">
              {listing.location} {listing.distanceInfo && `• ${listing.distanceInfo}`}
            </span>
          </div>
          
          {/* Features */}
          {listing.features && listing.features.length > 0 && (
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <Check className="h-[18px] w-[18px]" />
              <span>{listing.features.join(' • ')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
