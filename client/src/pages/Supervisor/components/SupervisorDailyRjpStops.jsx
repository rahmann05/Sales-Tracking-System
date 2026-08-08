import React, { useState, useMemo } from 'react';
import {
  LuMapPin,
  LuStore,
  LuClock,
  LuUser,
  LuCheck,
  LuPlus,
  LuSparkles,
  LuCircleCheck,
  LuFileText,
  LuCompass,
  LuNavigation,
  LuCalendar,
  LuX,
} from 'react-icons/lu';
import { Avatar } from '../../../components/common/Avatar';
import { notifySuccess } from '../../../services/notificationService';

/**
 * SupervisorDailyRjpStops Component
 * Single Responsibility: Manage & execute Supervisor's own daily RJP visit route
 * with dynamic selection modes (Joint Visit, Store Audit / High-Priority, Opening Inspection).
 */
export const SupervisorDailyRjpStops = ({
  salesStops = [],
  user = { name: 'Ahmad Subagja' },
}) => {
  // Mode Penentuan RJP Supervisi: 'JOINT_VISIT' | 'PRIORITY_AUDIT' | 'OPENING_INSPECTION'
  const [spvMode, setSpvMode] = useState('JOINT_VISIT');

  // Selected Sales for Joint Visit mode
  const [selectedSales, setSelectedSales] = useState('Budi Santoso');

  // Day filter
  const [selectedDay, setSelectedDay] = useState('Senin');

  // Local state for SPV's visit execution status
  const [spvVisitRecords, setSpvVisitRecords] = useState({
    'stop-1': { status: 'COMPLETED', checkInTime: '08:40 WIB', checkOutTime: '09:15 WIB', auditNotes: 'Display produk tertata rapi, stok minyak 2L tersedia 20 pouch. Kerjasama sales Budi sangat baik.' },
    'stop-2': { status: 'IN_VISIT', checkInTime: '09:30 WIB', checkOutTime: null, auditNotes: '' },
  });

  // Modal Audit state
  const [activeAuditStop, setActiveAuditStop] = useState(null);
  const [auditNotes, setAuditNotes] = useState('');
  const [checklist, setChecklist] = useState({
    stockAvailability: true,
    priceCompliance: true,
    posmDisplay: true,
    salesGreeting: true,
  });

  // Determine SPV's daily stops based on the selected mode
  const spvDailyStops = useMemo(() => {
    if (spvMode === 'JOINT_VISIT') {
      // Joint Visit: Pick 3-4 key stores from the selected sales' daily route
      let baseStops = salesStops.slice(0, 10);
      if (selectedSales === 'Siti Rahma') {
        baseStops = salesStops.slice(10, 20);
      } else if (selectedSales === 'Agus Wijaya') {
        baseStops = salesStops.slice(20, 30);
      }
      // Pick first 3-4 stores for SPV joint visit
      return baseStops.slice(0, 4).map((s, idx) => ({
        ...s,
        spvVisitType: idx === 0 ? 'Kunjungan Awal (Opening)' : 'Pendampingan Sales (Joint Visit)',
        assignedSales: selectedSales,
      }));
    }

    if (spvMode === 'PRIORITY_AUDIT') {
      // High-Priority Audit: Outlets with previous issues, high credit, or key accounts
      return [
        {
          id: 'spv-audit-1',
          sequence: 1,
          outletName: 'Grosir Berkah Jaya Abadi',
          address: 'Jl. Mahar Martanegara No. 45, Leuwigajah, Cimahi',
          owner: 'Haji Mansyur',
          phone: '0812-2222-1111',
          creditLimit: 50000000,
          outstanding: 15000000,
          spvVisitType: 'Audit Key Account & Plafon Kredit',
          assignedSales: 'Budi Santoso',
          radiusMeters: 50,
          currentDistance: 15,
        },
        {
          id: 'spv-audit-2',
          sequence: 2,
          outletName: 'Toko Sumber Rejeki Barokah',
          address: 'Jl. Raya Tagog Padalarang No. 88, KBB',
          owner: 'Ibu Ratna',
          phone: '0813-8888-9999',
          creditLimit: 25000000,
          outstanding: 0,
          spvVisitType: 'Verifikasi Outlet Baru / Non-Aktif',
          assignedSales: 'Siti Rahma',
          radiusMeters: 50,
          currentDistance: 30,
        },
        {
          id: 'spv-audit-3',
          sequence: 3,
          outletName: 'Toserba Lembang Asri Mandiri',
          address: 'Jl. Raya Lembang No. 120, Lembang',
          owner: 'Koh Kevin',
          phone: '0811-7777-6666',
          creditLimit: 35000000,
          outstanding: 5000000,
          spvVisitType: 'Audit Kepatuhan Display & Promosi',
          assignedSales: 'Agus Wijaya',
          radiusMeters: 50,
          currentDistance: 25,
        },
      ];
    }

    // OPENING_INSPECTION mode: First store of each sales rep
    return [
      {
        ...salesStops[0],
        spvVisitType: 'Inspeksi Pembuka Rute (Tim Cimahi)',
        assignedSales: 'Budi Santoso',
      },
      {
        ...salesStops[10] || salesStops[1],
        spvVisitType: 'Inspeksi Pembuka Rute (Tim Padalarang)',
        assignedSales: 'Siti Rahma',
      },
      {
        ...salesStops[20] || salesStops[2],
        spvVisitType: 'Inspeksi Pembuka Rute (Tim Lembang)',
        assignedSales: 'Agus Wijaya',
      },
    ];
  }, [spvMode, selectedSales, salesStops]);

  // Actions
  const handleCheckIn = (stopId, outletName) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    setSpvVisitRecords((prev) => ({
      ...prev,
      [stopId]: {
        ...prev[stopId],
        status: 'IN_VISIT',
        checkInTime: nowTime,
      },
    }));
    notifySuccess(`Absen Masuk Kunjungan Supervisi tercatat di ${outletName}!`);
  };

  const handleOpenAuditModal = (stop) => {
    setActiveAuditStop(stop);
    const existing = spvVisitRecords[stop.id];
    setAuditNotes(existing?.auditNotes || '');
  };

  const handleSaveAuditAndComplete = () => {
    if (!activeAuditStop) return;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    setSpvVisitRecords((prev) => ({
      ...prev,
      [activeAuditStop.id]: {
        ...prev[activeAuditStop.id],
        status: 'COMPLETED',
        checkOutTime: nowTime,
        auditNotes: auditNotes || 'Supervisi selesai. Standar kepatuhan toko dan tim sales terpenuhi.',
        checklist,
      },
    }));
    setActiveAuditStop(null);
    notifySuccess(`Kunjungan Supervisi di ${activeAuditStop.outletName} Selesai & Laporan Tersimpan!`);
  };

  const completedCount = spvDailyStops.filter(
    (s) => spvVisitRecords[s.id]?.status === 'COMPLETED'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Penentuan Mode Kunjungan SPV */}
      <div className="bg-surface border border-border-glass rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-glass pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
                <LuCompass />
              </span>
              <h3 className="text-lg font-black text-on-surface tracking-tight">
                RJP Kunjungan Supervisi Lapangan (Hari Ini)
              </h3>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Sebagai Supervisor, Anda memiliki agenda kunjungan toko terarah (Pendampingan Sales, Audit Toko Prioritas, atau Kunjungan Pembuka).
            </p>
          </div>

          {/* Quick Progress Badge */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              {completedCount} dari {spvDailyStops.length} Toko Disupervisi
            </span>
          </div>
        </div>

        {/* Mode Selector Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setSpvMode('JOINT_VISIT')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                spvMode === 'JOINT_VISIT'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-variant/30 text-on-surface-variant hover:bg-surface-variant/50'
              }`}
            >
              <LuUser className="text-xs" />
              <span>Mode Joint Visit (Dampingi Sales)</span>
            </button>

            <button
              type="button"
              onClick={() => setSpvMode('PRIORITY_AUDIT')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                spvMode === 'PRIORITY_AUDIT'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-variant/30 text-on-surface-variant hover:bg-surface-variant/50'
              }`}
            >
              <LuSparkles className="text-xs" />
              <span>Mode Audit Toko Prioritas</span>
            </button>

            <button
              type="button"
              onClick={() => setSpvMode('OPENING_INSPECTION')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                spvMode === 'OPENING_INSPECTION'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-variant/30 text-on-surface-variant hover:bg-surface-variant/50'
              }`}
            >
              <LuClock className="text-xs" />
              <span>Inspeksi Toko Pembuka (Pagi)</span>
            </button>
          </div>

          {/* Sub-Selector for Joint Visit */}
          {spvMode === 'JOINT_VISIT' && (
            <div className="flex items-center gap-2 bg-surface-variant/30 px-3 py-1.5 rounded-xl border border-border-glass">
              <span className="text-xs font-medium text-on-surface-variant">Dampingi:</span>
              <select
                value={selectedSales}
                onChange={(e) => setSelectedSales(e.target.value)}
                className="bg-transparent text-xs font-bold text-on-surface border-none outline-none cursor-pointer"
              >
                <option value="Budi Santoso">Budi Santoso (Cimahi)</option>
                <option value="Siti Rahma">Siti Rahma (Padalarang)</option>
                <option value="Agus Wijaya">Agus Wijaya (Lembang)</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* List of SPV's Daily Visit Stops */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-bold text-on-surface flex items-center gap-2">
              <LuStore className="text-primary text-base" />
              <span>Daftar Titik Toko Supervisi ({spvDailyStops.length} Outlet)</span>
            </h4>
            <p className="text-xs text-on-surface-variant">
              Lakukan Absen Masuk saat tiba di outlet dan isi checklist supervisi lapangan
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5">
          {spvDailyStops.map((stop, idx) => {
            const visitRecord = spvVisitRecords[stop.id] || { status: 'PENDING' };
            const isCompleted = visitRecord.status === 'COMPLETED';
            const isInVisit = visitRecord.status === 'IN_VISIT';

            return (
              <div
                key={stop.id || idx}
                className={`bg-surface border rounded-2xl p-5 shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isCompleted
                    ? 'border-emerald-500/30 bg-emerald-500/[0.02]'
                    : isInVisit
                    ? 'border-primary/50 shadow-md ring-1 ring-primary/20'
                    : 'border-border-glass hover:border-primary/30'
                }`}
              >
                {/* Left: Outlet & Visit Details */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : isInVisit
                        ? 'bg-primary text-on-primary animate-pulse'
                        : 'bg-surface-variant text-on-surface-variant'
                    }`}
                  >
                    {isCompleted ? <LuCheck /> : idx + 1}
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {stop.spvVisitType}
                      </span>
                      <span className="text-xs text-on-surface-variant flex items-center gap-1">
                        <LuUser className="text-xs text-primary" />
                        Sales: <strong className="text-on-surface font-semibold">{stop.assignedSales}</strong>
                      </span>
                    </div>

                    <h5 className="font-bold text-on-surface text-base tracking-tight">{stop.outletName}</h5>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1">
                      <LuMapPin className="text-primary text-xs shrink-0" />
                      <span>{stop.address}</span>
                    </p>

                    {/* Audit note if completed */}
                    {isCompleted && visitRecord.auditNotes && (
                      <div className="text-xs text-emerald-800 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 mt-1 flex items-start gap-2">
                        <LuCircleCheck className="text-emerald-600 text-sm shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block">Catatan Supervisi SPV:</span>
                          <p className="text-[11px]">{visitRecord.auditNotes}</p>
                          <span className="text-[10px] text-emerald-700 font-mono block mt-0.5">
                            Check-In: {visitRecord.checkInTime} • Check-Out: {visitRecord.checkOutTime}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2.5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-border-glass">
                  {visitRecord.status === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => handleCheckIn(stop.id, stop.outletName)}
                      className="px-5 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary/90 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <LuNavigation className="text-sm" />
                      <span>Absen Masuk Supervisi</span>
                    </button>
                  )}

                  {isInVisit && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenAuditModal(stop)}
                        className="px-4 py-2.5 bg-surface-variant text-on-surface font-bold text-xs rounded-xl hover:bg-surface-variant/80 transition-all border border-border-glass flex items-center gap-1.5 cursor-pointer"
                      >
                        <LuFileText className="text-sm text-primary" />
                        <span>Isi Checklist Audit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenAuditModal(stop)}
                        className="px-4 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <LuCheck className="text-sm" />
                        <span>Selesai Kunjungan</span>
                      </button>
                    </div>
                  )}

                  {isCompleted && (
                    <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1.5">
                      <LuCircleCheck className="text-sm" />
                      <span>Supervisi Selesai</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Checklist & Catatan Supervisi */}
      {activeAuditStop && (
        <div className="modal-backdrop">
          <div className="modal-content max-w-lg">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-glass pb-4">
              <div>
                <h3 className="text-lg font-black text-on-surface">Laporan Supervisi Outlet</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">{activeAuditStop.outletName}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveAuditStop(null)}
                className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-variant cursor-pointer"
              >
                <LuX className="text-lg" />
              </button>
            </div>

            {/* Checklist items */}
            <div className="space-y-4 py-2">
              <div>
                <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2.5">
                  Checklist Kepatuhan & Display Toko:
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-variant/30 border border-border-glass cursor-pointer hover:bg-surface-variant/50 text-xs">
                    <input
                      type="checkbox"
                      checked={checklist.stockAvailability}
                      onChange={(e) => setChecklist({ ...checklist, stockAvailability: e.target.checked })}
                      className="rounded accent-primary w-4 h-4"
                    />
                    <span className="font-semibold text-on-surface">Ketersediaan Stok Produk Inti (Sembako/Minyak/Beras)</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-variant/30 border border-border-glass cursor-pointer hover:bg-surface-variant/50 text-xs">
                    <input
                      type="checkbox"
                      checked={checklist.priceCompliance}
                      onChange={(e) => setChecklist({ ...checklist, priceCompliance: e.target.checked })}
                      className="rounded accent-primary w-4 h-4"
                    />
                    <span className="font-semibold text-on-surface">Kesesuaian Harga Jual & Ketentuan HET</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-variant/30 border border-border-glass cursor-pointer hover:bg-surface-variant/50 text-xs">
                    <input
                      type="checkbox"
                      checked={checklist.posmDisplay}
                      onChange={(e) => setChecklist({ ...checklist, posmDisplay: e.target.checked })}
                      className="rounded accent-primary w-4 h-4"
                    />
                    <span className="font-semibold text-on-surface">Pajangan Produk / Banner POSM Terpasang Rapi</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-variant/30 border border-border-glass cursor-pointer hover:bg-surface-variant/50 text-xs">
                    <input
                      type="checkbox"
                      checked={checklist.salesGreeting}
                      onChange={(e) => setChecklist({ ...checklist, salesGreeting: e.target.checked })}
                      className="rounded accent-primary w-4 h-4"
                    />
                    <span className="font-semibold text-on-surface">Pelayanan & Hubungan Sales dengan Pemilik Toko Baik</span>
                  </label>
                </div>
              </div>

              {/* Catatan Bebas SPV */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface block">
                  Catatan Supervisi / Evaluasi Sales Lapangan:
                </label>
                <textarea
                  rows={3}
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  placeholder="Tuliskan hasil evaluasi kunjungan, kendala display, atau arahan untuk sales..."
                  className="w-full p-3 rounded-xl bg-surface-variant/30 border border-border-glass text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-end gap-2.5 border-t border-border-glass pt-4">
              <button
                type="button"
                onClick={() => setActiveAuditStop(null)}
                className="px-4 py-2.5 rounded-xl border border-border-glass text-xs font-bold text-on-surface-variant hover:bg-surface-variant cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveAuditAndComplete}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <LuCheck className="text-sm" />
                <span>Simpan & Selesaikan Supervisi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
