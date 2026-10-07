import React, { Suspense } from 'react';
import { ROLES } from '../constants/roles';

// Helper for route-level code splitting (Google Web Vitals Best Practice)
import { SalesPage, SupervisorPage, AdminLandingPage, WarehousePage, DriverPage } from "./AppRouter.shared";
import { PageLoading } from "./AppRouterPageLoading";
export
/**
 * RoleWorkspace Component
 * Single Responsibility: Render the role-specific home workspace page.
 */
const RoleWorkspace = ({
  role
}) => {
  let content;
  switch (role) {
    case ROLES.SALES:
      content = <SalesPage />;
      break;
    case ROLES.SUPERVISOR:
      content = <SupervisorPage />;
      break;
    case ROLES.ADMIN:
      content = <AdminLandingPage />;
      break;
    case ROLES.KEPALA_GUDANG:
      content = <WarehousePage />;
      break;
    case ROLES.SUPIR:
      content = <DriverPage />;
      break;
    default:
      content = <SalesPage />;
      break;
  }
  return <Suspense fallback={<PageLoading />}>{content}</Suspense>;
};

/**
 * AccessControlMap
 * Single Responsibility: Define which tab requires which roles + denial message.
 */
