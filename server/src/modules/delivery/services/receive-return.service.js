import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
export const receiveReturn = (stopId,userId,note) => prisma.$transaction(async tx=>{
  const stop=await tx.deliveryStop.findUnique({where:{id:stopId}});
  if(!stop)throw new AppError('Pengiriman tidak ditemukan',404);
  if(!['REJECTED','PARTIAL_REJECT'].includes(stop.status)||!(stop.rejectedCartons>0))throw new AppError('Tidak ada retur pada pengiriman ini',409);
  if(!note?.trim())throw new AppError('Catatan pemeriksaan retur wajib',400);
  const changed=await tx.deliveryStop.updateMany({where:{id:stopId,returnReceivedAt:null},data:{returnReceivedAt:new Date(),returnReceivedBy:userId,returnNote:note.trim()}});
  if(!changed.count)throw new AppError('Retur sudah diterima',409);
  return tx.deliveryStop.findUnique({where:{id:stopId}});
},{isolationLevel:'Serializable'});
