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
  const handleSalesAbsenIn = async (stopId, payload = {}) => {
    try {
      // Call Backend API first
      const response = await absensiApi.checkIn(stopId, {
        latitude: payload.gpsLocation?.lat || -6.8722,
        longitude: payload.gpsLocation?.lng || 107.5423,
        photoUrl: payload.photoUrl || null,
        notes: payload.notes || 'Kunjungan Rutin',
      });

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
    } catch (err) {
      console.warn('[API] Absen In sync error:', err.message);
      addNotification({
        title: 'Gagal Absen Masuk',
        message: err.message,
        roleTarget: ['SALES'],
      });
    }
  };

  // Absen Out Outlet (Sales Check-Out)
  const handleSalesAbsenOut = async (stopId, payload = {}) => {
    try {
      // Call Backend API first
      await absensiApi.checkOut(stopId, {
        latitude: payload.gpsLocation?.lat || -6.8722,
        longitude: payload.gpsLocation?.lng || 107.5423,
        photoUrl: payload.photoUrl || null,
        notes: payload.notes || 'Kunjungan Selesai',
      });

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
    } catch (err) {
      console.warn('[API] Absen Out sync error:', err.message);
      addNotification({
        title: 'Gagal Absen Keluar',
        message: err.message,
        roleTarget: ['SALES'],
      });
    }
  };

  // Submit Order (Sales)
  const handleSubmitOrder = async ({ stopId, items, paymentType }) => {
    try {
      // Call Backend API
      const res = await ordersApi.createOrder({
        pjpStopId: stopId,
        items: items?.map((i) => ({
          productId: i.productId || i.id,
          quantity: Number(i.quantity),
          unitPrice: Number(i.price || i.unitPrice || 0),
        })),
        paymentType: paymentType || 'CASH',
      });

      const newOrder = res.data; // Server returns real Order object with ID
      setOrders((prev) => [newOrder, ...prev]);

      addNotification({
        title: 'Order Baru Masuk (Menunggu Persetujuan)',
        message: `Sales ${user.name} membuat pesanan baru untuk ${newOrder.pjpStop?.outlet?.name || 'Toko'} sebesar Rp ${(newOrder.totalValue || 0).toLocaleString('id-ID')}.`,
        roleTarget: ['SUPERVISOR', 'ADMIN'],
      });
    } catch (err) {
      console.warn('[API] Create Order sync error:', err.message);
      addNotification({
        title: 'Gagal Membuat Order',
        message: err.message,
        roleTarget: ['SALES'],
      });
    }
  };

  // Report Closed Outlet
  const handleReportClosedOutlet = async ({ stopId, reason, photoUrl }) => {
    try {
      const stop = salesStops.find((s) => s.id === stopId);
      if (!stop) return;

      const res = await routeChangesApi.reportClosed({
        pjpId: stop.pjpId,
        pjpStopId: stopId,
        reason,
        photoUrl,
      });

      const newIncident = res.data;
      setIncidents((prev) => [newIncident, ...prev]);
      setSalesStops((prev) =>
        prev.map((s) => (s.id === stopId ? { ...s, status: 'CLOSED_REPORTED' } : s))
      );

      addNotification({
        title: 'Laporan Toko Tutup Masuk',
        message: `Sales ${user.name} melaporkan bahwa toko tutup. Alasan: ${reason}.`,
        roleTarget: ['SUPERVISOR', 'MANAJER_OPERASIONAL', 'ADMIN'],
      });
    } catch (err) {
      console.warn('[API] Report closed sync error:', err.message);
      addNotification({
        title: 'Gagal Melaporkan Toko Tutup',
        message: err.message,
        roleTarget: ['SALES'],
      });
    }
  };

  // Sales Action: Request Unlock Outlet
  const handleRequestUnlockOutlet = async ({ stopId, reason }) => {
    try {
      const res = await outletsApi.requestUnlock(stopId, reason);
      const newRequest = res.data;

      setIncidents((prev) => [newRequest, ...prev]);
      addNotification({
        title: 'Permohonan Buka Kunci Outlet',
        message: `Sales ${user.name} mengajukan permohonan buka kunci presensi. Alasan: ${reason}.`,
        roleTarget: ['SUPERVISOR', 'ADMIN'],
      });
    } catch (err) {
      console.warn('[API] Request unlock sync error:', err.message);
      addNotification({
        title: 'Gagal Request Unlock',
        message: err.message,
        roleTarget: ['SALES'],
      });
    }
  };

  // Sales Action: Absen Toko Luar RJP (Off-PJP)
  const handleSalesAbsenOffPJP = async ({
    outletName,
    customerName,
    phone,
    address,
    reason,
    photoUrl,
    gpsLocation,
  }) => {
    try {
      const res = await absensiApi.submitOffPjp({
        outletName,
        customerName,
        phone,
        address,
        reason,
        photoUrl,
        latitude: gpsLocation?.lat || -6.8722,
        longitude: gpsLocation?.lng || 107.5423,
      });

      const newRecord = res.data;
      setOffPjpAttendances((prev) => [newRecord, ...prev]);

      addNotification({
        title: 'Presensi Toko Luar RJP Masuk',
        message: `Sales ${user.name} melakukan presensi di toko luar RJP: ${outletName}. Membutuhkan validasi Supervisor.`,
        roleTarget: ['SUPERVISOR'],
      });
    } catch (err) {
      console.warn('[API] Submit off-PJP sync error:', err.message);
      addNotification({
        title: 'Gagal Presensi Off-PJP',
        message: err.message,
        roleTarget: ['SALES'],
      });
    }
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
