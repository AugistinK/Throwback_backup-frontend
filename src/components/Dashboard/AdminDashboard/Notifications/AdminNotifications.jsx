// src/components/Dashboard/AdminDashboard/Notifications/AdminNotifications.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsAPI } from '../../../../utils/api';
import styles from './AdminNotifications.module.css';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await notificationsAPI.getUserNotifications();

      if (res && res.success) {
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
        setNotifications(list);
        const unread =
          typeof res.unreadCount === 'number'
            ? res.unreadCount
            : list.filter((n) => !n.read).length;
        setUnreadCount(unread);
      } else {
        setNotifications([]);
        setUnreadCount(0);
        setError(res?.message || 'Failed to load notifications');
      }
    } catch (err) {
      console.error('Error loading admin notifications:', err);
      setError('Erreur lors du chargement des notifications');
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.read) {
        await notificationsAPI.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, read: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      }
    } catch (err) {
      console.error('Error marking admin notification as read:', err);
    }

    if (notification.link) {
      navigate(notification.link);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleString();
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <div>
          <h2>Notifications</h2>
          <p className={styles.subtitle}>
            Centre de notifications pour les actions système, la modération et les logs.
          </p>
        </div>
        <div className={styles.headerActions}>
          {unreadCount > 0 && (
            <button
              className={styles.markAllButton}
              onClick={handleMarkAllAsRead}
            >
              Marquer tout comme lu ({unreadCount})
            </button>
          )}
          <button
            className={styles.refreshButton}
            onClick={loadNotifications}
            disabled={loading}
          >
            {loading ? 'Actualisation…' : 'Actualiser'}
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.list}>
        {loading && notifications.length === 0 && (
          <div className={styles.empty}>Chargement des notifications…</div>
        )}

        {!loading && notifications.length === 0 && (
          <div className={styles.empty}>
            Aucune notification pour le moment.
          </div>
        )}

        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`${styles.item} ${notif.read ? '' : styles.itemUnread}`}
            onClick={() => handleNotificationClick(notif)}
          >
            <div className={styles.itemMain}>
              <div className={styles.itemTitleRow}>
                <span className={styles.itemType}>{notif.type}</span>
                <span className={styles.itemDate}>
                  {formatTime(notif.createdAt)}
                </span>
              </div>
              <div className={styles.itemTitle}>{notif.title}</div>
              <div className={styles.itemMessage}>{notif.message}</div>
            </div>
            {notif.link && (
              <div className={styles.itemLinkHint}>
                Voir plus &rarr;
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminNotifications;
