import {calculateNameSimilarity} from './calculate-name-similarity.service.js';
import {calculateAddressSimilarity} from './calculate-address-similarity.service.js';
import {calculateDistanceMeters} from '../../../utils/geolocation.js';
import {knownPoint,outletIssues,outletNameUnusable,OUTLET_DIGITAL_VERSION as DIGITAL_OUTLET_VERSION} from '../../../../../shared/outlet-validation.mjs';
import {extractAddressTokens} from './outlet-validation.helpers.js';
export {DIGITAL_OUTLET_VERSION};
const digits=s=>String(s||'').match(/\d+/g)?.join(',')||'';
const house=s=>String(s||'').match(/\b(?:no\.?|nomor)\s*(\d+[a-z]?)/i)?.[1]?.toLowerCase();
const locality=s=>String(s||'').toLowerCase().replace(/\b(kota|kabupaten|kab)\b/g,'').replace(/[^a-z0-9]/g,'');
export function evaluateDigitalOutlet(outlet,candidates,steps,values={},chosenId){
 const ranked=candidates.map(c=>{
  const name=outletNameUnusable(outlet.name)?0:calculateNameSimilarity(outlet.name,c.name),address=calculateAddressSimilarity(outlet.address,c.address);
  const phone=outlet.phone&&c.phone?outlet.phone.replace(/\D/g,'').replace(/^0/,'62')===c.phone.replace(/\D/g,'').replace(/^0/,'62'):null;
  const distanceMeters=knownPoint(outlet)&&knownPoint(c)?calculateDistanceMeters(outlet.latitude,outlet.longitude,c.latitude,c.longitude):null;
  const closed=String(c.businessStatus).startsWith('CLOSED'),conflicts=[];
  if(phone===false)conflicts.push('Nomor telepon usaha berbeda');
  if(closed)conflicts.push(c.movedPlaceId?'Profil usaha berpindah':'Profil usaha ditandai tutup');
  if(c.movedPlaceId&&!closed)conflicts.push('Profil usaha memiliki lokasi pengganti yang belum ditinjau');
  if(digits(outlet.name)&&digits(c.name)&&digits(outlet.name)!==digits(c.name))conflicts.push('Nomor/cabang pada nama berbeda');
  if(house(outlet.address)&&house(c.address)&&house(outlet.address)!==house(c.address))conflicts.push('Nomor alamat berbeda');
  const city=outlet.address?.match(/\b(?:kota|kabupaten)\s+([^,]+)/i)?.[1];
  if(city&&c.city&&!locality(city).includes(locality(c.city))&&!locality(c.city).includes(locality(city)))conflicts.push('Kota/kabupaten pada alamat berbeda');
  const score=Math.round((name*.55+address*.4+(phone===true?.05:0))*100);
  return {...c,nameScore:Math.round(name*100),addressScore:Math.round(address*100),phoneMatch:phone,distanceMeters:distanceMeters==null?null:Math.round(distanceMeters),score,conflicts};
 }).sort((a,b)=>b.score-a.score);
 const candidate=chosenId?ranked.find(c=>c.placeId===chosenId):ranked[0],other=ranked.filter(c=>c.placeId!==candidate?.placeId)[0];
 const reasons=[],issues=outletIssues(outlet),failures=steps.filter(s=>s.state==='ERROR');
 let code='NOT_FOUND',identity='UNCONFIRMED',location='UNKNOWN';
 if(candidate){
  const unique=!other||candidate.score-other.score>=Number(values.OUTLET_REVIEW_CANDIDATE_GAP??15);
  const specific=[...extractAddressTokens(outlet.address||'')].filter(t=>/[a-z]/i.test(t)&&t.length>=3).length>=2;
  const strong=candidate.detailsConfirmed!==false&&specific&&!issues.includes('INCOMPLETE_ADDRESS')&&(!issues.includes('UNCLEAR_NAME')||candidate.phoneMatch===true)&&candidate.nameScore>=Number(values.OUTLET_REVIEW_STRONG_NAME_PERCENT??90)&&candidate.addressScore>=Number(values.OUTLET_REVIEW_STRONG_ADDRESS_PERCENT??80)&&knownPoint(candidate)&&!candidate.conflicts.length;
  identity=strong?'STRONG':'REVIEW';location=knownPoint(candidate)?'CANDIDATE':'UNKNOWN';code=!unique?'AMBIGUOUS':strong?'STRONG':'REVIEW';
  reasons.push(`Kemiripan nama ${candidate.nameScore}%; alamat ${candidate.addressScore}%.`);
  if(!unique)reasons.push('Ada kandidat alternatif dengan kekuatan bukti yang mendekati.');
  if(issues.includes('INCOMPLETE_ADDRESS'))reasons.push('Alamat master belum cukup spesifik untuk mengonfirmasi outlet.');
  if(issues.includes('UNCLEAR_NAME')&&candidate.phoneMatch!==true)reasons.push('Nama master belum jelas dan tidak ada kecocokan telepon usaha yang mendukung.');
  if(candidate.distanceMeters!=null&&candidate.distanceMeters>Number(values.VALIDATION_DISTANCE_SUSPECT??500))reasons.push('Kandidat jauh dari master; jarak tidak menggugurkan identitas ketika titik lama diragukan.');
  reasons.push(...candidate.conflicts);
  if(strong&&!knownPoint(outlet))reasons.push('Identitas/lokasi Google ditemukan tanpa koordinat master.');
 }else if(steps.some(s=>s.kind==='GEOCODE'&&s.state==='SUCCESS')){code='ADDRESS_ONLY';location='ADDRESS';reasons.push('Alamat ditemukan; identitas toko belum terkonfirmasi.');}
 else if(failures.length)code='ERROR';else if(steps.every(s=>s.state==='SKIPPED'))code='INCOMPLETE';
 const aligned=code==='STRONG'&&candidate.distanceMeters!=null&&candidate.distanceMeters<=Number(values.VALIDATION_DISTANCE_WARNING??200)&&!issues.includes('UNCONFIRMED_POINT');
 const checkedAt=new Date().toISOString(),days=Number(values.OUTLET_REVIEW_EVIDENCE_DAYS??7);
 return {method:'GOOGLE_ADAPTIVE_V3',version:DIGITAL_OUTLET_VERSION,code,identity,location,aligned,selectedPlaceId:candidate?.placeId||null,reasons,issues,technical:failures.length?'PARTIAL':'READY',steps,checkedAt,expiresAt:days>0?new Date(Date.now()+days*86400000).toISOString():null,providerExpiresAt:new Date(Date.now()+Math.min(days||30,30)*86400000).toISOString(),calls:steps.filter(s=>s.called).length,candidates:ranked,comparisonPolicy:{strongName:values.OUTLET_REVIEW_STRONG_NAME_PERCENT??90,strongAddress:values.OUTLET_REVIEW_STRONG_ADDRESS_PERCENT??80,candidateGap:values.OUTLET_REVIEW_CANDIDATE_GAP??15}};
}
export function durableDigitalResult(result){const {candidates,...rest}=result;return {...rest,candidateIds:candidates.map(c=>c.placeId),assessments:candidates.map(({placeId,nameScore,addressScore,phoneMatch,score,conflicts})=>({placeId,nameScore,addressScore,phoneMatch,score,conflicts}))};}
