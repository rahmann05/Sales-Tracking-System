import {unitSnapshot} from './product-units.mjs';
export function orderSnapshot(order) {
  if(!order)return order;
  return {...order,items:(order.items||[]).map(i=>({...i,product:{...i.product,name:i.productName??i.product?.name,sku:i.productSku??i.product?.sku,...unitSnapshot(i)}})),
    ...(order.customerSnapshot&&order.pjpStop?{pjpStop:{...order.pjpStop,outlet:{...order.pjpStop.outlet,...order.customerSnapshot}}}:{})};
}
