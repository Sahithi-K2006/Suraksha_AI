import express from 'express';
import db from '../db/db.js';
import similarCases from '../lib/similarCases.js';
import complaintGenerator from '../lib/complaintGenerator.js';

const router = express.Router();

// GET /api/cases?type=&verdict=&sort=&order=&limit=&offset=&q=
router.get('/', (req, res) => {
  const { type, verdict, sort = 'created_at', order = 'desc', limit = 100, offset = 0, q } = req.query;

  const allowedSort = new Set(['created_at', 'risk_score', 'type', 'verdict', 'id']);
  const sortCol = allowedSort.has(sort) ? sort : 'created_at';
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

  const clauses = [];
  const params = [];
  if (type) { clauses.push('type = ?'); params.push(type); }
  if (verdict) { clauses.push('verdict = ?'); params.push(verdict); }
  if (q) { clauses.push('input_summary LIKE ?'); params.push(`%${q}%`); }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = db.prepare(`SELECT * FROM cases ${where} ORDER BY ${sortCol} ${sortOrder} LIMIT ? OFFSET ?`).all(...params, Number(limit), Number(offset));
  const total = db.prepare(`SELECT COUNT(*) as c FROM cases ${where}`).get(...params);

  res.json({ cases: rows, total: total.c });
});

// GET /api/cases/stats
router.get('/meta/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as c FROM cases').get().c;
  const byVerdict = db.prepare('SELECT verdict, COUNT(*) as c FROM cases GROUP BY verdict').all();
  const byType = db.prepare('SELECT type, COUNT(*) as c FROM cases GROUP BY type').all();
  const avgRisk = db.prepare('SELECT AVG(risk_score) as avg FROM cases').get().avg;
  const highRisk = db.prepare("SELECT COUNT(*) as c FROM cases WHERE verdict = 'high_risk'").get().c;

  const trend = db.prepare(`
    SELECT date(created_at) as day, COUNT(*) as count,
           SUM(CASE WHEN verdict = 'high_risk' THEN 1 ELSE 0 END) as high_risk_count
    FROM cases
    GROUP BY day
    ORDER BY day ASC
  `).all();

  res.json({
    total,
    byVerdict: Object.fromEntries(byVerdict.map((r) => [r.verdict, r.c])),
    byType: Object.fromEntries(byType.map((r) => [r.type, r.c])),
    avgRiskScore: avgRisk ? Math.round(avgRisk) : 0,
    highRiskCount: highRisk,
    trend,
  });
});

// GET /api/cases/:id
router.get('/:id', (req, res) => {
  const caseRow = db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id);
  if (!caseRow) return res.status(404).json({ error: 'Case not found' });

  const similar = similarCases.findSimilar(db, caseRow, caseRow.id);
  res.json({ case: caseRow, similarCases: similar });
});

// GET /api/cases/:id/complaint
router.get('/:id/complaint', (req, res) => {
  const caseRow = db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id);
  if (!caseRow) return res.status(404).json({ error: 'Case not found' });

  const complaint = complaintGenerator.generateComplaint(caseRow);
  res.json({ complaint });
});

export default router;
