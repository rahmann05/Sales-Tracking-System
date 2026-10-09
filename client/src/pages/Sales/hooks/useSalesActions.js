import { useCallback, useMemo } from 'react';
import { absensiApi, ordersApi, outletsApi, routeChangesApi } from '../../../services/api';
import { mapServerOrder } from '../../../utils/orderMapper';
import { mapServerRouteChange, mapServerUnlockRequest } from '../../../utils/incidentMapper';

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
  const handleSalesAbsenIn = useCallback(async (stopId, payload = {}) => {
    try {
      // Call Backend API first
      const response=await absensiApi.checkIn(stopId, {
        accuracy:payload.gpsLocation?.accuracy,observedAt:payload.gpsLocation?.observedAt,
        latitude: payload.gpsLocation?.lat,
        longitude: payload.gpsLocation?.lng,
        photoUrl: payload.photoUrl || null,
        notes: payload.notes || 'Kunjungan Rutin',
      });

      const now = new Date();
      const timeNow = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
      setSalesStops((prev) =>
        prev.map((s) =>
          s.id === stopId
            ? {
                ...s,
                status: 'ARRIVED',
                policySnapshot:response.data.policySnapshot,visitSession:response.data.visitSession,
                inTimestamp: response.data.logical?null:response.data.timestamp,
                checkInTime: response.data.logical?null:timeNow,
                checkInPhoto: payload.photoUrl || null,
                checkInGps: payload.gpsLocation || null,
                checkInNotes: payload.notes || 'Kunjungan Rutin',
              }
            : response.data.settledVisits?.some(v=>v.id===s.id)?{...s,status:'VISITED',visitSession:response.data.settledVisits.find(v=>v.id===s.id).visitSession}:s
        )
      );
    } catch (err) {
      console.warn('[API] Absen In sync error:', err.message);
      addNotification({
        title: 'Gagal Absen Masuk',
        message: err.message,
        roleTarget: ['SALES'],
      });
      throw err;
    }
  }, [setSalesStops, addNotification]);

  // Absen Out Outlet (Sales Check-Out)
  const handleSalesAbsenOut = useCallback(async (stopId, payload = {}) => {
    try {
      // Call Backend API first
      const response = await absensiApi.checkOut(stopId, {
        accuracy:payload.gpsLocation?.accuracy,observedAt:payload.gpsLocation?.observedAt,
        latitude: payload.gpsLocation?.lat,
        longitude: payload.gpsLocation?.lng,
        photoUrl: payload.photoUrl || null,
        notes: payload.notes || 'Kunjungan Selesai',
        earlyReason: payload.earlyReason || null,
        reason: payload.reason || payload.earlyReason || null,
        orderAmount: payload.orderAmount,
        productIds: payload.productIds,
        visitOutcome:payload.visitOutcome,
      });

      const now = new Date();
      const timeNow = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
      setSalesStops((prev) =>
        prev.map((s) =>
          s.id === stopId
            ? {
                ...s,
                status: 'VISITED',
                visitSession:response.data.visitSession,
                outTimestamp: response.data.logical?null:response.data.timestamp,
                checkOutTime: response.data.logical?null:timeNow,
                checkOutPhoto: payload.photoUrl || null,
                checkOutGps: payload.gpsLocation || null,
                checkOutNotes: payload.notes || 'Kunjungan Selesai',
                visitOutcome:response.data.visitOutcome,
                durationMinutes: response.data.durationMinutes,
                orderAmount: response.data.orderAmount,
                skuSold: response.data.skuSold,
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
      throw err;
    }
  }, [setSalesStops, addNotification]);

  // Submit Order (Sales)
  const handleSubmitOrder = useCallback(async ({ stopId, items, paymentType, code, requestId, expectedTotal, expectedTermDays,priceOverrideReason }) => {
    try {
      // Call Backend API
      const res = await ordersApi.createOrder({
        code,requestId,expectedTotal,expectedTermDays,priceOverrideReason,
        pjpStopId: stopId,
        items: items?.map((i) => ({
          productId: i.productId || i.id,
          quantity: Number(i.quantity),
          unit:i.unit,baseUnit:i.baseUnit,unitsPerUnit:i.unitsPerUnit,
          unitPrice: Number(i.price || i.unitPrice || 0),
        })),
        paymentType: paymentType || 'CASH',
      });

      const newOrder = res.data; // Server returns real Order object (Prisma shape)
      setOrders((prev) => [mapServerOrder(newOrder), ...prev.filter(o=>o.id!==newOrder.id)]);

      addNotification({
        title: newOrder.status==='APPROVED'?'Order diterima sesuai aturan':'Order baru menunggu persetujuan',
        message: `Sales ${user?.name || 'Sales'} membuat pesanan baru untuk ${newOrder.pjpStop?.outlet?.name || 'Toko'} sebesar Rp ${(newOrder.totalValue || 0).toLocaleString('id-ID')}.`,
        roleTarget: ['SUPERVISOR', 'ADMIN'],
      });
    } catch (err) {
      console.warn('[API] Create Order sync error:', err.message);
      addNotification({
        title: 'Gagal Membuat Order',
        message: err.message,
        roleTarget: ['SALES'],
      });
      throw err;
    }
  }, [user?.name, setOrders, addNotification]);

  // Report Closed Outlet
  const handleReportClosedOutlet = useCallback(async ({ stopId, reason, photoUrl }) => {
    try {
      const stopTarget = salesStops.find(s => s.id === stopId);
      if (!stopTarget) return;

      const res = await routeChangesApi.reportClosed({
        pjpId: stopTarget.pjpId,
        pjpStopId: stopId,
        reason,
        photoUrl,
      });

      const newIncident = mapServerRouteChange(res.data);
      setIncidents((prev) => [newIncident, ...prev]);
      setSalesStops((prev) =>
        prev.map((s) => (s.id === stopId ? { ...s, status: 'CLOSED_REPORTED' } : s))
      );

      addNotification({
        title: 'Laporan Toko Tutup Masuk',
        message: `Sales ${user?.name || 'Sales'} melaporkan bahwa toko tutup. Alasan: ${reason}.`,
        roleTarget: ['SUPERVISOR', 'ADMIN'],
      });
    } catch (err) {
      console.warn('[API] Report closed sync error:', err.message);
      addNotification({
        title: 'Gagal Melaporkan Toko Tutup',
        message: err.message,
        roleTarget: ['SALES'],
      });
      throw err;
    }
  }, [user?.name, salesStops, setSalesStops, setIncidents, addNotification]);

  // Sales Action: Request Unlock Outlet
  const handleRequestUnlockOutlet = useCallback(async ({ stopId, reason }) => {
    try {
      const outletId = salesStops.find(s => s.id === stopId)?.outletId;
      if (!outletId) throw new Error('Outlet tidak ditemukan');

      const res = await outletsApi.requestUnlock(outletId, reason);
      const newRequest = mapServerUnlockRequest(res.data);

      setIncidents((prev) => [newRequest, ...prev]);
      addNotification({
        title: 'Permohonan Buka Kunci Outlet',
        message: `Sales ${user?.name || 'Sales'} mengajukan permohonan buka kunci presensi. Alasan: ${reason}.`,
        roleTarget: ['SUPERVISOR', 'ADMIN'],
      });
    } catch (err) {
      console.warn('[API] Request unlock sync error:', err.message);
      addNotification({
        title: 'Gagal Request Unlock',
        message: err.message,
        roleTarget: ['SALES'],
      });
      throw err;
    }
  }, [user?.name, salesStops, setSalesStops, setIncidents, addNotification]);

  // Sales Action: Absen Toko Luar RJP (Off-PJP)
  const handleSalesAbsenOffPJP = useCallback(async ({
    requestId,
    outletName,
    customerName,
    phone,
    address,
    reason,
    photoUrl,
    gpsLocation,
    orderAmount, productIds,
    visitOutcome,
  }) => {
    try {
      const res = await absensiApi.submitOffPjp({
        requestId,
        orderAmount, productIds,
        visitOutcome,
        outletName,
        customerName,
        phone,
        address,
        reason,
        photoUrl,
        accuracy:gpsLocation?.accuracy,observedAt:gpsLocation?.observedAt,latitude: gpsLocation?.lat,
        longitude: gpsLocation?.lng,
      });

      const att = res.data;
      const newRecord = { ...att, salesId: att.userId, salesName: user?.name, createdAt: att.createdAt, validationStatus: att.status === 'APPROVED' ? 'TERVALIDASI' : att.status === 'REJECTED' ? 'DITOLAK' : 'MENUNGGU' };
      setOffPjpAttendances((prev) => [newRecord, ...prev.filter(item => item.id !== newRecord.id)]);

      addNotification({
        title: 'Presensi Toko Luar RJP Masuk',
        message: `Sales ${user?.name || 'Sales'} mencatat kunjungan luar PJP: ${outletName}. ${att.status==='APPROVED'?'Diterima sesuai aturan tanpa pemeriksaan tambahan.':'Menunggu pemeriksaan Supervisor.'}`,
        roleTarget: ['SUPERVISOR'],
      });
      return att;
    } catch (err) {
      console.warn('[API] Submit off-PJP sync error:', err.message);
      addNotification({
        title: 'Periksa Pengiriman Presensi Off-PJP',
        message: err.message,
        roleTarget: ['SALES'],
      });
      throw err;
    }
  }, [user?.name, setOffPjpAttendances, addNotification]);

  return useMemo(() => ({
    handleSalesAbsenIn,
    handleSalesAbsenOut,
    handleSubmitOrder,
    handleReportClosedOutlet,
    handleRequestUnlockOutlet,
    handleSalesAbsenOffPJP,
  }), [
    handleSalesAbsenIn,
    handleSalesAbsenOut,
    handleSubmitOrder,
    handleReportClosedOutlet,
    handleRequestUnlockOutlet,
    handleSalesAbsenOffPJP,
  ]);
};
