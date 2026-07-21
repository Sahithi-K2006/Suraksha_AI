// Lightweight i18n: supported languages, UI string dictionary, and helpers.
// No external translation service needed for UI chrome - only the analysis
// pipeline (server-side) needs real translation/multilingual understanding.

export const LANGUAGES = [
  { code: 'en', label: 'English', nativeName: 'English', speechLang: 'en-IN' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी', speechLang: 'hi-IN' },
  { code: 'te', label: 'Telugu', nativeName: 'తెలుగు', speechLang: 'te-IN' },
  { code: 'ta', label: 'Tamil', nativeName: 'தமிழ்', speechLang: 'ta-IN' },
];

const STRINGS = {
  en: {
    appTagline: 'Your Shield Against Digital Fraud',
    listen: 'Listen',
    stopListening: 'Stop',
    speakNow: 'Speak now...',
    recordVoice: 'Record Voice',
    uploadRecording: 'Upload Recording',
    analyzing: 'Analyzing...',
    verdictSafe: 'Safe',
    verdictSuspicious: 'Suspicious',
    verdictHighRisk: 'High Risk',
    readAloud: 'Read result aloud',
    stopReading: 'Stop reading',
    transcribing: 'Transcribing your recording...',
    tapToSpeak: 'Tap the mic and speak in any of your languages',
    detectedLanguage: 'Detected language',
    assistantWelcome: "Hi, I'm SuRakshaAI's Citizen Assistant. Paste a suspicious message, ask about a currency note or QR code, or ask how to report fraud - I'm here to help. You can also just speak to me!",
    assistantPlaceholder: 'Ask about a message, currency note, or QR code...',
    dropZoneTitle: 'Universal Auto-Detect Drop Zone',
    dropZoneDesc: "Drop or paste a currency photo, a QR code image, or paste a message / payment link. We'll auto-detect the type and route it to the right checker.",
    dropZonePlaceholder: 'Paste a suspicious message, UPI link, or website URL here... or just tap the mic and speak',
    autoDetectAnalyze: 'Auto-Detect & Analyze',
    uploadImage: 'Upload Image',
    detecting: 'Detecting what this is...',
  },
  hi: {
    appTagline: 'डिजिटल धोखाधड़ी से आपकी सुरक्षा',
    listen: 'सुनें',
    stopListening: 'रोकें',
    speakNow: 'अब बोलें...',
    recordVoice: 'आवाज़ रिकॉर्ड करें',
    uploadRecording: 'रिकॉर्डिंग अपलोड करें',
    analyzing: 'जांच हो रही है...',
    verdictSafe: 'सुरक्षित',
    verdictSuspicious: 'संदिग्ध',
    verdictHighRisk: 'खतरनाक',
    readAloud: 'नतीजा सुनें',
    stopReading: 'रोकें',
    transcribing: 'आपकी रिकॉर्डिंग सुनी जा रही है...',
    tapToSpeak: 'माइक दबाएं और अपनी भाषा में बोलें',
    detectedLanguage: 'भाषा पहचानी गई',
    assistantWelcome: 'नमस्ते, मैं SuRakshaAI का नागरिक सहायक हूँ। कोई संदिग्ध संदेश पेस्ट करें, करेंसी नोट या QR कोड के बारे में पूछें, या धोखाधड़ी की रिपोर्ट करने का तरीका जानें - मैं यहाँ मदद के लिए हूँ। आप बस मुझसे बोल भी सकते हैं!',
    assistantPlaceholder: 'संदेश, करेंसी नोट या QR कोड के बारे में पूछें...',
    dropZoneTitle: 'यूनिवर्सल ऑटो-डिटेक्ट ड्रॉप ज़ोन',
    dropZoneDesc: 'करेंसी फोटो, QR कोड इमेज पेस्ट करें, या संदेश/पेमेंट लिंक पेस्ट करें। हम प्रकार को पहचान कर सही चेकर पर भेज देंगे।',
    dropZonePlaceholder: 'संदिग्ध संदेश, UPI लिंक, या वेबसाइट URL यहाँ पेस्ट करें... या माइक दबाकर बोलें',
    autoDetectAnalyze: 'ऑटो-डिटेक्ट और विश्लेषण करें',
    uploadImage: 'इमेज अपलोड करें',
    detecting: 'पहचाना जा रहा है...',
  },
  te: {
    appTagline: 'డిజిటల్ మోసానికి వ్యతిరేకంగా మీ రక్షణ',
    listen: 'వినండి',
    stopListening: 'ఆపండి',
    speakNow: 'ఇప్పుడు మాట్లాడండి...',
    recordVoice: 'వాయిస్ రికార్డ్ చేయండి',
    uploadRecording: 'రికార్డింగ్ అప్‌లోడ్ చేయండి',
    analyzing: 'పరిశీలిస్తోంది...',
    verdictSafe: 'సురక్షితం',
    verdictSuspicious: 'అనుమానాస్పదం',
    verdictHighRisk: 'ప్రమాదకరం',
    readAloud: 'ఫలితం వినండి',
    stopReading: 'ఆపండి',
    transcribing: 'మీ రికార్డింగ్ వినబడుతోంది...',
    tapToSpeak: 'మైక్ నొక్కి మీ భాషలో మాట్లాడండి',
    detectedLanguage: 'గుర్తించిన భాష',
    assistantWelcome: 'నమస్తే, నేను SuRakshaAI పౌర సహాయకుడిని. అనుమానాస్పద సందేశాన్ని పేస్ట్ చేయండి, కరెన్సీ నోటు లేదా QR కోడ్ గురించి అడగండి, లేదా మోసాన్ని ఎలా నివేదించాలో తెలుసుకోండి - నేను సహాయం చేయడానికి ఇక్కడ ఉన్నాను. మీరు నాతో మాట్లాడవచ్చు కూడా!',
    assistantPlaceholder: 'సందేశం, కరెన్సీ నోటు లేదా QR కోడ్ గురించి అడగండి...',
    dropZoneTitle: 'యూనివర్సల్ ఆటో-డిటెక్ట్ డ్రాప్ జోన్',
    dropZoneDesc: 'కరెన్సీ ఫోటో, QR కోడ్ ఇమేజ్‌ని పేస్ట్ చేయండి, లేదా సందేశం/పేమెంట్ లింక్‌ని పేస్ట్ చేయండి. మేము రకాన్ని గుర్తించి సరైన చెకర్‌కు పంపుతాము.',
    dropZonePlaceholder: 'అనుమానాస్పద సందేశం, UPI లింక్ లేదా వెబ్‌సైట్ URL ఇక్కడ పేస్ట్ చేయండి... లేదా మైక్ నొక్కి మాట్లాడండి',
    autoDetectAnalyze: 'ఆటో-డిటెక్ట్ & విశ్లేషించండి',
    uploadImage: 'ఇమేజ్ అప్‌లోడ్ చేయండి',
    detecting: 'గుర్తిస్తోంది...',
  },
  ta: {
    appTagline: 'டிஜிட்டல் மோசடிக்கு எதிரான உங்கள் கவசம்',
    listen: 'கேளுங்கள்',
    stopListening: 'நிறுத்து',
    speakNow: 'இப்போது பேசுங்கள்...',
    recordVoice: 'குரலைப் பதிவு செய்யுங்கள்',
    uploadRecording: 'பதிவை பதிவேற்றவும்',
    analyzing: 'ஆய்வு செய்யப்படுகிறது...',
    verdictSafe: 'பாதுகாப்பானது',
    verdictSuspicious: 'சந்தேகத்திற்குரியது',
    verdictHighRisk: 'உயர் ஆபத்து',
    readAloud: 'முடிவைக் கேளுங்கள்',
    stopReading: 'நிறுத்து',
    transcribing: 'உங்கள் பதிவு கேட்கப்படுகிறது...',
    tapToSpeak: 'மைக்கை அழுத்தி உங்கள் மொழியில் பேசுங்கள்',
    detectedLanguage: 'கண்டறியப்பட்ட மொழி',
    assistantWelcome: 'வணக்கம், நான் SuRakshaAI-இன் குடிமக்கள் உதவியாளர். சந்தேகத்திற்குரிய செய்தியை பேஸ்ட் செய்யவும், நாணயக் குறிப்பு அல்லது QR குறியீடு பற்றி கேளுங்கள், அல்லது மோசடியை எப்படி புகாரளிப்பது எனத் தெரிந்துகொள்ளுங்கள் - நான் உதவ இங்கே இருக்கிறேன். நீங்கள் என்னிடம் பேசவும் முடியும்!',
    assistantPlaceholder: 'செய்தி, நாணயக் குறிப்பு அல்லது QR குறியீடு பற்றி கேளுங்கள்...',
    dropZoneTitle: 'யுனிவர்சல் ஆட்டோ-டிடெக்ட் டிராப் ஸோன்',
    dropZoneDesc: 'நாணயப் புகைப்படம், QR குறியீடு படத்தை பேஸ்ட் செய்யவும், அல்லது செய்தி/பேமெண்ட் லிங்கை பேஸ்ட் செய்யவும். நாங்கள் வகையைக் கண்டறிந்து சரியான செக்கருக்கு அனுப்புவோம்.',
    dropZonePlaceholder: 'சந்தேகத்திற்குரிய செய்தி, UPI லிங்க் அல்லது இணையதள URL ஐ இங்கே பேஸ்ட் செய்யவும்... அல்லது மைக்கை அழுத்தி பேசுங்கள்',
    autoDetectAnalyze: 'ஆட்டோ-டிடெக்ட் & பகுப்பாய்வு',
    uploadImage: 'படத்தை பதிவேற்றவும்',
    detecting: 'கண்டறியப்படுகிறது...',
  },
};

export function t(lang, key) {
  return STRINGS[lang]?.[key] || STRINGS.en[key] || key;
}

export function getLanguage(code) {
  return LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
}

export function verdictLabel(lang, verdict) {
  if (verdict === 'high_risk') return t(lang, 'verdictHighRisk');
  if (verdict === 'suspicious') return t(lang, 'verdictSuspicious');
  return t(lang, 'verdictSafe');
}

const SUMMARY_TEMPLATES = {
  en: (verdict, score) => `This looks ${verdict}. Risk score: ${score} out of 100.`,
  hi: (verdict, score) => `यह ${verdict} लगता है। जोखिम स्कोर: 100 में से ${score}।`,
  te: (verdict, score) => `ఇది ${verdict}గా కనిపిస్తుంది. ప్రమాద స్కోరు: 100కి ${score}.`,
  ta: (verdict, score) => `இது ${verdict} போல் தெரிகிறது. ஆபத்து மதிப்பெண்: 100க்கு ${score}.`,
};

export function speakSummary(lang, verdict, score) {
  const template = SUMMARY_TEMPLATES[lang] || SUMMARY_TEMPLATES.en;
  return template(verdictLabel(lang, verdict), score);
}
