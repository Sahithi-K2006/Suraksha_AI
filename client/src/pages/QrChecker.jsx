import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as Tabs from '@radix-ui/react-tabs';
import { QrCode, Camera, Upload, Link2, ExternalLink, RotateCcw, Video } from 'lucide-react';
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
import { decodeQrFromFile, decodeQrFromImageData } from '../lib/qrDecode';

export default function QrChecker() {
  const [tab, setTab] = useState('camera');
  const [linkText, setLinkText] = useState('');
  const [phase, setPhase] = useState('idle');
  const [result, setResult] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const ranHandoff = useRef(false);
  const { toast } = useToast();

  const runAnalysis = useCallback(async (content) => {
    setPhase('loading');
    try {
      const loc = getSimulatedRegion();
      const data = await api.analyzeQr({ content, ...loc });
      setResult(data);
      setPhase('tracing');
      addSessionResult({ type: 'qr_link', score: data.score, verdict: data.verdict, caseId: data.case?.id });
    } catch (err) {
      toast(err.message || 'Analysis failed', 'error');
      setPhase('idle');
    }
  }, [toast]);

  useEffect(() => {
    if (ranHandoff.current) return;
    ranHandoff.current = true;
    const handoff = consumeHandoff();
    if (handoff?.target === 'qr' && handoff.content) {
      runAnalysis(handoff.content);
    }
  }, [runAnalysis]);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
    setScanning(false);
  }, []);

  const scanLoop = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanLoop);
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const decoded = decodeQrFromImageData(imageData);
    if (decoded) {
      stopCamera();
      runAnalysis(decoded);
      return;
    }
    rafRef.current = requestAnimationFrame(scanLoop);
  }, [runAnalysis, stopCamera]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setScanning(true);
      rafRef.current = requestAnimationFrame(scanLoop);
    } catch {
      toast('Could not access camera. Check browser permissions.', 'error');
    }
  };

  useEffect(() => () => stopCamera(), [stopCamera]);

  const reset = () => {
    setPhase('idle');
    setResult(null);
    setLinkText('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-2 mb-2 text-trust-blue">
        <QrCode className="w-5 h-5" />
        <span className="text-sm font-medium uppercase tracking-wide">QR &amp; Payment Link Detector</span>
      </div>
      <h1 className="font-heading text-3xl font-bold text-slate-900 mb-6">QR / Link Checker</h1>

      {phase === 'idle' && (
        <Card className="mb-6">
          <Tabs.Root value={tab} onValueChange={(v) => { setTab(v); if (v !== 'camera') stopCamera(); }}>
            <Tabs.List className="flex gap-2 mb-5 border-b border-slate-200 flex-wrap">
              <Tabs.Trigger value="camera" className={cn('px-4 py-2 text-sm font-medium border-b-2 -mb-px', tab === 'camera' ? 'border-trust-blue text-trust-blue' : 'border-transparent text-slate-500')}>
                <Camera className="w-4 h-4 inline mr-1.5" /> Live Scan
              </Tabs.Trigger>
              <Tabs.Trigger value="upload" className={cn('px-4 py-2 text-sm font-medium border-b-2 -mb-px', tab === 'upload' ? 'border-trust-blue text-trust-blue' : 'border-transparent text-slate-500')}>
                <Upload className="w-4 h-4 inline mr-1.5" /> Upload QR Image
              </Tabs.Trigger>
              <Tabs.Trigger value="paste" className={cn('px-4 py-2 text-sm font-medium border-b-2 -mb-px', tab === 'paste' ? 'border-trust-blue text-trust-blue' : 'border-transparent text-slate-500')}>
                <Link2 className="w-4 h-4 inline mr-1.5" /> Paste Link
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="camera">
              <div className="flex flex-col items-center gap-4">
                <div className="w-full max-w-md aspect-video bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center relative">
                  {cameraActive ? (
                    <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                  ) : (
                    <Video className="w-10 h-10 text-slate-600" />
                  )}
                  {scanning && (
                    <div className="absolute inset-8 border-2 border-safety-orange rounded-lg animate-pulse pointer-events-none" />
                  )}
                </div>
                {cameraActive ? (
                  <div className="text-sm text-slate-500">Point the camera at a QR code - scanning automatically...</div>
                ) : (
                  <Button onClick={startCamera}>
                    <Camera className="w-4 h-4" /> Start Camera
                  </Button>
                )}
              </div>
            </Tabs.Content>

            <Tabs.Content value="upload">
              <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-300 rounded-xl py-12 cursor-pointer hover:border-trust-blue/50 transition-colors">
                <Upload className="w-8 h-8 text-slate-400" />
                <span className="text-sm text-slate-500">Click to upload an image containing a QR code</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file) return;
                    const decoded = await decodeQrFromFile(file);
                    if (decoded) runAnalysis(decoded);
                    else toast('No QR code detected in that image.', 'error');
                  }}
                />
              </label>
            </Tabs.Content>

            <Tabs.Content value="paste">
              <div className="space-y-3">
                <input
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Paste a UPI link (upi://...) or website URL (https://...)"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-trust-blue/40 focus:border-trust-blue"
                />
                <Button onClick={() => runAnalysis(linkText)} disabled={!linkText.trim()}>Analyze Link</Button>
              </div>
            </Tabs.Content>
          </Tabs.Root>
        </Card>
      )}

      {phase === 'loading' && (
        <Card className="mb-6 text-center py-10 text-slate-500">Analyzing decoded content...</Card>
      )}

      {(phase === 'tracing' || phase === 'done') && result && (
        <div className="space-y-6">
          <Card className="bg-slate-50">
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Decoded content</div>
            <p className="text-sm text-slate-700 font-mono break-all">{result.decoded}</p>
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
                <RiskGauge score={result.score} label="Link Risk" />
              </Card>

              <ExplainabilityPanel trace={result.trace} />

              <SimilarCasesList cases={result.similarCases} />

              <div className="flex justify-center">
                <Button variant="outline" onClick={reset}>
                  <RotateCcw className="w-4 h-4" /> Check another QR/link
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
