import {updateUser} from './update-user.service.js';
// Reset uses the same fresh authorization, session revocation and socket disconnect as account editing.
export const updatePassword=(id,newPassword,actor)=>updateUser(id,{password:newPassword},actor);
