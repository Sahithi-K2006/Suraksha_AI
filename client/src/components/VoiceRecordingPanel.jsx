import { useCallback, useRef, useState } from 'react';
import { Mic, Square, UploadCloud, Loader2, FileAudio } from 'lucide-react';
import { Button } from './ui/Button';
import { useToast } from './ui/Toast';
import { api } from '../lib/api';
import { getLanguage, t } from '../lib/i18n';

// Lets a citizen either (a) speak live and watch it turn into text in real
// time via the free, offline Web Speech API, or (b) drop/upload an existing
// voice recording (e.g. a saved scam call) for server-side transcription via
// OpenAI Whisper - which only runs if OPENAI_API_KEY is configured. Either
// path hands the resulting transcript to onTranscript() for scam analysis.
export default function VoiceRecordingPanel({ lang = 'en', onTranscript }) {
  const [listening, setListening] = useState(false);
  const [liveText, setLiveText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const startLive = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast('Live voice recognition is not supported in this browser. Try Chrome, or upload a recording instead.', 'error');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = getLanguage(lang).speechLang;
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = '';
    recognition.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const chunk = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTranscript += `${chunk} `;
        else interim += chunk;
      }
      setLiveText((finalTranscript + interim).trim());
    };
    recognition.onerror = (e) => {
      if (e.error !== 'aborted' && e.error !== 'no-speech') {
        toast('Had trouble hearing you. Please try again.', 'error');
      }
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setLiveText('');
  }, [lang, toast]);

  const stopLive = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const analyzeLive = () => {
    if (liveText.trim()) onTranscript?.(liveText.trim());
  };

  const handleFile = useCallback(async (file) => {
    if (!file.type.startsWith('audio/')) {
      toast('Please drop or select an audio file (mp3, wav, m4a, webm...).', 'error');
      return;
    }
    setUploading(true);
    try {
      const { text } = await api.transcribeAudio(file, file.name);
      if (!text?.trim()) {
        toast('Could not detect any speech in that recording.', 'error');
        return;
      }
      onTranscript?.(text.trim());
    } catch (err) {
      toast(err.message || 'Transcription is unavailable right now. Try live recording instead.', 'error');
    } finally {
      setUploading(false);
    }
  }, [onTranscript, toast]);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 p-6 flex flex-col items-center text-center gap-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${listening ? 'bg-risk-red/10 text-risk-red animate-pulse' : 'bg-trust-blue/10 text-trust-blue'}`}>
          <Mic className="w-7 h-7" />
        </div>
        <div className="text-sm text-slate-500">{listening ? t(lang, 'speakNow') : t(lang, 'tapToSpeak')}</div>
        {liveText && (
          <div className="w-full rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-700 text-left">
            {liveText}
          </div>
        )}
        <div className="flex gap-3">
          {!listening ? (
            <Button onClick={startLive}><Mic className="w-4 h-4" /> {t(lang, 'recordVoice')}</Button>
          ) : (
            <Button variant="danger" onClick={stopLive}><Square className="w-4 h-4" /> {t(lang, 'stopListening')}</Button>
          )}
          {!listening && liveText && (
            <Button variant="accent" onClick={analyzeLive}>{t(lang, 'analyzing').replace('...', '')} &rarr;</Button>
          )}
        </div>
      </div>

      <div className="relative">
        <div className="text-center text-xs text-slate-400 mb-3">— or —</div>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`rounded-xl border-2 border-dashed p-6 flex flex-col items-center gap-2 cursor-pointer transition-colors ${dragOver ? 'border-trust-blue bg-blue-50/60' : 'border-slate-300 hover:border-trust-blue/50'}`}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-trust-blue animate-spin" />
          ) : (
            <UploadCloud className="w-6 h-6 text-slate-400" />
          )}
          <div className="text-sm text-slate-500 flex items-center gap-1.5">
            <FileAudio className="w-4 h-4" />
            {uploading ? t(lang, 'transcribing') : `${t(lang, 'uploadRecording')} (mp3, wav, m4a...)`}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
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
