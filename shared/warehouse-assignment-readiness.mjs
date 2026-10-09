import {preparationStages,preparationOwnerProblem,warehouseStaffEligible} from './warehouse-policy.mjs';
export function warehouseAssignmentGaps(routes,people){
 const gaps=[];
 for(const route of routes){
  if(route.cancelledAt)continue;
  if(!route.closedAt&&route.status==='DRAFT')for(const stage of preparationStages(route.policySnapshot?.values)){
   const task=route.preparation?.tasks?.[stage];if(!task?.ownerId||route.preparation?.[stage])continue;
   if(preparationOwnerProblem(people.find(p=>p.id===task.ownerId),route,stage))gaps.push({key:`PREPARATION:${route.id}:${stage}`,message:`Trip ${route.code}: PIC tahap ${stage} harus tetap aktif dan memiliki izin persiapan. Alihkan tugas terlebih dahulu.`});
  }
  for(const stop of route.stops||[]){
   const task=route.preparation?.returnTasks?.[stop.id];
   if(!task?.ownerId||!(stop.rejectedCartons>0)||stop.returnInspection)continue;
   if(!warehouseStaffEligible(people.find(p=>p.id===task.ownerId),'can_monitor_delivery'))gaps.push({key:`RETURN:${stop.id}:OWNER`,message:`Retur trip ${route.code}: PIC harus tetap aktif dan memiliki akses pemeriksaan. Alihkan pemeriksaan terlebih dahulu.`});
  }
 }
 return gaps;
}
