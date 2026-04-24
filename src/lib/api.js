export const resolveApiBase = () => {
  const envBase = (import.meta.env.VITE_API_BASE_URL || '').trim();
  if (envBase) return envBase.replace(/\/$/, '');

  if (typeof window === 'undefined') {
    return 'http://localhost:5000';
  }

  const { protocol, hostname, port, origin } = window.location;
  const normalizedOrigin = origin.replace(/\/$/, '');
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isPrivateIpv4 =
    /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(hostname);

  if (port === '5000') {
    return normalizedOrigin;
  }

  if (!isLocalhost && !isPrivateIpv4 && !port) {
    return normalizedOrigin;
  }

  return `${protocol}//${hostname}:5000`;
};

export const API_BASE = resolveApiBase();

export const apiFetch = async (endpoint, options = {}) => {
  const hasBody = options.body !== undefined && options.body !== null;
  const headers = { ...(options.headers || {}) };
  const hasContentType = Object.keys(headers).some(
    (key) => key.toLowerCase() === 'content-type'
  );

  if (hasBody && !hasContentType) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok && response.status === 404) {
    if (endpoint.startsWith('/api/energy')) {
      return null;
    }
    if (endpoint.startsWith('/api/history')) {
      return [];
    }
  }

  if (!response.ok) {
    const message =
      typeof data === 'object' && data?.error
        ? data.error
        : `Erreur API (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
};

export const saveCollectionItem = async (collection, payload) => {
  const result = await apiFetch(`/api/data/${collection}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (result && typeof result === 'object' && 'saved' in result) {
    return result.saved;
  }

  return result;
};
