import {Prisma} from '@prisma/client';
// Descriptive provider content is transient. Only permitted IDs/coordinate cache is durable.
const descriptions=new Map();
export function rememberOutletCandidates(id,candidates){
 const now=Date.now();for(const [key,row] of descriptions)if(row.until<=now)descriptions.delete(key);
 if(descriptions.size>=200)descriptions.delete(descriptions.keys().next().value);
 descriptions.set(id,{candidates,until:now+15*60000});
}
export function presentOutletRun(run){
 if(!run.providerExpiresAt||+run.providerExpiresAt<=Date.now())return {...run,providerContent:null};
 const memory=descriptions.get(run.id);
 const candidates=run.providerContent?.candidates?.map(c=>({...c,...run.result?.assessments?.find(a=>a.placeId===c.placeId),...(memory?.until>Date.now()?memory.candidates.find(m=>m.placeId===c.placeId):{}),descriptionAvailable:memory?.until>Date.now()}))||[];
 return {...run,providerContent:{candidates}};
}
export async function purgeOutletProviderContent(db){
 for(const [id,row] of descriptions)if(row.until<=Date.now())descriptions.delete(id);
 return db.outletValidationRun.updateMany({where:{providerExpiresAt:{lte:new Date()}},data:{providerContent:Prisma.DbNull,providerExpiresAt:null}});
}
