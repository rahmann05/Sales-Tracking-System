import { useEffect, useRef, useState } from 'react';
import { notificationsApi } from '../../services/api/notificationsApi';
import { mapNotification } from '../../../../shared/monitoring.mjs';

/**
 * useNotifications - In-app notification center state.
 * Single Responsibility: owns the notifications list and its
 * add / mark-as-read / clear operations.
 */
export const useNotifications = (user) => {
  const [notifications, setNotifications] = useState([]);
  const [server, setServer] = useState([]), [notificationStatus, setStatus] = useState({}), [unread, setUnread] = useState(0);
  const session = useRef(0), refresh = useRef(async () => {});
  const account = useRef(null);
  const visiblePages = useRef(1), responseRevision = useRef(0);
  const [hasMore, setHasMore] = useState(false);
  useEffect(() => {
    const version = ++session.current;
    account.current = user?.id;
    let busy = false, queued = false;
    visiblePages.current = 1; setHasMore(false);
    setNotifications([]); setServer([]); setUnread(0); setStatus({});
    const load = async () => {
      if (!user?.id) return;
      if (busy) { queued = true; return; }
      busy = true;
      const requestVersion = ++responseRevision.current;
      try {
        const pages = [];
        for (let page = 1; page <= visiblePages.current; page++) {
          const res = await notificationsApi.getAll(page); pages.push(res.data);
          if (!res.data.hasMore) break;
        }
        if (session.current !== version || requestVersion !== responseRevision.current) return;
        setServer([...new Map(pages.flatMap(page => page.notifications).map(item => [item.id, mapNotification(item)])).values()]); setUnread(pages[0].unreadCount);
        setHasMore(pages.at(-1).hasMore);
        setStatus({ lastSuccessAt: new Date().toISOString(), error: '' });
      } catch (error) { if (session.current === version && requestVersion === responseRevision.current) setStatus(s => ({ ...s, error: error.message })); }
      finally { busy = false; if (queued && session.current === version) { queued = false; load(); } }
    };
    refresh.current = load;
    if (!user?.id) return;
    load(); const timer = setInterval(load, 60000);
    for (const event of ['focus', 'online', 'operational-data-changed', 'notifications:changed']) window.addEventListener(event, load);
    return () => { session.current++; clearInterval(timer); for (const event of ['focus', 'online', 'operational-data-changed', 'notifications:changed']) window.removeEventListener(event, load); };
  }, [user?.id]);
  const mutate = async (operation, apply) => {
    const version = session.current;
    responseRevision.current++;
    try { await operation(); if (version !== session.current) return; responseRevision.current++; apply(); window.dispatchEvent(new Event('notifications:changed')); }
    catch (error) { if (version === session.current) setStatus(s => ({ ...s, error: error.message })); }
  };

  const addNotification = ({ title, message, roleTarget }) => {
    if (account.current !== user?.id) return;
    setNotifications((prev) => [
      {
        id: `local-${crypto.randomUUID()}`,
        title,
        message,
        timestamp: 'Baru saja',
        read: false,
        roleTarget,
      },
      ...prev,
    ]);
  };

  const markNotificationAsRead = (id) => {
    if (!id.startsWith('local-')) return mutate(() => notificationsApi.read(id), () => setServer(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)));
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const markAllNotificationsAsRead = () => mutate(() => notificationsApi.readAll(), () => { setUnread(0); setServer(prev => prev.map(n => ({ ...n, read: true }))); setNotifications(prev => prev.map(n => ({ ...n, read: true }))); });
  const current = account.current === user?.id;
  return { notifications: current ? [...notifications, ...server] : [], notificationStatus: current ? notificationStatus : {},
    notificationUnreadCount: current ? unread + notifications.filter(n => !n.read && (!n.roleTarget || n.roleTarget.includes(user?.role))).length : 0,
    addNotification, markNotificationAsRead, markAllNotificationsAsRead, notificationHasMore: hasMore,
    loadMoreNotifications: () => { visiblePages.current++; return refresh.current(); }, refreshNotifications: () => refresh.current(), clearNotifications };
};
