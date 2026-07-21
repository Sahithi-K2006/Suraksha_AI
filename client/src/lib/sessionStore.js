const SESSION_RESULTS_KEY = 'suraksha_session_results';
const ASSISTANT_SESSION_KEY = 'suraksha_assistant_session_id';

export function getAssistantSessionId() {
  let id = localStorage.getItem(ASSISTANT_SESSION_KEY);
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(ASSISTANT_SESSION_KEY, id);
  }
  return id;
}

export function getSessionResults() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_RESULTS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addSessionResult(entry) {
  const results = getSessionResults();
  results.push({ ...entry, timestamp: Date.now() });
  sessionStorage.setItem(SESSION_RESULTS_KEY, JSON.stringify(results));
  window.dispatchEvent(new CustomEvent('suraksha:session-updated'));
  return results;
}

export function clearSessionResults() {
  sessionStorage.removeItem(SESSION_RESULTS_KEY);
  window.dispatchEvent(new CustomEvent('suraksha:session-updated'));
}
