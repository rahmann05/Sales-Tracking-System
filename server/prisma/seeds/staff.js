import { ensure as baseEnsure, seedId as baseSeedId, at } from './context.js';
export async function seedStaff(db, master, plans, dateKey, namespace='') {
  const seedId=key=>baseSeedId(namespace+key);
  const ensure=(client,model,key,data)=>baseEnsure(client,model,namespace+key,data);
  const {admin,warehouse,supervisors,sales,drivers}=master;
  for (const user of [admin,warehouse,...supervisors,...sales,...drivers]) {
    await db.staffActivity.upsert({where:{userId_dateKey_activityKey:{userId:user.id,dateKey,activityKey:'SHIFT'}},update:{},create:{userId:user.id,dateKey,activityKey:'SHIFT',kind:'SHIFT',checkInAt:at(dateKey),notes:'Shift simulasi demo'}});
  }
  for (let i=0;i<supervisors.length;i++) {
    const supervisor=supervisors[i], member=sales.find(s=>s.supervisorId===supervisor.id), plan=plans.find(plan=>plan.userId===member?.id);
    if (!plan?.stops.length) continue;
    const stop=plan.stops[0];
    await db.staffActivity.upsert({where:{userId_dateKey_activityKey:{userId:supervisor.id,dateKey,activityKey:stop.id}},update:{},create:{id:seedId(`audit-${i}-${dateKey}`),userId:supervisor.id,dateKey,activityKey:stop.id,kind:'VISIT',visitMode:'AUDIT',outletName:master.outlets[sales.indexOf(member)][0].name,checkInAt:at(dateKey,'09:00'),checkOutAt:at(dateKey,'09:20'),notes:'Audit simulasi kelengkapan display',checklist:{display:true,stock:true,price:true},followUp:{ownerId:member.id,dueDate:dateKey,note:'Contoh: lengkapi catatan ketersediaan produk',status:i===0?'OPEN':'DONE',createdBy:supervisor.id,...(i?{completedBy:member.id,completedAt:at(dateKey,'10:00').toISOString(),completionNote:'Catatan stok demo sudah dilengkapi'}:{}),history:[{action:'ASSIGNED',actorId:supervisor.id,at:at(dateKey,'09:20').toISOString()},...(i?[{action:'COMPLETED',actorId:member.id,at:at(dateKey,'10:00').toISOString(),note:'Catatan stok demo sudah dilengkapi'}]:[])]}}});
    await ensure(db,'notification',`audit-notification-${i}-${dateKey}`,{userId:member.id,type:'AUDIT_FOLLOW_UP',title:'Tindak lanjut audit (Demo)',message:'Lengkapi catatan ketersediaan produk pada outlet.',payload:{source:'DEMO',ownerId:member.id}});
  }
}
