import {AppError} from '../../../utils/errors.js';
const domainRights={FOLLOW_UP:['can_view_follow_up','can_complete_follow_up'],RETURN:['can_monitor_delivery'],ORDER_REVIEW:['can_approve_order'],OUTLET_REVIEW:['can_validate_outlet'],PREPARATION:['can_manage_delivery_routes','can_monitor_delivery']};
export async function assertSchedulePeopleRemain(db,before,after){
 const rows=await db.systemConfig.findMany({where:{key:{startsWith:'_ASSIGNMENT_SCHEDULE:'},value:{path:['state'],equals:'ACTIVE'}}});
 for(const row of rows){const job=row.value;if(job?.state!=='ACTIVE'||!job.before?.ownerId)continue;
  const old=before.find(p=>p.id===job.before.ownerId),next=after.find(p=>p.id===job.before.ownerId);
  if(!old||old.deletedAt)continue;
  const rights=[...(domainRights[job.kind]||[]),...(job.kind==='PREPARATION'?[`can_trip_${job.before.context.stage.toLowerCase()}`]:[])];
  const changed=!next||next.deletedAt||next.role!==old.role||next.supervisorId!==old.supervisorId||rights.some(key=>old.permissions?.[key]!==false&&next.permissions?.[key]===false);
  if(changed)throw new AppError(`PIC awal delegasi ${job.label} masih diperlukan untuk pemulihan. Alihkan tugas dan akhiri delegasi sebelum mengubah akses/tim akun ini.`,409);
 }
}
