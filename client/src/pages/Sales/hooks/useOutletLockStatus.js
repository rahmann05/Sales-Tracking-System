import {useApp} from '../../../context/AppContext';
import { useMemo } from 'react';

/**
 * useOutletLockStatus Hook
 * Single Responsibility: Evaluate if a specific outlet is locked, active in-visit, or accessible for attendance.
 */
export const useOutletLockStatus = (currentStop, allStops = []) => {
  const {user,incidents,settings}=useApp();
  return useMemo(() => {
    if (!currentStop) {
      return { isLocked: false, activeVisitingStop: null, lockReason: '' };
    }

    // Find any stop that is currently checked-in (Absen In) but not yet Absen Out
    const activeVisitingStop = allStops.find(
      (s) => ['ARRIVED', 'IN_VISIT', 'ORDERED'].includes(s.status) && s.id !== currentStop.id
    );

    if (activeVisitingStop) {
      return {
        isLocked: currentStop.status === 'PENDING',
        activeVisitingStop,
        lockReason: `Selesaikan Absen Out di "${activeVisitingStop.outletName}" terlebih dahulu sebelum membuka outlet lain.`,
      };
    }

    const hasException=(incidents||[]).some(r=>r.outletId===currentStop.outletId&&r.requestedBy===user?.id&&r.status==='APPROVED'&&new Date(r.expiresAt)>new Date());
    if(['LOCKED','UNLOCK_REQUESTED'].includes(currentStop.lockStatus)&&!hasException) return {isLocked:true,activeVisitingStop:null,lockReason:'Outlet terkunci. Ajukan pengecualian kepada supervisor.'};
    const earlier=allStops.find(s=>s.sequence<currentStop.sequence&&(['PENDING','ARRIVED','ORDERED'].includes(s.status)||(!settings.ALLOW_CONTINUE_PENDING_CLOSED&&s.status==='CLOSED_REPORTED')));
    if(settings.ATTENDANCE_ENFORCE_SEQUENCE&&earlier&&currentStop.status==='PENDING') return {isLocked:true,activeVisitingStop:null,lockReason:`Selesaikan toko urutan ${earlier.sequence} terlebih dahulu.`};
    return {
      isLocked: false,
      activeVisitingStop: null,
      lockReason: '',
    };
  }, [currentStop, allStops,incidents,user,settings]);
};
