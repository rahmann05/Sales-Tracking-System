import React from 'react';
import '../../styles/common/Button.css';

/**
 * Modular Button Component (1 Component per File)
 * Separated CSS into Button.css using Tailwind CSS @apply rules
 */
export const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  icon: IconComponent = null,
  className = '',
}) => {
  const variantClass = `btn-${variant}`;
  const sizeClass = `btn-${size}`;
  const disabledClass = disabled ? 'btn-disabled' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn-base ${variantClass} ${sizeClass} ${disabledClass} ${className}`}
    >
      {IconComponent && <IconComponent className="text-lg" />}
      {children}
    </button>
  );
};
