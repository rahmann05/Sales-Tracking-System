// Synthetic data for browser layout checks. No database connection.
import {fixture as base,packings as basePackings,routes as baseRoutes,orders} from './admin-ui-fixtures.mjs';
import {routeProgress} from '../../shared/delivery-operations.mjs';
export function logisticsFixtures(role){
 const user={id:role==='SUPIR'?'driver-1':'ui-warehouse',name:role==='SUPIR'?'Budi Santoso':'Kepala Gudang Pengujian',email:'logistics-ui@example.invalid',role,permissions:{can_manage_packing_list:role==='KEPALA_GUDANG',can_manage_delivery_routes:role==='KEPALA_GUDANG',can_monitor_delivery:role==='KEPALA_GUDANG',can_view_dashboard:false,can_access_driver_map:role==='SUPIR'}};
 const packings=basePackings.filter(p=>p.status==='RELEASED');
 const routes=baseRoutes.map((r,index)=>{const route={...r,preparation:index?{PICK:{},CHECK:{},LOAD:{}}:{},stops:r.stops.map((s,i)=>{const p=packings[i%packings.length];return {...s,packingList:p,allocatedItems:p.items.map(item=>({lineId:item.lineId,quantity:5})),allocatedInvoices:p.invoices.map(inv=>({invoiceId:inv.id,cartons:5})),...(index===1&&i===0?{status:'PARTIAL_REJECT',rejectReason:'Sebagian kemasan rusak',rejectedCartons:2,rejectedItems:p.items.map(item=>({lineId:item.lineId,quantity:2}))}:{}),...(index===1&&i===1?{arrivedAt:new Date().toISOString()}:{}),};})};return {...route,progress:routeProgress(route)};});
 const issues=[{id:'issue-ui',routeId:'trip-1',deliveryStopId:'stop-1-0',title:'Periksa kemasan yang ditolak',reason:'Cocokkan bukti penolakan dan penerimaan retur sebelum tutup trip.',ownerId:user.id,dueAt:new Date(Date.now()-3600000).toISOString(),status:'OPEN'}];
 if(role==='SUPIR')for(const r of routes){r.driverId=user.id;r.driver={id:user.id,name:user.name};if(r.id==='trip-2'){r.status='READY';r.departedAt=null;r.stops=r.stops.map(s=>({...s,status:'PENDING',arrivedAt:null,completedAt:null,attendances:[]}));r.progress=routeProgress(r);}}
 return {user,fixture(path,query){
  if(path==='/auth/me')return user;
  if(path==='/delivery/routes'){const items=role==='SUPIR'?routes.filter(r=>['trip-1','trip-2'].includes(r.id)):routes;return {items,total:items.length};}
  if(path==='/delivery/operations')return {generatedAt:new Date().toISOString(),routes:routes.map(r=>r.id==='trip-1'?{...r,position:{...r.position,observedAt:new Date().toISOString()}}:r),people:[user,{id:'driver-1',name:'Budi Santoso',role:'SUPIR'}],issues,orders:orders.filter(o=>o.status==='APPROVED'),packings,commercialQueue:[]};
  if(path==='/delivery/my-issues')return issues;
  if(path==='/delivery/packing-lists'){const data=base(path,query);const items=data.items.filter(p=>p.status==='RELEASED');return {...data,items,total:items.length};}
  if(path==='/vehicles')return base(path,query).map((v,i)=>({...v,totalKm:15000+i*5000,lastOilChangeKm:12000,lastOilFilterChangeKm:10000,lastBrakePadChangeKm:5000,condition:i===2?'IN_SERVICE':'AVAILABLE',fuelType:'DIESEL'}));
  if(path==='/staff-attendance')return [{id:'warehouse-shift',kind:'SHIFT',activityKey:'SHIFT',checkInAt:new Date().toISOString(),checkOutAt:null,user,outletName:null}];
  return base(path,query);
 }};
}
