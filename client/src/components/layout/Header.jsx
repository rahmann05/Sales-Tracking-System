import React from 'react';

export const Header = () => {
  return (
    <header
      style={{
        borderBottom: '1px solid var(--border)',
        padding: '1.25rem 0',
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '1.2rem',
              color: '#fff',
            }}
          >
            SA
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }} className="gradient-text">
            Sinar Anugrah
          </h2>
        </div>

        <nav>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Modular Full-Stack Architecture
          </span>
        </nav>
      </div>
    </header>
  );
};
