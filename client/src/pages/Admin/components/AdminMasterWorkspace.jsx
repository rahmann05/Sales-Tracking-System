import React from 'react';
import {CodingMasterForms} from './CodingMasterForms';
import {VehicleMaintenanceDashboard} from '../../Warehouse/components/VehicleMaintenanceDashboard';
export function AdminMasterWorkspace(){
 return <div className="space-y-6"><CodingMasterForms/><VehicleMaintenanceDashboard embedded/></div>;
}
