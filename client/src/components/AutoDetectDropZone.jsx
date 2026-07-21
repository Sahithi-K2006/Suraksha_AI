import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, ImagePlus, Loader2, Sparkles } from 'lucide-react';
import { cn } from '../lib/cn';
import { setHandoff } from '../lib/handoff';
import { decodeQrFromFile } from '../lib/qrDecode';

const LINK_PATTERN = /^(https?:\/\/|upi:\/\/)/i;

export default function AutoDetectDropZone() {
  const [dragOver, setDragOver] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFile = useCallback(async (file) => {
    if (!file.type.startsWith('image/')) {
      setError('Only image files are supported for drag-and-drop detection.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const decoded = await decodeQrFromFile(file);
      if (decoded) {
        setHandoff({ target: 'qr', kind: 'qr-image', content: decoded });
        navigate('/qr-checker');
      } else {
        setHandoff({ target: 'currency', kind: 'file', file, source: 'upload' });
        navigate('/currency-checker');
      }
    } catch (err) {
      console.error(err);
      setError('Could not read that image. Try a different file.');
    } finally {
      setBusy(false);
    }
  }, [navigate]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            handleFile(file);
            return;
          }
        }
      }
    }
  }, [handleFile]);

  const handleAnalyzeText = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (LINK_PATTERN.test(trimmed)) {
      setHandoff({ target: 'qr', kind: 'pasted-link', content: trimmed });
      navigate('/qr-checker');
    } else {
      setHandoff({ target: 'message', kind: 'pasted-text', content: trimmed });
      navigate('/message-checker');
    }
  }, [text, navigate]);

  return (
    <div className="max-w-3xl mx-auto">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onPaste={handlePaste}
        className={cn(
          'rounded-2xl border-2 border-dashed p-8 transition-colors bg-white',
          dragOver ? 'border-trust-blue bg-blue-50/60' : 'border-slate-300',
        )}
      >
        <div className="flex flex-col items-center text-center mb-5">
          {busy ? (
            <Loader2 className="w-8 h-8 text-trust-blue animate-spin mb-3" />
          ) : (
            <UploadCloud className="w-8 h-8 text-trust-blue mb-3" />
          )}
          <div className="font-heading font-semibold text-slate-900 mb-1">
            {busy ? 'Detecting what this is...' : 'Universal Auto-Detect Drop Zone'}
          </div>
          <p className="text-sm text-slate-500 max-w-md">
            Drop or paste a currency photo, a QR code image, or paste a message / payment link.
            We'll auto-detect the type and route it to the right checker.
          </p>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={handlePaste}
          placeholder="Paste a suspicious message, UPI link, or website URL here..."
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-trust-blue/40 focus:border-trust-blue resize-none mb-3"
        />

        {error && <div className="text-sm text-risk-red mb-3">{error}</div>}

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleAnalyzeText}
            disabled={!text.trim() || busy}
            className="inline-flex items-center gap-2 bg-trust-blue text-white px-5 py-2.5 rounded-lg font-medium hover:bg-trust-blue-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            Auto-Detect &amp; Analyze
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-2 border border-slate-300 text-slate-700 px-5 py-2.5 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            <ImagePlus className="w-4 h-4" />
            Upload Image
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = '';
            }}
          />
        </div>
      </div>
    </div>
  );
}
