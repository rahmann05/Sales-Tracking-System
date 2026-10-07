import bcrypt from 'bcryptjs';
import {wibDayRange} from '../../../shared/visit-metrics.mjs';
import {ensure, seedId, at} from './context.js';

// Extra fixtures use their own keys; existing assignments and operational records are preserved.
export async function seedCoverage(db, master, dateKey) {
  const cohorts=[];
  const password=await bcrypt.hash(process.env.SEED_PASSWORD || 'DemoSinar2026!',10);
  const legacy=await db.user.findFirst({where:{email:'spv@sinaranugrah.com',role:'SUPERVISOR',deletedAt:null}});
  const specs=[['modern',master.supervisors[1],['MODERN_TRADE']],...(legacy?[['legacy-team',legacy,['GENERAL_TRADE','MODERN_TRADE']]]:[])];
  for(const [key,supervisor,types] of specs){
    const cohort={...master,supervisors:[supervisor],sales:[],clusters:[],outlets:[],namespace:`coverage-${key}:`};
    for(const [index,type] of types.entries()){
      const code=`coverage-${key}-${index}`;
      const member=await db.user.upsert({where:{email:`${code}.demo@sinaranugrah.test`},update:{},create:{id:seedId(code),name:`Sales ${type==='MODERN_TRADE'?'MT':'GT'} ${supervisor.name} (Demo)`,email:`${code}.demo@sinaranugrah.test`,password,role:'SALES',roleCode:'SALES',supervisorId:supervisor.id}});
      // Respect a demo account moved to another team by the user.
      if(member.deletedAt || member.supervisorId!==supervisor.id)continue;
      const cluster=await ensure(db,'cluster',`${code}-cluster`,{name:`Kluster ${type==='MODERN_TRADE'?'MT':'GT'} ${supervisor.name} (Demo)`,region:'Bandung Raya · Data contoh',supervisorId:supervisor.id,assignedSalesId:member.id,centerLat:-6.9-index*.02,centerLng:107.56+index*.02,colorHex:'#2563eb',outletCount:11});
      await db.user.updateMany({where:{id:member.id,clusterId:null},data:{clusterId:cluster.id}});
      const group=[];
      for(let j=0;j<11;j++)group.push(await ensure(db,'outlet',`${code}-outlet-${j}`,{name:`${type==='MODERN_TRADE'?'Minimarket':'Toko'} ${key} ${index+1}-${j+1} (Demo)`,outletCode:`DEMO-${code}-${j}`,type,channel:type,clusterId:cluster.id,address:'Alamat simulasi Bandung Raya',ownerName:'Pemilik demo',latitude:cluster.centerLat+j*.001,longitude:cluster.centerLng+j*.001,validationStatus:'UNVALIDATED',validationDetails:{source:'DEMO_SIMULATION'},paymentType:'CASH',visitSchedule:{days:[1,2,3,4,5,6],weekType:'ALL'}}));
      await ensure(db,'clusterRoute',`${code}-route`,{clusterId:cluster.id,routeIndex:1,isActive:true,outletOrder:group.slice(0,10).map(o=>o.id),startOutletId:group[0].id,totalDistanceKm:12});
      cohort.sales.push(member);cohort.clusters.push(cluster);cohort.outlets.push(group);
    }
    if(cohort.sales.length)cohorts.push(cohort);
  }
  // A genuine extra-call outlet is outside the ten planned stops.
  for(const [i,group] of master.outlets.entries()){
    const cluster=master.clusters[i];
    const extra=await ensure(db,'outlet',`extra-call-outlet-${i}`,{name:`Outlet kunjungan tambahan ${i+1} (Demo)`,outletCode:`DEMO-EXTRA-${i}`,address:'Alamat simulasi kunjungan tambahan, Bandung Raya',clusterId:cluster.id,type:group[0].type,channel:group[0].type,latitude:cluster.centerLat+.012,longitude:cluster.centerLng+.012,validationStatus:'UNVALIDATED',validationDetails:{source:'DEMO_SIMULATION'}});
    group.push(extra);
    const count=await db.outlet.count({where:{clusterId:cluster.id,deletedAt:null}});
    await db.cluster.updateMany({where:{id:cluster.id,outletCount:{not:count}},data:{outletCount:count}});
  }
  // Existing built-in sales can inspect real weekly templates without transferring their outlets.
  if(legacy){
    const members=await db.user.findMany({where:{supervisorId:legacy.id,email:{in:['sales@sinaranugrah.com','siti@sinaranugrah.com','agus@sinaranugrah.com','dedi@sinaranugrah.com','rina@sinaranugrah.com']},role:'SALES',deletedAt:null}});
    for(const member of members){
      let outlets=await db.outlet.findMany({where:{deletedAt:null,cluster:{deletedAt:null,supervisorId:legacy.id,OR:[{id:member.clusterId || ''},{assignedSalesId:member.id}]}},orderBy:{id:'asc'},take:10});
      if(!outlets.length){
        const cluster=await ensure(db,'cluster',`recovery-${member.id}`,{name:`Wilayah ${member.name} (Demo)`,region:'Bandung Raya · Data contoh',supervisorId:legacy.id,assignedSalesId:member.id,centerLat:-6.91,centerLng:107.55,outletCount:10});
        for(let j=0;j<10;j++)outlets.push(await ensure(db,'outlet',`recovery-${member.id}-${j}`,{name:`Toko ${member.name} ${j+1} (Demo)`,outletCode:`DEMO-RECOVERY-${member.id}-${j}`,address:'Alamat simulasi Cimahi',clusterId:cluster.id,type:'GENERAL_TRADE',channel:'GENERAL_TRADE',latitude:-6.91+j*.001,longitude:107.55+j*.001}));
        const primary=member.clusterId?await db.cluster.findUnique({where:{id:member.clusterId},select:{deletedAt:true}}):null;
        if(!primary || primary.deletedAt)await db.user.updateMany({where:{id:member.id,clusterId:member.clusterId},data:{clusterId:cluster.id}});
      }
      for(let day=1;day<=6;day++)for(const weekType of ['WEEK_1','WEEK_2'])await db.pjpTemplate.upsert({where:{userId_dayOfWeek_weekType:{userId:member.id,dayOfWeek:day,weekType}},update:{},create:{id:seedId(`legacy-template-${member.id}-${day}-${weekType}`),userId:member.id,dayOfWeek:day,weekType,stops:{create:outlets.map((outlet,j)=>({id:seedId(`legacy-stop-${member.id}-${day}-${weekType}-${j}`),outletId:outlet.id,sequence:j+1}))}}});
      const plan=await db.pjp.findFirst({where:{userId:member.id,date:wibDayRange(at(dateKey)),type:'SALES'},include:{stops:true}});
      if(!plan)await db.pjp.create({data:{id:seedId(`legacy-plan-${member.id}-${dateKey}`),userId:member.id,date:at(dateKey,'00:00'),type:'SALES',status:'SCHEDULED',stops:{create:outlets.map((o,j)=>({outletId:o.id,sequence:j+1,status:'PENDING'}))}}});
      else if(!plan.stops.length)await db.pjpStop.createMany({data:outlets.map((o,j)=>({id:seedId(`legacy-plan-stop-${plan.id}-${j}`),pjpId:plan.id,outletId:o.id,sequence:j+1,status:'PENDING'}))});
    }
  }
  return cohorts;
}
