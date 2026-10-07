import { z } from 'zod';
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { assertOutletAccess } from '../../../utils/team-scope.js';
import { invalidateOutletCache } from './outlets.helpers.js';
const schema = z.object({latitude:z.number().finite().min(-90).max(90),longitude:z.number().finite().min(-180).max(180),updatedAt:z.string().datetime(),reason:z.string().trim().min(10).max(1000)});
export async function correctCoordinates(id,raw,actor) {
  const body = schema.parse(raw);
  await assertOutletAccess(actor,id);
  const result = await prisma.$transaction(async tx=>{
    const outlet = await tx.outlet.findFirst({where:{id,deletedAt:null}});
    if (!outlet) throw new AppError('Outlet tidak ditemukan',404);
    const entry = {actorId:actor.id,at:new Date().toISOString(),reason:body.reason,previous:{latitude:outlet.latitude,longitude:outlet.longitude},next:{latitude:body.latitude,longitude:body.longitude}};
    const update = await tx.outlet.updateMany({where:{id,updatedAt:new Date(body.updatedAt)},data:{latitude:body.latitude,longitude:body.longitude,validationStatus:'UNVALIDATED',validationConfidence:null,validatedAt:null,googleSuggestedLat:null,googleSuggestedLng:null,validationDetails:{coordinateHistory:[...(outlet.validationDetails?.coordinateHistory || []),entry]}}});
    if (!update.count) throw new AppError('Outlet sudah berubah. Muat ulang sebelum menyimpan koreksi.',409);
    return tx.outlet.findUnique({where:{id}});
  });
  invalidateOutletCache();
  return result;
}
