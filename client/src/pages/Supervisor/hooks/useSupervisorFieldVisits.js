import { useState, useMemo, useEffect } from 'react';
import { notifySuccess } from '../../../services/notificationService';
import {
    SPV_MODES,
    DEFAULT_SPV_CHECKLIST,
} from '../../../constants/supervisor';

const nowWib = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' WIB';

// Extract stops from actual PJP based on selected sales name
const buildJointVisitStops = (todayPjps, selectedSales) => {
    const pjp = todayPjps.find(p => p.user?.name === selectedSales);
    if (!pjp || !pjp.stops) return [];
    
    return pjp.stops.slice(0, 4).map((s, idx) => ({
        id: `spv-stop-${s.id}`,
        sequence: idx + 1,
        outletName: s.outlet?.name || `Toko Pilihan ${idx + 1}`,
        owner: s.outlet?.ownerName || 'Tidak ada data',
        phone: s.outlet?.phone || 'Tidak ada data',
        address: s.outlet?.address || 'Tidak ada data',
        currentDistance: 0, // TODO: Hubungkan ke OSRM/Routing API untuk distance sebenarnya
        radiusMeters: s.outlet?.radiusMeters || 50,
        spvVisitType: idx === 0 ? 'Inspeksi Pembuka Rute' : 'Pendampingan Sales (Joint Visit)',
        assignedSales: selectedSales,
    }));
};

const buildPriorityAuditStops = (todayPjps) => {
    // Pick the first stop from up to 3 different PJPs as priority audits
    const audits = [];
    for (let i = 0; i < Math.min(3, todayPjps.length); i++) {
        const pjp = todayPjps[i];
        if (pjp.stops && pjp.stops.length > 0) {
            const s = pjp.stops[0];
            audits.push({
                id: `spv-audit-${s.id}`,
                sequence: i + 1,
                outletName: s.outlet?.name || `Toko Pilihan ${i + 1}`,
                owner: s.outlet?.ownerName || 'Tidak ada data',
                phone: s.outlet?.phone || 'Tidak ada data',
                address: s.outlet?.address || 'Tidak ada data',
                currentDistance: 0,
                radiusMeters: s.outlet?.radiusMeters || 50,
                spvVisitType: 'Audit Key Account & Plafon Kredit',
                assignedSales: pjp.user?.name || 'Sales',
            });
        }
    }
    return audits;
};

const buildOpeningInspectionStops = (todayPjps) => {
    // Pick the second stop from up to 3 different PJPs as opening inspections
    const opens = [];
    for (let i = 0; i < Math.min(3, todayPjps.length); i++) {
        const pjp = todayPjps[i];
        if (pjp.stops && pjp.stops.length > 1) {
            const s = pjp.stops[1];
            opens.push({
                id: `spv-open-${s.id}`,
                sequence: i + 1,
                outletName: s.outlet?.name || `Toko Pilihan ${i + 1}`,
                owner: s.outlet?.ownerName || 'Tidak ada data',
                phone: s.outlet?.phone || 'Tidak ada data',
                address: s.outlet?.address || 'Tidak ada data',
                currentDistance: 0,
                radiusMeters: s.outlet?.radiusMeters || 50,
                spvVisitType: 'Inspeksi Pembuka Rute',
                assignedSales: pjp.user?.name || 'Sales',
            });
        }
    }
    return opens;
};

/**
 * useSupervisorFieldVisits Hook
 * Single Responsibility: Encapsulate SPV field-visit state machine
 * (mode selection, visit records, absen in/out, audit form, off-PJP form, active modal).
 */
export const useSupervisorFieldVisits = (todayPjps = [], salesOptions = []) => {
    const [spvMode, setSpvMode] = useState(SPV_MODES.JOINT_VISIT);
    const [selectedSales, setSelectedSales] = useState('');
    
    // Auto-select first sales when options load
    useEffect(() => {
      if (salesOptions.length > 0 && !selectedSales) {
          setSelectedSales(salesOptions[0].value);
      }
    }, [salesOptions, selectedSales]);

    const [activeModal, setActiveModal] = useState(null); // 'ABSEN_IN' | 'AUDIT' | 'ABSEN_OUT' | 'OFF_PJP'
    const [selectedStop, setSelectedStop] = useState(null);
    const [inputNotes, setInputNotes] = useState('');
    const [checklist, setChecklist] = useState(DEFAULT_SPV_CHECKLIST);
    const [offPjpForm, setOffPjpForm] = useState({ outletName: '', address: '', owner: '', reason: '' });

    const [spvVisitRecords, setSpvVisitRecords] = useState({});

    const spvStops = useMemo(() => {
        if (spvMode === SPV_MODES.JOINT_VISIT) return buildJointVisitStops(todayPjps, selectedSales);
        if (spvMode === SPV_MODES.PRIORITY_AUDIT) return buildPriorityAuditStops(todayPjps);
        return buildOpeningInspectionStops(todayPjps);
    }, [spvMode, selectedSales, todayPjps]);

    const updateRecord = (stopId, patch) =>
        setSpvVisitRecords((prev) => ({ ...prev, [stopId]: { ...prev[stopId], ...patch } }));

    const openAbsenIn = (stop) => {
        setSelectedStop(stop);
        setInputNotes('');
        setActiveModal('ABSEN_IN');
    };

    const confirmAbsenIn = () => {
        if (!selectedStop) return;
        updateRecord(selectedStop.id, {
            status: 'IN_VISIT',
            checkInTime: nowWib(),
            notes: inputNotes || 'Tiba di outlet, memulai supervisi lapangan.',
        });
        setActiveModal(null);
        notifySuccess(`Absen Masuk Kunjungan Supervisi tercatat di ${selectedStop.outletName}!`);
    };

    const openAudit = (stop) => {
        setSelectedStop(stop);
        const existing = spvVisitRecords[stop.id];
        setInputNotes(existing?.notes || '');
        if (existing?.checklist) setChecklist(existing.checklist);
        setActiveModal('AUDIT');
    };

    const saveAudit = () => {
        if (!selectedStop) return;
        updateRecord(selectedStop.id, {
            notes: inputNotes || 'Audit display, ketersediaan produk, dan kepatuhan terpenuhi.',
            checklist,
        });
        setActiveModal(null);
        notifySuccess(`Hasil Checklist Audit di ${selectedStop.outletName} berhasil disimpan!`);
    };

    const openAbsenOut = (stop) => {
        setSelectedStop(stop);
        setActiveModal('ABSEN_OUT');
    };

    const confirmAbsenOut = () => {
        if (!selectedStop) return;
        updateRecord(selectedStop.id, { status: 'COMPLETED', checkOutTime: nowWib() });
        setActiveModal(null);
        notifySuccess(`Kunjungan Supervisi di ${selectedStop.outletName} SELESAI (Check-Out berhasil)!`);
    };

    const openOffPjp = () => {
        setOffPjpForm({ outletName: '', address: '', owner: '', reason: '' });
        setActiveModal('OFF_PJP');
    };

    const confirmOffPjp = () => {
        if (!offPjpForm.outletName) return;
        notifySuccess(`Absen Kunjungan Luar Jadwal (${offPjpForm.outletName}) berhasil dicatat di log supervisi!`);
        setActiveModal(null);
    };

    const closeModal = () => setActiveModal(null);

    const completedCount = spvStops.filter((s) => spvVisitRecords[s.id]?.status === 'COMPLETED').length;
    const inVisitCount = spvStops.filter((s) => spvVisitRecords[s.id]?.status === 'IN_VISIT').length;

    return {
        spvMode, setSpvMode,
        selectedSales, setSelectedSales,
        spvStops, spvVisitRecords,
        activeModal, selectedStop, closeModal,
        inputNotes, setInputNotes,
        checklist, setChecklist,
        offPjpForm, setOffPjpForm,
        completedCount, inVisitCount,
        openAbsenIn, confirmAbsenIn,
        openAudit, saveAudit,
        openAbsenOut, confirmAbsenOut,
        openOffPjp, confirmOffPjp,
    };
};
