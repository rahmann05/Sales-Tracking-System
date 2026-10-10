import {wibDateKey} from './visit-metrics.mjs';
export function revisitSchedule(raw,values={},now=Date.now()){
 if(values.CLOSED_OUTLET_ALLOW_REVISIT===false)throw new Error('Keputusan kunjungi kembali dinonaktifkan.');
 const date=raw?.date,time=raw?.time||'08:00';
 if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw new Error('Tanggal dan jam kunjungan kembali tidak valid.');
 const at=Date.parse(`${date}T${time}:00+07:00`),today=wibDateKey(now),distance=(Date.parse(date+'T00:00:00Z')-Date.parse(today+'T00:00:00Z'))/86400000;
 if(!Number.isFinite(at)||wibDateKey(at)!==date||at<=now||distance<0||distance>Number(values.CLOSED_OUTLET_REVISIT_MAX_DAYS??30))throw new Error('Jadwal harus di masa depan dan dalam batas hari yang diizinkan.');
 return {date,time,effectiveAt:new Date(at).toISOString(),...(raw.manualCode?.trim()?{manualCode:raw.manualCode.trim()}:{})};
}
