const defaults={view:['ADMIN','SUPERVISOR','SALES'],assign:['ADMIN','SUPERVISOR'],complete:['ADMIN','SUPERVISOR','SALES'],review:['ADMIN','SUPERVISOR']};
export const followUpAllowed=(person,action)=>Boolean(person&&!person.deletedAt&&defaults[action]?.includes(person.role)&&person.permissions?.[`can_${action}_follow_up`]!==false);
export const followUpOwnerEligible=person=>Boolean(person?.role==='SALES'&&followUpAllowed(person,'view')&&followUpAllowed(person,'complete'));
export function followUpReviewers(owner,people,mode='BOTH'){
 return people.filter(p=>p.id!==owner?.id&&(mode==='BOTH'||p.role===mode)&&followUpAllowed(p,'view')&&followUpAllowed(p,'review')&&(p.role==='ADMIN'||p.role==='SUPERVISOR'&&p.id===owner?.supervisorId));
}
export function followUpAssignmentGaps(records,people){
 return records.flatMap(record=>{
  const f=record.followUp;if(!f||!['OPEN','SUBMITTED'].includes(f.status))return [];
  const owner=people.find(p=>p.id===f.ownerId),gaps=[];
  if(!followUpOwnerEligible(owner))gaps.push({key:`FOLLOW_UP:${record.id}:OWNER`,message:`Tindak lanjut ${record.outletName||record.id} memerlukan Sales aktif berizin. Alihkan PIC terlebih dahulu.`});
  if(record.policySnapshot?.values?.FOLLOW_UP_REQUIRE_REVIEW!==false&&!followUpReviewers(owner,people,f.reviewerMode||'BOTH').length)gaps.push({key:`FOLLOW_UP:${record.id}:REVIEWER`,message:`Tindak lanjut ${record.outletName||record.id} memerlukan pemeriksa ${f.reviewerMode||'SPV tim atau Admin'} aktif berizin.`});
  return gaps;
 });
}
