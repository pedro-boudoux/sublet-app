import { MapPin, Briefcase } from 'lucide-react';
import { VerifiedBadge } from '../ui/Badge';
import { Chip } from '../ui/Chip';
import type { ApiUser } from '../../lib/api';

interface UserCardProps {
  user: ApiUser;
  onTap?: () => void;
}

export function UserCard({ user, onTap }: UserCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (onTap) {
      e.stopPropagation();
      onTap();
    }
  };

  return (
    <div
      className="group relative w-full h-full rounded-2xl overflow-hidden shadow-fluent border border-white/10 bg-[#1a1a1a] transform-gpu"
      onClick={handleClick}
    >
      {/* Main Image */}
      {user.profilePicture ? (
        <img
          src={user.profilePicture}
          alt={user.fullName}
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div
          className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#1a1a2e] to-[#16213e] transition-transform duration-700 group-hover:scale-105"
        />
      )}

      {/* Top Gradient for Readability */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

      {/* Verified Badge */}
      {user.isVerified && (
        <div className="absolute top-4 left-4">
          <VerifiedBadge label="Verified" />
        </div>
      )}

      {/* Bottom Information Overlay */}
      <div className="absolute inset-x-0 bottom-0 pt-24 pb-6 px-5 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col justify-end">
        {/* Name and Age */}
        <h2 className="text-2xl font-bold text-white leading-tight mb-1 drop-shadow-md">
          {user.fullName}, {user.age}
        </h2>

        {/* Location */}
        <div className="flex items-center gap-2 text-white/90 text-sm font-medium mb-3">
          <MapPin className="h-[18px] w-[18px] text-primary" />
          <span>{user.searchLocation}</span>
        </div>

        {/* Bio Preview */}
        {user.bio && (
          <p className="text-white/70 text-sm line-clamp-2 mb-3">
            {user.bio}
          </p>
        )}

        {/* Mode Badge */}
        <div className="flex items-center gap-2 text-white/80 text-sm mb-3">
          <Briefcase className="h-4 w-4" />
          <span>{user.mode === 'looking' ? 'Looking for a place' : 'Offering a place'}</span>
        </div>

        {/* Lifestyle Tags (first 3) */}
        {user.lifestyleTags && user.lifestyleTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {user.lifestyleTags.slice(0, 3).map((tag) => (
              <Chip key={tag} className="text-xs py-1 px-2">
                {tag}
              </Chip>
            ))}
            {user.lifestyleTags.length > 3 && (
              <Chip className="text-xs py-1 px-2">
                +{user.lifestyleTags.length - 3} more
              </Chip>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
