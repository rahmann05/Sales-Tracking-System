import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CODE_ENTITIES,codePolicy,codePeriod,formatCode,validateCodePolicy} from '../../shared/coding.mjs';
import {CONFIG_PARAMS,CONFIG_DEFAULTS} from '../../shared/config.mjs';
import {prisma} from '../src/config/prisma.js';
import {invalidateConfigCache} from '../src/modules/config/services/dynamic-config.service.js';
import {resolveBusinessCode,validateCodeUpdate} from '../src/modules/config/services/business-code.service.js';
import {validateConfigRelations} from '../src/modules/config/services/validate-config.service.js';
import {savePacking,draftFromApprovedOrder} from '../src/modules/delivery/services/packing-workflow.service.js';
import {importRjp} from '../src/modules/clusters/services/import-rjp.service.js';
import {previewRjpImport} from '../src/modules/clusters/services/rjp-import-preview.service.js';
import {ensureTodayPjpForSales} from '../src/modules/pjp/services/pjp.helpers.js';

function mock(t,target,key,value){const original=target[key];target[key]=value;t.after(()=>{target[key]=original;invalidateConfigCache();});}
function setup(t,values={}) {
  mock(t,prisma.systemConfig,'findMany',async()=>Object.entries(values).map(([key,value])=>({key,value})));
  invalidateConfigCache();
  const counters=new Map();
  mock(t,prisma,'$queryRaw',async (_strings,key,start)=>{const next=Math.max((counters.get(key)||0)+1,start);counters.set(key,next);return [{sequence:String(next)}];});
  const db=Object.fromEntries(CODE_ENTITIES.map(e=>[e.model,{findFirst:async()=>null,findUnique:async()=>null}]));
  return {db,counters};
}

test('every operational code family registers all six parameters once',()=>{
  assert.equal(new Set(CONFIG_PARAMS.map(p=>p.key)).size,CONFIG_PARAMS.length);
  for(const e of CODE_ENTITIES) for(const name of ['MODE','PREFIX','PATTERN','START','PADDING','RESET']) assert.ok(CONFIG_PARAMS.some(p=>p.key===`CODE_${e.key}_${name}`));
});

test('WIB determines reset periods across midnight, month and year boundaries',()=>{
  const date=new Date('2026-12-31T17:00:00Z');
  assert.equal(codePeriod('DAILY',date),'20270101');
  assert.equal(codePeriod('MONTHLY',date),'202701');
  assert.equal(codePeriod('YEARLY',date),'2027');
  assert.equal(codePeriod('NONE',date),'ALL');
});

test('increment never truncates overflow, pattern supports date tokens and empty prefix',()=>{
  const policy={...codePolicy('OUTLET'),padding:3};
  assert.equal(formatCode(policy,1000),'OUT-1000');
  assert.equal(formatCode({...policy,prefix:''},1),'001');
  assert.equal(formatCode({...policy,mode:'PATTERN',pattern:'{PREFIX}/{YY}/{MM}/{DD}/{SEQ}'},9,new Date('2026-10-06T17:00:00Z')),'OUT/26/10/07/009');
});

test('invalid tokens, missing sequences, fractional starts and ambiguous resets are rejected',()=>{
  const policy={...codePolicy('NOO'),mode:'PATTERN'};
  for(const change of [{pattern:'NOO-{BOGUS}-{SEQ}'},{pattern:'NOO-{YYYY}'},{start:1.5},{padding:3.2},{pattern:'NOO-{SEQ}',reset:'YEARLY'},{pattern:'NOO-{YYYY}-{SEQ}',reset:'MONTHLY'},{pattern:'NOO-{YYYY}{MM}-{SEQ}',reset:'DAILY'}]) assert.throws(()=>validateCodePolicy({...policy,...change}));
  assert.throws(()=>validateConfigRelations({...CONFIG_DEFAULTS,CODE_NOO_MODE:'PATTERN',CODE_NOO_PATTERN:'{PREFIX}-{SEQ}'}));
});

for (const entity of CODE_ENTITIES) {
  test(`${entity.key}: automatic reserves distinct codes and MANUAL requires supplied input`,async t=>{
    const {db}=setup(t,{[`CODE_${entity.key}_MODE`]:'INCREMENT'});
    const codes=await Promise.all(Array.from({length:8},()=>resolveBusinessCode(entity.key,'ignored',{db})));
    assert.equal(new Set(codes).size,8);
    setup(t,{[`CODE_${entity.key}_MODE`]:'MANUAL'});
    await assert.rejects(resolveBusinessCode(entity.key,'',{db}),{statusCode:422});
    assert.equal(await resolveBusinessCode(entity.key,' MAN-009 ',{db}),'MAN-009');
    db[entity.model].findFirst=async()=>({id:'existing'});
    await assert.rejects(resolveBusinessCode(entity.key,'MAN-009',{db}),{statusCode:409});
  });
}

test('automatic numbering skips imported/deleted code collisions and never resets a changed prefix',async t=>{
  const {db,counters}=setup(t,{CODE_OUTLET_MODE:'INCREMENT'});
  db.outlet.findFirst=async({where})=>where.outletCode==='OUT-00001'?{id:'deleted'}:null;
  assert.equal(await resolveBusinessCode('OUTLET',null,{db}),'OUT-00002');
  assert.equal([...counters.values()][0],2);
  mock(t,prisma.systemConfig,'findMany',async()=>[{key:'CODE_OUTLET_PREFIX',value:'NEW'}]);
  invalidateConfigCache();
  assert.equal(await resolveBusinessCode('OUTLET',null,{db}),'NEW-00003');
});

test('OUTLET and customer codes share a namespace, while finalizing the same registration can keep its code',async t=>{
  const {db}=setup(t,{CODE_OUTLET_MODE:'MANUAL'});
  db.customerRegistration.findFirst=async({where})=>where.id?.not==='reg'?null:{id:'reg'};
  await assert.rejects(resolveBusinessCode('OUTLET','PVC001',{db}),{statusCode:409});
  assert.equal(await resolveBusinessCode('OUTLET','PVC001',{db,excludeId:'reg'}),'PVC001');
});

test('automatic update preserves a saved code and rejects replacement; manual update checks uniqueness',async t=>{
  const {db}=setup(t,{CODE_PRODUCT_SKU_MODE:'INCREMENT'});
  db.product.findUnique=async()=>({sku:'SKU-001'});
  assert.equal(await validateCodeUpdate('PRODUCT_SKU','SKU-001','product',db),'SKU-001');
  await assert.rejects(validateCodeUpdate('PRODUCT_SKU','OTHER','product',db),{statusCode:409});
  setup(t,{CODE_PRODUCT_SKU_MODE:'MANUAL'});
  assert.equal(await validateCodeUpdate('PRODUCT_SKU','OTHER','product',db),'OTHER');
});

test('packing edits preserve document and invoice numbers even after switching numbering mode',async t=>{
  const {db}=setup(t,{CODE_INVOICE_MODE:'INCREMENT'});
  const old={id:'packing',code:'LEGACY-PL',status:'DRAFT',deliveryStops:[],revision:1,history:[],invoices:[{invoiceNumber:'LEGACY-INV'}]};
  db.packingList.findUnique=async()=>old;
  db.packingList.update=async({data})=>({...old,...data});
  db.outlet.findFirst=async()=>({id:'outlet'});
  db.invoice.deleteMany=async()=>({count:1});
  mock(t,prisma,'$transaction',async fn=>fn(db));
  const saved=await savePacking({outletId:'outlet',revision:1,totalCartons:1,items:[{name:'Item',unit:'unit',quantity:1}],invoices:[{invoiceNumber:'LEGACY-INV',totalCartons:1}]},'admin','packing');
  assert.equal(saved.code,'LEGACY-PL');
  assert.equal(saved.invoices.create[0].invoiceNumber,'LEGACY-INV');
});

test('automatic packing draft does not block approval when packing codes are manual',async t=>{
  const {db}=setup(t,{PACKING_SOURCE_MODE:'ORDER',PACKING_AUTO_FROM_APPROVED_ORDER:true,CODE_PACKING_LIST_MODE:'MANUAL'});
  db.order.findUnique=async()=>({status:'APPROVED'});
  db.packingList.upsert=()=>{throw new Error('Must not create uncoded automatic draft');};
  await draftFromApprovedOrder(db,'order','admin');
});

test('repeated RJP import preserves external outlet codes while new clusters use configured numbering',async t=>{
  const {db}=setup(t);let cluster=null,outlet=null,created=0;
  db.$executeRaw=async()=>1;
  db.cluster.findFirst=async({where})=>where.code ? null : cluster;
  db.cluster.create=async({data})=>{cluster={id:'cluster',...data};return cluster;};
  db.cluster.findMany=async()=>cluster?[cluster]:[];
  db.outlet.findMany=async()=>outlet?[outlet]:[];
  db.outlet.count=async()=>outlet?1:0;
  db.cluster.update=async({data})=>{cluster={...cluster,...data};return cluster;};
  db.clusterRoute={deleteMany:async()=>({count:0})};
  db.pjpTemplateStop={findMany:async()=>[]};db.pjpPlan={findMany:async()=>[]};db.pjpStop={findMany:async()=>[]};
  db.outlet.findUnique=async()=>outlet;
  db.outlet.findFirst=async()=>null;
  db.outlet.create=async({data})=>{created++;outlet={id:'outlet',type:'GENERAL_TRADE',cluster,updatedAt:new Date(),...data};return outlet;};
  db.outletChange={create:async()=>({})};
  db.outlet.update=async({data})=>{outlet={...outlet,...data};return outlet;};
  mock(t,prisma,'$transaction',async fn=>fn(db));
  const rows=[{clusterName:'Area',outletCode:'EXTERNAL-99',customerName:'Toko',address:'Alamat',area:'Bandung',latitude:-6,longitude:107}];
  await importRjp(rows,{id:'admin',role:'ADMIN'});
  const review=await previewRjpImport(rows,{id:'admin',role:'ADMIN'},db);
  await importRjp(rows,{id:'admin',role:'ADMIN'},review.token);
  assert.equal(created,1);
  assert.equal(outlet.outletCode,'EXTERNAL-99');
  assert.equal(cluster.code,'CLS-00001');
});

test('PJP MANUAL leaves missing schedules for admin input and keeps existing schedules accessible',async t=>{
  const {db}=setup(t,{CODE_PJP_MODE:'MANUAL'});
  db.$executeRaw=async()=>1;
  db.pjp.findFirst=async()=>null;
  mock(t,prisma,'$transaction',async fn=>fn(db));
  assert.equal(await ensureTodayPjpForSales('sales'),null);
  db.pjp.findFirst=async()=>({id:'existing',code:'PJP-MANUAL'});
  assert.equal((await ensureTodayPjpForSales('sales')).code,'PJP-MANUAL');
});
