// Explicitly disposable local-only orders for verifying the interactive picker.
import 'dotenv/config';
import {writeFile,readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {prisma} from '../src/config/prisma.js';
import {savePacking} from '../src/modules/delivery/services/packing-workflow.service.js';
if(!['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname))throw new Error('Local database only');
const manifest=new URL('../../.backups/packing-load-browser-fixtures.json',import.meta.url);
try{
 if(process.argv.includes('--cleanup')){
  const {ids}=JSON.parse(await readFile(manifest,'utf8'));
  const packings=await prisma.packingList.findMany({where:{sourceOrderIds:{hasSome:ids}},include:{deliveryStops:true}});
  if(packings.some(row=>row.sourceOrderIds.some(id=>!ids.includes(id))||row.deliveryStops.length))throw new Error('Fixture has mixed sources or a trip; inspect before cleanup');
  await prisma.$transaction(async tx=>{
   await tx.invoice.deleteMany({where:{packingListId:{in:packings.map(row=>row.id)}}});
   await tx.packingList.deleteMany({where:{id:{in:packings.map(row=>row.id)}}});
   await tx.order.deleteMany({where:{id:{in:ids},code:{startsWith:'QA-LOAD-'}}});
  });
  console.log('Disposable browser orders removed');
 }else{
  const sales=await prisma.user.findFirst({where:{role:'SALES',deletedAt:null}}),product=await prisma.product.findFirst({where:{deletedAt:null}});
  const outlets=await prisma.outlet.findMany({where:{deletedAt:null,latitude:{not:null},longitude:{not:null}},take:2,orderBy:{name:'asc'}});
  if(!sales||!product||outlets.length<2)throw new Error('Seed local data first');
  const ids=[],prefix=`QA-LOAD-${randomUUID().slice(0,8)}`;
  for(let index=0;index<3;index++){
   const outlet=outlets[index===2?1:0],quantity=(index+1)*10;
   const order=await prisma.order.create({data:{code:`${prefix}-${index+1}`,createdBy:sales.id,outletId:outlet.id,status:'APPROVED',approvedAt:new Date(),totalValue:quantity*10,taxRatePercent:0,taxIncluded:true,customerSnapshot:{id:outlet.id,name:outlet.name,deliveryPoint:{latitude:outlet.latitude,longitude:outlet.longitude,outletId:outlet.id}},items:{create:{productId:product.id,productName:product.name,productSku:product.sku,unit:'pak',quantity,unitPrice:10,subtotal:quantity*10}}}});
   ids.push(order.id);
  }
  let packing;
  if(process.argv.includes('--packing')){
   const sources=await prisma.order.findMany({where:{id:{in:ids}},include:{items:true},orderBy:{code:'asc'}}),admin=await prisma.user.findFirst({where:{role:'ADMIN',deletedAt:null}});
   packing=await savePacking({loadPlanVersion:2,requestId:randomUUID(),outletId:outlets[0].id,sourceOrderIds:ids,suggestedVehicleId:null,totalCartons:9,releaseAfterSave:true,items:sources.map((order,index)=>({lineId:order.items[0].id,sourceOrderItemId:order.items[0].id,name:product.name,quantity:order.items[0].quantity,unit:'pak',destinationId:index===2?'b':'a'})),destinations:[{id:'a',outletId:outlets[0].id,sourceOrderIds:ids.slice(0,2),totalCartons:5,totalWeight:40},{id:'b',outletId:outlets[1].id,sourceOrderIds:[ids[2]],totalCartons:4,totalWeight:null}],invoices:sources.map((order,index)=>({invoiceNumber:`${prefix}-INV-${index}`,destinationId:index===2?'b':'a',sourceOrderIds:[order.id],totalCartons:index===0?3:index===1?2:4,items:[{lineId:order.items[0].id,quantity:order.items[0].quantity}]}))},admin.id);
  }
  await writeFile(manifest,JSON.stringify({ids,prefix}));console.log({prefix,orders:ids.length,packing:packing?.code});
 }
}finally{await prisma.$disconnect();}
