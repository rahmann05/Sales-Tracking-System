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
  const handleAdminOrderDecision = async ({ orderId, approved, rejectionReason }) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    try {
      if (approved) {
        const res = await ordersApi.approveOrder(orderId);
        const updated = res?.data ? mapServerOrder(res.data) : null;
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, ...(updated || {}), status: 'APPROVED' } : o))
        );

        addNotification({
          title: 'Order Disetujui Admin',
          message: `Order #${order.id} (${order.outletName}) telah disetujui oleh Admin Penjualan.`,
          roleTarget: ['SALES', 'SUPERVISOR'],
        });
      } else {
        const res = await ordersApi.rejectOrder(orderId, rejectionReason);
        const updated = res?.data ? mapServerOrder(res.data) : null;
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? { ...o, ...(updated || {}), status: 'REJECTED', rejectionReason }
              : o
          )
        );

        addNotification({
          title: 'Order Ditolak Admin',
          message: `Order #${order.id} ditolak oleh Admin. Alasan: ${rejectionReason}`,
          roleTarget: ['SALES', 'SUPERVISOR'],
        });
      }
    } catch (err) {
      console.warn('[API] Order decision error:', err.message);
      addNotification({
        title: 'Gagal Memproses Order',
        message: err.message,
        roleTarget: ['ADMIN'],
      });
    }
  };

  // Admin Action: Approve Unlock Request
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
        title: 'Permintaan Unlock Disetujui Admin',
        message: `Admin telah membuka kunci (Unlock) outlet untuk akses presensi.`,
        roleTarget: ['SALES', 'SUPERVISOR'],
      });
    } catch (err) {
      console.warn('[API] Approve unlock error:', err.message);
      addNotification({
        title: 'Gagal Buka Kunci',
        message: err.message,
        roleTarget: ['ADMIN'],
      });
    }
  };

  // Admin Action: Reject Unlock Request
  const handleRejectUnlockRequest = async (requestId) => {
    try {
      await outletsApi.handleUnlockRequest(requestId, false);

      setIncidents((prev) =>
        prev.map((i) => (i.id === requestId ? { ...i, status: 'REJECTED' } : i))
      );

      addNotification({
        title: 'Permintaan Unlock Ditolak',
        message: `Permintaan unlock outlet telah ditolak oleh Admin.`,
        roleTarget: ['SALES', 'SUPERVISOR'],
      });
    } catch (err) {
      console.warn('[API] Reject unlock error:', err.message);
      addNotification({
        title: 'Gagal Menolak Unlock',
        message: err.message,
        roleTarget: ['ADMIN'],
      });
    }
  };

  return {
    handleAdminOrderDecision,
    handleApproveUnlockRequest,
    handleRejectUnlockRequest,
  };
};
