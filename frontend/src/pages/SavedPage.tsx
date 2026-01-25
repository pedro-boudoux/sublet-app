import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Home, Plus, X, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { EmptyState } from '../components/ui';
import { useStore } from '../stores/useStore';
import { useUserListing, useSavedListings } from '../hooks';
import { unsaveListing } from '../lib/api';
import { cn, formatPrice } from '../lib/utils';

export function SavedPage() {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const { listing, isLoading: listingsLoading } = useUserListing();
  const { savedListings, isLoading: savedLoading, mutate: refreshSaved } = useSavedListings();
  const [unsavingId, setUnsavingId] = useState<string | null>(null);

  // Show different content based on user mode
  const isOffering = user?.mode === 'offering';

  const handleUnsave = async (listingId: string) => {
    if (!user) return;
    setUnsavingId(listingId);
    try {
      await unsaveListing(user.id, listingId);
      refreshSaved();
      toast.success('Removed from saved');
    } catch (error) {
      toast.error('Failed to remove listing');
    } finally {
      setUnsavingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-center p-4 sticky top-0 backdrop-blur-sm z-10" style={{ backgroundColor: 'rgba(15, 26, 35, 0.3)' }}>
        <h2 className="text-white text-lg font-semibold tracking-wide">
          {isOffering ? 'My Listing' : 'Saved'}
        </h2>
        {isOffering && !listing && !listingsLoading && (
          <Button
            variant="glass"
            size="sm"
            className="absolute right-4 h-9 px-3 rounded-full"
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
          // Offering Mode: Show user's listings with edit option
          listingsLoading ? (
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
          ) : !listing ? (
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
              <div
                className="cursor-pointer hover:bg-white/5 transition-all rounded-xl"
                onClick={() => navigate(`/listings/${listing!.id}/edit`)}
              >
                <Card
                  key={listing!.id}
                  variant="acrylic"
                >
                  <CardContent className="p-0 overflow-hidden">
                    {listing!.images[0] && (
                      <div
                        className="h-32 bg-cover bg-center"
                        style={{ backgroundImage: `url(${listing!.images[0]})` }}
                      />
                    )}
                    <div className="p-4 flex justify-between items-start">
                      <div>
                        <h3 className="text-white font-semibold truncate">{listing!.title}</h3>
                        <p className="text-primary font-bold">{formatPrice(listing!.price)}/mo</p>
                        <p className="text-slate-400 text-sm">{listing!.location}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <Edit className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )
        ) : (
          // Looking Mode: Show saved listings
          savedLoading ? (
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
          ) : savedListings.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title="No saved listings"
              description="Tap the bookmark icon on listings you like to save them here."
              action={{
                label: 'Start Swiping',
                onClick: () => navigate('/'),
              }}
              className="h-full"
            />
          ) : (
            <div className="flex flex-col gap-3">
              {savedListings.map((listing, index) => (
                <Card
                  key={listing.id}
                  variant="acrylic"
                  className={cn(
                    'transition-all',
                    'animate-in fade-in slide-in-from-bottom-2'
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-0 overflow-hidden">
                    {listing.images?.[0] && (
                      <div
                        className="h-32 bg-cover bg-center"
                        style={{ backgroundImage: `url(${listing.images[0]})` }}
                      />
                    )}
                    <div className="p-4 flex justify-between items-start">
                      <div>
                        <h3 className="text-white font-semibold truncate">{listing.title}</h3>
                        <p className="text-primary font-bold">{formatPrice(listing.price)}/mo</p>
                        <p className="text-slate-400 text-sm">{listing.location}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-red-400"
                        onClick={() => handleUnsave(listing.id)}
                        disabled={unsavingId === listing.id}
                      >
                        {unsavingId === listing.id ? (
                          <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <X className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

