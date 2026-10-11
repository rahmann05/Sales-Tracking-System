import {nativeOutletPointTrusted} from '../../../../../shared/outlet-location.mjs';
import {outletNameNeedsReview} from '../../../../../shared/outlet-validation.mjs';

const normalize=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const branch=s=>normalize(s).match(/\b\d+[a-z]?\b/g)?.join(',')||null;
const house=s=>String(s||'').match(/\b(?:no\.?|nomor)\s*(\d+[a-z]?)/i)?.[1]?.toLowerCase()||null;
const street=s=>normalize(String(s||'').match(/\b(?:jl\.?|jln\.?|jalan|gg\.?|gang)\s+(.+?)(?=\s+no\.?\s*\d|\s+nomor\s*\d|,|\b(?:kota|kabupaten|kecamatan|kelurahan|rt|rw)\b|$)/i)?.[1]);
export const outletChain=name=>normalize(name).match(/\b(indomaret|alfamart|alfamidi|borma|yogya|yomart|superindo|transmart|hypermart)\b/)?.[1]||null;
export function candidateIdentityFacts(outlet,candidate,values={}){
 const masterStreet=street(outlet.address),candidateStreet=street(candidate.address);
 const streetHouse=masterStreet&&candidateStreet&&house(outlet.address)&&house(candidate.address)?masterStreet===candidateStreet&&house(outlet.address)===house(candidate.address):null;
 const radius=Number(values.OUTLET_REVIEW_IDENTITY_GPS_RADIUS_METERS??100),accuracy=outlet.locationEvidence?.accuracyMeters;
 const gpsUsable=nativeOutletPointTrusted(outlet)&&Number.isFinite(accuracy)&&accuracy>=0&&accuracy<=radius&&Number.isFinite(candidate.distanceMeters);
 // An uncertainty circle crossing the boundary cannot prove either inclusion or exclusion.
 const trustedGps=!gpsUsable?null:candidate.distanceMeters+accuracy<=radius?true:candidate.distanceMeters-accuracy>radius?false:null;
 return {
  phone:candidate.phoneMatch??null,
  branch:branch(outlet.name)&&branch(candidate.name)?branch(outlet.name)===branch(candidate.name):null,
  streetHouse,
  trustedGps,
 };
}
export function assessOutletIdentity(outlet,candidate,ranked,values={}){
 if(!candidate)return {required:false,resolved:false,competingPlaceIds:[],supports:[],reasons:[]};
 const chain=outletChain(outlet.name),gap=Number(values.OUTLET_REVIEW_CANDIDATE_GAP??15);
 const peers=ranked.filter(c=>c.placeId!==candidate.placeId&&!c.hardConflicts.length&&(
  chain&&outletChain(c.name)===chain||c.score>=candidate.score-gap||outletNameNeedsReview(outlet.name)&&c.distanceMeters!=null&&c.distanceMeters<=Number(values.OUTLET_REVIEW_SEARCH_RADIUS_METERS??500)
 ));
 const required=peers.length>0||outletNameNeedsReview(outlet.name)||!!chain&&!branch(outlet.name);
 const facts=candidate.identityFacts;
 // Only positive evidence that distinguishes ALL plausible alternatives resolves identity.
 // An unchecked alternative cannot be ruled out by its missing phone/details.
 const supports=Object.keys(facts).filter(key=>facts[key]===true&&peers.every(p=>p.refreshed!==false&&p.identityFacts[key]===false&&(key!=='phone'||p.detailsConfirmed)));
 const resolved=!required||supports.length>0;
 const reasons=[];
 if(peers.length)reasons.push(`${peers.length} kandidat alternatif perlu dibandingkan; merek, wilayah umum dan kedekatan titik lama saja tidak membuktikan cabang yang sama.`);
 if(outletNameNeedsReview(outlet.name))reasons.push('Nama master belum mengidentifikasi usaha dengan jelas. Nama toko hasil Google merupakan kandidat, bukan koreksi yang sudah terbukti.');
 if(required&&!resolved)reasons.push('Belum ada pembeda unik yang cocok: nomor cabang, jalan + nomor alamat, telepon usaha, atau GPS lapangan terpercaya. Lengkapi data dari sumber internal atau tugaskan Sales.');
 return {required,resolved,competingPlaceIds:peers.map(c=>c.placeId),supports,reasons,gpsRadiusMeters:Number(values.OUTLET_REVIEW_IDENTITY_GPS_RADIUS_METERS??100)};
}
