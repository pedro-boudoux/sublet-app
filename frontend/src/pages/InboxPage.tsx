import { Heart } from 'lucide-react';
import { useStore } from '../stores/useStore';
import { Avatar } from '../components/ui/Avatar';
import { Card, CardContent } from '../components/ui/Card';

export function InboxPage() {
  const matches = useStore((state) => state.matches);
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-center p-4 sticky top-0 backdrop-blur-sm bg-background-dark/30 z-10">
        <h2 className="text-white text-lg font-semibold tracking-wide">Matches</h2>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-8">
        {matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-lg font-medium text-white mb-1">No matches yet</p>
              <p className="text-sm text-slate-400">
                Keep swiping to find your perfect housing match!
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {matches.map((match) => (
              <Card key={match.id} variant="acrylic">
                <CardContent className="flex items-center gap-4 p-4">
                  <Avatar size="lg" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">Match #{match.id.slice(0, 8)}</p>
                    <p className="text-slate-400 text-sm">
                      Matched {new Date(match.createdAt).toLocaleDateString()}
                    </p>
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
