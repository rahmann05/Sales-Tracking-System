import React from 'react';
import {lazyNamed} from './AppRouter.shared';
import {TAB_IDS} from '../constants/navigation';
import {ShiftAttendanceWidget} from '../shared/components/common/ShiftAttendanceWidget';
import {StaffAttendanceReport} from '../shared/components/common/StaffAttendanceReport';
const VehiclePage=lazyNamed(()=>import('../pages/Warehouse/components/VehicleMaintenanceDashboard'),'VehicleMaintenanceDashboard');
const DriverTrips=lazyNamed(()=>import('../pages/Driver/DriverFieldView'),'DriverFieldView');
const Operations=lazyNamed(()=>import('../pages/Warehouse/components/OperationsWorkspace'),'OperationsWorkspace');
function Attendance(){return <div className="workspace-page logistics-workspace"><header className="admin-page-heading"><div><p className="admin-eyebrow">Gudang / Presensi</p><h1>Presensi saya</h1><p>Catat mulai dan selesai kerja, lalu periksa riwayat.</p></div></header><ShiftAttendanceWidget/><StaffAttendanceReport/></div>;}
export const logisticsPages={[TAB_IDS.WAREHOUSE_ATTENTION]:()=> <Operations section="issues"/>,[TAB_IDS.WAREHOUSE_VEHICLES]:VehiclePage,[TAB_IDS.WAREHOUSE_ATTENDANCE]:Attendance,[TAB_IDS.DRIVER_TRIPS]:DriverTrips};
