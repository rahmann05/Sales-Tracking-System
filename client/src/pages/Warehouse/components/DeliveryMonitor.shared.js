import React from 'react';
import { LuClock, LuCircleCheck, LuCircleX } from "react-icons/lu";
import { FiAlertTriangle } from 'react-icons/fi';
export const STATUS_ICON = {
  PENDING: LuClock,
  DELIVERED: LuCircleCheck,
  REJECTED: LuCircleX,
  PARTIAL_REJECT: FiAlertTriangle
};
export const STATUS_COLOR = {
  PENDING: '#6b7280',
  DELIVERED: '#16a34a',
  REJECTED: '#dc2626',
  PARTIAL_REJECT: '#d97706'
};
export const STATUS_LABEL = {
  PENDING: 'Menunggu',
  DELIVERED: 'Terkirim',
  REJECTED: 'Ditolak',
  PARTIAL_REJECT: 'Sebagian Ditolak'
};
export const ROUTE_STATUS = {
  DRAFT: {
    label: 'Draft',
    color: '#6b7280'
  },
  READY: {
    label: 'Siap Kirim',
    color: '#2563eb'
  },
  IN_TRANSIT: {
    label: 'Dalam Perjalanan',
    color: '#d97706'
  },
  COMPLETED: {
    label: 'Selesai',
    color: '#16a34a'
  },
  PARTIAL: {
    label: 'Sebagian',
    color: '#dc2626'
  }
};

/**
 * DeliveryMonitor — Real-time monitoring of delivery routes and stops for Kepala Gudang.
 */
