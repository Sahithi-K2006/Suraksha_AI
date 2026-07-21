import { useEffect, useState } from 'react';
import { Languages } from 'lucide-react';
import { LANGUAGES } from '../lib/i18n';
import { getStoredLanguage, setStoredLanguage } from '../lib/languageStore';

export default function LanguageSelector({ compact = false }) {
  const [lang, setLang] = useState(getStoredLanguage());

  useEffect(() => {
    setStoredLanguage(lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const code = e.target.value;
    setLang(code);
    setStoredLanguage(code);
  };

  return (
    <div className={`flex items-center gap-1.5 ${compact ? '' : 'bg-white border border-slate-200 rounded-lg px-2 py-1.5'}`}>
      <Languages className="w-4 h-4 text-slate-500 shrink-0" />
      <select
        value={lang}
        onChange={handleChange}
        aria-label="Select language"
        className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
}
