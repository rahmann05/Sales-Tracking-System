import React, { useState } from 'react';
import { LuCamera, LuMapPin, LuX, LuCircleCheck, LuCircleX } from 'react-icons/lu';

/**
 * DriverAttendanceModal — Modal for driver attendance (Absen In) and status update (Delivered/Rejected).
 * Captures GPS coordinates and optional photo.
 */
export const DriverAttendanceModal = ({ stop, type, onClose, onSubmitAttendance, onSubmitStatus }) => {
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectedCartons, setRejectedCartons] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('idle'); // idle | loading | success | error
  const [coords, setCoords] = useState(null);

  const getGPS = () => {
    setGpsStatus('loading');
    if (!navigator.geolocation) {
      setGpsStatus('error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setGpsStatus('success');
      },
      () => setGpsStatus('error'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async () => {
    if (type === 'absen_in') {
      if (!coords) {
        alert('Ambil koordinat GPS terlebih dahulu');
        return;
      }
      setSubmitting(true);
      try {
        await onSubmitAttendance(stop.id, {
          type: 'IN',
          latitude: coords.latitude,
          longitude: coords.longitude,
          photoUrl: photoUrl || undefined,
          notes: notes || undefined,
        });
      } finally {
        setSubmitting(false);
      }
    } else if (type === 'delivered') {
      setSubmitting(true);
      try {
        await onSubmitStatus(stop.id, {
          status: 'DELIVERED',
          notes: notes || undefined,
          photoUrl: photoUrl || undefined,
        });
      } finally {
        setSubmitting(false);
      }
    } else if (type === 'rejected') {
      if (!rejectReason.trim()) {
        alert('Alasan penolakan wajib diisi');
        return;
      }
      setSubmitting(true);
      try {
        await onSubmitStatus(stop.id, {
          status: rejectedCartons > 0 && rejectedCartons < (stop.packingList?.totalCartons || 0) ? 'PARTIAL_REJECT' : 'REJECTED',
          rejectReason,
          rejectedCartons: parseInt(rejectedCartons) || 0,
          notes: notes || undefined,
          photoUrl: photoUrl || undefined,
        });
      } finally {
        setSubmitting(false);
      }
    }
  };

  const titles = {
    absen_in: 'Absen Sampai di Toko',
    delivered: 'Konfirmasi Pengiriman',
    rejected: 'Laporan Penolakan',
  };

  const icons = {
    absen_in: LuCamera,
    delivered: LuCircleCheck,
    rejected: LuCircleX,
  };

  const colors = {
    absen_in: '#2563eb',
    delivered: '#16a34a',
    rejected: '#dc2626',
  };

  const TitleIcon = icons[type] || LuCamera;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-surface rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-surface z-10 flex items-center justify-between p-4 border-b border-border-glass">
          <div className="flex items-center gap-2">
            <TitleIcon style={{ color: colors[type] }} />
            <h3 className="text-sm font-bold text-on-surface">{titles[type]}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-variant transition-colors">
            <LuX className="text-on-surface-variant" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Outlet Info */}
          <div className="p-3 rounded-xl bg-surface-variant/30 border border-border-glass">
            <div className="text-sm font-bold text-on-surface">{stop.outlet?.name}</div>
            <div className="text-xs text-on-surface-variant mt-0.5">{stop.outlet?.address}</div>
            <div className="text-xs text-on-surface-variant mt-0.5">
              Packing List: {stop.packingList?.code} • {stop.packingList?.totalCartons || 0} Karton
            </div>
          </div>

          {/* GPS Capture (for absen_in) */}
          {type === 'absen_in' && (
            <div>
              <label className="text-xs font-semibold text-on-surface-variant block mb-2">Koordinat GPS</label>
              <button
                onClick={getGPS}
                disabled={gpsStatus === 'loading'}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  gpsStatus === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : gpsStatus === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'
                }`}
              >
                <LuMapPin />
                {gpsStatus === 'loading' && 'Mengambil GPS...'}
                {gpsStatus === 'idle' && 'Ambil Koordinat GPS'}
                {gpsStatus === 'success' && `✓ ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`}
                {gpsStatus === 'error' && 'Gagal — Coba Lagi'}
              </button>
            </div>
          )}

          {/* Reject fields */}
          {type === 'rejected' && (
            <>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">Alasan Penolakan *</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Jelaskan alasan toko menolak..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-border-glass bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">Jumlah Karton Ditolak</label>
                <input
                  type="number"
                  value={rejectedCartons}
                  onChange={(e) => setRejectedCartons(e.target.value)}
                  min="0"
                  max={stop.packingList?.totalCartons || 999}
                  className="w-full px-3 py-2.5 rounded-xl border border-border-glass bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                />
                <p className="text-[10px] text-on-surface-variant mt-1">
                  Total karton di packing list: {stop.packingList?.totalCartons || 0}. Jika sebagian ditolak, masukkan jumlah yang ditolak.
                </p>
              </div>
            </>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-on-surface-variant block mb-1">Catatan (opsional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-border-glass bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={submitting || (type === 'absen_in' && !coords)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
            style={{ backgroundColor: colors[type] }}
          >
            <TitleIcon />
            {submitting ? 'Menyimpan...' : type === 'absen_in' ? 'Catat Absensi' : type === 'delivered' ? 'Konfirmasi Terkirim' : 'Laporkan Penolakan'}
          </button>
        </div>
      </div>
    </div>
  );
};
