// src/components/Common/NotificationsPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, UserPlus, Heart, MessageCircle, Music } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import { useNavigate } from 'react-router-dom';
import './NotificationsPanel.css';

const NotificationsPanel = () => {
  const navigate = useNavigate();
  const { 
    notifications, 
    markNotificationAsRead, 
    removeNotification, 
    clearNotifications,
    socket 
  } = useSocket();
  
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Calculer le nombre de notifications non lues
  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
    
    // Animation de notification
    if (count > unreadCount) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 500);
    }
  }, [notifications]);

  // Fermer le panel en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'friend-request':
        return <UserPlus size={20} className="notif-icon friend-request" />;
      case 'friend-accepted':
        return <UserPlus size={20} className="notif-icon friend-accepted" />;
      case 'message':
        return <MessageCircle size={20} className="notif-icon message" />;
      case 'like':
        return <Heart size={20} className="notif-icon like" />;
      case 'comment':
        return <MessageCircle size={20} className="notif-icon comment" />;
      case 'music':
        return <Music size={20} className="notif-icon music" />;
      default:
        return <Bell size={20} className="notif-icon default" />;
    }
  };

  const handleNotificationClick = (notification) => {
    markNotificationAsRead(notification.id);
    
    // Navigation selon le type de notification
    switch (notification.type) {
      case 'friend-request':
        navigate('/dashboard/friends?tab=requests');
        break;
      case 'friend-accepted':
        navigate('/dashboard/friends');
        break;
      case 'message':
        navigate('/dashboard/chat');
        break;
      case 'like':
      case 'comment':
        // Naviguer vers le contenu concerné
        break;
      default:
        break;
    }
    
    setIsOpen(false);
  };

  const formatTime = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleMarkAllAsRead = () => {
    notifications.forEach(n => {
      if (!n.read) {
        markNotificationAsRead(n.id);
      }
    });
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all notifications?')) {
      clearNotifications();
    }
  };

  return (
    <div className="notifications-container" ref={panelRef}>
      {/* Bell Icon Button */}
      <button 
        className={`notifications-button ${isAnimating ? 'animate-bell' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="notifications-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Panel */}
      {isOpen && (
        <div className="notifications-panel">
          {/* Header */}
          <div className="notifications-header">
            <h3>
              <Bell size={20} />
              Notifications
            </h3>
            <div className="notifications-header-actions">
              {notifications.length > 0 && (
                <>
                  <button 
                    className="notif-action-btn"
                    onClick={handleMarkAllAsRead}
                    title="Mark all as read"
                  >
                    <Check size={18} />
                  </button>
                  <button 
                    className="notif-action-btn"
                    onClick={handleClearAll}
                    title="Clear all"
                  >
                    <X size={18} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="notifications-empty">
                <Bell size={48} />
                <p>No notifications yet</p>
                <span>You're all caught up!</span>
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon-wrapper">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.title}
                    </div>
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-time">
                      {formatTime(notification.timestamp)}
                    </div>
                  </div>

                  <button 
                    className="notification-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(notification.id);
                    }}
                  >
                    <X size={16} />
                  </button>

                  {!notification.read && (
                    <div className="notification-unread-dot" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="notifications-footer">
              <button 
                className="notifications-view-all"
                onClick={() => {
                  navigate('/dashboard/notifications');
                  setIsOpen(false);
                }}
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsPanel;