import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from './ui/Button';
import { speak, stopSpeaking, isSpeechSynthesisSupported } from '../lib/speak';
import { t } from '../lib/i18n';

export default function ReadAloudButton({ text, lang = 'en', className }) {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!isSpeechSynthesisSupported()) return undefined;
    const onEnd = () => setSpeaking(false);
    window.speechSynthesis.addEventListener('end', onEnd);
    return () => {
      window.speechSynthesis.removeEventListener('end', onEnd);
      stopSpeaking();
    };
  }, []);

  if (!isSpeechSynthesisSupported()) return null;

  const toggle = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    const ok = speak(text, lang);
    setSpeaking(ok);
  };

  return (
    <Button variant="outline" size="sm" onClick={toggle} className={className}>
      {speaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
      {speaking ? t(lang, 'stopReading') : t(lang, 'readAloud')}
    </Button>
  );
}
