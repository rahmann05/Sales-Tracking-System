import React from 'react';
export function ValidationFilters({search,onSearch,onRefresh,loading,total}) {
 return <div className="outlet-review-toolbar"><label className="app-field"><span>Cari kasus pemeriksaan</span><input type="search" value={search} onChange={e=>onSearch(e.target.value)} placeholder="Nama, kode, atau alamat outlet"/></label><span className="outlet-muted">{total} kasus sesuai filter</span><button type="button" className="app-button" disabled={loading} onClick={onRefresh}>Perbarui</button></div>;
}
