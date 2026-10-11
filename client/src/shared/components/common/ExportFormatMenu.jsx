import React, { useState, useRef, useEffect } from 'react';
import {
  LuDownload,
  LuFileText,
  LuFileSpreadsheet,
  LuFileCode,
  LuFileCheck,
  LuPrinter,
  LuChevronDown,
  LuLoader,
} from 'react-icons/lu';

/**
 * ExportFormatMenu Component
 * Single Responsibility: Unified multi-format document export dropdown menu
 * supporting DOCX (.docx), Excel (.xlsx), CSV (.csv), TXT (.txt), PDF (.pdf), and Print view.
 */
export const ExportFormatMenu = ({
  label = 'Ekspor Dokumen',
  exporters,
  onExportDocx,
  onExportExcel,
  onExportCsv,
  onExportTxt,
  onExportPdf,
  onPrint,
  disabled = false,
  compact = false,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [busyFormat, setBusyFormat] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const handleAction = async (key, fn) => {
    if (!fn || busyFormat) return;
    try {
      setBusyFormat(key);
      await fn();
    } catch (err) {
      console.error(`[ExportFormatMenu] Failed exporting ${key}:`, err);
    } finally {
      setBusyFormat(null);
      setOpen(false);
    }
  };

  const docxHandler = onExportDocx || exporters?.toDocx;
  const excelHandler = onExportExcel || exporters?.toExcel;
  const csvHandler = onExportCsv || exporters?.toCsv;
  const txtHandler = onExportTxt || exporters?.toTxt;
  const pdfHandler = onExportPdf || exporters?.toPdf;

  const items = [
    docxHandler && {
      key: 'DOCX',
      title: 'Word (.docx)',
      sub: 'Dokumen Microsoft Word',
      icon: LuFileText,
      color: 'text-blue-600',
      bgHover: 'hover:bg-blue-500/10',
      action: docxHandler,
    },
    excelHandler && {
      key: 'XLSX',
      title: 'Excel (.xlsx)',
      sub: 'Spreadsheet terstruktur',
      icon: LuFileSpreadsheet,
      color: 'text-emerald-600',
      bgHover: 'hover:bg-emerald-500/10',
      action: excelHandler,
    },
    csvHandler && {
      key: 'CSV',
      title: 'CSV (.csv)',
      sub: 'Data tabel dipisah koma',
      icon: LuFileCode,
      color: 'text-teal-600',
      bgHover: 'hover:bg-teal-500/10',
      action: csvHandler,
    },
    txtHandler && {
      key: 'TXT',
      title: 'Teks (.txt)',
      sub: 'Dokumen teks terformat',
      icon: LuFileText,
      color: 'text-amber-600',
      bgHover: 'hover:bg-amber-500/10',
      action: txtHandler,
    },
    pdfHandler && {
      key: 'PDF',
      title: 'PDF (.pdf)',
      sub: 'Dokumen siap cetak A4',
      icon: LuFileCheck,
      color: 'text-rose-600',
      bgHover: 'hover:bg-rose-500/10',
      action: pdfHandler,
    },
    onPrint && {
      key: 'PRINT',
      title: 'Pratinjau & Cetak',
      sub: 'Tampilan cetak langsung',
      icon: LuPrinter,
      color: 'text-slate-600',
      bgHover: 'hover:bg-slate-500/10',
      action: onPrint,
    },
  ].filter(Boolean);

  if (items.length === 0) return null;

  return (
    <div ref={menuRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        disabled={disabled || Boolean(busyFormat)}
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all cursor-pointer border border-border-glass shadow-xs ${
          compact ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-xs'
        } ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-surface-container text-on-surface-variant'
            : 'bg-primary text-white hover:bg-primary/90'
        }`}
      >
        {busyFormat ? (
          <LuLoader className="text-sm animate-spin" />
        ) : (
          <LuDownload className="text-sm" />
        )}
        <span>{busyFormat ? `Mengekspor ${busyFormat}...` : label}</span>
        <LuChevronDown className={`text-xs transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-60 rounded-2xl bg-surface border border-border-glass shadow-xl z-50 py-1.5 overflow-hidden">
          <div className="px-3 py-1.5 border-b border-border-glass text-[10px] font-black uppercase tracking-wider text-on-surface-variant">
            Pilih Format Dokumen
          </div>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleAction(item.key, item.action)}
                className={`w-full px-3.5 py-2 text-left flex items-center gap-3 transition-colors cursor-pointer ${item.bgHover}`}
              >
                <div
                  className={`w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0 ${item.color}`}
                >
                  <Icon className="text-base" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-extrabold text-on-surface leading-tight">
                    {item.title}
                  </div>
                  <div className="text-[10px] text-on-surface-variant truncate">{item.sub}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
