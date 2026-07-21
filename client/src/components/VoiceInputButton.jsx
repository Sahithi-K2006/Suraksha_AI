import { useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '../lib/cn';
import { getLanguage } from '../lib/i18n';
import { useToast } from './ui/Toast';

// Reusable mic-to-text button built on the browser's free Web Speech API.
// Works fully offline of any server/LLM key - transcription quality and
// language coverage depend on the browser/OS speech engine (best in Chrome).
export default function VoiceInputButton({ lang = 'en', onResult, className, interim = false }) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const { toast } = useToast();

  const toggle = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast('Voice input is not supported in this browser. Try Chrome.', 'error');
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = getLanguage(lang).speechLang;
    recognition.interimResults = interim;
    recognition.continuous = false;
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(' ');
      onResult?.(transcript, e.results[e.results.length - 1].isFinal);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = (e) => {
      setListening(false);
      if (e.error !== 'aborted' && e.error !== 'no-speech') {
        toast('Could not hear you clearly. Please try again.', 'error');
      }
    };
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={listening ? 'Stop listening' : 'Speak'}
      className={cn(
        'p-2.5 rounded-lg border transition-colors',
        listening ? 'bg-risk-red text-white border-risk-red animate-pulse' : 'border-slate-300 text-slate-500 hover:bg-slate-50',
        className,
      )}
    >
      {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </button>
  );
}
