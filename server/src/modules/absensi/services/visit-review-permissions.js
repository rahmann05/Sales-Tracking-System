import {canReviewVisit,VISIT_REVIEW_PERMISSIONS} from '../../../../../shared/visit-review-permissions.mjs';
import {AppError} from '../../../utils/errors.js';
import {reviewPeople} from '../../config/services/approval-readiness.service.js';
import {visitReviewGaps} from '../../../../../shared/approval-readiness.mjs';
// Callers hold staff:<userId> before acquiring this lock, as order submission does.
export async function assertVisitReviewersAvailable(db,userId,actions){
 if(!actions.length)return;
 await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('approval:actors'))`;
 const people=await reviewPeople(db);
 const gaps=actions.filter(action=>visitReviewGaps({userId},action,people).length);
 if(gaps.length)throw new AppError(`Pengajuan belum dapat disimpan: pemeriksa aktif berizin untuk ${gaps.map(action=>VISIT_REVIEW_PERMISSIONS[action].label.toLowerCase()).join(' dan ')} belum tersedia. Minta Admin menyiapkan pemeriksa atau menyesuaikan aturan persetujuan.`,409);
}
export function assertVisitReview(actor,action,applicantId){
 if(!canReviewVisit(actor,action,applicantId))throw new AppError(`Akses ditolak: ${VISIT_REVIEW_PERMISSIONS[action]?.label||'pemeriksaan kunjungan'} memerlukan pemeriksa aktif berizin dan tidak boleh atas pengajuan sendiri.`,403);
}
export const authorizeVisitReview=action=>(req,res,next)=>{
 try{assertVisitReview(req.user,action);next();}catch(error){next(error);}
};
