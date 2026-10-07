import { ensure as baseEnsure, seedId as baseSeedId, at, offsetDate } from './context.js';
import { wibDayRange } from '../../../shared/visit-metrics.mjs';

export async function seedSales(db, master, dateKey, namespace='') {
  const seedId=key=>baseSeedId(namespace+key);
  const ensure=(client,model,key,data)=>baseEnsure(client,model,namespace+key,data);
  const { sales, supervisors, outlets, products, admin, division, clusters } = master;
  const plans = [];
  for (let i=0;i<sales.length;i++) {
    const member=sales[i];
    for (let day=1;day<=6;day++) for (const weekType of ['WEEK_1','WEEK_2']) {
      await db.pjpTemplate.upsert({where:{userId_dayOfWeek_weekType:{userId:member.id,dayOfWeek:day,weekType}},update:{},create:{id:seedId(`template-${i}-${day}-${weekType}`),userId:member.id,dayOfWeek:day,weekType,stops:{create:outlets[i].slice(0,10).map((outlet,j)=>({id:seedId(`template-stop-${i}-${day}-${weekType}-${j}`),outletId:outlet.id,sequence:j+1}))}}});
    }
    for (const offset of Array.from({length:14},(_,day)=>-day)) {
      const day=offsetDate(dateKey,offset);
      const existing=await db.pjp.findFirst({where:{userId:member.id,date:wibDayRange(at(day)),type:'SALES'},include:{stops:{orderBy:{sequence:'asc'}}}});
      const key=`pjp-${i}-${day}`;
      const plan=existing || await db.pjp.create({data:{id:seedId(key),userId:member.id,date:at(day,'00:00'),type:'SALES',status:offset?'COMPLETED':'IN_PROGRESS',stops:{create:outlets[i].slice(0,10).map((outlet,j)=>({id:seedId(`${key}-stop-${j}`),outletId:outlet.id,sequence:j+1,status:offset?'VISITED':j<3||j===4||j===5?'VISITED':j===6?'CLOSED_REPORTED':j===7?'SKIPPED':'PENDING'}))}},include:{stops:{orderBy:{sequence:'asc'}}}});
      if (offset===0) plans.push(plan);
      // If generated or changed by the application, keep the plan and every historical record intact.
      if (plan.id !== seedId(key)) continue;
      for (let j=0;j<plan.stops.length;j++) {
        const stop=plan.stops[j],outlet=outlets[i].find(row=>row.id===stop.outletId);
        if (!outlet) continue;
        const completed=offset!==0||j<3||j===4||j===5;
        if (completed || j===3) {
          const hour=8+Math.floor(j/2),minute=j%2?30:0;
          const stamp=at(day,`${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`);
          const base={pjpStopId:stop.id,userId:member.id,latitude:outlet.latitude+(j===2?.002:0),longitude:outlet.longitude,deviationMeters:j===2?222:0,notes:'Kunjungan simulasi demo',createdAt:stamp};
          await db.attendance.upsert({where:{pjpStopId_userId_type:{pjpStopId:stop.id,userId:member.id,type:'IN'}},update:{},create:{id:seedId(`${key}-in-${j}`),...base,type:'IN',timestamp:stamp}});
          if (completed) await db.attendance.upsert({where:{pjpStopId_userId_type:{pjpStopId:stop.id,userId:member.id,type:'OUT'}},update:{},create:{id:seedId(`${key}-out-${j}`),...base,type:'OUT',timestamp:new Date(stamp.getTime()+(j===1?2:10)*60000),durationMinutes:j===1?2:10,...(j===4||j===5?{orderAmount:150000,skuSold:1,salesProducts:[{id:products[0].id,sku:products[0].sku,name:products[0].name}],manualSalesMode:'REQUIRE_APPROVAL',manualSalesStatus:j===4?'PENDING':'APPROVED',isManualSalesApproved:j===5,manualSalesReviewedBy:j===5?member.supervisorId:null,manualSalesReviewedAt:j===5?stamp:null,manualSalesReviewNote:j===5?'Persetujuan hasil manual simulasi':null}:{})}});
        }
        if (j<3) {
          const status=['APPROVED','PENDING_APPROVAL','REJECTED'][j];
          const subtotal=products[j].price*2;
          await ensure(db,'order',`${key}-order-${j}`,{pjpStopId:stop.id,createdBy:member.id,status,totalValue:subtotal,createdAt:at(day,'09:00'),paymentType:j===1?'TOP':'CASH',termOfPaymentDays:j===1?14:0,approvedBy:status==='APPROVED'?member.supervisorId:null,approvedAt:status==='APPROVED'?at(day,'09:15'):null,rejectionReason:status==='REJECTED'?'Contoh order ditolak: jumlah perlu dikoreksi':null,items:{create:[{id:seedId(`${key}-item-${j}`),productId:products[j].id,quantity:2,unitPrice:products[j].price,subtotal}]}});
        }
      }
      if (!offset) for (const [j,status] of [[6,'PENDING_APPROVAL'],[7,'APPROVED']]) {
        await ensure(db,'routeChangeRequest',`${key}-incident-${j}`,{pjpId:plan.id,pjpStopId:plan.stops[j].id,type:'SKIP',reportedBy:member.id,reason:'Data demo: toko tutup saat kunjungan',status,...(status==='APPROVED'?{handledBy:member.supervisorId,approvedBy:member.supervisorId}:{})});
      }
    }
    const extraOutlet=outlets[i][10] || outlets[i][9];
    for (const status of ['PENDING','APPROVED','REJECTED']) await ensure(db,'offPjpAttendance',`off-${i}-${dateKey}-${status}`,{userId:member.id,outletId:extraOutlet.id,outletName:extraOutlet.name,address:extraOutlet.address,latitude:extraOutlet.latitude,longitude:extraOutlet.longitude,reason:'Contoh kunjungan tambahan di luar rencana',status,createdAt:at(dateKey,'10:00'),validatedBy:status==='PENDING'?null:member.supervisorId,validatedAt:status==='PENDING'?null:at(dateKey,'10:15'),rejectionNote:status==='REJECTED'?'Bukti kunjungan demo belum memadai':null,...(status==='APPROVED'?{manualSalesMode:'REQUIRE_APPROVAL',manualSalesStatus:'PENDING',orderAmount:80000,skuSold:1,salesProducts:[{id:products[1].id,sku:products[1].sku,name:products[1].name}]}:{})});
    for (const status of ['PENDING_APPROVAL','APPROVED','REJECTED']) await ensure(db,'outletUnlockRequest',`unlock-${i}-${dateKey}-${status}`,{outletId:outlets[i][8].id,requestedBy:member.id,reason:'Simulasi pengecualian absensi untuk penagihan',status,handledBy:status==='PENDING_APPROVAL'?null:admin.id,handledAt:status==='PENDING_APPROVAL'?null:at(dateKey,'08:00'),expiresAt:status==='APPROVED'?at(dateKey,'10:00'):null});
  }
  for (const [i,status] of ['DRAFT','SUBMITTED','SPV_APPROVED','REGISTERED_ACTIVE','REJECTED'].entries()) await ensure(db,'customerRegistration',`registration-${status}`,{name:`Calon Outlet ${status} (Demo)`,address:'Alamat simulasi Jl. Distribusi Baru, Bandung Raya',ownerName:'Pemilik demo',divisionId:division.id,divisionName:division.name,channel:outlets[0][0].type,latitude:outlets[0][0].latitude,longitude:outlets[0][0].longitude,area:'Bandung Raya',city:'Cimahi',salesmanId:sales[0].id,salesmanName:sales[0].name,clusterId:clusters[0].id,registrationStatus:status,...(['SPV_APPROVED','REGISTERED_ACTIVE'].includes(status)?{spvId:supervisors[0].id,spvName:supervisors[0].name,spvApprovedAt:at(dateKey)}:{}),...(status==='REGISTERED_ACTIVE'?{adminId:admin.id,adminName:admin.name,adminRegisteredAt:at(dateKey),customerCode:outlets[0][9].outletCode}:{}),...(status==='REJECTED'?{rejectionNote:'Contoh penolakan: dokumen belum lengkap'}:{}),phone:`0800000000${i}`});
  return plans;
}
