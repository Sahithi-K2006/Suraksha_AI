import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

const STEP_DELAY_MS = 450;

export default function ReasoningTrace({ trace = [], onComplete, speedMs = STEP_DELAY_MS }) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [checkingIndex, setCheckingIndex] = useState(trace.length ? 0 : -1);
  const completedRef = useRef(false);

  useEffect(() => {
    completedRef.current = false;
    setRevealedCount(0);
    setCheckingIndex(trace.length ? 0 : -1);

    if (!trace.length) {
      onComplete?.();
      return;
    }

    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setRevealedCount(i);
      if (i < trace.length) {
        setCheckingIndex(i);
      } else {
        setCheckingIndex(-1);
        clearInterval(interval);
        if (!completedRef.current) {
          completedRef.current = true;
          setTimeout(() => onComplete?.(), 300);
        }
      }
    }, speedMs);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trace]);

  return (
    <div className="rounded-xl bg-slate-900 text-slate-100 p-5 font-mono text-sm space-y-2.5 shadow-inner">
      <div className="text-xs uppercase tracking-wider text-slate-400 mb-3">SuRakshaAI Reasoning Trace</div>
      <AnimatePresence initial={false}>
        {trace.slice(0, revealedCount).map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-2.5"
          >
            {item.hit ? (
              <AlertTriangle className="w-4 h-4 text-safety-orange shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-safe-green shrink-0 mt-0.5" />
            )}
            <span>
              <span className="text-slate-300">{item.step}...</span>{' '}
              <span className={item.hit ? 'text-safety-orange' : 'text-safe-green'}>{item.result}</span>
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
      {checkingIndex >= 0 && checkingIndex < trace.length && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2.5 text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{trace[checkingIndex].step}...</span>
        </motion.div>
      )}
    </div>
  );
}
