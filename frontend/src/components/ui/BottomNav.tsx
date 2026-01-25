import { useNavigate, useLocation } from 'react-router-dom';
import { Layers, Heart, Home, MessageCircle, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../stores/useStore';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useStore((state) => state.user);

  // Dynamic label based on user mode
  const savedLabel = user?.mode === 'offering' ? 'My Listing' : 'Saved';
  const SavedIcon = user?.mode === 'offering' ? Home : Heart;

  const navItems = [
    { id: 'discover', label: 'Discover', icon: Layers, path: '/' },
    { id: 'saved', label: savedLabel, icon: SavedIcon, path: '/saved' },
    { id: 'inbox', label: 'Inbox', icon: MessageCircle, path: '/inbox' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50">
      {/* Acrylic Background */}
      <div className="bg-[#0f1a23]/80 backdrop-blur-xl border-t border-white/5">
        <div className="flex items-center justify-around h-20 pb-2 max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={cn(
                  'flex flex-col items-center justify-center w-full h-full gap-1',
                  'transition-colors group relative bg-transparent border-none cursor-pointer',
                  isActive ? 'text-primary' : 'text-slate-500 hover:text-white'
                )}
              >
                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute -top-1 w-8 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(0,121,214,0.6)]" />
                )}

                {/* Icon */}
                <Icon
                  className={cn(
                    'h-[26px] w-[26px] transition-transform',
                    'group-hover:scale-110',
                    isActive && 'scale-110'
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />

                {/* Label */}
                <span
                  className={cn(
                    'text-[10px]',
                    isActive ? 'font-bold' : 'font-medium'
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* iOS Home Indicator Safe Area */}
      <div className="h-1 bg-transparent w-full absolute bottom-1 flex justify-center pointer-events-none">
        <div className="w-1/3 h-1 bg-white/20 rounded-full" />
      </div>
    </nav>
  );
}

