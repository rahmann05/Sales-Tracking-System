import { LuClipboardList, LuTruck, LuStore, LuUsers, LuCircleCheck, LuChartNoAxesCombined, LuSettings2 } from 'react-icons/lu';

export const modules = [
  { id: 'orders', title: 'Order', description: 'Periksa pesanan dan ikuti pemenuhannya.', icon: LuClipboardList, tone: 'blue', links: 'Daftar order · Katalog produk' },
  { id: 'packing', title: 'Packing & pengiriman', description: 'Siapkan muatan dan pantau perjalanan.', icon: LuTruck, tone: 'orange', links: 'Packing list · Rute · Monitor · Kendaraan' },
  { id: 'outlets', title: 'Outlet', description: 'Kelola pelanggan dan validasi lokasinya.', icon: LuStore, tone: 'teal', links: 'Master outlet · Pengajuan · Validasi' },
  { id: 'sales', title: 'Sales & wilayah', description: 'Pantau kunjungan dan penugasan tim.', icon: LuUsers, tone: 'purple', links: 'Kunjungan · Tim & SPV · Wilayah · PJP' },
  { id: 'followup', title: 'Tindak lanjut', description: 'Tuntaskan pekerjaan yang perlu perhatian.', icon: LuCircleCheck, tone: 'rose', links: 'Antrean pekerjaan · PIC · Tenggat' },
  { id: 'reports', title: 'Laporan', description: 'Tinjau hasil operasional per periode.', icon: LuChartNoAxesCombined, tone: 'green', links: 'Operasional · Registrasi · Absensi' },
  { id: 'system', title: 'Sistem', description: 'Atur pengguna, akses, dan parameter.', icon: LuSettings2, tone: 'gray', links: 'Pengguna · Peran & izin · Pengaturan' },
];
export const outlets = ['Toko Sumber Rezeki', 'CV Berkah Pangan Nusantara — Cabang Cimahi', 'Toko Mekar Jaya', 'Toko Sari Rasa', 'Toko Anugerah Mandiri', 'Grosir Maju Bersama', 'Toko Sejahtera', 'Toko Harapan Baru'];
export const salesNames = ['Rizki Pratama', 'Dewi Lestari', 'Agus Saputra'];
export const orderStates = ['Menunggu', 'Disetujui', 'Ditolak'];
export const products = [
  { sku: 'PRD-001', name: 'Produk A · kemasan 500 g', unit: 'dus', quantity: 12, price: 145000 },
  { sku: 'PRD-002', name: 'Produk B · kemasan keluarga 1 kg', unit: 'dus', quantity: 8, price: 210000 },
  { sku: 'PRD-003', name: 'Produk C · kemasan 250 g', unit: 'pak', quantity: 20, price: 48000 },
  { sku: 'PRD-004', name: 'Produk D · kemasan ekonomis 100 g', unit: 'pak', quantity: 15, price: 32000 },
];
export const initialOrders = Array.from({ length: 32 }, (_, i) => ({
  id: `ORD-261008-${String(128 + i).padStart(4, '0')}`, outlet: outlets[i % outlets.length],
  sales: salesNames[i % 3], time: `${String(8 + Math.floor(i / 20)).padStart(2, '0')}.${String(10 + i % 49).padStart(2, '0')}`,
  status: orderStates[i % 5 === 0 ? 2 : i % 3 === 1 ? 1 : 0],
  value: products.reduce((sum, p) => sum + p.quantity * p.price, 0),
  fulfillment: i % 5 === 0 ? 'Tidak diproses' : i % 3 === 1 ? 'Sebagian dipacking' : 'Menunggu keputusan',
}));
export const initialPacking = Array.from({ length: 18 }, (_, i) => ({
  id: `PL-261008-${String(42 + i).padStart(4, '0')}`, orderId: initialOrders.filter(o => o.status === 'Disetujui')[(i + Math.floor(i / 9)) % 9].id,
  outlet: initialOrders.filter(o => o.status === 'Disetujui')[(i + Math.floor(i / 9)) % 9].outlet, cartons: 24 + i, status: ['Draft', 'Dirilis', 'Dalam perjalanan'][i % 3],
  items: products.map(p => ({ ...p, quantity: Math.max(1, Math.floor(p.quantity / 3)) })),
  invoices: [{ number: `INV-261008-${String(42 + i).padStart(4, '0')}`, cartons: 24 + i }],
  weight: 48 + 2 * i,
  trip: i % 3 === 2 ? ['TRP-0086', 'TRP-0087', 'TRP-0088'][Math.floor(i / 3) % 3] : 'Belum dialokasikan',
}));
const tripDocuments = id => initialPacking.filter(d => d.trip === id);
const tripCartons = id => tripDocuments(id).reduce((sum, d) => sum + d.cartons, 0);
export const trips = [
  { id: 'TRP-0086', area: 'Cimahi · Bandung Barat', driver: 'Dedi Kurniawan', vehicle: 'D 8124 AB', source: 'GPS ponsel aktif', tone: 'green', update: '10.24 · 20 detik lalu', accuracy: '±18 m', status: 'Dalam perjalanan', resolved: 2, delivered: 1, cartons: tripCartons('TRP-0086'), point: [45, 54], stops: tripDocuments('TRP-0086').map(d => d.outlet) },
  { id: 'TRP-0087', area: 'Bandung Utara', driver: 'Asep Hidayat', vehicle: 'D 9032 CD', source: 'GPS terakhir', tone: 'orange', update: '09.42 · 42 menit lalu', accuracy: '±32 m', status: 'Perlu perhatian', resolved: 1, delivered: 1, cartons: tripCartons('TRP-0087'), point: [65, 29], stops: tripDocuments('TRP-0087').map(d => d.outlet) },
  { id: 'TRP-0088', area: 'Bandung Selatan', driver: 'Yudi Setiawan', vehicle: 'D 8765 EF', source: 'Titik absen terakhir', tone: 'blue', update: '10.02 · 22 menit lalu', accuracy: '±45 m saat absen', status: 'Dalam perjalanan', resolved: 1, delivered: 1, cartons: tripCartons('TRP-0088'), point: [58, 73], stops: tripDocuments('TRP-0088').map(d => d.outlet) },
  { id: 'TRP-0089', area: 'Padalarang', driver: 'Budi Santoso', vehicle: 'D 8456 GH', source: 'Belum ada lokasi', tone: 'gray', update: 'Belum ada pembaruan', accuracy: 'Tidak tersedia', status: 'Belum berangkat', resolved: 0, delivered: 0, cartons: 54, point: null, stops: ['Grosir Maju Bersama', 'Toko Sejahtera', 'Toko Sumber Rezeki'] },
];
export const rupiah = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
export const toneFor = status => ({ Menunggu: 'orange', Disetujui: 'green', 'Ditolak': 'rose', Draft: 'gray', Dirilis: 'blue', 'Dalam perjalanan': 'blue', 'Perlu perhatian': 'orange' }[status] || 'gray');
