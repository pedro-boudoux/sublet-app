import { cn } from '../../lib/utils';

export interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  verified?: boolean;
  online?: boolean;
  className?: string;
}

export function Avatar({
  src,
  alt = 'Profile picture',
  size = 'md',
  verified = false,
  online = false,
  className,
}: AvatarProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Avatar Image */}
      <div
        className={cn(
          'rounded-full bg-gray-700 bg-cover bg-center shadow-lg',
          'ring-2 ring-white/10',
          size === 'sm' && 'h-8 w-8',
          size === 'md' && 'h-10 w-10',
          size === 'lg' && 'h-20 w-20',
          size === 'xl' && 'h-28 w-28 ring-4 ring-white/5 shadow-2xl'
        )}
        style={src ? { backgroundImage: `url(${src})` } : undefined}
        role="img"
        aria-label={alt}
      />
      
      {/* Online Indicator */}
      {online && (
        <div
          className={cn(
            'absolute bg-green-500 rounded-full border-2 border-background-dark shadow-sm',
            size === 'sm' && 'h-2 w-2 -bottom-0.5 -right-0.5',
            size === 'md' && 'h-3 w-3 -bottom-0.5 -right-0.5',
            size === 'lg' && 'h-4 w-4 bottom-0 right-0',
            size === 'xl' && 'h-5 w-5 bottom-1 right-1'
          )}
        />
      )}
      
      {/* Verified Badge */}
      {verified && (
        <div
          className={cn(
            'absolute bg-primary rounded-full flex items-center justify-center',
            'border-2 border-[#0f1a23] shadow-lg',
            size === 'sm' && 'h-4 w-4 -bottom-0.5 -right-0.5',
            size === 'md' && 'h-5 w-5 -bottom-0.5 -right-0.5',
            size === 'lg' && 'h-6 w-6 bottom-0 right-0',
            size === 'xl' && 'h-7 w-7 bottom-0 right-0'
          )}
        >
          <svg
            className={cn(
              'text-white',
              size === 'sm' && 'h-2.5 w-2.5',
              size === 'md' && 'h-3 w-3',
              size === 'lg' && 'h-3.5 w-3.5',
              size === 'xl' && 'h-4 w-4'
            )}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
