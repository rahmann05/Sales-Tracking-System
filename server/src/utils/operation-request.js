import {createHash} from 'node:crypto';
import {AppError} from './errors.js';
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().filter(key=>value[key]!==undefined).map(key=>[key,stable(value[key])])):value;
export const operationHash=data=>createHash('sha256').update(JSON.stringify(stable(data))).digest('hex');
export async function existingOperation(db,model,requestId,hash,userId,{lock=false,include}={}){
 if(!requestId)return null;
 if(lock)await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`operation:${model}:${requestId}`}))`;
 const record=await db[model].findUnique({where:{requestId},...(include?{include}:{})});
 if(!record)return null;
 if(record.createdById!==userId||record.requestHash!==hash)throw new AppError('Permintaan ini sudah digunakan untuk isi berbeda. Periksa dokumen yang sebelumnya disimpan.',409);
 return record;
}
