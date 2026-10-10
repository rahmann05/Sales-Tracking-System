import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {BUSINESS_ACTIONS,BACKGROUND_CONTRACTS,SOCKET_CONTRACTS,actionNames} from '../../shared/business-actions.mjs';
import {staffActionSchema} from '../src/modules/staff-attendance/staff-attendance.schema.js';
import {routeActionSchema} from '../src/modules/delivery/delivery.schema.js';
import {shiftCorrectionInput} from '../src/modules/staff-attendance/shift-correction.service.js';
const root=fileURLToPath(new URL('../../',import.meta.url));
const require=createRequire(path.join(root,'client/package.json')),{parse}=require('@babel/parser'),traverse=require('@babel/traverse').default;
const inventory=[],errors=[],jobs=new Set(),runs=new Set();
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):/\.(?:js|jsx|mjs)$/.test(e.name)?[path.join(dir,e.name)]:[]);
const files=['server/src','client/src'].flatMap(dir=>walk(path.join(root,dir)));
for(const file of files){
 const name=path.relative(root,file).replaceAll('\\','/'),source=fs.readFileSync(file,'utf8');
 const ast=parse(source,{sourceType:'unambiguous',plugins:['jsx']});
 const add=(node,kind,detail)=>inventory.push({file:name,line:node.loc.start.line,kind,...detail,status:'DISCOVERED_STATICALLY'});
 traverse(ast,{
  JSXOpeningElement({node}){
   const tag=node.name.name||source.slice(node.name.start,node.name.end);
   const handlers=node.attributes.filter(a=>a.type==='JSXAttribute'&&/^on[A-Z]/.test(a.name.name)).map(a=>a.name.name);
   if(['button','input','select','textarea','a','form'].includes(tag)||handlers.length)add(node,'UI_CONTROL',{tag,handlers});
   if(/(?:Dialog|Modal)$/.test(tag))add(node,'DIALOG',{tag});
  },
  ObjectProperty({node}){
   if(node.key?.name==='action'&&node.value?.type==='CallExpression'&&node.value.callee?.property?.name==='enum'){
    const argument=node.value.arguments[0];
    if(argument?.callee?.name!=='actionNames'||!BUSINESS_ACTIONS[argument.arguments?.[0]?.value])errors.push(`Action enum must declare business intent: ${name}:${node.loc.start.line}`);
   }
  },
  CallExpression({node}){
   const method=node.callee.property?.name,object=node.callee.object?.name;
   if(object==='schedulerMonitor'&&method==='register'){
    const id=node.arguments[0]?.value;jobs.add(id);add(node,'JOB',{id,contract:BACKGROUND_CONTRACTS[id]||null});
    if(!BACKGROUND_CONTRACTS[id])errors.push(`Job has no business contract: ${id}`);
   }
   if(object==='schedulerMonitor'&&method==='run')runs.add(node.arguments[0]?.value);
   if(object==='cron'&&method==='schedule'||name==='server/src/utils/scheduler.js'&&node.callee.name==='setInterval')add(node,'SCHEDULE',{expression:node.arguments[0]?.value||'INTERVAL',containsMonitor:source.slice(node.start,node.end).includes('schedulerMonitor.run')});
   if((/server\/src\/config\/socket\.js|client\/src\/context\/MapDataContext\.jsx/.test(name))&&['on','emit','serverSideEmit'].includes(method)){
    const event=node.arguments[0]?.value;
    add(node,'SOCKET',{method,event:event||'DYNAMIC',contract:SOCKET_CONTRACTS[event]||null});
    if(event&&!SOCKET_CONTRACTS[event]&&!['connect','connection','disconnect','reconnect_attempt'].includes(event))errors.push(`Socket event has no contract: ${event}`);
   }
  },
 });
}
for(const id of Object.keys(BACKGROUND_CONTRACTS)){
 if(!jobs.has(id)||!runs.has(id))errors.push(`Job is not registered and executed through health monitoring: ${id}`);
 if(!fs.existsSync(path.join(root,BACKGROUND_CONTRACTS[id].consumer)))errors.push(`Missing job consumer: ${id}`);
}
for(const item of inventory.filter(i=>i.kind==='SCHEDULE'))if(!item.containsMonitor)errors.push(`Unmonitored scheduler: ${item.file}:${item.line}`);
for(const [group,schema] of [['STAFF',staffActionSchema],['TRIP',routeActionSchema]])if(JSON.stringify(schema.shape.body.shape.action.options)!==JSON.stringify(actionNames(group)))errors.push(`Action schema drift: ${group}`);
if(JSON.stringify(shiftCorrectionInput.shape.action.options)!==JSON.stringify(actionNames('SHIFT_CORRECTION')))errors.push('Action schema drift: SHIFT_CORRECTION');
const counts=Object.fromEntries(['UI_CONTROL','DIALOG','JOB','SCHEDULE','SOCKET'].map(kind=>[kind,inventory.filter(i=>i.kind===kind).length]));
const report={generatedAt:new Date().toISOString(),counts,actions:BUSINESS_ACTIONS,background:BACKGROUND_CONTRACTS,socket:SOCKET_CONTRACTS,inventory,limits:'Discovery is not a claim that every UI control has a configurable policy or complete semantic coverage. Shared wrappers and dynamic handlers need runtime review. Registry gates action enums, scheduler monitoring and declared socket events. GPS/camera/offline device UAT and every policy combination remain separate.'};
if(process.argv.includes('--write'))fs.writeFileSync(path.join(root,'docs/SYSTEM_OPERATION_SURFACES.json'),JSON.stringify(report,null,2)+'\n');
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(`C18 operation inventory passed: ${JSON.stringify(counts)}; ${Object.values(BUSINESS_ACTIONS).reduce((n,g)=>n+Object.keys(g).length,0)} business actions. Static discovery does not prove all UI semantics.`);
