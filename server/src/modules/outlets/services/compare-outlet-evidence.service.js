import { calculateDistanceMeters } from '../../../utils/geolocation.js';
import { calculateNameSimilarity } from './calculate-name-similarity.service.js';
import { calculateAddressSimilarity } from './calculate-address-similarity.service.js';
import {OUTLET_COMPARISON_DEFAULTS} from '../../../../../shared/outlet-evidence-policy.mjs';
const empty = new Set(['ZERO_RESULTS','NO_RESULTS','NO_CANDIDATES']);
const coords = p => Number.isFinite(p?.lat)&&Number.isFinite(p?.lng)&&Math.abs(p.lat)<=90&&Math.abs(p.lng)<=180;
const distance = (o,p) => coords(p)?Math.round(calculateDistanceMeters(o.latitude,o.longitude,p.lat,p.lng)):null;
export function compareOutletEvidence(outlet,raw,options={}) {
  const policy={...OUTLET_COMPARISON_DEFAULTS,suspectDistance:500,warningDistance:200,...options};
  const {suspectDistance,warningDistance,nameMatchPercent,addressMatchPercent,addressConflictPercent,alternativeNamePercent,ambiguityGapPercent,suggestionNamePercent}=policy;
  const warnings=[],signals={};
  for(const [key,r] of Object.entries(raw)) {
    if(!r.success) {signals[key]={state:empty.has(r.error)?'NO_EVIDENCE':'ERROR',error:r.error};continue;}
    const s={state:'EVIDENCE',googleAddress:r.formattedAddress || '',source:r.source || key};
    if(key==='reverseGeocode') {
      s.addressSimilarity=calculateAddressSimilarity(outlet.address,r.formattedAddress);
      s.state=s.addressSimilarity>=addressMatchPercent/100?'MATCH':s.addressSimilarity<addressConflictPercent/100?'CONFLICT':'AMBIGUOUS';
    } else if(key==='forwardGeocode') {
      s.distanceMeters=distance(outlet,r);s.googleLat=r.lat;s.googleLng=r.lng;
      s.locationType=r.locationType || 'UNKNOWN';s.partialMatch=Boolean(r.partialMatch);
      s.state=s.distanceMeters==null?'NO_EVIDENCE':s.distanceMeters>suspectDistance?'CONFLICT':s.partialMatch||!['ROOFTOP','RANGE_INTERPOLATED'].includes(s.locationType)?'AMBIGUOUS':'MATCH';
    } else if(key==='findPlace') {
      s.nameSimilarity=calculateNameSimilarity(outlet.name,r.placeName);s.googlePlaceName=r.placeName;s.placeId=r.placeId || null;
      s.googleLat=r.lat;s.googleLng=r.lng;s.distanceMeters=distance(outlet,r);s.businessStatus=r.businessStatus;
      const candidates=(r.candidates || []).map(p=>({...p,nameSimilarity:calculateNameSimilarity(outlet.name,p.placeName || p.name),distanceMeters:distance(outlet,p)}));
      s.candidates=candidates;
      const alternatives=candidates.filter(p=>p.placeId!==s.placeId&&p.nameSimilarity>=alternativeNamePercent/100&&p.distanceMeters!=null&&p.distanceMeters<=suspectDistance&&s.nameSimilarity-p.nameSimilarity<=ambiguityGapPercent/100);
      s.ambiguous=alternatives.length>0;
      s.state=s.distanceMeters==null?'NO_EVIDENCE':s.nameSimilarity<nameMatchPercent/100||s.ambiguous?'AMBIGUOUS':s.distanceMeters>suspectDistance?'CONFLICT':'MATCH';
      if(r.businessStatus?.startsWith('CLOSED')) {if(s.state!=='CONFLICT')s.state='AMBIGUOUS';warnings.push('Penyedia peta menandai kandidat tutup. Konfirmasi kondisi lapangan sebelum mengambil keputusan.');}
    } else {
      s.state='CONTEXT';s.places=(r.places || []).slice(0,20);
      s.note='Konteks sekitar titik master; tidak dihitung sebagai konfirmasi identitas yang independen.';
    }
    if(s.distanceMeters>warningDistance)warnings.push(`${key==='findPlace'?'Kandidat toko':'Titik berdasarkan alamat'} berjarak ${s.distanceMeters} m dari master.`);
    signals[key]=s;
  }
  const evidence=Object.values(signals).filter(s=>!['NO_EVIDENCE','CONTEXT'].includes(s.state));
  let code='NO_EVIDENCE';
  if(evidence.some(s=>s.state==='ERROR'))code='ERROR';
  else if(evidence.some(s=>s.state==='CONFLICT'))code='CONFLICT';
  else if(evidence.some(s=>s.state==='AMBIGUOUS'))code='AMBIGUOUS';
  else if(signals.forwardGeocode?.state==='MATCH'&&(signals.reverseGeocode?.state==='MATCH'||signals.findPlace?.state==='MATCH'))code='CONSISTENT';
  else if(evidence.length)code='AMBIGUOUS';
  if(signals.findPlace?.state==='NO_EVIDENCE')warnings.push('Profil toko belum ditemukan. Ini tidak membuktikan bahwa data master salah.');
  const place=signals.findPlace;
  const suggestion=code==='CONSISTENT'&&place?.state==='MATCH'&&!place.ambiguous&&place.nameSimilarity>=suggestionNamePercent/100&&place.distanceMeters<=suspectDistance&&place.distanceMeters>5
    ?{latitude:place.googleLat,longitude:place.googleLng,distanceMeters:place.distanceMeters,placeId:place.placeId,source:place.source}:null;
  const checkedAt=new Date().toISOString(),expiresAt=policy.evidenceDays>0?new Date(Date.parse(checkedAt)+policy.evidenceDays*86400000).toISOString():null;
  return {method:'MAP_COMPARISON_V2',code,signals,warnings,suggestion,placeCandidateMatched:place?.state==='MATCH',checkedAt,expiresAt,comparisonPolicy:policy};
}
