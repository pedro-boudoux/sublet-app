import { useEffect } from 'react';
import { Mail, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button } from '../ui/Button';
import { useStore } from '../../stores/useStore';

export function MatchOverlay() {
  const currentMatch = useStore((state) => state.currentMatch);
  const setCurrentMatch = useStore((state) => state.setCurrentMatch);
  const user = useStore((state) => state.user);
  
  // Trigger confetti on mount
  useEffect(() => {
    if (currentMatch) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0079d6', '#FBBF24', '#4ADE80', '#A78BFA', '#F472B6'],
      });
    }
  }, [currentMatch]);
  
  if (!currentMatch) return null;
  
  const matchedUser = currentMatch.matchedUser;
  
  const handleSendEmail = () => {
    // In production, this would open email client or send through backend
    const email = matchedUser.email || 'contact@subletconnect.app';
    window.location.href = `mailto:${email}?subject=SubletConnect Match!&body=Hi ${matchedUser.fullName}, we matched on SubletConnect!`;
    setCurrentMatch(null);
  };
  
  const handleKeepSwiping = () => {
    setCurrentMatch(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-[#0f1a23]/80 backdrop-blur-xl" />
      
      {/* Confetti decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[15%] rotate-15 opacity-80">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#FBBF24" />
          </svg>
        </div>
        <div className="absolute top-[15%] right-[20%] -rotate-30 opacity-80">
          <div className="w-4 h-4 rounded-full bg-blue-400" />
        </div>
        <div className="absolute bottom-[30%] left-[10%] rotate-45 opacity-80">
          <div className="w-3 h-3 bg-pink-500" />
        </div>
        <div className="absolute top-[40%] right-[10%] -rotate-15 opacity-80">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#4ADE80">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
        <div className="absolute top-[10%] left-[50%] rotate-60 opacity-80">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#A78BFA">
            <path d="M12 2L2 22h20L12 2z" />
          </svg>
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 max-w-sm w-full">
        {/* Avatars Section */}
        <div className="relative mb-10 flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/40 blur-[50px] rounded-full scale-125" />
          
          <div className="relative flex items-center">
            {/* User Avatar */}
            <div className="relative z-20 h-32 w-32 rounded-full border-4 border-[#0f1a23] shadow-2xl overflow-hidden bg-[#20384b]">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-4xl text-white/50">
                  {user?.fullName?.[0] || '?'}
                </div>
              )}
            </div>
            
            {/* Match Avatar */}
            <div className="relative z-10 -ml-8 h-32 w-32 rounded-full border-4 border-[#0f1a23] shadow-2xl overflow-hidden bg-[#20384b] opacity-90">
              {matchedUser.profilePicture ? (
                <img
                  src={matchedUser.profilePicture}
                  alt={matchedUser.fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-4xl text-white/50">
                  {matchedUser.fullName?.[0] || '?'}
                </div>
              )}
            </div>
            
            {/* Heart Badge */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-primary border-4 border-[#0f1a23] text-white shadow-lg animate-bounce">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Text Content */}
        <div className="flex flex-col items-center text-center space-y-3 mb-12">
          <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-lg">
            It's a Match!
          </h1>
          <p className="text-base font-medium text-gray-200/90 leading-relaxed max-w-[260px]">
            You and <span className="text-white font-bold">{matchedUser.fullName}</span> are interested in connecting.
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex w-full flex-col gap-4">
          <Button onClick={handleSendEmail} className="w-full h-14">
            <Mail className="h-5 w-5" />
            <span>Send Email</span>
          </Button>
          
          <Button variant="secondary" onClick={handleKeepSwiping} className="w-full h-14">
            <RotateCcw className="h-5 w-5" />
            <span>Keep Swiping</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
