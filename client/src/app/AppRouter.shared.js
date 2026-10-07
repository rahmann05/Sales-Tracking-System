import React from 'react';
// Helper for route-level code splitting (Google Web Vitals Best Practice)
export
// Helper for route-level code splitting (Google Web Vitals Best Practice)
const lazyNamed = (factory, name) => React.lazy(() => factory().then(mod => ({
  default: mod[name]
})));
export const SalesPage = lazyNamed(() => import('../pages/Sales/SalesPage'), 'SalesPage');
export const SupervisorPage = lazyNamed(() => import('../pages/Supervisor/SupervisorPage'), 'SupervisorPage');
export const AdminLandingPage = lazyNamed(() => import('../pages/Admin/AdminLandingPage'), 'AdminLandingPage');
export
// Delivery Management Pages
const WarehousePage = lazyNamed(() => import('../pages/Warehouse/WarehousePage'), 'WarehousePage');
export const DriverPage = lazyNamed(() => import('../pages/Driver/DriverPage'), 'DriverPage');
