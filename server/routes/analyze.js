import express from 'express';
import multer from 'multer';
import db from '../db/db.js';
import scamTextScorer from '../lib/scamTextScorer.js';
import currencyAnalyzer from '../lib/currencyAnalyzer.js';
import linkAnalyzer from '../lib/linkAnalyzer.js';
import similarCases from '../lib/similarCases.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

const insertCase = db.prepare(`
  INSERT INTO cases (type, input_summary, verdict, risk_score, explanation, latitude, longitude, region, created_at)
  VALUES (@type, @input_summary, @verdict, @risk_score, @explanation, @latitude, @longitude, @region, CURRENT_TIMESTAMP)
`);

function saveCase({ type, input_summary, verdict, risk_score, explanation, latitude, longitude, region }) {
  const info = insertCase.run({
    type,
    input_summary: input_summary.slice(0, 500),
    verdict,
    risk_score,
    explanation: JSON.stringify(explanation),
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    region: region ?? null,
  });
  return db.prepare('SELECT * FROM cases WHERE id = ?').get(info.lastInsertRowid);
}

// POST /api/analyze/text
router.post('/text', (req, res) => {
  const { text, latitude, longitude, region, save = true } = req.body || {};
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'text is required' });
  }

  const result = scamTextScorer.analyze(text);
  let caseRow = null;
  if (save) {
    caseRow = saveCase({
      type: 'scam_message',
      input_summary: text,
      verdict: result.verdict,
      risk_score: result.score,
      explanation: result.explanation,
      latitude,
      longitude,
      region,
    });
  }

  const similar = similarCases.findSimilar(db, { type: 'scam_message', input_summary: text, region }, caseRow?.id);

  res.json({ ...result, case: caseRow, similarCases: similar });
});

// POST /api/analyze/currency (multipart form field "image")
router.post('/currency', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'image file is required' });
  const { latitude, longitude, region, source = 'upload', save = 'true' } = req.body || {};

  try {
    const result = await currencyAnalyzer.analyzeImageBuffer(req.file.buffer);
    let caseRow = null;
    const summary = `Currency note image scan - ${source === 'webcam' ? 'live webcam capture' : 'file upload'}`;
    if (save === 'true' || save === true) {
      caseRow = saveCase({
        type: 'counterfeit_currency',
        input_summary: summary,
        verdict: result.verdict,
        risk_score: result.score,
        explanation: result.explanation,
        latitude,
        longitude,
        region,
      });
    }

    const similar = similarCases.findSimilar(db, { type: 'counterfeit_currency', input_summary: summary, region }, caseRow?.id);
    res.json({ ...result, case: caseRow, similarCases: similar });
  } catch (err) {
    console.error('Currency analysis failed:', err);
    res.status(500).json({ error: 'Failed to analyze image. Please try a different photo.' });
  }
});

// POST /api/analyze/qr  { content, latitude, longitude, region }
router.post('/qr', (req, res) => {
  const { content, latitude, longitude, region, save = true } = req.body || {};
  if (!content || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'content is required' });
  }

  const result = linkAnalyzer.analyze(content);
  let caseRow = null;
  const summary = `QR decoded to: ${content}`;
  if (save) {
    caseRow = saveCase({
      type: 'qr_link',
      input_summary: summary,
      verdict: result.verdict,
      risk_score: result.score,
      explanation: result.explanation,
      latitude,
      longitude,
      region,
    });
  }

  const similar = similarCases.findSimilar(db, { type: 'qr_link', input_summary: summary, region }, caseRow?.id);
  res.json({ ...result, case: caseRow, similarCases: similar });
});

export default router;
