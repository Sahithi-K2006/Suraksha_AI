// Lightweight keyword + region similarity matcher against stored cases.
// No embeddings/ML — pure token-overlap (Jaccard-ish) scoring, kept simple
// and transparent on purpose since this is a heuristic-first product.

const STOPWORDS = new Set(['the', 'a', 'an', 'to', 'is', 'in', 'of', 'and', 'for', 'your', 'you', 'this', 'on', 'at', 'be', 'will', 'or', 'with', 'from']);

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9₹.\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

function jaccard(aTokens, bTokens) {
  const a = new Set(aTokens);
  const b = new Set(bTokens);
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection++;
  const union = new Set([...a, ...b]).size;
  return intersection / union;
}

// db: better-sqlite3 instance, target: { type, input_summary, region }, excludeId optional
function findSimilar(db, target, excludeId = null, limit = 5) {
  const targetTokens = tokenize(target.input_summary);
  const rows = db
    .prepare(`SELECT * FROM cases WHERE type = ? ${excludeId ? 'AND id != ?' : ''}`)
    .all(...(excludeId ? [target.type, excludeId] : [target.type]));

  const scored = rows.map((row) => {
    const rowTokens = tokenize(row.input_summary);
    let similarity = jaccard(targetTokens, rowTokens);
    if (target.region && row.region && target.region === row.region) {
      similarity += 0.15;
    }
    return { ...row, similarity: Math.min(1, similarity) };
  });

  return scored
    .filter((r) => r.similarity > 0.08)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

export default { findSimilar, tokenize, jaccard };
