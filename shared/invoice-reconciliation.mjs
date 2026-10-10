import {orderPricing} from './order-pricing.mjs';
import {acceptedQuantity,terminalStop} from './delivery-operations.mjs';

export function invoiceMappingErrors(packing){
  const errors=[],counts=new Map();
  for(const invoice of packing.invoices||[]){
    const seen=new Set();
    for(const line of invoice.items||[]){
      const source=(packing.items||[]).find(i=>i.lineId===line.lineId);
      if(!source||seen.has(line.lineId)||!Number.isInteger(line.quantity)||line.quantity<=0)errors.push('Baris faktur tidak valid atau duplikat');
      seen.add(line.lineId);counts.set(line.lineId,(counts.get(line.lineId)||0)+line.quantity);
    }
  }
  for(const item of packing.items||[])if((counts.get(item.lineId)||0)!==item.quantity)errors.push(`Jumlah faktur untuk ${item.name} belum sama dengan packing`);
  return errors;
}
export function reconciliationFingerprint(packing){
  return JSON.stringify({revision:packing.revision,items:packing.items,invoices:(packing.invoices||[]).map(i=>({id:i.id,items:i.items,totalAmount:i.totalAmount,taxIncluded:i.taxIncluded,taxRatePercent:i.taxRatePercent,taxRoundingMode:i.taxRoundingMode||'NEAREST'})).sort((a,b)=>String(a.id||'').localeCompare(String(b.id||''))),stops:(packing.deliveryStops||[]).map(s=>({id:s.id,status:s.status,allocatedItems:s.allocatedItems,rejectedItems:s.rejectedItems,returnInspection:s.returnInspection,reusableItems:s.reusableItems})).sort((a,b)=>String(a.id||'').localeCompare(String(b.id||'')))});
}
export function invoiceReconciliation(packing){
  const errors=invoiceMappingErrors(packing),stops=packing.deliveryStops||[];
  const accepted=Object.fromEntries((packing.items||[]).map(i=>[i.lineId,stops.reduce((n,s)=>n+acceptedQuantity(s,i.lineId),0)]));
  const receiptMismatch=(packing.items||[]).some(i=>accepted[i.lineId]>i.quantity);
  if(receiptMismatch)errors.push('Hasil diterima melebihi jumlah barang packing; periksa bukti pengiriman');
  const resolved=stops.length>0&&stops.every(s=>terminalStop(s.status)&&(!(s.rejectedCartons>0)||!!s.returnInspection));
  const fingerprint=reconciliationFingerprint(packing),saved=packing.commercialReconciliation;
  const fresh=!!saved&&saved.fingerprint===fingerprint;
  const unique=(packing.items||[]).every(i=>(packing.invoices||[]).filter(v=>(v.items||[]).some(l=>l.lineId===i.lineId)).length===1);
  const invoices=(packing.invoices||[]).map(invoice=>{
    const mapped=invoice.items||[];
    const priced=mapped.length>0&&mapped.every(i=>Number.isFinite(i.unitPrice)&&i.unitPrice>=0)&&Number.isFinite(invoice.taxRatePercent)&&typeof invoice.taxIncluded==='boolean';
    const expectedValue=priced?orderPricing(mapped,invoice.taxRatePercent,invoice.taxIncluded,invoice.taxRoundingMode||'NEAREST').totalValue:null;
    const acceptedItems=receiptMismatch?null:fresh?saved.invoices.find(v=>v.invoiceId===invoice.id)?.items:unique?mapped.map(i=>({lineId:i.lineId,quantity:accepted[i.lineId]||0})):null;
    const acceptedValue=priced&&acceptedItems?orderPricing(mapped.map(i=>({...i,quantity:acceptedItems.find(a=>a.lineId===i.lineId)?.quantity||0})),invoice.taxRatePercent,invoice.taxIncluded,invoice.taxRoundingMode||'NEAREST').totalValue:null;
    return {id:invoice.id,invoiceNumber:invoice.invoiceNumber,items:mapped,documentValue:invoice.totalAmount??null,expectedValue,difference:expectedValue!=null&&invoice.totalAmount!=null?Math.round((invoice.totalAmount-expectedValue)*100)/100:null,acceptedItems:acceptedItems||null,acceptedValue,unacceptedValue:acceptedValue!=null?expectedValue-acceptedValue:null};
  });
  let status=receiptMismatch?'RECEIPT_DIFFERENCE':errors.length?'UNMAPPED':invoices.some(i=>i.expectedValue==null||i.documentValue==null)?'UNPRICED':invoices.some(i=>Math.abs(i.difference)>0.005)?'AMOUNT_DIFFERENCE':!resolved?'IN_PROGRESS':saved&&!fresh?'STALE':!unique&&!fresh?'NEEDS_ALLOCATION':'RECONCILED';
  // Undispatched/reusable quantities still need action even when every current stop is terminal.
  if(status==='RECONCILED'&&(packing.items||[]).some(i=>stops.reduce((n,s)=>n+(s.allocatedItems||[]).filter(a=>a.lineId===i.lineId).reduce((v,a)=>v+a.quantity,0)-(s.returnInspection?(s.reusableItems||[]).filter(a=>a.lineId===i.lineId).reduce((v,a)=>v+a.quantity,0):0),0)<i.quantity))status='IN_PROGRESS';
  return {status,errors,accepted,invoices,fingerprint,resolved,confirmedAt:fresh?saved.at:null};
}
