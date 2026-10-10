import {prisma} from '../../config/prisma.js';
import {AppError} from '../../utils/errors.js';
import {reviewPeople} from '../config/services/approval-readiness.service.js';
import {followUpAllowed,followUpOwnerEligible,followUpReviewers} from '../../../../shared/follow-up-policy.mjs';
export async function followUpActor(db,user,action){
 const people=await reviewPeople(db),actor=people.find(p=>p.id===user.id);
 if(!followUpAllowed(actor,action)||!followUpAllowed(actor,'view'))throw new AppError('Hak akses tindak lanjut tidak tersedia. Muat ulang sesi.',403);
 return {actor,people};
}
export function assertFollowUpOwner(owner,actor,people,requireReview=true){
 if(!followUpOwnerEligible(owner))throw new AppError('PIC harus Sales aktif dengan izin melihat dan menyelesaikan tindak lanjut.',400);
 if(actor.role!=='ADMIN'&&(actor.role!=='SUPERVISOR'||owner.supervisorId!==actor.id))throw new AppError('PIC berada di luar tim Anda.',403);
 if(requireReview&&!followUpReviewers(owner,people).length)throw new AppError('Siapkan pemeriksa aktif berizin untuk tim PIC sebelum menugaskan.',409);
}
export async function followUpCandidates(user){
 const {actor,people}=await followUpActor(prisma,user,'assign');
 return people.filter(p=>followUpOwnerEligible(p)&&(actor.role==='ADMIN'||actor.role==='SUPERVISOR'&&p.supervisorId===actor.id)).map(({id,name,supervisorId})=>({id,name,supervisorId}));
}
