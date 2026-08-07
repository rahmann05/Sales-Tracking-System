/**
 * Custom hook containing all business logic for Admin actions.
 * Single Responsibility: Order approvals, Dispatch routing, and Outlet Unlock approvals.
 */
export const useAdminActions = ({
  orders,
  setOrders,
  deliveryStops,
  setDeliveryStops,
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

      // Automatically synthesize Delivery PJP H+1 for Driver & Helper!
      const newDeliveryStop = {
        id: `del-${Date.now()}`,
        orderId: order.id,
        outletName: order.outletName,
        address: 'Jl. Alamat Delivery Pengiriman',
        driverName: 'Hendra Wijaya',
        helperName: 'Rian Putra',
        itemsCount: order.items.length,
        totalAmount: order.totalAmount,
        paymentType: order.paymentType,
        status: 'PENDING',
        podSignature: null,
        podPhoto: null,
        cashCollected: 0,
      };

      setDeliveryStops((prev) => [newDeliveryStop, ...prev]);

      addNotification({
        title: 'Order Approved & Rute Pengiriman Dibuat',
        message: `Order #${order.id} (${order.outletName}) telah disetujui oleh Admin dan dijadwalkan untuk pengiriman H+1.`,
        roleTarget: ['SALES', 'DRIVER', 'HELPER'],
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
      title: 'Permintaan Unlock Disetujui Admin',
      message: `Admin telah membuka kunci (Unlock) outlet untuk akses presensi.`,
      roleTarget: ['SALES', 'DRIVER', 'HELPER'],
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
      roleTarget: ['SALES', 'DRIVER', 'HELPER'],
    });
  };

  return {
    handleAdminOrderDecision,
    handleApproveUnlockRequest,
    handleRejectUnlockRequest,
  };
};
