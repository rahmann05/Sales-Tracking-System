import {reviewPeople} from '../../config/services/approval-readiness.service.js';
import {AppError} from '../../../utils/errors.js';
export async function reviewActor(db,user,permission){
 const actor=(await reviewPeople(db)).find(p=>p.id===user.id&&!p.deletedAt);
 const roles=permission==='can_submit_outlet_field'?['SALES']:['ADMIN','SUPERVISOR'];
 if(!actor||!roles.includes(actor.role)||actor.permissions[permission]!==true)throw new AppError('Role atau izin tindakan validasi outlet tidak tersedia.',403);
 return actor;
}
export async function fieldActors(db,outlet){
 const people=await reviewPeople(db),spv=outlet.cluster?.supervisorId;
 return {sales:people.filter(p=>!p.deletedAt&&p.role==='SALES'&&p.permissions.can_submit_outlet_field===true&&(!spv||p.supervisorId===spv)),reviewers:people.filter(p=>!p.deletedAt&&['ADMIN','SUPERVISOR'].includes(p.role)&&p.permissions.can_review_outlet_field===true&&(p.role==='ADMIN'||p.id===spv))};
}
