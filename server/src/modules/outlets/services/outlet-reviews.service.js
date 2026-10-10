import {initialReviewAssignment,outletReviewOwners} from './outlet-review-assignment.service.js';
import { z } from 'zod';
import {actionNames} from '../../../../../shared/business-actions.mjs';
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { actorSnapshot, lockOutlet, reviewOutlet, reviewScope, reviewInclude } from './outlet-review-policy.service.js';
import { invalidateOutletCache } from './outlets.helpers.js';
import {outletReviewEvidenceState} from '../../../../../shared/outlet-evidence-policy.mjs';
import {reviewActor,fieldActors} from './outlet-review-access.service.js';
import {presentOutletRun} from './outlet-provider-content.service.js';
import {outletIssues} from '../../../../../shared/outlet-validation.mjs';
const opening=z.object({reason:z.string().trim().min(10).max(1000)});
const decision=z.object({revision:z.number().int().positive(),action:z.enum(actionNames('OUTLET_REVIEW')),note:z.string().trim().min(10).max(2000),evidence:z.string().trim().max(2000).optional()});
export async function openOutletReview(id,body,actor) {
  const {reason}=opening.parse(body);
  const result=await prisma.$transaction(async tx=>{
    await lockOutlet(tx,id);const outlet=await reviewOutlet(tx,actor,id);
    const existing=await tx.outletReview.findFirst({where:{outletId:id,status:{in:['OPEN','WAITING_FIELD']}},include:reviewInclude});
    if(existing)return existing;
    const assignment=await initialReviewAssignment(tx,outlet,actor);
    return tx.outletReview.create({data:{outletId:id,reason,requestedBy:actorSnapshot(actor),workflow:{stage:'OPEN',resultCode:'UNEXAMINED'},...assignment},include:reviewInclude});
  });
  invalidateOutletCache();return result;
}
export async function getOutletReviews(query,actor) {
  const status=z.enum(['OPEN','WAITING_FIELD','COMPLETED','CANCELLED','ALL']).parse(query.status || 'OPEN');
  const where={outlet:await reviewScope(actor,prisma),...(status==='ALL'?{}:{status})};
  if(query.stage&&query.stage!=='ALL')where.workflow={path:['stage'],equals:z.enum(['OPEN','REVIEW','NEEDS_FIELD','WAITING_FIELD','SUBMITTED','COMPLETED','CANCELLED']).parse(query.stage)};
  if(query.issue&&query.issue!=='ALL'){
    const issue=z.enum(['MISSING_POINT','UNCLEAR_NAME','INCOMPLETE_ADDRESS','UNCONFIRMED_POINT','CHANGED']).parse(query.issue);
    const candidates=await prisma.outlet.findMany({where:where.outlet,select:{id:true,name:true,address:true,latitude:true,longitude:true,source:true,locationEvidence:true,validationDetails:true}});
    where.outlet={...where.outlet,id:{in:candidates.filter(o=>outletIssues(o).includes(issue)).map(o=>o.id)}};
  }
  if(query.ownerId)where.ownerId=String(query.ownerId);
  if(query.search?.trim())where.outlet={...where.outlet,OR:['name','address','outletCode'].map(k=>({[k]:{contains:query.search.trim(),mode:'insensitive'}}))};
  const page=Math.max(1,parseInt(query.page)||1),limit=30;
  const [data,total]=await prisma.$transaction([prisma.outletReview.findMany({where,include:{outlet:{include:{cluster:true}}},orderBy:{updatedAt:'desc'},skip:(page-1)*limit,take:limit}),prisma.outletReview.count({where})]);
  return {data,pagination:{page,limit,total,totalPages:Math.max(1,Math.ceil(total/limit))}};
}
export async function getOutletReview(id,actor) {
  const scope=await reviewScope(actor,prisma);delete scope.deletedAt;
  const review=await prisma.outletReview.findFirst({where:{id,outlet:scope},include:{...reviewInclude,outlet:{include:{cluster:true,changes:{orderBy:{createdAt:'desc'},take:50}}}}});
  if(!review)throw new AppError('Kasus tidak ditemukan dalam cakupan Anda',404);
  return {...review,runs:review.runs.map(presentOutletRun),availableOwners:await outletReviewOwners(prisma,review.outlet),fieldActors:await fieldActors(prisma,review.outlet)};
}
export async function decideOutletReview(outletId,reviewId,raw,actor) {
  const body=decision.parse(raw);
  const result=await prisma.$transaction(async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('approval:actors'))`;actor=await reviewActor(tx,actor,'can_apply_outlet_review');
    await lockOutlet(tx,outletId);const outlet=await reviewOutlet(tx,actor,outletId);
    const review=await tx.outletReview.findFirst({where:{id:reviewId,outletId},include:reviewInclude});
    if(!review||['COMPLETED','CANCELLED'].includes(review.status)||review.revision!==body.revision)throw new AppError('Kasus sudah berubah. Muat ulang sebelum mencatat keputusan.',409);
    if(review.workflow?.stage||review.runs.some(run=>run.result?.method==='GOOGLE_ADAPTIVE_V3'))throw new AppError('Gunakan keputusan digital/lapangan pada halaman validasi terbaru.',409);
    if(body.action==='KEEP'&&!review.runs.length&&(!body.evidence||body.evidence.length<10))throw new AppError('Referensi bukti internal/lapangan wajib jika Google belum diperiksa.',422);
    if(body.action==='CORRECTED') {
      const changes=await tx.outletChange.findMany({where:{outletId,createdAt:{gte:review.createdAt},source:{in:['LOCATION','IMPORT','REVIEW','MASTER']}},orderBy:{createdAt:'desc'},take:50});
      if(!changes.some(change=>['latitude','longitude','name','address'].some(k=>change.after[k]!==undefined&&change.before[k]!==change.after[k])))throw new AppError('Simpan koreksi data terlebih dahulu sebelum menyelesaikan kasus sebagai dikoreksi.',400);
    }
    const evidenceState=outletReviewEvidenceState(review.runs,outlet);
    if(body.action==='KEEP'&&evidenceState.stale&&(!body.evidence||body.evidence.length<10))throw new AppError(evidenceState.unavailable?'Pemeriksaan peta belum berhasil. Jalankan pemeriksaan kembali atau catat bukti lapangan terbaru.':evidenceState.expired?'Bukti peta kedaluwarsa. Jalankan pemeriksaan kembali atau catat bukti lapangan terbaru.':'Data berubah setelah pemeriksaan. Jalankan pemeriksaan kembali atau catat bukti lapangan terbaru.',409);
    const status=body.action==='WAITING_FIELD'?'WAITING_FIELD':'COMPLETED';
    const entry={...body,actor:actorSnapshot(actor),at:new Date().toISOString()};
    const updated=await tx.outletReview.update({where:{id:reviewId},data:{status,revision:{increment:1},closedAt:status==='COMPLETED'?new Date():null,decision:{...entry,history:[...(review.decision?.history || []),entry]}},include:reviewInclude});
    return updated;
  });
  invalidateOutletCache();return result;
}
