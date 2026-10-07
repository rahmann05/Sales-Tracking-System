import {test} from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import {prisma} from '../src/config/prisma.js';
import {config} from '../src/config/index.js';
import {authenticate} from '../src/middlewares/auth.middleware.js';
import {refreshAccessToken} from '../src/modules/auth/services/refresh-access-token.service.js';
import {getDynamicConfig,invalidateConfigCache} from '../src/modules/config/services/dynamic-config.service.js';
import {errorHandler} from '../src/middlewares/errorHandler.middleware.js';
function replace(t,model,method,fn){const original=model[method];model[method]=fn;t.after(()=>{model[method]=original;invalidateConfigCache();});}
test('Database failure during authenticate/refresh is not mislabeled as an expired token',async t=>{
 const databaseError=Object.assign(new Error('database unavailable'),{code:'P1001'});
 replace(t,prisma.user,'findUnique',async()=>{throw databaseError;});
 const token=jwt.sign({id:'user'},config.jwtSecret,{expiresIn:'1h'});
 await authenticate({headers:{authorization:`Bearer ${token}`}}, {}, error=>assert.equal(error,databaseError));
 const refresh=jwt.sign({id:'user'},config.jwtRefreshSecret,{expiresIn:'1h'});
 await assert.rejects(refreshAccessToken(refresh),error=>error===databaseError);
 let status,body;const res={status(value){status=value;return this;},json(value){body=value;return this;}};
 const previous=console.error;console.error=()=>{};try{errorHandler(databaseError,{},res,()=>{});}finally{console.error=previous;}
 assert.equal(status,503);assert.match(body.message,/Database/);
});
test('Runtime configuration cold start shares one query and preserves zero/false',async t=>{
 let queries=0;replace(t,prisma.systemConfig,'findMany',async()=>{queries++;await new Promise(resolve=>setTimeout(resolve,5));return [{key:'SALES_WEEKLY_TARGET_AMOUNT',value:0},{key:'OFF_PJP_ENABLED',value:false}];});
 invalidateConfigCache();
 const values=await Promise.all(Array.from({length:100},(_,i)=>getDynamicConfig(i%2?'OFF_PJP_ENABLED':'SALES_WEEKLY_TARGET_AMOUNT',i%2?true:100)));
 assert.equal(queries,1);assert.equal(values[0],0);assert.equal(values[1],false);
});
test('Configuration invalidation rejects an obsolete in-flight snapshot',async t=>{
 let release,queries=0;replace(t,prisma.systemConfig,'findMany',()=>{queries++;if(queries===1)return new Promise(resolve=>{release=resolve;});return Promise.resolve([{key:'OFF_PJP_ENABLED',value:false}]);});
 invalidateConfigCache();const old=getDynamicConfig('OFF_PJP_ENABLED',true);invalidateConfigCache();
 assert.equal(await getDynamicConfig('OFF_PJP_ENABLED',true),false);release([{key:'OFF_PJP_ENABLED',value:true}]);assert.equal(await old,false);assert.equal(queries,2);
});

test('Signed token without account id is rejected before a database query',async t=>{
 let queries=0;replace(t,prisma.user,'findUnique',async()=>{queries++;throw new Error('must not query');});
 const token=jwt.sign({userId:'old-shape'},config.jwtSecret,{expiresIn:'1h'});
 await authenticate({headers:{authorization:'Bearer '+token}},{},error=>assert.equal(error.statusCode,401));
 const refresh=jwt.sign({userId:'old-shape'},config.jwtRefreshSecret,{expiresIn:'1h'});
 await assert.rejects(refreshAccessToken(refresh),error=>error.statusCode===401);
 assert.equal(queries,0);
});
