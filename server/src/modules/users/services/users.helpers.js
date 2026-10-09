/** Shared helpers for users services (internal). */
/** Reusable select object for clean user queries */
export const USER_SELECT = {
  id: true,
  staffCode: true,
  name: true,
  email: true,
  role: true,
  roleCode: true,
  permissions: true,
  supervisorId: true,
  supervisor: { select: { id:true, name:true, email:true } },
  updatedAt: true,
  clusterId: true,
  cluster: {
    select: {
      id: true,
      name: true,
      region: true,
      centerLat: true,
      centerLng: true,
      supervisor: { select: { id: true, name: true, email: true } }
    }
  },
  createdAt: true,
};




export const ROLE_LABELS = {
  SALES: 'Sales Field Rep',
  SUPERVISOR: 'Supervisor Operasional',
  ADMIN: 'Admin',
  KEPALA_GUDANG: 'Kepala Gudang',
  SUPIR: 'Supir / Driver',
};


export const enrichUserResponse = (user) => ({
  ...user,
  region: user.cluster?.region ?? null,
  clusterName: user.cluster?.name ?? null,
  spvName: user.supervisor?.name ?? null,
  supervisorName: user.supervisor?.name ?? null,
  roleLabel: ROLE_LABELS[user.role] ?? user.role,
  permissions: user.permissions || {},
});
