import { useCallback, useMemo } from 'react';
import { ordersApi, outletsApi } from '../../../services/api';
import { mapServerOrder } from '../../../utils/orderMapper';

/**
 * Custom hook containing all business logic for Admin actions.
 * Single Responsibility: Order approvals and Outlet Unlock approvals.
 * Wired directly to the Backend REST API with local state sync.
 */
export const useAdminActions = ({
  orders,
  setOrders,
  salesStops,
  setSalesStops,
  incidents,
  setIncidents,
  addNotification,
}) => {
  // Admin Action: Approve / Reject Order
  const handleAdminOrderDecision = useCallback(async ({ orderId, approved, rejectionReason,assignmentRevision=0,overrideReason }) => {
    const orderTarget = orders.find(o => String(o.id) === String(orderId)) || { id: orderId, outletName: 'Outlet' };

    try {
      if (approved) {
        const res = await ordersApi.approveOrder(orderId,{assignmentRevision,overrideReason});
        const updated = res?.data ? mapServerOrder(res.data) : null;
        setOrders((prev) =>
          prev.map((o) => (String(o.id) === String(orderId) ? { ...o, ...(updated || {}), status: 'APPROVED' } : o))
        );

        addNotification({
          title: 'Order Disetujui Admin',
          message: `Order #${orderTarget.id} (${orderTarget.outletName}) telah disetujui oleh Admin.`,
          roleTarget: ['SALES', 'SUPERVISOR'],
        });
      } else {
        const res = await ordersApi.rejectOrder(orderId, rejectionReason,{assignmentRevision,overrideReason});
        const updated = res?.data ? mapServerOrder(res.data) : null;
        setOrders((prev) =>
          prev.map((o) =>
            String(o.id) === String(orderId)
              ? { ...o, ...(updated || {}), status: 'REJECTED', rejectionReason }
              : o
          )
        );

        addNotification({
          title: 'Order Ditolak Admin',
          message: `Order #${orderTarget.id} ditolak oleh Admin. Alasan: ${rejectionReason}`,
          roleTarget: ['SALES', 'SUPERVISOR'],
        });
      }
      window.dispatchEvent(new CustomEvent('operational-data-changed'));
      return true;
    } catch (err) {
      console.warn('[API] Order decision error:', err.message);
      addNotification({
        title: 'Gagal Memproses Order',
        message: err.message,
        roleTarget: ['ADMIN','SUPERVISOR'],
      });
      return false;
    }
  }, [orders, setOrders, addNotification]);

  // Admin Action: Approve Unlock Request
  const handleApproveUnlockRequest = useCallback(async (requestId, stopId) => {
    try {
      await outletsApi.handleUnlockRequest(requestId, true);

      setIncidents((prev) =>
        prev.map((i) => (String(i.id) === String(requestId) ? { ...i, status: 'APPROVED' } : i))
      );

      if (setSalesStops) {
        setSalesStops((prev) =>
          prev.map((s) => (String(s.id) === String(stopId) ? { ...s, unlockedByAdmin: true } : s))
        );
      }

      addNotification({
        title: 'Permintaan Unlock Disetujui Admin',
        message: `Admin telah membuka kunci (Unlock) outlet untuk akses presensi.`,
        roleTarget: ['SALES', 'SUPERVISOR'],
      });
      window.dispatchEvent(new CustomEvent('operational-data-changed'));
      return true;
    } catch (err) {
      console.warn('[API] Approve unlock error:', err.message);
      addNotification({
        title: 'Gagal Buka Kunci',
        message: err.message,
        roleTarget: ['ADMIN'],
      });
      return false;
    }
  }, [setIncidents, setSalesStops, addNotification]);

  // Admin Action: Reject Unlock Request
  const handleRejectUnlockRequest = useCallback(async (requestId) => {
    try {
      await outletsApi.handleUnlockRequest(requestId, false);

      setIncidents((prev) =>
        prev.map((i) => (String(i.id) === String(requestId) ? { ...i, status: 'REJECTED' } : i))
      );

      addNotification({
        title: 'Permintaan Unlock Ditolak',
        message: `Permintaan unlock outlet telah ditolak oleh Admin.`,
        roleTarget: ['SALES', 'SUPERVISOR'],
      });
      window.dispatchEvent(new CustomEvent('operational-data-changed'));
      return true;
    } catch (err) {
      console.warn('[API] Reject unlock error:', err.message);
      addNotification({
        title: 'Gagal Menolak Unlock',
        message: err.message,
        roleTarget: ['ADMIN'],
      });
      return false;
    }
  }, [setIncidents, addNotification]);

  return useMemo(() => ({
    handleAdminOrderDecision,
    handleApproveUnlockRequest,
    handleRejectUnlockRequest,
  }), [
    handleAdminOrderDecision,
    handleApproveUnlockRequest,
    handleRejectUnlockRequest,
  ]);
};
