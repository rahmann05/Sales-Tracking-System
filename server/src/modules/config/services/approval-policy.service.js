import {AppError} from '../../../utils/errors.js';
import {processValue} from './process-policy.service.js';
export async function assertApprovalRole(entity,key,role,{stage='REVIEW'}={}){
 const mode=await processValue(entity,key,'BOTH');
 if(!['ADMIN','SUPERVISOR'].includes(role))throw new AppError('Pemeriksa harus Admin atau Supervisor',403);
 if(mode==='NONE'&&stage==='REVIEW')throw new AppError('Persetujuan manusia tidak diwajibkan oleh aturan dokumen ini',409);
 if(['ADMIN','SUPERVISOR'].includes(mode)&&role!==mode)throw new AppError(`Aturan dokumen memerlukan pemeriksa ${mode}`,403);
 return mode;
}
