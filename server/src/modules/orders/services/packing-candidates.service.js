import {prisma} from '../../../config/prisma.js';
import {getDynamicConfig} from '../../config/config.service.js';
import {AppError} from '../../../utils/errors.js';
import {fulfillment} from '../../../../../shared/delivery-operations.mjs';
import {packingOrderWhere} from '../../../../../shared/packing-orders.mjs';
import {orderSnapshot} from '../../../../../shared/order-snapshot.mjs';

export async function packingCandidates({status='APPROVED',search='',page=1,limit=20}={}){
 if(status==='PENDING_APPROVAL'&&!await getDynamicConfig('PACKING_ALLOW_PENDING_ORDER',false))throw new AppError('Order harus disetujui sebelum dibuatkan dokumen.',409);
 const where={deletedAt:null,status,...(search?{OR:[{code:{contains:search,mode:'insensitive'}},{outlet:{name:{contains:search,mode:'insensitive'}}},{pjpStop:{outlet:{name:{contains:search,mode:'insensitive'}}}},{createdByUser:{name:{contains:search,mode:'insensitive'}}},{items:{some:{product:{name:{contains:search,mode:'insensitive'}}}}}]}:{})};
 const orders=await prisma.order.findMany({where,include:{outlet:true,pjpStop:{include:{outlet:true}},createdByUser:{select:{id:true,name:true}},items:{include:{product:true}}},orderBy:[{createdAt:'asc'},{id:'asc'}]});
 const packings=orders.length?await prisma.packingList.findMany({where:packingOrderWhere(orders.map(order=>order.id)),select:{sourceOrderId:true,sourceOrderIds:true,items:true,deliveryStops:{select:{status:true,allocatedItems:true,rejectedItems:true,reusableItems:true,returnInspection:true}}}}):[];
 const candidates=orders.map(order=>fulfillment(orderSnapshot(order),packings)).filter(order=>order.fulfillmentLines.some(line=>line.unpacked>0));
 return {data:candidates.slice((page-1)*limit,page*limit),pagination:{page,limit,total:candidates.length,totalPages:Math.ceil(candidates.length/limit),hasNextPage:page*limit<candidates.length}};
}
