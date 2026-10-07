/**
 * permissions.js
 * Single Responsibility: Master registry of all granular system permissions,
 * categorized with React Icons, descriptions, and built-in role templates.
 * 
 * NOTE: Strict compliance - Zero emojis. Pure React Icons.
 */

/**
 * permissions.js
 * Single Responsibility: Master registry of all granular system permissions,
 * categorized with React Icons, descriptions, and built-in role templates.
 * 
 * NOTE: Strict compliance - Zero emojis. Pure React Icons.
 */

import { LuLayoutDashboard, LuNavigation, LuFileCheck, LuUsers, LuTruck, LuStore, LuSettings } from 'react-icons/lu';
import { FiBarChart2 } from 'react-icons/fi';
export const PERMISSION_CATEGORIES = [{
  id: 'dashboard',
  name: 'Dashboard & Monitoring',
  icon: LuLayoutDashboard,
  color: 'blue'
}, {
  id: 'rjp',
  name: 'RJP & Jadwal Sales',
  icon: LuNavigation,
  color: 'emerald'
}, {
  id: 'outlet',
  name: 'Master Outlet & NOO',
  icon: LuStore,
  color: 'amber'
}, {
  id: 'transaction',
  name: 'Transaksi & Approval',
  icon: LuFileCheck,
  color: 'rose'
}, {
  id: 'warehouse',
  name: 'Gudang & Logistik',
  icon: LuTruck,
  color: 'orange'
}, {
  id: 'team',
  name: 'Tim & Master Wilayah',
  icon: LuUsers,
  color: 'indigo'
}, {
  id: 'reports',
  name: 'Laporan & Analitik',
  icon: FiBarChart2,
  color: 'purple'
}, {
  id: 'system',
  name: 'Sistem & Administrasi',
  icon: LuSettings,
  color: 'neutral'
}];
