import React, { useState } from 'react';
import { FiCheckSquare, FiSquare } from 'react-icons/fi';

/**
 * HelperChecklist Component (Single Responsibility: Unloading & Physical SKU Checklist for Helper)
 * 1 File per Component
 */
export const HelperChecklist = ({ itemsCount = 4 }) => {
  const [checkedItems, setCheckedItems] = useState({
    item1: true,
    item2: true,
    item3: false,
  });

  const toggleItem = (key) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="p-3 bg-surface-variant/30 rounded-2xl border border-border-glass space-y-2 text-xs">
      <div className="flex items-center justify-between font-bold text-on-surface">
        <span>Checklist Muatan Fisik (Tugas Helper):</span>
        <span className="text-[11px] text-emerald-600 font-semibold">{itemsCount} Jenis SKU</span>
      </div>

      <div className="space-y-1.5">
        <label
          onClick={() => toggleItem('item1')}
          className="flex items-center gap-2 cursor-pointer text-on-surface hover:text-primary"
        >
          {checkedItems.item1 ? (
            <FiCheckSquare className="text-emerald-600 text-base flex-shrink-0" />
          ) : (
            <FiSquare className="text-on-surface-variant text-base flex-shrink-0" />
          )}
          <span>Kardus / Segel Fisik Utuh & Tidak Rusak</span>
        </label>

        <label
          onClick={() => toggleItem('item2')}
          className="flex items-center gap-2 cursor-pointer text-on-surface hover:text-primary"
        >
          {checkedItems.item2 ? (
            <FiCheckSquare className="text-emerald-600 text-base flex-shrink-0" />
          ) : (
            <FiSquare className="text-on-surface-variant text-base flex-shrink-0" />
          )}
          <span>Kesesuaian Jumlah SKU dengan Surat Jalan</span>
        </label>

        <label
          onClick={() => toggleItem('item3')}
          className="flex items-center gap-2 cursor-pointer text-on-surface hover:text-primary"
        >
          {checkedItems.item3 ? (
            <FiCheckSquare className="text-emerald-600 text-base flex-shrink-0" />
          ) : (
            <FiSquare className="text-on-surface-variant text-base flex-shrink-0" />
          )}
          <span>Barang Diturunkan ke Lokasi Toko Penerima</span>
        </label>
      </div>
    </div>
  );
};
