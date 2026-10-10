import test from 'node:test';
import assert from 'node:assert/strict';

// Minimal asynchronous IndexedDB boundary. Tests execute the actual worker event
// handlers and network requests, without requiring browser or database access.
function memoryIndexedDb(){
 const rows=new Map();
 return {rows,open(){
  const request={};
  setTimeout(()=>{request.result={close(){},transaction(){
   const tx={};let pending=0,timer;
   const finish=()=>{clearTimeout(timer);timer=setTimeout(()=>{if(!pending)tx.oncomplete?.();},0);};
   const action=work=>{pending++;const result={};setTimeout(()=>{try{result.result=work();result.onsuccess?.();}catch(error){tx.error=error;tx.onerror?.();}finally{pending--;finish();}},0);return result;};
   tx.objectStore=()=>({get:id=>action(()=>structuredClone(rows.get(id))),getAll:()=>action(()=>structuredClone([...rows.values()])),put:row=>action(()=>rows.set(row.id,structuredClone(row))),delete:id=>action(()=>rows.delete(id))});
   finish();return tx;
  }};request.onsuccess?.();},0);
  return request;
 }};
}
test('Worker isolates accounts, stops on validation, preserves manual confirmation and cannot resume cancelled evidence',async()=>{
 const originals=Object.fromEntries(['indexedDB','skipWaiting','addEventListener','clients','fetch'].map(key=>[key,globalThis[key]]));
 const db=memoryIndexedDb(),listeners=new Map(),sent=[];
 Object.assign(globalThis,{indexedDB:db,skipWaiting:async()=>{},addEventListener:(name,handler)=>listeners.set(name,handler),clients:{claim:async()=>{},matchAll:async()=>[]},fetch:async(url,options)=>{sent.push({url,options});return {ok:false,status:422,json:async()=>({message:'GPS kedaluwarsa'})};}});
 try{
  await import(`../../client/public/driver-evidence-worker.mjs?lifecycle=${Date.now()}`);
  const send=async data=>{let result,done;listeners.get('message')({data,ports:[{postMessage:value=>{result=value;}}],waitUntil:promise=>{done=promise;}});await done;return result;};
  const session=(actorId,enabled=false)=>({type:'SESSION',actorId,token:`token-${actorId}`,baseUrl:'https://example.test/api/v1',enabled});
  const job=(actorId,id)=>({actorId,requestId:id,body:{requestId:id,photo:'original-photo',gps:{lat:-6,lng:107}},method:'POST',endpoint:'/delivery/stops/stop/attendance',draftKey:`form-draft:${actorId}:driver-evidence:stop:IN`});
  const enqueue=async(actorId,id)=>send({type:'ENQUEUE',actorId,job:job(actorId,id)});
  await send(session('a',true));await enqueue('a','one');
  assert.equal(sent.length,1);assert.equal(sent[0].options.headers.Authorization,'Bearer token-a');
  assert.equal(JSON.parse(sent[0].options.body).photo,'original-photo');
  assert.equal(db.rows.get('a:one').state,'NEEDS_REVIEW');
  await send({type:'DRAIN',actorId:'a'});await send({type:'RESUME',actorId:'a',requestId:'one'});await send({type:'DRAIN',actorId:'a'});
  assert.equal(sent.length,1,'validation failures require deliberate correction, never automatic retry');
  await send(session('b'));
  assert.deepEqual((await send({type:'LIST',actorId:'b'})).rows,[]);
  assert.match((await send({type:'LIST',actorId:'a'})).error,/pemilik/);
  await send({type:'FORGET_SESSION',token:'token-a'});
  assert.equal(db.rows.get('__session').actorId,'b','late logout cannot erase a newer account session');
  await send({type:'FORGET_SESSION',token:'token-b'});
  assert.match((await send({type:'DRAIN',actorId:'b'})).error,/pemilik/);
  await send(session('a',true));
  // Enqueue receives a validation failure, then cancellation becomes terminal.
  await enqueue('a','two');await send({type:'CANCELLED',actorId:'a',requestId:'two'});
  await send({type:'RESUME',actorId:'a',requestId:'two'});await send({type:'DRAIN',actorId:'a'});
  assert.equal(db.rows.get('a:two').state,'CANCELLED');assert.equal(db.rows.get('a:two').body,undefined);
  // Simulate an old network attempt completing after a manual receipt was acknowledged.
  let release,started;const began=new Promise(resolve=>{started=resolve;});
  globalThis.fetch=async()=>{started();await new Promise(resolve=>{release=resolve;});return {ok:false,status:503,json:async()=>({message:'Temporary error'})};};
  const inFlight=enqueue('a','three');await began;
  await send({type:'ACK',actorId:'a',requestId:'three'});release();await inFlight;
  assert.equal(db.rows.get('a:three').state,'CONFIRMED');assert.equal(db.rows.get('a:three').body,undefined);
  assert.ok(!(await send({type:'LIST',actorId:'a'})).rows.some(row=>'body' in row),'list never exposes proof payloads');
 }finally{for(const [key,value]of Object.entries(originals)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
});
