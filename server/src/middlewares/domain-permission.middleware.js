import {canDomainAction,DOMAIN_PERMISSIONS,CORE_ADMIN_ACTIONS} from '../../../shared/domain-permissions.mjs';
import {AppError} from '../utils/errors.js';
import {reviewPeople} from '../modules/config/services/approval-readiness.service.js';
export function assertDomainAction(actor,action){
 if(!canDomainAction(actor,action))throw new AppError(`Akses ditolak: ${DOMAIN_PERMISSIONS[action]?.label||CORE_ADMIN_ACTIONS[action]?.label||action} memerlukan role dan izin yang sesuai.`,403);
}
export const authorizeDomainAction=action=>(req,res,next)=>{try{assertDomainAction(req.user,action);next();}catch(error){next(error);}};
// For transaction/worker entry points, re-read templates and account under the common actor lock.
export async function freshDomainActor(db,id,action){
 await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('approval:actors'))`;
 const actor=(await reviewPeople(db)).find(person=>person.id===id);
 assertDomainAction(actor,action);return actor;
}
