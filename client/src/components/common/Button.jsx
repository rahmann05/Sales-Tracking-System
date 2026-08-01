import React from 'react';

export const Button = ({ children, onClick, variant = 'primary', disabled = false, type = 'button' }) => {
  const styles = {
    padding: '0.6rem 1.2rem',
    borderRadius: '8px',
    border: 'none',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.2s ease',
    background: variant === 'primary' ? 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)' : '#334155',
    color: '#ffffff',
    boxShadow: variant === 'primary' ? '0 4px 14px 0 rgba(56, 189, 248, 0.39)' : 'none',
  };

  return (
    <button type={type} onClick={onClick} disabled={disabled} style={styles}>
      {children}
    </button>
  );
};
