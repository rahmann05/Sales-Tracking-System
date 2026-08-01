/**
 * Utility functions for formatting values
 */

export const formatDate = (date = new Date()) => {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export const formatPercent = (val) => {
  return `${val}%`;
};

export const capitalize = (str = '') => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};
