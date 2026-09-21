import { routeChangesApi, absensiApi, outletsApi } from '../services/api';

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
  const handleSupervisorValidateOffPJP = async ({ attendanceId, approved, rejectionNote }) => {
    try {
      await absensiApi.validateOffPjp(attendanceId, approved, rejectionNote);

      const status = approved ? 'TERVALIDASI' : 'DITOLAK';
      setOffPjpAttendances((prev) =>
        prev.map((a) => (a.id === attendanceId ? { ...a, validationStatus: status, spvName: user.name } : a))
      );

      addNotification({
        title: approved ? 'Absen Toko Luar RJP TERVALIDASI' : 'Absen Toko Luar RJP DITOLAK',
        message: `Supervisor ${user.name} mengubah status validasi absen toko luar RJP menjadi ${status}.`,
        roleTarget: ['SALES', 'ADMIN'],
      });
    } catch (err) {
      console.warn('[API] Validate Off PJP error:', err.message);
      addNotification({
        title: 'Gagal Validasi Off PJP',
        message: err.message,
        roleTarget: ['SUPERVISOR'],
      });
    }
  };

  // Supervisor Action: Skip Outlet
  const handleSupervisorSkipOutlet = async (incidentId) => {
    try {
      const incident = incidents.find((i) => i.id === incidentId);
      if (!incident) return;

      const res = await routeChangesApi.skip(incidentId);

      setIncidents((prev) =>
        prev.map((i) => (i.id === incidentId ? { ...i, status: 'RESOLVED_SKIP', spvName: user.name } : i))
      );

      setSalesStops((prev) =>
        prev.map((s) => (s.id === incident.stopId ? { ...s, status: 'SKIPPED' } : s))
      );

      addNotification({
        title: 'Info Skip Toko (Dari SPV)',
        message: `Supervisor ${user.name} menyetujui pengelewatan (Skip) outlet karena ${incident.reason || 'kendala'}.`,
        roleTarget: ['SUPERVISOR', 'ADMIN'],
      });
    } catch (err) {
      console.warn('[API] Skip Outlet error:', err.message);
      addNotification({
        title: 'Gagal Melakukan Skip',
        message: err.message,
        roleTarget: ['SUPERVISOR'],
      });
    }
  };

  // Supervisor Action: Direct Reroute Sales Route
  const handleSupervisorDirectReroute = async ({ incidentId, replacementOutletId, reason }) => {
    try {
      const incident = incidents.find((i) => i.id === incidentId);
      if (!incident) return;

      const res = await routeChangesApi.reroute(incidentId, replacementOutletId, reason);
      // Server returns { routeChangeRequest, createdPjpStop } (Prisma shapes)
      const createdStop = res?.data?.createdPjpStop || null;
      const replacementOutlet = createdStop?.outlet || res?.data?.routeChangeRequest?.replacementOutlet || null;

      if (createdStop && setSalesStops) {
        const maxSeq = Math.max(...salesStops.map((s) => s.sequence || 0), 0);
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
        setSalesStops((prev) => [
          ...prev.map((s) => (s.id === incident.stopId ? { ...s, status: 'SKIPPED' } : s)),
          newStop,
        ]);
      }

      setIncidents((prev) =>
        prev.map((i) =>
          i.id === incidentId
            ? {
                ...i,
                status: 'RESOLVED_DIRECT_REROUTE',
                rerouteReason: reason,
                newOutletName: replacementOutlet?.name || null,
                spvName: user.name,
              }
            : i
        )
      );

      addNotification({
        title: 'Rute Dialihkan Langsung oleh Supervisor',
        message: `Supervisor ${user.name} mengalihkan kunjungan langsung ke toko pengganti.`,
        roleTarget: ['SALES', 'ADMIN'],
      });
    } catch (err) {
      console.warn('[API] Direct Reroute error:', err.message);
      addNotification({
        title: 'Gagal Reroute Langsung',
        message: err.message,
        roleTarget: ['SUPERVISOR'],
      });
    }
  };

  // Supervisor Action: Approve Off-PJP Request
  const handleSupervisorApproveOffPJP = async ({ requestId, approved }) => {
    try {
      const res = await absensiApi.validateOffPjp(requestId, approved);
      const updatedRecord = res.data;

      if (approved && updatedRecord?.createdPjpStop) {
        setSalesStops((prev) => [...prev, updatedRecord.createdPjpStop]);
      }

      setIncidents((prev) =>
        prev.map((i) =>
          i.id === requestId
            ? { ...i, status: approved ? 'RESOLVED_OFFPJP_APPROVED' : 'RESOLVED_OFFPJP_REJECTED', spvName: user.name }
            : i
        )
      );

      addNotification({
        title: approved ? 'Kunjungan Toko Luar RJP Disetujui' : 'Kunjungan Toko Luar RJP Ditolak',
        message: `Supervisor ${user.name} ${approved ? 'menyetujui' : 'menolak'} kunjungan toko luar RJP.`,
        roleTarget: ['SALES', 'ADMIN'],
      });
    } catch (err) {
      console.warn('[API] Approve Off PJP error:', err.message);
      addNotification({
        title: 'Gagal Memproses Off-PJP',
        message: err.message,
        roleTarget: ['SUPERVISOR'],
      });
    }
  };

  // Supervisor Action: Reroute (diserahkan sepenuhnya ke SPV tanpa eskalasi Ops)
  const handleSupervisorRequestReroute = async (payload) => {
    return handleSupervisorDirectReroute(payload);
  };

  // Supervisor Action: Approve Unlock Request
  const handleApproveUnlockRequest = async (requestId, stopId) => {
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
        message: `Supervisor ${user.name} telah membuka kunci (Unlock) outlet untuk akses presensi.`,
        roleTarget: ['SALES'],
      });
    } catch (err) {
      console.warn('[API] Approve unlock error:', err.message);
      addNotification({
        title: 'Gagal Buka Kunci',
        message: err.message,
        roleTarget: ['SUPERVISOR'],
      });
    }
  };

  // Supervisor Action: Reject Unlock Request
  const handleRejectUnlockRequest = async (requestId) => {
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
  };

  // Supervisor Action: Create RJP Team
  const handleCreateRjpTeam = async (payload) => {
    addNotification({
      title: 'Fitur Belum Tersedia',
      message: 'Pembuatan Tim RJP saat ini harus melalui sinkronisasi database secara langsung.',
      roleTarget: ['SUPERVISOR', 'ADMIN'],
    });
  };

  // Supervisor Action: Create Master Route
  const handleCreateMasterRoute = async (payload) => {
    addNotification({
      title: 'Fitur Belum Tersedia',
      message: 'Pembuatan Master Route saat ini harus melalui sinkronisasi database secara langsung.',
      roleTarget: ['SUPERVISOR', 'ADMIN'],
    });
  };

  return {
    handleSupervisorValidateOffPJP,
    handleSupervisorSkipOutlet,
    handleSupervisorDirectReroute,
    handleSupervisorApproveOffPJP,
    handleSupervisorRequestReroute,
    handleApproveUnlockRequest,
    handleRejectUnlockRequest,
    handleCreateRjpTeam,
    handleCreateMasterRoute,
  };
};
