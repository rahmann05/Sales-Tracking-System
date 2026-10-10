import { useCallback, useMemo } from 'react';
import { routeChangesApi, absensiApi, outletsApi } from '../../../services/api';

/**
 * Custom hook containing all business logic for Supervisor actions.
 * Single Responsibility: Supervisor validations, skips, reroutes, and unlock approvals.
 */
export const useSupervisorActions = ({
  user,
  incidents,
  setIncidents,
  salesStops,
  setSalesStops,
  setOffPjpAttendances,
  addNotification,
}) => {
  // Supervisor Action: Validate or Reject Off-PJP Absen
  const handleSupervisorValidateOffPJP = useCallback(async ({ attendanceId, approved, rejectionNote }) => {
    try {
      const res = await absensiApi.validateOffPjp(attendanceId, approved, rejectionNote);

      const status = approved ? 'TERVALIDASI' : 'DITOLAK';
      setOffPjpAttendances((prev) =>
        prev.map((a) => (a.id === attendanceId ? { ...a, ...res.data, status:approved ? 'APPROVED' : 'REJECTED', validationStatus: status, spvName: user?.name || 'Supervisor' } : a))
      );

      addNotification({
        title: approved ? 'Absen Toko Luar RJP TERVALIDASI' : 'Absen Toko Luar RJP DITOLAK',
        message: `Supervisor ${user?.name || 'Supervisor'} mengubah status validasi absen toko luar RJP menjadi ${status}.`,
        roleTarget: ['SALES', 'ADMIN'],
      });
    } catch (err) {
      console.warn('[API] Validate Off PJP error:', err.message);
      addNotification({
        title: 'Gagal Validasi Off PJP',
        message: err.message,
        roleTarget: ['SUPERVISOR'],
      });
      return false;
    }
  }, [user?.name, setOffPjpAttendances, addNotification]);

  // Supervisor Action: Skip Outlet
  const handleSupervisorSkipOutlet = useCallback(async (incidentId) => {
    try {
      const incident = incidents.find(i=>i.id===incidentId);
      if (!incident) throw new Error('Kendala tidak ditemukan. Muat ulang data.');

      const res=await routeChangesApi.skip(incidentId),pending=res.data.routeChangeRequest.status==='PENDING_APPROVAL';

      setIncidents((prev) =>
        prev.map((i) => (i.id === incidentId ? { ...i, status:pending?'PENDING_ADMIN':'RESOLVED_SKIP', spvName: user?.name || 'Supervisor' } : i))
      );

      setSalesStops((prev) =>
        prev.map((s) => (s.id === incident.stopId ? { ...s, status:pending?'CLOSED_REPORTED':'SKIPPED' } : s))
      );

      addNotification({
        title: 'Info Skip Toko (Dari SPV)',
        message: `Supervisor ${user?.name || 'Supervisor'} menyetujui pengelewatan (Skip) outlet karena ${incident.reason || 'kendala'}.`,
        roleTarget: ['SUPERVISOR', 'ADMIN'],
      });
    } catch (err) {
      console.warn('[API] Skip Outlet error:', err.message);
      addNotification({
        title: 'Gagal Melakukan Skip',
        message: err.message,
        roleTarget: ['SUPERVISOR'],
      });
      return false;
    }
  }, [user?.name, incidents, setIncidents, setSalesStops, addNotification]);

  // Supervisor Action: Direct Reroute Sales Route
  const handleSupervisorDirectReroute = useCallback(async ({ incidentId, replacementOutletId, reason }) => {
    try {
      const incident = incidents.find(i=>i.id===incidentId);
      if (!incident) throw new Error('Kendala tidak ditemukan. Muat ulang data.');

      const res = await routeChangesApi.reroute(incidentId, replacementOutletId, reason);
      const createdStop = res?.data?.createdPjpStop || null;
      const replacementOutlet = createdStop?.outlet || res?.data?.routeChangeRequest?.replacementOutlet || null;

      if (createdStop && setSalesStops) {
        setSalesStops((prev) => {
          const maxSeq = Math.max(...prev.map((s) => s.sequence || 0), 0);
          const newStop = {
            id: createdStop.id,
            outletId: createdStop.outletId || replacementOutlet?.id || null,
            pjpId: createdStop.pjpId,
            sequence: createdStop.sequence || maxSeq + 1,
            outletName: replacementOutlet?.name || 'Toko Pengganti',
            customerName: replacementOutlet?.name || 'Toko Pengganti',
            owner: replacementOutlet?.ownerName || '',
            phone: replacementOutlet?.phone || '',
            address: replacementOutlet?.address || '',
            type: replacementOutlet?.type || 'MODERN_TRADE',
            latitude: Number(replacementOutlet?.latitude) || null,
            longitude: Number(replacementOutlet?.longitude) || null,
            radiusMeters: replacementOutlet?.radiusMeters || 50,
            status: 'PENDING',
            isReroute: true,
          };
          return [
            ...prev.map((s) => (s.id === incident.stopId ? { ...s, status: 'SKIPPED' } : s)),
            newStop,
          ];
        });
      }

      setIncidents((prev) =>
        prev.map((i) =>
          i.id === incidentId
            ? {
                ...i,
                status: res?.data?.routeChangeRequest?.status || (createdStop ? 'RESOLVED_DIRECT_REROUTE' : 'PENDING_ADMIN'),
                rerouteReason: reason,
                newOutletName: replacementOutlet?.name || null,
                spvName: user?.name || 'Supervisor',
              }
            : i
        )
      );

      addNotification({
        title: createdStop ? 'Rute dialihkan' : 'Usulan reroute menunggu admin',
        message: createdStop ? 'Toko pengganti ditambahkan ke jadwal.' : 'PJP akan diperbarui setelah persetujuan admin.',
        roleTarget: ['SALES', 'ADMIN'],
      });
      return {pending:!createdStop};
    } catch (err) {
      console.warn('[API] Direct Reroute error:', err.message);
      addNotification({
        title: 'Gagal Reroute Langsung',
        message: err.message,
        roleTarget: ['SUPERVISOR'],
      });
      return false;
    }
  }, [user?.name, incidents, setIncidents, setSalesStops, addNotification]);

  // Supervisor Action: Approve Off-PJP Request
  const handleSupervisorApproveOffPJP = useCallback(async ({ requestId, approved }) => {
    try {
      const res = await absensiApi.validateOffPjp(requestId, approved);
      const updatedRecord = res.data;

      if (approved && updatedRecord?.createdPjpStop) {
        setSalesStops((prev) => [...prev, updatedRecord.createdPjpStop]);
      }

      setIncidents((prev) =>
        prev.map((i) =>
          i.id === requestId
            ? { ...i, status: approved ? 'RESOLVED_OFFPJP_APPROVED' : 'RESOLVED_OFFPJP_REJECTED', spvName: user?.name || 'Supervisor' }
            : i
        )
      );

      addNotification({
        title: approved ? 'Kunjungan Toko Luar RJP Disetujui' : 'Kunjungan Toko Luar RJP Ditolak',
        message: `Supervisor ${user?.name || 'Supervisor'} ${approved ? 'menyetujui' : 'menolak'} kunjungan toko luar RJP.`,
        roleTarget: ['SALES', 'ADMIN'],
      });
    } catch (err) {
      console.warn('[API] Approve Off PJP error:', err.message);
      addNotification({
        title: 'Gagal Memproses Off-PJP',
        message: err.message,
        roleTarget: ['SUPERVISOR'],
      });
      return false;
    }
  }, [user?.name, setSalesStops, setIncidents, addNotification]);

  // Supervisor Action: Reroute (diserahkan sepenuhnya ke SPV tanpa eskalasi Ops)
  const handleSupervisorRequestReroute = useCallback(async (payload) => {
    return handleSupervisorDirectReroute(payload);
  }, [handleSupervisorDirectReroute]);

  // Supervisor Action: Approve Unlock Request
  const handleApproveUnlockRequest = useCallback(async (requestId, stopId) => {
    try {
      await outletsApi.handleUnlockRequest(requestId, true);

      setIncidents((prev) =>
        prev.map((i) => (i.id === requestId ? { ...i, status: 'APPROVED' } : i))
      );

      if (setSalesStops) {
        setSalesStops((prev) =>
          prev.map((s) => (s.id === stopId ? { ...s, unlockedByAdmin: true } : s))
        );
      }

      addNotification({
        title: 'Permintaan Unlock Disetujui Supervisor',
        message: `Supervisor ${user?.name || 'Supervisor'} telah membuka kunci (Unlock) outlet untuk akses presensi.`,
        roleTarget: ['SALES'],
      });
    } catch (err) {
      console.warn('[API] Approve unlock error:', err.message);
      addNotification({
        title: 'Gagal Buka Kunci',
        message: err.message,
        roleTarget: ['SUPERVISOR'],
      });
      return false;
    }
  }, [user?.name, incidents, setIncidents, setSalesStops, addNotification]);

  // Supervisor Action: Reject Unlock Request
  const handleRejectUnlockRequest = useCallback(async (requestId) => {
    try {
      await outletsApi.handleUnlockRequest(requestId, false);

      setIncidents((prev) =>
        prev.map((i) => (i.id === requestId ? { ...i, status: 'REJECTED' } : i))
      );

      addNotification({
        title: 'Permintaan Unlock Ditolak',
        message: `Permintaan unlock outlet telah ditolak oleh Supervisor.`,
        roleTarget: ['SALES'],
      });
    } catch (err) {
      console.warn('[API] Reject unlock error:', err.message);
    }
  }, [setIncidents, addNotification]);

  // Supervisor Action: Create RJP Team
  const handleCreateRjpTeam = useCallback(async () => {
    addNotification({
      title: 'Fitur Belum Tersedia',
      message: 'Pembuatan Tim RJP saat ini harus melalui sinkronisasi database secara langsung.',
      roleTarget: ['SUPERVISOR', 'ADMIN'],
    });
  }, [addNotification]);

  // Supervisor Action: Create Master Route
  const handleCreateMasterRoute = useCallback(async () => {
    addNotification({
      title: 'Fitur Belum Tersedia',
      message: 'Pembuatan Master Route saat ini harus melalui sinkronisasi database secara langsung.',
      roleTarget: ['SUPERVISOR', 'ADMIN'],
    });
  }, [addNotification]);

  return useMemo(() => ({
    handleSupervisorValidateOffPJP,
    handleSupervisorSkipOutlet,
    handleSupervisorDirectReroute,
    handleSupervisorApproveOffPJP,
    handleSupervisorRequestReroute,
    handleApproveUnlockRequest,
    handleRejectUnlockRequest,
    handleCreateRjpTeam,
    handleCreateMasterRoute,
  }), [
    handleSupervisorValidateOffPJP,
    handleSupervisorSkipOutlet,
    handleSupervisorDirectReroute,
    handleSupervisorApproveOffPJP,
    handleSupervisorRequestReroute,
    handleApproveUnlockRequest,
    handleRejectUnlockRequest,
    handleCreateRjpTeam,
    handleCreateMasterRoute,
  ]);
};
