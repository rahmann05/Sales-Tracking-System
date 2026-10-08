import React from 'react';
import { toneFor } from './data';

export default function StatusBadge({ children, tone }) {
  return <span className={`status-badge ${tone || toneFor(children)}`}><span aria-hidden="true" />{children}</span>;
}
