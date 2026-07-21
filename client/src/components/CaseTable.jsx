import { Link } from 'react-router-dom';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
import VerdictBadge from './VerdictBadge';
import { cn } from '../lib/cn';

const TYPE_LABELS = {
  scam_message: 'Scam Message',
  counterfeit_currency: 'Counterfeit Currency',
  qr_link: 'QR / Link',
};

export default function CaseTable({ cases, filters, onFilterChange, sort, onSortChange, total }) {
  const toggleSort = (col) => {
    if (sort.sort === col) {
      onSortChange({ sort: col, order: sort.order === 'asc' ? 'desc' : 'asc' });
    } else {
      onSortChange({ sort: col, order: 'desc' });
    }
  };

  const SortIcon = ({ col }) => {
    if (sort.sort !== col) return null;
    return sort.order === 'asc' ? <ChevronUp className="w-3.5 h-3.5 inline" /> : <ChevronDown className="w-3.5 h-3.5 inline" />;
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={filters.q}
            onChange={(e) => onFilterChange({ q: e.target.value })}
            placeholder="Search cases..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-trust-blue/40"
          />
        </div>
        <select
          value={filters.type}
          onChange={(e) => onFilterChange({ type: e.target.value })}
          className="rounded-lg border border-slate-300 text-sm px-3 py-2"
        >
          <option value="">All types</option>
          <option value="scam_message">Scam Message</option>
          <option value="counterfeit_currency">Counterfeit Currency</option>
          <option value="qr_link">QR / Link</option>
        </select>
        <select
          value={filters.verdict}
          onChange={(e) => onFilterChange({ verdict: e.target.value })}
          className="rounded-lg border border-slate-300 text-sm px-3 py-2"
        >
          <option value="">All verdicts</option>
          <option value="safe">Safe</option>
          <option value="suspicious">Suspicious</option>
          <option value="high_risk">High Risk</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left cursor-pointer select-none" onClick={() => toggleSort('id')}>ID <SortIcon col="id" /></th>
              <th className="px-4 py-3 text-left cursor-pointer select-none" onClick={() => toggleSort('type')}>Type <SortIcon col="type" /></th>
              <th className="px-4 py-3 text-left">Summary</th>
              <th className="px-4 py-3 text-left cursor-pointer select-none" onClick={() => toggleSort('verdict')}>Verdict <SortIcon col="verdict" /></th>
              <th className="px-4 py-3 text-left cursor-pointer select-none" onClick={() => toggleSort('risk_score')}>Risk <SortIcon col="risk_score" /></th>
              <th className="px-4 py-3 text-left">Region</th>
              <th className="px-4 py-3 text-left cursor-pointer select-none" onClick={() => toggleSort('created_at')}>Date <SortIcon col="created_at" /></th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
              <tr key={c.id} className={cn('border-t border-slate-100 hover:bg-slate-50')}>
                <td className="px-4 py-3 text-slate-400 font-mono text-xs">#{c.id}</td>
                <td className="px-4 py-3 text-slate-700">{TYPE_LABELS[c.type]}</td>
                <td className="px-4 py-3 text-slate-700 max-w-xs truncate">
                  <Link to={`/cases/${c.id}`} className="hover:text-trust-blue hover:underline">{c.input_summary}</Link>
                </td>
                <td className="px-4 py-3"><VerdictBadge verdict={c.verdict} /></td>
                <td className="px-4 py-3 font-mono">{c.risk_score}</td>
                <td className="px-4 py-3 text-slate-500">{c.region || '-'}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{new Date(c.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {!cases.length && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No cases match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-slate-400 mt-2">Showing {cases.length} of {total} cases</div>
    </div>
  );
}
