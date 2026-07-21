import { NavLink } from 'react-router-dom';
import { ShieldCheck, MessageSquareWarning, Banknote, QrCode, Bot, LayoutDashboard, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/cn';
import LanguageSelector from './LanguageSelector';

const LINKS = [
  { to: '/', label: 'Home', icon: ShieldCheck, end: true },
  { to: '/message-checker', label: 'Message Checker', icon: MessageSquareWarning },
  { to: '/currency-checker', label: 'Currency Checker', icon: Banknote },
  { to: '/qr-checker', label: 'QR Checker', icon: QrCode },
  { to: '/assistant', label: 'Assistant', icon: Bot },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 surface-card border-b border-slate-200/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2.5 font-heading font-bold text-trust-blue text-lg">
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-trust-blue to-trust-blue-light shadow-md shadow-trust-blue/30">
            <ShieldCheck className="w-5 h-5 text-white" />
          </span>
          SuRaksha<span className="text-safety-orange">AI</span>
        </NavLink>

        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200',
                  isActive ? 'bg-trust-blue text-white shadow-sm shadow-trust-blue/30' : 'text-slate-600 hover:bg-slate-100',
                )
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSelector compact />
          <button className="md:hidden text-slate-700" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="md:hidden border-t border-slate-200/70 px-4 py-2 flex flex-col gap-1">
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium',
                  isActive ? 'bg-trust-blue text-white' : 'text-slate-600 hover:bg-slate-100',
                )
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
