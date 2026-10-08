import {z} from 'zod';
import {visitOutcomeError,includesCollection} from '../../../../shared/visit-outcome.mjs';
export const visitOutcomeSchema=z.object({
  purpose:z.enum(['ORDER','COLLECTION','BOTH','OTHER']),
  reference:z.string().trim().max(500).optional(),
  result:z.enum(['DISCUSSED','PROMISED','REPORTED_PAID','UNAVAILABLE','DISPUTED']).optional(),
  promiseDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  note:z.string().trim().max(2000).optional(),
}).strict().superRefine((value,ctx)=>{const message=visitOutcomeError(value);if(message)ctx.addIssue({code:z.ZodIssueCode.custom,message});})
.transform(value=>includesCollection(value.purpose)?value:{purpose:value.purpose});
