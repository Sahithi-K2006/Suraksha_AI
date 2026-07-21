import { motion } from 'framer-motion';
import { cn } from '../lib/cn';

export default function StatCard({ label, value, icon: Icon, accent = 'text-trust-blue', suffix = '' }) {
  return (
    <motion.div
      layout
      className="rounded-xl bg-white border border-slate-200 shadow-sm p-5 flex items-center justify-between"
    >
      <div>
        <div className="text-xs text-slate-500 mb-1">{label}</div>
        <motion.div key={value} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className={cn('font-heading text-2xl font-bold', accent)}>
          {value}{suffix}
        </motion.div>
      </div>
      {Icon && (
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center bg-slate-50', accent)}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </motion.div>
  );
}
