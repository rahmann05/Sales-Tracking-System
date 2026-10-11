import {AppError} from '../../../utils/errors.js';
import {mileagePoint} from './vehicle-mileage-plan.service.js';
import {loadLogistics,capacityGuidance} from '../../../../../shared/packing-load.mjs';

export async function preparePackingLoad(tx,data,orders){
 const definitions=data.destinations||[];
 if(!definitions.length||new Set(definitions.map(row=>row.id)).size!==definitions.length)throw new AppError('Sertakan tujuan muatan dengan identitas yang unik.',400);
 const outlets=await tx.outlet.findMany({where:{id:{in:[...new Set(definitions.map(row=>row.outletId))]},deletedAt:null}});
 const orderIds=definitions.flatMap(row=>row.sourceOrderIds);
 if(new Set(orderIds).size!==orderIds.length||orders.length!==orderIds.length||orders.some(order=>!orderIds.includes(order.id)))throw new AppError('Setiap order harus masuk tepat satu tujuan packing list.',400);
 const destinations=definitions.map(row=>{
  const outlet=outlets.find(item=>item.id===row.outletId);
  if(!outlet)throw new AppError('Toko tujuan tidak ditemukan.',404);
  const sources=row.sourceOrderIds.map(id=>orders.find(order=>order.id===id));
  if(sources.some(order=>!order||(order.outletId||order.pjpStop?.outletId)!==outlet.id))throw new AppError('Order dan toko pada tujuan muatan tidak sesuai.',400);
  const points=sources.map(order=>mileagePoint(outlet,order.customerSnapshot?.deliveryPoint));
  const keys=new Set(points.filter(Boolean).map(point=>`${point.latitude.toFixed(6)},${point.longitude.toFixed(6)}`));
  if(keys.size>1)throw new AppError('Titik order pada satu tujuan berbeda. Pisahkan tujuan pengiriman atau koreksi order sumber.',409);
  if(sources.length&&points.some(point=>!point)&&keys.size)throw new AppError('Ada order tanpa titik yang dapat dipastikan pada tujuan ini. Lengkapi titik order.',422);
  return {...row,totalWeight:row.totalWeight??null,outlet:{id:outlet.id,name:outlet.name,address:outlet.address,outletCode:outlet.outletCode},point:points[0]||mileagePoint(outlet)};
 });
 const suggestedVehicle=data.suggestedVehicleId?await tx.vehicle.findUnique({where:{id:data.suggestedVehicleId}}):null;
 if(data.suggestedVehicleId&&(!suggestedVehicle||suggestedVehicle.deletedAt||!suggestedVehicle.isActive))throw new AppError('Saran kendaraan tidak lagi tersedia. Pilih ulang atau kosongkan saran.',409);
 return {destinations,suggestedVehicleId:suggestedVehicle?.id||null,suggestedVehicleSnapshot:suggestedVehicle?{id:suggestedVehicle.id,code:suggestedVehicle.code,name:suggestedVehicle.name,maxCartons:suggestedVehicle.maxCartons,maxWeightKg:suggestedVehicle.maxWeightKg,at:new Date().toISOString()}:null};
}

export function mapLoadInvoices(invoiceRows,items,destinations){
 return invoiceRows.map(invoice=>{
  const mapped=(invoice.items||[]).map(line=>items.find(item=>item.lineId===line.lineId));
  const ids=[...new Set(mapped.map(item=>item?.destinationId))];
  const destination=destinations.find(row=>row.id===(invoice.destinationId||ids[0]));
  if(!destination||ids.some(id=>id!==destination.id))throw new AppError('Satu faktur harus berisi barang untuk satu tujuan. Pisahkan faktur lintas toko/titik.',400);
  const sourceOrderIds=[...new Set(mapped.length?mapped.map(item=>item?.sourceOrderId).filter(Boolean):invoice.sourceOrderIds||[])];
  if(sourceOrderIds.some(id=>!destination.sourceOrderIds.includes(id)))throw new AppError('Sumber faktur tidak sesuai order tujuan.',400);
  return {...invoice,destinationId:destination.id,outletId:destination.outletId,sourceOrderIds};
 });
}

export function loadReadyError(packing,invoiceRequired){
 if(!packing.destinations?.length)return 'Tujuan muatan belum diisi.';
 for(const destination of packing.destinations){
  const items=packing.items.filter(item=>item.destinationId===destination.id),invoices=packing.invoices.filter(invoice=>invoice.destinationId===destination.id);
  if(!items.length||destination.totalCartons<=0)return `Lengkapi barang dan karton untuk ${destination.outlet.name}.`;
  if(!destination.point)return `Titik pengiriman ${destination.outlet.name} belum tersedia.`;
  if(invoiceRequired&&!invoices.length)return `Faktur untuk ${destination.outlet.name} belum dilampirkan.`;
  if(invoices.length&&(invoices.some(invoice=>invoice.totalCartons<=0)||invoices.reduce((sum,invoice)=>sum+invoice.totalCartons,0)!==destination.totalCartons))return `Karton faktur ${destination.outlet.name} belum sesuai muatan tujuan tersebut.`;
 }
 return null;
}

export function loadVehicleReview(packings,vehicle){
 const destinations=packings.flatMap(packing=>packing.destinations||[]);
 const load=loadLogistics({loadPlanVersion:2,destinations,items:packings.flatMap(packing=>packing.items||[])});
 return {load,capacity:capacityGuidance(load,vehicle)};
}
