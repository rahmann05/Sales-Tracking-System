import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { invalidateClusterCache } from './clusters.helpers.js';

export const deleteCluster = async id => {
  const result=await prisma.$transaction(async tx=>{
    const cluster=await tx.cluster.findUnique({where:{id},include:{_count:{select:{outlets:{where:{deletedAt:null}},users:{where:{deletedAt:null}},customerRegistrations:{where:{deletedAt:null}}}}}});
    if(!cluster||cluster.deletedAt)throw new AppError('Kluster tidak ditemukan',404);
    if(cluster.name==='Belum Ditugaskan')throw new AppError('Wilayah penampung outlet tidak dapat dihapus',409);
    if(cluster._count.outlets||cluster._count.users||cluster._count.customerRegistrations||cluster.assignedSalesId)throw new AppError('Pindahkan outlet dan registrasi serta lepaskan penugasan sales sebelum menghapus kluster.',409);
    return tx.cluster.update({where:{id},data:{deletedAt:new Date()}});
  });
  invalidateClusterCache(id);
  return result;
};
