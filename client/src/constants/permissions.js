import { PERMISSION_CATEGORIES } from "./permissionCategories";
/**
 * permissions.js
 * Single Responsibility: Master registry of all granular system permissions,
 * categorized with React Icons, descriptions, and built-in role templates.
 * 
 * NOTE: Strict compliance - Zero emojis. Pure React Icons.
 */

import { LuLayoutDashboard, LuNavigation, LuPhoneCall, LuMapPin, LuFileCheck, LuUserPlus, LuUsers, LuPackage, LuTruck, LuMap, LuStore, LuSettings, LuShieldCheck, LuDownload, LuLayers } from 'react-icons/lu';
import { FiBarChart2 } from 'react-icons/fi';
export const ALL_PERMISSIONS = [
// 1. Dashboard & Monitoring
{
  key: 'can_view_dashboard',
  label: 'Peta Monitoring Umum',
  desc: 'Akses peta distribusi toko dan status operasional lapangan',
  categoryId: 'dashboard',
  icon: LuLayoutDashboard
}, {
  key: 'can_view_live_tracking',
  label: 'Live GPS Tracking Sales',
  desc: 'Pantau posisi dan jejak pergerakan realtime tim sales di peta',
  categoryId: 'dashboard',
  icon: LuMapPin
}, {
  key: 'can_view_daily_call',
  label: 'Daily Call Monitor',
  desc: 'Akses monitoring panggilan harian dan rekap absensi tim',
  categoryId: 'dashboard',
  icon: LuPhoneCall
},
// 2. RJP & Jadwal Sales
{
  key: 'can_access_rjp',
  label: 'Jadwal & RJP Kunjungan',
  desc: 'Akses jadwal Master RJP toko dan check-in kunjungan lapangan',
  categoryId: 'rjp',
  icon: LuNavigation
}, {
  key: 'can_manage_rjp',
  label: 'Kelola Master RJP',
  desc: 'Boleh menyusun, mengedit, dan menetapkan rute PJP untuk sales',
  categoryId: 'rjp',
  icon: LuLayers
}, {
  key: 'can_request_reroute',
  label: 'Pengajuan Reroute & Skip',
  desc: 'Boleh mengajukan permohonan reroute toko atau skip kunjungan',
  categoryId: 'rjp',
  icon: LuNavigation
},
// 3. Master Outlet & NOO
{
  key: 'can_register_outlet',
  label: 'Registrasi Outlet (NOO)',
  desc: 'Boleh mendaftarkan calon pelanggan / outlet baru di lapangan',
  categoryId: 'outlet',
  icon: LuUserPlus
}, {
  key: 'can_approve_outlet',
  label: 'Persetujuan Outlet (NOO)',
  desc: 'Boleh menyetujui verifikasi pendaftaran outlet baru di sistem',
  categoryId: 'outlet',
  icon: LuShieldCheck
}, {
  key: 'can_manage_outlets',
  label: 'Master Database Outlet',
  desc: 'Kelola database toko, ubah informasi kontak, lokasi, dan penugasan',
  categoryId: 'outlet',
  icon: LuStore
}, {
  key: 'can_validate_outlet',
  label: 'Validasi Koordinat GPS',
  desc: 'Boleh memperbaiki, menguji toleransi jarak, dan mengunci koordinat GPS toko',
  categoryId: 'outlet',
  icon: LuMapPin
}, {
  key: 'can_view_outlet_report',
  label: 'Laporan Registrasi NOO',
  desc: 'Melihat rekap data, statistik, dan status registrasi outlet',
  categoryId: 'outlet',
  icon: LuFileCheck
},
// 4. Transaksi & Approval
{
  key: 'can_create_order',
  label: 'Pembuatan Order (PO)',
  desc: 'Input pesanan barang / Purchase Order langsung dari toko',
  categoryId: 'transaction',
  icon: LuFileCheck
}, {
  key: 'can_approve_order',
  label: 'Persetujuan Order (PO)',
  desc: 'Memeriksa dan memutuskan order sesuai tahap serta penugasan pemeriksa',
  categoryId: 'transaction',
  icon: LuShieldCheck
}, {
  key: 'can_unlock_absensi',
  label: 'Buka Kunci Absensi Radius',
  desc: 'Boleh menyetujui permohonan buka kunci absensi di luar radius GPS',
  categoryId: 'transaction',
  icon: LuShieldCheck
},
// 5. Gudang & Logistik
{
  key: 'can_manage_delivery',
  label: 'Akses Logistik Penuh',
  desc: 'Akses menu logistik, packing list, rute supir, dan monitor gudang',
  categoryId: 'warehouse',
  icon: LuTruck
}, {
  key: 'can_manage_packing_list',
  label: 'Kelola Packing List',
  desc: 'Boleh membuat, memilah pesanan, dan mencetak packing list gudang',
  categoryId: 'warehouse',
  icon: LuPackage
}, {
  key: 'can_manage_delivery_routes',
  label: 'Atur Rute Pengiriman',
  desc: 'Menyusun rute pengiriman harian dan menugaskan armada ke supir',
  categoryId: 'warehouse',
  icon: LuNavigation
}, {
  key: 'can_monitor_delivery',
  label: 'Monitor Pengiriman Realtime',
  desc: 'Memantau status pengiriman barang dan laporan kendala antaran',
  categoryId: 'warehouse',
  icon: LuTruck
}, {
  key: 'can_access_driver_map',
  label: 'Peta Navigasi Supir',
  desc: 'Akses peta rute pengantaran, bukti serah terima toko, dan tanda tangan',
  categoryId: 'warehouse',
  icon: LuMap
},
// 6. Tim & Master Wilayah
{
  key: 'can_view_team',
  label: 'Tim & Personel',
  desc: 'Akses data personel lapangan, sales bawahan, dan status kehadiran',
  categoryId: 'team',
  icon: LuUsers
}, {
  key: 'can_manage_clusters',
  label: 'Kelola Master Kluster',
  desc: 'Membuat kluster wilayah baru, menggambar batas area, dan assign sales',
  categoryId: 'team',
  icon: LuMap
},
// 7. Laporan & Analitik
{
  key: 'can_view_reports',
  label: 'Laporan Distribusi ND6',
  desc: 'Melihat laporan penjualan, pencapaian target, dan performa distribusi',
  categoryId: 'reports',
  icon: FiBarChart2
}, {
  key: 'can_export_reports',
  label: 'Ekspor Laporan',
  desc: 'Mengunduh laporan analitik ke format Microsoft Excel atau PDF',
  categoryId: 'reports',
  icon: LuDownload
},
// 8. Sistem & Administrasi
{
  key: 'can_manage_system_config',
  label: 'Pengaturan Sistem',
  desc: 'Khusus role dasar Admin. Izin ini tidak memberi akses pengaturan kepada role lain.',
  reserved: true,
  categoryId: 'system',
  icon: LuSettings
}, {
  key: 'can_manage_users',
  label: 'Manajemen Pengguna',
  desc: 'Khusus role dasar Admin: akun, reset password, dan profil pengguna.',
  reserved: true,
  categoryId: 'system',
  icon: LuUsers
}, {
  key: 'can_manage_roles',
  reserved: true,
  label: 'Kelola Role & Template',
  desc: 'Khusus role dasar Admin: role kustom dan template hak akses.',
  categoryId: 'system',
  icon: LuShieldCheck
}];
export const getEmptyPermissions = () => {
  return ALL_PERMISSIONS.reduce((acc, perm) => {
    acc[perm.key] = false;
    return acc;
  }, {});
};
export const BUILT_IN_ROLE_TEMPLATES = {
  ADMIN: ALL_PERMISSIONS.reduce((acc, perm) => {
    acc[perm.key] = true;
    return acc;
  }, {}),
  SUPERVISOR: {
    ...getEmptyPermissions(),
    can_view_dashboard: true,
    can_view_live_tracking: true,
    can_view_daily_call: true,
    can_access_rjp: true,
    can_manage_rjp: true,
    can_register_outlet: true,
    can_approve_outlet: true,
    can_manage_outlets: true,
    can_validate_outlet: true,
    can_view_outlet_report: true,
    can_create_order: true,
    can_approve_order: true,
    can_unlock_absensi: true,
    can_view_team: true,
    can_manage_clusters: true,
    can_view_reports: true,
    can_export_reports: true
  },
  SALES: {
    ...getEmptyPermissions(),
    can_view_dashboard: true,
    can_access_rjp: true,
    can_request_reroute: true,
    can_register_outlet: true,
    can_create_order: true
  },
  KEPALA_GUDANG: {
    ...getEmptyPermissions(),
    can_view_dashboard: true,
    can_manage_delivery: true,
    can_manage_packing_list: true,
    can_manage_delivery_routes: true,
    can_monitor_delivery: true
  },
  SUPIR: {
    ...getEmptyPermissions(),
    can_access_driver_map: true
  }
};
export { PERMISSION_CATEGORIES };
