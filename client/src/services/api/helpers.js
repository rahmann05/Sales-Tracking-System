export const queryString = params => new URLSearchParams(Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== null && value !== '')).toString();
