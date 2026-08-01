import React from 'react';
import { Badge } from '../../../components/common/Badge';

/**
 * UsersTable Component (Single Responsibility: Rendering Backend User Data Table)
 * 1 File per Component
 */
export const UsersTable = ({ users, loading, error }) => {
  if (error) {
    return (
      <div className="p-4 bg-error-container text-on-error-container rounded-xl mb-6">
        Error connecting to backend REST API: {error}
      </div>
    );
  }

  return (
    <div className="reports-table-container">
      <h3 className="text-headline-md mb-4">
        Daftar Sales Representative (Express Backend Database)
      </h3>

      {loading && !users && (
        <div className="text-center py-8 text-on-surface-variant">
          Mengambil data dari server backend Express...
        </div>
      )}

      {users && (
        <div className="overflow-x-auto">
          <table className="reports-table">
            <thead>
              <tr>
                <th className="reports-th">ID</th>
                <th className="reports-th">NAMA REPRESENTATIVE</th>
                <th className="reports-th">EMAIL TERDAFTAR</th>
                <th className="reports-th">ROLE HIERARKI</th>
                <th className="reports-th">STATUS AKUN</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="reports-td font-bold">#{user.id}</td>
                  <td className="reports-td font-bold text-on-surface">{user.name}</td>
                  <td className="reports-td text-on-surface-variant">{user.email}</td>
                  <td className="reports-td">
                    <Badge variant={user.role === 'Admin' ? 'lime' : 'completed'}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="reports-td">
                    <span className="text-xs font-semibold text-secondary">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
