import React from 'react';

export const Footer = () => {
  return (
    <footer
      style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border)',
        padding: '1.5rem 0',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.875rem',
      }}
    >
      <div className="container">
        <p>&copy; {new Date().getFullYear()} Sinar Anugrah. Built with React (Vite) & Express.js</p>
      </div>
    </footer>
  );
};
