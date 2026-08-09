import { useState, useCallback, useEffect } from 'react';
import { pjpApi } from '../services/api';

// Label hari (Senin-Sabtu) untuk mapping tanggal PJP
const DAY_LABELS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/**
 * useSupervisorRollingMatrix Hook
 * Single Responsibility: Supervisor Weekly Matrix State (Senin-Sabtu), Auto-Rolling Algorithm & Day Reassignments.
 * Data murni dari PostgreSQL (PJP per sales) — bukan mock.
 */
export const useSupervisorRollingMatrix = () => {
  const [matrixRows, setMatrixRows] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null); // { salesId, day, currentData }
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [isAutoRollingModalOpen, setIsAutoRollingModalOpen] = useState(false);

  // Bangun matrix rows dari PJP backend (per sales, per hari)
  useEffect(() => {
    let isMounted = true;
    pjpApi.getAllPjps()
      .then((res) => {
        if (!isMounted) return;
        const pjps = Array.isArray(res?.data) ? res.data : [];
        const bySales = {};
        pjps.forEach((p) => {
          const sid = p.userId || p.user?.id;
          if (!sid) return;
          if (!bySales[sid]) {
            bySales[sid] = {
              salesId: sid,
              salesName: p.user?.name || 'Sales',
              spvName: p.user?.spvName || '-',
              primaryCluster: p.user?.cluster?.name || p.cluster?.name || '-',
              schedule: {},
            };
          }
          const dayLabel = DAY_LABELS[new Date(p.date).getDay()];
          const stops = p.stops || [];
          const firstOutlet = stops[0]?.outlet || {};
          bySales[sid].schedule[dayLabel] = {
            clusterName: p.user?.cluster?.name || p.cluster?.name || p.name || 'RJP',
            outletsCount: stops.length,
            subDistrict: firstOutlet.subDistrict || firstOutlet.address || '-',
          };
        });
        setMatrixRows(Object.values(bySales));
      })
      .catch(() => { });
    return () => { isMounted = false; };
  }, []);

  // Opens modal to reassign a specific day's route for a specific salesman
  const openReassignModal = useCallback((salesId, day, currentData) => {
    setSelectedCell({ salesId, day, currentData });
    setIsReassignModalOpen(true);
  }, []);

  // Save reassigned day route
  const handleSaveDayReassignment = useCallback(({ salesId, day, clusterName, outletsCount, subDistrict }) => {
    setMatrixRows((prev) =>
      prev.map((row) => {
        if (row.salesId !== salesId) return row;
        return {
          ...row,
          schedule: {
            ...row.schedule,
            [day]: {
              clusterName,
              outletsCount: parseInt(outletsCount, 10) || 12,
              subDistrict: subDistrict || 'Area Baru',
            },
          },
        };
      })
    );
    setIsReassignModalOpen(false);
  }, []);

  // Auto-Rolling algorithm: Rotates schedule across sales or cycle
  const handleExecuteAutoRolling = useCallback(() => {
    setMatrixRows((prev) => {
      if (prev.length < 2) return prev;
      // Shift schedules down by 1 salesman in rotation
      const shifted = [...prev];
      const lastSchedule = shifted[shifted.length - 1].schedule;
      for (let i = shifted.length - 1; i > 0; i--) {
        shifted[i] = { ...shifted[i], schedule: shifted[i - 1].schedule };
      }
      shifted[0] = { ...shifted[0], schedule: lastSchedule };
      return shifted;
    });
    setIsAutoRollingModalOpen(false);
  }, []);

  return {
    matrixRows,
    selectedCell,
    isReassignModalOpen,
    setIsReassignModalOpen,
    isAutoRollingModalOpen,
    setIsAutoRollingModalOpen,
    openReassignModal,
    handleSaveDayReassignment,
    handleExecuteAutoRolling,
  };
};
