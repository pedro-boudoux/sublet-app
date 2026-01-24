import { ArrowLeft, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Toggle } from '../components/ui/Toggle';
import { ProfileHeader, AboutSection, LifestyleSection, SocialSection } from '../components/profile';
import { useStore } from '../stores/useStore';

const modeOptions = [
  { value: 'looking', label: 'Looking for Place' },
  { value: 'offering', label: 'Offering Place' },
];

export function ProfilePage() {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  
  // If no user, redirect to onboarding
  if (!user) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sticky top-0 backdrop-blur-sm bg-background-dark/30 z-10">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h2 className="text-white text-lg font-semibold tracking-wide">Profile</h2>
          <div className="w-10" /> {/* Spacer */}
        </div>
        
        {/* No Profile State */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          <div className="text-center text-white/60">
            <p className="text-lg font-medium mb-2">No Profile Yet</p>
            <p className="text-sm">Create your profile to start swiping</p>
          </div>
          <Button onClick={() => navigate('/onboarding')}>
            Create Profile
          </Button>
        </div>
      </div>
    );
  }
  
  const handleModeChange = (newMode: string) => {
    setUser({ ...user, mode: newMode as 'looking' | 'offering' });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto hide-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sticky top-0 backdrop-blur-sm bg-background-dark/30 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h2 className="text-white text-lg font-semibold tracking-wide">Profile</h2>
        <Button variant="ghost" size="icon" className="text-primary" onClick={() => navigate('/onboarding')}>
          <Pencil className="h-6 w-6" />
        </Button>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex flex-col gap-6 px-4 pt-2 pb-8">
        {/* Profile Header */}
        <ProfileHeader
          profilePicture={user.profilePicture}
          fullName={user.fullName}
          age={user.age}
          location={user.searchLocation}
          isVerified={user.isVerified}
        />
        
        {/* Mode Toggle */}
        <Toggle
          options={modeOptions}
          value={user.mode}
          onChange={handleModeChange}
        />
        
        {/* About Me */}
        <AboutSection bio={user.bio} />
        
        {/* Lifestyle & Habits */}
        <LifestyleSection tags={user.lifestyleTags} />
        
        {/* Social Verification */}
        <SocialSection
          isVerified={user.isVerified}
          socialLinks={undefined} // TODO: Add social links to user type if needed
        />
      </div>
    </div>
  );
}
