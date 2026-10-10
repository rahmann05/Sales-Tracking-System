import {AppError} from '../../../utils/errors.js';
export function mapInvoiceCommercial(invoice,items,order){
  const orders=Array.isArray(order)?order:order?[order]:[];
  const referenced=orders.filter(o=>(invoice.items||[]).some(line=>{const item=items.find(i=>i.lineId===line.lineId);return item&&o.items.some(i=>i.id===(item.sourceOrderItemId||item.lineId));}));
  if(orders.length>1&&!referenced.length)throw new AppError('Faktur gabungan harus memetakan barang ke order asal.',400);
  const terms=o=>{const sum=o.items.reduce((n,i)=>n+i.subtotal,0);return [o.taxRatePercent,o.taxIncluded??(Math.abs(o.totalValue-sum)<0.005?true:Math.abs(o.totalValue-sum-o.taxAmount)<0.005?false:null),o.policySnapshot?.values?.ORDER_TAX_ROUNDING_MODE||'NEAREST'];};
  if(referenced.some(o=>JSON.stringify(terms(o))!==JSON.stringify(terms(referenced[0]))))throw new AppError('Aturan pajak order berbeda. Pisahkan pemetaan ke faktur masing-masing.',409);
  order=referenced[0]||orders[0]||null;
  const subtotal=order?.items.reduce((n,i)=>n+i.subtotal,0);
  const included=order?.taxIncluded??(order&&Math.abs(order.totalValue-subtotal)<0.005?true:order&&Math.abs(order.totalValue-subtotal-order.taxAmount)<0.005?false:null);
  return {...invoice,items:(invoice.items||[]).map(line=>{
    const packingItem=items.find(i=>i.lineId===line.lineId);
    if(!packingItem)throw new AppError('Barang faktur tidak ditemukan di packing',400);
    const source=orders.flatMap(o=>o.items).find(i=>i.id===(packingItem.sourceOrderItemId||packingItem.lineId));
    if(orders.length&&!source)throw new AppError('Baris faktur tidak sesuai order sumber',409);
    return {...line,...(source?{unitPrice:source.unitPrice}:{})};
  }),taxRoundingMode:order?.policySnapshot?.values?.ORDER_TAX_ROUNDING_MODE||invoice.taxRoundingMode||'NEAREST',...(order?{taxRatePercent:order.taxRatePercent,taxIncluded:included}:{})};
}
