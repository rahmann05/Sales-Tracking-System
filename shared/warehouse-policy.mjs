import {canTripAction} from './trip-permissions.mjs';
import {parseAuditItems,auditAnswers,auditFailed} from './supervision-checklist.mjs';
export const departureItems=values=>parseAuditItems(values?.TRIP_DEPARTURE_CHECKLIST||[]);
export function departureChecklist(values,raw={}){
 const items=departureItems(values),answers=auditAnswers(items,raw);
 const failures=items.filter(item=>auditFailed(item,answers[item.key])).map(item=>({key:item.key,label:item.label}));
 if(values?.TRIP_BLOCK_FAILED_DEPARTURE_CHECKLIST!==false&&failures.length)throw new Error(`Perbaiki checklist sebelum berangkat: ${failures.map(f=>f.label).join('; ')}`);
 return {items,answers,failures};
}
export const preparationStages=values=>['PICK','CHECK','LOAD'].filter(stage=>values?.[`WAREHOUSE_REQUIRE_${stage}`]!==false);
export function preparationReady(route,values=route.policySnapshot?.values){
 return preparationStages(values).every(stage=>Boolean(route.preparation?.[stage]));
}
export const warehouseStaffEligible=(person,permission)=>Boolean(person&&!person.deletedAt&&['ADMIN','KEPALA_GUDANG'].includes(person.role)&&person.permissions?.can_monitor_delivery!==false&&person.permissions?.[permission]!==false);
export function preparationOwnerProblem(person,route,stage){
 if(!warehouseStaffEligible(person,'can_manage_delivery_routes'))return 'PIC harus petugas gudang/Admin aktif dengan izin melihat dan menjalankan persiapan.';
 if(!canTripAction(person,stage))return 'PIC tidak memiliki izin untuk tahap persiapan ini.';
 if(!route.policySnapshot?.values?.WAREHOUSE_SEPARATE_CHECKER)return null;
 const pick=route.preparation?.PICK?.actorId||route.preparation?.tasks?.PICK?.ownerId;
 const checker=route.preparation?.tasks?.CHECK?.ownerId;
 if(stage==='CHECK'&&pick===person.id||stage==='PICK'&&!route.preparation?.CHECK&&checker===person.id)return 'Penyiap dan pemeriksa harus berbeda. Ganti PIC salah satu tahap terlebih dahulu.';
 return null;
}
