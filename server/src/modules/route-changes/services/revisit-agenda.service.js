import {AppError} from '../../../utils/errors.js';
import {ensureSalesPjpForDate,lockSalesPjpForDate} from '../../pjp/services/pjp.helpers.js';
import {resolveBusinessCode,getCodePolicy} from '../../config/services/business-code.service.js';
import {effectivePolicy} from '../../config/services/policy-resolver.service.js';
import {withPolicy} from '../../config/services/policy-context.service.js';
import {captureReportAssignment,REPORT_USER_SELECT} from '../../reports/services/report-assignment.service.js';
import {wibDayRange} from '../../../../../shared/visit-metrics.mjs';
import {planningCalendar} from '../../pjp/services/planning-calendar.service.js';
import {workingDays} from '../../../../../shared/working-calendar.mjs';
export async function createRevisitAgenda(db,request,schedule){
 const sales=await db.user.findUnique({where:{id:request.reportedBy},select:{...REPORT_USER_SELECT,deletedAt:true}});
 const original=request.pjp.stops.find(s=>s.id===request.pjpStopId);
 if(!original)throw new AppError('Agenda asal tidak ditemukan.',409);
 const origin=await db.outlet.findFirst({where:{id:original.outletId,deletedAt:null},include:{cluster:true}});
 if(!sales||sales.deletedAt||!origin||origin.cluster?.deletedAt||origin.cluster?.supervisorId!==sales.supervisorId)throw new AppError('Sales atau wilayah outlet telah berubah. Perbaiki penugasan sebelum menjadwalkan ulang.',409);
 const policy=await effectivePolicy(sales,Date.parse(schedule.effectiveAt),{fresh:true}),date=new Date(schedule.effectiveAt);
 if(policy.values.FEATURE_PJP_MODE!=='ACTIVE')throw new AppError('Pembuatan agenda PJP baru sedang dijeda.',409);
 return withPolicy(policy,async()=>{
  const calendar=await planningCalendar(db,schedule.date,schedule.date),day=new Date(schedule.date+'T12:00:00Z').getUTCDay();
  if(calendar.missing.length||!(calendar.workingDates?calendar.workingDates.includes(schedule.date):workingDays(policy.values.PJP_WORKING_DAYS||'1,2,3,4,5,6').includes(day)))throw new AppError('Tanggal tujuan bukan hari kerja atau kalender belum lengkap.',422);
  await lockSalesPjpForDate(db,sales.id,schedule.date);
  let pjp=await ensureSalesPjpForDate(db,sales.id,date,schedule.manualCode);
  if(!pjp){
   if((await getCodePolicy('PJP')).mode==='MANUAL'&&!schedule.manualCode)throw new AppError('Isi kode PJP manual untuk tanggal kunjungan kembali.',422);
   pjp=await db.pjp.create({data:{...captureReportAssignment(sales,'REVISIT_PLAN',date),userId:sales.id,type:'SALES',date:wibDayRange(date).gte,status:'SCHEDULED',code:await resolveBusinessCode('PJP',schedule.manualCode,{db,date})}});
  }
  let stop=await db.pjpStop.findFirst({where:{pjpId:pjp.id,outletId:origin.id}});
  if(stop&&(stop.validationOnly||stop.status!=='PENDING'||stop.visitSession?.startedAt||await db.attendance.count({where:{pjpStopId:stop.id}})))throw new AppError('Outlet sudah mempunyai aktivitas/tugas khusus pada tanggal tujuan. Pilih jadwal lain.',409);
  if(!stop){
   if(await db.pjpStop.count({where:{pjpId:pjp.id}})>=Number(policy.values.PJP_MAX_VISITS_PER_DAY||50))throw new AppError('Kapasitas PJP pada tanggal tujuan sudah penuh.',409);
   const last=await db.pjpStop.aggregate({where:{pjpId:pjp.id},_max:{sequence:true}});stop=await db.pjpStop.create({data:{pjpId:pjp.id,outletId:origin.id,sequence:(last._max.sequence||0)+1,status:'PENDING',visitSession:{plannedFor:schedule.effectiveAt,sourceRouteChangeId:request.id}}});
  }
  // Existing regular agenda stays intact: only the case link is stored on the workflow.
  if(pjp.status==='COMPLETED')await db.pjp.update({where:{id:pjp.id},data:{status:'IN_PROGRESS'}});
  return {pjpId:pjp.id,stopId:stop.id,outletId:origin.id,...schedule};
 });
}
