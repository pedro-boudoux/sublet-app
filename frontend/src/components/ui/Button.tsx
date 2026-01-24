import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
          'disabled:opacity-50 disabled:pointer-events-none',
          
          // Variants
          variant === 'primary' && [
            'bg-primary text-white rounded-xl',
            'shadow-[0_8px_20px_rgba(0,121,214,0.3)]',
            'hover:scale-[1.02] active:scale-[0.98]',
          ],
          variant === 'secondary' && [
            'bg-white/5 text-gray-300 rounded-xl',
            'border border-white/20 backdrop-blur-md',
            'hover:bg-white/10 hover:text-white',
            'active:bg-white/15 active:scale-[0.98]',
          ],
          variant === 'ghost' && [
            'bg-transparent text-white/80 rounded-lg',
            'hover:bg-white/10 hover:text-white',
            'active:scale-[0.95]',
          ],
          variant === 'glass' && [
            'glass-btn rounded-full text-white/80',
            'hover:text-white',
          ],
          
          // Sizes
          size === 'sm' && 'h-9 px-3 text-sm',
          size === 'md' && 'h-12 px-5 text-base',
          size === 'lg' && 'h-14 px-6 text-lg',
          size === 'icon' && 'h-10 w-10 p-0',
          
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
