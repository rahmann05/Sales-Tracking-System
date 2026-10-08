import React from 'react';
import {unitDescription} from '../../../../../shared/product-units.mjs';

export const OrderItemsTable = ({ items, totalAmount }) => {
  return (
    <div className="order-items-table overflow-x-auto">
      <table className="w-full text-xs text-left"><caption className="text-left font-semibold pb-3">Rincian barang</caption><thead><tr><th>Barang / satuan</th><th>Jumlah</th><th>Harga satuan</th><th>Subtotal</th></tr></thead><tbody>{items.map((item,index)=><tr key={item.productId||index}><td><strong>{item.productName}</strong><span className="block text-on-surface-variant">{unitDescription(item)}</span></td><td>{item.qty}</td><td>Rp {Number(item.unitPrice||0).toLocaleString('id-ID')}</td><td>Rp {Number(item.subtotal||0).toLocaleString('id-ID')}</td></tr>)}</tbody><tfoot><tr><th colSpan={3}>Total nilai order</th><td>Rp {Number(totalAmount||0).toLocaleString('id-ID')}</td></tr></tfoot></table>
    </div>
  );
};
