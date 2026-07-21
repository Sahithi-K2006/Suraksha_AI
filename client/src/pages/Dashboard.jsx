import { useEffect, useState, useCallback } from 'react';
import { LayoutDashboard, Lock, ShieldAlert, ShieldCheck, Gauge, Files, Zap, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import StatCard from '../components/StatCard';
import TrendChart from '../components/TrendChart';
import IncidentMap from '../components/IncidentMap';
import CaseTable from '../components/CaseTable';
import { useToast } from '../components/ui/Toast';
import { api } from '../lib/api';

const AUTH_KEY = 'suraksha_dashboard_auth';
const DEMO_PASSWORD = 'police123';

function DashboardLogin({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (password === DEMO_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, '1');
      onSuccess();
    } else {
      setError('Incorrect password. Hint: this is a demo gate, see README.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-24">
      <Card className="text-center">
        <div className="w-12 h-12 rounded-full bg-trust-blue/10 text-trust-blue flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="font-heading text-xl font-semibold text-slate-900 mb-1">Investigator Login</h1>
        <p className="text-sm text-slate-500 mb-5">Demo password gate for the police / cyber-cell dashboard.</p>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter dashboard password"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-trust-blue/40"
            autoFocus
          />
          {error && <div className="text-xs text-risk-red">{error}</div>}
          <Button type="submit" className="w-full justify-center">Login</Button>
          <div className="text-xs text-slate-400">Demo password: <code className="bg-slate-100 px-1.5 py-0.5 rounded">{DEMO_PASSWORD}</code></div>
        </form>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === '1');
  const [stats, setStats] = useState(null);
  const [cases, setCases] = useState([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ q: '', type: '', verdict: '' });
  const [sort, setSort] = useState({ sort: 'created_at', order: 'desc' });
  const [stressRunning, setStressRunning] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      const [statsData, casesData] = await Promise.all([
        api.getStats(),
        api.listCases({ ...filters, ...sort, limit: 200 }),
      ]);
      setStats(statsData);
      setCases(casesData.cases);
      setTotal(casesData.total);
    } catch (err) {
      toast(err.message || 'Failed to load dashboard data', 'error');
    }
  }, [filters, sort, toast]);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  const runStressTest = async () => {
    setStressRunning(true);
    try {
      const res = await api.stressTest(500);
      toast(`Injected ${res.inserted} synthetic cases in ${res.durationMs}ms`, 'success');
      await load();
    } catch (err) {
      toast(err.message || 'Stress test failed', 'error');
    } finally {
      setStressRunning(false);
    }
  };

  const exportCsv = () => {
    const header = ['id', 'type', 'verdict', 'risk_score', 'region', 'created_at', 'input_summary'];
    const rows = cases.map((c) => header.map((h) => `"${String(c[h] ?? '').replace(/"/g, '""')}"`).join(','));
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'suraksha-cases.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!authed) return <DashboardLogin onSuccess={() => setAuthed(true)} />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-trust-blue">
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wide">Investigation Dashboard</span>
          </div>
          <h1 className="font-heading text-3xl font-bold text-slate-900">Fraud Case Overview</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={exportCsv}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button variant="accent" onClick={runStressTest} disabled={stressRunning}>
            <Zap className="w-4 h-4" /> {stressRunning ? 'Injecting 500 cases...' : 'Run Stress Test (+500 cases)'}
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Cases" value={stats.total} icon={Files} accent="text-trust-blue" />
          <StatCard label="High Risk" value={stats.highRiskCount} icon={ShieldAlert} accent="text-risk-red" />
          <StatCard label="Avg Risk Score" value={stats.avgRiskScore} suffix="/100" icon={Gauge} accent="text-safety-orange" />
          <StatCard label="Safe Cases" value={stats.byVerdict?.safe || 0} icon={ShieldCheck} accent="text-safe-green" />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader><CardTitle>Case volume trend</CardTitle></CardHeader>
          {stats && <TrendChart trend={stats.trend} />}
        </Card>
        <Card>
          <CardHeader><CardTitle>Incident map</CardTitle></CardHeader>
          <IncidentMap cases={cases} />
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>All cases</CardTitle></CardHeader>
        <CaseTable
          cases={cases}
          total={total}
          filters={filters}
          onFilterChange={(f) => setFilters((prev) => ({ ...prev, ...f }))}
          sort={sort}
          onSortChange={setSort}
        />
      </Card>
    </div>
  );
}
