import { categories, tools, stringify, initialValues, buttonStyle } from "./AdminConfigNavigation";
import { displayValue } from "./AdminConfigPage.shared";
import { ParameterGroup } from "./ConfigParameterGroup";
import {ConfigHistory} from './ConfigHistory';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { configApi } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { TAB_IDS } from '../../constants/navigation';
import '../../styles/pages/AdminConfig.css';




import { CONFIG_DEFINITIONS, parseConfigValue } from '../../../../shared/config.mjs';
import { codePolicy, validateCodePolicy } from '../../../../shared/coding.mjs';
import { LuSave, LuRefreshCw, LuArrowLeft, LuCheck, LuSearch, LuX, LuClipboardList, LuChevronRight, LuTriangleAlert } from 'react-icons/lu';
export const AdminConfigPage = () => {
  const {
    setActiveTab,
    refreshSettings
  } = useApp();
  const [configs, setConfigs] = useState({});
  const [editedValues, setEditedValues] = useState({});
  const [category, setCategory] = useState('outlet');
  const [groupKey, setGroupKey] = useState('NOO');
  const [lastGroups, setLastGroups] = useState({});
  const [toolKey, setToolKey] = useState('products');
  const [search, setSearch] = useState('');
  const [review, setReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const contentRef = useRef(null);
  const savedValues = initialValues(configs);
  const changes = loading || loadFailed ? [] : CONFIG_DEFINITIONS.flatMap(group => group.params.filter(p => editedValues[p.key] !== savedValues[p.key]).map(param => ({
    group,
    param
  })));
  const currentCategory = categories.find(c => c.key === category);
  const selectedGroup = CONFIG_DEFINITIONS.find(g => g.groupKey === groupKey);
  const query = search.trim().toLocaleLowerCase('id');
  const searchGroups = CONFIG_DEFINITIONS.map(group => ({
    ...group,
    params: group.params.filter(p => `${group.groupLabel} ${p.label} ${p.key} ${p.description}`.toLocaleLowerCase('id').includes(query))
  })).filter(g => g.params.length);
  const visibleGroups = query ? searchGroups : [selectedGroup];
  const Tool = tools.find(t => t.key === toolKey).component;
  const loadConfigs = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    setError('');
    setMessage('');
    setFieldErrors({});
    try {
      const res = await configApi.getAll();
      setConfigs(res?.data || {});
      setEditedValues(initialValues(res?.data || {}));
    } catch (err) {
      setLoadFailed(true);
      setError(`Pengaturan belum dapat dimuat. Coba muat ulang. ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);
  useEffect(() => {
    if (!changes.length) return;
    const warn = e => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [changes.length]);
  const navigate = next => {
    setLastGroups(prev => ({
      ...prev,
      [category]: groupKey
    }));
    setCategory(next.key);
    setGroupKey(lastGroups[next.key] || next.groups[0] || groupKey);
    setSearch('');
    setReview(false);
  };
  const openReview = () => {
    setReview(true);
    setSearch('');
    requestAnimationFrame(() => contentRef.current?.scrollIntoView({
      block: 'start',
      behavior: 'instant'
    }));
  };
  const openParameter = (group, key) => {
    const parent = categories.find(c => c.groups.includes(group.groupKey));
    setCategory(parent.key);
    setGroupKey(group.groupKey);
    setSearch('');
    setReview(false);
    requestAnimationFrame(() => {
      const input = document.getElementById(key);
      input?.scrollIntoView({
        block: 'center',
        behavior: 'instant'
      });
      input?.focus();
    });
  };
  const change = (key, value) => {
    setEditedValues(prev => ({
      ...prev,
      [key]: value
    }));
    setMessage('');
    setError('');
    setFieldErrors(prev => ({
      ...prev,
      [key]: undefined
    }));
  };
  const discard = () => {
    if (window.confirm(`Batalkan ${changes.length} perubahan yang belum disimpan?`)) {
      setEditedValues(savedValues);
      setFieldErrors({});
      setError('');
      setMessage('Perubahan dibatalkan.');
      setReview(false);
    }
  };
  const save = async () => {
    if (loading || saving || loadFailed || !changes.length) return;
    const errors = {},
      updates = {};
    for (const {
      param
    } of changes) {
      try {
        updates[param.key] = parseConfigValue(param, editedValues[param.key]);
      } catch (err) {
        errors[param.key] = err.message;
      }
    }
    for (const group of CONFIG_DEFINITIONS.filter(g => g.groupKey.startsWith('CODING_') && changes.some(c => c.group.groupKey === g.groupKey))) {
      try {
        validateCodePolicy(codePolicy(group.groupKey.slice(7), editedValues));
      } catch (err) {
        errors[group.params[0].key] = err.message;
      }
    }
    setFieldErrors(errors);
    setMessage('');
    if (Object.keys(errors).length) {
      setError('Ada parameter yang perlu diperbaiki. Pilih pesan di bawah untuk membuka pengaturannya.');
      openReview();
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await configApi.bulkUpdate(updates);
      const next = {
        ...configs,
        ...updates,
        ...res?.data
      };
      setConfigs(next);
      setEditedValues(initialValues(next));
      setReview(false);
      setMessage(`${changes.length} parameter berhasil disimpan.`);
      try {
        await refreshSettings();
      } catch {
        setError('Parameter sudah disimpan. Muat ulang halaman agar nilai terbaru tampil di seluruh menu.');
      }
    } catch (err) {
      setError(`Gagal menyimpan: ${err.message}. Perubahan Anda masih tersedia.`);
    } finally {
      setSaving(false);
    }
  };
  return <div className="config-page">
    <header className="config-heading">
      <div><h1>Parameter sistem</h1><p>Atur aturan operasional dan penomoran data.</p></div>
      <button type="button" className={buttonStyle} disabled={saving} onClick={() => {
        if (!changes.length || window.confirm('Perubahan belum disimpan. Tetap kembali ke menu admin?')) setActiveTab(TAB_IDS.ROLE_WORKSPACE);
      }}><LuArrowLeft /> Menu admin</button>
    </header>
    <ConfigHistory/>
    <div className="config-actionbar">
      <div role="status" className="config-save-status">{loading ? 'Memuat parameter…' : loadFailed ? 'Parameter belum dimuat' : changes.length ? `${changes.length} perubahan belum disimpan` : 'Tidak ada perubahan'}</div>
      <div className="config-actions"><button type="button" className={buttonStyle} disabled={!changes.length || saving} onClick={discard}>Batalkan</button><button type="button" className={buttonStyle} disabled={!changes.length || saving} onClick={openReview}>Tinjau ({changes.length})</button><button type="button" className={`${buttonStyle} config-button-primary`} disabled={loading || loadFailed || saving || !changes.length} onClick={save}><LuSave />{saving ? 'Menyimpan…' : 'Simpan'}</button></div>
    </div>
    <div className="bg-surface border border-border-glass rounded-2xl p-3 sm:p-4 flex flex-wrap gap-3 items-center">
      <div className="flex items-center gap-2 flex-1 min-w-0 basis-64">
        <LuSearch aria-hidden="true" className="shrink-0 text-on-surface-variant" />
        <input aria-label="Cari seluruh parameter sistem" type="search" value={search} onChange={e => {
          setSearch(e.target.value);
          setReview(false);
        }} placeholder="Cari radius NOO, absen, kode…" className="config-input" />
        {search && <button type="button" aria-label="Hapus pencarian" className="shrink-0 w-11 h-11 flex items-center justify-center rounded-xl focus-visible:ring-2 focus-visible:ring-primary" onClick={() => setSearch('')}><LuX /></button>}
      </div>
      <button type="button" className={buttonStyle} disabled={loading || saving} onClick={() => {
        if (!changes.length || window.confirm('Muat ulang akan membatalkan perubahan yang belum disimpan. Lanjutkan?')) loadConfigs();
      }}><LuRefreshCw className={loading ? 'animate-spin motion-reduce:animate-none' : ''} /> Muat ulang</button>
    </div>
    {error && <div role="alert" className="p-4 rounded-xl border border-rose-300 bg-rose-50 text-rose-900 text-sm flex gap-2"><LuTriangleAlert className="shrink-0 mt-0.5" />{error}</div>}
    {message && <div role="status" className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 text-sm flex gap-2"><LuCheck className="shrink-0 mt-0.5" />{message}</div>}
    <div className="config-mobile-navigation">
      <label htmlFor="config-category">Kategori</label>
      <select id="config-category" className="config-input" value={review ? 'review' : category} onChange={e => {
        if (e.target.value === 'review') openReview();else navigate(categories.find(c => c.key === e.target.value));
      }}>
        {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}<option value="review">Tinjau perubahan ({changes.length})</option>
      </select>
    </div>
    <div className="config-layout">
      <nav aria-label="Kategori parameter sistem" className="config-sidebar bg-surface border border-border-glass rounded-2xl p-3">
        <p className="text-xs font-semibold text-on-surface-variant px-3 pb-2">KATEGORI PENGATURAN</p>
        <div className="grid grid-cols-2 gap-1 lg:grid-cols-1">
          {categories.map(c => {
            const Icon = c.icon,
              count = changes.filter(x => c.groups.includes(x.group.groupKey)).length;
            const active = category === c.key && !query && !review;
            return <button type="button" key={c.key} aria-current={active ? 'page' : undefined} onClick={() => navigate(c)} className={`${buttonStyle} config-nav-button ${active ? 'config-nav-active' : ''}`}><Icon className="shrink-0" /><span className="flex-1">{c.label}</span>{count > 0 && <span aria-label={`${count} perubahan`} className="text-xs rounded-full bg-amber-100 text-amber-900 px-2 py-0.5">{count}</span>}</button>;
          })}
        </div>
        <div className="border-t border-border-glass mt-3 pt-3">
          <button type="button" aria-current={review ? 'page' : undefined} className={`${buttonStyle} config-nav-button ${review ? 'config-nav-active' : ''}`} onClick={openReview}><LuClipboardList /><span className="flex-1 text-left">Tinjau perubahan</span><span>{changes.length}</span></button>
          <p className="text-xs text-on-surface-variant px-3 pt-3 leading-relaxed">Perubahan tetap tersimpan sebagai draf saat berpindah kategori.</p>
        </div>
      </nav>
      <div ref={contentRef} role="region" aria-label="Isi pengaturan" aria-busy={loading || saving} className="config-content min-w-0 space-y-4">
        {loading ? <div role="status" className="bg-surface rounded-2xl border border-border-glass p-12 text-center text-on-surface-variant"><LuRefreshCw className="animate-spin motion-reduce:animate-none mx-auto mb-3" />Memuat parameter sistem…</div> : loadFailed ? <div className="bg-surface p-6 rounded-2xl border border-border-glass"><h2 className="font-bold mb-2">Pengaturan belum tersedia</h2><p className="text-sm text-on-surface-variant mb-4">Muat ulang untuk mengambil nilai yang tersimpan sebelum mengubah parameter.</p><button className={buttonStyle} type="button" onClick={loadConfigs}>Coba lagi</button></div> : review ? <section className="bg-surface border border-border-glass rounded-2xl p-5 space-y-4">
          <div><h2 className="text-lg font-bold">Tinjau perubahan</h2><p className="text-sm text-on-surface-variant mt-1">{changes.length ? `${changes.length} parameter akan diterapkan setelah Anda menyimpan.` : 'Belum ada perubahan. Pilih kategori untuk mulai mengatur sistem.'}</p></div>
          {Object.entries(fieldErrors).filter(([, value]) => value).map(([key, value]) => {
            const group = CONFIG_DEFINITIONS.find(g => g.params.some(p => p.key === key));
            return <button key={key} type="button" className="block w-full text-left text-sm text-rose-900 bg-rose-50 border border-rose-300 rounded-xl p-3 underline" onClick={() => openParameter(group, key)}>{group.groupLabel}: {value}</button>;
          })}
          {changes.map(({
            group,
            param
          }) => <div key={param.key} className="border border-border-glass rounded-xl p-4 space-y-2">
            <button type="button" className="text-left font-semibold text-sm flex gap-2 items-center min-h-11 hover:underline focus-visible:ring-2 focus-visible:ring-primary rounded" onClick={() => openParameter(group, param.key)}>{param.label}<LuChevronRight /></button>
            <p className="text-xs text-on-surface-variant">{group.groupLabel}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm"><div className="bg-surface-container rounded-lg p-3 break-all"><span className="text-xs text-on-surface-variant block mb-1">Tersimpan</span>{displayValue(param, savedValues[param.key])}</div><div className="bg-primary/5 rounded-lg p-3 break-all"><span className="text-xs text-on-surface-variant block mb-1">Perubahan baru</span>{displayValue(param, editedValues[param.key])}</div></div>
            <button type="button" disabled={saving} className="text-xs underline min-h-11 text-on-surface-variant" onClick={() => change(param.key, savedValues[param.key])}>Batalkan perubahan ini</button>
          </div>)}
        </section> : category === 'tools' && !query ? <>
          <div><h2 className="text-lg font-bold">Alat operasional</h2><p className="text-sm text-on-surface-variant mt-1">Kelola data dan jalankan kegiatan harian. Setiap alat memiliki tombol simpan atau proses sendiri.</p>{changes.length > 0 && <p role="status" className="text-sm mt-3 border border-amber-300 bg-amber-50 text-amber-900 rounded-xl p-3">Alat ini memakai parameter yang sudah tersimpan. Simpan perubahan parameter terlebih dahulu jika ingin menggunakannya di sini.</p>}</div>
          <div role="group" aria-label="Pilih alat operasional" className="flex flex-wrap gap-2">{tools.map(t => <button type="button" key={t.key} aria-pressed={toolKey === t.key} onClick={() => setToolKey(t.key)} className={`${buttonStyle} ${toolKey === t.key ? 'bg-primary/10 text-primary border-primary/30' : 'bg-surface'}`}>{t.label}</button>)}</div><Tool />
        </> : <>
          <div><h2 className="text-lg font-bold">{query ? 'Hasil pencarian' : currentCategory.label}</h2><p className="text-sm text-on-surface-variant mt-1">{query ? `${searchGroups.reduce((sum, g) => sum + g.params.length, 0)} parameter ditemukan di seluruh kategori.` : 'Pilih kelompok pengaturan di bawah. Nilai yang diubah ditandai hingga disimpan.'}</p></div>
          {!query && <div className="config-group-picker"><label htmlFor="config-group">Kelompok pengaturan</label><select id="config-group" className="config-input" value={groupKey} onChange={e => setGroupKey(e.target.value)}>{currentCategory.groups.map(key => {
                const g = CONFIG_DEFINITIONS.find(item => item.groupKey === key);
                return <option key={key} value={key}>{g.groupLabel.replace('Pengkodean: ', '')}</option>;
              })}</select></div>}
          {query && !searchGroups.length && <div className="bg-surface border border-border-glass rounded-2xl p-8 text-center"><LuSearch className="mx-auto mb-3 text-on-surface-variant" /><h3 className="font-semibold">Parameter tidak ditemukan</h3><p className="text-sm text-on-surface-variant mt-2">Coba kata seperti radius, NOO, kode, atau absensi.</p><button type="button" className={`${buttonStyle} mt-4`} onClick={() => setSearch('')}>Hapus pencarian</button></div>}
          {visibleGroups.map(group => <ParameterGroup key={group.groupKey} group={group} values={editedValues} savedValues={savedValues} change={change} errors={fieldErrors} disabled={saving} search={Boolean(query)} onReset={() => {
            setEditedValues(prev => ({
              ...prev,
              ...Object.fromEntries(group.params.map(p => [p.key, stringify(p.defaultValue)]))
            }));
            setMessage('Nilai bawaan kelompok ini dimasukkan ke draf. Tinjau lalu simpan untuk menerapkannya.');
            setFieldErrors({});
          }} />)}
        </>}
      </div>
    </div>
  </div>;
};
