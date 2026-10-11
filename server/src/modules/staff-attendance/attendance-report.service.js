import {prisma} from '../../config/prisma.js';
import {AppError} from '../../utils/errors.js';

export function staffReportScope(user) {
 return user.role==='ADMIN'?{}:{OR:[{userId:user.id},{user:{supervisorId:user.id}}]};
}
// Photos may be inline uploads. Keep them out of the collapsed list response.
export function attendanceSummary(row) {
 const strip=value=>{
  if(value instanceof Date)return value.toISOString();
  if(Array.isArray(value))return value.map(strip);
  if(!value||typeof value!=='object')return typeof value==='string'&&value.startsWith('data:image/')?null:value;
  return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,key==='photoUrl'?null:strip(item)]));
 };
 return {...strip(row),photoAvailable:Boolean(row.photoUrl),finishPhotoAvailable:Boolean(row.checklist?.finishEvidence?.photoUrl)};
}
export async function attendanceReportEvidence(id,user) {
 const row=await prisma.staffActivity.findFirst({where:{id,kind:{in:['SHIFT','VISIT','OFF_PJP']},...staffReportScope(user)},include:{user:{select:{name:true,role:true}}}});
 if(!row)throw new AppError('Absensi tidak ditemukan atau berada di luar tim Anda.',404);
 const flags=await prisma.operationalException.findMany({where:{entityId:id},select:{kind:true,status:true,details:true,createdAt:true}});
 return {...row,flags};
}
