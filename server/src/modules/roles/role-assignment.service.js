import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import { BUILT_IN_ROLES, ALL_PERMISSIONS } from './roles.constants.js';
const codes = new Set(BUILT_IN_ROLES.map(r=>r.code));
export async function roleDefinition(code) {
  const config = await prisma.systemConfig.findUnique({where:{key:'ROLE_DEFINITIONS'}});
  const role = (Array.isArray(config?.value) ? config.value : []).find(r=>r.code===code) || BUILT_IN_ROLES.find(r=>r.code===code);
  if(!role) throw new AppError('Definisi role tidak ditemukan',400);
  const baseRole = role.isSystem ? role.code : role.baseRole || 'SALES';
  if(!codes.has(baseRole)) throw new AppError('Role dasar tidak valid',400);
  return {...role,baseRole};
}
export async function resolveIdentity(user) {
  const definition = await roleDefinition(user.roleCode || user.role);
  return {...user,role:definition.baseRole,roleCode:definition.code,roleLabel:definition.name,
    permissions:{...definition.defaultPermissions,...(user.permissions||{})}};
}
export async function userAssignment(data,current=null) {
  const safe = Object.fromEntries(['name','email','password','clusterId','permissions'].filter(k=>data[k]!==undefined).map(k=>[k,data[k]]));
  if(safe.permissions) {
    const allowed=new Set(ALL_PERMISSIONS.map(p=>p.key));
    if(Object.entries(safe.permissions).some(([k,v])=>!allowed.has(k)||typeof v!=='boolean')) throw new AppError('Hak akses tidak valid',400);
  }
  if(data.role !== undefined) {
    const role = await roleDefinition(String(data.role).trim().toUpperCase());
    safe.role = role.baseRole; safe.roleCode=role.isSystem?null:role.code;
  }
  if ((safe.role || current?.role)==='SALES' && safe.clusterId && safe.clusterId!==current?.clusterId) throw new AppError('Tetapkan tim dan wilayah sales melalui menu Tim, wilayah, dan PJP',400);
  if(safe.clusterId && !await prisma.cluster.findFirst({where:{id:safe.clusterId,deletedAt:null},select:{id:true}})) throw new AppError('Klaster aktif tidak ditemukan',400);
  return safe;
}
