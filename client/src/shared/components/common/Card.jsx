import React from 'react';

/**
 * Modular Glassmorphism Card Component
 * Separated CSS into Card.css
 */
export const Card = ({ children, variant = 'card', className = '', onClick }) => {
  const baseClass = variant === 'panel' ? 'glass-panel' : 'glass-card';

  return (
    <div className={`${baseClass} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
};
