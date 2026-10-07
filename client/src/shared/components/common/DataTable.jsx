import React from 'react';

// Shared table surface; column alignment and mobile labels stay with the feature.
export function DataTable({className='',children,...props}) {
  return <table {...props} className={`app-data-table ${className}`}>{children}</table>;
}
