const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const API_BASE = (configuredBaseUrl || '/api').replace(/\/$/, '');

export function apiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}

export async function fetchJson(path, options) {
  const res = await fetch(apiUrl(path), options);
  const contentType = res.headers.get('content-type') || '';

  if (!res.ok) {
    const errorBody = contentType.includes('application/json')
      ? await res.json().catch(() => null)
      : null;
    throw new Error(errorBody?.error || `API request failed: ${res.status}`);
  }

  if (!contentType.includes('application/json')) {
    throw new Error(
      `API returned ${contentType || 'non-JSON'} from ${apiUrl(path)}. Set VITE_API_BASE_URL to your deployed proxy backend.`
    );
  }

  return res.json();
}
