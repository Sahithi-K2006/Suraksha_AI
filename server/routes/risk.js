import express from 'express';
import riskEngine from '../lib/riskEngine.js';

const router = express.Router();

// POST /api/risk/fuse  { results: [{ type, score }] }
router.post('/fuse', (req, res) => {
  const { results } = req.body || {};
  if (!Array.isArray(results)) {
    return res.status(400).json({ error: 'results array is required' });
  }
  const fused = riskEngine.fuse(results);
  res.json(fused);
});

export default router;
