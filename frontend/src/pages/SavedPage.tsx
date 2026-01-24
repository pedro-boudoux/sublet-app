import { useNavigate } from 'react-router-dom';
import { Bookmark, Home, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { EmptyState } from '../components/ui';
import { useStore } from '../stores/useStore';
import { useUserListings } from '../hooks';
import { cn, formatPrice } from '../lib/utils';

export function SavedPage() {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const { listings, isLoading } = useUserListings();
  
  // Show different content based on user mode
  const isOffering = user?.mode === 'offering';
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sticky top-0 backdrop-blur-sm z-10" style={{ backgroundColor: 'rgba(15, 26, 35, 0.3)' }}>
        <h2 className="text-white text-lg font-semibold tracking-wide">
          {isOffering ? 'My Listings' : 'Saved'}
        </h2>
        {isOffering && (
          <Button 
            variant="glass" 
            size="sm" 
            className="h-9 px-3 rounded-full"
            onClick={() => navigate('/listings/create')}
          >
            <Plus className="h-4 w-4" />
            <span>Add</span>
          </Button>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-8">
        {isOffering ? (
          // Offering Mode: Show user's listings
          isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2].map((i) => (
                <Card key={i} variant="acrylic">
                  <CardContent className="p-4">
                    <div className="h-32 bg-white/5 rounded-lg animate-pulse mb-3" />
                    <div className="h-5 bg-white/5 rounded animate-pulse w-3/4 mb-2" />
                    <div className="h-4 bg-white/5 rounded animate-pulse w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <EmptyState
              icon={Home}
              title="No listings yet"
              description="Create your first listing to start receiving interest from potential subletters."
              action={{
                label: 'Create Listing',
                onClick: () => navigate('/listings/create'),
              }}
              className="h-full"
            />
          ) : (
            <div className="flex flex-col gap-3">
              {listings.map((listing, index) => (
                <Card 
                  key={listing.id} 
                  variant="acrylic"
                  className={cn(
                    'cursor-pointer hover:bg-white/5 transition-all',
                    'animate-in fade-in slide-in-from-bottom-2'
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-0 overflow-hidden">
                    {listing.images[0] && (
                      <div 
                        className="h-32 bg-cover bg-center"
                        style={{ backgroundImage: `url(${listing.images[0]})` }}
                      />
                    )}
                    <div className="p-4">
                      <h3 className="text-white font-semibold truncate">{listing.title}</h3>
                      <p className="text-primary font-bold">{formatPrice(listing.price)}/mo</p>
                      <p className="text-slate-400 text-sm">{listing.location}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : (
          // Looking Mode: Show saved/liked listings (placeholder)
          <EmptyState
            icon={Bookmark}
            title="No saved listings"
            description="Listings you like will appear here so you can easily find them later."
            action={{
              label: 'Start Swiping',
              onClick: () => navigate('/'),
            }}
            className="h-full"
          />
        )}
      </div>
    </div>
  );
}
