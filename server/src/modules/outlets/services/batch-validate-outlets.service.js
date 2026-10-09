import {getDynamicConfig} from '../../config/config.service.js';
import { z } from 'zod';
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { validateOutlet } from './validate-outlet.service.js';
import { openOutletReview } from './outlet-reviews.service.js';
import { reviewScope } from './outlet-review-policy.service.js';
const schema=z.object({outletIds:z.array(z.string().min(1)).min(1).max(100),reason:z.string().trim().min(10).max(1000)}).strict();
export async function batchValidateOutlets(raw,actor) {
  const body=schema.parse(raw);
  if(body.outletIds.length>await getDynamicConfig('OUTLET_REVIEW_BATCH_LIMIT',30))throw new AppError('Jumlah outlet melebihi batas pemeriksaan yang ditetapkan Admin',400);
  if(new Set(body.outletIds).size!==body.outletIds.length)throw new AppError('Daftar outlet duplikat',400);
  const outlets=await prisma.outlet.findMany({where:{id:{in:body.outletIds},...await reviewScope(actor,prisma)},select:{id:true,name:true}});
  if(outlets.length!==body.outletIds.length)throw new AppError('Sebagian outlet berada di luar cakupan Anda',403);
  const results=[];
  for(const outlet of outlets) {
    try {
      const review=await openOutletReview(outlet.id,{reason:body.reason},actor);
      const result=await validateOutlet(outlet.id,{reviewId:review.id,revision:review.revision},actor);
      results.push({id:outlet.id,name:outlet.name,success:true,result});
    } catch(error) {results.push({id:outlet.id,name:outlet.name,success:false,error:error.message});}
  }
  return {total:results.length,processed:results.length,success:results.filter(r=>r.success).length,failed:results.filter(r=>!r.success).length,results};
}
