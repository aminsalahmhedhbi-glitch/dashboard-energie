import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

export const useData = (
  collectionName,
  { intervalMs = 4000, enabled = true, initialData = [] } = {}
) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!enabled || !collectionName) {
      setLoading(false);
      return initialData;
    }

    setLoading(true);
    try {
      const result = await apiFetch(`/api/data/${collectionName}`);
      const normalized = Array.isArray(result) ? result : [];
      setData(normalized);
      setError(null);
      return normalized;
    } catch (err) {
      console.error(`Erreur chargement ${collectionName}:`, err);
      setData(initialData);
      setError(err);
      return initialData;
    } finally {
      setLoading(false);
    }
  }, [collectionName, enabled, initialData]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    const fetchAndGuard = async () => {
      const result = await refresh();
      if (!isMounted) {
        return result;
      }
      return result;
    };

    fetchAndGuard();
    const interval = window.setInterval(fetchAndGuard, intervalMs);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [enabled, intervalMs, refresh]);

  return { data, setData, loading, error, refresh };
};

export default useData;
