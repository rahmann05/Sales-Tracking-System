import React from 'react';
export const STATUS_CONFIG = {
  DRAFT: {
    label: 'Draft',
    color: '#6b7280',
    bg: '#f3f4f6',
    action: 'Siap Kirim',
    nextStatus: 'READY'
  },
  READY: {
    label: 'Siap Kirim',
    color: '#2563eb',
    bg: '#dbeafe',
    action: 'Mulai Kirim',
    nextStatus: 'IN_TRANSIT'
  },
  IN_TRANSIT: {
    label: 'Dalam Perjalanan',
    color: '#d97706',
    bg: '#fef3c7',
    action: null,
    nextStatus: null
  },
  COMPLETED: {
    label: 'Selesai',
    color: '#16a34a',
    bg: '#dcfce7',
    action: null,
    nextStatus: null
  },
  PARTIAL: {
    label: 'Sebagian',
    color: '#dc2626',
    bg: '#fee2e2',
    action: null,
    nextStatus: null
  }
};

/**
 * DeliveryRouteBuilder — Create and manage delivery routes for Kepala Gudang.
 */
