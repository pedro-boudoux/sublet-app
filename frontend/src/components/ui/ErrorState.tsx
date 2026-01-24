import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We couldn\'t load the content. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center px-6 py-12',
      className
    )}>
      {/* Icon Container */}
      <div className="h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
        <AlertCircle className="h-10 w-10 text-red-400" />
      </div>
      
      {/* Text */}
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm max-w-[280px] mb-6">{message}</p>
      
      {/* Retry Button */}
      {onRetry && (
        <Button onClick={onRetry} variant="secondary">
          <RefreshCw className="h-4 w-4" />
          <span>Try Again</span>
        </Button>
      )}
    </div>
  );
}
