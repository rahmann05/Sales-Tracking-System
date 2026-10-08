import {TAB_IDS} from '../../constants/navigation';








import { CONFIG_DEFINITIONS } from '../../../../shared/config.mjs';

import { LuKey, LuMapPin, LuUsers, LuTruck, LuShieldCheck, LuSlidersHorizontal } from 'react-icons/lu';
export const categories = [{
  key: 'outlet',
  label: 'Outlet & NOO',
  icon: LuMapPin,
  groups: ['NOO', 'VALIDATION', 'DIVISI']
}, {
  key: 'sales',
  label: 'Absensi & kunjungan',
  icon: LuUsers,
  groups: ['SALES_ATTENDANCE', 'GEOFENCE', 'DAILY_CALLS', 'TEAM_ASSIGNMENT', 'OPERATIONS']
}, {
  key: 'coding',
  label: 'Kode & penomoran',
  icon: LuKey,
  groups: CONFIG_DEFINITIONS.filter(g => g.groupKey.startsWith('CODING_')).map(g => g.groupKey)
}, {
  key: 'logistics',
  label: 'Transaksi & logistik',
  icon: LuTruck,
  groups: ['TRANSAKSI', 'PACKING_WORKFLOW', 'LOGISTIK', 'ATTENTION_SLA']
}, {
  key: 'system',
  label: 'Integrasi & keamanan',
  icon: LuShieldCheck,
  groups: ['MAPS_INTEGRATION', 'SESI', 'TAMPILAN']
}, {
  key: 'tools',
  label: 'Alat operasional',
  icon: LuSlidersHorizontal,
  groups: []
}];
export const tools = [{
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
