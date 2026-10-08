// Local synthetic fixtures. No database or real customer data.
import {fixture as baseFixture,orders as baseOrders,products as baseProducts} from './admin-ui-fixtures.mjs';
import {wibDateKey} from '../../shared/visit-metrics.mjs';
export const user={id:'ui-sales',email:'sales-ui@example.invalid',name:'Adi Pratama',role:'SALES',cluster:{id:'cluster-1',name:'Bandung Barat'},region:'Padalarang',permissions:{can_access_rjp:true,can_register_outlet:true}};
const outlets=['Toko Sumber Jaya','Mitra Sejahtera','Toko Anugrah','Sinar Baru','Toko Mekar'].map((name,i)=>({id:`outlet-${i}`,name,outletCode:`OUT-${100+i}`,address:['Jl. Raya Padalarang No. 12','Jl. Ciburuy No. 8','Jl. Batujajar No. 24','Jl. Cimareme No. 15','Jl. Cikalong No. 36'][i],ownerName:'Pemilik contoh',phone:'0800000000',latitude:-6.88-i*.012,longitude:107.58+i*.015,radiusMeters:100,paymentType:'TOP',termOfPaymentDays:14,status:'ACTIVE',lockStatus:'NORMAL',cluster:user.cluster}));
const today=()=>wibDateKey();
const at=(h,m)=>`${today()}T${h}:${m}:00+07:00`;
const pjp=()=>({id:'pjp-sales',userId:user.id,user,date:today(),stops:outlets.map((outlet,i)=>({id:`sales-stop-${i}`,outletId:outlet.id,outlet,sequence:i+1,status:['VISITED','IN_VISIT','PENDING','CLOSED_REPORTED','PENDING'][i],attendances:i<2?[{id:`in-${i}`,type:'IN',timestamp:at('09',i?'40':'10'),notes:'Kunjungan pelanggan',deviationMeters:18},...(i===0?[{id:'out-0',type:'OUT',timestamp:at('09','30'),notes:'Pelanggan meminta jadwal pengiriman',visitOutcome:{purpose:'ORDER'},durationMinutes:20}]:[])]:[]}))});
const orders=baseOrders.slice(0,7).map((o,i)=>({...o,createdByUser:user,pjpStop:{outlet:outlets[i%5]},paymentType:'TOP',fulfillmentStatus:i===3?'PARTIAL':i===4?'FULFILLED':'OPEN',status:i<2?'PENDING_APPROVAL':i===6?'REJECTED':'APPROVED',rejectionReason:i===6?'Konfirmasi kembali jumlah pesanan dengan pelanggan':null,promisedAt:i>2?at('15','00'):null,fulfillmentLines:o.fulfillmentLines.map(l=>({...l,accepted:i===3?3:i===4?l.quantity:0,remaining:i===3?l.quantity-3:i===4?0:l.quantity,unpacked:i===3?l.quantity-3:i===4?0:l.quantity}))}));
const products=[...baseProducts,{...baseProducts[0],id:'product-2',sku:'SKU-002',name:'Produk contoh B',price:85000},{...baseProducts[0],id:'product-3',sku:'SKU-003',name:'Produk contoh C',price:65000}];
export function fixture(path,query){
 if(path==='/auth/me')return user;
 if(path==='/pjp/today')return pjp();
 if(path==='/pjp')return query.get('date')===today()?{data:[pjp()],pagination:{hasNextPage:false,totalPages:1}}:{data:[],pagination:{hasNextPage:false,totalPages:1}};
 if(path==='/orders')return {data:orders,pagination:{hasNextPage:false,totalPages:1}};
 if(path==='/products')return products;
 if(path==='/staff-attendance')return [{id:'shift-sales',kind:'SHIFT',activityKey:'SHIFT',checkInAt:at('08','00'),checkOutAt:null}];
 if(path==='/staff-attendance/follow-ups')return query.get('status')==='OPEN'?[{id:'followup-sales-1',outletName:outlets[0].name,followUp:{status:'OPEN',ownerId:user.id,ownerName:user.name,dueDate:today(),note:'Konfirmasi waktu penerimaan pengiriman dengan pemilik toko dan catat hasil komunikasi.',history:[]}}]:[];
 if(path==='/outlets')return outlets;
 if(path==='/clusters')return [{...user.cluster,outlets,region:user.region}];
 if(path==='/divisions')return [{id:'division-1',name:'Divisi contoh',isActive:true}];
 if(path==='/route-changes'||path==='/outlets/unlock-requests')return [];
 if(path==='/absensi/off-pjp')return [{id:'off-sales-1',userId:user.id,user,outletName:'Toko Prospek Mandiri',address:'Jl. Raya Ciburuy No. 20',status:'PENDING',reason:'Kunjungan pelanggan tambahan',createdAt:at('10','00')}];
 if(path.includes('registrations'))return [];
 return baseFixture(path,query);
}
