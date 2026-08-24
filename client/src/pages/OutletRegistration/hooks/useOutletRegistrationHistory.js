import { useState, useEffect, useCallback } from 'react';
import { customerRegistrationsApi } from '../../../services/api';

/**
 * useOutletRegistrationHistory Hook
 * Single Responsibility: Fetch, filter, and manage sales rep's submitted registration history.
 */
export const useOutletRegistrationHistory = () => {
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await customerRegistrationsApi.getAll({ limit: 50 });
      if (res?.data) {
        setSubmissions(res.data);
      }
    } catch (err) {
      console.warn('[OutletRegistrationHistory] Failed to load submissions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    submissions,
    isLoading,
    selectedSubmission,
    setSelectedSubmission,
    refreshHistory: fetchHistory,
  };
};
