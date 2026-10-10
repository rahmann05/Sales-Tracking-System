import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {prisma} from '../src/config/prisma.js';
import {withPolicy} from '../src/modules/config/services/policy-context.service.js';
import {CONFIG_DEFAULTS} from '../../shared/config.mjs';
import {createOrder} from '../src/modules/orders/services/create-order.service.js';
import {savePacking} from '../src/modules/delivery/services/packing-workflow.service.js';
import {correctInvoiceCommercial} from '../src/modules/delivery/services/invoice-reconciliation.service.js';
import {invoiceReconciliation} from '../../shared/invoice-reconciliation.mjs';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname));
const tag='price-policy-'+randomUUID(),users=[];let cluster,outlet,pjp,product,checks=0;
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
try{
 for(const role of ['ADMIN','SALES'])users.push(await prisma.user.create({data:{name:tag,role,email:randomUUID()+'@example.invalid',password:'unused'}}));
 const [admin,sales]=users;
 cluster=await prisma.cluster.create({data:{name:tag,region:tag,assignedSalesId:sales.id}});
 outlet=await prisma.outlet.create({data:{name:tag,address:tag,latitude:-6.9,longitude:107.6,clusterId:cluster.id}});
 pjp=await prisma.pjp.create({data:{userId:sales.id,type:'SALES',date:new Date(),stops:{create:{outletId:outlet.id,sequence:1}}},include:{stops:true}});
 product=await prisma.product.create({data:{name:tag,sku:tag,price:101}});
 let values={...CONFIG_DEFAULTS,CODE_ORDER_MODE:'MANUAL',CODE_PACKING_LIST_MODE:'MANUAL',CODE_INVOICE_MODE:'MANUAL',SALES_ATTENDANCE_MODE:'OPTIONAL',ORDER_APPROVAL_MODE:'NONE',SALES_ALLOW_PRICE_OVERRIDE:true,ORDER_PRICE_OVERRIDE_LIMIT_ENABLED:true,ORDER_PRICE_OVERRIDE_MAX_DISCOUNT_PERCENT:10,ORDER_PRICE_OVERRIDE_MAX_MARKUP_PERCENT:0,ORDER_TAX_ROUNDING_MODE:'UP',ORDER_PRICES_INCLUDE_TAX:false,TAX_RATE_PERCENT:11,PACKING_SOURCE_MODE:'BOTH',PACKING_AUTO_FROM_APPROVED_ORDER:false};
 const as=fn=>withPolicy({values,versions:[],at:new Date().toISOString()},fn);
 const items=price=>[{productId:product.id,quantity:1,unitPrice:price}];
 for(const price of [90,102]){await assert.rejects(()=>as(()=>createOrder(sales.id,pjp.stops[0].id,items(price),'CASH',tag)),e=>e.statusCode===422);checks++;}
 eq(await prisma.order.count({where:{createdBy:sales.id}}),0);
 const requestId=randomUUID(),order=await as(()=>createOrder(sales.id,pjp.stops[0].id,items(101),'CASH',tag,{requestId,expectedTotal:113}));
 eq(order.totalValue,113);eq(order.taxAmount,12);eq(order.policySnapshot.values.ORDER_TAX_ROUNDING_MODE,'UP');
 values={...values,ORDER_TAX_ROUNDING_MODE:'DOWN',SALES_ALLOW_PRICE_OVERRIDE:false};
 eq((await as(()=>createOrder(sales.id,pjp.stops[0].id,items(101),'CASH',tag,{requestId,expectedTotal:113}))).id,order.id);
 const line=order.items[0],packing=await as(()=>savePacking({code:tag,sourceOrderId:order.id,outletId:outlet.id,items:[{lineId:line.id,sourceOrderItemId:line.id,name:tag,quantity:1,unit:'unit'}],totalCartons:1,invoices:[{invoiceNumber:tag,totalCartons:1,totalAmount:113,taxRoundingMode:'DOWN',items:[{lineId:line.id,quantity:1,unitPrice:1}]}]},admin.id));
 eq(packing.invoices[0].taxRoundingMode,'UP');eq(packing.invoices[0].items[0].unitPrice,101);eq(invoiceReconciliation(packing).invoices[0].difference,0);
 const invoice=packing.invoices[0];
 const corrected=await as(()=>correctInvoiceCommercial(packing.id,{revision:packing.revision,note:'Konfirmasi dokumen sumber',invoices:[{id:invoice.id,totalAmount:113,taxRoundingMode:'DOWN',items:invoice.items}]},admin));
 eq(corrected.invoices[0].taxRoundingMode,'UP');eq(corrected.commercial.invoices[0].difference,0);
 console.log(`Order price policy passed: ${checks} assertions; bounds, rollback, retry, frozen rounding, packing and invoice correction.`);
}finally{
 await prisma.notification.deleteMany({where:{userId:{in:users.map(u=>u.id)}}});await prisma.auditEvent.deleteMany({where:{actorId:{in:users.map(u=>u.id)}}});
 if(outlet)await prisma.packingList.deleteMany({where:{outletId:outlet.id}});await prisma.order.deleteMany({where:{createdBy:{in:users.map(u=>u.id)}}});
 if(pjp)await prisma.pjp.delete({where:{id:pjp.id}});if(product)await prisma.product.delete({where:{id:product.id}});if(outlet)await prisma.outlet.delete({where:{id:outlet.id}});
 if(cluster)await prisma.cluster.delete({where:{id:cluster.id}});await prisma.user.deleteMany({where:{id:{in:users.map(u=>u.id)}}});await prisma.$disconnect();
}
