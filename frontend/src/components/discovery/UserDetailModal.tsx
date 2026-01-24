import { X, MapPin, Briefcase } from 'lucide-react';
import { Button } from '../ui/Button';
import { VerifiedBadge } from '../ui/Badge';
import { Chip } from '../ui/Chip';
import { cn } from '../../lib/utils';
import type { ApiUser } from '../../lib/api';

interface UserDetailModalProps {
  user: ApiUser;
  onClose: () => void;
  onLike: () => void;
  onPass: () => void;
}

export function UserDetailModal({ 
  user, 
  onClose, 
  onLike, 
  onPass 
}: UserDetailModalProps) {
  return (
    <div className="fixed inset-0 z-[90] flex flex-col">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative z-10 flex flex-col h-full bg-[#0f1a23] animate-in slide-in-from-bottom-2">
        {/* Header Image */}
        <div className="relative h-[45%] min-h-[280px]">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: user.profilePicture
                ? `url(${user.profilePicture})`
                : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            }}
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1a23] via-transparent to-black/40" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          {/* Verified Badge */}
          {user.isVerified && (
            <div className="absolute top-4 left-4">
              <VerifiedBadge label="Verified" />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar px-5 py-4 space-y-5">
          {/* Name and Age */}
          <div>
            <h1 className="text-3xl font-bold text-white">
              {user.fullName}, {user.age}
            </h1>
            
            {/* Location */}
            <div className="flex items-center gap-2 text-white/70 mt-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span>{user.searchLocation}</span>
            </div>
            
            {/* Mode */}
            <div className="flex items-center gap-2 text-white/70 mt-1">
              <Briefcase className="h-4 w-4" />
              <span>{user.mode === 'looking' ? 'Looking for a place' : 'Offering a place'}</span>
            </div>
          </div>
          
          {/* Bio */}
          {user.bio && (
            <div className="acrylic-panel rounded-xl p-4 space-y-2">
              <h3 className="text-white font-semibold flex items-center gap-2">
                About {user.fullName.split(' ')[0]}
              </h3>
              <p className="text-white/70 leading-relaxed">
                {user.bio}
              </p>
            </div>
          )}
          
          {/* Lifestyle Tags */}
          {user.lifestyleTags && user.lifestyleTags.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-white font-semibold">Lifestyle & Habits</h3>
              <div className="flex flex-wrap gap-2">
                {user.lifestyleTags.map((tag) => (
                  <Chip key={tag}>{tag}</Chip>
                ))}
              </div>
            </div>
          )}
          
          {/* Verification Status */}
          <div className="acrylic-panel rounded-xl p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Verification</h3>
              <span className={cn(
                'text-xs font-medium px-2 py-1 rounded',
                user.isVerified 
                  ? 'bg-green-400/10 text-green-400' 
                  : 'bg-yellow-400/10 text-yellow-400'
              )}>
                {user.isVerified ? 'Verified' : 'Pending'}
              </span>
            </div>
            <p className="text-white/50 text-sm mt-2">
              {user.isVerified 
                ? 'This user has verified their identity.'
                : 'This user has not yet verified their identity.'}
            </p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="p-5 pt-3 border-t border-white/5 flex gap-3">
          <Button 
            variant="secondary" 
            onClick={() => { onPass(); onClose(); }}
            className="flex-1 h-14"
          >
            Pass
          </Button>
          <Button 
            onClick={() => { onLike(); onClose(); }}
            className="flex-1 h-14"
          >
            Like
          </Button>
        </div>
      </div>
    </div>
  );
}
