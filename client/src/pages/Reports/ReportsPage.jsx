import React from 'react';
import { apiService } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { ReportsHeader } from './components/ReportsHeader';
import { UsersTable } from './components/UsersTable';
import '../../styles/pages/Reports.css';

/**
 * ReportsPage Component (Page Level Component)
 * 1 File per Component
 */
export const ReportsPage = () => {
  const { data: health, loading: healthLoading, refetch: checkHealth } = useApi(apiService.getHealth);
  const { data: users, loading: usersLoading, error: usersError, refetch: fetchUsers } = useApi(apiService.getUsers);

  return (
    <div className="page-container">
      <ReportsHeader
        health={health}
        usersLoading={usersLoading}
        onCheckHealth={checkHealth}
        onFetchUsers={fetchUsers}
      />

      <UsersTable
        users={users}
        loading={usersLoading}
        error={usersError}
      />
    </div>
  );
};
