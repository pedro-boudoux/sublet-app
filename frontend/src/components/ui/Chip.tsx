import { cn } from '../../lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface ChipProps {
  children: React.ReactNode;
  icon?: LucideIcon;
  iconColor?: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Chip({
  children,
  icon: Icon,
  iconColor = 'text-primary',
  selected = false,
  onClick,
  className,
}: ChipProps) {
  const isInteractive = !!onClick;
  
  return (
    <div
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={cn(
        'inline-flex items-center gap-2 px-3.5 py-2 rounded-full',
        'text-sm font-medium text-slate-200',
        'bg-white/5 border border-white/10',
        'transition-colors duration-200',
        
        isInteractive && [
          'cursor-pointer',
          'hover:bg-white/10',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        ],
        
        selected && [
          'bg-primary/20 border-primary/30 text-white',
        ],
        
        className
      )}
    >
      {Icon && <Icon className={cn('h-[18px] w-[18px]', iconColor)} />}
      {children}
    </div>
  );
}
