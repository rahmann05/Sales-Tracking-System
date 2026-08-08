import { useState, useMemo } from 'react';
import { notifySuccess } from '../../../services/notificationService';
import {
    SPV_MODES,
    PRIORITY_AUDIT_STOPS,
    OPENING_INSPECTION_TEAMS,
    DEFAULT_SPV_CHECKLIST,
} from '../../../constants/supervisor';

const nowWib = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' WIB';

// Daftar toko untuk mode Joint Visit berdasarkan sales yang didampingi
const buildJointVisitStops = (salesStops, selectedSales) => {
    let baseStops = salesStops.slice(0, 10);
    if (selectedSales === 'Siti Rahma') baseStops = salesStops.slice(10, 20);
    else if (selectedSales === 'Agus Wijaya') baseStops = salesStops.slice(20, 30);

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
};

const buildOpeningInspectionStops = (salesStops) =>
    OPENING_INSPECTION_TEAMS.map((team, i) => {
        const base = salesStops[team.index];
        return {
            id: `spv-open-${i + 1}`,
            sequence: i + 1,
            outletName: base?.outletName || team.fallbackOutlet,
            owner: base?.owner || team.fallbackOwner,
            phone: '0812-3456-7890',
            address: base?.address || team.fallbackAddress,
            currentDistance: team.distance,
            radiusMeters: 50,
            spvVisitType: team.type,
            assignedSales: team.sales,
        };
    });

/**
 * useSupervisorFieldVisits Hook
 * Single Responsibility: Encapsulate SPV field-visit state machine
 * (mode selection, visit records, absen in/out, audit form, off-PJP form, active modal).
 */
export const useSupervisorFieldVisits = (salesStops = []) => {
    const [spvMode, setSpvMode] = useState(SPV_MODES.JOINT_VISIT);
    const [selectedSales, setSelectedSales] = useState('Budi Santoso');
    const [activeModal, setActiveModal] = useState(null); // 'ABSEN_IN' | 'AUDIT' | 'ABSEN_OUT' | 'OFF_PJP'
    const [selectedStop, setSelectedStop] = useState(null);
    const [inputNotes, setInputNotes] = useState('');
    const [checklist, setChecklist] = useState(DEFAULT_SPV_CHECKLIST);
    const [offPjpForm, setOffPjpForm] = useState({ outletName: '', address: '', owner: '', reason: '' });

    const [spvVisitRecords, setSpvVisitRecords] = useState({
        'spv-stop-1': {
            status: 'COMPLETED',
            checkInTime: '08:45 WIB',
            checkOutTime: '09:20 WIB',
            notes: 'Kunjungan pembuka berjalan lancar. Sales tiba tepat waktu, pajangan display sembako rapi, ketersediaan stok 100%.',
            checklist: DEFAULT_SPV_CHECKLIST,
        },
        'spv-stop-2': {
            status: 'IN_VISIT',
            checkInTime: '09:35 WIB',
            checkOutTime: null,
            notes: '',
            checklist: DEFAULT_SPV_CHECKLIST,
        },
    });

    const spvStops = useMemo(() => {
        if (spvMode === SPV_MODES.JOINT_VISIT) return buildJointVisitStops(salesStops, selectedSales);
        if (spvMode === SPV_MODES.PRIORITY_AUDIT) return PRIORITY_AUDIT_STOPS;
        return buildOpeningInspectionStops(salesStops);
    }, [spvMode, selectedSales, salesStops]);

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
