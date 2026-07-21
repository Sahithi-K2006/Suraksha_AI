import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, FileDown, MapPin, Clock, ArrowLeft, Copy, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import VerdictBadge from '../components/VerdictBadge';
import RiskGauge from '../components/RiskGauge';
import ExplainabilityPanel from '../components/ExplainabilityPanel';
import SimilarCasesList from '../components/SimilarCasesList';
import { useToast } from '../components/ui/Toast';
import { api } from '../lib/api';
import { generateCaseReportPdf } from '../lib/pdfReport';

const TYPE_LABELS = {
  scam_message: 'Scam Message',
  counterfeit_currency: 'Counterfeit Currency',
  qr_link: 'QR / Payment Link',
};

function parseExplanationToTrace(explanationJson) {
  let items = [];
  try {
    const parsed = JSON.parse(explanationJson);
    items = Array.isArray(parsed) ? parsed : [String(explanationJson)];
  } catch {
    items = explanationJson ? [String(explanationJson)] : [];
  }
  return items.map((text) => {
    const idx = text.indexOf(':');
    if (idx > -1 && idx < 40) {
      return { step: text.slice(0, idx).trim(), result: text.slice(idx + 1).trim(), hit: true };
    }
    return { step: text, result: 'flagged', hit: true };
  });
}

export default function CaseDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [complaint, setComplaint] = useState(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    api.getCase(id).then(setData).catch((err) => toast(err.message || 'Case not found', 'error'));
  }, [id, toast]);

  if (!data) return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-400">Loading case...</div>;

  const { case: caseRow, similarCases } = data;
  const trace = parseExplanationToTrace(caseRow.explanation);

  const generateComplaint = async () => {
    try {
      const res = await api.getComplaint(id);
      setComplaint(res.complaint);
    } catch (err) {
      toast(err.message || 'Failed to generate complaint', 'error');
    }
  };

  const copyComplaint = () => {
    if (!complaint) return;
    const text = `${complaint.disclaimer}\n\nDraft ID: ${complaint.draftId}\nCategory: ${complaint.category}\nIncident: ${complaint.incidentDate} ${complaint.incidentTime}\nLocation: ${complaint.location}\n\nDescription:\n${complaint.description}\n\nAI Findings:\n${complaint.aiFindings.map((f) => `- ${f}`).join('\n')}\n\nSuggested Actions:\n${complaint.suggestedActions.map((a) => `- ${a}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <Link to="/dashboard" className="text-sm text-slate-500 hover:text-trust-blue flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>

      <div className="flex items-center gap-2 mb-2 text-trust-blue">
        <FileText className="w-5 h-5" />
        <span className="text-sm font-medium uppercase tracking-wide">{TYPE_LABELS[caseRow.type]}</span>
      </div>
      <h1 className="font-heading text-3xl font-bold text-slate-900 mb-6">Case #{caseRow.id}</h1>

      <div className="space-y-6">
        <Card className="flex flex-col sm:flex-row items-center gap-6 justify-between">
          <div className="flex flex-col items-center sm:items-start gap-3">
            <VerdictBadge verdict={caseRow.verdict} size="lg" />
            <div className="flex flex-col gap-1 text-sm text-slate-500">
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {new Date(caseRow.created_at).toLocaleString()}</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {caseRow.region || 'Location not specified'}</span>
            </div>
          </div>
          <RiskGauge score={caseRow.risk_score} label="Risk Score" />
        </Card>

        <Card>
          <CardHeader><CardTitle>Original input</CardTitle></CardHeader>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{caseRow.input_summary}</p>
        </Card>

        <ExplainabilityPanel trace={trace} />

        <SimilarCasesList cases={similarCases} />

        <Card>
          <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
          <div className="flex flex-wrap gap-3">
            <Button onClick={generateComplaint}>
              <FileText className="w-4 h-4" /> Generate Cybercrime Complaint
            </Button>
            <Button variant="outline" onClick={() => generateCaseReportPdf(caseRow, complaint)}>
              <FileDown className="w-4 h-4" /> Generate PDF Report
            </Button>
          </div>
        </Card>

        {complaint && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-safety-orange/30 bg-orange-50/40">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Mock NCRP-Style Complaint Draft</span>
                  <Button size="sm" variant="outline" onClick={copyComplaint}>
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <div className="text-xs text-risk-red font-medium mb-4 bg-risk-red/5 border border-risk-red/20 rounded-lg px-3 py-2">
                {complaint.disclaimer}
              </div>
              <div className="space-y-3 text-sm text-slate-700">
                <div><span className="font-semibold">Draft ID:</span> {complaint.draftId}</div>
                <div><span className="font-semibold">Category:</span> {complaint.category}</div>
                <div><span className="font-semibold">Incident:</span> {complaint.incidentDate} at {complaint.incidentTime}</div>
                <div><span className="font-semibold">Location:</span> {complaint.location}</div>
                <div>
                  <span className="font-semibold">Description:</span>
                  <p className="mt-1 text-slate-600">{complaint.description}</p>
                </div>
                <div>
                  <span className="font-semibold">Suggested Actions:</span>
                  <ul className="list-disc list-inside mt-1 text-slate-600 space-y-0.5">
                    {complaint.suggestedActions.map((a, idx) => <li key={idx}>{a}</li>)}
                  </ul>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
