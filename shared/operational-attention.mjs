import {preparationStages,preparationReady} from './warehouse-policy.mjs';
import {canTripAction} from './trip-permissions.mjs';

export const responsibleLabels={ADMIN:'Tim Admin',SUPERVISOR:'Supervisor tim',KEPALA_GUDANG:'Tim gudang',SUPIR:'Supir yang ditugaskan',SALES:'Sales yang ditugaskan'};
export function tripNextWork(route){
 const policy={...route.policySnapshot?.values,...route.policySnapshot?.warehouseEvidence?.values};
 if(route.closedAt||route.cancelledAt)return null;
 if(route.onHold)return {stage:'TRIP_HOLD',responsibleRole:'KEPALA_GUDANG',nextAction:'Periksa kendala dan lanjutkan perjalanan',action:'RESUME',explanation:'Perjalanan ditahan. Periksa alasannya sebelum melanjutkan.'};
 if(route.returnedAt){
  const pendingReturn=policy.TRIP_REQUIRE_RETURN_INSPECTION!==false&&route.stops?.find(stop=>stop.rejectedCartons>0&&!stop.returnInspection);
  if(pendingReturn){const task=route.preparation?.returnTasks?.[pendingReturn.id];return {stage:'RETURN_INSPECTION',responsibleRole:'KEPALA_GUDANG',ownerId:task?.ownerId||null,ownerName:task?.ownerName||null,stopId:pendingReturn.id,dueAt:task?.dueAt,needsReview:true,nextAction:'Periksa barang yang kembali',action:'RETURN_INSPECTION',explanation:'Supir sudah kembali. Periksa jumlah dan kondisi barang sebelum menutup perjalanan.'};}
  return {stage:'TRIP_CLOSE',responsibleRole:'KEPALA_GUDANG',nextAction:'Periksa hasil dan tutup perjalanan',action:'CLOSE',explanation:'Supir sudah kembali. Periksa barang kembali dan dokumen pengiriman.'};
 }
 if(route.departedAt)return {stage:'TRIP_DELIVERY',responsibleRole:'SUPIR',ownerId:route.driverId,ownerName:route.driver?.name,nextAction:['COMPLETED','PARTIAL'].includes(route.status)?'Absen kembali':'Lanjutkan tujuan berikutnya',action:['COMPLETED','PARTIAL'].includes(route.status)?'RETURN':null,explanation:'Hasil kunjungan dan absensi supir memperbarui perjalanan ini.'};
 const pending=preparationStages(policy).find(stage=>!route.preparation?.[stage]);
 if(pending||!preparationReady(route,policy)){
  const task=route.preparation?.tasks?.[pending];
  return {stage:`TRIP_${pending||'PREPARATION'}`,responsibleRole:'KEPALA_GUDANG',ownerId:task?.ownerId||null,ownerName:task?.ownerName||null,action:pending,nextAction:({PICK:'Siapkan muatan',CHECK:'Periksa muatan',LOAD:'Serahkan muatan kepada supir'})[pending]||'Periksa kesiapan muatan',explanation:task?.note||'Lanjutkan pemeriksaan fisik muatan sesuai dokumen.',dueAt:task?.dueAt};
 }
 return {stage:'TRIP_START',responsibleRole:'SUPIR',ownerId:route.driverId,ownerName:route.driver?.name,nextAction:'Absen berangkat',action:'START',explanation:'Muatan siap. Menunggu supir yang ditugaskan melakukan absen berangkat.'};
}
export function presentAttention(row,user={}){
 const roles=String(row.responsibleRole||'').split(/\s*\/\s*/).map(role=>role==='SPV'?'SUPERVISOR':role==='KEPALA GUDANG'?'KEPALA_GUDANG':role);
 const queue=roles.some(role=>responsibleLabels[role]);
 const actionable=row.actionableForUser??(row.ownerId?row.ownerId===user.id:roles.includes(user.role));
 const titles={ORDER_APPROVAL:'Periksa order',ORDER_FULFILLMENT:'Siapkan dokumen muatan',PACKING_DRAFT:'Lengkapi dokumen muatan',PACKING_ALLOCATION:'Jadwalkan muatan',RETURN_INSPECTION:'Periksa barang kembali',FOLLOW_UP:'Kerjakan arahan kunjungan',FOLLOW_UP_REVIEW:'Periksa hasil pekerjaan'};
 return {...row,queueAssigned:queue,actionableForUser:actionable,actionTitle:row.actionTitle||titles[row.stage]||row.nextAction||row.title,handledBy:row.ownerName||(row.ownerId?'Petugas yang ditugaskan':roles.map(role=>responsibleLabels[role]||role).join(' / ')||'Perlu penetapan penerima'),buttonLabel:row.completed?'Lihat hasil':actionable?'Buka pekerjaan':'Lihat perkembangan'};
}
export function canWorkTrip(user,work){return Boolean(work&&work.responsibleRole!=='SUPIR'&&(!work.ownerId||work.ownerId===user.id)&&(work.action==='RETURN_INSPECTION'?['ADMIN','KEPALA_GUDANG'].includes(user.role)&&user.permissions?.can_monitor_delivery!==false:canTripAction(user,work.action)));}
