import {TAB_IDS} from '../../constants/navigation';








import { CONFIG_DEFINITIONS } from '../../../../shared/config.mjs';

import { LuKey, LuMapPin, LuUsers, LuTruck, LuShieldCheck, LuSlidersHorizontal } from 'react-icons/lu';
export const categories = [
 {key:'features',label:'Ketersediaan fitur',icon:LuSlidersHorizontal,description:'Aktifkan, jeda, atau hentikan pekerjaan baru.',groups:['FEATURES']},
 {key:'sales',label:'Kunjungan & shift',icon:LuUsers,description:'Presensi, bukti kunjungan, supervisi, dan hasil lapangan.',groups:['VISIT_WORKFLOW','SALES_ATTENDANCE','GEOFENCE','SHIFT_WORKFLOW','SUPERVISION','OPERATIONS']},
 {key:'planning',label:'Tim, wilayah & PJP',icon:LuUsers,description:'Penugasan Sales, interval kunjungan, dan penerbitan rencana.',groups:['PLANNING_POLICY','TEAM_ASSIGNMENT']},
 {key:'outlet',label:'Outlet & registrasi',icon:LuMapPin,description:'Pengajuan outlet, persetujuan, master, dan pemeriksaan opsional.',groups:['REGISTRATION_WORKFLOW','NOO','OUTLET_REVIEW_POLICY','OUTLET_REVIEW_SEARCH','OUTLET_REVIEW_MATCHING','OUTLET_FIELD_POLICY','OUTLET_GOOGLE_LOCATION','OUTLET_REVIEW_SERVICE','OUTLET_REVIEW_LEGACY','VALIDATION','DIVISI']},
 {key:'orders',label:'Order & penagihan',icon:LuTruck,description:'Persetujuan order, harga, dan catatan pembayaran eksternal.',groups:['ORDER_WORKFLOW','TRANSAKSI']},
 {key:'logistics',label:'Gudang & pengiriman',icon:LuTruck,description:'Packing, persiapan, bukti tujuan, servis, dan penutupan trip.',groups:['WAREHOUSE_WORKFLOW','PACKING_WORKFLOW','VEHICLE_SERVICE_POLICY','LOGISTIK']},
 {key:'monitoring',label:'Pemantauan & laporan',icon:LuShieldCheck,description:'Berbagi lokasi, laporan, notifikasi, dan batas waktu pekerjaan.',groups:['TRACKING_POLICY','REPORTING_POLICY','DAILY_CALLS','ATTENTION_SLA','SLA_CALENDAR']},
 {key:'coding',label:'Kode & penomoran',icon:LuKey,description:'Format identitas dokumen dan master. Urutan yang sudah dipakai tetap terjaga.',groups:CONFIG_DEFINITIONS.filter(g=>g.groupKey.startsWith('CODING_')).map(g=>g.groupKey)},
 {key:'system',label:'Integrasi & keamanan',icon:LuShieldCheck,description:'Layanan peta dan sesi pengguna.',groups:['MAPS_INTEGRATION','SESI']},
];
export const tools = [{key:'reports',label:'Target Sales & kalender laporan',tab:TAB_IDS.REPORTS}, {key:'users',label:'Akun & hak akses',tab:TAB_IDS.USER_MANAGEMENT}, {
  key: 'products',
  label: 'Katalog produk',
  tab: TAB_IDS.ADMIN_PRODUCTS
}, {
  key: 'attendance',
  label: 'Laporan absensi',
  tab: TAB_IDS.ADMIN_ATTENDANCE
}, {
  key: 'pjp',
  label: 'Siapkan PJP',
  tab: TAB_IDS.ADMIN_PJP
}, {
  key: 'master',
  label: 'Master divisi / kendaraan',
  tab: TAB_IDS.ADMIN_MASTERS
}];
export const stringify = value => typeof value === 'object' ? JSON.stringify(value) : String(value);
export const initialValues = configs => Object.fromEntries(CONFIG_DEFINITIONS.flatMap(g => g.params.map(p => [p.key, stringify(configs[p.key] ?? p.defaultValue)])));
export const buttonStyle = 'config-button';
