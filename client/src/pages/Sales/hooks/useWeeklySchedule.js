import { useEffect, useState } from 'react';
import { clustersApi } from '../../../services/api';

const DAYS = [
  { key: 'senin', label: 'Senin' },
  { key: 'selasa', label: 'Selasa' },
  { key: 'rabu', label: 'Rabu' },
  { key: 'kamis', label: 'Kamis' },
  { key: 'jumat', label: 'Jumat' },
  { key: 'sabtu', label: 'Sabtu' },
];

const todayKey = () => {
  const d = new Date().getDay(); // 0=Minggu
  return d === 0 ? null : DAYS[d - 1]?.key;
};

/**
 * useWeeklySchedule
 * Fetch jadwal mingguan sales dari API clusters, per hari.
 * Mengembalikan data per hari untuk tab navigasi.
 */
export const useWeeklySchedule = (salesId) => {
  const [schedule, setSchedule] = useState({}); // { senin: {...cluster}, selasa: {...} }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!salesId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true); setError('');
      try {
        // Fetch semua hari sekaligus
        const results = await Promise.all(
          DAYS.map(async ({ key }) => {
            try {
              const res = await clustersApi.getAll({ day: key, salesId });
              const list = Array.isArray(res) ? res : (res?.data || []);
              if (list.length === 0) return { key, cluster: null };
              const detail = await clustersApi.getById(list[0].id);
              return { key, cluster: detail?.data || detail };
            } catch {
              return { key, cluster: null };
            }
          })
        );
        if (!cancelled) {
          const map = {};
          results.forEach(({ key, cluster }) => { map[key] = cluster; });
          setSchedule(map);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Gagal memuat jadwal');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [salesId]);

  const daysWithData = DAYS.map(({ key, label }) => ({
    key,
    label,
    cluster: schedule[key] || null,
    outletCount: (schedule[key]?.pjps || []).reduce((n, p) => n + (p.stops?.length || 0), 0),
  }));

  const activeDay = todayKey();

  return { daysWithData, activeDay, loading, error };
};
