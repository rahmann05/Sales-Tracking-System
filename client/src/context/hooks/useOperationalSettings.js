import { useState, useEffect, useCallback } from 'react';
import { configApi } from '../../services/api';
import { CONFIG_DEFAULTS } from '../../../../shared/config.mjs';

export function useOperationalSettings(user) {
  const [settings, setSettings] = useState(CONFIG_DEFAULTS);
  const [settingsReady,setReady]=useState(false);
  const refreshSettings = useCallback(async () => {
    if (!user?.id) return;
    const res = await configApi.getRuntime();
    setSettings({ ...CONFIG_DEFAULTS, ...res.data });
    setReady(true);
  }, [user?.id]);
  useEffect(() => {
    let active = true;
    setSettings(CONFIG_DEFAULTS);
    setReady(false);
    const refresh = async () => {
      if (!user?.id) return;
      try {
        const res = await configApi.getRuntime();
        if (active) {setSettings({ ...CONFIG_DEFAULTS, ...res.data });setReady(true);}
      } catch (error) { if(active)setReady(false);console.warn('Pengaturan belum diperbarui:', error.message); }
    };
    refresh();
    const timer = setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    window.addEventListener('policy:changed',refresh);
    return () => { active = false; clearInterval(timer); window.removeEventListener('focus', refresh);window.removeEventListener('policy:changed',refresh); };
  }, [user?.id]);
  return { settings, settingsReady, refreshSettings };
}
