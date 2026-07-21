import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, FileDown, Trash2, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import RiskGauge from '../components/RiskGauge';
import VerdictBadge from '../components/VerdictBadge';
import { getSessionResults, clearSessionResults } from '../lib/sessionStore';
import { api } from '../lib/api';
import { generateUnifiedReportPdf } from '../lib/pdfReport';
import { useToast } from '../components/ui/Toast';

const TYPE_LABELS = {
  scam_message: 'Scam Message',
  counterfeit_currency: 'Counterfeit Currency',
  qr_link: 'QR / Payment Link',
};

export default function UnifiedReport() {
  const [results, setResults] = useState([]);
  const [fused, setFused] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const load = () => setResults(getSessionResults());
    load();
    window.addEventListener('suraksha:session-updated', load);
    return () => window.removeEventListener('suraksha:session-updated', load);
  }, []);

  useEffect(() => {
    if (!results.length) { setFused(null); return; }
    api.fuseRisk(results.map((r) => ({ type: r.type, score: r.score })))
      .then(setFused)
      .catch(() => toast('Could not compute unified score', 'error'));
  }, [results, toast]);

  const handleClear = () => {
    clearSessionResults();
    toast('Session cleared', 'info');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-2 mb-2 text-trust-blue">
        <Layers className="w-5 h-5" />
        <span className="text-sm font-medium uppercase tracking-wide">Fraud Risk Assessment Engine</span>
      </div>
      <h1 className="font-heading text-3xl font-bold text-slate-900 mb-6">Unified Risk Report</h1>

      {!results.length ? (
        <Card className="text-center py-16">
          <p className="text-slate-500 mb-4">You haven't run any checks yet this session.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/message-checker"><Button variant="outline">Check a Message</Button></Link>
            <Link to="/currency-checker"><Button variant="outline">Check Currency</Button></Link>
            <Link to="/qr-checker"><Button variant="outline">Check a QR/Link</Button></Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="flex flex-col sm:flex-row items-center gap-8 justify-between">
            <div>
              <div className="text-sm text-slate-500 mb-2">Combined score across {results.length} check(s) run this session</div>
              {fused && <VerdictBadge verdict={fused.verdict} size="lg" />}
            </div>
            {fused && <RiskGauge score={fused.score} label="Unified Risk" />}
          </Card>

          {fused && (
            <Card>
              <CardHeader><CardTitle>Weighted contribution breakdown</CardTitle></CardHeader>
              <div className="space-y-3">
                {fused.breakdown.map((b, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-700">{TYPE_LABELS[b.type]} <span className="text-slate-400">(weight {Math.round(b.weight * 100)}%)</span></span>
                      <span className="font-mono text-slate-600">{b.score}/100</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-trust-blue rounded-full" style={{ width: `${b.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Checks in this session</CardTitle></CardHeader>
            <div className="space-y-2">
              {results.map((r, idx) => (
                <div key={idx} className="flex items-center justify-between border border-slate-200 rounded-lg px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-slate-800">{TYPE_LABELS[r.type]}</div>
                    <div className="text-xs text-slate-400">score {r.score}/100</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <VerdictBadge verdict={r.verdict} />
                    {r.caseId && (
                      <Link to={`/cases/${r.caseId}`} className="text-trust-blue text-sm hover:underline flex items-center gap-1">
                        Details <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={() => fused && generateUnifiedReportPdf(results, fused)} disabled={!fused}>
              <FileDown className="w-4 h-4" /> Generate PDF Report
            </Button>
            <Button variant="outline" onClick={handleClear}>
              <Trash2 className="w-4 h-4" /> Clear Session
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
