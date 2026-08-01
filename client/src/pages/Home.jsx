import React from 'react';
import { apiService } from '../services/api';
import { useApi } from '../hooks/useApi';
import { Button } from '../components/common/Button';

export const Home = () => {
  const { data: health, loading: healthLoading, refetch: checkHealth } = useApi(apiService.getHealth);
  const { data: users, loading: usersLoading, error: usersError, refetch: fetchUsers } = useApi(apiService.getUsers);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem 0' }}>
      {/* Banner Section */}
      <div
        style={{
          textAlign: 'center',
          padding: '3rem 1.5rem',
          background: 'radial-gradient(circle at top, rgba(56, 189, 248, 0.15) 0%, transparent 70%)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
        }}
      >
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Setup <span className="gradient-text">React & Express</span> Modular
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto 1.5rem' }}>
          Struktur project monorepo terpisah antara Frontend (`client/`) dan Backend (`server/`) mengikuti *best practice* arsitektur berteknologi tinggi.
        </p>

        {healthLoading ? (
          <div style={{ color: 'var(--text-muted)' }}>Memeriksa koneksi server...</div>
        ) : health ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="badge">
              <span className="badge-dot"></span>
              Backend API Status: {health.status} ({health.service})
            </span>
            <Button onClick={() => checkHealth()} variant="secondary">
              Refresh Status
            </Button>
          </div>
        ) : (
          <div style={{ color: '#ef4444' }}>Gagal terhubung ke backend server Express.</div>
        )}
      </div>

      {/* Grid Content */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Card 1: Modular Architecture */}
        <div className="card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary)' }}>
            📁 Arsitektur Backend (`server/`)
          </h3>
          <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><strong>routes/</strong>: Pemetaan endpoint REST API</li>
            <li><strong>controllers/</strong>: Penanganan HTTP request & response</li>
            <li><strong>services/</strong>: Logika bisnis (Business Logic Layer)</li>
            <li><strong>middlewares/</strong>: Centralized auth & error handling</li>
            <li><strong>config/</strong>: Manajemen environment terpusat</li>
          </ul>
        </div>

        {/* Card 2: React Frontend */}
        <div className="card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--accent)' }}>
            ⚡ Arsitektur Frontend (`client/`)
          </h3>
          <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><strong>Vite Toolchain</strong>: HMR ultra-cepat & ESM native</li>
            <li><strong>services/api.js</strong>: HTTP client & fetch abstraction</li>
            <li><strong>hooks/useApi.js</strong>: Custom hook manajemen state API</li>
            <li><strong>components/</strong>: Modular UI layout & atomic elements</li>
            <li><strong>pages/</strong>: Page-level views</li>
          </ul>
        </div>

        {/* Card 3: Live API Data Demonstration */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.2rem' }}>
              📡 Demonstrasi Data dari Server Express (`/api/users`)
            </h3>
            <Button onClick={() => fetchUsers()} disabled={usersLoading}>
              {usersLoading ? 'Memuat...' : 'Fetch Users'}
            </Button>
          </div>

          {usersError && (
            <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              Error: {usersError}
            </div>
          )}

          {usersLoading && !users && (
            <div style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>Memuat data pengguna dari backend...</div>
          )}

          {users && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>ID</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Nama</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Email</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.75rem 0.5rem' }}>#{user.id}</td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{user.name}</td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>{user.email}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            background: user.role === 'Admin' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                            color: user.role === 'Admin' ? 'var(--primary)' : 'var(--text-main)',
                          }}
                        >
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
