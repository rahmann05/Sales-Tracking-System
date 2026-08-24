import React from 'react';
import { LuBuilding2 } from 'react-icons/lu';

/**
 * DivisionBranchSection Component
 * Single Responsibility: Manage division and branch input fields.
 */
export const DivisionBranchSection = ({ division, branch, onChange }) => {
  return (
    <div className="outlet-reg-section-card">
      <div className="outlet-reg-section-title">
        <LuBuilding2 className="text-primary" />
        <span>1. Divisi & Cabang Distribusi</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="outlet-reg-label">DIVISI</label>
          <select
            value={division}
            onChange={(e) => onChange('division', e.target.value)}
            className="outlet-reg-input font-bold"
          >
            <option value="UNICHARM">UNICHARM</option>
            <option value="BELFOODS">BELFOODS</option>
            <option value="GENERAL">GENERAL FMCG</option>
          </select>
        </div>
        <div>
          <label className="outlet-reg-label">CABANG</label>
          <input
            type="text"
            value={branch}
            onChange={(e) => onChange('branch', e.target.value)}
            className="outlet-reg-input font-bold"
            placeholder="PADALARANG"
          />
        </div>
      </div>
    </div>
  );
};
