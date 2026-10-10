import {canOrderOperation,ORDER_OPERATION_PERMISSIONS} from '../../../../../shared/order-operation-permissions.mjs';
import {AppError} from '../../../utils/errors.js';
export function assertOrderOperation(actor,action){
 if(!canOrderOperation(actor,action))throw new AppError(`Akses ditolak: ${ORDER_OPERATION_PERMISSIONS[action]?.label||'tindakan order'} memerlukan Admin aktif dengan izin tindakan tersebut.`,403);
}
export const authorizeOrderOperation=action=>(req,res,next)=>{
 try{assertOrderOperation(req.user,action);next();}catch(error){next(error);}
};
