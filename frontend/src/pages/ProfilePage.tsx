import { ArrowLeft, Pencil } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function ProfilePage() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sticky top-0 backdrop-blur-sm bg-background-dark/30 z-10">
        <Button variant="ghost" size="icon">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h2 className="text-white text-lg font-semibold tracking-wide">Profile</h2>
        <Button variant="ghost" size="icon" className="text-primary">
          <Pencil className="h-6 w-6" />
        </Button>
      </div>
      
      {/* Profile Content - Placeholder */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center text-white/60">
          <p className="text-lg font-medium mb-2">Profile Page</p>
          <p className="text-sm">Profile will be implemented in Phase 2</p>
        </div>
      </div>
    </div>
  );
}
