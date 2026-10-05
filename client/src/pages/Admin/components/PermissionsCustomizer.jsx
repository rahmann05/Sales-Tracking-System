/**
 * PermissionsCustomizer.jsx
 * Single Responsibility: Interactive permissions grid organized by functional categories,
 * supporting quick search, toggle switches, bulk select, and reset to role template.
 * 
 * NOTE: Strict compliance - Zero emojis. Pure React Icons.
 */

import React, { useState, useMemo } from 'react';
import {
  LuSearch,
  LuRotateCcw,
  LuCheckCheck,
  LuShield,
  LuShieldAlert,
  LuChevronDown,
  LuChevronUp,
} from 'react-icons/lu';
import {
  ALL_PERMISSIONS,
  PERMISSION_CATEGORIES,
} from '../../../constants/permissions';

export const PermissionsCustomizer = ({
  permissions,
  onTogglePermission,
  onBulkSet,
  onResetToTemplate,
  selectedRoleName = '',
  isModified = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState({});

  // Active permission count
  const activeCount = useMemo(() => {
    return Object.values(permissions || {}).filter(Boolean).length;
  }, [permissions]);

  const totalCount = ALL_PERMISSIONS.length;

  // Filtered permissions by search query
  const filteredPermissions = useMemo(() => {
    if (!searchQuery.trim()) return ALL_PERMISSIONS;
    const q = searchQuery.toLowerCase();
    return ALL_PERMISSIONS.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q) ||
        p.key.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Group filtered permissions by category
  const groupedPermissions = useMemo(() => {
    const groups = {};
    for (const cat of PERMISSION_CATEGORIES) {
      groups[cat.id] = {
        category: cat,
        items: [],
      };
    }
    for (const p of filteredPermissions) {
      if (groups[p.categoryId]) {
        groups[p.categoryId].items.push(p);
      }
    }
    return Object.values(groups).filter((g) => g.items.length > 0);
  }, [filteredPermissions]);

  const toggleCategoryCollapse = (catId) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleSelectAll = () => {
    const next = {};
    ALL_PERMISSIONS.forEach((p) => {
      next[p.key] = true;
    });
    onBulkSet(next);
  };

  const handleClearAll = () => {
    const next = {};
    ALL_PERMISSIONS.forEach((p) => {
      next[p.key] = false;
    });
    onBulkSet(next);
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Header & Status Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border-glass">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Kustomisasi Hak Akses Fitur
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
              {activeCount} / {totalCount} Aktif
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            {isModified ? (
              <span className="text-amber-600 font-semibold flex items-center gap-1">
                <LuShieldAlert className="text-xs shrink-0" />
                Izin dimodifikasi dari template role {selectedRoleName}
              </span>
            ) : (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <LuShield className="text-xs shrink-0" />
                Mengikuti template default role {selectedRoleName}
              </span>
            )}
          </p>
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onResetToTemplate}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-on-surface-variant bg-surface-container hover:bg-surface-variant rounded-lg border border-border-glass transition-colors cursor-pointer"
            title="Kembalikan semua izin ke standar role yang dipilih"
          >
            <LuRotateCcw className="text-xs" />
            <span>Reset Template</span>
          </button>
          <button
            type="button"
            onClick={handleSelectAll}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-on-surface-variant bg-surface-container hover:bg-surface-variant rounded-lg border border-border-glass transition-colors cursor-pointer"
            title="Aktifkan seluruh izin"
          >
            <LuCheckCheck className="text-xs" />
            <span>Semua</span>
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="px-2.5 py-1 text-[11px] font-bold text-on-surface-variant bg-surface-container hover:bg-surface-variant rounded-lg border border-border-glass transition-colors cursor-pointer"
            title="Nonaktifkan seluruh izin"
          >
            Kosongkan
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari izin fitur atau halaman..."
          className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-surface-container/60 border border-border-glass text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
      </div>

      {/* Categorized Permissions List */}
      <div className="flex-1 overflow-y-auto space-y-3 max-h-[380px] pr-1">
        {groupedPermissions.length === 0 ? (
          <div className="p-8 text-center text-xs text-on-surface-variant">
            Tidak ada fitur yang cocok dengan pencarian &quot;{searchQuery}&quot;
          </div>
        ) : (
          groupedPermissions.map(({ category, items }) => {
            const CategoryIcon = category.icon;
            const isCollapsed = !!collapsedCategories[category.id];
            const activeInCat = items.filter((i) => permissions[i.key]).length;

            return (
              <div
                key={category.id}
                className="rounded-xl border border-border-glass bg-surface-container/20 overflow-hidden"
              >
                {/* Category Header */}
                <div
                  onClick={() => toggleCategoryCollapse(category.id)}
                  className="px-3 py-2 bg-surface-container/40 flex items-center justify-between cursor-pointer hover:bg-surface-variant/40 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <CategoryIcon className="text-sm text-primary" />
                    <span className="font-bold text-xs text-on-surface">
                      {category.name}
                    </span>
                    <span className="text-[10px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded-full border border-border-glass">
                      {activeInCat} / {items.length}
                    </span>
                  </div>
                  <button type="button" className="text-on-surface-variant text-xs">
                    {isCollapsed ? <LuChevronDown /> : <LuChevronUp />}
                  </button>
                </div>

                {/* Category Items */}
                {!isCollapsed && (
                  <div className="p-2 space-y-1.5 divide-y divide-border-glass/40">
                    {items.map((perm) => {
                      const isChecked = !!permissions[perm.key];
                      const PermIcon = perm.icon;

                      return (
                        <div
                          key={perm.key}
                          onClick={() => onTogglePermission(perm.key)}
                          className={`p-2 rounded-lg flex items-center justify-between gap-3 transition-colors cursor-pointer pt-2 ${
                            isChecked
                              ? 'bg-primary/5 hover:bg-primary/10'
                              : 'hover:bg-surface-variant/30'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div
                              className={`p-1.5 rounded-md shrink-0 mt-0.5 ${
                                isChecked
                                  ? 'bg-primary/15 text-primary'
                                  : 'bg-surface-container text-on-surface-variant'
                              }`}
                            >
                              <PermIcon className="text-xs" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-on-surface leading-tight">
                                {perm.label}
                              </div>
                              <div className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                                {perm.desc}
                              </div>
                            </div>
                          </div>

                          {/* Toggle Switch */}
                          <div className="shrink-0 pl-2">
                            <div
                              className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                                isChecked ? 'bg-primary justify-end' : 'bg-neutral-300 dark:bg-neutral-700 justify-start'
                              }`}
                            >
                              <div className="bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
