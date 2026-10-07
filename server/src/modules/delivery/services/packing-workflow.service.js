import { randomUUID } from 'node:crypto';
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { getDynamicConfig } from '../../config/config.service.js';
import { resolveBusinessCode, getCodePolicy } from '../../config/services/business-code.service.js';

export const packingInclude = { outlet: true, invoices: true, deliveryStops: true, createdBy: { select: { id: true, name: true } } };
const event = (action, userId, snapshot = {}) => ({ action, userId, at: new Date().toISOString(), ...snapshot });
export const packingReady = p => p.totalCartons > 0 && p.items.length > 0 && p.invoices.length > 0 && p.invoices.reduce((n, i) => n + i.totalCartons, 0) === p.totalCartons;

export async function savePacking(data, userId, id) {
  const mode = await getDynamicConfig('PACKING_SOURCE_MODE', 'MANUAL');
  const autoRelease = await getDynamicConfig('PACKING_AUTO_RELEASE', false);
  const pendingAllowed = await getDynamicConfig('PACKING_ALLOW_PENDING_ORDER', false);
  return prisma.$transaction(async tx => {
    const old = id ? await tx.packingList.findUnique({ where: { id }, include: packingInclude }) : null;
    if (id && !old) throw new AppError('Packing list tidak ditemukan', 404);
    if (old && (old.status !== 'DRAFT' || old.deliveryStops.length || old.revision !== data.revision)) throw new AppError('Dokumen berubah atau bukan draft. Muat ulang sebelum mengedit.', 409);
    const outlet = await tx.outlet.findFirst({ where: { id: data.outletId, deletedAt: null } });
    if (!outlet) throw new AppError('Toko tidak ditemukan', 404);
    if (mode === 'ORDER' && !data.sourceOrderId) throw new AppError('Mode admin mewajibkan referensi order', 400);
    let order = null;
    if (data.sourceOrderId) {
      order = await tx.order.findUnique({ where: { id: data.sourceOrderId }, include: { pjpStop: true } });
      if (!order || order.deletedAt || order.pjpStop.outletId !== data.outletId) throw new AppError('Referensi order tidak sesuai toko', 400);
      if (order.status === 'REJECTED') throw new AppError('Order ditolak tidak dapat menjadi referensi pengiriman', 400);
      if (order.status !== 'APPROVED' && (!pendingAllowed || !data.overrideReason?.trim())) throw new AppError('Referensi order pending memerlukan izin dan alasan override admin', 400);
    }
    const items = data.items.map(i => ({ ...i, lineId: i.lineId || randomUUID() }));
    if (new Set(items.map(i => i.lineId)).size !== items.length) throw new AppError('Identitas baris barang duplikat', 400);
    const invoiceRows = [];
    for (const invoice of data.invoices) invoiceRows.push({...invoice,invoiceNumber: old?.invoices.some(i=>i.invoiceNumber===invoice.invoiceNumber) ? invoice.invoiceNumber : await resolveBusinessCode('INVOICE',invoice.invoiceNumber,{db:tx})});
    if (new Set(invoiceRows.map(i=>i.invoiceNumber)).size !== invoiceRows.length) throw new AppError('Nomor faktur duplikat dalam dokumen',409);
    const ready = packingReady({ ...data, items, invoices:invoiceRows });
    const status = autoRelease && ready ? 'RELEASED' : 'DRAFT';
    const packingCode=old?.code || await resolveBusinessCode('PACKING_LIST',data.code,{db:tx});
    const history = [...(old?.history || []), event(old ? 'EDIT' : 'CREATE', userId, { before: old ? { items: old.items, totalCartons: old.totalCartons, notes: old.notes, invoices: old.invoices, sourceOrderId: old.sourceOrderId } : null, after: { ...data, items, code:packingCode, invoices:invoiceRows }, status })];
    const payload = { outletId: data.outletId, sourceOrderId: data.sourceOrderId || null, source: order ? (mode === 'MANUAL' ? 'MANUAL_REFERENCE' : 'ORDER') : 'MANUAL', items, totalCartons: data.totalCartons, totalWeight: data.totalWeight || 0, notes: data.notes, overrideReason: data.overrideReason || null, status, releasedAt: status === 'RELEASED' ? new Date() : null, history, revision: (old?.revision || 0) + 1 };
    if (old) await tx.invoice.deleteMany({ where: { packingListId: id } });
    const invoices = { create: invoiceRows.map(i => ({ ...i, outletId: data.outletId })) };
    return old ? tx.packingList.update({ where: { id }, data: { ...payload, invoices }, include: packingInclude }) : tx.packingList.create({ data: { ...payload, code: packingCode, createdById: userId, invoices }, include: packingInclude });
  }, { isolationLevel: 'Serializable' });
}

export async function transitionPacking(id, action, userId) {
  const revisionAllowed = await getDynamicConfig('PACKING_ALLOW_REVISION', true);
  if (!['RELEASE', 'RECALL'].includes(action)) throw new AppError('Aksi tidak valid', 400);
  return prisma.$transaction(async tx => {
    const pl = await tx.packingList.findUnique({ where: { id }, include: packingInclude });
    if (!pl) throw new AppError('Packing list tidak ditemukan', 404);
    if (pl.deliveryStops.length) throw new AppError('Muatan sudah dialokasikan; batalkan rute draft dahulu', 409);
    if (action === 'RELEASE' && pl.sourceOrderId) {
      const order = await tx.order.findUnique({ where: { id: pl.sourceOrderId } });
      const allowPending = await getDynamicConfig('PACKING_ALLOW_PENDING_ORDER', false);
      if (!order || order.deletedAt || order.status === 'REJECTED' || (order.status !== 'APPROVED' && (!allowPending || !pl.overrideReason?.trim()))) throw new AppError('Referensi order tidak lagi memenuhi kebijakan pelepasan', 409);
    }
    if (action === 'RELEASE' && (pl.status !== 'DRAFT' || !packingReady(pl))) throw new AppError('Lengkapi barang, karton dan faktur; total karton faktur harus sama dengan packing list', 400);
    if (action === 'RECALL' && (!revisionAllowed || pl.status !== 'RELEASED')) throw new AppError('Penarikan revisi tidak diizinkan', 409);
    return tx.packingList.update({ where: { id }, data: { status: action === 'RELEASE' ? 'RELEASED' : 'DRAFT', releasedAt: action === 'RELEASE' ? new Date() : null, revision: { increment: 1 }, history: [...pl.history, event(action, userId)] } });
  }, { isolationLevel: 'Serializable' });
}

// Called inside the order approval transaction. Quantity is never assumed to be cartons.
export async function draftFromApprovedOrder(tx, orderId, userId) {
  const mode = await getDynamicConfig('PACKING_SOURCE_MODE', 'MANUAL');
  if (mode === 'MANUAL' || !await getDynamicConfig('PACKING_AUTO_FROM_APPROVED_ORDER', false)) return;
  const order = await tx.order.findUnique({ where: { id: orderId }, include: { pjpStop: true, items: { include: { product: true } } } });
  if (order.status !== 'APPROVED') return;
  if ((await getCodePolicy('PACKING_LIST')).mode === 'MANUAL') return; // Admin supplies the code through the manual draft form.
  if (await tx.packingList.findUnique({where:{sourceOrderId:orderId}})) return;
  const items = order.items.map(i => ({ lineId: i.id, name: i.product.name, sku: i.product.sku, quantity: i.quantity, unit: 'unit' }));
  await tx.packingList.upsert({ where: { sourceOrderId: orderId }, update: {}, create: { sourceOrderId: orderId, source: 'ORDER', status: 'DRAFT', outletId: order.pjpStop.outletId, code: await resolveBusinessCode('PACKING_LIST',null,{db:tx}), createdById: userId, items, totalCartons: 0, history: [event('AUTO_DRAFT', userId, { orderId })] } });
}
