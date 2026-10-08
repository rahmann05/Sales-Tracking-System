import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const client=fileURLToPath(new URL('../../client/',import.meta.url)),require=createRequire(new URL('../../client/package.json',import.meta.url));
const {build}=require('esbuild');
const result=await build({absWorkingDir:client,bundle:true,platform:'node',format:'cjs',write:false,loader:{'.css':'empty'},plugins:[{name:'context',setup(build){build.onResolve({filter:/context\/AppContext$/},()=>({path:'context',namespace:'fixture'}));build.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:'export const useApp=()=>globalThis.logisticsTestContext;',loader:'js'}));}}],stdin:{resolveDir:client,loader:'jsx',contents:`
import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import assert from 'node:assert/strict';
import {getLogisticsNavigationGroups} from './src/constants/logisticsNavigation';
import {isTabPermissionAllowed,TAB_IDS} from './src/constants/navigation';
import {WarehousePage} from './src/pages/Warehouse/WarehousePage';import {DriverPage} from './src/pages/Driver/DriverPage';
for(const [role,Page,count] of [['KEPALA_GUDANG',WarehousePage,6],['SUPIR',DriverPage,2]]){
 const user={role,permissions:{}};globalThis.logisticsTestContext={user,setActiveTab:()=>{}};
 const groups=getLogisticsNavigationGroups(user),ids=groups.flatMap(g=>g.items.map(i=>i.id));assert.equal(groups.length,count);assert.equal(new Set(ids).size,ids.length);assert.ok(!ids.includes(TAB_IDS.DASHBOARD));
 const markup=renderToStaticMarkup(<Page/>);assert.equal((markup.match(/class="admin-module-card"/g)||[]).length,count);assert.equal((markup.match(/<button/g)||[]).length,count);assert.doesNotMatch(markup,/sidebar|Rute Pengiriman Hari Ini|Saldo piutang|stok tersedia/);
}
const denied=getLogisticsNavigationGroups({role:'KEPALA_GUDANG',permissions:{can_manage_packing_list:false,can_manage_delivery_routes:false,can_monitor_delivery:false}}).flatMap(g=>g.items.map(i=>i.id));for(const id of [TAB_IDS.DELIVERY_PACKING_LIST,TAB_IDS.DELIVERY_ROUTES,TAB_IDS.DELIVERY_MONITOR,TAB_IDS.WAREHOUSE_ATTENTION])assert.ok(!denied.includes(id));
assert.equal(getLogisticsNavigationGroups({role:'SUPIR',permissions:{can_access_driver_map:false}}).length,0);
for(const role of ['ADMIN','SUPERVISOR','SALES']){assert.deepEqual(getLogisticsNavigationGroups({role}),[]);for(const id of [TAB_IDS.WAREHOUSE_ATTENTION,TAB_IDS.WAREHOUSE_VEHICLES,TAB_IDS.WAREHOUSE_ATTENDANCE,TAB_IDS.DRIVER_TRIPS])assert.equal(isTabPermissionAllowed(id,{role}),false);}
`}});
new Function('require','module','exports',result.outputFiles[0].text)(require,{exports:{}},{});
console.log('Logistics UI verification passed: unique role menus, no duplicate home navigation, explicit permissions and role-only pages.');
