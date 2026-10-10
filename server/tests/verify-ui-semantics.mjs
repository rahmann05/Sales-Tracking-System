import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {OPERATION_DOMAINS,OPERATION_INTENTS,UI_DELEGATION_CONTRACTS,uiOperationDomain,classifyUiOperation} from '../../shared/operation-semantics.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),require=createRequire(path.join(root,'client/package.json')),{parse}=require('@babel/parser'),traverse=require('@babel/traverse').default;
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):/\.(?:jsx|js)$/.test(e.name)?[path.join(dir,e.name)]:[]);
const inventory=[],errors=[],callers=[];
for(const file of walk(path.join(root,'client/src'))){
 const name=path.relative(root,file).replaceAll('\\','/'),source=fs.readFileSync(file,'utf8'),ast=parse(source,{sourceType:'unambiguous',plugins:['jsx']});
 traverse(ast,{JSXOpeningElement(p){
  const node=p.node,tag=node.name.name||source.slice(node.name.start,node.name.end),attrs=node.attributes.filter(a=>a.type==='JSXAttribute'),events=attrs.filter(a=>/^on[A-Z]/.test(a.name.name));
  if(/^[A-Z]/.test(tag))callers.push({component:tag,file:name,line:node.loc.start.line,callbacks:events.map(a=>({event:a.name.name,handler:source.slice(a.value?.start||a.start,a.value?.end||a.end)}))});
  if(!['button','input','select','textarea','a','form'].includes(tag)&&!events.length)return;
  const domain=uiOperationDomain(name);if(!domain)errors.push(`UI domain missing: ${name}:${node.loc.start.line}`);
  let parent=p.parentPath,submitHandler='';while(parent){if(parent.node.type==='JSXElement'&&parent.node.openingElement.name.name==='form'){const submit=parent.node.openingElement.attributes.find(a=>a.name?.name==='onSubmit');if(submit)submitHandler=source.slice(submit.value.start,submit.value.end);break;}parent=parent.parentPath;}
  const handlers=events.map(a=>({event:a.name.name,handler:source.slice(a.value?.start||a.start,a.value?.end||a.end)}));
  if(!handlers.length)handlers.push({event:'implicit',handler:tag==='button'&&!attrs.some(a=>a.name?.name==='type'&&a.value?.value==='button')?submitHandler:''});
  const semantics=handlers.map(h=>({...h,intent:classifyUiOperation({tag,...h,file:name,submitHandler})}));
  for(const s of semantics)if(!OPERATION_INTENTS.includes(s.intent))errors.push(`Unknown intent: ${name}:${node.loc.start.line}`);
  inventory.push({file:name,line:node.loc.start.line,tag,domain,contract:OPERATION_DOMAINS[domain],semantics,sourceHash:createHash('sha256').update(source.slice(node.start,node.end)).digest('hex'),evidence:'SOURCE_CLASSIFICATION',runtimeVerification:'T07/T08; delegated callbacks require caller and API authorization, never treated as permission grants'});
 }});
}
const counts=Object.fromEntries(OPERATION_INTENTS.map(intent=>[intent,inventory.filter(r=>r.semantics.some(s=>s.intent===intent)).length]));
for(const row of inventory)if(row.semantics.some(s=>s.intent==='DELEGATED_ACTION')){
 const file=path.basename(row.file),contract=UI_DELEGATION_CONTRACTS[file];
 row.callerBoundaries=callers.filter(c=>c.component===file.replace(/\.(jsx|js)$/,'')&&c.file!==row.file);row.delegationContract=contract;
 for(const s of row.semantics.filter(s=>s.intent==='DELEGATED_ACTION'))if(!contract?.handlers.includes(s.handler.replace(/\s+/g,'')))errors.push(`Unreviewed callback boundary: ${row.file}:${row.line} ${s.handler}`);
}
const report={generatedAt:new Date().toISOString(),controls:inventory.length,counts,domains:OPERATION_DOMAINS,inventory,limits:'Source-derived classification is an audit index, not authorization or proof of runtime behavior. DELEGATED_ACTION identifies a callback/wrapper boundary explicitly; business authorization remains at the caller/API/service. A mixed component can contain multiple intents. UAT and policy combinations remain in the test matrix.'};
if(process.argv.includes('--write'))fs.writeFileSync(path.join(root,'docs/SYSTEM_UI_SEMANTICS.json'),JSON.stringify(report,null,2)+'\n');
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(`UI semantics index: ${inventory.length} controls, ${Object.keys(OPERATION_DOMAINS).length} domain contracts; ${counts.DELEGATED_ACTION} delegated boundaries (not runtime proof).`);
