import pg from 'pg';
import {createAdapter} from '@socket.io/postgres-adapter';
const states=new WeakMap();
export const socketAdapterStatus=io=>states.get(io)||{mode:'MEMORY',state:'LOCAL_ONLY'};
// LISTEN requires a session connection; a transaction pooler cannot own the subscription.
export function socketAdapterOptions(env=process.env){
 const mode=env.SOCKET_ADAPTER||'MEMORY';
 if(!['MEMORY','POSTGRES'].includes(mode))throw new Error('SOCKET_ADAPTER harus MEMORY atau POSTGRES.');
 const url=env.SOCKET_DATABASE_URL||env.DIRECT_URL;
 if(mode==='POSTGRES'){
  if(!url)throw new Error('Adapter POSTGRES memerlukan SOCKET_DATABASE_URL atau DIRECT_URL.');
  const parsed=new URL(url);
  if(!['postgres:','postgresql:'].includes(parsed.protocol)||/-pooler\./.test(parsed.hostname)||parsed.searchParams.get('pgbouncer')==='true')throw new Error('Adapter socket memerlukan koneksi PostgreSQL langsung, bukan transaction pooler.');
 }
 return {mode,url};
}
export async function configureSocketAdapter(io,options=socketAdapterOptions()){
 const {mode,url,tableName='socket_io_attachments',channelPrefix='sinar.socket'}=options;
 if(mode==='MEMORY'){states.set(io,{mode,state:'LOCAL_ONLY'});return async()=>{};}
 if(mode!=='POSTGRES'||!url||!/^\w+$/.test(tableName))throw new Error('Konfigurasi adapter socket tidak valid.');
 const state={mode,state:'CONNECTING',lastErrorAt:null};states.set(io,state);
 const pool=new pg.Pool({connectionString:url,max:3,connectionTimeoutMillis:10000,application_name:'sinar-socket-adapter'});
 const failed=()=>{state.state='DEGRADED';state.lastErrorAt=new Date().toISOString();console.error('[Socket.IO]: Adapter PostgreSQL terganggu; inbox tetap tersedia.');};
 pool.on('error',failed);
 try{
  await pool.query(`SELECT id FROM "${tableName}" LIMIT 0`);
  io.adapter(createAdapter(pool,{tableName,channelPrefix,errorHandler:failed}));
  state.state='CONFIGURED';
 }catch{
  await pool.end();state.state='FAILED';
  throw new Error('Adapter socket belum siap. Periksa koneksi langsung dan migrasi socket_io_attachments.');
 }
 // A successful SQL query alone does not prove that another replica received an event.
 return async()=>{state.state='STOPPED';await pool.end();};
}
