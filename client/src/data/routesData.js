import { INITIAL_SALES_STOPS } from './salesStopsData';

// Initial Active Routes for Dashboard Tracking (3 Routes x 10 Outlets = 30 Total Outlets)
export const INITIAL_ACTIVE_ROUTES = [
    {
        id: '#CM-8492',
        name: 'RJP-CIMAHI-01 (Klaster Cimahi Tengah)',
        status: 'In Transit',
        borderColor: 'var(--secondary-fixed)',
        repName: 'Budi Santoso',
        lastPosition: { lat: -6.8700, lng: 107.5400 },
        avatar: null,
        stops: INITIAL_SALES_STOPS.slice(0, 10),
        distance: '8.4 km',
        stopsLeft: '10 Toko',
        progress: 30,
    },
    {
        id: '#KBB-8493',
        name: 'RJP-PADALARANG-01 (Klaster Padalarang)',
        status: 'In Transit',
        borderColor: 'var(--primary)',
        repName: 'Siti Rahma',
        lastPosition: { lat: -6.8360, lng: 107.4750 },
        avatar: null,
        stops: INITIAL_SALES_STOPS.slice(10, 20),
        distance: '12.1 km',
        stopsLeft: '10 Toko',
        progress: 50,
    },
    {
        id: '#KBB-8491',
        name: 'RJP-LEMBANG-01 (Klaster Lembang)',
        status: 'Delayed',
        borderColor: 'var(--error)',
        repName: 'Agus Wijaya',
        lastPosition: { lat: -6.8150, lng: 107.6130 },
        avatar: null,
        warning: 'Kemacetan di Pertigaan Lembang',
        stops: INITIAL_SALES_STOPS.slice(20, 30),
        distance: '9.6 km',
        stopsLeft: '10 Toko',
        progress: 20,
    },
];

// Initial Master PJP Routes for Route Planning
export const INITIAL_MASTER_ROUTES = [
    { id: 'R-101', name: 'RJP-CIMAHI-01 (Klaster Cimahi Tengah)', rep: 'Budi Santoso', stops: 10, completion: '30%', status: 'Active', days: ['Senin'], spvTeam: 'Tim SPV Ahmad Subagja' },
    { id: 'R-102', name: 'RJP-PADALARANG-01 (Klaster Padalarang)', rep: 'Siti Rahma', stops: 10, completion: '50%', status: 'In Transit', days: ['Selasa'], spvTeam: 'Tim SPV Ahmad Subagja' },
    { id: 'R-103', name: 'RJP-LEMBANG-01 (Klaster Lembang)', rep: 'Agus Wijaya', stops: 10, completion: '20%', status: 'Scheduled', days: ['Rabu'], spvTeam: 'Tim SPV Ahmad Subagja' },
];

// Initial Off-PJP Store Absen Records
export const INITIAL_OFF_PJP_ATTENDANCES = [
    {
        id: 'absen-off-101',
        salesName: 'Budi Santoso',
        outletName: 'Toko Berkah Utama Cimahi',
        address: 'Jl. Raya Amir Machmud No. 150, Cimahi',
        timestamp: '09:45 WIB',
        photoUrl: null,
        reason: 'Kunjungan sales mendadak di luar rute harian RJP',
        spvName: 'Ahmad Subagja',
        spvTeam: 'Tim SPV Ahmad Subagja (Cimahi - KBB)',
        validationStatus: 'MENUNGGU', // 'MENUNGGU', 'TERVALIDASI', 'TIDAK_TERVALIDASI', 'DITOLAK'
    },
];
