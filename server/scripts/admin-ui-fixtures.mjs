// Synthetic browser fixtures for the production frontend. No database or real API is connected.
import {CONFIG_DEFAULTS} from '../../shared/config.mjs';
import {routeProgress} from '../../shared/delivery-operations.mjs';
export const user={id:'ui-admin',email:'admin-ui@example.invalid',name:'Admin Pengujian',role:'ADMIN',permissions:{}};
const now=()=>new Date().toISOString();
const outlet=index=>({id:`outlet-${index}`,code:`OUT-${100+index}`,name:['Toko Sumber Jaya','Mitra Sejahtera','Toko Anugrah','Sinar Baru'][index%4],address:'Alamat contoh untuk pengujian UI',latitude:-6.88-index*.012,longitude:107.58+index*.015,status:'ACTIVE'});
export const products=[{id:'product-1',sku:'SKU-001',name:'Produk contoh A',price:125000,unit:'karton',baseUnit:'pcs',unitsPerUnit:24}];
export const orders=Array.from({length:32},(_,index)=>({id:`order-${index}`,code:`SO-20261008-${String(index+1).padStart(4,'0')}`,status:index<18?'PENDING_APPROVAL':index<29?'APPROVED':'REJECTED',createdAt:'2026-10-08T02:15:00Z',createdByUser:{id:`sales-${index%3}`,name:['Adi Pratama','Dewi Lestari','Rizal Maulana'][index%3]},pjpStop:{outlet:outlet(index)},customerSnapshot:outlet(index),items:[{id:`line-${index}`,productId:'product-1',product:products[0],productName:products[0].name,quantity:10+index,unitPrice:125000,subtotal:(10+index)*125000,unit:'karton',baseUnit:'pcs',unitsPerUnit:24}],totalValue:(10+index)*125000,paymentType:'CREDIT',termOfPaymentDays:14,taxRatePercent:11,taxIncluded:true,taxAmount:123874,fulfillmentStatus:'OPEN',fulfillmentLines:[{id:`line-${index}`,product:products[0],quantity:10+index,prepared:0,accepted:0,remaining:10+index,unpacked:10+index,unit:'karton'}],history:[],approvalAssignment:{ownerId:'ui-admin',ownerName:'Admin Pengujian',ownerValid:true,revision:1,dueAt:'2026-10-09T02:00:00Z'}}));
export const packings=Array.from({length:18},(_,index)=>({id:`packing-${index}`,code:`PL-20261008-${String(index+1).padStart(4,'0')}`,outlet:outlet(index),sourceOrderId:`order-${index}`,sourceOrder:{code:orders[index].code},status:index<8?'DRAFT':'RELEASED',revision:1,totalCartons:10+index,totalWeight:30+index,createdAt:'2026-10-08T03:00:00Z',releasedAt:index<8?null:'2026-10-08T04:00:00Z',allocatedCartons:0,remainingCartons:10+index,items:[{lineId:`line-${index}`,sourceOrderItemId:`line-${index}`,sku:'SKU-001',name:'Produk contoh A',quantity:10+index,unit:'karton',unitPrice:125000}],invoices:index===2?[]:[{id:`invoice-${index}`,invoiceNumber:`INV-${100+index}`,totalCartons:10+index,totalAmount:(10+index)*125000,items:[{lineId:`line-${index}`,quantity:10+index}],taxRatePercent:11,taxIncluded:true}],deliveryStops:[],history:[],notes:'Data contoh pengujian tampilan.'}));
export const routes=Array.from({length:4},(_,index)=>{
 const stops=Array.from({length:4},(_,n)=>({id:`stop-${index}-${n}`,sequence:n+1,outlet:outlet(n),status:n<index?'DELIVERED':'PENDING',allocatedCartons:5,allocatedItems:[],rejectedItems:[],attendances:n<index?[{id:`absen-${index}-${n}`,latitude:outlet(n).latitude,longitude:outlet(n).longitude,type:'IN',timestamp:'2026-10-08T03:25:00Z'}]:[],arrivedAt:n<index?'2026-10-08T03:25:00Z':null,completedAt:n<index?'2026-10-08T03:40:00Z':null}));
 const route={id:`trip-${index}`,code:`TRIP-20261008-${index+1}`,vehicleId:`vehicle-${index}`,driverId:`driver-${index}`,vehicle:{code:`B ${9120+index} SNA`,name:'Truk contoh'},driver:{name:['Budi Santoso','Agus Setiawan','Deni Saputra','Hendra Wijaya'][index]},status:index===0?'DRAFT':'IN_TRANSIT',date:'2026-10-08',plannedStartAt:'2026-10-08T01:00:00Z',plannedEndAt:'2026-10-08T10:00:00Z',departedAt:index?'2026-10-08T01:15:00Z':null,totalCartons:20,totalDistanceKm:74,alerts:index===2?['Target tiba perlu dikonfirmasi']:[],stops,history:[],preparation:{},position:index===1?{latitude:-6.89,longitude:107.62,accuracy:16,observedAt:now()}:index===3?{latitude:-6.92,longitude:107.65,accuracy:30,observedAt:'2026-10-08T02:00:00Z'}:null};
 return {...route,progress:routeProgress(route)};
});
for(const packing of packings){
 packing.outletId=packing.outlet.id;packing.source='ORDER';
 packing.remainingItems=packing.items.map(item=>({...item,remaining:item.quantity}));
 packing.remainingInvoices=packing.invoices.map(invoice=>({...invoice,remaining:invoice.totalCartons}));
}
export function fixture(path,query){
 if(path==='/auth/me')return user;
 if(path==='/config/runtime'||path==='/config')return {...CONFIG_DEFAULTS,PACKING_SOURCE_MODE:'MANUAL'};
 if(path==='/notifications')return {notifications:[],unreadCount:0,hasMore:false};
 if(path==='/health/monitoring')return {observedAt:now(),schedulerInitialized:true,database:'FIXTURE',jobs:[],basis:'Data pengujian lokal.'};
 if(path==='/orders'){const status=query.get('status');return {data:orders.filter(order=>!status||order.status===status),pagination:{page:1,totalPages:1,hasNextPage:false}};}
 if(path.includes('/review-assignment')){const order=orders.find(item=>path.includes(item.id))||orders[0];return {status:order.status,assignment:order.approvalAssignment,people:[user],history:[]};}
 if(path==='/delivery/packing-lists'){const search=(query.get('search')||'').toLowerCase(),status=query.get('status');const items=packings.filter(item=>(!status||item.status===status)&&`${item.code} ${item.outlet.name}`.toLowerCase().includes(search));return {items,total:items.length,metrics:{total:18,draftCount:8,releasedCount:10,incompleteCount:1}};}
 if(path==='/delivery/operations')return {generatedAt:now(),routes:routes.map(route=>route.id==='trip-1'?{...route,position:{...route.position,observedAt:now()}}:route),people:[user],issues:[],orders:orders.filter(order=>order.status!=='REJECTED'),packings,commercialQueue:[]};
 if(path==='/users')return [user,...orders.slice(0,3).map(order=>({...order.createdByUser,email:'sales@example.invalid',role:'SALES'}))];
 if(path==='/products')return products;
 if(path==='/delivery/routes')return {items:routes,total:routes.length};
 if(path==='/vehicles')return routes.map(route=>({...route.vehicle,id:route.vehicleId,maxCartons:80,maxWeightKg:1500,isActive:true,condition:'AVAILABLE'}));
 if(path==='/delivery/drivers')return routes.map(route=>({...route.driver,id:route.driverId}));
 if(path==='/attention')return {generatedAt:now(),summary:{total:0,overdue:0,awaitingReview:0,missingOwner:0,missingDeadline:0},rows:[],people:[user],total:0,limit:20};
 if(path==='/outlets')return [0,1,2,3].map(outlet);
 if(path==='/absensi/manual-sales')return {items:[],data:[],total:0};
 if(path==='/config/history')return {items:[],total:0};
 return [];
}
