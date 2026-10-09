import { prisma } from '../../../config/prisma.js';
import { reviewScope } from './outlet-review-policy.service.js';
export async function getValidationSummary(actor) {
  const rows=await prisma.outletReview.groupBy({by:['status'],where:{outlet:await reviewScope(actor,prisma)},_count:{id:true}});
  return Object.fromEntries(['OPEN','WAITING_FIELD','COMPLETED'].map(status=>[status,rows.find(r=>r.status===status)?._count.id || 0]));
}
