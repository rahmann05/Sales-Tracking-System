/** Shared helpers for users services (internal). */
/** Reusable select object for clean user queries */
export const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
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

// Global in-memory cache for live GPS positions from sales device pings
export const liveLocationsCache = new Map();


export const ROLE_LABELS = {
  SALES: 'Sales Field Rep',
  SUPERVISOR: 'Supervisor Operasional',
  ADMIN: 'Admin',
};


export const enrichUserResponse = (user) => ({
  ...user,
  region: user.cluster?.region ?? null,
  clusterName: user.cluster?.name ?? null,
  spvName: user.cluster?.supervisor?.name ?? (user.role === 'SALES' ? 'Ahmad Subagja' : null),
  supervisorName: user.cluster?.supervisor?.name ?? (user.role === 'SALES' ? 'Ahmad Subagja' : null),
  roleLabel: ROLE_LABELS[user.role] ?? user.role,
});
