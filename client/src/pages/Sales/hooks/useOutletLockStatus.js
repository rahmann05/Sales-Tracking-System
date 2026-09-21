import { useMemo } from 'react';

/**
 * useOutletLockStatus Hook
 * Single Responsibility: Evaluate if a specific outlet is locked, active in-visit, or accessible for attendance.
 */
export const useOutletLockStatus = (currentStop, allStops = []) => {
  return useMemo(() => {
    if (!currentStop) {
      return { isLocked: false, activeVisitingStop: null, lockReason: '' };
    }

    // If this outlet has already been unlocked by Admin/Supervisor override
    if (currentStop.unlockedByAdmin) {
      return { isLocked: false, activeVisitingStop: null, lockReason: '' };
    }

    // Find any stop that is currently checked-in (Absen In) but not yet Absen Out
    const activeVisitingStop = allStops.find(
      (s) => (s.status === 'ARRIVED' || s.status === 'IN_VISIT') && s.id !== currentStop.id
    );

    if (activeVisitingStop) {
      return {
        isLocked: currentStop.status === 'PENDING',
        activeVisitingStop,
        lockReason: `Selesaikan Absen Out di "${activeVisitingStop.outletName}" terlebih dahulu sebelum membuka outlet lain.`,
      };
    }

    return {
      isLocked: false,
      activeVisitingStop: null,
      lockReason: '',
    };
  }, [currentStop, allStops]);
};
