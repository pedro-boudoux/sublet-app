import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Camera, Loader2, Plus, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Toggle } from '../components/ui/Toggle';
import { Chip } from '../components/ui/Chip';
import { useStore } from '../stores/useStore';
import { useUserListing } from '../hooks';
import { createListing, updateListing, getListing, ApiError, type ListingType } from '../lib/api';
import { OFFERING_TAGS } from '../constants/tagPairs';

const listingTypeOptions = [
  { value: 'studio', label: 'Studio' },
  { value: '1br', label: '1 BR' },
  { value: '2br', label: '2 BR' },
  { value: 'room', label: 'Room' },
];

const AMENITIES = [
  'Furnished',
  'Utilities Included',
  'WiFi',
  'Laundry',
  'Dishwasher',
  'AC',
  'Gym',
  'Rooftop',
  'Doorman',
  'Pet Friendly',
  'Parking',
  'Balcony',
] as const;

export function CreateListingPage() {
  const navigate = useNavigate();
  const { listingId } = useParams();
  const isEditing = !!listingId;
  const user = useStore((state) => state.user);

  // Form state
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState(user?.searchLocation || '');
  const [availableDate, setAvailableDate] = useState('');
  const [listingType, setListingType] = useState<ListingType>('studio');
  const [distanceTo, setDistanceTo] = useState('');
  const [description, setDescription] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [lifestyleTags, setLifestyleTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check for existing listing to enforce 1-listing limit
  const { listing: existingListing, isLoading: checkingExisting, mutate: mutateUserListing } = useUserListing();

  // Redirect if trying to create but already have a listing
  useEffect(() => {
    if (!isEditing && existingListing && !checkingExisting) {
      toast('Redirecting to your existing listing...');
      navigate(`/listings/${existingListing.id}/edit`, { replace: true });
    }
  }, [isEditing, existingListing, checkingExisting, navigate]);

  // Fetch listing data if editing
  useEffect(() => {
    if (!listingId) return;

    const fetchListing = async () => {
      setIsLoading(true);
      try {
        const listing = await getListing(listingId);
        if (listing.ownerId !== user?.id) {
          toast.error('You can only edit your own listings');
          navigate('/saved');
          return;
        }

        setTitle(listing.title);
        setPrice(listing.price.toString());
        setLocation(listing.location);
        setAvailableDate(listing.availableDate.split('T')[0]); // Ensure YYYY-MM-DD
        setListingType(listing.type);
        setDistanceTo(listing.distanceTo || '');
        setDescription(listing.description || '');
        setAmenities(listing.amenities || []);
        setLifestyleTags(listing.lifestyleTags || []);
        setImages(listing.images || []);
      } catch (error) {
        console.error('Failed to fetch listing:', error);
        toast.error('Failed to load listing details');
        navigate('/saved');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchListing();
    }
  }, [listingId, user, navigate]);

  const toggleAmenity = (amenity: string) => {
    setAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const toggleLifestyleTag = (tag: string) => {
    setLifestyleTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addMockImage = () => {
    // For demo purposes, add a placeholder image
    const mockImages = [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
    ];
    const randomImage = mockImages[images.length % mockImages.length];
    setImages((prev) => [...prev, randomImage]);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }

    if (!title || !price || !location || !availableDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && listingId) {
        await updateListing(listingId, {
          title,
          price: parseInt(price),
          location,
          availableDate,
          type: listingType,
          distanceTo,
          description,
          amenities,
          lifestyleTags,
          images,
        });
        await mutateUserListing();
        toast.success('Listing updated successfully!');
      } else if (!isEditing && existingListing) {
        // Fallback if they bypassed the redirect
        toast.error('You already have a listing');
        navigate(`/listings/${existingListing.id}/edit`);
        return;
      } else {
        await createListing({
          ownerId: user.id,
          title,
          price: parseInt(price),
          location,
          availableDate,
          type: listingType,
          distanceTo,
          description,
          amenities,
          lifestyleTags,
          images,
        });
        await mutateUserListing();
        toast.success('Listing created successfully!');
      }

      navigate('/saved');
    } catch (error) {
      console.error('Failed to create listing:', error);
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error('Failed to create listing');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || user.mode !== 'offering') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h2 className="text-white text-lg font-semibold">Create Listing</h2>
          <div className="w-10"></div>
        </div>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center text-white/60">
            <p className="text-lg font-medium mb-2">Switch to Offering Mode</p>
            <p className="text-sm mb-4">You need to be in offering mode to {isEditing ? 'edit' : 'create'} listings</p>
            <Button onClick={() => navigate('/profile')}>Go to Profile</Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-[#0f1a23] items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#0f1a23' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 sticky top-0 z-10" style={{ backgroundColor: '#0f1a23' }}>
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h2 className="text-white text-lg font-semibold">{isEditing ? 'Edit Listing' : 'Create Listing'}</h2>
        <div className="w-10" />
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-32">
        <div className="flex flex-col gap-6">
          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Photos</label>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
              {images.map((img, idx) => (
                <div key={idx} className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-white/5">
                  <img src={img} alt={`Listing ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
              <button
                onClick={addMockImage}
                className="flex-shrink-0 w-24 h-24 rounded-xl bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Camera className="h-6 w-6 text-white/40" />
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sunny Studio in West Village"
              className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Type *</label>
            <Toggle
              options={listingTypeOptions}
              value={listingType}
              onChange={(v) => setListingType(v as ListingType)}
            />
          </div>

          {/* Price & Date */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-300 mb-2">Price/mo *</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="2500"
                className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-300 mb-2">Available *</label>
              <input
                type="date"
                value={availableDate}
                onChange={(e) => setAvailableDate(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Location *</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="West Village, NYC"
              className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Distance To */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Distance To (optional)</label>
            <input
              type="text"
              value={distanceTo}
              onChange={(e) => setDistanceTo(e.target.value)}
              placeholder="12 mins to NYU"
              className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your place..."
              rows={4}
              className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((amenity) => (
                <Chip
                  key={amenity}
                  selected={amenities.includes(amenity)}
                  onClick={() => toggleAmenity(amenity)}
                >
                  {amenity}
                </Chip>
              ))}
            </div>
          </div>

          {/* Lifestyle Tags (Offering version) */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Lifestyle Compatibility</label>
            <p className="text-slate-500 text-xs mb-3">Help tenants know if they're a good fit</p>
            <div className="flex flex-wrap gap-2">
              {OFFERING_TAGS.map((tag) => (
                <Chip
                  key={tag}
                  selected={lifestyleTags.includes(tag)}
                  onClick={() => toggleLifestyleTag(tag)}
                >
                  {tag}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0f1a23] via-[#0f1a23] to-transparent">
        <Button
          className="w-full h-14"
          onClick={handleSubmit}
          disabled={isSubmitting || !title || !price || !location || !availableDate}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{isEditing ? 'Updating...' : 'Creating...'}</span>
            </>
          ) : isEditing ? (
            <>
              <Save className="h-5 w-5" />
              <span>Update Listing</span>
            </>
          ) : (
            <>
              <Plus className="h-5 w-5" />
              <span>Create Listing</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
