import React, { useState } from 'react';
import { useApp, MOCK_PRODUCTS } from '../../context/AppContext';
import { 
  LuMapPin, LuClock, LuShoppingCart, 
  LuCamera, LuPhone, LuNavigation, LuPlus, LuMinus, LuSend, LuDollarSign
} from 'react-icons/lu';
import { FiAlertCircle, FiCheckCircle, FiXCircle } from 'react-icons/fi';

export const SalesFieldView = () => {
  const { 
    user, 
    shiftAttendance, 
    handleShiftClockIn, 
    handleShiftClockOut, 
    salesStops, 
    handleSalesAbsenIn, 
    handleSubmitOrder, 
    handleReportClosedOutlet 
  } = useApp();

  const [selectedStop, setSelectedStop] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'ABSEN_IN', 'ORDER', 'CLOSED_REPORT', 'ABSEN_OUT'

  // Order Input State
  const [orderItems, setOrderItems] = useState([]);
  const [paymentType, setPaymentType] = useState('TOP_14');
  
  // Closed Outlet State
  const [closedReason, setClosedReason] = useState('Toko Gembok / Tutup Permanen');
  const [closedPhoto, setClosedPhoto] = useState('https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=400');

  // Handle Qty change in order
  const updateProductQty = (product, delta) => {
    setOrderItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (!existing && delta > 0) {
        return [...prev, { product, qty: 1 }];
      }
      if (existing) {
        const newQty = existing.qty + delta;
        if (newQty <= 0) {
          return prev.filter((item) => item.product.id !== product.id);
        }
        return prev.map((item) => (item.product.id === product.id ? { ...item, qty: newQty } : item));
      }
      return prev;
    });
  };

  const calculateOrderTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  };

  const submitOrderForm = () => {
    if (orderItems.length === 0) {
      alert('Pilih minimal 1 produk untuk membuat order.');
      return;
    }
    const itemsPayload = orderItems.map((item) => ({
      productName: item.product.name,
      qty: item.qty,
      price: item.product.price,
      subtotal: item.product.price * item.qty,
    }));

    handleSubmitOrder({
      stopId: selectedStop.id,
      items: itemsPayload,
      paymentType,
      totalAmount: calculateOrderTotal(),
    });

    setActiveModal(null);
    setOrderItems([]);
    alert(`Order berhasil dibuat untuk ${selectedStop.outletName}! Menunggu approval Admin.`);
  };

  const submitClosedReportForm = () => {
    handleReportClosedOutlet({
      stopId: selectedStop.id,
      reason: closedReason,
      photoUrl: closedPhoto,
    });

    setActiveModal(null);
    alert(`Laporan Toko Tutup untuk ${selectedStop.outletName} dikirim ke Supervisor.`);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto pb-24">
      {/* Header Banner & Shift Attendance Card */}
      <div className="bg-surface border border-border-glass rounded-2xl p-4 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-primary/20" />
            <span className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-surface" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-on-surface">{user.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                {user.roleLabel}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">
              Rute Hari Ini: <span className="font-semibold text-on-surface">{user.cluster}</span> ({user.region})
            </p>
          </div>
        </div>

        {/* Shift Attendance Widget */}
        <div className="flex items-center gap-3 bg-surface-variant/40 p-3 rounded-xl border border-border-glass">
          <div className="text-right">
            <p className="text-xs text-on-surface-variant font-medium">Status Shift Harian</p>
            <p className={`text-xs font-bold ${shiftAttendance.clockedIn ? 'text-emerald-600' : 'text-amber-600'}`}>
              {shiftAttendance.clockedIn ? `Masuk: ${shiftAttendance.clockInTime}` : 'Belum Absen Masuk'}
            </p>
          </div>
          {!shiftAttendance.clockedIn ? (
            <button
              onClick={handleShiftClockIn}
              className="px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <LuCamera className="text-base" />
              <span>Clock In Shift</span>
            </button>
          ) : (
            <button
              onClick={handleShiftClockOut}
              className="px-3 py-2 bg-surface border border-border-glass text-on-surface text-xs font-semibold rounded-xl hover:bg-surface-variant transition-all flex items-center gap-1.5"
            >
              <LuClock className="text-base text-on-surface-variant" />
              <span>Clock Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Daily PJP Route Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-on-surface">Daftar PJP Kunjungan Sales Hari Ini</h3>
            <p className="text-xs text-on-surface-variant">Ikuti urutan perhentian outlet secara hierarkis</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-surface border border-border-glass rounded-full text-on-surface-variant">
            {salesStops.filter((s) => s.status === 'ORDERED' || s.status === 'SKIPPED').length} / {salesStops.length} Selesai
          </span>
        </div>

        {/* Outlet Stops Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {salesStops.map((stop) => {
            const isInsideGeofence = stop.currentDistance <= stop.radiusMeters;
            return (
              <div
                key={stop.id}
                className={`bg-surface border rounded-2xl p-5 shadow-sm space-y-4 transition-all relative ${
                  stop.status === 'ORDERED'
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : stop.status === 'CLOSED'
                    ? 'border-rose-500/40 bg-rose-500/5'
                    : stop.status === 'SKIPPED'
                    ? 'border-amber-500/40 bg-amber-500/5 opacity-75'
                    : 'border-border-glass hover:border-primary/40'
                }`}
              >
                {/* Header Outlet */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                      #{stop.sequence}
                    </span>
                    <div>
                      <h4 className="font-bold text-on-surface text-base">{stop.outletName}</h4>
                      <p className="text-xs text-on-surface-variant flex items-center gap-1">
                        <LuMapPin className="text-primary text-xs" />
                        {stop.address}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      stop.status === 'ORDERED'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : stop.status === 'ARRIVED'
                        ? 'bg-blue-500/10 text-blue-600'
                        : stop.status === 'CLOSED'
                        ? 'bg-rose-500/10 text-rose-600'
                        : stop.status === 'SKIPPED'
                        ? 'bg-amber-500/10 text-amber-600'
                        : 'bg-surface-variant text-on-surface-variant'
                    }`}
                  >
                    {stop.status}
                  </span>
                </div>

                {/* Geofence Distance Indicator */}
                <div className="flex items-center justify-between text-xs bg-surface-variant/30 p-2.5 rounded-xl">
                  <span className="text-on-surface-variant">Jarak Geofence GPS:</span>
                  <span className={`font-bold flex items-center gap-1 ${isInsideGeofence ? 'text-emerald-600' : 'text-amber-600'}`}>
                    <LuNavigation className="text-xs" />
                    {stop.currentDistance} meter ({isInsideGeofence ? 'Dalam Geofence ≤50m' : 'Luar Geofence >50m'})
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  {stop.status === 'PENDING' && (
                    <button
                      onClick={() => {
                        setSelectedStop(stop);
                        setActiveModal('ABSEN_IN');
                      }}
                      className="flex-1 py-2.5 bg-primary text-on-primary font-semibold text-xs rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <LuCamera className="text-base" />
                      <span>Absen In Toko</span>
                    </button>
                  )}

                  {stop.status === 'ARRIVED' && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedStop(stop);
                          setActiveModal('ORDER');
                        }}
                        className="flex-1 py-2.5 bg-emerald-600 text-white font-semibold text-xs rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <LuShoppingCart className="text-base" />
                        <span>Input Order</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedStop(stop);
                          setActiveModal('CLOSED_REPORT');
                        }}
                        className="px-3 py-2.5 bg-rose-500/10 text-rose-600 border border-rose-500/30 font-semibold text-xs rounded-xl hover:bg-rose-500/20 transition-all flex items-center justify-center gap-1"
                      >
                        <FiAlertCircle className="text-base" />
                        <span>Toko Tutup</span>
                      </button>
                    </>
                  )}

                  {(stop.status === 'ORDERED' || stop.status === 'CLOSED' || stop.status === 'SKIPPED') && (
                    <div className="w-full text-center text-xs text-on-surface-variant font-medium py-1">
                      Kunjungan selesai ({stop.checkInTime || 'Selesai'})
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ABSEN IN GEOFENCE MODAL */}
      {activeModal === 'ABSEN_IN' && selectedStop && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border-glass rounded-3xl p-6 w-full max-w-md space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-glass pb-3">
              <div>
                <h3 className="font-bold text-lg text-on-surface">Absen In Outlet</h3>
                <p className="text-xs text-on-surface-variant">{selectedStop.outletName}</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg hover:bg-surface-variant text-on-surface-variant">
                <LuXCircle className="text-xl" />
              </button>
            </div>

            {/* Geofence Check Simulation */}
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3">
              <FiCheckCircle className="text-2xl text-emerald-600 flex-shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-emerald-700">Geofence Lokasi Diterima</p>
                <p className="text-emerald-800">Jarak 24m dari koordinat terdaftar toko. Presisi GPS 8m.</p>
              </div>
            </div>

            {/* Camera Selfie Simulation */}
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-border-glass">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600"
                alt="Selfie"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-white flex items-center gap-1.5">
                <LuClock className="text-xs text-primary" />
                <span>{new Date().toLocaleTimeString()} WIB — GPS Stamp Active</span>
              </div>
            </div>

            <button
              onClick={() => {
                handleSalesAbsenIn(selectedStop.id);
                setActiveModal(null);
              }}
              className="w-full py-3 bg-primary text-on-primary font-bold text-sm rounded-xl hover:bg-primary/90 transition-all shadow-md"
            >
              Konfirmasi Absen In
            </button>
          </div>
        </div>
      )}

      {/* INPUT ORDER MODAL */}
      {activeModal === 'ORDER' && selectedStop && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border-glass rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-glass pb-3">
              <div>
                <h3 className="font-bold text-lg text-on-surface">Form Input Order Sales</h3>
                <p className="text-xs text-on-surface-variant">Outlet: {selectedStop.outletName} ({selectedStop.outletCode})</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg hover:bg-surface-variant text-on-surface-variant">
                <LuXCircle className="text-xl" />
              </button>
            </div>

            {/* Credit Info */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-surface-variant/40 p-3 rounded-2xl border border-border-glass">
              <div>
                <span className="text-on-surface-variant">Plafon Kredit:</span>
                <p className="font-bold text-on-surface">Rp {selectedStop.creditLimit.toLocaleString('id-ID')}</p>
              </div>
              <div>
                <span className="text-on-surface-variant">Piutang Berjalan:</span>
                <p className="font-bold text-amber-600">Rp {selectedStop.outstanding.toLocaleString('id-ID')}</p>
              </div>
            </div>

            {/* Product Catalog Picker */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-on-surface">Pilih Produk SKU</h4>
              <div className="space-y-2">
                {MOCK_PRODUCTS.map((prd) => {
                  const existing = orderItems.find((item) => item.product.id === prd.id);
                  const qty = existing ? existing.qty : 0;
                  return (
                    <div key={prd.id} className="flex items-center justify-between p-3 rounded-xl border border-border-glass bg-surface/50">
                      <div>
                        <p className="font-bold text-xs text-on-surface">{prd.name}</p>
                        <p className="text-[11px] text-on-surface-variant">
                          Rp {prd.price.toLocaleString('id-ID')} / {prd.code} • Stok: {prd.stock}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateProductQty(prd, -1)}
                          className="w-7 h-7 rounded-lg border border-border-glass flex items-center justify-center text-on-surface hover:bg-surface-variant"
                        >
                          <LuMinus className="text-xs" />
                        </button>
                        <span className="w-6 text-center font-bold text-xs text-on-surface">{qty}</span>
                        <button
                          onClick={() => updateProductQty(prd, 1)}
                          className="w-7 h-7 rounded-lg bg-primary text-on-primary flex items-center justify-center hover:bg-primary/90"
                        >
                          <LuPlus className="text-xs" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Term */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface">Syarat Pembayaran</label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-border-glass bg-surface text-xs font-semibold text-on-surface"
              >
                <option value="CASH">CASH (Bayar Tunai saat kirim)</option>
                <option value="TOP_14">TOP 14 Hari (Tempo)</option>
                <option value="TOP_30">TOP 30 Hari (Tempo)</option>
              </select>
            </div>

            {/* Summary & Submit */}
            <div className="pt-3 border-t border-border-glass flex items-center justify-between">
              <div>
                <span className="text-xs text-on-surface-variant">Total Nilai Order:</span>
                <p className="text-lg font-bold text-primary">Rp {calculateOrderTotal().toLocaleString('id-ID')}</p>
              </div>

              <button
                onClick={submitOrderForm}
                className="px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-md"
              >
                <LuSend className="text-sm" />
                <span>Submit Order ke Admin</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLOSED OUTLET REPORT MODAL */}
      {activeModal === 'CLOSED_REPORT' && selectedStop && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border-glass rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-glass pb-3">
              <div>
                <h3 className="font-bold text-lg text-on-surface">Lapor Toko Tutup</h3>
                <p className="text-xs text-on-surface-variant">{selectedStop.outletName}</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg hover:bg-surface-variant text-on-surface-variant">
                <LuXCircle className="text-xl" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface">Alasan Toko Tutup</label>
              <select
                value={closedReason}
                onChange={(e) => setClosedReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-border-glass bg-surface text-xs font-semibold text-on-surface"
              >
                <option value="Toko Gembok / Tutup Permanen">Toko Gembok / Tutup Permanen Hari Ini</option>
                <option value="Pemilik Tidak di Tempat">Pemilik Sedang Keluar Kota</option>
                <option value="Toko Renovasi">Toko Sedang Renovasi</option>
                <option value="Akses Terhalang">Akses Jalan Terhalang / Banjir</option>
              </select>
            </div>

            {/* Photo Upload Simulation */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface">Foto Bukti Toko Tutup</label>
              <div className="relative rounded-2xl overflow-hidden aspect-video border border-border-glass">
                <img src={closedPhoto} alt="Bukti" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <span className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-xl text-white text-xs font-semibold flex items-center gap-1.5">
                    <LuCamera className="text-sm" /> Foto Bukti Terunggah
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={submitClosedReportForm}
              className="w-full py-3 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 transition-all shadow-md"
            >
              Kirim Laporan ke Supervisor
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
