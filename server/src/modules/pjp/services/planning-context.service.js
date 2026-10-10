import {AppError} from '../../../utils/errors.js';
import {workingDays} from '../../../../../shared/working-calendar.mjs';
import {getDynamicConfig} from '../../config/config.service.js';
import {REPORT_USER_SELECT} from '../../reports/services/report-assignment.service.js';
export function assertPlanManager(actor,supervisorId){
 if(!['ADMIN','SUPERVISOR'].includes(actor.role)||actor.permissions?.can_manage_rjp===false)throw new AppError('Tidak berwenang mengelola rencana kunjungan',403);
 if(actor.role==='SUPERVISOR'&&supervisorId!==actor.id)throw new AppError('Rencana berada di luar tim Anda',403);
}
export async function planningContext(db,actor,supervisorId){
 assertPlanManager(actor,supervisorId);
 if(!await db.user.findFirst({where:{id:supervisorId,role:'SUPERVISOR',deletedAt:null},select:{id:true}}))throw new AppError('Supervisor aktif tidak ditemukan',404);
 const [sales,outlets,days]=await Promise.all([
  db.user.findMany({where:{role:'SALES',supervisorId,deletedAt:null},select:{...REPORT_USER_SELECT,id:true,name:true,supervisorId:true},orderBy:{name:'asc'}}),
  db.outlet.findMany({where:{deletedAt:null,cluster:{supervisorId,deletedAt:null}},select:{id:true,name:true,outletCode:true,itineraryCode:true,googleLocation:true,phone:true,clusterId:true,address:true,latitude:true,longitude:true,cluster:{select:{id:true,name:true,assignedSalesId:true,supervisorId:true}}},orderBy:{name:'asc'}}),
  getDynamicConfig('PJP_WORKING_DAYS','1,2,3,4,5,6'),
 ]);
 return {sales,outlets,workingDays:workingDays(days)};
}
