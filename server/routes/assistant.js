import express from 'express';
import db from '../db/db.js';
import assistantEngine from '../lib/assistantEngine.js';

const router = express.Router();

const insertMsg = db.prepare(`
  INSERT INTO assistant_messages (session_id, role, content) VALUES (?, ?, ?)
`);

// GET /api/assistant/history/:sessionId
router.get('/history/:sessionId', (req, res) => {
  const rows = db.prepare('SELECT * FROM assistant_messages WHERE session_id = ? ORDER BY id ASC').all(req.params.sessionId);
  res.json({ messages: rows });
});

// POST /api/assistant/chat  { sessionId, message }
router.post('/chat', async (req, res) => {
  const { sessionId, message } = req.body || {};
  if (!sessionId || !message || !message.trim()) {
    return res.status(400).json({ error: 'sessionId and message are required' });
  }

  const history = db.prepare('SELECT role, content FROM assistant_messages WHERE session_id = ? ORDER BY id ASC').all(sessionId);

  insertMsg.run(sessionId, 'user', message);

  try {
    const { reply, source } = await assistantEngine.getReply(history, message);
    insertMsg.run(sessionId, 'assistant', reply);
    res.json({ reply, source });
  } catch (err) {
    console.error('Assistant error:', err);
    const fallback = "Sorry, I ran into an issue. As a general rule: never share OTP/PIN, verify links before clicking, and report suspicious activity via the Message/Currency/QR checkers.";
    insertMsg.run(sessionId, 'assistant', fallback);
    res.json({ reply: fallback, source: 'error-fallback' });
  }
});

export default router;
