import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react';
import { useStore } from '../stores/useStore';
import { Avatar } from '../components/ui/Avatar';
import { Card, CardContent } from '../components/ui/Card';
import { EmptyState, ListItemSkeleton } from '../components/ui';
import { cn } from '../lib/utils';

export function InboxPage() {
  const navigate = useNavigate();
  const matches = useStore((state) => state.matches);
  const user = useStore((state) => state.user);
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);
  
  // No user state
  if (!user) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center p-4 sticky top-0 backdrop-blur-sm z-10" style={{ backgroundColor: 'rgba(15, 26, 35, 0.3)' }}>
          <h2 className="text-white text-lg font-semibold tracking-wide">Matches</h2>
        </div>
        <EmptyState
          icon={Heart}
          title="Create a profile first"
          description="You need a profile to see your matches."
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
        <h2 className="text-white text-lg font-semibold tracking-wide">Matches</h2>
        {matches.length > 0 && (
          <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-primary/20 text-primary rounded-full">
            {matches.length}
          </span>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-8">
        {isLoading ? (
          // Loading skeletons
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <ListItemSkeleton key={i} />
            ))}
          </div>
        ) : matches.length === 0 ? (
          // Empty state
          <EmptyState
            icon={Heart}
            title="No matches yet"
            description="Keep swiping to find your perfect housing match! When you match with someone, they'll appear here."
            action={{
              label: 'Start Swiping',
              onClick: () => navigate('/'),
            }}
            className="h-full"
          />
        ) : (
          // Matches list
          <div className="flex flex-col gap-3">
            {matches.map((match, index) => (
              <Card 
                key={match.id} 
                variant="acrylic"
                className={cn(
                  'cursor-pointer hover:bg-white/5 transition-all duration-200',
                  'transform hover:scale-[1.02] active:scale-[0.98]',
                  'animate-in fade-in slide-in-from-bottom-2',
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <Avatar 
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
                    size="lg" 
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">Sarah</p>
                    <p className="text-slate-400 text-sm">
                      Matched {new Date(match.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-primary">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
