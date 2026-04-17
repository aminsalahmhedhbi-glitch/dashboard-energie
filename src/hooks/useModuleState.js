import { useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '../lib/api';

const clone = (value) => JSON.parse(JSON.stringify(value));

export const resolveUpdater = (currentValue, nextValue) =>
  typeof nextValue === 'function' ? nextValue(currentValue) : nextValue;

export function useModuleState(moduleKey, initialData, options = {}) {
  const { seedOnMissing = true, debounceMs = 700 } = options;
  const [data, setDataState] = useState(() => clone(initialData));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const missingStateRef = useRef(false);
  const dirtyRef = useRef(false);

  const setData = (updater) => {
    dirtyRef.current = true;
    setDataState((currentValue) => resolveUpdater(currentValue, updater));
  };

  useEffect(() => {
    let active = true;

    const loadState = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiFetch(`/api/module-states/${moduleKey}`);
        if (!active) return;
        if (response?.data && typeof response.data === 'object') {
          setDataState(response.data);
        }
        missingStateRef.current = false;
      } catch (loadError) {
        if (!active) return;
        const isMissing =
          String(loadError?.message || '').includes('404') ||
          String(loadError?.message || '').toLowerCase().includes('introuvable');

        if (isMissing) {
          setDataState(clone(initialData));
          missingStateRef.current = true;
          if (seedOnMissing) {
            dirtyRef.current = true;
          }
        } else {
          setError(loadError);
          console.error(`Erreur chargement module state ${moduleKey}:`, loadError);
        }
      } finally {
        if (active) {
          setLoading(false);
          setIsReady(true);
        }
      }
    };

    loadState();
    return () => {
      active = false;
    };
  }, [initialData, moduleKey, seedOnMissing]);

  useEffect(() => {
    if (!isReady || !dirtyRef.current) return undefined;

    const timer = window.setTimeout(async () => {
      try {
        await apiFetch(`/api/module-states/${moduleKey}`, {
          method: 'PUT',
          body: JSON.stringify({ data }),
        });
        dirtyRef.current = false;
        missingStateRef.current = false;
        setError(null);
      } catch (saveError) {
        setError(saveError);
        console.error(`Erreur sauvegarde module state ${moduleKey}:`, saveError);
      }
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [data, debounceMs, isReady, moduleKey]);

  const api = useMemo(
    () => ({
      data,
      setData,
      loading,
      error,
      isReady,
      missing: missingStateRef.current,
    }),
    [data, loading, error, isReady]
  );

  return api;
}
