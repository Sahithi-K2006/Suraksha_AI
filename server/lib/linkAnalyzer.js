// Heuristic analysis of decoded QR content / pasted payment links.

const SHORTENER_DOMAINS = ['bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'is.gd', 'cutt.ly', 'rebrand.ly'];
const SUSPICIOUS_TLDS = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.click'];
const KNOWN_UPI_HANDLES = ['okaxis', 'oksbi', 'okhdfcbank', 'okicici', 'ybl', 'paytm', 'upi'];
const TRUSTED_DOMAINS = ['irctc.co.in', 'gov.in', 'nic.in', 'rbi.org.in', 'uidai.gov.in'];

function traceStep(label, hit, detail) {
  return { step: label, result: detail, hit };
}

function parseUpi(content) {
  if (!content.startsWith('upi://')) return null;
  try {
    const url = new URL(content);
    const params = url.searchParams;
    return {
      pa: params.get('pa') || '',
      pn: params.get('pn') || '',
      am: params.get('am') || '',
    };
  } catch {
    return null;
  }
}

function analyze(rawContent) {
  const content = (rawContent || '').trim();
  const trace = [];
  let score = 0;

  const upi = parseUpi(content);

  if (upi) {
    trace.push(traceStep('Checking payment scheme', false, 'valid UPI deep link (upi://pay) detected'));

    const handle = upi.pa.split('@')[1] || '';
    const knownHandle = KNOWN_UPI_HANDLES.some((h) => handle.toLowerCase().includes(h));
    if (knownHandle) {
      trace.push(traceStep('Checking UPI payee handle', false, `"@${handle}" matches a recognized bank/PSP handle`));
    } else {
      score += 30;
      trace.push(traceStep('Checking UPI payee handle', true, `"@${handle}" is not a recognized bank/PSP handle`));
    }

    const genericPayee = /refund|dept|department|support|helpdesk|kyc|verify/i.test(upi.pn);
    if (genericPayee) {
      score += 25;
      trace.push(traceStep('Checking payee name pattern', true, `payee name "${upi.pn}" resembles a fraud/refund-desk lure`));
    } else {
      trace.push(traceStep('Checking payee name pattern', false, `payee name "${upi.pn}" looks like a plausible merchant/individual`));
    }

    const amt = parseFloat(upi.am || '0');
    if (amt === 1 || amt === 0) {
      score += 15;
      trace.push(traceStep('Checking payment amount', true, `token amount (₹${amt}) often used to validate stolen/mule accounts`));
    } else {
      trace.push(traceStep('Checking payment amount', false, `amount ₹${amt} is a normal transaction value`));
    }
  } else if (/^https?:\/\//i.test(content)) {
    let hostname = '';
    try {
      hostname = new URL(content).hostname.toLowerCase();
    } catch {
      hostname = '';
    }

    trace.push(traceStep('Checking payment scheme', false, 'no UPI scheme found; treating as web link'));

    const isHttps = content.toLowerCase().startsWith('https://');
    if (!isHttps) {
      score += 20;
      trace.push(traceStep('Checking transport security (HTTPS)', true, 'link uses plain HTTP, not encrypted HTTPS'));
    } else {
      trace.push(traceStep('Checking transport security (HTTPS)', false, 'link uses HTTPS'));
    }

    const isShortener = SHORTENER_DOMAINS.some((d) => hostname.includes(d));
    if (isShortener) {
      score += 30;
      trace.push(traceStep('Checking for URL shorteners', true, `"${hostname}" is a link shortener hiding the real destination`));
    } else {
      trace.push(traceStep('Checking for URL shorteners', false, 'destination domain is visible, not shortened'));
    }

    const isTrusted = TRUSTED_DOMAINS.some((d) => hostname.endsWith(d));
    if (isTrusted) {
      score = Math.max(0, score - 30);
      trace.push(traceStep('Checking against trusted domain list', true, `"${hostname}" matches a known trusted domain`));
    }

    const suspiciousTld = SUSPICIOUS_TLDS.some((tld) => hostname.endsWith(tld));
    if (suspiciousTld) {
      score += 25;
      trace.push(traceStep('Checking domain TLD reputation', true, `"${hostname}" uses a TLD commonly abused for scam sites`));
    } else {
      trace.push(traceStep('Checking domain TLD reputation', false, 'TLD not on the high-risk list'));
    }

    const scamKeywords = /kyc|verify|free|offer|reward|claim|prize|winner/i.test(content);
    if (scamKeywords) {
      score += 20;
      trace.push(traceStep('Checking for bait keywords in URL', true, 'URL contains common scam-bait keywords'));
    } else {
      trace.push(traceStep('Checking for bait keywords in URL', false, 'no scam-bait keywords found in URL'));
    }
  } else {
    trace.push(traceStep('Checking content format', true, 'content is neither a valid UPI link nor a web URL'));
    score += 40;
  }

  score = Math.max(0, Math.min(100, score));
  let verdict = 'safe';
  if (score >= 60) verdict = 'high_risk';
  else if (score >= 30) verdict = 'suspicious';

  const explanation = trace.filter((t) => t.hit).map((t) => `${t.step.replace('Checking ', '')}: ${t.result}`);
  if (explanation.length === 0) {
    explanation.push('No suspicious patterns found in decoded content');
  }

  return {
    verdict,
    score,
    trace,
    explanation,
    decoded: content,
    isUpi: !!upi,
    upiDetails: upi,
  };
}

export default { analyze };
