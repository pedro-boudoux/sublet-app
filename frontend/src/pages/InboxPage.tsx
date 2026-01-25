import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react';
import { useStore } from '../stores/useStore';
import { useMatches } from '../hooks/useMatches';
import { ChatInterface } from '../components/chat/ChatInterface';
import { Avatar } from '../components/ui/Avatar';
import { Card, CardContent } from '../components/ui/Card';
import { EmptyState, ListItemSkeleton, ErrorState } from '../components/ui';
import { cn } from '../lib/utils';

export function InboxPage() {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const [selectedMatch, setSelectedMatch] = useState<any>(null); // Using any for simplicity with the enriched match type

  // Fetch matches from API
  const { matches, count, isLoading, isError, error, mutate } = useMatches();

  // Force refresh on entry
  useEffect(() => {
    mutate();
  }, [mutate]);

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

  if (selectedMatch) {
    return (
      <ChatInterface
        matchId={selectedMatch.matchId}
        recipientName={selectedMatch.matchedUser?.fullName || 'User'}
        onBack={() => setSelectedMatch(null)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-center p-4 sticky top-0 backdrop-blur-sm z-10" style={{ backgroundColor: 'rgba(15, 26, 35, 0.3)' }}>
        <h2 className="text-white text-lg font-semibold tracking-wide">Matches</h2>
        {count > 0 && (
          <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-primary/20 text-primary rounded-full">
            {count}
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
        ) : isError ? (
          // Error state
          <ErrorState
            title="Couldn't load matches"
            message={error?.message || 'Failed to load matches.'}
            onRetry={() => mutate()}
            className="h-full"
          />
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
                key={match.matchId}
                variant="acrylic"
                onClick={() => setSelectedMatch(match)}
                className={cn(
                  'cursor-pointer hover:bg-white/5 transition-all duration-200',
                  'transform hover:scale-[1.02] active:scale-[0.98]',
                  'animate-in fade-in slide-in-from-bottom-2',
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <Avatar
                    src={match.matchedUser?.profilePicture}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">
                      {match.matchedUser?.fullName || 'Unknown User'}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {match.matchedUser?.searchLocation || 'Location unknown'}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      Matched {new Date(match.matchedAt).toLocaleDateString()}
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
