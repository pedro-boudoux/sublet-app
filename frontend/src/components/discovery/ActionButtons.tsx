import { X, Heart } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ActionButtonsProps {
  onPass: () => void;
  onLike: () => void;
  disabled?: boolean;
  className?: string;
}

export function ActionButtons({
  onPass,
  onLike,
  disabled = false,
  className,
}: ActionButtonsProps) {
  return (
    <div className={cn('flex items-center justify-center gap-10', className)}>
      {/* Pass Button */}
      <button
        onClick={onPass}
        disabled={disabled}
        className={cn(
          'group relative flex items-center justify-center',
          'h-16 w-16 rounded-full',
          'glass-btn shadow-lg',
          'hover:bg-red-500/10 active:scale-95',
          'transition-all duration-200',
          'disabled:opacity-50 disabled:pointer-events-none'
        )}
        aria-label="Pass"
      >
        <X className="h-8 w-8 text-red-400 group-hover:scale-110 transition-transform" />
      </button>
      
      {/* Like Button */}
      <button
        onClick={onLike}
        disabled={disabled}
        className={cn(
          'group relative flex items-center justify-center',
          'h-20 w-20 rounded-full',
          'bg-primary/20 backdrop-blur-xl border border-white/20',
          'shadow-[0_0_20px_rgba(0,121,214,0.4)]',
          'hover:bg-primary/30 active:scale-95',
          'transition-all duration-200',
          'disabled:opacity-50 disabled:pointer-events-none'
        )}
        aria-label="Like"
      >
        {/* Subtle shine effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/10 to-transparent opacity-50" />
        <Heart
          className="h-10 w-10 text-white fill-white group-hover:scale-110 transition-transform drop-shadow-lg"
        />
      </button>
    </div>
  );
}
