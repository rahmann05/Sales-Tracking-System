import {warehouseStaffEligible} from '../../../../../shared/warehouse-policy.mjs';
import {readReviewDefinitions,reviewIdentity} from '../../config/services/approval-readiness.service.js';
export async function findWarehouseStaff(db,id,permission){
 const user=await db.user.findUnique({where:{id}});
 const identity=user&&reviewIdentity(user,await readReviewDefinitions(db));
 return warehouseStaffEligible(identity,permission)?identity:null;
}
