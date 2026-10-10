import {knownPoint} from './outlet-validation.mjs';
import {outletDigitalReadiness} from './outlet-digital-readiness.mjs';

export const OUTLET_ADMIN_DEFAULTS={OUTLET_REVIEW_ADMIN_ENABLED:true,OUTLET_REVIEW_ADMIN_NAME_PERCENT:70,OUTLET_REVIEW_ADMIN_ADDRESS_PERCENT:60,OUTLET_REVIEW_ADMIN_ALLOW_AMBIGUOUS:true,OUTLET_REVIEW_ADMIN_ALLOW_CONFLICTS:false};
export function adminOutletDecisionReadiness(run,outlet,actor,values={},options={}) {
 const policy={...OUTLET_ADMIN_DEFAULTS,...Object.fromEntries(Object.keys(OUTLET_ADMIN_DEFAULTS).filter(k=>values[k]!==undefined).map(k=>[k,values[k]]))};
 const standard=outletDigitalReadiness(run,outlet,options),issues=[...standard.evidenceIssues];
 const add=(code,message,action='Periksa ulang kandidat atau gunakan bukti internal/lapangan.')=>issues.push({code,message,action});
 if(actor?.role!=='ADMIN'||actor?.permissions?.can_apply_outlet_review!==true)add('ADMIN_PERMISSION_REQUIRED','Konfirmasi ini memerlukan role Admin dan izin menyimpan keputusan.','Hubungi Admin berizin.');
 if(policy.OUTLET_REVIEW_ADMIN_ENABLED!==true)add('ADMIN_REVIEW_DISABLED','Konfirmasi dengan pertimbangan Admin dinonaktifkan pada parameter.','Gunakan syarat standar atau ubah parameter sesuai kebijakan.');
 const result=run?.result||{},id=options.placeId??result.selectedPlaceId;
 const assessment=Array.isArray(result.assessments)?result.assessments.find(c=>c.placeId===id):null;
 const point=run?.providerContent?.candidates?.find(c=>c.placeId===id);
 if(run){
  if(!id||id!==result.selectedPlaceId)add('ADMIN_CANDIDATE_NOT_EVALUATED','Kandidat pilihan belum menjadi kandidat yang dinilai pada pemeriksaan terakhir.','Klik “Periksa ulang kandidat ini”, lalu tinjau hasilnya.');
  if(!assessment||assessment.detailsConfirmed!==true)add('ADMIN_DETAILS_REQUIRED','Place Details kandidat belum berhasil dikonfirmasi.');
  if(!knownPoint(point))add('ADMIN_POINT_REQUIRED','Kandidat belum memiliki titik Google yang sah dan tersedia.');
  if(assessment?.hardConflicts?.length)add('ADMIN_CANDIDATE_UNUSABLE',assessment.hardConflicts.join('. '));
  if(!['STRONG','REVIEW','AMBIGUOUS'].includes(result.code))add('ADMIN_BUSINESS_REQUIRED','Belum ada kandidat profil usaha yang dapat diputuskan oleh Admin.');
  if(result.code==='AMBIGUOUS'&&policy.OUTLET_REVIEW_ADMIN_ALLOW_AMBIGUOUS!==true)add('ADMIN_AMBIGUITY_DISABLED','Parameter tidak mengizinkan Admin menerima kandidat ambigu.');
  if(assessment?.conflicts?.length&&policy.OUTLET_REVIEW_ADMIN_ALLOW_CONFLICTS!==true)add('ADMIN_CONFLICTS_DISABLED',`Parameter tidak mengizinkan konflik ini: ${assessment.conflicts.join('; ')}.`);
  const name=assessment?.nameScore,address=assessment?.addressScore;
  if(assessment&&!(Number.isFinite(name)&&name>=policy.OUTLET_REVIEW_ADMIN_NAME_PERCENT||Number.isFinite(address)&&address>=policy.OUTLET_REVIEW_ADMIN_ADDRESS_PERCENT||assessment.phoneMatch===true))add('ADMIN_MATCH_TOO_LOW',`Kecocokan belum memenuhi batas Admin: nama ${name??'—'}% (minimum ${policy.OUTLET_REVIEW_ADMIN_NAME_PERCENT}%) atau alamat ${address??'—'}% (minimum ${policy.OUTLET_REVIEW_ADMIN_ADDRESS_PERCENT}%), dan telepon usaha belum cocok.`);
 }
 const available=actor?.role==='ADMIN'&&actor?.permissions?.can_apply_outlet_review===true&&policy.OUTLET_REVIEW_ADMIN_ENABLED===true;
 const warnings=[...new Set([...(Array.isArray(result.reasons)?result.reasons:[]),...standard.issues.filter(i=>!standard.evidenceIssues.includes(i)).map(i=>i.message)])];
 return {available,current:standard.current,canConfirm:issues.length===0,issues,warnings,policy};
}
