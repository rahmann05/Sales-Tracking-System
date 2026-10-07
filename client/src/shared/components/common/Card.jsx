import React from 'react';

/**
 * Shared neutral surface card.
 */
export const Card = ({ children, className = '', onClick }) => {
  return (
    <div className={`app-card ${className}`} onClick={onClick}>
      {children}
    </div>
  );
};
