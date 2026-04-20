import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/api';

export const FACTURES_CHANGED_EVENT = 'factures:changed';

export const emitFacturesChanged = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(FACTURES_CHANGED_EVENT));
};

export const useFactures = ({
  site = null,
  intervalMs = 12000,
  limit = 500,
  enabled = true,
} = {}) => {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    if (site) params.set('site', site);
    return `/api/factures?${params.toString()}`;
  }, [limit, site]);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return [];
    }

    setLoading(true);
    try {
      const result = await apiFetch(endpoint);
      const normalized = Array.isArray(result) ? result : [];
      setFactures(normalized);
      setError(null);
      return normalized;
    } catch (err) {
      console.error('Erreur chargement factures:', err);
      setFactures([]);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [enabled, endpoint]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    const guardedRefresh = async () => {
      const result = await refresh();
      if (!isMounted) return result;
      return result;
    };

    guardedRefresh();
    const interval = window.setInterval(guardedRefresh, intervalMs);
    const onFacturesChanged = () => {
      guardedRefresh();
    };

    window.addEventListener(FACTURES_CHANGED_EVENT, onFacturesChanged);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
      window.removeEventListener(FACTURES_CHANGED_EVENT, onFacturesChanged);
    };
  }, [enabled, intervalMs, refresh]);

  return { factures, setFactures, loading, error, refresh };
};

export default useFactures;
