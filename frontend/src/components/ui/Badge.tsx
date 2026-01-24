import { cn } from '../../lib/utils';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'verified' | 'type' | 'trusted';
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  className,
}: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide',
        
        variant === 'default' && [
          'bg-white/10 text-white backdrop-blur-md border border-white/10',
        ],
        variant === 'verified' && [
          'bg-black/40 backdrop-blur-xl border border-white/15 shadow-lg',
          'text-white',
        ],
        variant === 'type' && [
          'bg-white/10 backdrop-blur-md border border-white/10',
          'text-white text-xs font-medium normal-case',
        ],
        variant === 'trusted' && [
          'bg-green-400/10 text-green-400 font-medium normal-case',
        ],
        
        className
      )}
    >
      {children}
    </div>
  );
}

// Verified Badge with Icon
export function VerifiedBadge({ label = 'Verified' }: { label?: string }) {
  return (
    <Badge variant="verified">
      <div className="bg-primary/20 rounded-full p-0.5 flex items-center justify-center">
        <svg
          className="h-4 w-4 text-primary"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      </div>
      <span>{label}</span>
    </Badge>
  );
}
