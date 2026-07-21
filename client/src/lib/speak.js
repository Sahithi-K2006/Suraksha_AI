import { getLanguage } from './i18n';

function pickVoice(speechLang) {
  const voices = window.speechSynthesis?.getVoices() || [];
  const exact = voices.find((v) => v.lang === speechLang);
  if (exact) return exact;
  const prefix = speechLang.split('-')[0];
  return voices.find((v) => v.lang?.startsWith(prefix)) || null;
}

export function speak(text, lang = 'en') {
  if (!window.speechSynthesis || !text) return false;
  window.speechSynthesis.cancel();

  const speechLang = getLanguage(lang).speechLang;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = speechLang;
  const voice = pickVoice(speechLang);
  if (voice) utterance.voice = voice;
  utterance.rate = 0.95;

  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking() {
  window.speechSynthesis?.cancel();
}

export function isSpeechSynthesisSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}
