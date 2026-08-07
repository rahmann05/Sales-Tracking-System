import React, { useState, useRef } from 'react';
import { LuX, LuFileSpreadsheet, LuDownload, LuUpload, LuCheck } from 'react-icons/lu';
import { SpreadsheetPreviewTable } from './SpreadsheetPreviewTable';
import { parseSpreadsheetCsv, generateCsvTemplateContent } from '../../../../services/spreadsheetImportService';
import '../../../../styles/components/SpreadsheetImportModal.css';

/**
 * SpreadsheetImportModal Component
 * Single Responsibility: File Uploader, CSV previewer & Generator for Master RJP Clusters.
 * 1 File = 1 Component
 */
export const SpreadsheetImportModal = ({ isOpen, onClose, onImportSuccess }) => {
  const [csvContent, setCsvContent] = useState('');
  const [previewRows, setPreviewRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setCsvContent(text);
        const parsed = parseSpreadsheetCsv(text);
        setPreviewRows(parsed);
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const templateText = generateCsvTemplateContent();
    const blob = new Blob([templateText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Template_Master_RJP_BandungBarat_Cimahi.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProcessImport = () => {
    if (!csvContent) {
      alert('Pilih file spreadsheet / CSV terlebih dahulu.');
      return;
    }

    try {
      const result = onImportSuccess(csvContent);
      alert(`Berhasil mengimpor ${result?.importedOutletsCount || previewRows.length} outlet ke dalam Master RJP!`);
    } catch (err) {
      alert(err.message || 'Gagal memproses file spreadsheet.');
    }
  };

  return (
    <div className="import-modal-backdrop">
      <div className="import-modal-box">
        <div className="import-modal-header">
          <div className="flex items-center gap-2">
            <LuFileSpreadsheet className="text-emerald-600 text-xl" />
            <h3 className="import-modal-title">Impor Data Master RJP dari Spreadsheet</h3>
          </div>
          <button type="button" onClick={onClose} className="import-modal-close">
            <LuX />
          </button>
        </div>

        <div className="import-modal-body">
          {/* Template Download Prompt */}
          <div className="import-template-row">
            <span className="text-on-surface-variant font-medium">
              Belum punya format file? Unduh template resmi kami:
            </span>
            <button type="button" onClick={handleDownloadTemplate} className="import-btn-download-template">
              <LuDownload /> Unduh Template CSV
            </button>
          </div>

          {/* Drag & Drop / File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,.xlsx,.xls"
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="import-dropzone"
          >
            <LuUpload className="import-dropzone-icon" />
            <div>
              <p className="font-bold text-sm text-on-surface">
                {fileName ? `File Terpilih: ${fileName}` : 'Klik untuk memilih file CSV atau Spreadsheet'}
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Mendukung format .CSV, .XLSX dengan kolom Cluster, Kode Toko, Nama, Alamat, Lat, Lng
              </p>
            </div>
          </div>

          {/* Live Preview of parsed rows */}
          {previewRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-on-surface">
                  Preview Data Terbaca ({previewRows.length} Baris):
                </span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <LuCheck /> Format Valid
                </span>
              </div>
              <SpreadsheetPreviewTable previewRows={previewRows} />
            </div>
          )}
        </div>

        <div className="import-modal-footer">
          <button type="button" onClick={onClose} className="create-cluster-btn-cancel">
            Batal
          </button>
          <button
            type="button"
            onClick={handleProcessImport}
            disabled={previewRows.length === 0}
            className="create-cluster-btn-submit disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Proses & Generate Master RJP ({previewRows.length} Toko)
          </button>
        </div>
      </div>
    </div>
  );
};
