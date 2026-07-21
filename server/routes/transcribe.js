import express from 'express';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// POST /api/transcribe (multipart form field "audio")
// Transcribes an uploaded audio recording via OpenAI Whisper. This is the
// only feature in the app that requires OPENAI_API_KEY specifically
// (Whisper is an audio model; the Anthropic API does not do audio
// transcription) - if the key is absent this returns a clear, friendly
// error rather than crashing, and the frontend suggests live mic recording
// (Web Speech API) as the free alternative.
router.post('/', upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'audio file is required' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'AUDIO_TRANSCRIPTION_UNAVAILABLE',
      message: 'Transcribing an uploaded audio file needs an OPENAI_API_KEY on the server. Use the live "Record Voice" option instead - it works fully offline of any key.',
    });
  }

  try {
    const form = new FormData();
    form.append('file', new Blob([req.file.buffer], { type: req.file.mimetype || 'audio/webm' }), req.file.originalname || 'recording.webm');
    form.append('model', 'whisper-1');
    form.append('response_format', 'verbose_json');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Whisper API error: ${response.status} ${errText}`);
    }

    const data = await response.json();
    res.json({ text: data.text || '', language: data.language || null });
  } catch (err) {
    console.error('Transcription failed:', err);
    res.status(502).json({ error: 'Transcription failed. Please try again or use live voice recording instead.' });
  }
});

export default router;
