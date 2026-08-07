import React from 'react';
import '../../../../styles/components/SpreadsheetPreviewTable.css';

/**
 * SpreadsheetPreviewTable Component
 * Single Responsibility: Render parsed preview table of spreadsheet data.
 * 1 File = 1 Component
 */
export const SpreadsheetPreviewTable = ({ previewRows = [] }) => {
  if (previewRows.length === 0) return null;

  return (
    <div className="spreadsheet-preview-container">
      <table className="spreadsheet-preview-table">
        <thead>
          <tr>
            <th className="spreadsheet-preview-th">Klaster</th>
            <th className="spreadsheet-preview-th">Kode</th>
            <th className="spreadsheet-preview-th">Nama Outlet</th>
            <th className="spreadsheet-preview-th">Alamat</th>
            <th className="spreadsheet-preview-th">Frekuensi</th>
          </tr>
        </thead>
        <tbody>
          {previewRows.slice(0, 5).map((row, idx) => (
            <tr key={idx}>
              <td className="spreadsheet-preview-td font-semibold">{row.clusterName}</td>
              <td className="spreadsheet-preview-td font-mono">{row.outletCode}</td>
              <td className="spreadsheet-preview-td">{row.customerName}</td>
              <td className="spreadsheet-preview-td text-xs text-on-surface-variant">{row.address}</td>
              <td className="spreadsheet-preview-td font-bold text-primary">{row.callFrequency}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
