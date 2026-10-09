export const VEHICLE_SERVICE_TYPES=[
 {key:'GANTI_OLI',label:'Oli mesin',field:'lastOilChangeKm',config:'OIL_CHANGE_INTERVAL_KM',defaultKm:5000,max:100000},
 {key:'GANTI_FILTER_OLI',label:'Filter oli',field:'lastOilFilterChangeKm',config:'OIL_FILTER_CHANGE_INTERVAL_KM',defaultKm:10000,max:100000},
 {key:'GANTI_KANVAS_REM',label:'Kanvas rem',field:'lastBrakePadChangeKm',config:'BRAKE_CHANGE_INTERVAL_KM',defaultKm:20000,max:200000},
];
export const VEHICLE_SERVICE_RULE_KEYS=['VEHICLE_SERVICE_REMINDERS_ENABLED','VEHICLE_SERVICE_WARNING_PERCENT','VEHICLE_SERVICE_REQUIRE_WORKSHOP','VEHICLE_SERVICE_REQUIRE_NOTE','VEHICLE_SERVICE_ALLOW_BACKDATE','VEHICLE_SERVICE_MAX_BACKDATE_DAYS'];
export function vehicleServiceStatus(vehicle,values={}){
 const custom=vehicle.maintenancePolicy||{},enabled=custom.reminderMode==='ON'||custom.reminderMode!=='OFF'&&values.VEHICLE_SERVICE_REMINDERS_ENABLED!==false;
 const warningPercent=values.VEHICLE_SERVICE_WARNING_PERCENT??80;
 return VEHICLE_SERVICE_TYPES.map(type=>{
  const override=custom.intervals?.[type.key],threshold=override??values[type.config]??type.defaultKm;
  const known=Number.isFinite(vehicle.totalKm)&&Number.isFinite(vehicle[type.field])&&threshold>0;
  const used=known?Math.max(0,vehicle.totalKm-vehicle[type.field]):null,percentage=known?Math.min(100,used/threshold*100):null;
  return {...type,enabled,threshold,source:override==null?'PROFILE':'VEHICLE',known,used,percentage,remaining:known?Math.max(0,threshold-used):null,state:!enabled?'DISABLED':!known?'UNKNOWN':used>=threshold?'OVERDUE':percentage>=warningPercent?'DUE_SOON':'OK'};
 });
}
