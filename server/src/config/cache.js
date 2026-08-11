import NodeCache from 'node-cache';

// stdTTL: 300 detik (5 menit), checkperiod: 60 detik
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60, useClones: false });

// Pre-defined cache keys
export const CACHE_KEYS = {
  ALL_OUTLETS: 'data:outlets:all',
  ALL_CLUSTERS: 'data:clusters:all',
  ALL_SALES_USERS: 'data:users:sales',
  CLUSTER_BY_ID: (id) => `data:clusters:${id}`,
  CLUSTER_ROUTES: (id) => `data:clusters:${id}:routes`,
};

export { cache };
