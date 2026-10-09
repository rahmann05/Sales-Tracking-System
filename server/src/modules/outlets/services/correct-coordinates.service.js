import { z } from 'zod';
import { assertOutletAccess } from '../../../utils/team-scope.js';
import { invalidateOutletCache } from './outlets.helpers.js';
import {updateOutlet} from './update-outlet.service.js';
import {locationEvidenceSchema} from '../outlets.schema.js';
const schema = z.object({latitude:z.number().finite().min(-90).max(90),longitude:z.number().finite().min(-180).max(180),updatedAt:z.string().datetime(),reason:z.string().trim().min(10).max(1000),locationEvidence:locationEvidenceSchema.optional()});
export async function correctCoordinates(id,raw,actor) {
  const body = schema.parse(raw);
  await assertOutletAccess(actor,id);
  const result = await updateOutlet(id,{...body,locationEvidence:body.locationEvidence || {source:'MANUAL'}},actor);
  invalidateOutletCache();
  return result;
}
