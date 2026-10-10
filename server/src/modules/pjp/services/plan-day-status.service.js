import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {assertSalesAccess} from '../../../utils/team-scope.js';
import {validPlanDate,ruleDue,ruleSalesAt} from '../../../../../shared/pjp-planning.mjs';
import {workingDays} from '../../../../../shared/working-calendar.mjs';
import {teamPlanningPolicy} from './planning-policy.service.js';
import {planningCalendar} from './planning-calendar.service.js';
export async function planDayStatus(date,userId,actor){
 if(!validPlanDate(date)||!userId)throw new AppError('Pilih Sales dan tanggal yang valid',400);
 await assertSalesAccess(actor,userId);
 const published=await prisma.pjp.findFirst({where:{userId,type:'SALES',date:{gte:new Date(`${date}T00:00:00+07:00`),lt:new Date(+new Date(`${date}T00:00:00+07:00`)+86400000)}},select:{id:true}});
 if(published)return {date,state:'PUBLISHED',planNames:[]};
 const sales=await prisma.user.findUnique({where:{id:userId},select:{supervisorId:true}});
 const {values}=await teamPlanningPolicy(sales?.supervisorId);
 const calendar=await planningCalendar(prisma,date,date,values);
 if(calendar.missing.length)return {date,state:'UNPUBLISHED',planNames:[],note:'Kalender Admin belum ditetapkan.'};
 const working=workingDays(values.PJP_WORKING_DAYS);
 if(!(calendar.workingDates?calendar.workingDates.includes(date):working.includes(new Date(date).getUTCDay())))return {date,state:'NON_WORKING_DAY',planNames:[]};
 const plans=await prisma.pjpPlan.findMany({where:{status:'PUBLISHED',startsOn:{lte:date},endsOn:{gte:date},...(actor.role==='SUPERVISOR'?{supervisorId:actor.id}:{})},select:{id:true,name:true,rules:true}});
 const own=plans.filter(p=>p.rules.some(r=>r.userId===userId||r.substitute?.userId===userId));
 return {date,state:own.length?(own.some(p=>p.rules.some(r=>ruleSalesAt(r,date)===userId&&ruleDue(r,date)))?'PUBLISHED':'NOT_DUE'):'UNPUBLISHED',planNames:own.map(p=>p.name)};
}
