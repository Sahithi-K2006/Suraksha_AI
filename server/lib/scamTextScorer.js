// Explainable rules-based scam text scorer.
// Each rule contributes a weight to a 0-100 risk score and produces a
// human-readable reasoning-trace step so the whole decision is auditable.
//
// Multilingual coverage: alongside English patterns, each rule also carries
// best-effort Hindi/Telugu/Tamil keyword patterns (native script + common
// transliteration) so the heuristic engine can flag common scam phrasing in
// these languages without needing any translation API. This is intentionally
// a curated keyword list, not exhaustive grammar-aware NLP - see README for
// how this combines with the optional LLM cross-check.

const RULES = [
  {
    id: 'urgency',
    label: 'Checking urgency language',
    weight: 18,
    patterns: [
      /\burgent\b/i, /\bimmediately\b/i, /\btoday\b/i, /\bwithin \d+ (hour|hours|minute|minutes)\b/i, /\bexpires?\b/i, /\bright now\b/i, /\blast chance\b/i,
      /तुरंत/, /जल्दी/, /अभी/, /आज ही/, /turant/i, /jaldi/i,
      /వెంటనే/, /తక్షణమే/, /ఈరోజే/,
      /உடனடியாக/, /இப்போதே/, /இன்றே/,
    ],
  },
  {
    id: 'threat',
    label: 'Checking threat / suspension language',
    weight: 20,
    patterns: [
      /\bblock(ed)?\b/i, /\bsuspend(ed)?\b/i, /\bdeactivat(ed|e)\b/i, /\bdisconnect(ed|ion)?\b/i, /\bfrozen\b/i, /\blegal action\b/i,
      /ब्लॉक/, /बंद हो जाएगा/, /निलंबित/,
      /బ్లాక్/, /నిలిపివేయ/, /మూసివేయ/,
      /பிளாக்/, /நிறுத்தப்படும்/, /முடக்கப்படும்/,
    ],
  },
  {
    id: 'otp_pii',
    label: 'Checking requests for OTP / PII',
    weight: 25,
    patterns: [
      /\botp\b/i, /\baadhaar\b/i, /\bpan card\b/i, /\bcvv\b/i, /\bpin\b/i, /\bpassword\b/i, /\bshare.*(otp|pin|password)/i,
      /ओटीपी/, /आधार/, /पिन/, /पासवर्ड/, /साझा करें/,
      /ఓటీపీ/, /ఆధార్/, /పిన్/, /పాస్‌వర్డ్/, /షేర్ చేయండి/,
      /ஓடிபி/, /ஆதார்/, /பின்/, /கடவுச்சொல்/, /பகிரவும்/,
    ],
  },
  {
    id: 'prize',
    label: 'Checking lottery / prize bait',
    weight: 20,
    patterns: [
      /\bwon\b/i, /\blottery\b/i, /\bprize\b/i, /\bkbc\b/i, /\bjackpot\b/i, /\bcongratulations\b/i, /\blucky draw\b/i,
      /जीत/, /लॉटरी/, /इनाम/, /बधाई/,
      /గెలిచారు/, /లాటరీ/, /బహుమతి/, /అభినందనలు/,
      /வென்றீர்கள்/, /லாட்டரி/, /பரிசு/, /வாழ்த்துக்கள்/,
    ],
  },
  {
    id: 'fee',
    label: 'Checking upfront fee / payment requests',
    weight: 15,
    patterns: [
      /\bprocessing fee\b/i, /\bregistration fee\b/i, /\bpay (rs\.?|inr|₹)\s?\d+/i, /\bsend money\b/i, /\bclaim.*fee\b/i,
      /शुल्क/, /भुगतान करें/, /पंजीकरण शुल्क/,
      /రుసుము/, /చెల్లించండి/, /నమోదు రుసుము/,
      /கட்டணம்/, /செலுத்தவும்/, /பதிவு கட்டணம்/,
    ],
  },
  {
    id: 'link',
    label: 'Checking suspicious links',
    weight: 15,
    patterns: [
      /\bbit\.ly\b/i, /\btinyurl\b/i, /\b\.tk\b/i, /\b\.xyz\b/i, /http:\/\//i, /\bclick here\b/i, /\bverify.*link\b/i,
      /लिंक/, /क्लिक करें/,
      /లింక్/, /క్లిక్ చేయండి/,
      /லிங்க்/, /கிளிக் செய்யவும்/,
    ],
  },
  {
    id: 'impersonation',
    label: 'Checking sender / brand impersonation',
    weight: 12,
    patterns: [
      /\bkyc\b/i, /\bbank\b/i, /\brbi\b/i, /\bincome tax\b/i, /\bcourier\b/i, /\bcustoms\b/i, /\bsim card\b/i,
      /बैंक/, /केवाईसी/, /आयकर/, /सरकार/,
      /బ్యాంక్/, /కేవైసీ/, /ఆదాయపు పన్ను/, /ప్రభుత్వం/,
      /வங்கி/, /கேஒய்சி/, /வருமான வரி/, /அரசு/,
    ],
  },
  {
    id: 'income',
    label: 'Checking unrealistic income promises',
    weight: 18,
    patterns: [
      /\bearn (rs\.?|inr|₹)?\s?\d+.*(day|hour)\b/i, /\bwork from home\b.*\bearn\b/i, /\bdouble your money\b/i, /\bguaranteed returns?\b/i,
      /कमाएं/, /घर बैठे/, /गारंटीड/,
      /సంపాదించండి/, /ఇంటి నుండి పని/, /గ్యారంటీడ్/,
      /சம்பாதிக்கவும்/, /வீட்டிலிருந்து வேலை/, /உத்தரவாதம்/,
    ],
  },
];

// Rough script-based language detection, used only for display ("detected
// language: Hindi") - the rules above match regardless of this result.
function detectScriptLanguage(text) {
  if (/[ऀ-ॿ]/.test(text)) return 'hi'; // Devanagari
  if (/[ఀ-౿]/.test(text)) return 'te'; // Telugu
  if (/[஀-௿]/.test(text)) return 'ta'; // Tamil
  return 'en';
}

function analyze(text) {
  const trace = [];
  const flags = [];
  let score = 0;
  const clean = (text || '').trim();
  const detectedLanguage = detectScriptLanguage(clean);

  for (const rule of RULES) {
    let matched = false;
    let matchedText = null;
    for (const pattern of rule.patterns) {
      const m = clean.match(pattern);
      if (m) {
        matched = true;
        matchedText = m[0];
        break;
      }
    }
    if (matched) {
      score += rule.weight;
      trace.push({ step: rule.label, result: `found ("${matchedText}")`, hit: true });
      flags.push(matchedText);
    } else {
      trace.push({ step: rule.label, result: 'clean', hit: false });
    }
  }

  if (clean.length < 15) {
    trace.push({ step: 'Checking message length', result: 'too short for full analysis', hit: false });
  }

  score = Math.min(100, score);

  let verdict = 'safe';
  if (score >= 70) verdict = 'high_risk';
  else if (score >= 35) verdict = 'suspicious';

  const explanation = trace
    .filter((t) => t.hit)
    .map((t) => `${t.step.replace('Checking ', '')}: ${t.result}`);
  if (explanation.length === 0) {
    explanation.push('No red-flag phrases found; message reads as routine communication');
  }

  return {
    verdict,
    score,
    trace,
    redFlags: [...new Set(flags)],
    explanation,
    inputSummary: clean.slice(0, 200),
    detectedLanguage,
  };
}

export default { analyze, detectScriptLanguage };
