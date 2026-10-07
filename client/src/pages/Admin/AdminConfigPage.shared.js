import React from 'react';
import '../../styles/pages/AdminConfig.css';
export const optionLabels = {
  INCREMENT: 'Otomatis berurutan',
  PATTERN: 'Pola khusus',
  MANUAL: 'Manual (otomatis OFF)',
  NONE: 'Tidak direset',
  DAILY: 'Setiap hari',
  MONTHLY: 'Setiap bulan',
  YEARLY: 'Setiap tahun'
};
export const displayValue = (param, value) => param.type === 'boolean' ? String(value) === 'true' ? 'Aktif' : 'Nonaktif' : optionLabels[value] || String(value) || '(kosong)';
