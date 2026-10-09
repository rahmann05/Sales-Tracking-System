import {z} from 'zod';
import {validPlanDate,planDates} from '../../../../../shared/pjp-planning.mjs';
export const planningDate=z.string().refine(validPlanDate,'Tanggal tidak valid');
export const planningBody=z.object({
 requestId:z.string().uuid(),name:z.string().trim().min(3).max(150),supervisorId:z.string().min(1),
 startsOn:planningDate,endsOn:planningDate,
 rules:z.array(z.object({userId:z.string().min(1),outletId:z.string().min(1),anchorDate:planningDate,intervalWeeks:z.union([z.literal(1),z.literal(2),z.literal(4)]),reason:z.string().trim().max(500).optional()})).max(500),
 revision:z.number().int().positive().optional(),note:z.string().trim().max(1000).optional(),
}).superRefine((body,ctx)=>{try{planDates(body.startsOn,body.endsOn);}catch(e){ctx.addIssue({code:z.ZodIssueCode.custom,message:e.message,path:['endsOn']});}});
export const publishBody=z.object({revision:z.number().int().positive(),codes:z.record(z.string().trim().min(1).max(128)).default({}),note:z.string().trim().min(5).max(1000),acknowledgeWarnings:z.boolean().default(false)});
