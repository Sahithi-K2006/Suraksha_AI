// Citizen AI Assistant: uses a real LLM if an API key is present in the
// environment, otherwise falls back to a scripted decision tree. Must never
// throw due to a missing/invalid key - always degrade gracefully.
// Language-aware: replies in the citizen's selected language (English,
// Hindi, Telugu, or Tamil) whether that's via the real LLM (which can
// natively read/write all four) or the scripted fallback (translated
// canned responses below).

import scamTextScorer from './scamTextScorer.js';

const LANGUAGE_NAMES = { en: 'English', hi: 'Hindi', te: 'Telugu', ta: 'Tamil' };

function systemPrompt(lang) {
  const languageName = LANGUAGE_NAMES[lang] || 'English';
  return `You are SuRakshaAI's Citizen Assistant, a friendly fraud-safety helper for Indian citizens.
You help people understand whether a message, currency note, or QR/payment link might be fraudulent, explain red flags in plain language, and give clear next-step guidance (e.g. don't share OTP, block sender, report on cybercrime.gov.in or call 1930).
Keep answers short (3-6 sentences), warm, and non-alarmist. Never claim to be a licensed legal or financial advisor.
IMPORTANT: Always reply in ${languageName}, regardless of what language the user's message is in, unless they explicitly ask you to switch languages.`;
}

async function callAnthropic(apiKey, history, userMessage, lang) {
  const messages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 400,
      system: systemPrompt(lang),
      messages,
    }),
  });

  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text || null;
}

async function callOpenAI(apiKey, history, userMessage, lang) {
  const messages = [
    { role: 'system', content: systemPrompt(lang) },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 400,
      messages,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || null;
}

const FALLBACK = {
  en: {
    qr: "I can help with QR/payment links! Paste the link or scan the QR in the QR Checker page — I'll check the payee handle, domain reputation, and amount pattern. Golden rule: never scan a QR to *receive* money — QR codes are for paying, not collecting.",
    currency: "For currency concerns, head to the Currency Checker to upload a photo or use your webcam. I'll analyze aspect ratio, color pattern, and print sharpness. In the meantime: check the security thread, watermark, and color-shifting ink on the note against an RBI reference image.",
    otp: "Please never share your OTP, PIN, CVV, or password with anyone — no bank, company, or government office will ever ask for these over call/SMS/chat. If you already shared one, contact your bank immediately and call the National Cyber Crime Helpline at 1930.",
    report: "You can generate a mock complaint draft from any flagged case's detail page using \"Generate Cybercrime Complaint.\" For real incidents with financial loss, report at cybercrime.gov.in or call the 1930 helpline as soon as possible — faster reporting improves the chance of recovering funds.",
    scamPrefix: (verdict, score) => `Based on a quick scan, this reads as **${verdict}** (risk ${score}/100).`,
    scamFlags: (flags) => ` I noticed patterns like: ${flags}.`,
    scamSuffix: ' For a full breakdown with the reasoning trace, paste this into the Message Checker. When in doubt, don\'t click links or share personal details — verify through an official channel first.',
    welcome: "I'm SuRakshaAI's assistant — I can help you check suspicious messages, currency notes, or QR/payment links, and guide you on reporting fraud. Try pasting a message, or describe what you're worried about!",
  },
  hi: {
    qr: "मैं QR/पेमेंट लिंक में मदद कर सकता हूँ! लिंक पेस्ट करें या QR चेकर पेज में स्कैन करें — मैं पेयी हैंडल, डोमेन प्रतिष्ठा और राशि की जांच करूँगा। सुनहरा नियम: पैसे *पाने* के लिए कभी QR स्कैन न करें — QR कोड भुगतान के लिए हैं, प्राप्त करने के लिए नहीं।",
    currency: "करेंसी संबंधी चिंता के लिए, करेंसी चेकर में फोटो अपलोड करें या वेबकैम का उपयोग करें। मैं आस्पेक्ट रेशियो, रंग पैटर्न और प्रिंट शार्पनेस का विश्लेषण करूँगा। इस बीच: नोट पर सिक्योरिटी थ्रेड, वॉटरमार्क और कलर-शिफ्टिंग इंक की जांच करें।",
    otp: "कृपया अपना OTP, PIN, CVV या पासवर्ड किसी के साथ साझा न करें — कोई भी बैंक, कंपनी या सरकारी कार्यालय कभी भी कॉल/SMS/चैट पर यह नहीं मांगेगा। अगर आपने पहले ही साझा कर दिया है, तो तुरंत अपने बैंक से संपर्क करें और नेशनल साइबर क्राइम हेल्पलाइन 1930 पर कॉल करें।",
    report: "आप किसी भी फ्लैग किए गए केस के डिटेल पेज से \"Generate Cybercrime Complaint\" का उपयोग करके एक मॉक शिकायत ड्राफ्ट बना सकते हैं। वास्तविक वित्तीय नुकसान के मामलों के लिए, cybercrime.gov.in पर रिपोर्ट करें या जल्द से जल्द 1930 हेल्पलाइन पर कॉल करें।",
    scamPrefix: (verdict, score) => `त्वरित जांच के आधार पर, यह **${verdict}** लगता है (जोखिम ${score}/100)।`,
    scamFlags: (flags) => ` मुझे ऐसे पैटर्न मिले: ${flags}।`,
    scamSuffix: ' पूरी जानकारी के लिए इसे मैसेज चेकर में पेस्ट करें। संदेह होने पर, लिंक पर क्लिक न करें या व्यक्तिगत जानकारी साझा न करें।',
    welcome: "मैं SuRakshaAI का सहायक हूँ — मैं संदिग्ध संदेशों, करेंसी नोटों, या QR/पेमेंट लिंक की जांच में मदद कर सकता हूँ, और धोखाधड़ी की रिपोर्ट करने में मार्गदर्शन कर सकता हूँ। एक संदेश पेस्ट करके देखें!",
  },
  te: {
    qr: "నేను QR/పేమెంట్ లింక్‌లలో సహాయం చేయగలను! లింక్‌ను పేస్ట్ చేయండి లేదా QR చెకర్ పేజీలో స్కాన్ చేయండి — నేను పేయీ హ్యాండిల్, డొమైన్ ప్రతిష్ఠ మరియు మొత్తాన్ని తనిఖీ చేస్తాను. బంగారు నియమం: డబ్బు *స్వీకరించడానికి* ఎప్పుడూ QR స్కాన్ చేయవద్దు — QR కోడ్‌లు చెల్లించడానికి, స్వీకరించడానికి కాదు.",
    currency: "కరెన్సీ సంబంధిత ఆందోళనల కోసం, కరెన్సీ చెకర్‌లో ఫోటో అప్‌లోడ్ చేయండి లేదా వెబ్‌క్యామ్ ఉపయోగించండి. నేను ఆస్పెక్ట్ రేషియో, రంగు నమూనా మరియు ప్రింట్ షార్ప్‌నెస్‌ను విశ్లేషిస్తాను. అంతలో: నోటుపై సెక్యూరిటీ థ్రెడ్, వాటర్‌మార్క్ మరియు కలర్-షిఫ్టింగ్ ఇంక్‌ను తనిఖీ చేయండి.",
    otp: "దయచేసి మీ OTP, PIN, CVV లేదా పాస్‌వర్డ్‌ను ఎవరితోనూ పంచుకోవద్దు — ఏ బ్యాంక్, కంపెనీ లేదా ప్రభుత్వ కార్యాలయం కూడా వీటిని కాల్/SMS/చాట్‌లో అడగదు. మీరు ఇప్పటికే పంచుకుంటే, వెంటనే మీ బ్యాంక్‌ను సంప్రదించండి మరియు నేషనల్ సైబర్ క్రైమ్ హెల్ప్‌లైన్ 1930కి కాల్ చేయండి.",
    report: "ఏదైనా ఫ్లాగ్ చేసిన కేసు వివరాల పేజీ నుండి \"Generate Cybercrime Complaint\" ఉపయోగించి మీరు మాక్ ఫిర్యాదు డ్రాఫ్ట్‌ను రూపొందించవచ్చు. వాస్తవ ఆర్థిక నష్టం ఉన్న సందర్భాలలో, cybercrime.gov.in లో నివేదించండి లేదా వీలైనంత త్వరగా 1930 హెల్ప్‌లైన్‌కు కాల్ చేయండి.",
    scamPrefix: (verdict, score) => `త్వరిత పరిశీలన ఆధారంగా, ఇది **${verdict}** గా కనిపిస్తుంది (ప్రమాదం ${score}/100).`,
    scamFlags: (flags) => ` నేను ఇలాంటి నమూనాలను గమనించాను: ${flags}.`,
    scamSuffix: ' పూర్తి వివరాల కోసం దీన్ని మెసేజ్ చెకర్‌లో పేస్ట్ చేయండి. అనుమానం ఉంటే, లింక్‌లపై క్లిక్ చేయవద్దు లేదా వ్యక్తిగత వివరాలు పంచుకోవద్దు.',
    welcome: "నేను SuRakshaAI సహాయకుడిని — నేను అనుమానాస్పద సందేశాలు, కరెన్సీ నోట్లు లేదా QR/పేమెంట్ లింక్‌లను తనిఖీ చేయడంలో సహాయం చేయగలను, మరియు మోసాన్ని నివేదించడంలో మార్గనిర్దేశం చేయగలను. ఒక సందేశాన్ని పేస్ట్ చేసి చూడండి!",
  },
  ta: {
    qr: "நான் QR/பேமெண்ட் லிங்க்குகளில் உதவ முடியும்! லிங்கை பேஸ்ட் செய்யவும் அல்லது QR செக்கர் பக்கத்தில் ஸ்கேன் செய்யவும் — நான் பேயீ ஹேண்டில், டொமைன் நற்பெயர் மற்றும் தொகையை சரிபார்ப்பேன். பொன் விதி: பணத்தை *பெற* ஒருபோதும் QR ஸ்கேன் செய்யாதீர்கள் — QR குறியீடுகள் செலுத்துவதற்கானவை, பெறுவதற்கு அல்ல.",
    currency: "நாணய கவலைகளுக்கு, நாணய செக்கரில் புகைப்படத்தை பதிவேற்றவும் அல்லது வெப்கேமைப் பயன்படுத்தவும். நான் அளவு விகிதம், வண்ண வடிவம் மற்றும் அச்சு கூர்மையை பகுப்பாய்வு செய்வேன். அதற்குள், நோட்டில் உள்ள பாதுகாப்பு நூல், நீர்முத்திரை மற்றும் வண்ணம் மாறும் மையை சரிபார்க்கவும்.",
    otp: "தயவுசெய்து உங்கள் OTP, PIN, CVV அல்லது கடவுச்சொல்லை யாருடனும் பகிர வேண்டாம் — எந்த வங்கியோ, நிறுவனமோ, அரசு அலுவலகமோ இவற்றை அழைப்பு/SMS/அரட்டையில் ஒருபோதும் கேட்காது. ஏற்கனவே பகிர்ந்திருந்தால், உடனடியாக உங்கள் வங்கியை தொடர்பு கொண்டு தேசிய சைபர் கிரைம் ஹெல்ப்லைன் 1930ஐ அழைக்கவும்.",
    report: "எந்த கொடியிடப்பட்ட வழக்கின் விவரப் பக்கத்திலிருந்தும் \"Generate Cybercrime Complaint\" மூலம் ஒரு போலி புகார் வரைவை உருவாக்கலாம். உண்மையான நிதி இழப்பு ஏற்பட்டால், cybercrime.gov.in இல் புகாரளிக்கவும் அல்லது விரைவில் 1930 ஹெல்ப்லைனை அழைக்கவும்.",
    scamPrefix: (verdict, score) => `விரைவு பரிசோதனையின் அடிப்படையில், இது **${verdict}** ஆக தெரிகிறது (ஆபத்து ${score}/100).`,
    scamFlags: (flags) => ` இதுபோன்ற வடிவங்களை கவனித்தேன்: ${flags}.`,
    scamSuffix: ' முழு விவரங்களுக்கு இதை மெசேஜ் செக்கரில் பேஸ்ட் செய்யவும். சந்தேகம் இருந்தால், லிங்க்குகளை கிளிக் செய்யாதீர்கள் அல்லது தனிப்பட்ட விவரங்களை பகிர வேண்டாம்.',
    welcome: "நான் SuRakshaAI உதவியாளர் — சந்தேகத்திற்குரிய செய்திகள், நாணயக் குறிப்புகள் அல்லது QR/பேமெண்ட் லிங்க்குகளை சரிபார்க்க உதவ முடியும், மோசடியை புகாரளிப்பதில் வழிகாட்ட முடியும். ஒரு செய்தியை பேஸ்ட் செய்து பாருங்கள்!",
  },
};

function verdictLabelFor(lang, verdict) {
  const labels = {
    en: { safe: 'safe', suspicious: 'suspicious', high_risk: 'high risk' },
    hi: { safe: 'सुरक्षित', suspicious: 'संदिग्ध', high_risk: 'खतरनाक' },
    te: { safe: 'సురక్షితం', suspicious: 'అనుమానాస్పదం', high_risk: 'ప్రమాదకరం' },
    ta: { safe: 'பாதுகாப்பானது', suspicious: 'சந்தேகத்திற்குரியது', high_risk: 'உயர் ஆபத்து' },
  };
  return (labels[lang] || labels.en)[verdict] || verdict;
}

function scriptedFallback(userMessage, lang = 'en') {
  const strings = FALLBACK[lang] || FALLBACK.en;
  const msg = (userMessage || '').toLowerCase();

  if (/qr|scan|payment link|upi/.test(msg)) return strings.qr;
  if (/note|cash|currency|counterfeit|fake note/.test(msg)) return strings.currency;
  if (/otp|pin|password|cvv/.test(msg)) return strings.otp;
  if (/report|complaint|file|ncrp|cybercrime/.test(msg)) return strings.report;

  const scam = scamTextScorer.analyze(userMessage);
  if (scam.score > 0) {
    const flagText = scam.redFlags.length ? strings.scamFlags(scam.redFlags.slice(0, 3).join(', ')) : '';
    return `${strings.scamPrefix(verdictLabelFor(lang, scam.verdict), scam.score)}${flagText}${strings.scamSuffix}`;
  }

  return strings.welcome;
}

async function getReply(history, userMessage, lang = 'en') {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (anthropicKey) {
    try {
      const reply = await callAnthropic(anthropicKey, history, userMessage, lang);
      if (reply) return { reply, source: 'llm-anthropic' };
    } catch (err) {
      console.warn('Anthropic call failed, falling back to scripted assistant:', err.message);
    }
  }

  if (openaiKey) {
    try {
      const reply = await callOpenAI(openaiKey, history, userMessage, lang);
      if (reply) return { reply, source: 'llm-openai' };
    } catch (err) {
      console.warn('OpenAI call failed, falling back to scripted assistant:', err.message);
    }
  }

  return { reply: scriptedFallback(userMessage, lang), source: 'scripted-fallback' };
}

export default { getReply };
