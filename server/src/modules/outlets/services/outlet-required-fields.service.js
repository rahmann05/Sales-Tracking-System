import {MASTER_OUTLET_FIELDS,registrationFieldError} from '../../../../../shared/registration-fields.mjs';
import {getDynamicConfig} from '../../config/config.service.js';
import {AppError} from '../../../utils/errors.js';
export async function assertMasterRequiredFields(data,stage){
 const error=registrationFieldError(data,await getDynamicConfig('MASTER_OUTLET_REQUIRED_FIELDS',''),stage,MASTER_OUTLET_FIELDS);
 if(error)throw new AppError(error,422);
 const required=await getDynamicConfig(stage==='pembuatan master'?'MASTER_OUTLET_CREATE_REQUIRE_LOCATION':'MASTER_OUTLET_UPDATE_REQUIRE_LOCATION',stage==='pembuatan master');
 if(required&&(!Number.isFinite(data.latitude)||!Number.isFinite(data.longitude)))throw new AppError(`Lengkapi kedua koordinat saat ${stage}.`,422);
 if((data.latitude==null)!==(data.longitude==null))throw new AppError('Isi kedua koordinat atau kosongkan keduanya.',422);
}
