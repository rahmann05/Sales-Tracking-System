import {POLICY_ROLES,policyConflicts} from '../../../../../shared/operational-policy.mjs';
import {workflowSummary} from '../../../../../shared/policy-guidance.mjs';
import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {getPolicyProfile} from './policy-profiles.service.js';
import {effectivePolicy} from './policy-resolver.service.js';

export async function policyOptions(){
 return {supervisors:await prisma.user.findMany({where:{role:'SUPERVISOR',deletedAt:null},select:{id:true,name:true},orderBy:{name:'asc'}})};
}
export async function simulatePolicy(scope,{revision,role}){
 if(!POLICY_ROLES.includes(role))throw new AppError('Pilih role bawaan yang valid',400);
 const {profile}=await getPolicyProfile(scope);
 if(revision!==profile.revision)throw new AppError('Draf sudah berubah. Muat ulang simulasi.',409);
 const active=(profile.versions||[]).filter(v=>!v.cancelledAt&&+new Date(v.effectiveAt)<=Date.now()).sort((a,b)=>b.revision-a.revision)[0];
 const values={...active?.values,...profile.draft};for(const [key,value] of Object.entries(values))if(value===null)delete values[key];
 const candidate={...profile,versions:[{revision:profile.revision,values,effectiveAt:new Date().toISOString()}]};
 const actor={role,...(scope.startsWith('TEAM:')?role==='SUPERVISOR'?{id:scope.slice(5)}:{supervisorId:scope.slice(5)}:{})};
 const policy=await effectivePolicy(actor,Date.now(),{override:{scope,profile:candidate}});
 return {role,scope,revision,...workflowSummary(policy.values,role),conflicts:policyConflicts(policy.values),note:'Simulasi aturan dan alur; tidak membuat transaksi atau mengubah izin akun. Izin role dan cakupan tim tetap membatasi tindakan.'};
}
