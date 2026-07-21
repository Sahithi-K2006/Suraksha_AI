import express from 'express';
import db from '../db/db.js';

const router = express.Router();

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

const TYPES = ['scam_message', 'counterfeit_currency', 'qr_link'];

const TEMPLATES = {
  scam_message: [
    'URGENT: your account will be blocked, verify KYC now at bit.ly/verify-xyz',
    'Congratulations! You won a lucky draw prize, pay fee to claim',
    'Your parcel is on hold, pay customs duty to release',
    'Hi, are you free for a call this evening?',
    'Your OTP is required to confirm the refund, please share',
  ],
  counterfeit_currency: [
    'Rs 500 note image scan - Currency Checker upload',
    'Rs 2000 note image scan - live webcam capture',
    'Rs 200 note image scan - Currency Checker upload',
    'Rs 100 note image scan - live webcam capture',
  ],
  qr_link: [
    'QR decoded to: upi://pay?pa=merchant@oksbi&pn=Store&am=200',
    'QR decoded to: http://bit.ly/free-recharge-offer',
    'QR decoded to: upi://pay?pa=scam@paytm&pn=Refund%20Dept&am=1',
    'QR decoded to: https://gov.in/services',
  ],
};

function jitter(v, amt = 0.02) {
  return v + (Math.random() - 0.5) * amt;
}

function randomRecentDate() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - Math.floor(Math.random() * 60 * 24 * 3));
  return d.toISOString();
}

const insert = db.prepare(`
  INSERT INTO cases (type, input_summary, verdict, risk_score, explanation, latitude, longitude, region, created_at)
  VALUES (@type, @input_summary, @verdict, @risk_score, @explanation, @latitude, @longitude, @region, @created_at)
`);

// POST /api/stress-test  { count = 500 }
router.post('/', (req, res) => {
  const count = Math.min(2000, Math.max(1, Number(req.body?.count) || 500));

  const rows = [];
  for (let i = 0; i < count; i++) {
    const type = TYPES[Math.floor(Math.random() * TYPES.length)];
    const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
    const template = TEMPLATES[type][Math.floor(Math.random() * TEMPLATES[type].length)];
    const score = Math.floor(Math.random() * 100);
    const verdict = score >= 70 ? 'high_risk' : score >= 35 ? 'suspicious' : 'safe';

    rows.push({
      type,
      input_summary: `[Simulated] ${template}`,
      verdict,
      risk_score: score,
      explanation: JSON.stringify(['Synthetic stress-test case for scalability demo']),
      latitude: jitter(region.lat),
      longitude: jitter(region.lng),
      region: region.name,
      created_at: randomRecentDate(),
    });
  }

  const insertMany = db.transaction((items) => {
    for (const item of items) insert.run(item);
  });

  const start = Date.now();
  insertMany(rows);
  const durationMs = Date.now() - start;

  res.json({ inserted: count, durationMs });
});

export default router;
