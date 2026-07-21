import { cn } from '../../lib/cn';

export function Card({ className, children, interactive = false, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl surface-card shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] border border-slate-200/70 p-6 transition-all duration-300',
        interactive && 'hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_40px_-16px_rgba(30,58,138,0.28)] hover:-translate-y-0.5 hover:border-trust-blue/30',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3 className={cn('font-heading text-lg font-semibold text-slate-900', className)} {...props}>
      {children}
    </h3>
  );
}
