/**
 * Custom hook containing all business logic for Admin actions.
 * Single Responsibility: Order approvals and Outlet Unlock approvals.
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
  const handleAdminOrderDecision = ({ orderId, approved, rejectionReason }) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    if (approved) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'APPROVED' } : o))
      );

      addNotification({
        title: 'Order Disetujui Admin',
        message: `Order #${order.id} (${order.outletName}) telah disetujui oleh Admin Penjualan.`,
        roleTarget: ['SALES', 'SUPERVISOR'],
      });
    } else {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: 'REJECTED', rejectionReason } : o
        )
      );

      addNotification({
        title: 'Order Ditolak Admin',
        message: `Order #${order.id} ditolak oleh Admin. Alasan: ${rejectionReason}`,
        roleTarget: ['SALES', 'SUPERVISOR'],
      });
    }
  };

  // Admin Action: Approve Unlock Request
  const handleApproveUnlockRequest = (requestId, stopId) => {
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
  };

  // Admin Action: Reject Unlock Request
  const handleRejectUnlockRequest = (requestId) => {
    setIncidents((prev) =>
      prev.map((i) => (i.id === requestId ? { ...i, status: 'REJECTED' } : i))
    );

    addNotification({
      title: 'Permintaan Unlock Ditolak',
      message: `Permintaan unlock outlet telah ditolak oleh Admin.`,
      roleTarget: ['SALES', 'SUPERVISOR'],
    });
  };

  return {
    handleAdminOrderDecision,
    handleApproveUnlockRequest,
    handleRejectUnlockRequest,
  };
};
