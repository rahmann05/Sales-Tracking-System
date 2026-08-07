// Default Demo Users per Role
export const DEMO_USERS = {
  SALES: {
    id: 'usr-sales-1',
    name: 'Budi Santoso',
    email: 'sales@sinaranugrah.com',
    role: 'SALES',
    roleLabel: 'Sales Field Rep',
    avatar: null,
    region: 'Cimahi - Bandung Barat',
    cluster: 'Klaster Cimahi & Bandung Barat',
  },
  DRIVER: {
    id: 'usr-driver-1',
    name: 'Hendra Wijaya',
    email: 'driver@sinaranugrah.com',
    role: 'DRIVER',
    roleLabel: 'Driver Logistik',
    avatar: null,
    vehiclePlate: 'D 8421 CM',
    helperName: 'Rian Putra',
  },
  HELPER: {
    id: 'usr-helper-1',
    name: 'Rian Putra',
    email: 'helper@sinaranugrah.com',
    role: 'HELPER',
    roleLabel: 'Helper Logistik',
    avatar: null,
    driverName: 'Hendra Wijaya',
  },
  SUPERVISOR: {
    id: 'usr-spv-1',
    name: 'Ahmad Subagja',
    email: 'spv@sinaranugrah.com',
    role: 'SUPERVISOR',
    roleLabel: 'Supervisor Operasional',
    avatar: null,
    teamCount: 8,
  },
  ADMIN: {
    id: 'usr-admin-1',
    name: 'Maria Ulfah',
    email: 'admin@sinaranugrah.com',
    role: 'ADMIN',
    roleLabel: 'Admin Penjualan',
    avatar: null,
  },
  OPERATIONAL_MANAGER: {
    id: 'usr-ops-1',
    name: 'Bambang Suroso',
    email: 'ops@sinaranugrah.com',
    role: 'OPERATIONAL_MANAGER',
    roleLabel: 'Manajer Operasional',
    avatar: null,
  },
};

// Initial Mock PJP Outlets for Sales
export const INITIAL_SALES_STOPS = [
  {
    id: 'stop-101',
    sequence: 1,
    callplanName: 'RJP-CIMAHI-01',
    dayOfWeek: 'Senin',
    customerId: 'CUST-001',
    outletCode: 'CUST-001',
    customerName: 'Toko Sumber Rezeki',
    outletName: 'Toko Sumber Rezeki',
    owner: 'Hj. Aminah',
    phone: '0812-3456-7890',
    address: 'Jl. Raya Amir Machmud No. 12, Cimahi',
    latitude: -6.8722,
    longitude: 107.5423,
    radiusMeters: 50,
    currentDistance: 24, // inside geofence
    status: 'PENDING', // PENDING, ARRIVED, ORDERED, NO_ORDER, CLOSED, SKIPPED
    callFrequency: 'F4',
    creditLimit: 15000000,
    outstanding: 3500000,
    photoUrl: null, // Fully derived from Google Places API (null if no photo on Google Maps)
    googlePlaceDetails: {
      placeName: 'Toko Sumber Rezeki Cimahi',
      rating: 4.8,
      userRatingsTotal: 64,
      category: 'Grosir & Toko Kelontong Sembako',
      businessStatus: 'OPERASIONAL (Buka)',
      openHours: '07:00 - 21:00 WIB',
      description: 'Toko sembako lengkap dan grosir terpercaya area Cimahi Tengah dengan rating tinggi di Google.',
      googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-6.8722,107.5423',
      photoUrl: null, // Google API photo reference (null if not available on Google Maps)
    },
  },
  {
    id: 'stop-102',
    sequence: 2,
    callplanName: 'RJP-PADALARANG-01',
    dayOfWeek: 'Senin',
    customerId: 'CUST-002',
    outletCode: 'CUST-002',
    customerName: 'Minimarket Maju Jaya',
    outletName: 'Minimarket Maju Jaya',
    owner: 'Pak Koes',
    phone: '0813-8888-9999',
    address: 'Jl. Raya Padalarang No. 88, KBB',
    latitude: -6.8375,
    longitude: 107.4764,
    radiusMeters: 50,
    currentDistance: 42, // inside geofence
    status: 'PENDING',
    callFrequency: 'F2',
    creditLimit: 25000000,
    outstanding: 12000000,
    photoUrl: null, // Fully derived from Google Places API (null if no photo on Google Maps)
    googlePlaceDetails: {
      placeName: 'Minimarket Maju Jaya Padalarang',
      rating: 4.6,
      userRatingsTotal: 112,
      category: 'Minimarket & Retail Modern',
      businessStatus: 'OPERASIONAL (Buka)',
      openHours: '06:30 - 22:00 WIB',
      description: 'Minimarket modern dengan varian produk konsumsi lengkap dan akses parkir mudah.',
      googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-6.8375,107.4764',
      photoUrl: null, // Google API photo reference (null if not available on Google Maps)
    },
  },
  {
    id: 'stop-103',
    sequence: 3,
    callplanName: 'RJP-LEMBANG-01',
    dayOfWeek: 'Senin',
    customerId: 'CUST-003',
    outletCode: 'CUST-003',
    customerName: 'Toko Kelontong Berkah',
    outletName: 'Toko Kelontong Berkah',
    owner: 'Ibu Susanti',
    phone: '0811-2233-4455',
    address: 'Jl. Tangkuban Perahu No. 45, Lembang',
    latitude: -6.8142,
    longitude: 107.6144,
    radiusMeters: 50,
    currentDistance: 120, // outside geofence simulation
    status: 'PENDING',
    callFrequency: 'F1',
    creditLimit: 10000000,
    outstanding: 8500000,
    photoUrl: null, // Google Maps has no photo (vector illustration default) -> Section omitted
    googlePlaceDetails: {
      placeName: 'Toko Kelontong Berkah Lembang',
      rating: 4.3,
      userRatingsTotal: 28,
      category: 'Warung Kelontong Warga',
      businessStatus: 'OPERASIONAL (Buka)',
      openHours: '08:00 - 20:00 WIB',
      description: 'Warung sembako dan kebutuhan harian warga Lembang.',
      googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-6.8142,107.6144',
      photoUrl: null, // Tidak tersedia foto di Google Maps -> Bagian foto tidak ditampilkan
    },
  },
  {
    id: 'stop-104',
    sequence: 4,
    callplanName: 'RJP-BATUJAJAR-01',
    dayOfWeek: 'Senin',
    customerId: 'CUST-004',
    outletCode: 'CUST-004',
    customerName: 'Grosir Sinar Abadi',
    outletName: 'Grosir Sinar Abadi',
    owner: 'Bpk. Hendro',
    phone: '0857-1122-3344',
    address: 'Jl. Raya Batujajar No. 88, KBB',
    latitude: -6.8971,
    longitude: 107.5028,
    radiusMeters: 50,
    currentDistance: 15,
    status: 'PENDING',
    callFrequency: 'F4',
    creditLimit: 50000000,
    outstanding: 42000000,
    photoUrl: null, // Tidak tersedia foto di Google Maps -> Bagian foto tidak ditampilkan
    googlePlaceDetails: {
      placeName: 'Grosir Sinar Abadi Batujajar',
      rating: 4.9,
      userRatingsTotal: 195,
      category: 'Distributor & Agen Grosir Besar',
      businessStatus: 'OPERASIONAL (Buka)',
      openHours: '07:30 - 17:30 WIB',
      description: 'Pusat grosir sembako, minuman, dan snack kartonan terlaris di Batujajar.',
      googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-6.8971,107.5028',
      photoUrl: null, // Tidak tersedia foto di Google Maps -> Bagian foto tidak ditampilkan
    },
  },
];

// Initial Supervisor Teams
export const INITIAL_SUPERVISOR_TEAMS = [
  {
    id: 'team-spv-1',
    spvName: 'Ahmad Subagja',
    spvTeam: 'Tim SPV Ahmad Subagja (Cimahi & KBB)',
    cluster: 'Klaster Cimahi & Bandung Barat',
    memberSalesNames: ['Budi Santoso', 'Siti Rahma'],
  },
  {
    id: 'team-spv-2',
    spvName: 'Budi Kurniawan',
    spvTeam: 'Tim SPV Budi Kurniawan (Lembang & Parongpong)',
    cluster: 'Klaster Lembang & Parongpong',
    memberSalesNames: ['Agus Wijaya', 'Dewi Lestari'],
  },
];

// Initial Sales Reps List with Supervisor and Tim RJP links
export const INITIAL_SALES_LIST = [
  { id: 'sales-1', name: 'Budi Santoso', email: 'sales@sinaranugrah.com', phone: '0812-1111-2222', spvName: 'Ahmad Subagja', spvTeamName: 'Tim SPV Ahmad Subagja (Cimahi & KBB)', rjpTeamId: 'rjp-team-1', rjpTeamName: 'Tim RJP Cimahi Tengah & Leuwigajah', cluster: 'Klaster Cimahi & Bandung Barat', status: 'Checked In', location: 'Cimahi Tengah', avatar: null },
  { id: 'sales-2', name: 'Siti Rahma', email: 'siti@sinaranugrah.com', phone: '0812-3333-4444', spvName: 'Ahmad Subagja', spvTeamName: 'Tim SPV Ahmad Subagja (Cimahi & KBB)', rjpTeamId: 'rjp-team-1', rjpTeamName: 'Tim RJP Cimahi Tengah & Leuwigajah', cluster: 'Klaster Cimahi & Bandung Barat', status: 'In Transit', location: 'Padalarang (Bandung Barat)', avatar: null },
  { id: 'sales-3', name: 'Agus Wijaya', email: 'agus@sinaranugrah.com', phone: '0812-5555-6666', spvName: 'Budi Kurniawan', spvTeamName: 'Tim SPV Budi Kurniawan (Lembang & Parongpong)', rjpTeamId: 'rjp-team-2', rjpTeamName: 'Tim RJP Lembang & Parongpong', cluster: 'Klaster Lembang & Parongpong', status: 'Checked In', location: 'Lembang (Bandung Barat)', avatar: null },
  { id: 'sales-4', name: 'Dewi Lestari', email: 'dewi@sinaranugrah.com', phone: '0812-7777-8888', spvName: 'Budi Kurniawan', spvTeamName: 'Tim SPV Budi Kurniawan (Lembang & Parongpong)', rjpTeamId: 'rjp-team-2', rjpTeamName: 'Tim RJP Lembang & Parongpong', cluster: 'Klaster Lembang & Parongpong', status: 'Completed', location: 'Cimahi Selatan', avatar: null },
];

// Initial Tim RJP / Tim Kunjungan (Created on-demand by Ops Manager / SPV)
export const INITIAL_RJP_TEAMS = [
  {
    id: 'rjp-team-1',
    name: 'Tim RJP Cimahi Tengah & Leuwigajah',
    spvName: 'Ahmad Subagja',
    cluster: 'Klaster Cimahi & Bandung Barat',
    memberSalesNames: ['Budi Santoso', 'Siti Rahma'],
    assignedDays: ['Senin', 'Kamis'],
    routesCount: 8,
    createdAt: '2026-08-01',
    createdBy: 'Bambang Suroso (Ops Manager)',
  },
  {
    id: 'rjp-team-2',
    name: 'Tim RJP Lembang & Parongpong',
    spvName: 'Budi Kurniawan',
    cluster: 'Klaster Lembang & Parongpong',
    memberSalesNames: ['Agus Wijaya', 'Dewi Lestari'],
    assignedDays: ['Selasa', 'Jumat'],
    routesCount: 10,
    createdAt: '2026-08-02',
    createdBy: 'Budi Kurniawan (Supervisor)',
  },
  {
    id: 'rjp-team-3',
    name: 'Tim RJP Padalarang & Batujajar',
    spvName: 'Ahmad Subagja',
    cluster: 'Klaster Cimahi & Bandung Barat',
    memberSalesNames: ['Siti Rahma'],
    assignedDays: ['Rabu', 'Sabtu'],
    routesCount: 6,
    createdAt: '2026-08-05',
    createdBy: 'Ahmad Subagja (Supervisor)',
  },
];

// Initial Field Team Members
export const INITIAL_TEAM_MEMBERS = [
  { id: 'tm-1', name: 'Budi Santoso', role: 'Senior Sales Executive', status: 'Checked In', time: '08:30 WIB', location: 'Cimahi Tengah', avatar: null },
  { id: 'tm-2', name: 'Siti Rahma', role: 'Field Representative', status: 'In Transit', time: '08:45 WIB', location: 'Padalarang (Bandung Barat)', avatar: null },
  { id: 'tm-3', name: 'Agus Wijaya', role: 'Account Manager', status: 'Checked In', time: '08:15 WIB', location: 'Lembang (Bandung Barat)', avatar: null },
  { id: 'tm-4', name: 'Dewi Lestari', role: 'Sales Representative', status: 'Completed', time: '12:00 WIB', location: 'Cimahi Selatan', avatar: null },
];

// Initial Active Routes for Dashboard Tracking
export const INITIAL_ACTIVE_ROUTES = [
  {
    id: '#CM-8492',
    name: 'Cimahi Tengah & Leuwigajah',
    status: 'In Transit',
    borderColor: 'var(--secondary-fixed)',
    repName: 'Budi Santoso',
    avatar: null,
    stops: [
      { title: 'Toko Sumber Rezeki', subtitle: 'Berangkat 09:15 WIB', active: true },
      { title: 'Grosir Leuwigajah', subtitle: 'ETA 10:30 WIB', active: false },
    ],
    distance: '3.2 km',
    stopsLeft: '4/6',
  },
  {
    id: '#KBB-8493',
    name: 'Padalarang & Ngamprah',
    status: 'Delayed',
    borderColor: 'var(--error)',
    repName: 'Siti Rahma',
    avatar: null,
    warning: 'Kemacetan di Pertigaan Padalarang',
    stops: [
      { title: 'Minimarket Maju Jaya', subtitle: 'Tersendat macet', active: true },
    ],
    distance: '5.8 km',
    stopsLeft: '2/5',
  },
  {
    id: '#KBB-8491',
    name: 'Lembang & Parongpong',
    status: 'Completed',
    borderColor: 'var(--outline-variant)',
    repName: 'Agus Wijaya',
    avatar: null,
    stops: [],
    distance: '4.1 km',
    stopsLeft: '0/6',
  },
];

// Initial Master PJP Routes for Route Planning
export const INITIAL_MASTER_ROUTES = [
  { id: 'R-101', name: 'Rute Cimahi Tengah & Utama', rep: 'Budi Santoso', stops: 8, completion: '75%', status: 'Active', days: ['Senin', 'Kamis'], spvTeam: 'Tim SPV Ahmad Subagja' },
  { id: 'R-102', name: 'Rute Padalarang & Ngamprah (KBB)', rep: 'Siti Rahma', stops: 5, completion: '40%', status: 'In Transit', days: ['Rabu', 'Sabtu'], spvTeam: 'Tim SPV Ahmad Subagja' },
  { id: 'R-103', name: 'Rute Lembang & Parongpong (KBB)', rep: 'Agus Wijaya', stops: 10, completion: '100%', status: 'Completed', days: ['Selasa', 'Jumat'], spvTeam: 'Tim SPV Budi Kurniawan' },
  { id: 'R-104', name: 'Rute Batujajar & Cimahi Selatan', rep: 'Dewi Lestari', stops: 6, completion: '0%', status: 'Scheduled', days: ['Senin', 'Jumat'], spvTeam: 'Tim SPV Budi Kurniawan' },
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
    validationStatus: 'TIDAK_TERVALIDASI', // 'TIDAK_TERVALIDASI', 'TERVALIDASI', 'DITOLAK'
  },
];

// Product Catalog
export const MOCK_PRODUCTS = [
  { id: 'prd-1', code: 'SKU-001', name: 'Minyak Goreng Sawit 2L', category: 'Sembako', price: 34000, stock: 150 },
  { id: 'prd-2', code: 'SKU-002', name: 'Gula Pasir Kristal 1kg', category: 'Sembako', price: 17500, stock: 300 },
  { id: 'prd-3', code: 'SKU-003', name: 'Beras Premium Super 5kg', category: 'Sembako', price: 72000, stock: 80 },
  { id: 'prd-4', code: 'SKU-004', name: 'Susu Kental Manis 370g', category: 'Minuman', price: 12500, stock: 220 },
  { id: 'prd-5', code: 'SKU-005', name: 'Kopi Bubuk Murni 200g', category: 'Minuman', price: 21000, stock: 140 },
];
