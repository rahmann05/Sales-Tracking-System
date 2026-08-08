import { absensiApi, ordersApi, outletsApi, routeChangesApi } from '../services/api';

/**
 * Custom hook containing all business logic for Sales actions.
 * Single Responsibility: Sales Rep business workflows (Absen In, Absen Out, Orders, Closed Reports, Off-PJP, Unlock Requests).
 * Wired directly to the Backend REST API with optimistic local state updates.
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

    // Call Backend API
    absensiApi.checkIn(stopId, {
      latitude: payload.gpsLocation?.lat || -6.8722,
      longitude: payload.gpsLocation?.lng || 107.5423,
      photoUrl: payload.photoUrl || null,
      notes: payload.notes || 'Kunjungan Rutin',
    }).catch((err) => {
      console.warn('[API] Absen In sync error:', err.message);
    });
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

    // Call Backend API
    absensiApi.checkOut(stopId, {
      latitude: payload.gpsLocation?.lat || -6.8722,
      longitude: payload.gpsLocation?.lng || 107.5423,
      photoUrl: payload.photoUrl || null,
      notes: payload.notes || 'Kunjungan Selesai',
    }).catch((err) => {
      console.warn('[API] Absen Out sync error:', err.message);
    });
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
      items: items || [],
      totalAmount: totalAmount || items?.reduce((sum, item) => sum + (item.quantity * (item.price || item.unitPrice || 0)), 0) || 0,
      paymentType: paymentType || 'CASH',
      status: 'PENDING_APPROVAL',
    };

    setOrders((prev) => [newOrder, ...prev]);

    addNotification({
      title: 'Order Baru Masuk (Menunggu Persetujuan)',
      message: `Sales ${user.name} membuat pesanan baru untuk ${newOrder.outletName} sebesar Rp ${(newOrder.totalAmount).toLocaleString('id-ID')}.`,
      roleTarget: ['SUPERVISOR', 'ADMIN'],
    });

    // Call Backend API
    ordersApi.createOrder({
      pjpStopId: stopId,
      items: items?.map((i) => ({
        productId: i.productId || i.id,
        quantity: Number(i.quantity),
        unitPrice: Number(i.price || i.unitPrice || 0),
      })),
      paymentType: paymentType || 'CASH',
    }).catch((err) => {
      console.warn('[API] Create Order sync error:', err.message);
    });
  };

  // Report Closed Outlet
  const handleReportClosedOutlet = ({ stopId, reason, photoUrl }) => {
    const stop = salesStops.find((s) => s.id === stopId);
    if (!stop) return;

    const newIncident = {
      id: `inc-${Date.now()}`,
      stopId,
      type: 'CLOSED_SHOP',
      outletName: stop.outletName,
      salesName: user.name,
      reportedTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      reason: reason || 'Toko Tutup',
      photoUrl: photoUrl || null,
      status: 'PENDING_SPV',
    };

    setIncidents((prev) => [newIncident, ...prev]);

    setSalesStops((prev) =>
      prev.map((s) => (s.id === stopId ? { ...s, status: 'CLOSED' } : s))
    );

    addNotification({
      title: 'Laporan Toko Tutup Masuk',
      message: `Sales ${user.name} melaporkan bahwa ${stop.outletName} tutup. Alasan: ${reason}.`,
      roleTarget: ['SUPERVISOR', 'OPERATIONAL_MANAGER'],
    });

    // Call Backend API
    routeChangesApi.reportClosed({
      pjpStopId: stopId,
      reason,
      photoUrl,
    }).catch((err) => {
      console.warn('[API] Report closed sync error:', err.message);
    });
  };

  // Sales Action: Request Unlock Outlet
  const handleRequestUnlockOutlet = ({ stopId, outletName, address, reason }) => {
    const newRequest = {
      id: `req-unlock-${Date.now()}`,
      stopId,
      type: 'UNLOCK_REQUEST',
      outletName,
      salesName: user.name,
      reportedTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      reason,
      address,
      status: 'PENDING',
      userRole: user.role,
    };

    setIncidents((prev) => [newRequest, ...prev]);

    addNotification({
      title: 'Permohonan Buka Kunci Outlet',
      message: `Sales ${user.name} mengajukan permohonan buka kunci presensi untuk toko ${outletName}. Alasan: ${reason}.`,
      roleTarget: ['SUPERVISOR', 'ADMIN'],
    });

    // Call Backend API
    outletsApi.requestUnlock(stopId, reason).catch((err) => {
      console.warn('[API] Request unlock sync error:', err.message);
    });
  };

  // Sales Action: Absen Toko Luar RJP (Off-PJP)
  const handleSalesAbsenOffPJP = ({
    outletName,
    customerName,
    phone,
    address,
    reason,
    photoUrl,
    gpsLocation,
  }) => {
    const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    const newRecord = {
      id: `off-pjp-${Date.now()}`,
      salesId: user.id,
      salesName: user.name,
      outletName,
      customerName,
      phone,
      address,
      reason,
      photoUrl,
      gpsLocation,
      time: timeNow,
      date: new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }),
      validationStatus: 'MENUNGGU',
    };

    setOffPjpAttendances((prev) => [newRecord, ...prev]);

    addNotification({
      title: 'Presensi Toko Luar RJP Masuk',
      message: `Sales ${user.name} melakukan presensi di toko luar RJP: ${outletName}. Membutuhkan validasi Supervisor.`,
      roleTarget: ['SUPERVISOR'],
    });

    // Call Backend API
    absensiApi.submitOffPjp({
      outletName,
      customerName,
      phone,
      address,
      reason,
      photoUrl,
      latitude: gpsLocation?.lat || -6.8722,
      longitude: gpsLocation?.lng || 107.5423,
    }).catch((err) => {
      console.warn('[API] Submit off-PJP sync error:', err.message);
    });
  };

  return {
    handleSalesAbsenIn,
    handleSalesAbsenOut,
    handleSubmitOrder,
    handleReportClosedOutlet,
    handleRequestUnlockOutlet,
    handleSalesAbsenOffPJP,
  };
};
