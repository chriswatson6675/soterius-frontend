import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});


export async function scanDomain(domain) {
  try {
    const { data } = await api.post('/api/scan', { domain });
    return data;
  } catch (err) {
    throw new Error(handleError(err));
  }
}

export async function submitGate(payload) {
  try {
    const { data } = await api.post('/api/scan/submit-gate', payload);
    return data;
  } catch (err) {
    throw new Error(handleError(err));
  }
}

export async function downloadReport(payload) {
  try {
    const { data } = await api.post('/api/report', payload, {
      responseType: 'blob',
      timeout: 120000,
    });
    return data;
  } catch (err) {
    if (err.response?.data instanceof Blob) {
      const text = await err.response.data.text();
      try {
        const parsed = JSON.parse(text);
        throw new Error(parsed.error || 'PDF generation failed');
      } catch {
        throw new Error('PDF generation failed');
      }
    }
    throw new Error(handleError(err));
  }
}

function handleError(err) {
  if (err.response) {
    const msg = err.response.data?.error;
    if (err.response.status === 400) return msg || 'Invalid domain. Please check and try again.';
    if (err.response.status === 502) return 'Could not reach the target domain.';
    return msg || `Server error (${err.response.status})`;
  }
  if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
    return 'Cannot connect to scanner backend. Is it running on port 3001?';
  }
  if (err.code === 'ECONNABORTED') return 'Scan timed out. The domain may be slow to respond.';
  return err.message || 'An unexpected error occurred.';
}
