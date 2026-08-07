import React, { useState } from 'react';
import { LuUser } from 'react-icons/lu';
import '../../styles/common/Avatar.css';

/**
 * Modular Avatar Component
 * Handles image avatar with smooth initials / icon fallback
 */
export const Avatar = ({ src, name = '', size = 'md', className = '' }) => {
  const [hasError, setHasError] = useState(false);
  const sizeClass = `avatar-${size}`;

  // Get initials from name
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '';

  if (src && !hasError) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        onError={() => setHasError(true)}
        className={`avatar-base ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <div
      className={`avatar-base ${sizeClass} bg-primary/10 text-primary flex items-center justify-center shrink-0 ${className}`}
      title={name}
    >
      <LuUser className="text-base" />
    </div>
  );
};
