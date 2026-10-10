import {DependencyList, useCallback, useEffect, useRef, useState} from 'react';
import {getErrorMessage} from '@/utils/errors';

/**
 * Runs `fn` on mount (and when `deps` change). `reload` re-runs it as a pull-to-refresh, keeping
 * the current data on screen while it loads.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(async () => {
    try {
      setData(await fnRef.current());
      setError(null);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    run().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const reload = useCallback(async () => {
    setRefreshing(true);
    await run();
    setRefreshing(false);
  }, [run]);

  return {data, setData, loading, refreshing, error, reload};
}
