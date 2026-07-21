import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { cn } from '../lib/cn';

const CONFIG = {
  safe: { label: 'Safe', icon: ShieldCheck, className: 'bg-safe-green/10 text-safe-green border-safe-green/30' },
  suspicious: { label: 'Suspicious', icon: ShieldAlert, className: 'bg-risk-amber/10 text-risk-amber border-risk-amber/30' },
  high_risk: { label: 'High Risk', icon: ShieldX, className: 'bg-risk-red/10 text-risk-red border-risk-red/30' },
};

export default function VerdictBadge({ verdict, size = 'md', className }) {
  const config = CONFIG[verdict] || CONFIG.safe;
  const Icon = config.icon;
  const sizeClasses = size === 'lg' ? 'text-base px-4 py-2 gap-2' : 'text-sm px-3 py-1 gap-1.5';

  return (
    <span className={cn('inline-flex items-center rounded-full border font-semibold', sizeClasses, config.className, className)}>
      <Icon className={size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
      {config.label}
    </span>
  );
}

export function verdictLabel(verdict) {
  return CONFIG[verdict]?.label || verdict;
}
