import { cn } from '../../lib/utils';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'acrylic';
  className?: string;
  style?: React.CSSProperties;
}

export function Card({
  children,
  variant = 'default',
  className,
  style,
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl',
        
        variant === 'default' && [
          'bg-gray-800/40 border border-white/5',
        ],
        
        variant === 'acrylic' && [
          'acrylic-panel',
        ],
        
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}

export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={cn('p-5 flex flex-col gap-3', className)}>
      {children}
    </div>
  );
}

export interface CardHeaderProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, icon, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center gap-2 mb-1', className)}>
      {icon}
      <h3 className="text-white text-lg font-bold">{children}</h3>
    </div>
  );
}
