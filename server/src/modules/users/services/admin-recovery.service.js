import {AppError} from '../../../utils/errors.js';

// Serialize removal and demotion so simultaneous requests cannot remove both remaining admins.
export async function protectAdminRecovery(db,id,nextRole){
 await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('users:admin-recovery'))`;
 const current=await db.user.findUnique({where:{id},select:{id:true,role:true,deletedAt:true}});
 if(!current||current.deletedAt)throw new AppError('Pengguna aktif tidak ditemukan',404);
 if(current.role==='ADMIN'&&nextRole!=='ADMIN'&&!await db.user.count({where:{role:'ADMIN',deletedAt:null,id:{not:id}}}))throw new AppError('Admin aktif terakhir tidak dapat dihapus atau diganti role. Siapkan Admin pengganti terlebih dahulu.',409);
 return current;
}
