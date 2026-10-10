import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {CONFIG_PARAMS,CONFIG_DEFINITIONS} from '../../shared/config.mjs';
import {requestFeature,TAB_FEATURES} from '../../shared/feature-policy.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),files=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())walk(file);else if(/\.(?:js|jsx|mjs)$/.test(file))files.push(file);}}
for(const dir of ['server/src','client/src','shared'])walk(path.join(root,dir));
const errors=[];
const source=new Map(files.map(file=>{
 const name=path.relative(root,file).replaceAll('\\','/');let text='';
 try{text=new TextDecoder('utf-8',{fatal:true}).decode(fs.readFileSync(file));}catch{errors.push(`Invalid UTF-8: ${name}`);}
 if(/\u00e2[\u20ac\u2020]|\u00c2\u00b7|\ufffd/.test(text))errors.push(`Broken display characters: ${name}`);
 return [name,text];
}));
// Every parameter group must be reachable in the Admin editor, not merely searchable in source.
const configNavigation=source.get('client/src/pages/Admin/AdminConfigNavigation.js')||'';
const editorGroups=[...configNavigation.matchAll(/groups:\[([^\]]*)\]/g)].flatMap(match=>[...match[1].matchAll(/'([^']+)'/g)].map(item=>item[1]));
editorGroups.push(...CONFIG_DEFINITIONS.filter(group=>group.groupKey.startsWith('CODING_')).map(group=>group.groupKey));
for(const group of CONFIG_DEFINITIONS){const count=editorGroups.filter(key=>key===group.groupKey).length;if(count!==1)errors.push(`Admin parameter group must appear exactly once: ${group.groupKey} (${count})`);}
const dynamicReaders={
 CODE_:'server/src/modules/config/services/business-code.service.js',
 SLA_:'server/src/modules/attention/attention-sla.service.js',
 WAREHOUSE_REQUIRE_:'shared/warehouse-policy.mjs',
 FEATURE_:'shared/feature-policy.mjs',
};
const consumers=CONFIG_PARAMS.map(param=>{
 const metadata=new Set(['shared/config.mjs','shared/operational-policy.mjs','shared/policy-guidance.mjs']);
 const readers=[...source].filter(([file,text])=>!metadata.has(file)&&!file.startsWith('server/src/scripts/')&&!file.startsWith('client/src/pages/Admin/')&&text.includes(param.key)).map(([file])=>file);
 // The registry also exports the actual visit evaluator. Count its body, never its declarations.
 if(source.get('shared/operational-policy.mjs')?.split('export function visitPolicy')[1]?.split('export function policyConflicts')[0]?.includes(param.key))readers.push('shared/operational-policy.mjs::visitPolicy');
 for(const [prefix,file] of Object.entries(dynamicReaders))if(param.key.startsWith(prefix)&&source.has(file))readers.push(file);
 if(!readers.length)errors.push(`Parameter has no registered consumer: ${param.key}`);
 return {key:param.key,readers:[...new Set(readers)]};
});
const index=source.get('server/src/routes/index.js'),imports=new Map([...index.matchAll(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g)].map(m=>[m[1],m[2]]));
const mounts=[...index.matchAll(/v1Router\.use\(['"]([^'"]+)['"],\s*(\w+)\)/g)].map(m=>[m[1],imports.get(m[2])]);
const governance=new Set(['health','auth','users','roles','attention','config','divisions']);
const endpoints=[];
function router(file,prefix){
 const text=fs.readFileSync(file,'utf8');
 for(const match of text.matchAll(/router\.(get|post|put|patch|delete)\(\s*['"]([^'"]+)['"]/g)){
  const url=`/api/v1${prefix}${match[2]==='/'?'':match[2]}`;
  const feature=requestFeature(url,match[1].toUpperCase());
  const module=prefix.split('/')[1];
  const classification=feature?{feature:feature[0],intent:feature[1]?'NEW_WORK':'READ_OR_EXISTING_WORK'}:governance.has(module)?{feature:'CORE',intent:'GOVERNANCE_OR_READ'}:null;
  if(!classification)errors.push(`Endpoint unclassified: ${match[1]} ${url}`);
  endpoints.push({method:match[1].toUpperCase(),url,...classification});
 }
 const children=new Map([...text.matchAll(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g)].map(m=>[m[1],m[2]]));
 for(const match of text.matchAll(/router\.use\(\s*['"]([^'"]+)['"],\s*(\w+)\)/g))if(children.has(match[2]))router(path.resolve(path.dirname(file),children.get(match[2])),prefix+match[1]);
}
for(const [prefix,relative] of mounts)router(path.resolve(root,'server/src/routes',relative),prefix);
const navigation=source.get('client/src/constants/navigation.js');
const tabBlock=navigation.split('export const TAB_IDS = Object.freeze({')[1]?.split('});')[0]||'';
const coreTabs=new Set(['role-workspace','warehouse-attention','warehouse-attendance','spv-monitor','spv-approval','spv-attention','admin-approval','admin-attention','admin-attendance','admin-masters','system-config','user-management']);
const tabs=[...tabBlock.matchAll(/:\s*'([^']+)'/g)].map(m=>({id:m[1],feature:TAB_FEATURES[m[1]]|| (coreTabs.has(m[1])?'CORE':null)}));
for(const tab of tabs)if(!tab.feature)errors.push(`Tab unclassified: ${tab.id}`);
if(!endpoints.length)errors.push('No endpoints discovered; router parser needs updating.');
const report={generatedAt:new Date().toISOString(),counts:{parameters:consumers.length,endpoints:endpoints.length,tabs:tabs.length},consumers,endpoints,tabs,limits:'Static coverage detects missing registration/readers, not semantic correctness. Multi-action routes require runtime cases; physical GPS, offline and multi-instance UAT remain separate.'};
if(process.argv.includes('--write'))fs.writeFileSync(path.join(root,'docs/SYSTEM_CONFIGURATION_COVERAGE.json'),JSON.stringify(report,null,2)+'\n');
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(`Policy coverage passed: ${consumers.length} parameters, ${endpoints.length} endpoints, ${tabs.length} tabs classified. Static checks do not replace workflow tests.`);
