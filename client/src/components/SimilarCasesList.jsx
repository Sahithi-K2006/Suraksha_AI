import { Link } from 'react-router-dom';
import { MapPin, Radar } from 'lucide-react';
import VerdictBadge from './VerdictBadge';
import { Card, CardHeader, CardTitle } from './ui/Card';

export default function SimilarCasesList({ cases = [] }) {
  if (!cases.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radar className="w-4 h-4 text-trust-blue" />
          This matches {cases.length} other report{cases.length !== 1 ? 's' : ''} nearby
        </CardTitle>
      </CardHeader>
      <div className="space-y-2">
        {cases.map((c) => (
          <Link
            key={c.id}
            to={`/cases/${c.id}`}
            className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3 hover:border-trust-blue/40 hover:bg-slate-50 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm text-slate-800 truncate">{c.input_summary}</div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                {c.region && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {c.region}
                  </span>
                )}
                <span>{Math.round(c.similarity * 100)}% similar</span>
              </div>
            </div>
            <VerdictBadge verdict={c.verdict} />
          </Link>
        ))}
      </div>
    </Card>
  );
}
