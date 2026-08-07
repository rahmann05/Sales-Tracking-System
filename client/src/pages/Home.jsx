import React from 'react';
import { apiService } from '../services/api';
import { useApi } from '../hooks/useApi';
import { Button } from '../components/common/Button';
import { FiWifi, FiFolder, FiMonitor } from 'react-icons/fi';
import { HomeBanner } from '../components/layout/HomeBanner';
import { FeatureCard } from '../components/common/FeatureCard';
import '../styles/pages/Home.css';

export const Home = () => {
  const { data: health, loading: healthLoading, refetch: checkHealth } = useApi(apiService.getHealth);
  const { data: users, loading: usersLoading, error: usersError, refetch: fetchUsers } = useApi(apiService.getUsers);

  return (
    <div className="home-container">
      {/* Banner Section */}
      <HomeBanner health={health} healthLoading={healthLoading} checkHealth={checkHealth} />

      {/* Grid Content */}
      <div className="home-grid">
        {/* Card 1: Modular Architecture */}
        <FeatureCard 
          title="Arsitektur Backend (`server/`)"
          icon={<FiFolder />}
          titleColorClass="--primary"
          items={[
            { label: 'routes/', description: 'Pemetaan endpoint REST API' },
            { label: 'controllers/', description: 'Penanganan HTTP request & response' },
            { label: 'services/', description: 'Logika bisnis (Business Logic Layer)' },
            { label: 'middlewares/', description: 'Centralized auth & error handling' },
            { label: 'config/', description: 'Manajemen environment terpusat' }
          ]}
        />

        {/* Card 2: React Frontend */}
        <FeatureCard 
          title="Arsitektur Frontend (`client/`)"
          icon={<FiMonitor />}
          titleColorClass="--accent"
          items={[
            { label: 'Vite Toolchain', description: 'HMR ultra-cepat & ESM native' },
            { label: 'services/api.js', description: 'HTTP client & fetch abstraction' },
            { label: 'hooks/useApi.js', description: 'Custom hook manajemen state API' },
            { label: 'components/', description: 'Modular UI layout & atomic elements' },
            { label: 'pages/', description: 'Page-level views' }
          ]}
        />

        {/* Card 3: Live API Data Demonstration */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="api-demo-header">
            <h3 className="api-demo-title">
              <FiWifi /> Demonstrasi Data dari Server Express (`/api/users`)
            </h3>
            <Button onClick={() => fetchUsers()} disabled={usersLoading}>
              {usersLoading ? 'Memuat...' : 'Fetch Users'}
            </Button>
          </div>

          {usersError && (
            <div className="api-demo-error">
              Error: {usersError}
            </div>
          )}

          {usersLoading && !users && (
            <div className="api-demo-loading">Memuat data pengguna dari backend...</div>
          )}

          {users && (
            <div className="api-demo-table-wrapper">
              <table className="api-demo-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nama</th>
                    <th>Email</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>#{user.id}</td>
                      <td className="name">{user.name}</td>
                      <td className="email">{user.email}</td>
                      <td>
                        <span className={`role-badge ${user.role === 'Admin' ? 'admin' : 'default'}`}>
                          {user.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
