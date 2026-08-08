/**
 * Cluster & Region Color Mapping Service
 * Single Responsibility: Map cluster/region names to distinct color palettes for Google Maps markers & UI legends.
 * 1 File = 1 Pure Service
 */

export const CLUSTER_COLORS = [
  { key: 'CIMAHI', name: 'Klaster Cimahi Tengah', hex: '#2563eb', bgClass: 'bg-blue-500', borderClass: 'border-blue-500', textClass: 'text-blue-600' },
  { key: 'PADALARANG', name: 'Klaster Padalarang (KBB)', hex: '#10b981', bgClass: 'bg-emerald-500', borderClass: 'border-emerald-500', textClass: 'text-emerald-600' },
  { key: 'LEMBANG', name: 'Klaster Lembang (KBB Utara)', hex: '#f59e0b', bgClass: 'bg-amber-500', borderClass: 'border-amber-500', textClass: 'text-amber-700' },
  { key: 'BATUJAJAR', name: 'Klaster Batujajar', hex: '#8b5cf6', bgClass: 'bg-purple-500', borderClass: 'border-purple-500', textClass: 'text-purple-600' },
];

/**
 * Returns color hex code for a given outlet's cluster or callplan name.
 */
export const getClusterColorHex = (clusterName = '', callplanName = '') => {
  const target = (clusterName + ' ' + callplanName).toUpperCase();

  if (target.includes('PADALARANG')) return '#10b981'; // Emerald
  if (target.includes('LEMBANG')) return '#f59e0b'; // Amber
  if (target.includes('BATUJAJAR')) return '#8b5cf6'; // Purple
  if (target.includes('CIMAHI')) return '#2563eb'; // Blue

  return '#6366f1'; // Indigo fallback
};

/**
 * Returns cluster info object.
 */
export const getClusterInfo = (clusterName = '', callplanName = '') => {
  const hex = getClusterColorHex(clusterName, callplanName);
  const matched = CLUSTER_COLORS.find((c) => c.hex === hex);
  return matched || { key: 'OTHER', name: clusterName || 'Klaster Regional', hex, bgClass: 'bg-indigo-500', borderClass: 'border-indigo-500', textClass: 'text-indigo-600' };
};
