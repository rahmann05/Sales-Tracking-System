import React from 'react';
import { PackingLoadForm } from './PackingLoadForm';
import { LegacyPackingDraftForm } from './LegacyPackingDraftForm';

export function PackingDraftForm(props) {
  if (
    props.document?.loadPlanVersion === 2 ||
    (!props.document && (props.documentKind || 'PACKING') === 'PACKING')
  ) {
    return <PackingLoadForm {...props} />;
  }
  return <LegacyPackingDraftForm {...props} />;
}
