export function packingBalance(packing) {
  const stops = packing.deliveryStops || [];
  const allocatedCartons = stops.reduce((sum, stop) => sum + stop.allocatedCartons - (stop.returnReceivedAt ? stop.rejectedCartons || 0 : 0), 0);
  const items = (packing.items || []).map(item => ({ ...item, remaining: item.quantity - stops.reduce((sum, stop) => sum + (stop.allocatedItems || []).filter(a => a.lineId === item.lineId).reduce((n, a) => n + a.quantity, 0) - (stop.returnReceivedAt ? (stop.rejectedItems || []).filter(a => a.lineId === item.lineId).reduce((n,a) => n+a.quantity,0) : 0), 0) }));
  return { ...packing, allocatedCartons, remainingCartons: packing.totalCartons - allocatedCartons, remainingItems: items };
}

export function validateAllocation(packing, allocation, allowSplit) {
  const balance = packingBalance(packing);
  const cartons = allocation.allocatedCartons ?? balance.remainingCartons;
  if (packing.status !== 'RELEASED') throw new Error('Packing list belum dikirim admin ke gudang');
  if (!Number.isInteger(cartons) || cartons <= 0 || cartons > balance.remainingCartons) throw new Error('Jumlah karton melebihi sisa atau tidak valid');
  const lines = allocation.allocatedItems ?? balance.remainingItems.filter(i => i.remaining > 0).map(i => ({ lineId: i.lineId, quantity: i.remaining }));
  if (new Set(lines.map(i => i.lineId)).size !== lines.length) throw new Error('Baris barang duplikat');
  for (const line of lines) {
    const source = balance.remainingItems.find(i => i.lineId === line.lineId);
    if (!source || !Number.isInteger(line.quantity) || line.quantity <= 0 || line.quantity > source.remaining) throw new Error('Alokasi barang melebihi sisa atau tidak valid');
  }
  const allItems = balance.remainingItems.every(i => (lines.find(a => a.lineId === i.lineId)?.quantity || 0) === i.remaining);
  if (balance.remainingItems.length && (!lines.length || ((cartons === balance.remainingCartons) !== allItems))) throw new Error('Alokasi karton dan barang harus sama-sama menyisakan muatan atau sama-sama selesai');
  if (!allowSplit && (cartons !== balance.remainingCartons || !allItems)) throw new Error('Pembagian packing list dinonaktifkan admin');
  return { allocatedCartons: cartons, allocatedItems: lines, allocatedWeight: packing.totalCartons > 0 ? (packing.totalWeight || 0) * cartons / packing.totalCartons : 0 };
}
