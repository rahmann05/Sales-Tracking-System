import React from 'react';

// Shared table surface with keyboard-scrollable region wrapper; column alignment and mobile labels stay with the feature.
export function DataTable({ className = '', embedded = false, children, ...props }) {
  const table = (
    <table {...props} className={`app-data-table ${className}`}>
      {children}
    </table>
  );

  if (embedded) {
    return table;
  }

  return (
    <div
      tabIndex={0}
      role="region"
      aria-label={props['aria-label'] || 'Tabel data'}
      className="overflow-x-auto max-w-full"
    >
      {table}
    </div>
  );
}
