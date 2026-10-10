import {z} from 'zod';
import {visitOutcomeError,includesCollection,validVisitAttachment,VISIT_ATTACHMENT_LIMIT} from '../../../../shared/visit-outcome.mjs';
export const visitOutcomeSchema=z.object({
  purpose:z.enum(['ORDER','COLLECTION','BOTH','OTHER']),
  reference:z.string().trim().max(500).optional(),
  result:z.enum(['DISCUSSED','PROMISED','REPORTED_PAID','UNAVAILABLE','DISPUTED']).optional(),
  promiseDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  note:z.string().trim().max(2000).optional(),
  offer:z.string().trim().max(2000).optional(),
  obstacle:z.string().trim().max(2000).optional(),
  attachments:z.array(z.object({name:z.string().trim().min(1).max(150),dataUrl:z.string().max(VISIT_ATTACHMENT_LIMIT).refine(validVisitAttachment,'Lampiran harus gambar JPEG/PNG yang valid, maksimal sekitar 500 KB.')})).max(3).optional(),
}).strict().superRefine((value,ctx)=>{const message=visitOutcomeError(value);if(message)ctx.addIssue({code:z.ZodIssueCode.custom,message});})
.transform(value=>includesCollection(value.purpose)?value:Object.fromEntries(Object.entries(value).filter(([key])=>!['reference','result','promiseDate'].includes(key))));
