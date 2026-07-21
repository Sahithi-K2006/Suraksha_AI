// Simple in-memory handoff so the Universal Auto-Detect Drop Zone can hand
// a decoded input straight to the right checker page without a full reload.
let pending = null;

export function setHandoff(payload) {
  pending = payload;
}

export function consumeHandoff() {
  const value = pending;
  pending = null;
  return value;
}
