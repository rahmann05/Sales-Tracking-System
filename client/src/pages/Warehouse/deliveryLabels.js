export function deliveryRouteLabel(route) {
  if (route.cancelledAt) return 'Dibatalkan';
  if (route.closedAt) return 'Ditutup';
  if (route.returnedAt) return 'Kembali, menunggu penutupan';
  return {DRAFT:'Draft',READY:'Siap kirim',IN_TRANSIT:'Dalam perjalanan',COMPLETED:'Tujuan selesai diproses',PARTIAL:'Tujuan diproses sebagian'}[route.status] || route.status;
}

export function deliveryStopLabel(status) {
  return {PENDING:'Menunggu pengiriman',DELIVERED:'Diterima penuh',REJECTED:'Ditolak',PARTIAL_REJECT:'Diterima sebagian'}[status] || status;
}
