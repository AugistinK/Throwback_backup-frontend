// components/Dashboard/AdminDashboard/Notifications/AdminNotifications.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../../../contexts/SocketContext';
import { notificationsAPI } from '../../../../utils/api';
import styles from './AdminNotifications.module.css';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | unread | read
  const [sortOrder, setSortOrder] = useState('desc'); // desc | asc
  const { socket } = useSocket();

  // Load notifications from backend
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await notificationsAPI.getUserNotifications();

      if (response && response.success) {
        const raw =
          Array.isArray(response.data)
            ? response.data
            : Array.isArray(response.data?.data)
            ? response.data.data
            : [];

        // Normaliser l'id pour être sûr d'avoir notif.id
        const notifList = raw.map((n) => ({
          ...n,
          id: n.id || n._id, // compatibilité MongoDB
        }));

        setNotifications(notifList);
      } else {
        console.error('Failed to load notifications:', response?.message);
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Listen to new notifications via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notif) => {
      console.log('🔔 New notification received:', notif);

      setNotifications((prev) => [
        {
          id: notif.id || notif._id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          link: notif.link,
          read: false,
          createdAt: notif.createdAt,
          actor: notif.actor,
          metadata: notif.metadata || {},
        },
        ...prev,
      ]);

      // Play notification sound (optional)
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.3;
        audio.play().catch((e) => console.log('Cannot play sound:', e));
      } catch (e) {
        // ignore audio errors
      }
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket]);

  // Mark notification as read
  const markAsRead = async (notifId) => {
    if (!notifId) return;

    try {
      const response = await notificationsAPI.markAsRead(notifId);

      if (response && response.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await notificationsAPI.markAllAsRead();

      if (response && response.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  // Sort notifications
  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  // Count unread
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Human readable date
  const formatDate = (dateStr) => {
    if (!dateStr) return '';

    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  // Icon by type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'friend_request':
        return 'fa-user-plus';
      case 'friend_request_accepted':
        return 'fa-user-check';
      case 'message':
        return 'fa-envelope';
      case 'like':
        return 'fa-heart';
      case 'comment':
        return 'fa-comment';
      case 'system':
        return 'fa-info-circle';
      case 'content':
        return 'fa-file-alt';
      case 'chat_group_created':
        return 'fa-users';
      default:
        return 'fa-bell';
    }
  };

  // Color by type
  const getNotificationColor = (type) => {
    switch (type) {
      case 'friend_request':
      case 'friend_request_accepted':
        return '#4CAF50';
      case 'message':
        return '#2196F3';
      case 'like':
        return '#E91E63';
      case 'comment':
        return '#FF9800';
      case 'system':
        return '#9C27B0';
      default:
        return '#757575';
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>
            <i className="fas fa-bell"></i>
            Admin Notifications
          </h1>
        </div>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <i className="fas fa-bell"></i>
          Notifications
        </h1>
        <div className={styles.headerActions}>
          {unreadCount > 0 && (
            <button className={styles.markAllReadBtn} onClick={markAllAsRead}>
              <i className="fas fa-check-double"></i>
              Mark All as Read
            </button>
          )}
          <button className={styles.refreshBtn} onClick={loadNotifications}>
            <i className="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#b31217' }}>
            <i className="fas fa-bell"></i>
          </div>
          <div className={styles.statContent}>
            <h3>{notifications.length}</h3>
            <p>Total</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#FF9800' }}>
            <i className="fas fa-bell-slash"></i>
          </div>
          <div className={styles.statContent}>
            <h3>{unreadCount}</h3>
            <p>Unread</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#4CAF50' }}>
            <i className="fas fa-check-circle"></i>
          </div>
          <div className={styles.statContent}>
            <h3>{notifications.length - unreadCount}</h3>
            <p>Read</p>
          </div>
        </div>
      </div>

      {/* Filters + List */}
      <div className={styles.contentCard}>
        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <button
              className={`${styles.filterBtn} ${
                filter === 'all' ? styles.active : ''
              }`}
              onClick={() => setFilter('all')}
            >
              All ({notifications.length})
            </button>
            <button
              className={`${styles.filterBtn} ${
                filter === 'unread' ? styles.active : ''
              }`}
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </button>
            <button
              className={`${styles.filterBtn} ${
                filter === 'read' ? styles.active : ''
              }`}
              onClick={() => setFilter('read')}
            >
              Read ({notifications.length - unreadCount})
            </button>
          </div>

          <div className={styles.sortGroup}>
            <label>Sort by:</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className={styles.sortSelect}
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </div>
        </div>

        {/* Notifications List */}
        <div className={styles.notificationsList}>
          {sortedNotifications.length === 0 ? (
            <div className={styles.emptyState}>
              <i className="fas fa-bell-slash"></i>
              <h3>No Notifications</h3>
              <p>
                {filter === 'unread'
                  ? 'You have no unread notifications'
                  : filter === 'read'
                  ? 'You have no read notifications'
                  : 'You have not received any notifications yet'}
              </p>
            </div>
          ) : (
            sortedNotifications.map((notif) => (
              <div
                key={notif.id || notif._id}
                className={`${styles.notificationCard} ${
                  !notif.read ? styles.unread : ''
                }`}
                onClick={() => {
                  if (!notif.read && notif.id) {
                    markAsRead(notif.id);
                  }
                  // ⚠️ Plus de redirection ici, on ne fait QUE marquer comme lu
                }}
              >
                <div
                  className={styles.notificationIcon}
                  style={{ backgroundColor: getNotificationColor(notif.type) }}
                >
                  <i className={`fas ${getNotificationIcon(notif.type)}`}></i>
                </div>

                <div className={styles.notificationContent}>
                  <div className={styles.notificationHeader}>
                    <h3>{notif.title}</h3>
                    <span className={styles.notificationTime}>
                      {formatDate(notif.createdAt)}
                    </span>
                  </div>

                  <p className={styles.notificationMessage}>
                    {notif.message}
                  </p>

                  {notif.metadata &&
                    Object.keys(notif.metadata).length > 0 && (
                      <div className={styles.notificationMeta}>
                        {notif.metadata.type_action && (
                          <span className={styles.metaTag}>
                            <i className="fas fa-tag"></i>
                            {notif.metadata.type_action}
                          </span>
                        )}
                      </div>
                    )}
                </div>

                {!notif.read && (
                  <div className={styles.unreadIndicator}>
                    <span className={styles.unreadDot}></span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;
