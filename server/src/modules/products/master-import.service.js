import {createHash} from 'node:crypto';
import {z} from 'zod';
import {prisma} from '../../config/prisma.js';
import {AppError} from '../../utils/errors.js';
import {createProductSchema} from './products.schema.js';
import {createVehicleSchema} from '../vehicles/vehicles.schema.js';
import {validateProductUnits} from './product-units.js';
import {freshDomainActor} from '../../middlewares/domain-permission.middleware.js';
import {getCodePolicy,resolveBusinessCode,validateCodeUpdate} from '../config/services/business-code.service.js';
import {getDynamicConfig} from '../config/config.service.js';
const definitions={products:{model:'product',key:'sku',code:'PRODUCT_SKU',feature:'PRODUCTS'},vehicles:{model:'vehicle',key:'code',code:'VEHICLE',feature:'VEHICLES'}};
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
function parse(kind,raw){
 const d=definitions[kind];if(!d)throw new AppError('Jenis impor tidak dikenal.',422);
 return z.array(z.object({action:z.enum(['UPSERT','CREATE_ONLY','UPDATE_ONLY','SKIP']).default('UPSERT'),data:(kind==='products'?createProductSchema:createVehicleSchema).shape.body.omit(kind==='products'?{stock:true}:{isActive:true}).strict()})).min(1).max(200).parse(raw);
}
async function preview(db,kind,raw){
 const d=definitions[kind],rows=parse(kind,raw),codes=rows.map(r=>r.data[d.key]);
 if(codes.some(c=>!c)||new Set(codes).size!==codes.length)throw new AppError('Kode/SKU wajib dan tidak boleh duplikat dalam berkas.',422);
 const saved=await db[d.model].findMany({where:{[d.key]:{in:codes}},orderBy:{id:'asc'}}),lookup=new Map(saved.map(r=>[r[d.key],r]));
 const changes=rows.map(row=>{const old=lookup.get(row.data[d.key]);if(old?.deletedAt&&row.action!=='SKIP')throw new AppError(`Kode ${row.data[d.key]} sudah dinonaktifkan. Aktifkan melalui master; impor tidak menghidupkan histori.`,409);
  const action=row.action==='SKIP'||row.action==='CREATE_ONLY'&&old||row.action==='UPDATE_ONLY'&&!old?'SKIP':old?'UPDATE':'CREATE';
  if(kind==='products')validateProductUnits(row.data);
  return {code:row.data[d.key],name:row.data.name,action,before:old||null,after:row.data};
 });
 if(changes.some(c=>c.action==='CREATE')&&(await getCodePolicy(d.code)).mode!=='MANUAL')throw new AppError('Penambahan lewat impor membutuhkan mode kode MANUAL agar kode sumber tidak diganti otomatis. Update kode yang sudah ada tetap tersedia.',422);
 return {rows,changes,token:hash({rows,saved}),summary:{created:changes.filter(c=>c.action==='CREATE').length,updated:changes.filter(c=>c.action==='UPDATE').length,skipped:changes.filter(c=>c.action==='SKIP').length}};
}
export async function masterImport(kind,body,user,apply=false){
 if(user.role!=='ADMIN')throw new AppError('Impor master hanya untuk Admin.',403);
 const input=z.object({rows:z.array(z.unknown()),token:z.string().regex(/^[a-f0-9]{64}$/).optional(),requestId:z.string().uuid().optional()}).strict().parse(body);
 return prisma.$transaction(async db=>{
  await freshDomainActor(db,user.id,kind==='products'?'MANAGE_PRODUCT':'MANAGE_VEHICLE');
  await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`master-import:${kind}`}))`;
  const receiptKey=`_MASTER_IMPORT:${user.id}:${input.requestId}`,fingerprint=hash(input.rows);
  if(apply){if(!input.requestId||!input.token)throw new AppError('Pratinjau dan identitas pengiriman wajib tersedia.',422);
   const receipt=await db.systemConfig.findUnique({where:{key:receiptKey}});if(receipt){if(receipt.value.kind!==kind||receipt.value.fingerprint!==fingerprint)throw new AppError('Identitas impor sudah digunakan untuk isi berbeda.',409);return receipt.value.result;}
   if(await getDynamicConfig(`FEATURE_${definitions[kind].feature}_MODE`,'ACTIVE')!=='ACTIVE')throw new AppError('Impor master baru sedang dijeda.',409);
   if(kind==='products')await freshDomainActor(db,user.id,'CREATE_PRODUCT');
  }
  const review=await preview(db,kind,input.rows);if(!apply)return review;
  if(input.token!==review.token)throw new AppError('Master atau isi impor berubah. Buat pratinjau kembali.',409);
  const d=definitions[kind];
  for(const c of review.changes){if(c.action==='SKIP')continue;
   if(c.before)await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${d.model}:${c.before.id}`}))`;
   if(c.before){const latest=await db[d.model].findUnique({where:{id:c.before.id}});if(latest.updatedAt.getTime()!==c.before.updatedAt.getTime())throw new AppError('Master berubah saat impor. Periksa ulang.',409);}
   const data={...c.after};
   if(kind==='products'&&c.before&&data.code!==undefined)data.code=await validateCodeUpdate('PRODUCT',data.code,c.before.id,db);
   if(kind==='products')Object.assign(data,validateProductUnits(data));
   if(c.action==='CREATE'&&kind==='products'){data.stock=0;data.code=await resolveBusinessCode('PRODUCT',data.code,{db,optional:true});}
   if(kind==='vehicles'){data.maxCartons??=await getDynamicConfig('DEFAULT_VEHICLE_CAPACITY_CARTONS',200);data.fuelPricePerLiter??=await getDynamicConfig('DEFAULT_FUEL_PRICE_PER_LITER',12500);}
   const after=c.action==='CREATE'?await db[d.model].create({data}):await db[d.model].update({where:{id:c.before.id},data});
   await db.auditEvent.create({data:{entityType:kind==='products'?'PRODUCT':'VEHICLE',entityId:after.id,action:'MASTER_IMPORT',actorId:user.id,actorName:user.name,before:c.before?JSON.parse(JSON.stringify(c.before)):{},after:JSON.parse(JSON.stringify(after))}});
  }
  const result={...review.summary,requestId:input.requestId};
  await db.systemConfig.create({data:{key:receiptKey,value:{kind,fingerprint,result}}});return result;
 },{timeout:30000,isolationLevel:'Serializable'});
}
