import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const client=fileURLToPath(new URL('../../client/',import.meta.url)),require=createRequire(path.join(client,'package.json'));
const esbuild=require('esbuild');
const result=await esbuild.build({absWorkingDir:client,bundle:true,platform:'node',format:'cjs',write:false,define:{'import.meta.env':'{}'},loader:{'.css':'empty'},plugins:[{name:'context-fixture',setup(build){build.onResolve({filter:/context\/AppContext(?:\.jsx)?$/},()=>({path:'context',namespace:'fixture'}));build.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:"import {CONFIG_DEFAULTS} from '../shared/config.mjs'; export const useApp=()=>({...globalThis.outletMonitoringFixture,settings:{...CONFIG_DEFAULTS,...globalThis.outletMonitoringFixture?.settings},settingsReady:true});",resolveDir:client,loader:'js'}));}}],stdin:{resolveDir:client,loader:'jsx',contents:`
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import assert from 'node:assert/strict';
import {OutletFieldHistory} from './src/pages/OutletValidation/components/OutletFieldHistory.jsx';
import {OutletFieldTaskFilters} from './src/pages/OutletValidation/components/OutletFieldTaskFilters.jsx';
import {FieldTaskReview} from './src/pages/OutletValidation/components/FieldTaskReview.jsx';
import {AttentionLocationActions} from './src/shared/components/common/AttentionLocationActions.jsx';
const proof={requestId:'proof-old',outcome:'FOUND',name:'Toko lama',address:'Jl Melati 12',note:'Bukti pertama',latitude:-6.9,longitude:107.6,photo:'data:image/jpeg;base64,YWJj'};
const task={id:'t',ownerId:'sales',reviewerId:'spv',status:'SUBMITTED',updatedAt:new Date().toISOString(),policySnapshot:{values:{OUTLET_FIELD_REVIEW_SLA_HOURS:24}},evidence:{...proof,requestId:'proof-new',name:'Toko baru'},history:[{action:'SUBMIT',at:'2026-10-09T08:00:00Z',actor:{name:'Sales satu'},evidence:proof},{action:'RETURN',at:'2026-10-09T09:00:00Z',actor:{name:'SPV satu'},reason:'Foto belum jelas, ambil ulang'},{action:'SUBMIT',at:'2026-10-10T08:00:00Z',evidence:{...proof,requestId:'proof-new',name:'Toko baru'}}]};
const history=renderToStaticMarkup(<OutletFieldHistory task={task}/>);assert.match(history,/2 versi bukti/);assert.match(history,/Toko lama/);assert.match(history,/Toko baru/);assert.match(history,/Foto belum jelas, ambil ulang/);assert.match(history,/bukti terbaru/);assert.match(history,/Lihat versi bukti #1/);
const filters={status:'ALL',search:'',ownerId:'',reviewerId:'',supervisorId:'',from:'',to:'',waitingHours:'0',overdue:'ALL'};
for(const role of ['ADMIN','SUPERVISOR','SALES']){const html=renderToStaticMarkup(<OutletFieldTaskFilters filters={filters} people={{sales:[{id:'s',name:'Sales A'}],teams:[{id:'spv',name:'Tim A'}]}} role={role} onChange={()=>{}}/>);assert.match(html,/Ditugaskan sejak/);assert.match(html,/Bukti menunggu pemeriksa/);if(role==='SALES')assert.doesNotMatch(html,/Sales pelaksana|Pemeriksa<select|Tim saat ini/);else assert.match(html,/Sales pelaksana/);if(role==='ADMIN')assert.match(html,/Tim saat ini/);else assert.doesNotMatch(html,/Tim saat ini/);}
for(const [id,role,canDecide] of [['spv','SUPERVISOR',true],['foreign','SUPERVISOR',false],['admin','ADMIN',true]]){globalThis.outletMonitoringFixture={user:{id,role,permissions:{can_review_outlet_field:true,can_validate_outlet:true}}};const html=renderToStaticMarkup(<FieldTaskReview task={task}/>);assert.equal(html.includes('Terima bukti'),canDecide);assert.match(html,/Bukti menunggu/);assert.match(html,/2 versi bukti/);}
globalThis.outletMonitoringFixture={user:{id:'spv',role:'SUPERVISOR',permissions:{can_run_outlet_review:true,can_validate_outlet:true}}};
const row={target:'OUTLET_LOCATION',reference:{outletId:'outlet'},locationAlert:{label:'Pembaruan Google gagal',usable:true,technical:true,impact:{todayPjp:1,todayVisits:2,openTrips:3}}};
let html=renderToStaticMarkup(<AttentionLocationActions row={row} onChanged={()=>{}}/>);assert.match(html,/Coba pembaruan Google/);assert.match(html,/2 kunjungan belum selesai pada 1 PJP hari ini/);assert.match(html,/Buka pemeriksaan lokasi/);
globalThis.outletMonitoringFixture.settings={FEATURE_OUTLET_REVIEW_MODE:'PAUSED'};html=renderToStaticMarkup(<AttentionLocationActions row={row} onChanged={()=>{}}/>);assert.doesNotMatch(html,/Coba pembaruan Google/);assert.match(html,/disabled/);
console.log('Outlet monitoring UI contracts passed: Admin/SPV/Sales filters, two proof versions, returned reason, reviewer authorization, impact and paused-feature actions (SSR, not device UAT).');
`}});
require('node:vm').runInThisContext(`(function(require){${result.outputFiles[0].text}\n})`)(require);
