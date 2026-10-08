import React from 'react';
import { PageHeader } from '../../shared/components/common/PageHeader';
import { AttentionPanel } from '../../shared/components/common/AttentionPanel';

export function AdminAttentionPage() {
  return <div className="workspace-page space-y-6">
    <PageHeader badge="Operasional" title="Tindak lanjut" subtitle="Temukan pekerjaan yang tertunda, tetapkan penanggung jawab, dan pantau penyelesaiannya." />
    <AttentionPanel />
  </div>;
}
