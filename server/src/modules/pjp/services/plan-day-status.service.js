import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {assertSalesAccess} from '../../../utils/team-scope.js';
import {validPlanDate,ruleDue} from '../../../../../shared/pjp-planning.mjs';
import {workingDays} from '../../../../../shared/working-calendar.mjs';
import {getDynamicConfig} from '../../config/config.service.js';
export async function planDayStatus(date,userId,actor){
 if(!validPlanDate(date)||!userId)throw new AppError('Pilih Sales dan tanggal yang valid',400);
 await assertSalesAccess(actor,userId);
 const working=workingDays(await getDynamicConfig('PJP_WORKING_DAYS','1,2,3,4,5,6'));
 if(!working.includes(new Date(date).getUTCDay()))return {date,state:'NON_WORKING_DAY',planNames:[]};
 const plans=await prisma.pjpPlan.findMany({where:{status:'PUBLISHED',startsOn:{lte:date},endsOn:{gte:date},...(actor.role==='SUPERVISOR'?{supervisorId:actor.id}:{})},select:{id:true,name:true,rules:true}});
 const own=plans.filter(p=>p.rules.some(r=>r.userId===userId));
 return {date,state:own.length?(own.some(p=>p.rules.some(r=>r.userId===userId&&ruleDue(r,date)))?'PUBLISHED':'NOT_DUE'):'UNPUBLISHED',planNames:own.map(p=>p.name)};
}
