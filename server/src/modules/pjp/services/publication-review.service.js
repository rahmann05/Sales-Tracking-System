import {createHash} from 'node:crypto';
import {AppError} from '../../../utils/errors.js';
// Deliberately omit live GPS/cache fields. Freeze the business calendar and decisions, not provider telemetry.
export function publicationFingerprint(plan,review,policy,codePolicy){
 const payload={rules:plan.rules,startsOn:plan.startsOn,endsOn:plan.endsOn,policy,codePolicy,
  days:review.days.map(d=>({userId:d.userId,date:d.date,outletIds:d.outletIds})),
  warnings:review.warnings,uncovered:review.uncovered.map(o=>o.id).sort(),calendar:review.calendar};
 return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}
export function assertPublicationReview(review,body,codePolicy){
 const days=review.days.filter(d=>d.outletIds.length);
 if(review.problems.length)throw new AppError(review.problems.slice(0,5).map(p=>p.message).join(' '),409);
 if(!days.length)throw new AppError('Tidak ada kunjungan yang jatuh tempo dalam periode ini.',400);
 if((review.warnings.length||review.uncovered.length)&&!body.acknowledgeWarnings)throw new AppError('Tinjau dan akui peringatan cakupan/frekuensi sebelum menerbitkan.',400);
 const codes=Object.values(body.codes);
 if(new Set(codes).size!==codes.length)throw new AppError('Kode PJP manual duplikat',400);
 if(codePolicy.mode==='MANUAL')for(const day of days)if(!body.codes[`${day.userId}:${day.date}`])throw new AppError(`Isi kode PJP ${day.salesName} ${day.date}.`,422);
 return days;
}
