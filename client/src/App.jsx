import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import { ToastProvider } from './components/ui/Toast';
import Home from './pages/Home';
import MessageChecker from './pages/MessageChecker';
import CurrencyChecker from './pages/CurrencyChecker';
import QrChecker from './pages/QrChecker';
import UnifiedReport from './pages/UnifiedReport';
import Assistant from './pages/Assistant';
import Dashboard from './pages/Dashboard';
import CaseDetail from './pages/CaseDetail';

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-app-bg">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/message-checker" element={<MessageChecker />} />
              <Route path="/currency-checker" element={<CurrencyChecker />} />
              <Route path="/qr-checker" element={<QrChecker />} />
              <Route path="/report" element={<UnifiedReport />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/cases/:id" element={<CaseDetail />} />
            </Routes>
          </main>
          <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
            SuRakshaAI - a hackathon prototype. Heuristic/rules-based AI, not a licensed forensic or legal tool.
          </footer>
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
}
