import {updateUser} from './update-user.service.js';
// Use the same account/PIC locks, readiness checks and session revocation as account editing.
export const updatePermissions=(id,permissions,actor)=>updateUser(id,{permissions},actor);
