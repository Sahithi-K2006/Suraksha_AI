import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as Tabs from '@radix-ui/react-tabs';
import { Banknote, Camera, Upload, ExternalLink, RotateCcw, Video } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import ReasoningTrace from '../components/ReasoningTrace';
import VerdictBadge from '../components/VerdictBadge';
import RiskGauge from '../components/RiskGauge';
import ExplainabilityPanel from '../components/ExplainabilityPanel';
import SimilarCasesList from '../components/SimilarCasesList';
import { useToast } from '../components/ui/Toast';
import { cn } from '../lib/cn';
import { api } from '../lib/api';
import { consumeHandoff } from '../lib/handoff';
import { getSimulatedRegion } from '../lib/regions';
import { addSessionResult } from '../lib/sessionStore';

export default function CurrencyChecker() {
  const [tab, setTab] = useState('upload');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [result, setResult] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const ranHandoff = useRef(false);
  const { toast } = useToast();

  const runAnalysis = useCallback(async (file, source) => {
    setPreviewUrl(URL.createObjectURL(file));
    setPhase('loading');
    try {
      const loc = getSimulatedRegion();
      const data = await api.analyzeCurrency(file, { source, ...loc });
      setResult(data);
      setPhase('tracing');
      addSessionResult({ type: 'counterfeit_currency', score: data.score, verdict: data.verdict, caseId: data.case?.id });
    } catch (err) {
      toast(err.message || 'Analysis failed', 'error');
      setPhase('idle');
    }
  }, [toast]);

  useEffect(() => {
    if (ranHandoff.current) return;
    ranHandoff.current = true;
    const handoff = consumeHandoff();
    if (handoff?.target === 'currency' && handoff.file) {
      runAnalysis(handoff.file, handoff.source || 'upload');
    }
  }, [runAnalysis]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      toast('Could not access camera. Check browser permissions.', 'error');
    }
  };

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      stopCamera();
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
      runAnalysis(file, 'webcam');
    }, 'image/jpeg', 0.92);
  };

  const reset = () => {
    setPhase('idle');
    setResult(null);
    setPreviewUrl(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-2 mb-2 text-trust-blue">
        <Banknote className="w-5 h-5" />
        <span className="text-sm font-medium uppercase tracking-wide">Counterfeit Currency Detector</span>
      </div>
      <h1 className="font-heading text-3xl font-bold text-slate-900 mb-6">Currency Checker</h1>

      {phase === 'idle' && (
        <Card className="mb-6">
          <Tabs.Root value={tab} onValueChange={(v) => { setTab(v); if (v !== 'webcam') stopCamera(); }}>
            <Tabs.List className="flex gap-2 mb-5 border-b border-slate-200">
              <Tabs.Trigger value="upload" className={cn('px-4 py-2 text-sm font-medium border-b-2 -mb-px', tab === 'upload' ? 'border-trust-blue text-trust-blue' : 'border-transparent text-slate-500')}>
                <Upload className="w-4 h-4 inline mr-1.5" /> Upload Photo
              </Tabs.Trigger>
              <Tabs.Trigger value="webcam" className={cn('px-4 py-2 text-sm font-medium border-b-2 -mb-px', tab === 'webcam' ? 'border-trust-blue text-trust-blue' : 'border-transparent text-slate-500')}>
                <Camera className="w-4 h-4 inline mr-1.5" /> Live Camera Capture
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="upload">
              <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-300 rounded-xl py-12 cursor-pointer hover:border-trust-blue/50 transition-colors">
                <Upload className="w-8 h-8 text-slate-400" />
                <span className="text-sm text-slate-500">Click to upload a currency note photo (JPG/PNG)</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) runAnalysis(file, 'upload');
                    e.target.value = '';
                  }}
                />
              </label>
            </Tabs.Content>

            <Tabs.Content value="webcam">
              <div className="flex flex-col items-center gap-4">
                <div className="w-full max-w-md aspect-video bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
                  {cameraActive ? (
                    <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                  ) : (
                    <Video className="w-10 h-10 text-slate-600" />
                  )}
                </div>
                {cameraActive ? (
                  <Button onClick={capturePhoto} variant="accent">
                    <Camera className="w-4 h-4" /> Capture Photo
                  </Button>
                ) : (
                  <Button onClick={startCamera}>
                    <Camera className="w-4 h-4" /> Start Camera
                  </Button>
                )}
              </div>
            </Tabs.Content>
          </Tabs.Root>
        </Card>
      )}

      {phase === 'loading' && (
        <Card className="mb-6 text-center py-10 text-slate-500">
          {previewUrl && <img src={previewUrl} alt="preview" className="max-h-48 mx-auto mb-4 rounded-lg object-contain" />}
          Analyzing image features...
        </Card>
      )}

      {(phase === 'tracing' || phase === 'done') && result && (
        <div className="space-y-6">
          {previewUrl && (
            <Card className="bg-slate-50 flex justify-center">
              <img src={previewUrl} alt="analyzed note" className="max-h-56 rounded-lg object-contain" />
            </Card>
          )}

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
                <RiskGauge score={result.score} label="Currency Risk" />
              </Card>

              <Card>
                <div className="text-sm font-semibold text-slate-800 mb-3">Feature breakdown</div>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <FeatureRow label="Image dimensions" value={`${result.features.width} × ${result.features.height}px`} />
                  <FeatureRow label="Aspect ratio" value={result.features.aspectRatio} />
                  <FeatureRow label="Max hue concentration" value={`${(result.features.maxHueBucketShare * 100).toFixed(0)}%`} />
                  <FeatureRow label="Edge sharpness variance" value={result.features.edgeSharpnessVariance} />
                </div>
              </Card>

              <ExplainabilityPanel trace={result.trace} />

              <SimilarCasesList cases={result.similarCases} />

              <div className="flex justify-center">
                <Button variant="outline" onClick={reset}>
                  <RotateCcw className="w-4 h-4" /> Check another note
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

function FeatureRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-mono font-medium text-slate-800">{value}</span>
    </div>
  );
}
