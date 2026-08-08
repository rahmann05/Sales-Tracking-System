import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { useModal } from '../../../hooks/useModal';
import { notifySuccess } from '../../../services/notificationService';
import { SupervisorShiftHeader } from './SupervisorShiftHeader';
import {
  LuStore,
  LuCompass,
  LuClock,
  LuUser,
  LuCheck,
  LuPlus,
  LuSparkles,
  LuCircleCheck,
  LuFileText,
  LuNavigation,
  LuMapPin,
  LuCamera,
  LuX,
  LuTrendingUp,
} from 'react-icons/lu';

/**
 * SupervisorFieldView Component
 * Single Responsibility: Dedicated Field Workspace for Supervisor
 * (Shift Clock-In/Out, Daily Supervisor RJP Store Visits, GPS Geofence Check-in/out, Store Audits, Out-of-PJP Visits).
 * 1 File per Component
 */
export const SupervisorFieldView = () => {
  const { user, salesStops = [] } = useApp();

  // Mode Penentuan Titik Kunjungan SPV: 'JOINT_VISIT' | 'PRIORITY_AUDIT' | 'OPENING_INSPECTION'
  const [spvMode, setSpvMode] = useState('JOINT_VISIT');

  // Sales yang didampingi saat mode Joint Visit
  const [selectedSales, setSelectedSales] = useState('Budi Santoso');

  // Catatan eksekusi kunjungan toko SPV
  const [spvVisitRecords, setSpvVisitRecords] = useState({
    'spv-stop-1': {
      status: 'COMPLETED',
      checkInTime: '08:45 WIB',
      checkOutTime: '09:20 WIB',
      notes: 'Kunjungan pembuka berjalan lancar. Sales tiba tepat waktu, pajangan display sembako rapi, ketersediaan stok 100%.',
      checklist: { stockAvailability: true, priceCompliance: true, posmDisplay: true, salesGreeting: true },
    },
    'spv-stop-2': {
      status: 'IN_VISIT',
      checkInTime: '09:35 WIB',
      checkOutTime: null,
      notes: '',
      checklist: { stockAvailability: true, priceCompliance: true, posmDisplay: true, salesGreeting: true },
    },
  });

  // Modal states
  const [activeModal, setActiveModal] = useState(null); // 'ABSEN_IN' | 'AUDIT' | 'ABSEN_OUT' | 'OFF_PJP'
  const [selectedStop, setSelectedStop] = useState(null);

  // Form states
  const [inputNotes, setInputNotes] = useState('');
  const [checklist, setChecklist] = useState({
    stockAvailability: true,
    priceCompliance: true,
    posmDisplay: true,
    salesGreeting: true,
  });

  // Off-PJP Store state
  const [offPjpForm, setOffPjpForm] = useState({
    outletName: '',
    address: '',
    owner: '',
    reason: '',
  });

  // Daftar toko yang dikunjungi SPV berdasarkan mode yang dipilih
  const spvStops = useMemo(() => {
    if (spvMode === 'JOINT_VISIT') {
      let baseStops = salesStops.slice(0, 10);
      if (selectedSales === 'Siti Rahma') {
        baseStops = salesStops.slice(10, 20);
      } else if (selectedSales === 'Agus Wijaya') {
        baseStops = salesStops.slice(20, 30);
      }

      return baseStops.slice(0, 4).map((s, idx) => ({
        id: `spv-stop-${idx + 1}`,
        sequence: idx + 1,
        outletName: s.outletName || `Toko Pilihan ${idx + 1}`,
        owner: s.owner || 'Pemilik Toko',
        phone: s.phone || '0812-3456-7890',
        address: s.address || 'Jl. Raya Area Klaster',
        currentDistance: idx === 1 ? 15 : idx === 2 ? 35 : 55,
        radiusMeters: 50,
        spvVisitType: idx === 0 ? 'Inspeksi Pembuka Rute' : 'Pendampingan Sales (Joint Visit)',
        assignedSales: selectedSales,
      }));
    }

    if (spvMode === 'PRIORITY_AUDIT') {
      return [
        {
          id: 'spv-audit-1',
          sequence: 1,
          outletName: 'Grosir Berkah Jaya Abadi',
          owner: 'Haji Mansyur',
          phone: '0812-2222-1111',
          address: 'Jl. Mahar Martanegara No. 45, Leuwigajah, Cimahi',
          currentDistance: 12,
          radiusMeters: 50,
          spvVisitType: 'Audit Key Account & Plafon Kredit',
          assignedSales: 'Budi Santoso',
        },
        {
          id: 'spv-audit-2',
          sequence: 2,
          outletName: 'Toko Sumber Rejeki Barokah',
          owner: 'Ibu Ratna',
          phone: '0813-8888-9999',
          address: 'Jl. Raya Tagog Padalarang No. 88, KBB',
          currentDistance: 28,
          radiusMeters: 50,
          spvVisitType: 'Verifikasi Outlet Baru / Non-Aktif',
          assignedSales: 'Siti Rahma',
        },
        {
          id: 'spv-audit-3',
          sequence: 3,
          outletName: 'Toserba Lembang Asri Mandiri',
          owner: 'Koh Kevin',
          phone: '0811-7777-6666',
          address: 'Jl. Raya Lembang No. 120, Lembang',
          currentDistance: 45,
          radiusMeters: 50,
          spvVisitType: 'Audit Kepatuhan Display & Promosi',
          assignedSales: 'Agus Wijaya',
        },
      ];
    }

    // OPENING_INSPECTION mode
    return [
      {
        id: 'spv-open-1',
        sequence: 1,
        outletName: salesStops[0]?.outletName || 'Toko Sumber Berkah Cimahi',
        owner: salesStops[0]?.owner || 'Pak Haji Ahmad',
        phone: '0812-3456-7890',
        address: salesStops[0]?.address || 'Jl. Gandawijaya No. 12, Cimahi',
        currentDistance: 15,
        radiusMeters: 50,
        spvVisitType: 'Inspeksi Pembuka Rute (Tim Cimahi)',
        assignedSales: 'Budi Santoso',
      },
      {
        id: 'spv-open-2',
        sequence: 2,
        outletName: salesStops[10]?.outletName || 'Toko Barokah Padalarang',
        owner: salesStops[10]?.owner || 'Ibu Hajah Maryam',
        phone: '0813-9876-5432',
        address: salesStops[10]?.address || 'Jl. Raya Tagog No. 45, Padalarang',
        currentDistance: 32,
        radiusMeters: 50,
        spvVisitType: 'Inspeksi Pembuka Rute (Tim Padalarang)',
        assignedSales: 'Siti Rahma',
      },
      {
        id: 'spv-open-3',
        sequence: 3,
        outletName: salesStops[20]?.outletName || 'Toserba Mandiri Lembang',
        owner: salesStops[20]?.owner || 'Koh Hendra',
        phone: '0811-2345-6789',
        address: salesStops[20]?.address || 'Jl. Raya Lembang No. 88, Lembang',
        currentDistance: 48,
        radiusMeters: 50,
        spvVisitType: 'Inspeksi Pembuka Rute (Tim Lembang)',
        assignedSales: 'Agus Wijaya',
      },
    ];
  }, [spvMode, selectedSales, salesStops]);

  // Handlers
  const handleOpenAbsenIn = (stop) => {
    setSelectedStop(stop);
    setInputNotes('');
    setActiveModal('ABSEN_IN');
  };

  const handleConfirmAbsenIn = () => {
    if (!selectedStop) return;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    setSpvVisitRecords((prev) => ({
      ...prev,
      [selectedStop.id]: {
        ...prev[selectedStop.id],
        status: 'IN_VISIT',
        checkInTime: nowTime,
        notes: inputNotes || 'Tiba di outlet, memulai supervisi lapangan.',
      },
    }));
    setActiveModal(null);
    notifySuccess(`Absen Masuk Kunjungan Supervisi tercatat di ${selectedStop.outletName}!`);
  };

  const handleOpenAudit = (stop) => {
    setSelectedStop(stop);
    const existing = spvVisitRecords[stop.id];
    setInputNotes(existing?.notes || '');
    if (existing?.checklist) {
      setChecklist(existing.checklist);
    }
    setActiveModal('AUDIT');
  };

  const handleSaveAudit = () => {
    if (!selectedStop) return;
    setSpvVisitRecords((prev) => ({
      ...prev,
      [selectedStop.id]: {
        ...prev[selectedStop.id],
        notes: inputNotes || 'Audit display, ketersediaan produk, dan kepatuhan terpenuhi.',
        checklist,
      },
    }));
    setActiveModal(null);
    notifySuccess(`Hasil Checklist Audit di ${selectedStop.outletName} berhasil disimpan!`);
  };

  const handleOpenAbsenOut = (stop) => {
    setSelectedStop(stop);
    setActiveModal('ABSEN_OUT');
  };

  const handleConfirmAbsenOut = () => {
    if (!selectedStop) return;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    setSpvVisitRecords((prev) => ({
      ...prev,
      [selectedStop.id]: {
        ...prev[selectedStop.id],
        status: 'COMPLETED',
        checkOutTime: nowTime,
      },
    }));
    setActiveModal(null);
    notifySuccess(`Kunjungan Supervisi di ${selectedStop.outletName} SELESAI (Check-Out berhasil)!`);
  };

  const handleOpenOffPjp = () => {
    setOffPjpForm({ outletName: '', address: '', owner: '', reason: '' });
    setActiveModal('OFF_PJP');
  };

  const handleConfirmOffPjp = () => {
    if (!offPjpForm.outletName) return;
    notifySuccess(`Absen Kunjungan Luar Jadwal (${offPjpForm.outletName}) berhasil dicatat di log supervisi!`);
    setActiveModal(null);
  };

  // Metrics
  const completedCount = spvStops.filter((s) => spvVisitRecords[s.id]?.status === 'COMPLETED').length;
  const inVisitCount = spvStops.filter((s) => spvVisitRecords[s.id]?.status === 'IN_VISIT').length;

  return (
    <div className="space-y-6">
      {/* 1. Header Shift Presensi Supervisor */}
      <SupervisorShiftHeader />

      {/* 2. Overview Banner & Quick Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Target Kunjungan */}
        <div className="p-4 bg-surface rounded-2xl border border-border-glass shadow-sm space-y-1">
          <span className="text-[11px] text-on-surface-variant font-medium flex items-center gap-1">
            <LuStore className="text-primary text-xs" /> Target Kunjungan SPV
          </span>
          <div className="text-2xl font-black text-on-surface">
            {spvStops.length} <span className="text-xs font-normal text-on-surface-variant">Outlet Hari Ini</span>
          </div>
          <div className="text-[10px] text-primary font-semibold">
            {spvMode === 'JOINT_VISIT' ? `Joint Visit: ${selectedSales}` : spvMode === 'PRIORITY_AUDIT' ? 'Audit Toko Prioritas' : 'Inspeksi Pembuka'}
          </div>
        </div>

        {/* KPI 2: Kunjungan Selesai */}
        <div className="p-4 bg-surface rounded-2xl border border-border-glass shadow-sm space-y-1">
          <span className="text-[11px] text-on-surface-variant font-medium flex items-center gap-1">
            <LuCircleCheck className="text-emerald-600 text-xs" /> Supervisi Selesai
          </span>
          <div className="text-2xl font-black text-emerald-600">
            {completedCount} <span className="text-xs font-normal text-on-surface-variant">/ {spvStops.length} Toko</span>
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold">
            {Math.round((completedCount / spvStops.length) * 100)}% Realisasi Kunjungan
          </div>
        </div>

        {/* KPI 3: Sedang Kunjung */}
        <div className="p-4 bg-surface rounded-2xl border border-border-glass shadow-sm space-y-1">
          <span className="text-[11px] text-on-surface-variant font-medium flex items-center gap-1">
            <LuClock className="text-blue-600 text-xs" /> Sedang Disupervisi
          </span>
          <div className="text-2xl font-black text-blue-600">
            {inVisitCount} <span className="text-xs font-normal text-on-surface-variant">Outlet Aktif</span>
          </div>
          <div className="text-[10px] text-on-surface-variant">
            {inVisitCount > 0 ? 'Check-In aktif berjalan' : 'Siap ke outlet berikutnya'}
          </div>
        </div>

        {/* KPI 4: Geofence GPS Presensi */}
        <div className="p-4 bg-surface rounded-2xl border border-border-glass shadow-sm space-y-1">
          <span className="text-[11px] text-on-surface-variant font-medium flex items-center gap-1">
            <LuNavigation className="text-primary text-xs" /> Status GPS Lapangan
          </span>
          <div className="text-base font-black text-emerald-600 flex items-center gap-1 pt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span>GPS Akurat (±15m)</span>
          </div>
          <div className="text-[10px] text-on-surface-variant">
            Valid untuk Presensi & Audit Toko
          </div>
        </div>
      </div>

      {/* 3. Penentuan Titik Kunjungan Supervisi (Mode Bar) */}
      <div className="bg-surface border border-border-glass rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-glass pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
                <LuCompass />
              </span>
              <h3 className="text-lg font-black text-on-surface tracking-tight">
                Penentuan Agenda Kunjungan Supervisi Hari Ini
              </h3>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Pilih mode penentuan outlet kunjungan: Pendampingan Sales di lapangan, Audit Toko Prioritas, atau Kunjungan Pembuka Pagi.
            </p>
          </div>

          {/* Tombol Tambah Kunjungan Luar Jadwal */}
          <button
            type="button"
            onClick={handleOpenOffPjp}
            className="px-4 py-2.5 bg-surface-variant hover:bg-surface-variant/80 text-on-surface border border-border-glass rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 self-start md:self-auto"
          >
            <LuPlus className="text-primary text-sm" />
            <span>+ Kunjungan Luar RJP (Dadakan)</span>
          </button>
        </div>

        {/* Mode Selector Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setSpvMode('JOINT_VISIT')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
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
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
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
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
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
              <span className="text-xs font-medium text-on-surface-variant">Dampingi Sales:</span>
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

      {/* 4. Daftar Titik Outlet Kunjungan Supervisi */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-bold text-on-surface flex items-center gap-2">
              <LuStore className="text-primary text-base" />
              <span>Titik Kunjungan Toko Supervisi Lapangan ({spvStops.length} Outlet)</span>
            </h4>
            <p className="text-xs text-on-surface-variant">
              Lakukan Absen Masuk saat tiba di toko, periksa display dan stok, lalu lakukan Absen Keluar
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {spvStops.map((stop, idx) => {
            const record = spvVisitRecords[stop.id] || { status: 'PENDING' };
            const isCompleted = record.status === 'COMPLETED';
            const isInVisit = record.status === 'IN_VISIT';

            return (
              <div
                key={stop.id}
                className={`bg-surface border rounded-3xl p-5 md:p-6 shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 ${
                  isCompleted
                    ? 'border-emerald-500/30 bg-emerald-500/[0.02]'
                    : isInVisit
                    ? 'border-primary/50 shadow-md ring-1 ring-primary/30'
                    : 'border-border-glass hover:border-primary/30'
                }`}
              >
                {/* Left: Stop Info */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : isInVisit
                        ? 'bg-primary text-on-primary animate-pulse'
                        : 'bg-surface-variant text-on-surface-variant'
                    }`}
                  >
                    {isCompleted ? <LuCheck className="text-xl" /> : `#${idx + 1}`}
                  </div>

                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {stop.spvVisitType}
                      </span>
                      <span className="text-xs text-on-surface-variant flex items-center gap-1">
                        <LuUser className="text-xs text-primary" />
                        Sales: <strong className="text-on-surface font-semibold">{stop.assignedSales}</strong>
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                          stop.currentDistance <= stop.radiusMeters
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        }`}
                      >
                        <LuNavigation className="text-[10px]" />
                        {stop.currentDistance}m dari Toko (Radius {stop.radiusMeters}m)
                      </span>
                    </div>

                    <h5 className="font-bold text-on-surface text-lg tracking-tight">
                      {stop.outletName}
                    </h5>

                    <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
                      <LuMapPin className="text-primary text-xs shrink-0" />
                      <span>{stop.address} • Pemilik: <strong className="text-on-surface">{stop.owner}</strong> ({stop.phone})</span>
                    </p>

                    {/* Catatan hasil supervisi jika sudah dikunjungi */}
                    {isCompleted && record.notes && (
                      <div className="text-xs text-emerald-800 bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 mt-2 space-y-1">
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1.5">
                            <LuCircleCheck className="text-emerald-600 text-sm" />
                            Laporan Supervisi SPV:
                          </span>
                          <span className="text-[11px] font-mono text-emerald-700">
                            Masuk: {record.checkInTime} • Selesai: {record.checkOutTime}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed">{record.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex items-center gap-2.5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-border-glass">
                  {record.status === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => handleOpenAbsenIn(stop)}
                      className="px-5 py-3 bg-primary text-on-primary font-bold text-xs rounded-2xl hover:bg-primary/90 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      <LuCamera className="text-base" />
                      <span>Absen Masuk (Clock In)</span>
                    </button>
                  )}

                  {isInVisit && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenAudit(stop)}
                        className="px-4 py-3 bg-surface-variant text-on-surface font-bold text-xs rounded-2xl hover:bg-surface-variant/80 transition-all border border-border-glass flex items-center gap-2 cursor-pointer"
                      >
                        <LuFileText className="text-base text-primary" />
                        <span>Form Audit & Checklist</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenAbsenOut(stop)}
                        className="px-5 py-3 bg-emerald-600 text-white font-bold text-xs rounded-2xl hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                      >
                        <LuCheck className="text-base" />
                        <span>Absen Keluar (Selesai)</span>
                      </button>
                    </div>
                  )}

                  {isCompleted && (
                    <span className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-2">
                      <LuCircleCheck className="text-base" />
                      <span>Supervisi Selesai</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ABSEN MASUK KUNJUNGAN SUPERVISI                                   */}
      {/* ========================================================================= */}
      {activeModal === 'ABSEN_IN' && selectedStop && (
        <div className="modal-backdrop">
          <div className="modal-content max-w-md">
            <div className="flex items-center justify-between border-b border-border-glass pb-4">
              <div>
                <h3 className="text-lg font-black text-on-surface">Absen Masuk Kunjungan Supervisi</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">{selectedStop.outletName}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-variant cursor-pointer"
              >
                <LuX className="text-lg" />
              </button>
            </div>

            <div className="space-y-4 py-3">
              {/* Kamera Foto Selfie Toko */}
              <div className="h-44 bg-surface-variant/40 rounded-2xl border-2 border-dashed border-border-glass flex flex-col items-center justify-center text-center p-4">
                <LuCamera className="text-3xl text-primary mb-2" />
                <span className="text-xs font-bold text-on-surface">Foto Kehadiran di Outlet</span>
                <span className="text-[10px] text-on-surface-variant mt-0.5">
                  GPS Terverifikasi: Radius {selectedStop.currentDistance}m dari lokasi outlet
                </span>
              </div>

              {/* Catatan Awal */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface block">
                  Catatan Awal Kunjungan (Opsional):
                </label>
                <input
                  type="text"
                  value={inputNotes}
                  onChange={(e) => setInputNotes(e.target.value)}
                  placeholder="Kondisi toko saat tiba, sales pendamping, dll..."
                  className="w-full p-3 rounded-xl bg-surface-variant/30 border border-border-glass text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-border-glass pt-4">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2.5 rounded-xl border border-border-glass text-xs font-bold text-on-surface-variant hover:bg-surface-variant cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmAbsenIn}
                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <LuCheck className="text-base" />
                <span>Konfirmasi Absen Masuk</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CHECKLIST AUDIT & EVALUASI SPV                                    */}
      {/* ========================================================================= */}
      {activeModal === 'AUDIT' && selectedStop && (
        <div className="modal-backdrop">
          <div className="modal-content max-w-lg">
            <div className="flex items-center justify-between border-b border-border-glass pb-4">
              <div>
                <h3 className="text-lg font-black text-on-surface">Form Audit & Evaluasi Supervisi</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">{selectedStop.outletName}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-variant cursor-pointer"
              >
                <LuX className="text-lg" />
              </button>
            </div>

            <div className="space-y-4 py-2">
              <div>
                <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2.5">
                  Checklist Kepatuhan Toko & Evaluasi Sales:
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
                  Catatan Supervisi / Arahan Khusus untuk Sales Lapangan:
                </label>
                <textarea
                  rows={3}
                  value={inputNotes}
                  onChange={(e) => setInputNotes(e.target.value)}
                  placeholder="Tuliskan temuan display, potensi order tambahan, atau instruksi untuk sales..."
                  className="w-full p-3 rounded-xl bg-surface-variant/30 border border-border-glass text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-border-glass pt-4">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2.5 rounded-xl border border-border-glass text-xs font-bold text-on-surface-variant hover:bg-surface-variant cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveAudit}
                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <LuCheck className="text-base" />
                <span>Simpan Checklist Audit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ABSEN KELUAR (CHECK-OUT) SUPERVISI                                */}
      {/* ========================================================================= */}
      {activeModal === 'ABSEN_OUT' && selectedStop && (
        <div className="modal-backdrop">
          <div className="modal-content max-w-md">
            <div className="flex items-center justify-between border-b border-border-glass pb-4">
              <div>
                <h3 className="text-lg font-black text-on-surface">Absen Keluar (Selesai Kunjungan)</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">{selectedStop.outletName}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-variant cursor-pointer"
              >
                <LuX className="text-lg" />
              </button>
            </div>

            <div className="space-y-4 py-3 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-3xl mx-auto">
                <LuCircleCheck />
              </div>
              <div>
                <h4 className="font-bold text-on-surface text-base">Selesaikan Kunjungan Supervisi?</h4>
                <p className="text-xs text-on-surface-variant max-w-xs mx-auto mt-1">
                  Waktu check-out akan dicatat dan status kunjungan outlet akan berubah menjadi Selesai.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-border-glass pt-4">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2.5 rounded-xl border border-border-glass text-xs font-bold text-on-surface-variant hover:bg-surface-variant cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmAbsenOut}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <LuCheck className="text-base" />
                <span>Konfirmasi Selesai</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ABSEN KUNJUNGAN LUAR JADWAL / TOKO DADAKAN                       */}
      {/* ========================================================================= */}
      {activeModal === 'OFF_PJP' && (
        <div className="modal-backdrop">
          <div className="modal-content max-w-md">
            <div className="flex items-center justify-between border-b border-border-glass pb-4">
              <div>
                <h3 className="text-lg font-black text-on-surface">Kunjungan Supervisi Luar RJP</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Catat kunjungan toko di luar agenda harian</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-variant cursor-pointer"
              >
                <LuX className="text-lg" />
              </button>
            </div>

            <div className="space-y-3.5 py-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface block">Nama Outlet / Toko:</label>
                <input
                  type="text"
                  value={offPjpForm.outletName}
                  onChange={(e) => setOffPjpForm({ ...offPjpForm, outletName: e.target.value })}
                  placeholder="Misal: Toko Berkah Abadi"
                  className="w-full p-3 rounded-xl bg-surface-variant/30 border border-border-glass text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface block">Alamat / Lokasi Toko:</label>
                <input
                  type="text"
                  value={offPjpForm.address}
                  onChange={(e) => setOffPjpForm({ ...offPjpForm, address: e.target.value })}
                  placeholder="Misal: Jl. Raya Cimahi No. 100"
                  className="w-full p-3 rounded-xl bg-surface-variant/30 border border-border-glass text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface block">Alasan Kunjungan Supervisi:</label>
                <textarea
                  rows={2}
                  value={offPjpForm.reason}
                  onChange={(e) => setOffPjpForm({ ...offPjpForm, reason: e.target.value })}
                  placeholder="Misal: Permintaan audit toko baru, penyelesaian sengketa barang, dll..."
                  className="w-full p-3 rounded-xl bg-surface-variant/30 border border-border-glass text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-border-glass pt-4">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2.5 rounded-xl border border-border-glass text-xs font-bold text-on-surface-variant hover:bg-surface-variant cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmOffPjp}
                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <LuCheck className="text-base" />
                <span>Simpan Absen Supervisi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
