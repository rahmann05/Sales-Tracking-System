import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LuBell, 
  LuCheck, 
  LuCheckCheck, 
  LuTrash2, 
  LuX, 
  LuStore, 
  LuKey, 
  LuShoppingBag, 
  LuShuffle, 
  LuClock 
} from 'react-icons/lu';

/**
 * NotificationCenterDropdown Component
 * Single Responsibility: Interactive notification inbox with category filters,
 * unread badges, mark all as read, and clear actions.
 */
export const NotificationCenterDropdown = () => {
  const { 
    user, 
    notifications = [], 
    markNotificationAsRead, 
    clearNotifications 
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'UNREAD' | 'CLOSED' | 'UNLOCK'

  // Filter notifications relevant to current user role
  const userNotifications = notifications.filter(
    (n) => !n.roleTarget || n.roleTarget.includes(user.role)
  );

  const unreadCount = userNotifications.filter((n) => !n.read).length;

  const filteredList = userNotifications.filter((n) => {
    if (activeFilter === 'UNREAD') return !n.read;
    if (activeFilter === 'CLOSED') return n.title?.toLowerCase().includes('tutup') || n.title?.toLowerCase().includes('skip');
    if (activeFilter === 'UNLOCK') return n.title?.toLowerCase().includes('kunci') || n.title?.toLowerCase().includes('unlock');
    return true;
  });

  const getNotifIcon = (title = '') => {
    const t = title.toLowerCase();
    if (t.includes('tutup') || t.includes('skip')) return <LuStore className="text-rose-500 text-sm flex-shrink-0" />;
    if (t.includes('kunci') || t.includes('unlock')) return <LuKey className="text-amber-500 text-sm flex-shrink-0" />;
    if (t.includes('order')) return <LuShoppingBag className="text-purple-500 text-sm flex-shrink-0" />;
    if (t.includes('reroute') || t.includes('rute')) return <LuShuffle className="text-blue-500 text-sm flex-shrink-0" />;
    return <LuClock className="text-primary text-sm flex-shrink-0" />;
  };

  const handleMarkAllRead = () => {
    userNotifications.forEach((n) => {
      if (!n.read && markNotificationAsRead) {
        markNotificationAsRead(n.id);
      }
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl border border-border-glass bg-surface text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-all cursor-pointer"
        aria-label="Buka Notifikasi"
      >
        <LuBell className="text-xl" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center border-2 border-surface animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-surface border border-border-glass rounded-3xl shadow-2xl p-4 z-50 space-y-3 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-glass pb-3">
            <div>
              <h4 className="font-bold text-sm text-on-surface flex items-center gap-2">
                <LuBell className="text-primary text-base" />
                <span>Inbox Notifikasi</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-600">
                    {unreadCount} Baru
                  </span>
                )}
              </h4>
              <p className="text-[10px] text-on-surface-variant">Aktivitas real-time lapangan untuk {user?.roleLabel || user?.name}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              <LuX className="text-base" />
            </button>
          </div>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-[11px]">
            <button
              type="button"
              onClick={() => setActiveFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === 'ALL'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-variant/30 text-on-surface-variant hover:bg-surface-variant/60'
              }`}
            >
              Semua ({userNotifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('UNREAD')}
              className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === 'UNREAD'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-variant/30 text-on-surface-variant hover:bg-surface-variant/60'
              }`}
            >
              Belum Dibaca ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('CLOSED')}
              className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === 'CLOSED'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-variant/30 text-on-surface-variant hover:bg-surface-variant/60'
              }`}
            >
              Toko Tutup
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('UNLOCK')}
              className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === 'UNLOCK'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-variant/30 text-on-surface-variant hover:bg-surface-variant/60'
              }`}
            >
              Unlock Presensi
            </button>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between text-[11px] font-bold px-1 text-on-surface-variant">
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
            >
              <LuCheckCheck className="text-sm" /> Tandai Semua Dibaca
            </button>
            {userNotifications.length > 0 && (
              <button
                type="button"
                onClick={() => clearNotifications && clearNotifications()}
                className="hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <LuTrash2 className="text-sm" /> Bersihkan
              </button>
            )}
          </div>

          {/* List Feed */}
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {filteredList.length === 0 ? (
              <div className="text-center py-6 space-y-1">
                <LuBell className="text-2xl text-on-surface-variant/40 mx-auto" />
                <p className="text-xs text-on-surface-variant font-medium">Tidak ada notifikasi dalam filter ini.</p>
              </div>
            ) : (
              filteredList.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markNotificationAsRead && markNotificationAsRead(notif.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1 text-xs ${
                    notif.read
                      ? 'bg-surface-variant/15 border-border-glass opacity-75'
                      : 'bg-surface border-primary/30 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {getNotifIcon(notif.title)}
                      <p className="font-bold text-on-surface truncate">{notif.title}</p>
                    </div>
                    <span className="text-[10px] text-on-surface-variant font-mono whitespace-nowrap">
                      {notif.timestamp}
                    </span>
                  </div>
                  <p className="text-on-surface-variant leading-relaxed text-[11px] pl-6">
                    {notif.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
