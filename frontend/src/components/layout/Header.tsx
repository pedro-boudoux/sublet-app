import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { useStore } from '../../stores/useStore';

export function Header() {
  const user = useStore((state) => state.user);
  
  return (
    <header className="flex items-center justify-between px-6 pt-6 pb-2 z-50">
      {/* User Avatar */}
      <div className="flex items-center gap-3">
        <Avatar
          src={user?.profilePicture}
          size="md"
          online
        />
      </div>
      
      {/* Location Pill */}
      <Button variant="glass" size="sm" className="h-9 px-4 rounded-full gap-2">
        <span className="text-sm font-semibold text-white/90">
          {user?.searchLocation || 'Select Location'}
        </span>
        <ChevronDown className="h-4 w-4 text-white/60" />
      </Button>
      
      {/* Filter Button */}
      <Button variant="glass" size="icon" className="rounded-full">
        <SlidersHorizontal className="h-5 w-5 text-white/80" />
      </Button>
    </header>
  );
}
