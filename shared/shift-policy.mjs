import {wibDateKey} from './visit-metrics.mjs';
export function shiftDateKey(now=Date.now(),cutoff='00:00'){
 const at=new Date(now),clock=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Jakarta',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(at);
 return wibDateKey(+at-(clock<cutoff?86400000:0));
}
export function shiftLateMinutes(at,dateKey,values={}){
 return Math.max(0,Math.floor((+new Date(at)-Date.parse(`${dateKey}T${values.SHIFT_START_TIME||'08:00'}:00+07:00`))/60000)-Number(values.SHIFT_LATE_TOLERANCE_MINUTES||0));
}
export function shiftTimeView(row){
 const correction=row.timeCorrection?.accepted,applicable=row.checklist?.startKind!=='BUSINESS_START';
 return {actualIn:applicable?row.checkInAt:null,actualOut:row.checkOutAt||null,reportedIn:correction?.checkInAt||null,reportedOut:correction?.checkOutAt||null,corrected:Boolean(correction),lateMinutes:applicable?(correction?.lateMinutes??row.lateMinutes):null};
}
export function validateShiftCorrection(row,data,values,now=Date.now()){
 if(row.kind!=='SHIFT'||row.checklist?.startKind==='BUSINESS_START'||row.policySnapshot?.values?.SHIFT_ATTENDANCE_MODE==='OPTIONAL')throw new Error('Koreksi waktu hanya untuk shift dengan presensi.');
 const ageDays=Math.round((Date.parse(wibDateKey(now))-Date.parse(wibDateKey(row.checkInAt)))/86400000);
 if(ageDays>Number(values.SHIFT_CORRECTION_MAX_AGE_DAYS??30))throw new Error('Shift melewati batas tanggal koreksi yang diizinkan.');
 const entered=Date.parse(data.checkInAt),out=data.checkOutAt?Date.parse(data.checkOutAt):null;
 if(!Number.isFinite(entered)||entered>now+30000||out!==null&&(!Number.isFinite(out)||out>now+30000||out<entered))throw new Error('Waktu koreksi harus valid, keluar setelah masuk, dan tidak di masa depan.');
 if(shiftDateKey(entered,row.policySnapshot?.values?.SHIFT_DAY_CUTOFF_TIME||values.SHIFT_DAY_CUTOFF_TIME||'00:00')!==row.dateKey)throw new Error('Waktu masuk harus tetap pada tanggal kerja shift yang sama.');
 if(out!==null&&row.policySnapshot?.values?.SHIFT_ATTENDANCE_MODE==='IN_ONLY')throw new Error('Mode masuk saja tidak mempunyai koreksi bukti keluar.');
 if(out!==null&&(out-entered)>Number(values.SHIFT_CORRECTION_MAX_DURATION_HOURS??48)*3600000)throw new Error('Rentang koreksi melampaui durasi maksimal yang diizinkan.');
 return {checkInAt:new Date(entered).toISOString(),checkOutAt:out===null?null:new Date(out).toISOString(),lateMinutes:shiftLateMinutes(entered,row.dateKey,{...values,...row.policySnapshot?.values})};
}
export function shiftCorrectionGaps(rows,people){
 return rows.filter(row=>row.timeCorrection?.pending&&!people.some(p=>!p.deletedAt&&p.role==='ADMIN'&&p.permissions.can_review_shift_correction===true&&p.id!==row.userId&&p.id!==row.timeCorrection.pending.proposedBy)).map(row=>({key:`SHIFT_CORRECTION:${row.id}:REVIEWER`,message:`Koreksi shift ${row.id} memerlukan Admin pemeriksa berbeda yang aktif dan berizin.`}));
}
