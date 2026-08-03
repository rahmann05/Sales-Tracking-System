import React from 'react';
import { LuPlus, LuMinus } from 'react-icons/lu';

/**
 * ProductOrderItem Component (Single Responsibility: Individual SKU Row in Order Form)
 * 1 File per Component
 */
export const ProductOrderItem = ({ product, qty, onQtyChange }) => {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-border-glass bg-surface/50">
      <div>
        <p className="font-bold text-xs text-on-surface">{product.name}</p>
        <p className="text-[11px] text-on-surface-variant">
          Rp {product.price.toLocaleString('id-ID')} / {product.code} • Stok: {product.stock}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onQtyChange(product, -1)}
          className="w-7 h-7 rounded-lg border border-border-glass flex items-center justify-center text-on-surface hover:bg-surface-variant transition-all"
        >
          <LuMinus className="text-xs" />
        </button>
        <span className="w-6 text-center font-bold text-xs text-on-surface">{qty}</span>
        <button
          type="button"
          onClick={() => onQtyChange(product, 1)}
          className="w-7 h-7 rounded-lg bg-primary text-on-primary flex items-center justify-center hover:bg-primary/90 transition-all"
        >
          <LuPlus className="text-xs" />
        </button>
      </div>
    </div>
  );
};
