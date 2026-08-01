import React from 'react';
import '../../styles/common/Badge.css';

/**
 * Modular Badge Component
 * Separated CSS into Badge.css
 */
export const Badge = ({ children, variant = 'lime', className = '' }) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'lime':
      case 'In Transit':
      case 'Checked In':
      case 'Active':
        return 'badge-lime';
      case 'delayed':
      case 'Delayed':
        return 'badge-delayed';
      case 'completed':
      case 'Completed':
        return 'badge-completed';
      default:
        return 'badge-completed';
    }
  };

  return (
    <span className={`badge-base ${getVariantClass()} ${className}`}>
      {children}
    </span>
  );
};
