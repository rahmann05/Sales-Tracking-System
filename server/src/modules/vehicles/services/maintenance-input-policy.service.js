import {AppError} from '../../../utils/errors.js';
import {wibDateKey} from '../../../../../shared/visit-metrics.mjs';
export function validateMaintenanceInput(data,values,now=Date.now()){
 if(!Number.isFinite(data.odometerAtService)||data.odometerAtService<0)throw new AppError('Odometer aktual tidak valid',400);
 if(!['GANTI_OLI','GANTI_FILTER_OLI','GANTI_KANVAS_REM','LAINNYA'].includes(data.serviceType))throw new AppError('Jenis servis tidak valid',400);
 const at=data.serviceDate?Date.parse(data.serviceDate):now;
 if(!Number.isFinite(at)||at>now+60000)throw new AppError('Tanggal servis tidak valid atau berada di masa depan',400);
 const days=Math.round((Date.parse(wibDateKey(now))-Date.parse(wibDateKey(at)))/86400000);
 if(values.VEHICLE_SERVICE_ALLOW_BACKDATE===false&&days>0)throw new AppError('Admin tidak mengizinkan pencatatan servis sebelum hari ini',422);
 if(values.VEHICLE_SERVICE_MAX_BACKDATE_DAYS>0&&days>values.VEHICLE_SERVICE_MAX_BACKDATE_DAYS)throw new AppError('Tanggal servis melampaui batas umur pencatatan yang diizinkan Admin',422);
 if(values.VEHICLE_SERVICE_REQUIRE_WORKSHOP&&!data.workshopName?.trim())throw new AppError('Nama bengkel wajib sesuai aturan Admin',422);
 if(values.VEHICLE_SERVICE_REQUIRE_NOTE&&!data.notes?.trim())throw new AppError('Catatan servis wajib sesuai aturan Admin',422);
 return new Date(at);
}
