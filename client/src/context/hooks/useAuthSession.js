import { useState, useEffect } from 'react';
import { authApi } from '../../services/api';

const ROLE_LABELS = {
  SALES: 'Sales',
  SUPERVISOR: 'Supervisor',
  ADMIN: 'Admin',
  KEPALA_GUDANG: 'Kepala Gudang',
  SUPIR: 'Supir',
};

/**
 * useAuthSession - User session state.
 * Single Responsibility: owns the authenticated user object,
 * syncs it from the backend auth storage, and resets on
 * auth:expired / auth:logout events.
 */
export const useAuthSession = (resetDomainState) => {
  // User murni dari auth backend (PostgreSQL) via localStorage authUser
  const [user, setUser] = useState(() => authApi.getStoredUser());

  // Set user dari hasil login backend (dipanggil setelah login sukses)
  const setUserFromAuth = () => {
    const u = authApi.getStoredUser();
    if (u) setUser({ ...u, roleLabel: ROLE_LABELS[u.role] || u.role });
  };

  useEffect(() => {
    const handleAuthReset = () => {
      setUser(null);
      resetDomainState?.();
    };
    window.addEventListener('auth:expired', handleAuthReset);
    window.addEventListener('auth:logout', handleAuthReset);
    return () => {
      window.removeEventListener('auth:expired', handleAuthReset);
      window.removeEventListener('auth:logout', handleAuthReset);
    };
  }, [resetDomainState]);

  return { user, setUser, setUserFromAuth };
};
