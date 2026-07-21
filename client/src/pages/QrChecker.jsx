import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tabs from '@radix-ui/react-tabs';
import { QrCode, Camera, Upload, Link2, ExternalLink, RotateCcw, VideoOff, Loader2, ScanLine } from 'lucide-react';
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
  const [cameraStarting, setCameraStarting] = useState(false);
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
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    setCameraStarting(false);
    setScanning(false);
  }, []);

  // Reusable canvas avoids allocating a new one on every animation frame.
  const scanCanvasRef = useRef(null);

  const scanLoop = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA || !video.videoWidth) {
      rafRef.current = requestAnimationFrame(scanLoop);
      return;
    }
    if (!scanCanvasRef.current) scanCanvasRef.current = document.createElement('canvas');
    const canvas = scanCanvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const decoded = decodeQrFromImageData(imageData);
    if (decoded) {
      stopCamera();
      runAnalysis(decoded);
      return;
    }
    rafRef.current = requestAnimationFrame(scanLoop);
  }, [runAnalysis, stopCamera]);

  // Video element is always mounted (see JSX below) so the ref is guaranteed
  // valid the instant getUserMedia resolves - previously the <video> only
  // mounted after cameraActive flipped true, so the stream was never
  // attached and the scan loop read from an empty element forever.
  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast('Camera access is not supported in this browser.', 'error');
      return;
    }
    setCameraStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
      setCameraActive(true);
      setScanning(true);
      rafRef.current = requestAnimationFrame(scanLoop);
    } catch (err) {
      const message = err?.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access and try again.'
        : err?.name === 'NotFoundError'
          ? 'No camera was found on this device.'
          : 'Could not access camera. Check browser permissions.';
      toast(message, 'error');
    } finally {
      setCameraStarting(false);
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
              <Tabs.Trigger value="camera" className={cn('px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors', tab === 'camera' ? 'border-trust-blue text-trust-blue' : 'border-transparent text-slate-500 hover:text-slate-700')}>
                <Camera className="w-4 h-4 inline mr-1.5" /> Live Scan
              </Tabs.Trigger>
              <Tabs.Trigger value="upload" className={cn('px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors', tab === 'upload' ? 'border-trust-blue text-trust-blue' : 'border-transparent text-slate-500 hover:text-slate-700')}>
                <Upload className="w-4 h-4 inline mr-1.5" /> Upload QR Image
              </Tabs.Trigger>
              <Tabs.Trigger value="paste" className={cn('px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors', tab === 'paste' ? 'border-trust-blue text-trust-blue' : 'border-transparent text-slate-500 hover:text-slate-700')}>
                <Link2 className="w-4 h-4 inline mr-1.5" /> Paste Link
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="camera">
              <div className="flex flex-col items-center gap-4">
                <div className={cn(
                  'relative w-full max-w-md aspect-video bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center transition-shadow',
                  cameraActive && 'ring-2 ring-safety-orange/60 shadow-lg shadow-safety-orange/20',
                )}>
                  {/* Video stays mounted at all times so the ref is valid the instant the stream resolves */}
                  <video
                    ref={videoRef}
                    className={cn('w-full h-full object-cover', !cameraActive && 'hidden')}
                    muted
                    playsInline
                    autoPlay
                  />

                  {!cameraActive && (
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      {cameraStarting ? (
                        <Loader2 className="w-9 h-9 animate-spin text-trust-blue-light" />
                      ) : (
                        <VideoOff className="w-9 h-9 text-slate-600" />
                      )}
                      <span className="text-xs">{cameraStarting ? 'Requesting camera access...' : 'Camera preview'}</span>
                    </div>
                  )}

                  {cameraActive && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-safety-orange animate-pulse" />
                      Scanning
                    </div>
                  )}

                  {scanning && (
                    <div className="absolute inset-8 pointer-events-none">
                      <div className="relative w-full h-full rounded-lg overflow-hidden">
                        {/* Corner brackets */}
                        <div className="absolute top-0 left-0 w-7 h-7 border-t-2 border-l-2 border-safety-orange rounded-tl-lg" />
                        <div className="absolute top-0 right-0 w-7 h-7 border-t-2 border-r-2 border-safety-orange rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-7 h-7 border-b-2 border-l-2 border-safety-orange rounded-bl-lg" />
                        <div className="absolute bottom-0 right-0 w-7 h-7 border-b-2 border-r-2 border-safety-orange rounded-br-lg" />
                        {/* Sweeping scan line */}
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-safety-orange/80 shadow-[0_0_8px_2px_rgba(249,115,22,0.6)] animate-scan-sweep" />
                      </div>
                    </div>
                  )}
                </div>

                {cameraActive ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                      <ScanLine className="w-4 h-4 text-safety-orange" />
                      Point the camera at a QR code - scanning automatically...
                    </div>
                    <Button variant="outline" onClick={stopCamera}>
                      <VideoOff className="w-4 h-4" /> Stop Camera
                    </Button>
                  </div>
                ) : (
                  <Button onClick={startCamera} disabled={cameraStarting}>
                    {cameraStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    {cameraStarting ? 'Starting camera...' : 'Start Camera'}
                  </Button>
                )}
              </div>
            </Tabs.Content>

            <Tabs.Content value="upload">
              <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-300 rounded-xl py-12 cursor-pointer hover:border-trust-blue/50 hover:bg-trust-blue/[0.02] transition-colors">
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

      <AnimatePresence>
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
      </AnimatePresence>
    </div>
  );
}
