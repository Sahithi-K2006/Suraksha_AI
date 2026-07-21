import express from 'express';
import multer from 'multer';
import db from '../db/db.js';
import scamTextScorer from '../lib/scamTextScorer.js';
import currencyAnalyzer from '../lib/currencyAnalyzer.js';
import linkAnalyzer from '../lib/linkAnalyzer.js';
import similarCases from '../lib/similarCases.js';
import llmScamAnalyzer from '../lib/llmScamAnalyzer.js';
import riskEngine from '../lib/riskEngine.js';

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
router.post('/text', async (req, res) => {
  const { text, latitude, longitude, region, save = true } = req.body || {};
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'text is required' });
  }

  const result = scamTextScorer.analyze(text);

  // For non-English text (or a low-confidence heuristic read), try an
  // optional LLM cross-check that can genuinely translate + reason about
  // the message. This is a no-op (returns null fast) if no API key is set.
  const worthLlmCheck = result.detectedLanguage !== 'en' || result.score < 20;
  if (worthLlmCheck) {
    const llmResult = await llmScamAnalyzer.analyzeWithLlm(text);
    if (llmResult) {
      const mergedScore = Math.max(result.score, llmResult.score);
      result.score = mergedScore;
      result.verdict = riskEngine.verdictFromScore(mergedScore);
      result.translation = llmResult.translation;
      if (llmResult.redFlags.length) {
        result.trace.push({
          step: 'Cross-checking with AI language model',
          result: `translated & flagged: ${llmResult.redFlags.join(', ')}`,
          hit: true,
        });
        result.explanation.push(`AI cross-check (translated): ${llmResult.redFlags.join(', ')}`);
        result.redFlags = [...new Set([...result.redFlags, ...llmResult.redFlags])];
      } else {
        result.trace.push({
          step: 'Cross-checking with AI language model',
          result: 'translated - no additional red flags found',
          hit: false,
        });
      }
    }
  }

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
