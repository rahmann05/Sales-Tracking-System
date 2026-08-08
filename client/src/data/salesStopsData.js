// Initial Mock PJP Outlets for Sales
// 1 Region (Region Cimahi - Bandung Barat), 3 Rencana PJP / Cluster x 10 Toko = 30 Total Outlet

// ==========================================
// RENCANA PJP 1: RJP-CIMAHI-01 (10 TOKO)
// Region: Region Cimahi - Bandung Barat
// Day: Senin & Sabtu (Budi Santoso)
// ==========================================
const CIMAHI_STOPS = [
    { id: 'stop-101', sequence: 1, customerName: 'Toko Sumber Rezeki', outletName: 'Toko Sumber Rezeki', owner: 'Hj. Aminah', phone: '0812-3456-7890', address: 'Jl. Raya Amir Machmud No. 12, Cimahi', latitude: -6.8722, longitude: 107.5423 },
    { id: 'stop-102', sequence: 2, customerName: 'Toko Harapan Bersama', outletName: 'Toko Harapan Bersama', owner: 'Pak Mulyadi', phone: '0812-9988-7766', address: 'Jl. Cihanjuang No. 45, Cimahi', latitude: -6.8750, longitude: 107.5450 },
    { id: 'stop-103', sequence: 3, customerName: 'Kelontong Jaya Makmur', outletName: 'Kelontong Jaya Makmur', owner: 'Ibu Ratna', phone: '0813-1122-3344', address: 'Jl. Pesantren No. 88, Cimahi', latitude: -6.8680, longitude: 107.5390 },
    { id: 'stop-104', sequence: 4, customerName: 'Grosir Berkah Cimahi', outletName: 'Grosir Berkah Cimahi', owner: 'H. Dudung', phone: '0812-4455-6677', address: 'Jl. Mahar Martanegara No. 102, Cimahi', latitude: -6.8790, longitude: 107.5410 },
    { id: 'stop-105', sequence: 5, customerName: 'Minimarket Abadi', outletName: 'Minimarket Abadi', owner: 'Pak Tommy', phone: '0815-6677-8899', address: 'Jl. Gandawijaya No. 15, Cimahi', latitude: -6.8710, longitude: 107.5480 },
    { id: 'stop-106', sequence: 6, customerName: 'Warung Sembako Barokah', outletName: 'Warung Sembako Barokah', owner: 'Ibu Eni', phone: '0812-3322-1100', address: 'Jl. Kolonel Masturi No. 67, Cimahi', latitude: -6.8650, longitude: 107.5430 },
    { id: 'stop-107', sequence: 7, customerName: 'Toko Rezeki Utama', outletName: 'Toko Rezeki Utama', owner: 'Pak Hendra', phone: '0813-7788-9900', address: 'Jl. Sangkuriang No. 23, Cimahi', latitude: -6.8765, longitude: 107.5360 },
    { id: 'stop-108', sequence: 8, customerName: 'Agen Snack Cimahi', outletName: 'Agen Snack Cimahi', owner: 'Ibu Yanti', phone: '0812-5544-3322', address: 'Jl. Kerkof No. 90, Leuwigajah', latitude: -6.8810, longitude: 107.5445 },
    { id: 'stop-109', sequence: 9, customerName: 'Minimarket Melati', outletName: 'Minimarket Melati', owner: 'Pak Usman', phone: '0813-9900-1122', address: 'Jl. Gatot Subroto No. 40, Cimahi', latitude: -6.8695, longitude: 107.5510 },
    { id: 'stop-110', sequence: 10, customerName: 'Toko Mulia Sembako', outletName: 'Toko Mulia Sembako', owner: 'Hj. Ningsih', phone: '0812-8877-6655', address: 'Jl. Baros No. 18, Cimahi', latitude: -6.8735, longitude: 107.5385 },
].map((s) => ({
    ...s,
    callplanName: 'RJP-CIMAHI-01',
    clusterName: 'Klaster Cimahi Tengah',
    regionName: 'Region Cimahi - Bandung Barat',
    dayOfWeek: ['Senin', 'Sabtu'],
    assignedSalesName: 'Budi Santoso',
    customerId: `CUST-00${s.sequence}`,
    outletCode: `CUST-00${s.sequence}`,
    status: 'PENDING',
}));

// ==========================================
// RENCANA PJP 2: RJP-PADALARANG-01 (10 TOKO)
// Region: Region Cimahi - Bandung Barat
// Day: Selasa & Sabtu (Budi Santoso)
// ==========================================
const PADALARANG_STOPS = [
    { id: 'stop-201', sequence: 1, customerName: 'Minimarket Maju Jaya', outletName: 'Minimarket Maju Jaya', owner: 'Pak Koes', phone: '0813-8888-9999', address: 'Jl. Raya Padalarang No. 88, KBB', latitude: -6.8375, longitude: 107.4764 },
    { id: 'stop-202', sequence: 2, customerName: 'Toko Sembako Sejahtera', outletName: 'Toko Sembako Sejahtera', owner: 'Pak Dadang', phone: '0812-1111-2222', address: 'Jl. Stasiun Padalarang No. 12, KBB', latitude: -6.8390, longitude: 107.4790 },
    { id: 'stop-203', sequence: 3, customerName: 'Grosir Padalarang Indah', outletName: 'Grosir Padalarang Indah', owner: 'H. Anwar', phone: '0813-3333-4444', address: 'Jl. Tagog Padalarang No. 55, KBB', latitude: -6.8350, longitude: 107.4730 },
    { id: 'stop-204', sequence: 4, customerName: 'Warung Kelontong Pak Eko', outletName: 'Warung Kelontong Pak Eko', owner: 'Pak Eko', phone: '0811-5555-6666', address: 'Jl. Purwakarta No. 104, Padalarang', latitude: -6.8415, longitude: 107.4755 },
    { id: 'stop-205', sequence: 5, customerName: 'Agen Sembako Baraya', outletName: 'Agen Sembako Baraya', owner: 'Ibu Maya', phone: '0812-7777-8888', address: 'Jl. Kertajaya No. 33, Padalarang', latitude: -6.8320, longitude: 107.4810 },
    { id: 'stop-206', sequence: 6, customerName: 'Toko Murah Meriah', outletName: 'Toko Murah Meriah', owner: 'Pak Herman', phone: '0813-9999-0000', address: 'Jl. Simpang Padalarang No. 70, KBB', latitude: -6.8440, longitude: 107.4780 },
    { id: 'stop-207', sequence: 7, customerName: 'Minimarket Sentosa Padalarang', outletName: 'Minimarket Sentosa Padalarang', owner: 'Ibu Rina', phone: '0812-2233-4411', address: 'Jl. Cemerlang No. 89, KBB', latitude: -6.8360, longitude: 107.4850 },
    { id: 'stop-208', sequence: 8, customerName: 'Toko Berkah Mandiri', outletName: 'Toko Berkah Mandiri', owner: 'Pak Joko', phone: '0813-4455-6622', address: 'Jl. Panaris No. 14, Padalarang', latitude: -6.8400, longitude: 107.4710 },
    { id: 'stop-209', sequence: 9, customerName: 'Warung Sembako Bu Cici', outletName: 'Warung Sembako Bu Cici', owner: 'Bu Cici', phone: '0811-6677-8833', address: 'Jl. Ciburuy No. 25, Padalarang', latitude: -6.8310, longitude: 107.4775 },
    { id: 'stop-210', sequence: 10, customerName: 'Grosir Utama Padalarang', outletName: 'Grosir Utama Padalarang', owner: 'Pak Budianto', phone: '0812-8899-0044', address: 'Jl. Kota Baru Parahyangan No. 5, KBB', latitude: -6.8430, longitude: 107.4835 },
].map((s) => ({
    ...s,
    callplanName: 'RJP-PADALARANG-01',
    clusterName: 'Klaster Padalarang',
    regionName: 'Region Cimahi - Bandung Barat',
    dayOfWeek: ['Selasa', 'Sabtu'],
    assignedSalesName: 'Budi Santoso',
    customerId: `CUST-01${s.sequence}`,
    outletCode: `CUST-01${s.sequence}`,
    status: 'PENDING',
}));

// ==========================================
// RENCANA PJP 3: RJP-LEMBANG-01 (10 TOKO)
// Region: Region Cimahi - Bandung Barat
// Day: Rabu & Sabtu (Budi Santoso)
// ==========================================
const LEMBANG_STOPS = [
    { id: 'stop-301', sequence: 1, customerName: 'Toko Kelontong Berkah', outletName: 'Toko Kelontong Berkah', owner: 'Ibu Susanti', phone: '0811-2233-4455', address: 'Jl. Tangkuban Perahu No. 45, Lembang', latitude: -6.8142, longitude: 107.6144 },
    { id: 'stop-302', sequence: 2, customerName: 'Minimarket Lembang Asri', outletName: 'Minimarket Lembang Asri', owner: 'Pak Gunawan', phone: '0812-3344-5566', address: 'Jl. Raya Lembang No. 120, Lembang', latitude: -6.8165, longitude: 107.6180 },
    { id: 'stop-303', sequence: 3, customerName: 'Warung Sembako Tangkuban', outletName: 'Warung Sembako Tangkuban', owner: 'Ibu Kartini', phone: '0813-5566-7788', address: 'Jl. Cikole No. 18, Lembang', latitude: -6.8110, longitude: 107.6110 },
    { id: 'stop-304', sequence: 4, customerName: 'Grosir Sayur & Sembako Jaya', outletName: 'Grosir Sayur & Sembako Jaya', owner: 'Pak Cecep', phone: '0811-7788-9900', address: 'Jl. Pasar Lembang No. 5, Lembang', latitude: -6.8190, longitude: 107.6155 },
    { id: 'stop-305', sequence: 5, customerName: 'Toko Melati Lembang', outletName: 'Toko Melati Lembang', owner: 'Bu Melati', phone: '0812-9900-1122', address: 'Jl. Maribaya No. 34, Lembang', latitude: -6.8080, longitude: 107.6170 },
    { id: 'stop-306', sequence: 6, customerName: 'Agen Minuman Lembang', outletName: 'Agen Minuman Lembang', owner: 'Pak Wawan', phone: '0813-1122-3344', address: 'Jl. Grand Hotel No. 12, Lembang', latitude: -6.8210, longitude: 107.6120 },
    { id: 'stop-307', sequence: 7, customerName: 'Warung Warga Bersama', outletName: 'Warung Warga Bersama', owner: 'Ibu Nunung', phone: '0812-3344-5511', address: 'Jl. Jayagiri No. 80, Lembang', latitude: -6.8130, longitude: 107.6200 },
    { id: 'stop-308', sequence: 8, customerName: 'Minimarket Panorama', outletName: 'Minimarket Panorama', owner: 'Pak Sony', phone: '0813-5566-7722', address: 'Jl. Panorama No. 44, Lembang', latitude: -6.8175, longitude: 107.6090 },
    { id: 'stop-309', sequence: 9, customerName: 'Toko Sembako Harapan', outletName: 'Toko Sembako Harapan', owner: 'Pak Ridwan', phone: '0811-7788-9933', address: 'Jl. Sesko AU No. 9, Lembang', latitude: -6.8095, longitude: 107.6135 },
    { id: 'stop-310', sequence: 10, customerName: 'Grosir Berkah Lembang', outletName: 'Grosir Berkah Lembang', owner: 'Hj. Kokom', phone: '0812-9900-1144', address: 'Jl. Barukai No. 60, Lembang', latitude: -6.8225, longitude: 107.6165 },
].map((s) => ({
    ...s,
    callplanName: 'RJP-LEMBANG-01',
    clusterName: 'Klaster Lembang',
    regionName: 'Region Cimahi - Bandung Barat',
    dayOfWeek: ['Rabu', 'Sabtu'],
    assignedSalesName: 'Budi Santoso',
    customerId: `CUST-02${s.sequence}`,
    outletCode: `CUST-02${s.sequence}`,
    status: 'PENDING',
}));

export const INITIAL_SALES_STOPS = [...CIMAHI_STOPS, ...PADALARANG_STOPS, ...LEMBANG_STOPS];
