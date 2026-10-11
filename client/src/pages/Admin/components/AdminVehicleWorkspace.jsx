import React,{useState} from 'react';
import {CodingMasterForms} from './CodingMasterForms';
import {VehicleMaintenanceDashboard} from '../../Warehouse/components/VehicleMaintenanceDashboard';
export function AdminVehicleWorkspace(){
 const [revision,setRevision]=useState(0);
 return <div className="space-y-6"><CodingMasterForms initialKind="VEHICLE" fixedKind onCreated={()=>setRevision(value=>value+1)}/><VehicleMaintenanceDashboard key={revision} embedded/></div>;
}
