import {AppError} from '../../../utils/errors.js';
export function mapInvoiceCommercial(invoice,items,order){
  const subtotal=order?.items.reduce((n,i)=>n+i.subtotal,0);
  const included=order?.taxIncluded??(order&&Math.abs(order.totalValue-subtotal)<0.005?true:order&&Math.abs(order.totalValue-subtotal-order.taxAmount)<0.005?false:null);
  return {...invoice,items:(invoice.items||[]).map(line=>{
    const packingItem=items.find(i=>i.lineId===line.lineId);
    if(!packingItem)throw new AppError('Barang faktur tidak ditemukan di packing',400);
    const source=order?.items.find(i=>i.id===(packingItem.sourceOrderItemId||packingItem.lineId));
    if(order&&!source)throw new AppError('Baris faktur tidak sesuai order sumber',409);
    return {...line,...(source?{unitPrice:source.unitPrice}:{})};
  }),taxRoundingMode:order?.policySnapshot?.values?.ORDER_TAX_ROUNDING_MODE||invoice.taxRoundingMode||'NEAREST',...(order?{taxRatePercent:order.taxRatePercent,taxIncluded:included}:{})};
}
