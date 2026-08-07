/**
 * Custom hook containing all business logic for Sales actions.
 * Single Responsibility: Sales Rep business workflows (Absen In, Absen Out, Orders, Closed Reports, Off-PJP, Unlock Requests).
 */
export const useSalesActions = ({
  user,
  salesStops,
  setSalesStops,
  setOrders,
  setOffPjpAttendances,
  setIncidents,
  addNotification,
}) => {
  // Absen In Outlet (Sales Check-In)
  const handleSalesAbsenIn = (stopId, payload = {}) => {
    const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    setSalesStops((prev) =>
      prev.map((s) =>
        s.id === stopId
          ? {
              ...s,
              status: 'ARRIVED',
              checkInTime: timeNow,
              checkInPhoto: payload.photoUrl || null,
              checkInGps: payload.gpsLocation || null,
              checkInNotes: payload.notes || 'Kunjungan Rutin',
            }
          : s
      )
    );
  };

  // Absen Out Outlet (Sales Check-Out)
  const handleSalesAbsenOut = (stopId, payload = {}) => {
    const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    setSalesStops((prev) =>
      prev.map((s) =>
        s.id === stopId
          ? {
              ...s,
              status: 'VISITED',
              checkOutTime: timeNow,
              checkOutPhoto: payload.photoUrl || null,
              checkOutGps: payload.gpsLocation || null,
              checkOutNotes: payload.notes || 'Kunjungan Selesai',
            }
          : s
      )
    );
  };

  // Submit Order (Sales)
  const handleSubmitOrder = ({ stopId, items, paymentType, totalAmount }) => {
    const stop = salesStops.find((s) => s.id === stopId);
    const newOrder = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      dailyStopId: stopId,
      outletName: stop ? stop.outletName : 'Unknown Outlet',
      salesName: user.name,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      totalAmount,
      paymentType,
      status: 'PENDING_APPROVAL',
      creditLimit: stop?.creditLimit || 15000000,
      outstanding: stop?.outstanding || 3500000,
      items,
    };

    setOrders((prev) => [newOrder, ...prev]);

    setSalesStops((prev) =>
      prev.map((s) => (s.id === stopId ? { ...s, status: 'ORDERED' } : s))
    );

    addNotification({
      title: 'Order Baru Menunggu Approval',
      message: `Sales ${user.name} menginput order ${newOrder.id} (${stop?.outletName}) sebesar Rp ${totalAmount.toLocaleString('id-ID')}`,
      roleTarget: ['SUPERVISOR', 'ADMIN'],
    });
  };

  // Report Closed Outlet (Sales -> SPV)
  const handleReportClosedOutlet = ({ stopId, reason, photoUrl }) => {
    const stop = salesStops.find((s) => s.id === stopId);
    const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    const newIncident = {
      id: `inc-${Date.now()}`,
      type: 'CLOSED_SHOP',
      stopId,
      outletName: stop?.outletName,
      salesName: user.name,
      spvName: 'Ahmad Subagja',
      spvTeam: 'Tim SPV Ahmad Subagja (Cimahi - KBB)',
      reason,
      photoUrl,
      reportedAt: timeNow,
      status: 'PENDING_SPV',
    };

    setIncidents((prev) => [newIncident, ...prev]);
    setSalesStops((prev) =>
      prev.map((s) => (s.id === stopId ? { ...s, status: 'CLOSED', checkOutTime: timeNow } : s))
    );

    addNotification({
      title: 'Laporan Toko Tutup',
      message: `Sales ${user.name} melaporkan Toko Tutup: ${stop?.outletName}. Membutuhkan penanganan SPV.`,
      roleTarget: ['SUPERVISOR'],
    });
  };

  // Sales Action: Request Unlock for Locked Outlet
  const handleRequestUnlockOutlet = ({ stopId, outletName, address, activeVisitingOutlet, reason }) => {
    const newRequest = {
      id: `unlock-req-${Date.now()}`,
      type: 'UNLOCK_REQUEST',
      stopId,
      outletName,
      address,
      userRole: 'SALES',
      userName: user.name,
      activeVisitingOutlet,
      reason,
      requestedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      status: 'PENDING',
    };

    setIncidents((prev) => [newRequest, ...prev]);

    addNotification({
      title: 'Permintaan Buka Kunci (Unlock) Outlet',
      message: `Sales ${user.name} meminta unlock outlet "${outletName}". Alasan: ${reason}`,
      roleTarget: ['ADMIN', 'SUPERVISOR'],
    });
  };

  // Sales Action: Absen / Check-In at Off-PJP Outlet
  const handleSalesAbsenOffPJP = ({ outletName, address, reason, photoUrl }) => {
    const newAbsen = {
      id: `absen-off-${Date.now()}`,
      salesName: user.name,
      outletName,
      address,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      photoUrl,
      reason,
      spvName: 'Ahmad Subagja',
      spvTeam: 'Tim SPV Ahmad Subagja (Cimahi - KBB)',
      validationStatus: 'TIDAK_TERVALIDASI',
    };

    setOffPjpAttendances((prev) => [newAbsen, ...prev]);

    addNotification({
      title: 'Absen Toko Luar RJP (TIDAK TERVALIDASI)',
      message: `Sales ${user.name} melakukan Absen Toko Luar RJP di ${outletName}. Status: TIDAK TERVALIDASI. Membutuhkan review SPV.`,
      roleTarget: ['SUPERVISOR'],
    });
  };

  // Sales Action: Request Visit to Off-PJP Store
  const handleSalesRequestOffPJP = ({ outletName, address, reason }) => {
    const newRequest = {
      id: `inc-offpjp-${Date.now()}`,
      type: 'OFF_PJP_REQUEST',
      outletName,
      address,
      salesName: user.name,
      spvName: 'Ahmad Subagja',
      spvTeam: 'Tim SPV Ahmad Subagja (Cimahi - KBB)',
      reason,
      reportedAt: new Date().toLocaleTimeString(),
      status: 'PENDING_SPV_OFFPJP',
    };

    setIncidents((prev) => [newRequest, ...prev]);

    addNotification({
      title: 'Pengajuan Kunjungan Toko Luar RJP',
      message: `Sales ${user.name} mengajukan kunjungan ke ${outletName} (Luar RJP Hari Ini). Membutuhkan persetujuan SPV.`,
      roleTarget: ['SUPERVISOR'],
    });
  };

  return {
    handleSalesAbsenIn,
    handleSalesAbsenOut,
    handleSubmitOrder,
    handleReportClosedOutlet,
    handleRequestUnlockOutlet,
    handleSalesAbsenOffPJP,
    handleSalesRequestOffPJP,
  };
};
