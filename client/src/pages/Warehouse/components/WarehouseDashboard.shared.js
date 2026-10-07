import React from "react";
export const STATUS_CONFIG = {
  DRAFT: {
    label: 'Draft',
    color: 'var(--on-surface-variant)',
    bg: 'var(--surface-variant)'
  },
  READY: {
    label: 'Siap Kirim',
    color: '#2563eb',
    bg: '#dbeafe'
  },
  IN_TRANSIT: {
    label: 'Dalam Perjalanan',
    color: '#d97706',
    bg: '#fef3c7'
  },
  COMPLETED: {
    label: 'Selesai',
    color: '#16a34a',
    bg: '#dcfce7'
  },
  PARTIAL: {
    label: 'Sebagian',
    color: '#dc2626',
    bg: '#fee2e2'
  }
};
export const STOP_STATUS_CONFIG = {
  PENDING: {
    label: 'Menunggu',
    color: '#6b7280'
  },
  DELIVERED: {
    label: 'Terkirim',
    color: '#16a34a'
  },
  REJECTED: {
    label: 'Ditolak',
    color: '#dc2626'
  },
  PARTIAL_REJECT: {
    label: 'Sebagian Ditolak',
    color: '#d97706'
  }
};

/**
 * WarehouseDashboard — Daily overview for Kepala Gudang.
 * Shows summary metrics, route status, and live delivery tracking.
 */
