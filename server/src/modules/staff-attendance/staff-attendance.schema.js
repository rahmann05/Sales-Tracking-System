import { z } from 'zod';
export const staffActionSchema = z.object({ body: z.object({
  action: z.enum(['SHIFT_IN', 'SHIFT_OUT', 'VISIT_IN', 'VISIT_OUT', 'AUDIT', 'OFF_PJP']),
  stopId: z.string().min(1).max(128).optional(),
  visitMode: z.enum(['JOINT_VISIT','PRIORITY_AUDIT','OPENING_INSPECTION']).optional(),
  followUp: z.object({ownerId:z.string().min(1),dueDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),note:z.string().trim().min(1).max(4000)}).optional(),
  notes: z.string().max(4000).optional(),
  outletName: z.string().min(1).max(250).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  photoUrl: z.string().optional(),
  checklist: z.record(z.boolean()).optional(),
}).strict() });
