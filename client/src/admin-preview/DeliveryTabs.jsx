import React from 'react';

export default function DeliveryTabs({ page, go }) {
  return <nav className="section-tabs" aria-label="Fitur packing dan pengiriman">{[['packing', 'Packing list'], ['routes', 'Rute & alokasi'], ['monitor', 'Monitor pengiriman'], ['vehicles', 'Kendaraan']].map(([id, title]) => <button key={id} aria-current={page === id || (page === 'editor' && id === 'packing') ? 'page' : undefined} onClick={() => go(id)}>{title}</button>)}</nav>;
}
