import React from 'react';
import { LuMapPin } from 'react-icons/lu';
import { Button } from '../../../components/common/Button';

/**
 * RoutePlanningHeader Component (Single Responsibility: Page Header & Action)
 * 1 File per Component
 */
export const RoutePlanningHeader = ({ onCreateRoute }) => {
  return (
    <div className="page-header">
      <div>
        <h2 className="page-title">Optimasi & Perencanaan Rute Sales</h2>
        <p className="page-subtitle">
          Kelola urutan kunjungan sales representative secara efisien dan hemat bahan bakar.
        </p>
      </div>
      <Button variant="primary" icon={LuMapPin} onClick={onCreateRoute}>
        Buat Rute Baru
      </Button>
    </div>
  );
};
