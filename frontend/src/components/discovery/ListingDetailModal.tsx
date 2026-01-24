import { X, MapPin, Check, Calendar, Home, DollarSign } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge, VerifiedBadge } from '../ui/Badge';
import { formatPrice, formatDate, cn } from '../../lib/utils';
import type { Listing } from '../../types';

interface ListingDetailModalProps {
  listing: Listing;
  onClose: () => void;
  onLike: () => void;
  onPass: () => void;
}

export function ListingDetailModal({ 
  listing, 
  onClose, 
  onLike, 
  onPass 
}: ListingDetailModalProps) {
  return (
    <div className="fixed inset-0 z-[90] flex flex-col">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative z-10 flex flex-col h-full bg-[#0f1a23] animate-in slide-in-from-bottom-2">
        {/* Header Image */}
        <div className="relative h-[45%] min-h-[280px]">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: listing.images?.[0]
                ? `url(${listing.images[0]})`
                : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            }}
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1a23] via-transparent to-black/40" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          {/* Verified Badge */}
          {listing.isVerified && (
            <div className="absolute top-4 left-4">
              <VerifiedBadge label="Verified" />
            </div>
          )}
          
          {/* Image dots indicator (if multiple images) */}
          {listing.images && listing.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {listing.images.map((_, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    idx === 0 ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
                  )}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar px-5 py-4 space-y-5">
          {/* Price and Type */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white">
                  {formatPrice(listing.price)}
                </span>
                <span className="text-lg text-white/60">/mo</span>
              </div>
              <p className="text-primary font-semibold text-sm mt-1">
                Available {formatDate(listing.availableDate)}
              </p>
            </div>
            <Badge variant="type" className="text-sm px-4 py-2">
              {listing.type}
            </Badge>
          </div>
          
          {/* Title */}
          <h1 className="text-2xl font-bold text-white leading-tight">
            {listing.title}
          </h1>
          
          {/* Location */}
          <div className="flex items-center gap-2 text-white/80">
            <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
            <span>
              {listing.location}
              {listing.distanceInfo && (
                <span className="text-white/50"> • {listing.distanceInfo}</span>
              )}
            </span>
          </div>
          
          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="acrylic-panel rounded-xl p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Home className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-white/50 text-xs">Type</p>
                <p className="text-white font-semibold">{listing.type}</p>
              </div>
            </div>
            
            <div className="acrylic-panel rounded-xl p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-white/50 text-xs">Available</p>
                <p className="text-white font-semibold">{formatDate(listing.availableDate)}</p>
              </div>
            </div>
            
            <div className="acrylic-panel rounded-xl p-4 flex items-center gap-3 col-span-2">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-white/50 text-xs">Monthly Rent</p>
                <p className="text-white font-semibold">{formatPrice(listing.price)}</p>
              </div>
            </div>
          </div>
          
          {/* Features */}
          {listing.features && listing.features.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-white font-semibold">Features & Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {listing.features.map((feature) => (
                  <div 
                    key={feature}
                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/80"
                  >
                    <Check className="h-4 w-4 text-green-400" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="p-5 pt-3 border-t border-white/5 flex gap-3">
          <Button 
            variant="secondary" 
            onClick={() => { onPass(); onClose(); }}
            className="flex-1 h-14"
          >
            Pass
          </Button>
          <Button 
            onClick={() => { onLike(); onClose(); }}
            className="flex-1 h-14"
          >
            Like
          </Button>
        </div>
      </div>
    </div>
  );
}
