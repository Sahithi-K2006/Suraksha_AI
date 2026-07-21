// Fuses per-module scores into one 0-100 Unified Risk Score.
// Weights reflect that a confirmed OTP/PII request or counterfeit note is a
// stronger, more certain signal than a merely "suspicious" link.

const MODULE_WEIGHTS = {
  scam_message: 0.35,
  counterfeit_currency: 0.35,
  qr_link: 0.30,
};

function verdictFromScore(score) {
  if (score >= 70) return 'high_risk';
  if (score >= 35) return 'suspicious';
  return 'safe';
}

// results: array of { type: 'scam_message'|'counterfeit_currency'|'qr_link', score: number }
function fuse(results) {
  if (!results.length) {
    return { score: 0, verdict: 'safe', breakdown: [] };
  }

  const totalWeight = results.reduce((sum, r) => sum + (MODULE_WEIGHTS[r.type] || 0.3), 0);
  const weightedSum = results.reduce((sum, r) => sum + r.score * (MODULE_WEIGHTS[r.type] || 0.3), 0);
  const score = Math.round(weightedSum / totalWeight);

  const breakdown = results.map((r) => ({
    type: r.type,
    score: r.score,
    weight: MODULE_WEIGHTS[r.type] || 0.3,
    contribution: Math.round(r.score * (MODULE_WEIGHTS[r.type] || 0.3)),
  }));

  return { score, verdict: verdictFromScore(score), breakdown };
}

export default { fuse, verdictFromScore, MODULE_WEIGHTS };
