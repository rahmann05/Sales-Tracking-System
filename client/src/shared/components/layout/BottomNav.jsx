import React, { useState, useEffect } from 'react';
import { LuX } from 'react-icons/lu';
import { FiMoreHorizontal } from 'react-icons/fi';
import { useApp } from '../../../context/AppContext';
import { getNavigationTabs } from '../../../constants/navigation';
import '../../../styles/layout/BottomNav.css';

/**
 * BottomNav Component (Mobile Bottom Navigation Bar)
 * Single Responsibility: Symmetric, Apple-Editorial mobile bottom navigation.
 * - Perfectly symmetrical 5-column grid layout across all screen sizes.
 * - Cohesive monochrome styling matching the system design.
 * - Accessible, thumb-friendly touch targets.
 */
export const BottomNav = ({ activeTab, setActiveTab }) => {
  const { user } = useApp();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const navItems = getNavigationTabs(user?.role);

  // If items are 5 or fewer, show directly without "Lainnya" drawer
  const hasMore = navItems.length > 5;
  const primaryItems = hasMore ? navItems.slice(0, 4) : navItems;
  const secondaryItems = hasMore ? navItems.slice(4) : [];

  // Check if current active tab is inside secondary drawer
  const activeSecondaryItem = secondaryItems.find((item) => item.id === activeTab);
  const isSecondaryActive = Boolean(activeSecondaryItem);

  // Close drawer if user presses Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsMoreOpen(false);
    };
    if (isMoreOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMoreOpen]);

  const totalCols = hasMore ? 5 : primaryItems.length;

  return (
    <>
      {/* 1. Backdrop for "Lainnya" drawer */}
      {isMoreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-200 md:hidden"
          onClick={() => setIsMoreOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 2. Secondary Navigation Bottom Sheet (Drawer) */}
      {isMoreOpen && (
        <div
          className="fixed bottom-[65px] left-3 right-3 z-50 bg-surface border border-border-glass rounded-3xl p-4 shadow-2xl transition-transform duration-200 md:hidden animate-in slide-in-from-bottom-5"
          role="dialog"
          aria-modal="true"
          aria-label="Menu Tambahan"
        >
          <div className="flex items-center justify-between pb-3 mb-2.5 border-b border-border-glass">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Menu & Fitur Lainnya
            </span>
            <button
              type="button"
              onClick={() => setIsMoreOpen(false)}
              className="p-1.5 rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors cursor-pointer"
              title="Tutup Menu"
            >
              <LuX className="text-base" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pr-0.5">
            {secondaryItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMoreOpen(false);
                  }}
                  className={`flex items-center gap-2.5 p-3 rounded-2xl text-left text-xs font-bold transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-primary text-on-primary border-primary shadow-xs'
                      : 'bg-surface-container-low text-on-surface border-border-glass hover:bg-surface-variant/40'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-surface text-on-surface shadow-2xs'
                    }`}
                  >
                    <Icon />
                  </div>
                  <span className="leading-tight line-clamp-2">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Main Bottom Navigation Bar (Symmetric Grid) */}
      <nav
        className="bottom-nav-container pointer-events-auto"
        style={{
          gridTemplateColumns: `repeat(${totalCols}, minmax(0, 1fr))`,
        }}
      >
        {primaryItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveTab(item.id);
                setIsMoreOpen(false);
              }}
              className={`bottom-nav-btn ${
                isActive ? 'bottom-nav-btn-active' : 'bottom-nav-btn-inactive'
              }`}
            >
              <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-primary/5' : ''}`}>
                <Icon className="bottom-nav-icon" />
              </div>
              <span className="bottom-nav-label">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* "Lainnya" Button when items > 5 */}
        {hasMore && (
          <button
            type="button"
            onClick={() => setIsMoreOpen((prev) => !prev)}
            className={`bottom-nav-btn ${
              isSecondaryActive || isMoreOpen
                ? 'bottom-nav-btn-active'
                : 'bottom-nav-btn-inactive'
            }`}
            aria-expanded={isMoreOpen}
          >
            <div className={`p-1 rounded-lg transition-colors ${isSecondaryActive || isMoreOpen ? 'bg-primary/5' : ''}`}>
              <FiMoreHorizontal className="bottom-nav-icon" />
            </div>
            <span className="bottom-nav-label">
              {activeSecondaryItem ? activeSecondaryItem.label : 'Lainnya'}
            </span>
          </button>
        )}
      </nav>
    </>
  );
};
