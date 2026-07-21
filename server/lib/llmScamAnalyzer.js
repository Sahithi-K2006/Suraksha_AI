// Optional LLM cross-check for scam-message analysis. Used to boost accuracy
// on non-English text (or low-confidence heuristic results) when a real LLM
// key is available. Must never throw - callers treat this as best-effort and
// fall back to the pure heuristic result if it's unavailable or errors out.

const SYSTEM_PROMPT = `You are a fraud-detection analyst. You will be given a message in any language (English, Hindi, Telugu, Tamil, or mixed/transliterated). Analyze it for signs of scam/fraud.
Respond ONLY with a compact JSON object, no prose, no markdown fences, in this exact shape:
{"score": <0-100 integer>, "redFlags": [<short strings, translated to English, max 5>], "translation": "<English translation of the message, or the original if already English>"}
Score guidance: 0-34 = safe, 35-69 = suspicious, 70-100 = high risk. Consider urgency/threats, requests for OTP/PIN/passwords/Aadhaar, unrealistic prizes or income promises, upfront fees, suspicious links, and impersonation of banks/government.`;

async function callAnthropic(apiKey, text) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: text }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text;
}

async function callOpenAI(apiKey, text) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 300,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content;
}

function parseJsonResponse(raw) {
  if (!raw) return null;
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (typeof parsed.score !== 'number') return null;
    return {
      score: Math.max(0, Math.min(100, Math.round(parsed.score))),
      redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags.slice(0, 5) : [],
      translation: typeof parsed.translation === 'string' ? parsed.translation : null,
    };
  } catch {
    return null;
  }
}

// Returns null if no key is configured or the call fails - never throws.
async function analyzeWithLlm(text) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!anthropicKey && !openaiKey) return null;

  try {
    const raw = anthropicKey ? await callAnthropic(anthropicKey, text) : await callOpenAI(openaiKey, text);
    return parseJsonResponse(raw);
  } catch (err) {
    console.warn('LLM scam cross-check failed, continuing with heuristic-only result:', err.message);
    return null;
  }
}

export default { analyzeWithLlm };
