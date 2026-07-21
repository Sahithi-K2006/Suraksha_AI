import db from './db.js';

// Bengaluru-area localities used as a sample Indian city for demo geodata
const REGIONS = [
  { name: 'Koramangala', lat: 12.9352, lng: 77.6245 },
  { name: 'Indiranagar', lat: 12.9719, lng: 77.6412 },
  { name: 'Whitefield', lat: 12.9698, lng: 77.7500 },
  { name: 'HSR Layout', lat: 12.9121, lng: 77.6446 },
  { name: 'Electronic City', lat: 12.8452, lng: 77.6602 },
  { name: 'Jayanagar', lat: 12.9308, lng: 77.5838 },
  { name: 'Malleshwaram', lat: 13.0027, lng: 77.5646 },
  { name: 'Marathahalli', lat: 12.9569, lng: 77.7011 },
  { name: 'Yelahanka', lat: 13.1007, lng: 77.5963 },
  { name: 'Banashankari', lat: 12.9250, lng: 77.5460 },
];

function jitter(v, amt = 0.01) {
  return v + (Math.random() - 0.5) * amt;
}

function pickRegion() {
  const r = REGIONS[Math.floor(Math.random() * REGIONS.length)];
  return { region: r.name, latitude: jitter(r.lat), longitude: jitter(r.lng) };
}

const seedCases = [
  // Scam messages
  {
    type: 'scam_message',
    input_summary: 'Dear customer your KYC will expire today. Update immediately or account will be blocked: bit.ly/kyc-updt',
    verdict: 'high_risk',
    risk_score: 92,
    explanation: JSON.stringify(['Urgency language detected ("immediately", "today")', 'Threat of account suspension', 'Shortened/suspicious URL', 'Impersonates bank KYC process']),
  },
  {
    type: 'scam_message',
    input_summary: 'Congratulations! You have won Rs 25,00,000 in KBC lucky draw. Send processing fee to claim prize.',
    verdict: 'high_risk',
    risk_score: 96,
    explanation: JSON.stringify(['Unsolicited prize/lottery claim', 'Requests upfront "processing fee"', 'Too-good-to-be-true reward', 'No verifiable sender identity']),
  },
  {
    type: 'scam_message',
    input_summary: 'Your electricity bill is pending. Power will be disconnected tonight. Pay now via link to avoid disconnection.',
    verdict: 'high_risk',
    risk_score: 89,
    explanation: JSON.stringify(['Urgency/threat language ("tonight", "disconnection")', 'Payment link pressure', 'Impersonates utility provider']),
  },
  {
    type: 'scam_message',
    input_summary: 'Hi, are we still on for lunch tomorrow at 1pm near the office?',
    verdict: 'safe',
    risk_score: 4,
    explanation: JSON.stringify(['No urgency language found', 'No links or payment requests', 'No sender impersonation detected']),
  },
  {
    type: 'scam_message',
    input_summary: 'Your Amazon order #4471 has been shipped and will arrive by Thursday.',
    verdict: 'safe',
    risk_score: 8,
    explanation: JSON.stringify(['No urgency or threat phrases', 'No suspicious links', 'Matches typical order notification pattern']),
  },
  {
    type: 'scam_message',
    input_summary: 'Job offer: Work from home, earn Rs 5000/day, just pay Rs 500 registration fee to start.',
    verdict: 'high_risk',
    risk_score: 87,
    explanation: JSON.stringify(['Unrealistic income promise', 'Upfront fee requested', 'Common job-scam pattern']),
  },
  {
    type: 'scam_message',
    input_summary: 'Your bank account has been credited with a refund. Please share OTP to confirm receipt.',
    verdict: 'high_risk',
    risk_score: 94,
    explanation: JSON.stringify(['Requests OTP sharing (major red flag)', 'Impersonates bank refund process', 'Urgency to "confirm" immediately']),
  },
  {
    type: 'scam_message',
    input_summary: 'Reminder: your dentist appointment is scheduled for Monday 10am.',
    verdict: 'safe',
    risk_score: 3,
    explanation: JSON.stringify(['No urgency, links, or payment requests', 'Consistent with routine appointment reminder']),
  },
  {
    type: 'scam_message',
    input_summary: 'URGENT: Your SIM card will be deactivated in 2 hours. Verify Aadhaar details at given link now.',
    verdict: 'high_risk',
    risk_score: 91,
    explanation: JSON.stringify(['Strong urgency language ("URGENT", "2 hours")', 'Requests Aadhaar/personal ID details', 'Suspicious verification link']),
  },
  {
    type: 'scam_message',
    input_summary: 'Can you send me the meeting notes from yesterday when you get a chance?',
    verdict: 'safe',
    risk_score: 5,
    explanation: JSON.stringify(['No red-flag phrases found', 'Casual, low-pressure request']),
  },
  {
    type: 'scam_message',
    input_summary: 'Limited time offer! Recharge Rs 10 and get Rs 1000 cashback instantly, click to claim.',
    verdict: 'suspicious',
    risk_score: 58,
    explanation: JSON.stringify(['Unrealistic cashback ratio', 'Click-to-claim link pressure', 'Some legitimate-looking phrasing mixed in']),
  },
  {
    type: 'scam_message',
    input_summary: 'Your parcel is on hold due to unpaid customs duty of Rs 249. Pay here to release parcel.',
    verdict: 'suspicious',
    risk_score: 61,
    explanation: JSON.stringify(['Small "too small to question" fee pattern', 'Payment link for parcel release', 'Moderate urgency language']),
  },

  // Counterfeit currency
  {
    type: 'counterfeit_currency',
    input_summary: 'Rs 500 note image scan - Currency Checker upload',
    verdict: 'safe',
    risk_score: 12,
    explanation: JSON.stringify(['Aspect ratio within expected range (2.13-2.20)', 'Color histogram matches genuine note profile', 'Edge sharpness variance within normal bounds']),
  },
  {
    type: 'counterfeit_currency',
    input_summary: 'Rs 2000 note image scan - Currency Checker upload',
    verdict: 'high_risk',
    risk_score: 82,
    explanation: JSON.stringify(['Aspect ratio deviates from expected range', 'Color histogram shows unusual saturation spikes', 'Low edge-sharpness variance suggesting photocopy/print']),
  },
  {
    type: 'counterfeit_currency',
    input_summary: 'Rs 200 note image scan - Currency Checker upload',
    verdict: 'safe',
    risk_score: 15,
    explanation: JSON.stringify(['Aspect ratio within expected range', 'Color histogram matches genuine profile', 'Edge sharpness variance normal']),
  },
  {
    type: 'counterfeit_currency',
    input_summary: 'Rs 500 note image scan - live webcam capture',
    verdict: 'suspicious',
    risk_score: 55,
    explanation: JSON.stringify(['Aspect ratio slightly off due to camera angle', 'Color histogram borderline', 'Edge sharpness variance mildly low']),
  },
  {
    type: 'counterfeit_currency',
    input_summary: 'Rs 100 note image scan - Currency Checker upload',
    verdict: 'safe',
    risk_score: 9,
    explanation: JSON.stringify(['All heuristic features within genuine-note thresholds']),
  },
  {
    type: 'counterfeit_currency',
    input_summary: 'Rs 2000 note image scan - live webcam capture',
    verdict: 'high_risk',
    risk_score: 78,
    explanation: JSON.stringify(['Aspect ratio deviates significantly', 'Flat color histogram distribution typical of low-quality print', 'Very low edge sharpness variance']),
  },
  {
    type: 'counterfeit_currency',
    input_summary: 'Rs 500 note image scan - Currency Checker upload',
    verdict: 'suspicious',
    risk_score: 48,
    explanation: JSON.stringify(['Aspect ratio borderline acceptable', 'Color histogram shows minor anomalies', 'Edge sharpness variance slightly below threshold']),
  },

  // QR / link
  {
    type: 'qr_link',
    input_summary: 'QR decoded to: upi://pay?pa=merchant@oksbi&pn=Local%20Store&am=250',
    verdict: 'safe',
    risk_score: 10,
    explanation: JSON.stringify(['Valid UPI payment scheme', 'Recognized bank handle (oksbi)', 'Fixed low amount, no redirect chain']),
  },
  {
    type: 'qr_link',
    input_summary: 'QR decoded to: http://bit.ly/verify-kyc-sbi',
    verdict: 'high_risk',
    risk_score: 90,
    explanation: JSON.stringify(['Shortened URL obscuring destination', 'Non-HTTPS link', 'Impersonates bank verification page', 'No legitimate UPI scheme detected']),
  },
  {
    type: 'qr_link',
    input_summary: 'QR decoded to: upi://pay?pa=scammer123@paytm&pn=Refund%20Dept&am=1',
    verdict: 'suspicious',
    risk_score: 63,
    explanation: JSON.stringify(['UPI scheme present but generic/suspicious payee name', 'Unusually low token amount often used to validate stolen accounts', 'Payee handle not linked to any known merchant']),
  },
  {
    type: 'qr_link',
    input_summary: 'QR decoded to: https://www.irctc.co.in/nget/train-search',
    verdict: 'safe',
    risk_score: 6,
    explanation: JSON.stringify(['HTTPS with valid certificate domain', 'Recognized government service domain', 'No redirect chain detected']),
  },
  {
    type: 'qr_link',
    input_summary: 'QR decoded to: http://192.168.free-recharge-offer.tk/claim',
    verdict: 'high_risk',
    risk_score: 93,
    explanation: JSON.stringify(['Suspicious free .tk domain', 'Non-HTTPS raw IP-like host', '"Free recharge" bait pattern', 'No legitimate payment scheme']),
  },
  {
    type: 'qr_link',
    input_summary: 'QR decoded to: upi://pay?pa=ramesh.kirana@okaxis&pn=Ramesh%20Kirana%20Store&am=140',
    verdict: 'safe',
    risk_score: 11,
    explanation: JSON.stringify(['Valid UPI scheme with recognized bank handle', 'Plausible small merchant name and amount']),
  },
];

const insert = db.prepare(`
  INSERT INTO cases (type, input_summary, verdict, risk_score, explanation, latitude, longitude, region, created_at)
  VALUES (@type, @input_summary, @verdict, @risk_score, @explanation, @latitude, @longitude, @region, @created_at)
`);

function randomPastDate(maxDaysAgo = 45) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * maxDaysAgo));
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return d.toISOString();
}

const existing = db.prepare('SELECT COUNT(*) as c FROM cases').get();
if (existing.c === 0) {
  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      const loc = pickRegion();
      insert.run({ ...row, ...loc, created_at: randomPastDate() });
    }
  });
  insertMany(seedCases);
  console.log(`Seeded ${seedCases.length} cases.`);
} else {
  console.log(`Database already has ${existing.c} cases, skipping seed.`);
}
