import React, { useState } from 'react';
import { 
  LuCompass, 
  LuShieldAlert, 
  LuHistory 
} from 'react-icons/lu';
import { FiCheckCircle, FiXCircle, FiEdit } from 'react-icons/fi';
import { Card } from '../../../components/common/Card';

export const OpsOffPjpOverridePanel = ({ 
  offPjpAttendances = [], 
  onOverride 
}) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [overrideStatus, setOverrideStatus] = useState('TERVALIDASI');
  const [overrideReason, setOverrideReason] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openOverrideModal = (item) => {
    setSelectedItem(item);
    setOverrideStatus(item.validationStatus === 'TERVALIDASI' ? 'DITOLAK' : 'TERVALIDASI');
    setOverrideReason('');
    setIsModalOpen(true);
  };

  const handleConfirmOverride = (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    onOverride({
      attendanceId: selectedItem.id,
      newStatus: overrideStatus,
      overrideReason: overrideReason || 'Disesuaikan oleh Manajer Operasional setelah evaluasi',
    });

    setIsModalOpen(false);
    setSelectedItem(null);
  };

  return (
    <div className="space-y-4">
      <Card className="!p-0 rounded-2xl border border-border-glass overflow-hidden">
        <div className="p-4 border-b border-border-glass flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-bold text-sm text-on-surface flex items-center gap-2">
              <LuShieldAlert className="text-amber-500" />
              <span>Audit & Hak Koreksi (Override) Presensi Luar RJP</span>
            </h4>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Manajer Operasional berwenang membatalkan atau merevisi validasi SPV jika ditemukan ketidaksesuaian
            </p>
          </div>
          <span className="text-xs font-bold text-on-surface-variant bg-surface-variant/40 px-2.5 py-1 rounded-full w-fit">
            {offPjpAttendances.length} Total Data
          </span>
        </div>

        {offPjpAttendances.length === 0 ? (
          <p className="text-xs text-on-surface-variant p-6 text-center">
            Belum ada presensi toko luar RJP yang dicatat.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-surface-variant/30 text-on-surface-variant font-bold border-b border-border-glass">
                <tr>
                  <th className="py-3 px-4">Sales & Toko</th>
                  <th className="py-3 px-4">Alasan Kunjungan</th>
                  <th className="py-3 px-4">Status SPV</th>
                  <th className="py-3 px-4">Audit Trail / Override Ops</th>
                  <th className="py-3 px-4 text-center">Aksi Manajerial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-glass">
                {offPjpAttendances.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-variant/10 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-on-surface">{item.outletName}</div>
                      <div className="text-[11px] text-on-surface-variant">
                        Sales: <span className="font-semibold text-on-surface">{item.salesName}</span> ({item.time || 'Hari ini'})
                      </div>
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant max-w-[200px]">
                      {item.reason || 'Kunjungan prospek / darurat'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.validationStatus === 'TERVALIDASI'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : item.validationStatus === 'DITOLAK'
                            ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                        }`}
                      >
                        {item.validationStatus || 'MENUNGGU'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[11px]">
                      {item.opsOverrideNote ? (
                        <div className="p-2 bg-amber-500/5 rounded-lg border border-amber-500/15 space-y-0.5">
                          <span className="font-bold text-amber-700 flex items-center gap-1">
                            <LuHistory className="text-[10px]" /> Override oleh {item.opsOverrideBy}
                          </span>
                          <p className="text-[10px] text-on-surface-variant italic">"{item.opsOverrideNote}"</p>
                        </div>
                      ) : (
                        <span className="text-on-surface-variant text-[10px] italic">Mengikuti keputusan SPV</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => openOverrideModal(item)}
                        className="px-3 py-1 bg-surface-variant/40 hover:bg-surface-variant/70 border border-border-glass text-on-surface rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        <FiEdit className="text-[11px]" />
                        <span>Override</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Override */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border-glass rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-base font-black text-on-surface flex items-center gap-2">
                <LuShieldAlert className="text-amber-500" />
                <span>Override Status Presensi Luar RJP</span>
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Koreksi keputusan validasi untuk toko <span className="font-bold text-on-surface">{selectedItem.outletName}</span> (Sales: {selectedItem.salesName})
              </p>
            </div>

            <form onSubmit={handleConfirmOverride} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface">Keputusan Baru Manajer Operasional</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOverrideStatus('TERVALIDASI')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      overrideStatus === 'TERVALIDASI'
                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                        : 'bg-surface-variant/30 text-on-surface-variant border-border-glass'
                    }`}
                  >
                    <FiCheckCircle /> Sahkan (Tervalidasi)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverrideStatus('DITOLAK')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      overrideStatus === 'DITOLAK'
                        ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                        : 'bg-surface-variant/30 text-on-surface-variant border-border-glass'
                    }`}
                  >
                    <FiXCircle /> Tolak Presensi
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface">Alasan Override / Catatan Audit</label>
                <textarea
                  rows="3"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Contoh: Telah dikonfirmasi ke pemilik toko, presensi disahkan untuk pembukaan akun baru."
                  className="w-full text-xs p-3 rounded-xl bg-surface-variant/20 border border-border-glass text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-surface-variant/40 hover:bg-surface-variant/70 text-on-surface-variant rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold transition-all shadow-sm hover:opacity-90 cursor-pointer"
                >
                  Simpan Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
