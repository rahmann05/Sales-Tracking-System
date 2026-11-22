import { useCallback, useEffect, useState } from 'react';
import { saveSession } from '../../../../client/src/services/httpClient';
import { demoApi } from '../services/demoApi';

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('authUser') || 'null');
  } catch {
    return null;
  }
};

export function useDemoController() {
  const [open, setOpen] = useState(() => sessionStorage.getItem('demo_dock_open') === '1');
  const [tab, setTab] = useState(() => sessionStorage.getItem('demo_dock_tab') || 'accounts');
  const [status, setStatus] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [currentUser, setCurrentUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState('');
  const [notice, setNotice] = useState(null);

  const toggleOpen = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      sessionStorage.setItem('demo_dock_open', next ? '1' : '0');
      return next;
    });
  }, []);

  const selectTab = useCallback((nextTab) => {
    setTab(nextTab);
    sessionStorage.setItem('demo_dock_tab', nextTab);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, accountsRes] = await Promise.all([
        demoApi.getStatus(),
        demoApi.getAccounts(),
      ]);
      setStatus(statusRes.data);
      setAccounts(accountsRes.data || []);
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const syncUser = () => setCurrentUser(readStoredUser());
    window.addEventListener('auth:login', syncUser);
    window.addEventListener('auth:logout', syncUser);
    window.addEventListener('auth:expired', syncUser);
    return () => {
      window.removeEventListener('auth:login', syncUser);
      window.removeEventListener('auth:logout', syncUser);
      window.removeEventListener('auth:expired', syncUser);
    };
  }, [load]);

  const switchToUser = useCallback(async (userId) => {
    setBusyAction(`switch:${userId}`);
    setNotice(null);
    try {
      const res = await demoApi.switchAccount(userId);
      saveSession(res.data);
      window.location.assign('/');
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
      setBusyAction('');
    }
  }, []);

  const applyGroups = useCallback(async (nextGroups) => {
    setBusyAction('policy:apply');
    setNotice(null);
    try {
      const res = await demoApi.applyPolicy(nextGroups);
      setStatus((prev) => (prev ? { ...prev, policy: res.data } : prev));
      setNotice({ type: 'success', text: 'Preset constraint demo diperbarui.' });
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setBusyAction('');
    }
  }, []);

  const toggleGroup = useCallback(
    (groupId) => {
      const activeGroups = status?.policy?.activeGroups || {};
      const currentEnabled = Object.keys(activeGroups).filter((id) => activeGroups[id]);
      const next = activeGroups[groupId]
        ? currentEnabled.filter((id) => id !== groupId)
        : [...currentEnabled, groupId];
      return applyGroups(next);
    },
    [status, applyGroups]
  );

  const enableAllGroups = useCallback(() => {
    const allIds = Object.keys(status?.groups || {});
    return applyGroups(allIds);
  }, [status, applyGroups]);

  const restoreNormalPolicy = useCallback(async () => {
    setBusyAction('policy:restore');
    setNotice(null);
    try {
      const res = await demoApi.restorePolicy();
      setStatus((prev) => (prev ? { ...prev, policy: res.data.policy } : prev));
      setNotice({ type: 'success', text: res.message || 'Policy normal dipulihkan.' });
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setBusyAction('');
    }
  }, []);

  const syncPjpForSales = useCallback(async (salesId = null, rebuild = true) => {
    setBusyAction(salesId ? `sync:${salesId}` : 'sync:all');
    setNotice(null);
    try {
      const res = await demoApi.syncTodayPjp({ salesId, rebuild });
      const detail = res.data?.salesName
        ? `PJP ${res.data.salesName}: ${res.data.stopCount} stop siap.`
        : `PJP harian dibuat untuk ${res.data?.createdCount ?? 0} Sales.`;
      setNotice({ type: 'success', text: detail });
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setBusyAction('');
    }
  }, []);

  return {
    open,
    tab,
    status,
    accounts,
    currentUser,
    loading,
    busyAction,
    notice,
    toggleOpen,
    selectTab,
    reload: load,
    switchToUser,
    toggleGroup,
    enableAllGroups,
    restoreNormalPolicy,
    syncPjpForSales,
  };
}
