import { useState, useEffect, useCallback } from 'react';
import { customerRegistrationsApi, collectPages } from '../../../services/api';

/**
 * useOutletRegistrationHistory Hook
 * Single Responsibility: Fetch, filter, and manage sales rep's submitted registration history.
 */
export const useOutletRegistrationHistory = () => {
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [historyError,setHistoryError]=useState('');
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await collectPages(customerRegistrationsApi.getAll);
      if (res?.data) {
        setSubmissions(res.data);setHistoryError('');
      }
    } catch (err) {
      setSubmissions([]);setHistoryError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    submissions,historyError,
    isLoading,
    selectedSubmission,
    setSelectedSubmission,
    refreshHistory: fetchHistory,
  };
};
