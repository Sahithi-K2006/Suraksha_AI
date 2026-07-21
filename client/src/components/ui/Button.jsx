import { cn } from '../../lib/cn';

const VARIANTS = {
  primary: 'bg-trust-blue text-white hover:bg-trust-blue-light shadow-sm',
  accent: 'bg-safety-orange text-white hover:brightness-95 shadow-sm',
  outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50 bg-white',
  ghost: 'text-slate-600 hover:bg-slate-100',
  danger: 'bg-risk-red text-white hover:brightness-95 shadow-sm',
  success: 'bg-safe-green text-white hover:brightness-95 shadow-sm',
};

const SIZES = {
  sm: 'text-sm px-3 py-1.5',
  md: 'text-sm px-4 py-2.5',
  lg: 'text-base px-6 py-3',
};

export function Button({ className, variant = 'primary', size = 'md', children, ...props }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
