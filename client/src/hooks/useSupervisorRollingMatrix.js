import { useState, useCallback } from 'react';

/**
 * Initial mock rolling matrix rows per salesman
 */
const INITIAL_ROLLING_ROWS = [
  {
    salesId: 'sales-1',
    salesName: 'Budi Santoso',
    spvName: 'Ahmad Subagja',
    primaryCluster: 'Klaster Cimahi Tengah & Utara',
    schedule: {
      Senin: { clusterName: 'Cimahi Selatan (Cibeureum)', outletsCount: 16, subDistrict: 'Cibeureum' },
      Selasa: { clusterName: 'Cimahi Tengah (Alun-Alun)', outletsCount: 16, subDistrict: 'Cimahi' },
      Rabu: { clusterName: 'Cimahi Utara (Cibabat)', outletsCount: 15, subDistrict: 'Cibabat' },
      Kamis: { clusterName: 'Cimahi Selatan (Leuwigajah)', outletsCount: 16, subDistrict: 'Leuwigajah' },
      Jumat: { clusterName: 'Cimahi Tengah (Karangmekar)', outletsCount: 14, subDistrict: 'Karangmekar' },
      Sabtu: { clusterName: 'Rolling / Follow-up Khusus', outletsCount: 8, subDistrict: 'Cimahi' },
    },
  },
  {
    salesId: 'sales-2',
    salesName: 'Siti Rahma',
    spvName: 'Ahmad Subagja',
    primaryCluster: 'Klaster Padalarang & Ngamprah',
    schedule: {
      Senin: { clusterName: 'Padalarang Timur (Kertamulya)', outletsCount: 15, subDistrict: 'Padalarang' },
      Selasa: { clusterName: 'Ngamprah Barat (Cilame)', outletsCount: 16, subDistrict: 'Ngamprah' },
      Rabu: { clusterName: 'Batujajar (Galanggang)', outletsCount: 14, subDistrict: 'Batujajar' },
      Kamis: { clusterName: 'Padalarang Kota (Stasiun)', outletsCount: 15, subDistrict: 'Padalarang' },
      Jumat: { clusterName: 'Ngamprah Pusat (Mekarsari)', outletsCount: 14, subDistrict: 'Ngamprah' },
      Sabtu: { clusterName: 'Rolling / Follow-up Khusus', outletsCount: 6, subDistrict: 'Padalarang' },
    },
  },
  {
    salesId: 'sales-3',
    salesName: 'Agus Wijaya',
    spvName: 'Budi Kurniawan',
    primaryCluster: 'Klaster Lembang & Parongpong',
    schedule: {
      Senin: { clusterName: 'Lembang Barat (Jayagiri)', outletsCount: 14, subDistrict: 'Lembang' },
      Selasa: { clusterName: 'Parongpong (Cihanjuang)', outletsCount: 15, subDistrict: 'Parongpong' },
      Rabu: { clusterName: 'Cisarua (Kertawangi)', outletsCount: 13, subDistrict: 'Cisarua' },
      Kamis: { clusterName: 'Lembang Timur (Kayuambon)', outletsCount: 14, subDistrict: 'Lembang' },
      Jumat: { clusterName: 'Parongpong (Sariwangi)', outletsCount: 13, subDistrict: 'Parongpong' },
      Sabtu: { clusterName: 'Rolling / Follow-up Khusus', outletsCount: 6, subDistrict: 'Lembang' },
    },
  },
];

/**
 * useSupervisorRollingMatrix Hook
 * Single Responsibility: Supervisor Weekly Matrix State (Senin-Sabtu), Auto-Rolling Algorithm & Day Reassignments.
 * 1 File = 1 Logic Hook
 */
export const useSupervisorRollingMatrix = () => {
  const [matrixRows, setMatrixRows] = useState(INITIAL_ROLLING_ROWS);
  const [selectedCell, setSelectedCell] = useState(null); // { salesId, day, currentData }
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [isAutoRollingModalOpen, setIsAutoRollingModalOpen] = useState(false);

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
