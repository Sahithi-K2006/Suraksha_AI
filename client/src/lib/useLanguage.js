import { useEffect, useState } from 'react';
import { getStoredLanguage, onLanguageChange } from './languageStore';

export function useLanguage() {
  const [lang, setLang] = useState(getStoredLanguage());

  useEffect(() => {
    return onLanguageChange((code) => setLang(code));
  }, []);

  return lang;
}
