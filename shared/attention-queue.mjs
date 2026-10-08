import {wibDateKey} from './visit-metrics.mjs';
import {attentionDeadline} from './attention-sla.mjs';
export function attentionState(row,now=Date.now()) {
 const overdue=row.status==='SUBMITTED'?attentionDeadline(row)<now:row.dueDate?row.dueDate<wibDateKey(new Date(now)):attentionDeadline(row)<now;
 return {...row,overdue,missingOwner:!row.ownerId,missingDeadline:!Number.isFinite(attentionDeadline(row))};
}
export function paginateAttention(rows,{page=1,limit=25,filter='ALL',category='ALL',actorId}={},now=Date.now()) {
 const enriched=rows.map(r=>attentionState(r,now));
 const review=r=>r.needsReview||r.status==='SUBMITTED';
 const summary={total:enriched.length,overdue:enriched.filter(r=>r.overdue).length,awaitingReview:enriched.filter(review).length,missingOwner:enriched.filter(r=>r.missingOwner).length,missingDeadline:enriched.filter(r=>r.missingDeadline).length};
 const selected=enriched.filter(r=>(category==='ALL'||r.category===category)&&(filter==='ALL'||filter==='MINE'&&actorId&&r.ownerId===actorId||filter==='OVERDUE'&&r.overdue||filter==='REVIEW'&&review(r)||filter==='UNASSIGNED'&&r.missingOwner||filter==='UNSCHEDULED'&&r.missingDeadline));
 const due=attentionDeadline;
 selected.sort((a,b)=>Number(b.overdue)-Number(a.overdue)||due(a)-due(b)||new Date(a.since)-new Date(b.since)||a.key.localeCompare(b.key));
 return {summary,total:selected.length,page,limit,rows:selected.slice((page-1)*limit,page*limit)};
}
