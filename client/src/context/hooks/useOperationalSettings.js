import { useState, useEffect, useCallback } from 'react';
import { configApi } from '../../services/api';
import { CONFIG_DEFAULTS } from '../../../../shared/config.mjs';

export function useOperationalSettings(user) {
  const [settings, setSettings] = useState(CONFIG_DEFAULTS);
  const refreshSettings = useCallback(async () => {
    if (!user?.id) return;
    const res = await configApi.getRuntime();
    setSettings({ ...CONFIG_DEFAULTS, ...res.data });
  }, [user?.id]);
  useEffect(() => {
    let active = true;
    setSettings(CONFIG_DEFAULTS);
    const refresh = async () => {
      if (!user?.id) return;
      try {
        const res = await configApi.getRuntime();
        if (active) setSettings({ ...CONFIG_DEFAULTS, ...res.data });
      } catch (error) { console.warn('Pengaturan belum diperbarui:', error.message); }
    };
    refresh();
    const timer = setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    return () => { active = false; clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [user?.id]);
  return { settings, refreshSettings };
}
