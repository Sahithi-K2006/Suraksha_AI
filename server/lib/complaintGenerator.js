// Generates a local, mock NCRP-style complaint draft. Never submitted anywhere.

const TYPE_LABELS = {
  scam_message: 'Online Financial Fraud - Suspicious Message/SMS/WhatsApp',
  counterfeit_currency: 'Counterfeit Currency Note',
  qr_link: 'Fraudulent QR Code / Payment Link',
};

function generateComplaint(caseRow) {
  const category = TYPE_LABELS[caseRow.type] || 'Cyber Fraud';
  const date = new Date(caseRow.created_at || Date.now());
  const explanation = safeParseExplanation(caseRow.explanation);

  return {
    draftId: `NCRP-MOCK-${String(caseRow.id).padStart(6, '0')}`,
    disclaimer: 'THIS IS A MOCK, LOCALLY-GENERATED DRAFT FOR DEMO PURPOSES ONLY. It is not submitted to any government portal or authority.',
    category,
    incidentDate: date.toISOString().slice(0, 10),
    incidentTime: date.toTimeString().slice(0, 5),
    location: caseRow.region || 'Not specified',
    riskScore: caseRow.risk_score,
    verdict: caseRow.verdict,
    description: buildDescription(caseRow),
    evidenceSummary: caseRow.input_summary,
    aiFindings: explanation,
    suggestedActions: [
      'Do not click any links or share OTP/PIN with the sender.',
      'Block the sender / reporting number where applicable.',
      'Preserve screenshots and transaction IDs as evidence.',
      'File this draft on cybercrime.gov.in or call 1930 (National Cyber Crime Helpline) if financial loss occurred.',
    ],
    generatedAt: new Date().toISOString(),
  };
}

function buildDescription(caseRow) {
  const typeText = {
    scam_message: 'a suspicious message',
    counterfeit_currency: 'a currency note suspected to be counterfeit',
    qr_link: 'a suspicious QR code / payment link',
  }[caseRow.type] || 'a suspicious item';

  return `The complainant encountered ${typeText}, which was analyzed by SuRakshaAI's explainable fraud-detection engine and flagged as "${caseRow.verdict.replace('_', ' ')}" with a risk score of ${caseRow.risk_score}/100. Summary of the flagged content: "${caseRow.input_summary}".`;
}

function safeParseExplanation(explanation) {
  try {
    const parsed = JSON.parse(explanation);
    return Array.isArray(parsed) ? parsed : [String(explanation)];
  } catch {
    return explanation ? [String(explanation)] : [];
  }
}

export default { generateComplaint };
