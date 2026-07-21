// Citizen AI Assistant: uses a real LLM if an API key is present in the
// environment, otherwise falls back to a scripted decision tree. Must never
// throw due to a missing/invalid key - always degrade gracefully.

import scamTextScorer from './scamTextScorer.js';

const SYSTEM_PROMPT = `You are SuRakshaAI's Citizen Assistant, a friendly fraud-safety helper for Indian citizens.
You help people understand whether a message, currency note, or QR/payment link might be fraudulent, explain red flags in plain language, and give clear next-step guidance (e.g. don't share OTP, block sender, report on cybercrime.gov.in or call 1930).
Keep answers short (3-6 sentences), warm, and non-alarmist. Never claim to be a licensed legal or financial advisor.`;

async function callAnthropic(apiKey, history, userMessage) {
  const messages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages,
    }),
  });

  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text || null;
}

async function callOpenAI(apiKey, history, userMessage) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 400,
      messages,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || null;
}

function scriptedFallback(userMessage) {
  const msg = (userMessage || '').toLowerCase();

  if (/qr|scan|payment link|upi/.test(msg)) {
    return "I can help with QR/payment links! Paste the link or scan the QR in the QR Checker page — I'll check the payee handle, domain reputation, and amount pattern. Golden rule: never scan a QR to *receive* money — QR codes are for paying, not collecting.";
  }

  if (/note|cash|currency|counterfeit|fake note/.test(msg)) {
    return "For currency concerns, head to the Currency Checker to upload a photo or use your webcam. I'll analyze aspect ratio, color pattern, and print sharpness. In the meantime: check the security thread, watermark, and color-shifting ink on the note against an RBI reference image.";
  }

  if (/otp|pin|password|cvv/.test(msg)) {
    return "Please never share your OTP, PIN, CVV, or password with anyone — no bank, company, or government office will ever ask for these over call/SMS/chat. If you already shared one, contact your bank immediately and call the National Cyber Crime Helpline at 1930.";
  }

  if (/report|complaint|file|ncrp|cybercrime/.test(msg)) {
    return "You can generate a mock complaint draft from any flagged case's detail page using \"Generate Cybercrime Complaint.\" For real incidents with financial loss, report at cybercrime.gov.in or call the 1930 helpline as soon as possible — faster reporting improves the chance of recovering funds.";
  }

  const scam = scamTextScorer.analyze(userMessage);
  if (scam.score > 0) {
    const flagText = scam.redFlags.length ? ` I noticed patterns like: ${scam.redFlags.slice(0, 3).join(', ')}.` : '';
    return `Based on a quick scan, this reads as **${scam.verdict.replace('_', ' ')}** (risk ${scam.score}/100).${flagText} For a full breakdown with the reasoning trace, paste this into the Message Checker. When in doubt, don't click links or share personal details — verify through an official channel first.`;
  }

  return "I'm SuRakshaAI's assistant — I can help you check suspicious messages, currency notes, or QR/payment links, and guide you on reporting fraud. Try pasting a message, or describe what you're worried about!";
}

async function getReply(history, userMessage) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (anthropicKey) {
    try {
      const reply = await callAnthropic(anthropicKey, history, userMessage);
      if (reply) return { reply, source: 'llm-anthropic' };
    } catch (err) {
      console.warn('Anthropic call failed, falling back to scripted assistant:', err.message);
    }
  }

  if (openaiKey) {
    try {
      const reply = await callOpenAI(openaiKey, history, userMessage);
      if (reply) return { reply, source: 'llm-openai' };
    } catch (err) {
      console.warn('OpenAI call failed, falling back to scripted assistant:', err.message);
    }
  }

  return { reply: scriptedFallback(userMessage), source: 'scripted-fallback' };
}

export default { getReply };
