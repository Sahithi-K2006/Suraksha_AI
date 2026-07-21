import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquareWarning, ExternalLink, RotateCcw } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import ReasoningTrace from '../components/ReasoningTrace';
import VerdictBadge from '../components/VerdictBadge';
import RiskGauge from '../components/RiskGauge';
import ExplainabilityPanel from '../components/ExplainabilityPanel';
import SimilarCasesList from '../components/SimilarCasesList';
import { useToast } from '../components/ui/Toast';
import { api } from '../lib/api';
import { consumeHandoff } from '../lib/handoff';
import { getSimulatedRegion } from '../lib/regions';
import { addSessionResult } from '../lib/sessionStore';

const SAMPLE_SCAM = 'URGENT: Your bank account KYC will expire today. Share your OTP immediately to avoid permanent suspension: bit.ly/kyc-verify';
const SAMPLE_SAFE = 'Hey, are we still meeting for coffee tomorrow at 5pm near the metro station?';

export default function MessageChecker() {
  const [text, setText] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | tracing | done
  const [result, setResult] = useState(null);
  const { toast } = useToast();
  const ranHandoff = useRef(false);

  const runAnalysis = useCallback(async (inputText) => {
    if (!inputText.trim()) return;
    setPhase('loading');
    try {
      const loc = getSimulatedRegion();
      const data = await api.analyzeText({ text: inputText, ...loc });
      setResult(data);
      setPhase('tracing');
      addSessionResult({ type: 'scam_message', score: data.score, verdict: data.verdict, caseId: data.case?.id });
    } catch (err) {
      toast(err.message || 'Analysis failed', 'error');
      setPhase('idle');
    }
  }, [toast]);

  useEffect(() => {
    if (ranHandoff.current) return;
    ranHandoff.current = true;
    const handoff = consumeHandoff();
    if (handoff?.target === 'message' && handoff.content) {
      setText(handoff.content);
      runAnalysis(handoff.content);
    }
  }, [runAnalysis]);

  const reset = () => {
    setPhase('idle');
    setResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-2 mb-2 text-trust-blue">
        <MessageSquareWarning className="w-5 h-5" />
        <span className="text-sm font-medium uppercase tracking-wide">Scam Message Detector</span>
      </div>
      <h1 className="font-heading text-3xl font-bold text-slate-900 mb-6">Message Checker</h1>

      {phase === 'idle' && (
        <Card className="mb-6">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the suspicious message, SMS, email, or WhatsApp text here..."
            rows={6}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-trust-blue/40 focus:border-trust-blue resize-none mb-4"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => runAnalysis(text)} disabled={!text.trim()}>Run Analysis</Button>
            <button className="text-xs text-slate-500 hover:text-trust-blue underline" onClick={() => setText(SAMPLE_SCAM)}>Try a scam example</button>
            <button className="text-xs text-slate-500 hover:text-trust-blue underline" onClick={() => setText(SAMPLE_SAFE)}>Try a safe example</button>
          </div>
        </Card>
      )}

      {phase === 'loading' && (
        <Card className="mb-6 text-center py-10 text-slate-500">Analyzing message...</Card>
      )}

      {(phase === 'tracing' || phase === 'done') && result && (
        <div className="space-y-6">
          <Card className="bg-slate-50">
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Analyzed message</div>
            <p className="text-sm text-slate-700 italic">"{result.inputSummary}"</p>
          </Card>

          <ReasoningTrace trace={result.trace} onComplete={() => setPhase('done')} />

          {phase === 'done' && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Card className="flex flex-col sm:flex-row items-center gap-6 justify-between">
                <div className="flex flex-col items-center sm:items-start gap-3">
                  <VerdictBadge verdict={result.verdict} size="lg" />
                  {result.case && (
                    <Link to={`/cases/${result.case.id}`} className="text-sm text-trust-blue hover:underline flex items-center gap-1">
                      View full case & generate report <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  <Link to="/report" className="text-sm text-slate-500 hover:text-trust-blue hover:underline flex items-center gap-1">
                    View unified risk report <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <RiskGauge score={result.score} label="Message Risk" />
              </Card>

              <ExplainabilityPanel trace={result.trace} redFlags={result.redFlags} />

              <SimilarCasesList cases={result.similarCases} />

              <div className="flex justify-center">
                <Button variant="outline" onClick={reset}>
                  <RotateCcw className="w-4 h-4" /> Check another message
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
