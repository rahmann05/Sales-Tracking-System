import {CONFIG_DEFAULTS} from '../../../../../shared/config.mjs';
import {outletOperationalPoint} from '../../../../../shared/outlet-location.mjs';
import {getDynamicConfig} from '../../config/config.service.js';
import {resolveRoadRoute} from '../../routing/routing.service.js';
import {AppError} from '../../../utils/errors.js';

const finite=point=>point&&point.latitude!=null&&point.longitude!=null&&Number.isFinite(Number(point.latitude))&&Number.isFinite(Number(point.longitude))&&Math.abs(Number(point.latitude))<=90&&Math.abs(Number(point.longitude))<=180;
export const km=value=>Math.round(value*1000)/1000;
export function mileagePoint(outlet,orderPoint){
 const order=orderPoint&&orderPoint.outletId===outlet.id&&finite(orderPoint)?orderPoint:null;
 const source=order||outletOperationalPoint(outlet);
 return finite(source)?{latitude:Number(source.latitude),longitude:Number(source.longitude),source:order?'ORDER_SNAPSHOT':source.source||'OUTLET_MASTER',googleMapsOnly:source.googleMapsOnly===true||String(source.source||'').startsWith('GOOGLE'),outletId:outlet.id}:null;
}
export async function createVehicleMileagePlan(stops,{office,returnOffice,roadResolver=resolveRoadRoute,allowPending=false}={}){
 const depot=office||{latitude:Number(await getDynamicConfig('DEFAULT_OFFICE_LATITUDE',CONFIG_DEFAULTS.DEFAULT_OFFICE_LATITUDE)),longitude:Number(await getDynamicConfig('DEFAULT_OFFICE_LONGITUDE',CONFIG_DEFAULTS.DEFAULT_OFFICE_LONGITUDE))};
 const returnDepot=returnOffice||depot;
 const points=stops.map(stop=>({sequence:stop.sequence,outletId:stop.outletId,packingListId:stop.packingListId,...(stop.point||{})}));
 const waypoints=[depot,...points,returnDepot];
 let legs=waypoints.slice(1).map((point,index)=>({from:index===0?'DEPOT':points[index-1].outletId,to:index===points.length?'DEPOT':points[index].outletId,distanceKm:null}));
 let source='ROAD_PENDING';
 if(waypoints.every(finite)){
  try{
   const resolved=await roadResolver(waypoints.map(point=>({lat:point.latitude,lng:point.longitude,googleMapsOnly:point.googleMapsOnly===true})));
   if(resolved.legs.length===legs.length&&resolved.legs.every(leg=>Number.isFinite(leg.distanceKm)&&leg.distanceKm>=0)){
    legs=legs.map((leg,index)=>({...leg,distanceKm:km(resolved.legs[index].distanceKm)}));
    source=resolved.provider==='google'?'GOOGLE_ROAD':resolved.provider==='osrm'?'OSRM_ROAD':'ROAD_ESTIMATE';
   }
  }catch{/* Leave the distance pending; a straight line is not a road distance. */}
 }
 if(source==='ROAD_PENDING'&&!allowPending)throw new AppError('Rute jalan untuk semua tujuan belum tersedia. Coba lagi saat Google/OSRM dapat menghitung perjalanan; jarak garis lurus tidak dipakai.',503);
 return {version:1,createdAt:new Date().toISOString(),source,depot:{id:depot.id||null,name:depot.name||null,latitude:depot.latitude,longitude:depot.longitude},returnDepot:{id:returnDepot.id||null,name:returnDepot.name||null,latitude:returnDepot.latitude,longitude:returnDepot.longitude},points,legs,totalKm:legs.every(leg=>leg.distanceKm!=null)?km(legs.reduce((sum,leg)=>sum+leg.distanceKm,0)):null};
}
export function mileageLeg(plan,previousOutletId,outletId){
 const current=plan?.points?.find(point=>point.outletId===outletId);
 const previous=previousOutletId?plan?.points?.find(point=>point.outletId===previousOutletId):plan?.actualDeparture||plan?.depot;
 if(!current||!previous)return {distanceKm:null,source:'MISSING_POINT'};
 if(previousOutletId===outletId)return {distanceKm:0,source:'SAME_DESTINATION'};
 const fromId=previousOutletId|| (plan.actualDeparture?'START':'DEPOT');
 const actual=plan.actualLegs?.find(leg=>!leg.key&&leg.from===fromId&&leg.to===outletId);
 if(actual?.distanceKm!=null)return {distanceKm:actual.distanceKm,source:actual.source};
 const cached=plan.actualDeparture?null:plan.legs?.find(leg=>leg.from===fromId&&leg.to===outletId);
 if(cached?.distanceKm!=null)return {distanceKm:cached.distanceKm,source:plan.source};
 return {distanceKm:null,source:'ROAD_PENDING'};
}
export function returnMileageLeg(plan,previousOutletId){
 if(!previousOutletId)return {distanceKm:0,source:'NO_DESTINATION'};
 const previous=plan?.points?.find(point=>point.outletId===previousOutletId);
 const destination=plan?.actualReturn||plan?.returnDepot||plan?.depot;
 if(!previous||!destination)return {distanceKm:null,source:'MISSING_POINT'};
 const toId=plan.actualReturn?'RETURN':'DEPOT';
 const cached=plan.actualReturn?null:plan.legs?.find(leg=>leg.from===previousOutletId&&leg.to==='DEPOT');
 const actual=plan.actualLegs?.find(leg=>!leg.key&&leg.from===previousOutletId&&leg.to===toId);
 if(actual?.distanceKm!=null)return {distanceKm:actual.distanceKm,source:actual.source};
 if(cached?.distanceKm!=null)return {distanceKm:cached.distanceKm,source:plan.source};
 return {distanceKm:null,source:'ROAD_PENDING'};
}
export async function actualMileageLeg(plan,previousOutletId,outletId,{roadResolver=resolveRoadRoute}={}){
 const fromId=previousOutletId||(plan.actualDeparture?'START':'DEPOT'),toId=outletId||(plan.actualReturn?'RETURN':'DEPOT');
 const from=previousOutletId?plan?.points?.find(point=>point.outletId===previousOutletId):plan?.actualDeparture||plan?.depot;
 const to=outletId?plan?.points?.find(point=>point.outletId===outletId):plan?.actualReturn||plan?.returnDepot||plan?.depot;
 return actualMileageLegWithPoints(plan,previousOutletId,outletId,{roadResolver,fromPoint:from,toPoint:to,fromId,toId});
}
export async function actualMileageLegWithPoints(plan,previousOutletId,outletId,{roadResolver=resolveRoadRoute,fromPoint,toPoint,fromId=previousOutletId||(plan.actualDeparture?'START':'DEPOT'),toId=outletId||(plan.actualReturn?'RETURN':'DEPOT')}={}){
 const plannedFrom=previousOutletId?plan?.points?.find(point=>point.outletId===previousOutletId):plan?.actualDeparture||plan?.depot;
 const plannedTo=outletId?plan?.points?.find(point=>point.outletId===outletId):plan?.actualReturn||plan?.returnDepot||plan?.depot;
 const from=fromPoint||plannedFrom,to=toPoint||plannedTo;
 const pointKey=point=>finite(point)?`${Number(point.latitude).toFixed(6)},${Number(point.longitude).toFixed(6)}`:null;
 const coordinateOverride=pointKey(from)!==pointKey(plannedFrom)||pointKey(to)!==pointKey(plannedTo);
 const key=`${fromId}|${toId}|${pointKey(from)}|${pointKey(to)}`;
 const exact=plan?.actualLegs?.find(leg=>leg.key===key);
 if(exact?.distanceKm!=null)return {leg:exact,plan};
 const cached=coordinateOverride?{distanceKm:null,source:'ROAD_PENDING'}:outletId?mileageLeg(plan,previousOutletId,outletId):returnMileageLeg(plan,previousOutletId);
 if(cached.source!=='ROAD_PENDING'||fromId===toId&&pointKey(from)===pointKey(to))return {leg:cached,plan};
 if(!finite(from)||!finite(to))return {leg:{distanceKm:null,source:'MISSING_POINT'},plan};
 try{
  const result=await roadResolver([from,to].map(point=>({lat:point.latitude,lng:point.longitude,googleMapsOnly:point.googleMapsOnly===true})));
  const value=result.legs?.[0]?.distanceKm;
  if(!Number.isFinite(value)||value<0)throw new Error('Missing road leg');
  const leg={key,from:fromId,to:toId,fromPoint:from,toPoint:to,distanceKm:km(value),source:result.provider==='google'?'GOOGLE_ROAD':result.provider==='osrm'?'OSRM_ROAD':'ROAD_ESTIMATE'};
  return {leg,plan:{...plan,actualLegs:[...(plan.actualLegs||[]),leg]}};
 }catch{return {leg:cached,plan};}
}
