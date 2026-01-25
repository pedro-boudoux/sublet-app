import { SlidersHorizontal } from 'lucide-react';
import { Button } from '../ui/Button';
import { LocationDropdown } from './LocationDropdown';
import { useStore } from '../../stores/useStore';
import { updateUser } from '../../lib/api';
import toast from 'react-hot-toast';

interface HeaderProps {
  onFilterClick?: () => void;
}

export function Header({ onFilterClick }: HeaderProps) {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const selectedFilters = useStore((state) => state.selectedFilters);
  const selectedListingTypes = useStore((state) => state.selectedListingTypes);
  const selectedGenders = useStore((state) => state.selectedGenders);

  const totalFilterCount = selectedFilters.length + selectedListingTypes.length + selectedGenders.length;
  const hasActiveFilters = totalFilterCount > 0;

  const handleLocationChange = async (location: string) => {
    if (!user) return;

    try {
      const updatedUser = await updateUser(user.id, { searchLocation: location });
      setUser(updatedUser);
      if (location) {
        toast.success(`Location set to ${location}`);
      } else {
        toast.success('Showing all locations');
      }
    } catch (error) {
      console.error('Failed to update location:', error);
      toast.error('Failed to update location');
    }
  };

  return (
    <header data-tauri-drag-region className="flex items-center justify-between px-6 pt-6 pb-2 z-50">
      {/* App Logo and Name - Left side */}
      <div className="flex items-center gap-1.5 w-24">
        <img
          src="/logo.png"
          alt="App Logo"
          className="h-7 w-7 rounded-lg object-cover shadow-lg"
        />
        <span className="text-sm font-semibold text-white tracking-tight">Sublety</span>
      </div>

      {/* Location Dropdown - Center (only for looking users) */}
      {user?.mode === 'looking' ? (
        <LocationDropdown
          value={user?.searchLocation || ''}
          onChange={handleLocationChange}
        />
      ) : (
        <div /> // Empty spacer to maintain layout
      )}

      {/* Filter Button - Right side */}
      <div className="flex justify-end w-24">
        <Button
          variant="glass"
          size="icon"
          className={`rounded-full relative ${hasActiveFilters ? 'ring-2 ring-primary/50' : ''}`}
          onClick={onFilterClick}
        >
          <SlidersHorizontal className="h-5 w-5 text-white/80" />
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold flex items-center justify-center text-white">
              {totalFilterCount}
            </span>
          )}
        </Button>
      </div>
    </header>
  );
}
