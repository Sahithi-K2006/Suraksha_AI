import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import './db/db.js';
import './db/seed.js';

import analyzeRoutes from './routes/analyze.js';
import casesRoutes from './routes/cases.js';
import assistantRoutes from './routes/assistant.js';
import riskRoutes from './routes/risk.js';
import stressRoutes from './routes/stress.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));

app.use('/api/analyze', analyzeRoutes);
app.use('/api/cases', casesRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/stress-test', stressRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    llmConfigured: Boolean(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY),
  });
});

// Serve built frontend in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`SuRakshaAI server running on http://localhost:${PORT}`);
});
