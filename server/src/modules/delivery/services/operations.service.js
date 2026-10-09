import {policyNotification} from '../../notifications/services/notification-policy.service.js';
import {preparationStages,preparationReady} from '../../../../../shared/warehouse-policy.mjs';
import {processValue} from '../../config/services/process-policy.service.js';
import {effectivePolicy} from '../../config/services/policy-resolver.service.js';
import {DRIVER_EVIDENCE_KEYS} from '../../../../../shared/operational-policy.mjs';
import {getDynamicConfig} from '../../config/config.service.js';
import {orderSnapshot} from '../../../../../shared/order-snapshot.mjs';
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { assertResources } from './resource-policy.service.js';
import { terminalStop, routeLocation, fulfillment, routeProgress } from '../../../../../shared/delivery-operations.mjs';
import { packingBalance } from '../../../../../shared/packing.mjs';
import {invoiceReconciliation} from '../../../../../shared/invoice-reconciliation.mjs';
import { wibDayRange, wibDateKey } from '../../../../../shared/visit-metrics.mjs';

export const operationsInclude = { vehicle: true, driver: { select: { id: true, name: true } }, position: true, stops: { orderBy: { sequence: 'asc' }, include: { outlet: true, attendances: { orderBy: { timestamp: 'asc' } }, packingList: { include: { invoices: true } } } } };
const fail = message => { throw new AppError(message, 409); };
export const routeEvent = (route, action, actor, detail) => [...(route.history || []), { action, actorId: actor.id, actorName: actor.name, at: new Date().toISOString(), detail }];

export async function routeAction(id, data, user, attempt=0) {
  return prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`route:${id}`}))`;
    const r = await tx.deliveryRoute.findUnique({ where: { id }, include: operationsInclude });
    if (!r) throw new AppError('Rute tidak ditemukan', 404);
    if (user.role === 'SUPIR' && (r.driverId !== user.id || !['START', 'RETURN'].includes(data.action))) throw new AppError('Aksi bukan tugas Anda', 403);
    if (r.closedAt || r.cancelledAt) fail('Trip sudah ditutup/dibatalkan');
    const { action, note } = data;
    const stages=preparationStages(r.policySnapshot?.values),odometerRequired=await processValue(r,'TRIP_REQUIRE_ODOMETER',true);
    if (!note?.trim()) throw new AppError('Catatan tindakan wajib', 400);
    let change = {};
    if (['PICK', 'CHECK', 'LOAD'].includes(action)) {
      if (r.status !== 'DRAFT' || r.onHold) fail('Persiapan hanya untuk draft yang tidak ditahan');
      if(!stages.includes(action))fail('Tahap ini tidak diwajibkan dalam aturan trip');
      const previous=stages[stages.indexOf(action)-1];
      if(action==='CHECK'&&await processValue(r,'WAREHOUSE_SEPARATE_CHECKER',false)&&r.preparation?.PICK?.actorId===user.id)fail('Pemeriksa harus berbeda dari penyiap');
      if (previous && !r.preparation?.[previous]) fail('Selesaikan tahap sebelumnya dahulu');
      if (r.preparation?.[action]) fail('Tahap sudah dikonfirmasi');
      const task=r.preparation?.tasks?.[action];
      if(task&&task.ownerId!==user.id&&user.role!=='ADMIN')throw new AppError('Tahap ini ditugaskan kepada petugas lain; ubah penugasan terlebih dahulu',403);
      if (data.cartons !== r.totalCartons) fail('Jumlah aktual berbeda dari muatan. Catat masalah dan revisi alokasi sebelum konfirmasi');
      const required = r.stops.flatMap(s => s.allocatedItems.map(i => ({ key: `${s.id}:${i.lineId}`, quantity: i.quantity })));
      if (required.some(i => data.quantities?.[i.key] !== i.quantity) || Object.keys(data.quantities || {}).length !== required.length) fail('Konfirmasi jumlah aktual setiap barang sesuai muatan');
      change.preparation = { ...r.preparation, [action]: { actorId: user.id, actorName: user.name, at: new Date().toISOString(), cartons: data.cartons, quantities: data.quantities, note } };
      if (action === stages.at(-1)) { await assertResources(tx, r); change.status = 'READY'; }
    } else if(action==='ASSIGN_PREPARATION'){
      if(r.status!=='DRAFT'||r.preparation?.[data.stage])fail('Penugasan hanya untuk tahap draft yang belum selesai');
      if(!stages.includes(data.stage)||!data.ownerId||!data.dueAt)throw new AppError('Tahap, PIC dan tenggat wajib',400);
      const owner=await tx.user.findFirst({where:{id:data.ownerId,deletedAt:null,role:{in:['ADMIN','KEPALA_GUDANG']}}});
      if(!owner)throw new AppError('Petugas gudang tidak aktif',400);
      change.preparation={...r.preparation,tasks:{...r.preparation?.tasks,[data.stage]:{ownerId:owner.id,ownerName:owner.name,dueAt:data.dueAt,assignedAt:new Date().toISOString(),assignedBy:user.id,note}}};
      await policyNotification(tx,{data:{userId:owner.id,type:'DELIVERY_PREPARATION',title:`Tugas persiapan ${r.code}`,message:note,payload:{routeId:id,stage:data.stage,dueAt:data.dueAt}}});
    } else if (action === 'START') {
      if (r.status !== 'READY' || !preparationReady(r) || r.onHold) fail('Loading harus selesai dan trip tidak ditahan');
      const vehicle = await assertResources(tx, r);
      if (odometerRequired&&(!Number.isFinite(data.odometer) || data.odometer < vehicle.totalKm) || data.odometer!=null&&(!Number.isFinite(data.odometer)||data.odometer<vehicle.totalKm)) fail('Odometer awal harus minimal kilometer kendaraan saat ini');
      change = { status: 'IN_TRANSIT', departedAt: new Date(), odometerStart: data.odometer??null };
    } else if (action === 'RETURN') {
      if (!r.stops.length || !r.stops.every(s => terminalStop(s.status))) fail('Selesaikan hasil semua toko sebelum kembali gudang');
      if (r.returnedAt) fail('Kembali gudang sudah tercatat');
      if ((odometerRequired||data.odometer!=null)&&(!Number.isFinite(r.odometerStart) || !Number.isFinite(data.odometer) || data.odometer < r.odometerStart)) fail('Odometer akhir/awal belum valid; gunakan rekonsiliasi trip lama bila diperlukan');
      change = { returnedAt: new Date(), odometerEnd: data.odometer??null, actualDistanceKm: data.odometer!=null&&r.odometerStart!=null?data.odometer-r.odometerStart:null, actualFuelLiters: data.fuelLiters ?? null };
    } else if (action === 'LEGACY_ODOMETER') {
      if (r.odometerStart != null || r.departedAt || !['IN_TRANSIT', 'COMPLETED', 'PARTIAL'].includes(r.status)) fail('Koreksi ini hanya untuk trip lama tanpa odometer awal');
      if (!Number.isFinite(data.odometer)) fail('Isi odometer awal aktual trip lama');
      change = { odometerStart: data.odometer??null };
    } else if (action === 'CLOSE') {
      if (!r.returnedAt || !r.stops.every(s => terminalStop(s.status))) fail('Catat kembali gudang dan selesaikan semua toko');
      if (await processValue(r,'TRIP_REQUIRE_RETURN_INSPECTION',true)&&r.stops.some(s => s.rejectedCartons > 0 && !s.returnInspection)) fail('Selesaikan pemeriksaan retur terlebih dahulu');
      if (await processValue(r,'TRIP_BLOCK_OPEN_ISSUES',true)&&await tx.deliveryIssue.count({ where: { routeId: id, status: 'OPEN' } })) fail('Masih ada masalah trip yang belum diselesaikan');
      if (await processValue(r,'TRIP_REQUIRE_DOCUMENT_RETURN',true)&&!data.documentsReturned) fail('Konfirmasi dokumen pengiriman telah direkonsiliasi');
      change = { closedAt: new Date(), documentsReturned: data.documentsReturned===true, onHold: false, odometerPostedAt: new Date() };
      // Actual odometer is authoritative; never add planned distance to vehicle mileage.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`vehicle:${r.vehicleId}`}))`;
      const v = await tx.vehicle.findUnique({ where: { id: r.vehicleId } });
      if(Number.isFinite(r.odometerEnd))await tx.vehicle.update({ where: { id: r.vehicleId }, data: { totalKm: Math.max(v.totalKm, r.odometerEnd) } });
    } else if (action === 'HOLD') {
      change = { onHold: true };
    } else if (action === 'RESUME') {
      await assertResources(tx, r); change = { onHold: false };
    } else if (action === 'RESCHEDULE') {
      if (!['DRAFT','READY'].includes(r.status) || r.departedAt || r.stops.some(s => s.arrivedAt || terminalStop(s.status))) fail('Trip yang sudah berjalan tidak dapat dijadwal ulang');
      const candidate = { ...r, vehicleId: data.vehicleId || r.vehicleId, driverId: data.driverId || r.driverId, plannedStartAt: data.plannedStartAt, plannedEndAt: data.plannedEndAt };
      if (!data.plannedStartAt || !data.plannedEndAt) fail('Isi jadwal berangkat dan akhir');
      const vehicle = await assertResources(tx, candidate);
      if (r.totalCartons > vehicle.maxCartons || (vehicle.maxWeightKg && r.totalWeight > vehicle.maxWeightKg)) fail('Muatan melebihi kapasitas kendaraan pengganti');
      change = { driverId: candidate.driverId, vehicleId: candidate.vehicleId, date: new Date(data.plannedStartAt), plannedStartAt: new Date(data.plannedStartAt), plannedEndAt: new Date(data.plannedEndAt), preparation: {}, status:stages.length?'DRAFT':'READY' };
      if(candidate.driverId!==r.driverId&&r.policySnapshot){
        const driver=await tx.user.findUnique({where:{id:candidate.driverId},select:{id:true,role:true,supervisorId:true}}),policy=await effectivePolicy(driver);
        change.policySnapshot={...r.policySnapshot,values:{...r.policySnapshot.values,...Object.fromEntries(DRIVER_EVIDENCE_KEYS.map(key=>[key,policy.values[key]]))},driver:{id:driver.id,versions:policy.versions,at:policy.at}};
      }
    } else if (action === 'CANCEL') {
      if (!['DRAFT','READY'].includes(r.status) || r.departedAt || r.stops.some(s => s.arrivedAt || terminalStop(s.status))) fail('Trip sudah berjalan; selesaikan melalui hasil toko dan rekonsiliasi');
      await tx.deliveryStop.deleteMany({ where: { deliveryRouteId: id } });
      change = { cancelledAt: new Date(), onHold: false };
    } else throw new AppError('Aksi tidak dikenal', 400);
    return tx.deliveryRoute.update({ where: { id }, data: { ...change, history: routeEvent(r, action, user, { ...data, ...(action === 'CANCEL' ? { stops: r.stops.map(s=>({id:s.id,packingListId:s.packingListId,allocatedCartons:s.allocatedCartons,allocatedItems:s.allocatedItems,allocatedInvoices:s.allocatedInvoices})) } : {}) }) }, include: operationsInclude });
  }, { isolationLevel: 'Serializable' }).catch(error=>{
    if(error.code==='P2034'&&attempt<2)return routeAction(id,data,user,attempt+1);
    throw error;
  });
}

export async function operationsDashboard(date) {
  if(date && (!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(+new Date(date))))throw new AppError('Tanggal pemantauan tidak valid',400);
  const [routes, packings, orders, issues, people] = await Promise.all([
    prisma.deliveryRoute.findMany({ where: { OR: [{ closedAt: null, cancelledAt: null }, { date: wibDayRange(date || new Date()) }] }, include: operationsInclude, orderBy: { date: 'asc' } }),
    prisma.packingList.findMany({ include: { outlet: true, invoices: true, deliveryStops: true }, orderBy: { createdAt: 'asc' } }),
    prisma.order.findMany({ where: { deletedAt: null, status: { in: ['APPROVED', 'PENDING_APPROVAL'] } }, include: { items: { include: { product: true } }, pjpStop: { include: { outlet: true } }, createdByUser: { select: { name: true } } }, orderBy: { createdAt: 'asc' } }),
    prisma.deliveryIssue.findMany({ where: { status: 'OPEN' }, orderBy: { dueAt: 'asc' } }),
    prisma.user.findMany({ where: { deletedAt: null, role: { in: ['ADMIN', 'KEPALA_GUDANG', 'SUPIR'] } }, select: { id: true, name: true, role: true } }),
  ]);
  const enriched = orders.map(o => fulfillment(orderSnapshot(o), packings));
  const backlog = enriched.filter(o => !['FULFILLED','CLOSED_WITH_CANCELLATION'].includes(o.fulfillmentStatus));
  const documents=packings.map(p=>({...packingBalance(p),commercial:invoiceReconciliation(p)}));
  const packingQueue = documents.filter(p => p.status === 'DRAFT' || p.remainingCartons > 0);
  const commercialQueue=documents.filter(p=>p.status==='RELEASED'&&!['RECONCILED','IN_PROGRESS'].includes(p.commercial.status));
  const now = Date.now(),policies=new Map();
  for(const driverId of new Set(routes.map(r=>r.driverId))){const actor=await prisma.user.findUnique({where:{id:driverId},select:{id:true,role:true,supervisorId:true}});const values=(await effectivePolicy(actor||{role:'SUPIR'})).values;policies.set(driverId,{liveSeconds:values.DRIVER_TRACKING_LIVE_SECONDS,enabled:values.DRIVER_TRACKING_MODE!=='OFF'});}
  return { generatedAt: new Date().toISOString(), date: wibDateKey(date || new Date()), people, issues, orders: backlog, packings: packingQueue,commercialQueue,
    routes: routes.map(r => ({ ...r, locationPolicy:policies.get(r.driverId),location: routeLocation(r,now,policies.get(r.driverId)), progress: routeProgress(r), alerts: [
      !r.cancelledAt && !r.closedAt && !r.departedAt && r.plannedStartAt && +new Date(r.plannedStartAt) < now ? 'Lewat jadwal berangkat' : null,
      !r.closedAt && !r.cancelledAt && r.plannedEndAt && +new Date(r.plannedEndAt) < now ? 'Lewat target selesai' : null,
      r.onHold ? 'Trip ditahan' : null,
      ...Object.entries(r.preparation?.tasks||{}).filter(([stage,task])=>!r.preparation?.[stage]&&+new Date(task.dueAt)<now&&!r.cancelledAt&&!r.closedAt).map(([stage,task])=>`${{PICK:'Penyiapan',CHECK:'Pemeriksaan',LOAD:'Loading'}[stage]} terlambat · ${task.ownerName}`),
      r.stops.some(s => s.rejectedCartons > 0 && !s.returnInspection) ? 'Retur belum diperiksa' : null,
    ].filter(Boolean) })) };
}

export const createIssue = (data, user) => prisma.$transaction(async tx => {
  if (!await tx.user.findFirst({ where: { id: data.ownerId, deletedAt: null, role: { in: ['ADMIN', 'KEPALA_GUDANG', 'SUPIR'] } } })) throw new AppError('PIC tidak aktif', 400);
  for (const [field, model] of [['routeId', 'deliveryRoute'], ['packingListId', 'packingList'], ['orderId', 'order']]) if (data[field] && !await tx[model].findUnique({ where: { id: data[field] } })) throw new AppError('Referensi masalah tidak ditemukan', 404);
  if(data.routeId){const route=await tx.deliveryRoute.findUnique({where:{id:data.routeId}});if(route.closedAt||route.cancelledAt)fail('Trip sudah ditutup/dibatalkan');}
  const issue = await tx.deliveryIssue.create({ data: { ...data, dueAt: new Date(data.dueAt||Date.now()+(await getDynamicConfig('DELIVERY_ISSUE_DEFAULT_HOURS',24))*3600000), createdById: user.id, history: [{ action: 'CREATE', actorId: user.id, at: new Date().toISOString() }] } });
  await policyNotification(tx,{data:{userId:data.ownerId,type:'DELIVERY_FOLLOW_UP',title:data.title,message:data.reason,payload:{issueId:issue.id,routeId:data.routeId||null,dueAt:data.dueAt}}});
  return issue;
});

export const resolveIssue = (id, resolution, user) => prisma.$transaction(async tx => {
  const issue = await tx.deliveryIssue.findUnique({ where: { id } });
  if (!issue || issue.status !== 'OPEN') fail('Masalah tidak ditemukan atau sudah selesai');
  if(user.role==='SUPIR' && issue.ownerId!==user.id)throw new AppError('Tindak lanjut bukan tugas Anda',403);
  const changed = await tx.deliveryIssue.updateMany({ where: { id, status: 'OPEN' }, data: { status: 'DONE', resolution, resolvedAt: new Date(), history: [...issue.history, { action: 'RESOLVE', actorId: user.id, at: new Date().toISOString(), resolution }] } });
  if (!changed.count) fail('Masalah telah diproses');
  return { id, status: 'DONE' };
}, { isolationLevel: 'Serializable' });
