import { StaffAttendanceReport } from '../../shared/components/common/StaffAttendanceReport';
import React, { useState, useEffect, useCallback } from 'react';
import { configApi } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { TAB_IDS } from '../../constants/navigation';
import { PageHeader } from '../../shared/components/common/PageHeader';
import {
  LuSettings,
  LuSave,
  LuRefreshCw,
  LuMapPin,
  LuShieldCheck,
  LuBuilding,
  LuTruck,
  LuArrowLeft,
  LuCheck,
  LuTriangleAlert,
  LuTarget,
  LuKey,
  LuGlobe,
  LuPhoneCall,
  LuCreditCard,
} from 'react-icons/lu';

import { CONFIG_DEFINITIONS, parseConfigValue } from '../../../../shared/config.mjs';
import { ProductCatalogManager } from './components/ProductCatalogManager';
const groupIcons = { LuMapPin, LuTarget, LuPhoneCall, LuCreditCard, LuBuilding, LuTruck, LuKey, LuGlobe, LuShieldCheck };

const groupColorMap = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: 'bg-blue-100 text-blue-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: 'bg-amber-100 text-amber-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: 'bg-emerald-100 text-emerald-600' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', icon: 'bg-violet-100 text-violet-600' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: 'bg-rose-100 text-rose-600' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', icon: 'bg-cyan-100 text-cyan-600' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: 'bg-indigo-100 text-indigo-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: 'bg-purple-100 text-purple-600' },
};

/**
 * AdminConfigPage
 * Full-featured system configuration management for Admin.
 * Loads all parameters from SystemConfig and allows editing/saving.
 */
export const AdminConfigPage = () => {
  const { setActiveTab, refreshSettings } = useApp();
  const [loadFailed, setLoadFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [configs, setConfigs] = useState({});
  const [editedValues, setEditedValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  const loadConfigs = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    setError(null);
    try {
      const res = await configApi.getAll();
      const serverConfigs = res?.data || {};
      setConfigs(serverConfigs);

      // Initialize editedValues with server values or defaults
      const initial = {};
      CONFIG_DEFINITIONS.forEach((group) => {
        group.params.forEach((param) => {
          const serverVal = serverConfigs[param.key];
          initial[param.key] = serverVal !== undefined && serverVal !== null
            ? (typeof serverVal === 'object' ? JSON.stringify(serverVal) : String(serverVal))
            : String(param.defaultValue);
        });
      });
      setEditedValues(initial);
    } catch (err) {
      console.warn('[AdminConfigPage] Load configs error:', err.message);
      setLoadFailed(true);
      // Fallback to defaults
      const initial = {};
      CONFIG_DEFINITIONS.forEach((group) => {
        group.params.forEach((param) => {
          initial[param.key] = String(param.defaultValue);
        });
      });
      setEditedValues(initial);
      setError('Tidak dapat memuat konfigurasi dari server. Menampilkan nilai default.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  const handleChange = (key, value) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
    setSaveSuccess(false);
    setError(null);
  };

  const hasChanges = () => {
    return CONFIG_DEFINITIONS.some((group) =>
      group.params.some((param) => {
        const serverVal = configs[param.key];
        const editedVal = editedValues[param.key];
        const serverStr = serverVal !== undefined && serverVal !== null
          ? String(typeof serverVal === 'object' ? JSON.stringify(serverVal) : serverVal)
          : String(param.defaultValue);
        return editedVal !== serverStr;
      })
    );
  };

  const handleSave = async () => {
    if (loading || saving || loadFailed) return;
    setSaving(true);
    setSaveSuccess(false);
    setError(null);
    try {
      const configMap = {};
      CONFIG_DEFINITIONS.forEach((group) => {
        group.params.forEach((param) => {
          const rawVal = editedValues[param.key];
          const previous = configs[param.key] ?? param.defaultValue;
          if (String(previous) !== rawVal) configMap[param.key] = parseConfigValue(param, rawVal);
        });
      });

      const res = await configApi.bulkUpdate(configMap);
      await refreshSettings();
      setConfigs(res?.data || configMap);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.warn('[AdminConfigPage] Save error:', err.message);
      setError(`Gagal menyimpan: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (loading || saving || loadFailed) return;
    const defaults = {};
    CONFIG_DEFINITIONS.forEach((group) => {
      group.params.forEach((param) => {
        defaults[param.key] = String(param.defaultValue);
      });
    });
    setEditedValues(defaults);
    setSaveSuccess(false);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <PageHeader
        badge={
          <span className="px-3 py-1 bg-surface-container text-on-surface border border-border-glass text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5">
            <LuSettings className="text-sm" /> PENGATURAN PARAMETER SISTEM
          </span>
        }
        title="Pengaturan & Konfigurasi Sistem"
        subtitle="Kelola seluruh parameter operasional distribusi, geofence absensi, validasi GPS, divisi cabang, logistik, dan keamanan sesi dari satu panel terpusat."
      />

      {/* Alert banners */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-sm text-rose-800">
          <LuTriangleAlert className="text-lg shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-sm text-emerald-800 animate-in fade-in">
          <LuCheck className="text-lg shrink-0" />
          <span className="font-bold">Perubahan pengaturan berhasil disimpan.</span>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-3 -mx-4 px-4 md:-mx-6 md:px-6 border-b border-border-glass">
        <button
          type="button"
          onClick={() => setActiveTab(TAB_IDS.ROLE_WORKSPACE)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface border border-border-glass text-xs font-bold text-on-surface hover:bg-surface-variant transition-all cursor-pointer"
        >
          <LuArrowLeft className="text-sm" />
          <span>Kembali</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={loadConfigs}
            disabled={loading || saving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface border border-border-glass text-xs font-bold text-on-surface-variant hover:bg-surface-variant transition-all cursor-pointer disabled:opacity-50"
          >
            <LuRefreshCw className={`text-sm ${loading ? 'animate-spin' : ''}`} />
            <span>Muat Ulang</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface border border-border-glass text-xs font-bold text-on-surface-variant hover:bg-surface-variant transition-all cursor-pointer"
          >
            <span>Reset Default</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={loading || loadFailed || saving || !hasChanges()}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
              hasChanges()
                ? 'bg-primary text-white hover:bg-neutral-800'
                : 'bg-surface-container text-on-surface-variant border border-border-glass'
            } disabled:opacity-50`}
          >
            <LuSave className="text-sm" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Semua Parameter'}</span>
          </button>
        </div>
      </div>

      <ProductCatalogManager />
      <StaffAttendanceReport />
      <label className="block space-y-2 text-sm font-semibold">Cari pengaturan
        <input className="form-input w-full" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari absensi, izin sales, logistik…" />
      </label>
      {/* Config Groups */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LuRefreshCw className="text-2xl text-on-surface-variant animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {CONFIG_DEFINITIONS.map(group => ({ ...group, params: group.params.filter(param => `${param.label} ${param.description}`.toLowerCase().includes(search.toLowerCase())) })).filter(group => group.params.length).map((group) => {
            const colorSet = groupColorMap[group.groupColor] || groupColorMap.blue;
            const GroupIcon = groupIcons[group.groupIcon];

            return (
              <div
                key={group.groupKey}
                className="bg-surface border border-border-glass rounded-2xl overflow-hidden shadow-xs"
              >
                {/* Group Header */}
                <div className={`${colorSet.bg} ${colorSet.border} border-b px-5 py-4 flex items-center gap-3`}>
                  <div className={`w-10 h-10 rounded-xl ${colorSet.icon} flex items-center justify-center text-lg shrink-0`}>
                    <GroupIcon />
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold ${colorSet.text} m-0`}>{group.groupLabel}</h3>
                    <p className="text-xs text-on-surface-variant font-normal m-0 mt-0.5">{group.groupDescription}</p>
                  </div>
                  <span className={`ml-auto text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${colorSet.bg} ${colorSet.text} border ${colorSet.border}`}>
                    {group.params.length} parameter
                  </span>
                </div>

                {/* Parameters */}
                <div className="divide-y divide-border-glass">
                  {group.params.map((param) => {
                    const value = editedValues[param.key] ?? '';
                    const serverVal = configs[param.key];
                    const serverStr = serverVal !== undefined && serverVal !== null
                      ? String(typeof serverVal === 'object' ? JSON.stringify(serverVal) : serverVal)
                      : String(param.defaultValue);
                    const isModified = value !== serverStr;

                    return (
                      <div key={param.key} className="px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-3">
                        {/* Label & Description */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <label htmlFor={param.key} className="text-sm font-bold text-on-surface">
                              {param.label}
                            </label>
                            {isModified && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                                Diubah
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-on-surface-variant font-normal m-0 mt-1 leading-relaxed">
                            {param.description}
                          </p>
                          <span className="text-[10px] text-on-surface-variant/60 font-mono mt-1 block">
                            Default: {String(param.defaultValue)}{param.unit ? ` ${param.unit}` : ''}
                          </span>
                        </div>

                        {/* Input */}
                        <div className="w-full sm:w-64 shrink-0">
                          {param.type === 'boolean' ? (<select id={param.key} className="form-select w-full" value={value} onChange={e => handleChange(param.key, e.target.value)}><option value="true">Diizinkan / Aktif</option><option value="false">Tidak diizinkan / Nonaktif</option></select>) : param.type === 'select' ? (
                            <select
                              id={param.key}
                              value={value}
                              onChange={(e) => handleChange(param.key, e.target.value)}
                              className="w-full px-3 py-2.5 rounded-xl bg-surface-container border border-border-glass text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer appearance-none"
                            >
                              {param.options.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : param.type === 'number' ? (
                            <div className="relative">
                              <input
                                id={param.key}
                                step="any"
                                type="number"
                                value={value}
                                onChange={(e) => handleChange(param.key, e.target.value)}
                                min={param.min}
                                max={param.max}
                                className="w-full px-3 py-2.5 rounded-xl bg-surface-container border border-border-glass text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all pr-14"
                              />
                              {param.unit && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant font-medium">
                                  {param.unit}
                                </span>
                              )}
                            </div>
                          ) : (
                            <input
                              id={param.key}
                              type="text"
                              value={value}
                              onChange={(e) => handleChange(param.key, e.target.value)}
                              className="w-full px-3 py-2.5 rounded-xl bg-surface-container border border-border-glass text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="rounded-2xl bg-surface border border-border-glass p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-on-surface-variant shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
            <LuShieldCheck className="text-base" />
          </div>
          <div>
            <span className="font-bold text-on-surface block">Perubahan Memerlukan Hak Akses Admin</span>
            <span className="text-[11px]">
              Pengaturan diterapkan setelah disimpan. Sesi pengguna lain diperbarui otomatis dalam satu menit.
            </span>
          </div>
        </div>
        <span className="text-[11px] font-semibold">
          {CONFIG_DEFINITIONS.reduce((acc, g) => acc + g.params.length, 0)} Total Parameter Terdaftar
        </span>
      </div>
    </div>
  );
};
