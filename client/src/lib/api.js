const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: options.body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  health: () => request('/health'),

  analyzeText: (payload) => request('/analyze/text', { method: 'POST', body: JSON.stringify(payload) }),

  analyzeCurrency: (file, meta = {}) => {
    const form = new FormData();
    form.append('image', file);
    Object.entries(meta).forEach(([k, v]) => v !== undefined && form.append(k, v));
    return request('/analyze/currency', { method: 'POST', body: form });
  },

  analyzeQr: (payload) => request('/analyze/qr', { method: 'POST', body: JSON.stringify(payload) }),

  fuseRisk: (results) => request('/risk/fuse', { method: 'POST', body: JSON.stringify({ results }) }),

  listCases: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/cases${qs ? `?${qs}` : ''}`);
  },

  getCase: (id) => request(`/cases/${id}`),

  getStats: () => request('/cases/meta/stats'),

  getComplaint: (id) => request(`/cases/${id}/complaint`),

  stressTest: (count = 500) => request('/stress-test', { method: 'POST', body: JSON.stringify({ count }) }),

  assistantChat: (sessionId, message, lang = 'en') => request('/assistant/chat', { method: 'POST', body: JSON.stringify({ sessionId, message, lang }) }),

  assistantHistory: (sessionId) => request(`/assistant/history/${sessionId}`),

  transcribeAudio: (blob, filename = 'recording.webm') => {
    const form = new FormData();
    form.append('audio', blob, filename);
    return request('/transcribe', { method: 'POST', body: form });
  },
};

export default api;
