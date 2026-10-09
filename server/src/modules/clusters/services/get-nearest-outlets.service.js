/** getNearestOutlets - single-responsibility service (extracted from clusters.service.js). */
import { prisma } from '../../../config/prisma.js';
import { haversineKm } from '../cluster-generator.service.js';

// --- NEW FULL PAGE BUILDER LOGIC ---
export const getNearestOutlets = async (lat, lng, count, type = null, actor,supervisorId) => {
  const owner=actor?.role==='SUPERVISOR'?actor.id:supervisorId;
  const allOutlets = await prisma.outlet.findMany({
    where: {deletedAt:null,cluster:{deletedAt:null,...(owner?{OR:[{supervisorId:owner},{name:'Belum Ditugaskan'}]}:{})}},
    include: {cluster:{select:{id:true,name:true,region:true,supervisorId:true}}},
  });

  // Filter outlet yang tidak memiliki lat/lng valid dan sesuai type (jika diberikan)
  let validOutlets = allOutlets.filter(o =>
    (actor?.role !== 'SUPERVISOR' || o.cluster?.supervisorId === actor.id || o.cluster?.name === 'Belum Ditugaskan') &&
    o.latitude != null &&
    o.longitude != null &&
    (type ? o.type === type : true)
  );

  // Hitung jarak haversine ke setiap outlet
  let withDistances = validOutlets.map(o => ({
    ...o,
    distanceToCenterKm: haversineKm(lat, lng, o.latitude, o.longitude)
  }));

  // Urutkan berdasarkan jarak terdekat
  withDistances.sort((a, b) => a.distanceToCenterKm - b.distanceToCenterKm);

  // Ambil N terdekat
  return withDistances.slice(0, count);
};
