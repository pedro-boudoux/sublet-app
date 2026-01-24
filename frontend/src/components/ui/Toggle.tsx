import { cn } from '../../lib/utils';

export interface ToggleOption {
  value: string;
  label: string;
}

export interface ToggleProps {
  options: ToggleOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Toggle({
  options,
  value,
  onChange,
  className,
}: ToggleProps) {
  return (
    <div
      className={cn(
        'flex h-12 w-full items-center rounded-full',
        'bg-white/5 p-1 border border-white/5',
        className
      )}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className="flex-1 cursor-pointer h-full relative z-10"
        >
          <input
            type="radio"
            name="toggle"
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            className="peer sr-only"
          />
          <div
            className={cn(
              'flex h-full w-full items-center justify-center rounded-full',
              'transition-all duration-300',
              'text-slate-400 font-medium text-sm',
              'peer-checked:bg-primary peer-checked:text-white peer-checked:shadow-md'
            )}
          >
            {option.label}
          </div>
        </label>
      ))}
    </div>
  );
}
