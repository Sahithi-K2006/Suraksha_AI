import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

function colorForScore(score) {
  if (score >= 70) return '#DC2626';
  if (score >= 35) return '#F59E0B';
  return '#10B981';
}

export default function RiskGauge({ score = 0, size = 180, label = 'Risk Score' }) {
  const [displayScore, setDisplayScore] = useState(0);
  const radius = size / 2 - 14;
  const circumference = Math.PI * radius; // half circle
  const clamped = Math.max(0, Math.min(100, score));
  const color = colorForScore(clamped);

  useEffect(() => {
    const start = performance.now();
    const duration = 900;
    let raf;
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * clamped));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [clamped]);

  const offset = circumference - (displayScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        <path
          d={`M 14 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 14} ${size / 2}`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <motion.path
          d={`M 14 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 14} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke 0.3s ease' }}
        />
      </svg>
      <div className="-mt-10 flex flex-col items-center">
        <span className="font-heading text-4xl font-bold" style={{ color }}>{displayScore}</span>
        <span className="text-xs text-slate-500 mt-1">{label} / 100</span>
      </div>
    </div>
  );
}
