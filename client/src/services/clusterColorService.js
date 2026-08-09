/**
 * Cluster & Region Color Mapping Service
 * Single Responsibility: Generate dynamic colors for clusters based on DB value or string hash.
 * 1 File = 1 Pure Service
 */

/**
 * Generates a consistent hex color from a string.
 */
const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
};

/**
 * Returns color hex code for a given outlet's cluster.
 * Prioritizes dbColorHex if provided from the backend.
 */
export const getClusterColorHex = (clusterName = '', callplanName = '', dbColorHex = null) => {
  if (dbColorHex) return dbColorHex;
  
  const target = (clusterName + ' ' + callplanName).trim().toUpperCase();
  if (!target) return '#6366f1'; // Indigo fallback

  return stringToColor(target);
};

/**
 * Returns cluster info object.
 */
export const getClusterInfo = (clusterName = '', callplanName = '', dbColorHex = null) => {
  const hex = getClusterColorHex(clusterName, callplanName, dbColorHex);
  
  return { 
    key: clusterName ? clusterName.replace(/\s+/g, '_').toUpperCase() : 'OTHER', 
    name: clusterName || 'Klaster Regional', 
    hex, 
    // We just return inline styles or simple classes since it's dynamic now
    bgClass: 'bg-gray-100', 
    borderClass: 'border-gray-200', 
    textClass: 'text-gray-800' 
  };
};
