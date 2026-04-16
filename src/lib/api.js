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
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof data === 'object' && data?.error
        ? data.error
        : `Erreur API (${response.status})`;
    throw new Error(message);
  }

  return data;
};

export const saveCollectionItem = async (collection, payload) =>
  apiFetch(`/api/data/${collection}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
