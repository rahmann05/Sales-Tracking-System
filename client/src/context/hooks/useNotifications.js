import { useState } from 'react';

/**
 * useNotifications - In-app notification center state.
 * Single Responsibility: owns the notifications list and its
 * add / mark-as-read / clear operations.
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = ({ title, message, roleTarget }) => {
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
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
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return { notifications, addNotification, markNotificationAsRead, clearNotifications };
};
