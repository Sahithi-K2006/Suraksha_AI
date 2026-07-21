import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquareWarning, Banknote, QrCode, Bot, ShieldCheck, Layers, ArrowRight } from 'lucide-react';
import AutoDetectDropZone from '../components/AutoDetectDropZone';

const SECONDARY_LINKS = [
  { to: '/message-checker', label: 'Message Checker', icon: MessageSquareWarning, desc: 'Paste a suspicious SMS, email, or chat', accent: 'from-trust-blue to-trust-blue-light' },
  { to: '/currency-checker', label: 'Currency Checker', icon: Banknote, desc: 'Upload or scan a currency note', accent: 'from-emerald-500 to-safe-green' },
  { to: '/qr-checker', label: 'QR Checker', icon: QrCode, desc: 'Scan a QR or paste a payment link', accent: 'from-orange-400 to-safety-orange' },
  { to: '/assistant', label: 'Talk to Assistant', icon: Bot, desc: 'Chat for plain-language guidance', accent: 'from-violet-500 to-indigo-500' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* Decorative background blobs - presentational only */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-trust-blue/10 blur-3xl animate-soft-float" />
      <div className="pointer-events-none absolute top-40 -right-32 w-[28rem] h-[28rem] rounded-full bg-safety-orange/10 blur-3xl animate-soft-float" style={{ animationDelay: '1.5s' }} />
      <div className="pointer-events-none absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-safe-green/10 blur-3xl animate-soft-float" style={{ animationDelay: '3s' }} />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <motion.section
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-trust-blue/10 text-trust-blue px-4 py-1.5 rounded-full text-sm font-medium mb-5 ring-1 ring-trust-blue/10">
            <ShieldCheck className="w-4 h-4" />
            Unified, explainable fraud detection
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-4">
            <span className="text-gradient-brand">SuRakshaAI</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Your Shield Against Digital Fraud. Drop a message, a currency photo, or a QR/payment
            link below - we'll detect what it is and tell you exactly why it's safe or risky.
          </p>
        </motion.section>

        <motion.section
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          className="mb-14"
        >
          <AutoDetectDropZone />
        </motion.section>

        <motion.section
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
          className="mb-16"
        >
          <div className="flex items-center gap-2 mb-5 text-slate-500 text-sm font-medium">
            <Layers className="w-4 h-4" />
            Or go straight to a dedicated checker
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SECONDARY_LINKS.map(({ to, label, icon: Icon, desc, accent }) => (
              <Link
                key={to}
                to={to}
                className="group relative rounded-2xl surface-card border border-slate-200/70 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_40px_-16px_rgba(30,58,138,0.28)] hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center mb-3 shadow-md text-white group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="font-heading font-semibold text-slate-900 mb-1 flex items-center gap-1">
                  {label}
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-trust-blue" />
                </div>
                <div className="text-sm text-slate-500">{desc}</div>
              </Link>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-trust-blue to-trust-blue-light text-white p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-trust-blue/25"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <div className="font-heading text-xl font-semibold mb-1">Investigating fraud patterns at scale?</div>
            <div className="text-blue-100 text-sm">Police / cyber-cell investigators can access the case dashboard, trend charts, and incident map.</div>
          </div>
          <Link to="/dashboard" className="relative bg-white text-trust-blue font-medium px-5 py-2.5 rounded-lg hover:bg-blue-50 hover:scale-105 transition-all duration-200 whitespace-nowrap shadow-md">
            Police Login &rarr; Dashboard
          </Link>
        </motion.section>
      </div>
    </div>
  );
}
