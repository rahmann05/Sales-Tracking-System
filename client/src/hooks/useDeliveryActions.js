/**
 * Custom hook containing all business logic for Driver & Helper logistics actions.
 * Single Responsibility: Delivery workflows (Absen In, POD Submission, Absen Out, Unlock Requests).
 */
export const useDeliveryActions = ({
  user,
  deliveryStops,
  setDeliveryStops,
  setIncidents,
  addNotification,
}) => {
  // Absen In Drop Point (Driver/Helper Arrival Check-In)
  const handleDeliveryAbsenIn = (stopId, payload = {}) => {
    const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    setDeliveryStops((prev) =>
      prev.map((s) =>
        s.id === stopId
          ? {
              ...s,
              status: 'ARRIVED',
              checkInTime: timeNow,
              checkInPhoto: payload.photoUrl || null,
              checkInGps: payload.gpsLocation || null,
              checkInNotes: payload.notes || 'Tiba di Lokasi Bongkar',
            }
          : s
      )
    );
  };

  // Submit POD (Cash collection, Signature, Handover Proof)
  const handleSubmitPOD = ({ stopId, paymentReceived, notes, signatureData, photoUrl }) => {
    setDeliveryStops((prev) =>
      prev.map((s) =>
        s.id === stopId
          ? {
              ...s,
              status: 'POD_SUBMITTED',
              paymentReceived,
              podNotes: notes,
              podPhoto: photoUrl,
              signatureData,
            }
          : s
      )
    );

    const stop = deliveryStops.find((s) => s.id === stopId);
    addNotification({
      title: 'POD Pengiriman Diterima',
      message: `Driver/Helper telah mencatat POD di ${stop?.outletName || 'Drop Point'}. Menunggu Absen Out untuk menyelesaikan serah terima.`,
      roleTarget: ['ADMIN', 'SUPERVISOR'],
    });
  };

  // Absen Out Drop Point (Driver/Helper Departure Check-Out)
  const handleDeliveryAbsenOut = (stopId, payload = {}) => {
    const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    setDeliveryStops((prev) =>
      prev.map((s) =>
        s.id === stopId
          ? {
              ...s,
              status: 'DELIVERED',
              checkOutTime: timeNow,
              checkOutPhoto: payload.photoUrl || null,
              checkOutGps: payload.gpsLocation || null,
              checkOutNotes: payload.notes || 'Pengiriman Selesai Lengkap',
            }
          : s
      )
    );
  };

  // Request Unlock for Locked Drop Point
  const handleDeliveryRequestUnlock = ({ stopId, outletName, address, activeVisitingOutlet, reason }) => {
    const newRequest = {
      id: `unlock-deliv-${Date.now()}`,
      type: 'UNLOCK_REQUEST',
      stopId,
      outletName,
      address,
      userRole: 'DRIVER_HELPER',
      userName: `${user.name} (${user.roleLabel})`,
      activeVisitingOutlet,
      reason,
      requestedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      status: 'PENDING',
    };

    setIncidents((prev) => [newRequest, ...prev]);

    addNotification({
      title: 'Permintaan Buka Kunci (Unlock) Drop Point',
      message: `Logistik ${user.name} meminta unlock drop point "${outletName}". Alasan: ${reason}`,
      roleTarget: ['ADMIN', 'SUPERVISOR'],
    });
  };

  return {
    handleDeliveryAbsenIn,
    handleSubmitPOD,
    handleDeliveryAbsenOut,
    handleDeliveryRequestUnlock,
  };
};
