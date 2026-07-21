import { cn } from '../../lib/cn';

const VARIANTS = {
  primary: 'bg-gradient-to-b from-trust-blue-light to-trust-blue text-white hover:brightness-110 shadow-md shadow-trust-blue/25',
  accent: 'bg-gradient-to-b from-orange-400 to-safety-orange text-white hover:brightness-105 shadow-md shadow-safety-orange/25',
  outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 bg-white',
  ghost: 'text-slate-600 hover:bg-slate-100',
  danger: 'bg-gradient-to-b from-red-500 to-risk-red text-white hover:brightness-105 shadow-md shadow-risk-red/25',
  success: 'bg-gradient-to-b from-emerald-400 to-safe-green text-white hover:brightness-105 shadow-md shadow-safe-green/25',
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
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer',
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
