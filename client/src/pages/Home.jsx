import { Link } from 'react-router-dom';
import { MessageSquareWarning, Banknote, QrCode, Bot, ShieldCheck, Layers } from 'lucide-react';
import AutoDetectDropZone from '../components/AutoDetectDropZone';

const SECONDARY_LINKS = [
  { to: '/message-checker', label: 'Message Checker', icon: MessageSquareWarning, desc: 'Paste a suspicious SMS, email, or chat' },
  { to: '/currency-checker', label: 'Currency Checker', icon: Banknote, desc: 'Upload or scan a currency note' },
  { to: '/qr-checker', label: 'QR Checker', icon: QrCode, desc: 'Scan a QR or paste a payment link' },
  { to: '/assistant', label: 'Talk to Assistant', icon: Bot, desc: 'Chat for plain-language guidance' },
];

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <section className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-trust-blue/10 text-trust-blue px-4 py-1.5 rounded-full text-sm font-medium mb-5">
          <ShieldCheck className="w-4 h-4" />
          Unified, explainable fraud detection
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
          SuRaksha<span className="text-safety-orange">AI</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Your Shield Against Digital Fraud. Drop a message, a currency photo, or a QR/payment
          link below - we'll detect what it is and tell you exactly why it's safe or risky.
        </p>
      </section>

      <section className="mb-14">
        <AutoDetectDropZone />
      </section>

      <section className="mb-16">
        <div className="flex items-center gap-2 mb-5 text-slate-500 text-sm font-medium">
          <Layers className="w-4 h-4" />
          Or go straight to a dedicated checker
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SECONDARY_LINKS.map(({ to, label, icon: Icon, desc }) => (
            <Link
              key={to}
              to={to}
              className="group rounded-xl bg-white border border-slate-200 p-5 hover:border-trust-blue/40 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-trust-blue/10 flex items-center justify-center mb-3 group-hover:bg-trust-blue group-hover:text-white text-trust-blue transition-colors">
                <Icon className="w-5 h-5" />
              </div>
              <div className="font-heading font-semibold text-slate-900 mb-1">{label}</div>
              <div className="text-sm text-slate-500">{desc}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-trust-blue text-white p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="font-heading text-xl font-semibold mb-1">Investigating fraud patterns at scale?</div>
          <div className="text-blue-100 text-sm">Police / cyber-cell investigators can access the case dashboard, trend charts, and incident map.</div>
        </div>
        <Link to="/dashboard" className="bg-white text-trust-blue font-medium px-5 py-2.5 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap">
          Police Login &rarr; Dashboard
        </Link>
      </section>
    </div>
  );
}
