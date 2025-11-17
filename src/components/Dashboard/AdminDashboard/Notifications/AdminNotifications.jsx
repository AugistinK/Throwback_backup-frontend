// components/Dashboard/AdminDashboard/Notifications/AdminNotifications.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../../../contexts/SocketContext';
import { notificationsAPI } from '../../../../utils/api';
import styles from './AdminNotifications.module.css';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [sortOrder, setSortOrder] = useState('desc'); // desc, asc
  const { socket } = useSocket();

  // Charger les notifications depuis le backend
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await notificationsAPI.getUserNotifications();
      
      if (response && response.success) {
        const notifList = Array.isArray(response.data) 
          ? response.data 
          : Array.isArray(response.data?.data) 
          ? response.data.data 
          : [];
        
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

  // Charger au montage
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Écouter les nouvelles notifications via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notif) => {
      console.log('🔔 Nouvelle notification reçue:', notif);
      
      // Ajouter la notification en haut de la liste
      setNotifications(prev => [
        {
          id: notif.id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          link: notif.link,
          read: false,
          createdAt: notif.createdAt,
          actor: notif.actor,
          metadata: notif.metadata || {}
        },
        ...prev
      ]);

      // Jouer un son de notification (optionnel)
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.3;
        audio.play().catch(e => console.log('Cannot play sound:', e));
      } catch (e) {
        // Ignorer les erreurs de lecture audio
      }
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket]);

  // Marquer une notification comme lue
  const markAsRead = async (notifId) => {
    try {
      const response = await notificationsAPI.markAsRead(notifId);
      
      if (response && response.success) {
        setNotifications(prev =>
          prev.map(n => n.id === notifId ? { ...n, read: true } : n)
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Marquer toutes comme lues
  const markAllAsRead = async () => {
    try {
      const response = await notificationsAPI.markAllAsRead();
      
      if (response && response.success) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true }))
        );
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Filtrer les notifications
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  // Trier les notifications
  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  // Compter les non lues
  const unreadCount = notifications.filter(n => !n.read).length;

  // Formater la date
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  // Obtenir l'icône selon le type
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

  // Obtenir la couleur selon le type
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
            Notifications Admin
          </h1>
        </div>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Chargement des notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* En-tête */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>
            <i className="fas fa-bell"></i>
            Notifications Admin
          </h1>
          {unreadCount > 0 && (
            <span className={styles.unreadBadge}>{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</span>
          )}
        </div>
        
        <div className={styles.headerActions}>
          {unreadCount > 0 && (
            <button
              className={styles.markAllReadBtn}
              onClick={markAllAsRead}
            >
              <i className="fas fa-check-double"></i>
              Tout marquer comme lu
            </button>
          )}
          
          <button
            className={styles.refreshBtn}
            onClick={loadNotifications}
          >
            <i className="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <button
            className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            Toutes ({notifications.length})
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'unread' ? styles.active : ''}`}
            onClick={() => setFilter('unread')}
          >
            Non lues ({unreadCount})
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'read' ? styles.active : ''}`}
            onClick={() => setFilter('read')}
          >
            Lues ({notifications.length - unreadCount})
          </button>
        </div>

        <div className={styles.sortGroup}>
          <label>Trier par:</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className={styles.sortSelect}
          >
            <option value="desc">Plus récentes d'abord</option>
            <option value="asc">Plus anciennes d'abord</option>
          </select>
        </div>
      </div>

      {/* Liste des notifications */}
      <div className={styles.notificationsList}>
        {sortedNotifications.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="fas fa-bell-slash"></i>
            <h3>Aucune notification</h3>
            <p>
              {filter === 'unread' 
                ? 'Vous n\'avez aucune notification non lue'
                : filter === 'read'
                ? 'Vous n\'avez aucune notification lue'
                : 'Vous n\'avez reçu aucune notification pour le moment'}
            </p>
          </div>
        ) : (
          sortedNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`${styles.notificationCard} ${!notif.read ? styles.unread : ''}`}
              onClick={() => {
                if (!notif.read) {
                  markAsRead(notif.id);
                }
                if (notif.link) {
                  window.location.href = notif.link;
                }
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
                
                <p className={styles.notificationMessage}>{notif.message}</p>

                {notif.metadata && Object.keys(notif.metadata).length > 0 && (
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
  );
};

export default AdminNotifications;