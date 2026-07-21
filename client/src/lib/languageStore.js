const LANG_KEY = 'suraksha_language';
const EVENT = 'suraksha:language-changed';

export function getStoredLanguage() {
  return localStorage.getItem(LANG_KEY) || 'en';
}

export function setStoredLanguage(code) {
  localStorage.setItem(LANG_KEY, code);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: code }));
}

export function onLanguageChange(handler) {
  const listener = (e) => handler(e.detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}

export const LANGUAGE_EVENT = EVENT;
