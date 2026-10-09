import { z } from 'zod';
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { actorSnapshot, lockOutlet, reviewOutlet, reviewScope, reviewInclude } from './outlet-review-policy.service.js';
import { invalidateOutletCache } from './outlets.helpers.js';
import {outletReviewEvidenceState} from '../../../../../shared/outlet-evidence-policy.mjs';
const opening=z.object({reason:z.string().trim().min(10).max(1000)});
const decision=z.object({revision:z.number().int().positive(),action:z.enum(['KEEP','WAITING_FIELD','CORRECTED']),note:z.string().trim().min(10).max(2000),evidence:z.string().trim().max(2000).optional()});
export async function openOutletReview(id,body,actor) {
  const {reason}=opening.parse(body);
  const result=await prisma.$transaction(async tx=>{
    await lockOutlet(tx,id);await reviewOutlet(tx,actor,id);
    const existing=await tx.outletReview.findFirst({where:{outletId:id,status:{in:['OPEN','WAITING_FIELD']}},include:reviewInclude});
    return existing || tx.outletReview.create({data:{outletId:id,reason,requestedBy:actorSnapshot(actor)},include:reviewInclude});
  });
  invalidateOutletCache();return result;
}
export async function getOutletReviews(query,actor) {
  const status=z.enum(['OPEN','WAITING_FIELD','COMPLETED','ALL']).parse(query.status || 'OPEN');
  const where={outlet:await reviewScope(actor,prisma),...(status==='ALL'?{}:{status})};
  if(query.search?.trim())where.outlet={...where.outlet,OR:['name','address','outletCode'].map(k=>({[k]:{contains:query.search.trim(),mode:'insensitive'}}))};
  const page=Math.max(1,parseInt(query.page)||1),limit=30;
  const [data,total]=await prisma.$transaction([prisma.outletReview.findMany({where,include:{...reviewInclude,outlet:{include:{cluster:true}}},orderBy:{updatedAt:'desc'},skip:(page-1)*limit,take:limit}),prisma.outletReview.count({where})]);
  return {data,pagination:{page,limit,total,totalPages:Math.max(1,Math.ceil(total/limit))}};
}
export async function getOutletReview(id,actor) {
  const review=await prisma.outletReview.findFirst({where:{id,outlet:await reviewScope(actor,prisma)},include:{...reviewInclude,outlet:{include:{cluster:true,changes:{orderBy:{createdAt:'desc'},take:50}}}}});
  if(!review)throw new AppError('Kasus tidak ditemukan dalam cakupan Anda',404);
  return review;
}
export async function decideOutletReview(outletId,reviewId,raw,actor) {
  const body=decision.parse(raw);
  const result=await prisma.$transaction(async tx=>{
    await lockOutlet(tx,outletId);const outlet=await reviewOutlet(tx,actor,outletId);
    const review=await tx.outletReview.findFirst({where:{id:reviewId,outletId},include:reviewInclude});
    if(!review||review.status==='COMPLETED'||review.revision!==body.revision)throw new AppError('Kasus sudah berubah. Muat ulang sebelum mencatat keputusan.',409);
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
