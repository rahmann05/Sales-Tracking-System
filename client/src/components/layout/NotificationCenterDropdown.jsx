import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LuBell, LuCheck, LuX } from 'react-icons/lu';

/**
 * NotificationCenterDropdown Component (Single Responsibility: Header Bell Icon & Notification Feed)
 * 1 File per Component
 */
export const NotificationCenterDropdown = () => {
  const { user, notifications } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  // Filter notifications relevant to current user role
  const userNotifications = notifications.filter(
    (n) => !n.roleTarget || n.roleTarget.includes(user.role)
  );

  const unreadCount = userNotifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl border border-border-glass bg-surface text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-all"
      >
        <LuBell className="text-xl" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center border-2 border-surface animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-surface border border-border-glass rounded-2xl shadow-2xl p-4 z-50 space-y-3">
          <div className="flex items-center justify-between border-b border-border-glass pb-2">
            <h4 className="font-bold text-sm text-on-surface flex items-center gap-2">
              <LuBell className="text-primary text-base" />
              <span>Notifikasi Sistem ({user.roleLabel})</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-on-surface-variant hover:text-on-surface"
            >
              <LuX className="text-base" />
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2">
            {userNotifications.length === 0 ? (
              <p className="text-xs text-on-surface-variant text-center py-4">Belum ada notifikasi.</p>
            ) : (
              userNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className="p-2.5 rounded-xl border border-border-glass bg-surface-variant/30 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-on-surface">{notif.title}</p>
                    <span className="text-[10px] text-on-surface-variant">{notif.timestamp}</span>
                  </div>
                  <p className="text-on-surface-variant leading-relaxed">{notif.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
