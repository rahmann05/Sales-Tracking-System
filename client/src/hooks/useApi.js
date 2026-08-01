import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to execute API calls with loading, error, and data state management
 */
export function useApi(apiFunc, autoExecute = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(autoExecute);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFunc(...args);
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat memuat data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunc]);

  useEffect(() => {
    if (autoExecute) {
      execute();
    }
  }, [autoExecute, execute]);

  return { data, loading, error, refetch: execute };
}
