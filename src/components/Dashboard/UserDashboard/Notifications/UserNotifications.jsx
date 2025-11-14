// src/components/Dashboard/UserDashboard/Notifications/UserNotifications.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Notifications.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faThumbsUp,
  faCommentDots,
  faUserPlus,
  faUsers,
  faPlayCircle,
  faCircle,
  faInbox,
  faCheckDouble,
  faRotateRight,
  faFilter,
} from '@fortawesome/free-solid-svg-icons';
import { notificationsAPI } from '../../../../utils/api';
import { useSocket } from '../../../../contexts/SocketContext';

const UserNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all | unread | social | content | system
  const [refreshing, setRefreshing] = useState(false);

  const { socket } = useSocket();
  const navigate = useNavigate();

  const getNotificationIcon = (notification) => {
    switch (notification.type) {
      case 'friend_request':
        return faUserPlus;
      case 'friend_request_accepted':
        return faUsers;
      case 'like':
        return faThumbsUp;
      case 'comment':
        return faCommentDots;
      case 'message':
        return faCommentDots;
      case 'content':
        return faPlayCircle;
      case 'system':
        return faBell;
      default:
        return faCircle;
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const created = new Date(dateString);
    const diffMs = now - created;

    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return created.toLocaleDateString();
  };

  const loadNotifications = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      const response = await notificationsAPI.getUserNotifications();
      if (response?.success) {
        const data = response.data || response.data?.data || response.data || [];
        const list = Array.isArray(data) ? data : response.data.data || [];
        setNotifications(list);
        const unread =
          response.unreadCount ??
          list.filter((n) => !n.read).length;
        setUnreadCount(unread);
      } else {
        setError(response?.message || 'Failed to load notifications');
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('An error occurred while loading notifications.');
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || markingAll) return;

    try {
      setMarkingAll(true);
      const res = await notificationsAPI.markAllAsRead();
      if (res?.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.read && notification.id) {
        const res = await notificationsAPI.markAsRead(notification.id);
        if (res?.success) {
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === notification.id ? { ...n, read: true } : n
            )
          );
          setUnreadCount((prev) => Math.max(prev - 1, 0));
        }
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }

    if (notification.link) {
      navigate(notification.link);
    }
  };

  // Grouping by "Today / Yesterday / Earlier"
  const groupedNotifications = useMemo(() => {
    const groups = {
      today: [],
      yesterday: [],
      earlier: [],
    };

    const now = new Date();
    const todayStr = now.toDateString();
    const yesterdayStr = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString();

    const filterPredicate = (n) => {
      if (filter === 'unread') return !n.read;
      if (filter === 'social') {
        return [
          'friend_request',
          'friend_request_accepted',
          'like',
          'comment',
          'message',
        ].includes(n.type);
      }
      if (filter === 'content') {
        return n.type === 'content';
      }
      if (filter === 'system') {
        return n.type === 'system';
      }
      return true;
    };

    notifications
      .filter(filterPredicate)
      .forEach((n) => {
        const d = new Date(n.createdAt);
        const ds = d.toDateString();
        if (ds === todayStr) groups.today.push(n);
        else if (ds === yesterdayStr) groups.yesterday.push(n);
        else groups.earlier.push(n);
      });

    return groups;
  }, [notifications, filter]);

  // Initial load
  useEffect(() => {
    loadNotifications(false);
  }, []);

  // Live updates via socket
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      if (!notification.read) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket]);

  const hasNotifications =
    groupedNotifications.today.length ||
    groupedNotifications.yesterday.length ||
    groupedNotifications.earlier.length;

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>
            <FontAwesomeIcon icon={faBell} className={styles.titleIcon} />
            Notifications
          </h1>
          <p className={styles.subtitle}>
            Stay up to date with your friends, content and account activity.
          </p>
        </div>

        <div className={styles.actions}>
          <div className={styles.filterGroup}>
            <FontAwesomeIcon icon={faFilter} className={styles.filterIcon} />
            <select
              className={styles.filterSelect}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="social">Social</option>
              <option value="content">Content</option>
              <option value="system">System</option>
            </select>
          </div>

          <button
            className={styles.iconButton}
            onClick={() => loadNotifications(true)}
            disabled={refreshing || loading}
            title="Refresh"
          >
            <FontAwesomeIcon
              icon={faRotateRight}
              spin={refreshing}
            />
          </button>

          <button
            className={styles.markAllButton}
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0 || markingAll}
          >
            <FontAwesomeIcon icon={faCheckDouble} />
            <span>
              {markingAll
                ? 'Marking...'
                : unreadCount > 0
                ? `Mark all as read (${unreadCount})`
                : 'All read'}
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.errorBox}>
          {error}
        </div>
      )}

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <span>Loading notifications...</span>
        </div>
      ) : !hasNotifications ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIconCircle}>
            <FontAwesomeIcon icon={faInbox} className={styles.emptyIcon} />
          </div>
          <h2>No notifications yet</h2>
          <p>
            When something happens — a new friend, comment, like or content drop —
            you’ll see it here.
          </p>
        </div>
      ) : (
        <div className={styles.listContainer}>
          {groupedNotifications.today.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Today</h2>
              <div className={styles.sectionList}>
                {groupedNotifications.today.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    className={`${styles.item} ${!n.read ? styles.itemUnread : ''}`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div className={styles.itemIconWrapper}>
                      <FontAwesomeIcon
                        icon={getNotificationIcon(n)}
                        className={styles.itemIcon}
                      />
                      {!n.read && <span className={styles.itemDot} />}
                    </div>
                    <div className={styles.itemContent}>
                      <div className={styles.itemHeader}>
                        <span className={styles.itemTitle}>{n.title}</span>
                        <span className={styles.itemTime}>
                          {formatTimeAgo(n.createdAt)}
                        </span>
                      </div>
                      <p className={styles.itemMessage}>{n.message}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {groupedNotifications.yesterday.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Yesterday</h2>
              <div className={styles.sectionList}>
                {groupedNotifications.yesterday.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    className={`${styles.item} ${!n.read ? styles.itemUnread : ''}`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div className={styles.itemIconWrapper}>
                      <FontAwesomeIcon
                        icon={getNotificationIcon(n)}
                        className={styles.itemIcon}
                      />
                      {!n.read && <span className={styles.itemDot} />}
                    </div>
                    <div className={styles.itemContent}>
                      <div className={styles.itemHeader}>
                        <span className={styles.itemTitle}>{n.title}</span>
                        <span className={styles.itemTime}>
                          {formatTimeAgo(n.createdAt)}
                        </span>
                      </div>
                      <p className={styles.itemMessage}>{n.message}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {groupedNotifications.earlier.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Earlier</h2>
              <div className={styles.sectionList}>
                {groupedNotifications.earlier.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    className={`${styles.item} ${!n.read ? styles.itemUnread : ''}`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div className={styles.itemIconWrapper}>
                      <FontAwesomeIcon
                        icon={getNotificationIcon(n)}
                        className={styles.itemIcon}
                      />
                      {!n.read && <span className={styles.itemDot} />}
                    </div>
                    <div className={styles.itemContent}>
                      <div className={styles.itemHeader}>
                        <span className={styles.itemTitle}>{n.title}</span>
                        <span className={styles.itemTime}>
                          {formatTimeAgo(n.createdAt)}
                        </span>
                      </div>
                      <p className={styles.itemMessage}>{n.message}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default UserNotifications;
