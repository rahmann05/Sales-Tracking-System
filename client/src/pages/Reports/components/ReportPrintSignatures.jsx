import React from 'react';

/**
 * ReportPrintSignatures Component
 * Renders the 3-column signature block for printable sales reports.
 */
export const ReportPrintSignatures = ({ salesmanName }) => (
  <div className="grid grid-cols-3 gap-4 pt-2 text-center text-[10px] break-inside-avoid">
    <div className="border border-gray-300 p-2.5 rounded-sm">
      <span className="text-gray-500 font-bold block mb-12">Dibuat Oleh (Salesman),</span>
      <div className="border-t border-gray-400 pt-1 font-bold text-gray-900">
        ( {salesmanName || 'Sales Field Terkait'} )
      </div>
      <span className="text-[8.5px] text-gray-500">Sales Representative</span>
    </div>

    <div className="border border-gray-300 p-2.5 rounded-sm">
      <span className="text-gray-500 font-bold block mb-12">Diperiksa Oleh (Supervisor),</span>
      <div className="border-t border-gray-400 pt-1 font-bold text-gray-900">
        ( ____________________ )
      </div>
      <span className="text-[8.5px] text-gray-500">Supervisor Distribusi</span>
    </div>

    <div className="border border-gray-300 p-2.5 rounded-sm">
      <span className="text-gray-500 font-bold block mb-12">Disetujui Oleh (Admin Penjualan),</span>
      <div className="border-t border-gray-400 pt-1 font-bold text-gray-900">
        ( ____________________ )
      </div>
      <span className="text-[8.5px] text-gray-500">Admin Penjualan</span>
    </div>
  </div>
);
