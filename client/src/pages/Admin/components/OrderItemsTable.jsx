import React from 'react';

export const OrderItemsTable = ({ items, totalAmount }) => {
  return (
    <div className="space-y-1.5 text-xs border-t border-border-glass pt-3">
      <span className="font-bold text-on-surface block">Rincian Item SKU:</span>
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center justify-between text-on-surface-variant">
          <span>
            {item.productName} ({item.qty}x)
          </span>
          <span className="font-semibold text-on-surface">Rp {item.subtotal.toLocaleString('id-ID')}</span>
        </div>
      ))}
      <div className="flex items-center justify-between font-bold text-sm text-primary pt-2 border-t border-border-glass/50">
        <span>Total Nilai Order:</span>
        <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
      </div>
    </div>
  );
};
