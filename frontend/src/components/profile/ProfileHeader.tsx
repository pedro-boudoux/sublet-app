import { MapPin } from 'lucide-react';
import { Avatar } from '../ui/Avatar';

interface ProfileHeaderProps {
  profilePicture?: string;
  fullName: string;
  age: number;
  location: string;
  isVerified?: boolean;
}

export function ProfileHeader({
  profilePicture,
  fullName,
  age,
  location,
  isVerified = false,
}: ProfileHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar with verified badge */}
      <Avatar
        src={profilePicture}
        size="xl"
        verified={isVerified}
      />
      
      {/* Name and Age */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          {fullName}, {age}
        </h1>
        
        {/* Location */}
        <div className="flex items-center justify-center gap-1.5 text-slate-400 text-sm">
          <MapPin className="h-4 w-4" />
          <span>{location}</span>
        </div>
      </div>
    </div>
  );
}
