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
  deliveryStops,
  setDeliveryStops,
  setOffPjpAttendances,
  addNotification,
}) => {
  // Supervisor Action: Validate or Reject Off-PJP Absen
  const handleSupervisorValidateOffPJP = ({ attendanceId, approved }) => {
    const status = approved ? 'TERVALIDASI' : 'DITOLAK';
    setOffPjpAttendances((prev) =>
      prev.map((a) => (a.id === attendanceId ? { ...a, validationStatus: status, spvName: user.name } : a))
    );

    addNotification({
      title: approved ? 'Absen Toko Luar RJP TERVALIDASI' : 'Absen Toko Luar RJP DITOLAK',
      message: `Supervisor ${user.name} mengubah status validasi absen toko luar RJP menjadi ${status}.`,
      roleTarget: ['SALES', 'OPERATIONAL_MANAGER'],
    });
  };

  // Supervisor Action: Skip Outlet
  const handleSupervisorSkipOutlet = (incidentId) => {
    const incident = incidents.find((i) => i.id === incidentId);
    if (!incident) return;

    setIncidents((prev) =>
      prev.map((i) => (i.id === incidentId ? { ...i, status: 'RESOLVED_SKIP', spvName: user.name } : i))
    );

    setSalesStops((prev) =>
      prev.map((s) => (s.id === incident.stopId ? { ...s, status: 'SKIPPED' } : s))
    );

    addNotification({
      title: 'Info Skip Toko (Dari SPV)',
      message: `Supervisor ${user.name} menyetujui pengelewatan (Skip) outlet ${incident.outletName} karena ${incident.reason}.`,
      roleTarget: ['OPERATIONAL_MANAGER'],
    });
  };

  // Supervisor Action: Direct Reroute Sales Route
  const handleSupervisorDirectReroute = ({ incidentId, newOutletName, address, reason }) => {
    const incident = incidents.find((i) => i.id === incidentId);
    if (!incident) return;

    const newStop = {
      id: `stop-dir-reroute-${Date.now()}`,
      sequence: salesStops.length + 1,
      outletCode: `OTL-DIR-${Math.floor(100 + Math.random() * 900)}`,
      outletName: newOutletName || 'Toko Reroute Langsung SPV',
      owner: 'Pemilik Toko Pengganti',
      phone: '0812-3333-4444',
      address: address || 'Jl. Raya Cimahi No. 99',
      latitude: -6.879,
      longitude: 107.548,
      radiusMeters: 50,
      currentDistance: 20,
      status: 'PENDING',
      creditLimit: 10000000,
      outstanding: 0,
      photoUrl: null,
    };

    setSalesStops((prev) => [
      ...prev.map((s) => (s.id === incident.stopId ? { ...s, status: 'SKIPPED' } : s)),
      newStop,
    ]);

    setIncidents((prev) =>
      prev.map((i) =>
        i.id === incidentId
          ? {
              ...i,
              status: 'RESOLVED_DIRECT_REROUTE',
              newOutletName: newStop.outletName,
              rerouteReason: reason,
              spvName: user.name,
            }
          : i
      )
    );

    addNotification({
      title: 'Rute Dialihkan Langsung oleh Supervisor',
      message: `Supervisor ${user.name} mengalihkan kunjungan ${incident.outletName} ke ${newStop.outletName}.`,
      roleTarget: ['SALES', 'OPERATIONAL_MANAGER'],
    });
  };

  // Supervisor Action: Approve Off-PJP Request
  const handleSupervisorApproveOffPJP = ({ requestId, approved }) => {
    const request = incidents.find((i) => i.id === requestId);
    if (!request) return;

    if (approved) {
      const newStop = {
        id: `stop-offpjp-${Date.now()}`,
        sequence: salesStops.length + 1,
        outletCode: `OTL-OFF-${Math.floor(100 + Math.random() * 900)}`,
        outletName: request.outletName,
        owner: 'Pemilik Toko Luar RJP',
        phone: '0812-9999-8888',
        address: request.address,
        latitude: -6.885,
        longitude: 107.55,
        radiusMeters: 50,
        currentDistance: 30,
        status: 'PENDING',
        creditLimit: 10000000,
        outstanding: 0,
        photoUrl: null,
      };

      setSalesStops((prev) => [...prev, newStop]);

      setIncidents((prev) =>
        prev.map((i) =>
          i.id === requestId
            ? { ...i, status: 'RESOLVED_OFFPJP_APPROVED', spvName: user.name }
            : i
        )
      );

      addNotification({
        title: 'Kunjungan Toko Luar RJP Disetujui',
        message: `Supervisor ${user.name} menyetujui kunjungan toko ${request.outletName}. Toko telah ditambahkan ke PJP Sales.`,
        roleTarget: ['SALES', 'OPERATIONAL_MANAGER'],
      });
    } else {
      setIncidents((prev) =>
        prev.map((i) =>
          i.id === requestId
            ? { ...i, status: 'RESOLVED_OFFPJP_REJECTED', spvName: user.name }
            : i
        )
      );
    }
  };

  // Supervisor Action: Request Reroute requiring Ops Manager Approval
  const handleSupervisorRequestReroute = ({ incidentId, newOutletName, reason }) => {
    const incident = incidents.find((i) => i.id === incidentId);
    if (!incident) return;

    setIncidents((prev) =>
      prev.map((i) =>
        i.id === incidentId
          ? {
              ...i,
              status: 'RESOLVED_REROUTE_PENDING_OPS',
              newOutletName,
              rerouteReason: reason,
              spvName: user.name,
            }
          : i
      )
    );

    addNotification({
      title: 'Permohonan Approval Perubahan Rute',
      message: `SPV ${user.name} mengajukan pengalihan rute dari ${incident.outletName} ke ${newOutletName}. Menunggu approval Manajer Operasional.`,
      roleTarget: ['OPERATIONAL_MANAGER'],
    });
  };

  // Supervisor Action: Approve Unlock Request
  const handleApproveUnlockRequest = (requestId, stopId, userRole) => {
    setIncidents((prev) =>
      prev.map((i) => (i.id === requestId ? { ...i, status: 'APPROVED' } : i))
    );

    if (userRole === 'SALES' && setSalesStops) {
      setSalesStops((prev) =>
        prev.map((s) => (s.id === stopId ? { ...s, unlockedByAdmin: true } : s))
      );
    } else if (setDeliveryStops) {
      setDeliveryStops((prev) =>
        prev.map((s) => (s.id === stopId ? { ...s, unlockedByAdmin: true } : s))
      );
    }

    addNotification({
      title: 'Permintaan Unlock Disetujui Supervisor',
      message: `Supervisor ${user.name} telah membuka kunci (Unlock) outlet untuk akses presensi.`,
      roleTarget: ['SALES', 'DRIVER', 'HELPER'],
    });
  };

  // Supervisor Action: Reject Unlock Request
  const handleRejectUnlockRequest = (requestId) => {
    setIncidents((prev) =>
      prev.map((i) => (i.id === requestId ? { ...i, status: 'REJECTED' } : i))
    );

    addNotification({
      title: 'Permintaan Unlock Ditolak',
      message: `Permintaan unlock outlet telah ditolak oleh Supervisor.`,
      roleTarget: ['SALES', 'DRIVER', 'HELPER'],
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
  };
};
