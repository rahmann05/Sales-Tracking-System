const finitePoint=p=>Number.isFinite(p?.latitude)&&Number.isFinite(p?.longitude)&&Math.abs(p.latitude)<=90&&Math.abs(p.longitude)<=180;
export const nativeOutletPointTrusted=o=>finitePoint(o?.nativeLocation||o)&&['FIELD','GPS'].includes(o?.locationEvidence?.source);
export function googleLocationRefreshAt(cachedAt,expiresAt,hours){
 const ttl=+new Date(expiresAt)-+new Date(cachedAt),lead=Math.min(Number(hours)*3600000,ttl/2);
 return new Date(Math.max(+new Date(cachedAt)+3600000,+new Date(expiresAt)-lead)).toISOString();
}
export const outletLocationBasis=o=>Object.fromEntries(['name','address','latitude','longitude','clusterId','phone'].map(k=>[k,o?.nativeLocation&&k in o.nativeLocation?o.nativeLocation[k]:o?.[k]??null]));
export const sameOutletLocationBasis=(a,b)=>['name','address','latitude','longitude','clusterId','phone'].every(k=>(a?.[k]??null)===(b?.[k]??null));
export function outletOperationalPoint(o,now=Date.now()){
 if(!o)return {latitude:null,longitude:null,source:'MISSING',status:'MISSING',googleMapsOnly:false};
 const g=o.googleLocation;
 if(g&&g.status!=='SUPERSEDED'){
  const current=sameOutletLocationBasis(outletLocationBasis(o),g.basis);
  const active=g.status==='ACTIVE'&&current&&Number.isFinite(Date.parse(g.expiresAt))&&Date.parse(g.expiresAt)>+now&&finitePoint(g);
  return {latitude:active?g.latitude:null,longitude:active?g.longitude:null,source:'GOOGLE',status:!current?'CHANGED':active?'ACTIVE':g.status==='ACTIVE'?'EXPIRED':g.status,placeId:g.placeId,expiresAt:g.expiresAt,googleMapsOnly:true};
 }
 const native=o.nativeLocation||o;
 return {latitude:finitePoint(native)?native.latitude:null,longitude:finitePoint(native)?native.longitude:null,source:o.locationEvidence?.source||o.source||'INTERNAL',status:finitePoint(native)?'ACTIVE':'MISSING',googleMapsOnly:false};
}
export function projectOperationalOutlet(o,now=Date.now()){
 const p=outletOperationalPoint(o,now);
 return {...o,nativeLocation:o.nativeLocation||outletLocationBasis(o),latitude:p.latitude,longitude:p.longitude,operationalPoint:p,googleMapsOnly:p.googleMapsOnly};
}
export const operationalWaypoint=o=>{const p=outletOperationalPoint(o);return {lat:p.latitude,lng:p.longitude,googleMapsOnly:p.googleMapsOnly,outletId:o.id};};

// Operational responses contain nested outlets; master/edit responses keep their native coordinates.
export function projectOperationalData(value){
 if(Array.isArray(value))return value.map(projectOperationalData);
 if(!value||typeof value!=='object')return value;
 if(Object.hasOwn(value,'googleLocation')&&Object.hasOwn(value,'latitude'))return projectOperationalOutlet(value);
 return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,projectOperationalData(item)]));
}
