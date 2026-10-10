import { z } from 'zod';
import {actionNames} from '../../../../shared/business-actions.mjs';
export const staffActionSchema = z.object({ body: z.object({
  action: z.enum(actionNames('STAFF')),
  stopId: z.string().min(1).max(128).optional(),
  visitMode: z.enum(['JOINT_VISIT','PRIORITY_AUDIT','OPENING_INSPECTION']).optional(),
  followUp: z.object({ownerId:z.string().min(1),revision:z.number().int().nonnegative().optional(),dueDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),note:z.string().trim().min(1).max(4000)}).optional(),
  notes: z.string().max(4000).optional(),
  outletName: z.string().min(1).max(250).optional(),
    accuracy:z.number().nonnegative().max(100000).nullable().optional(),
    observedAt:z.string().datetime().nullable().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  photoUrl: z.string().optional(),
  checklist: z.record(z.union([z.boolean(),z.number().finite(),z.string().max(4000)]).nullable()).optional(),
  auditEvidence: z.record(z.object({reason:z.string().max(2000).optional(),photoUrl:z.string().max(2800000).optional()}).strict()).optional(),
}).strict() });
