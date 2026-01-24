import { useNavigate } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { EmptyState } from '../components/ui';
import { useStore } from '../stores/useStore';

export function SavedPage() {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  
  // No user state
  if (!user) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center p-4 sticky top-0 backdrop-blur-sm z-10" style={{ backgroundColor: 'rgba(15, 26, 35, 0.3)' }}>
          <h2 className="text-white text-lg font-semibold tracking-wide">Saved</h2>
        </div>
        <EmptyState
          icon={Bookmark}
          title="Create a profile first"
          description="You need a profile to save listings."
          action={{
            label: 'Create Profile',
            onClick: () => navigate('/onboarding'),
          }}
          className="flex-1"
        />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-center p-4 sticky top-0 backdrop-blur-sm z-10" style={{ backgroundColor: 'rgba(15, 26, 35, 0.3)' }}>
        <h2 className="text-white text-lg font-semibold tracking-wide">Saved</h2>
      </div>
      
      {/* Empty state */}
      <EmptyState
        icon={Bookmark}
        title="No saved listings"
        description="Listings you save will appear here. Start exploring to find places you love!"
        action={{
          label: 'Explore Listings',
          onClick: () => navigate('/'),
        }}
        className="flex-1"
      />
    </div>
  );
}
