// A load keeps the identity of every destination and source line. Quantities with
// different units must never be summed as if they were cartons or kilograms.
export const isVehicleLoad = packing => packing?.loadPlanVersion === 2;
export function loadDestinations(packing) {
 if(isVehicleLoad(packing))return packing.destinations||[];
 return [{id:null,outletId:packing.outletId,outlet:packing.outlet,point:packing.destinationPoint,totalCartons:packing.totalCartons,totalWeight:packing.totalWeight,sourceOrderIds:packing.sourceOrderIds||[packing.sourceOrderId].filter(Boolean)}];
}
export function destinationPacking(packing,id){
 if(!isVehicleLoad(packing))return packing;
 const destination=(packing.destinations||[]).find(row=>row.id===id);
 if(!destination)throw new Error('Tujuan tidak terdapat pada packing list. Muat ulang dokumen.');
 return {...packing,...destination,packingListId:packing.id,id:packing.id,items:(packing.items||[]).filter(row=>row.destinationId===id),invoices:(packing.invoices||[]).filter(row=>row.destinationId===id),deliveryStops:(packing.deliveryStops||[]).filter(row=>row.packingDestinationId===id)};
}
export function loadLogistics(packing){
 const destinations=loadDestinations(packing),groups=new Map();
 for(const item of packing.items||[]){
  const key=JSON.stringify([item.sku||item.name,item.unit||'unit',item.baseUnit||null,item.unitsPerUnit||null]);
  const row=groups.get(key)||{sku:item.sku||'',name:item.name,unit:item.unit||'unit',quantity:0};
  row.quantity+=item.quantity;groups.set(key,row);
 }
 const known=destinations.filter(row=>row.totalWeight!=null&&Number.isFinite(row.totalWeight));
 return {products:[...groups.values()],totalCartons:destinations.reduce((sum,row)=>sum+row.totalCartons,0),knownWeightKg:known.reduce((sum,row)=>sum+row.totalWeight,0),weightComplete:known.length===destinations.length,unknownWeightDestinations:destinations.length-known.length,outletCount:new Set(destinations.map(row=>row.outletId)).size,destinationCount:destinations.length};
}
export function capacityGuidance(load,vehicle){
 const cartons=Number.isFinite(vehicle?.maxCartons)&&vehicle.maxCartons>0?vehicle.maxCartons:null;
 const weight=Number.isFinite(vehicle?.maxWeightKg)&&vehicle.maxWeightKg>0?vehicle.maxWeightKg:null;
 return {cartonCapacity:cartons,weightCapacityKg:weight,cartonPercent:cartons?load.totalCartons/cartons*100:null,weightPercent:weight?load.knownWeightKg/weight*100:null,weightComplete:load.weightComplete,overCartons:cartons!=null&&load.totalCartons>cartons,overWeight:weight!=null&&load.knownWeightKg>weight};
}
