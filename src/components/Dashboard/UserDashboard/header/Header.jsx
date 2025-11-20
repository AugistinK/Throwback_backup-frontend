// src/components/Dashboard/UserDashboard/Header.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './header.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faSignOutAlt,
  faSearch,
  faTimes,
  faCog,
  faUser,
  faMicrophone,
  faPlus,
  faMusic,
  faHistory,
  faPlayCircle,
  faThumbsUp,
  faBars,
  faVideo,
  faList,
  faEdit,
  faUsers,
  faFilm,
  faUserPlus,
  faCommentDots,
  faCircle,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../../contexts/AuthContext';
import { searchAPI, notificationsAPI } from '../../../../utils/api';
import { useSocket } from '../../../../contexts/SocketContext';

const comingSoonStyle = {
  fontSize: '0.6rem',
  padding: '2px 4px',
  backgroundColor: '#8b0000',
  color: 'white',
  borderRadius: '4px',
  marginLeft: '8px',
  fontWeight: 'bold',
  display: 'inline-block',
  verticalAlign: 'middle',
  lineHeight: 1,
};

const Header = ({ toggleSidebar, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();

  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false);
  const [showClearButton, setShowClearButton] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  // Autocomplete recherche
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const searchInputRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const createDropdownRef = useRef(null);
  const suggestionsRef = useRef(null);
  const notificationsRef = useRef(null);

  const navigate = useNavigate();

  const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/32';
    if (path.startsWith('http')) return path;

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const backendUrl =
      process.env.REACT_APP_API_URL || 'https://api.throwback-connect.com';
    return `${backendUrl}${normalizedPath}`;
  };

  // Détecter la taille de l'écran
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 480);
      if (window.innerWidth > 480) {
        setShowMobileSearch(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Fermer dropdowns quand on clique à l’extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        createDropdownRef.current &&
        !createDropdownRef.current.contains(event.target)
      ) {
        setIsCreateDropdownOpen(false);
      }
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus sur l'input quand la recherche mobile est activée
  useEffect(() => {
    if (showMobileSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showMobileSearch]);

  // ===========================
  //         NOTIFICATIONS
  // ===========================

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
    return `${days} d ago`;
  };

  const loadNotifications = async () => {
    try {
      setIsLoadingNotifications(true);
      const response = await notificationsAPI.getUserNotifications();
      if (response?.success) {
        const data = response.data || response.data?.data || response.data || [];
        const list = Array.isArray(data) ? data : response.data.data || [];
        setNotifications(list);
        const unreadCount =
          response.unreadCount ??
          list.filter((n) => !n.read).length;
        setUnreadNotifications(unreadCount);
      } else {
        setNotifications([]);
        setUnreadNotifications(0);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications :', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (unreadNotifications === 0) return;
      await notificationsAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadNotifications(0);
    } catch (error) {
      console.error(
        'Erreur lors du marquage des notifications comme lues :',
        error
      );
    }
  };

  // 💡 Même logique que dans UserNotifications
  const resolveNotificationLink = (notification) => {
    if (!notification) return null;
    const { type, link } = notification;

    if (link && link.startsWith('http')) {
      return link;
    }

    if (link && (link.startsWith('/dashboard') || link.startsWith('/admin'))) {
      return link;
    }

    if (!link || link.trim() === '') {
      switch (type) {
        case 'friend_request':
        case 'friend_request_accepted':
          return '/dashboard/friends';
        case 'message':
        case 'chat-group':
        case 'chat_group_created':
          return '/dashboard/messages';
        case 'like':
        case 'comment':
          return '/dashboard/wall';
        case 'content':
          return '/dashboard/videos';
        case 'system':
        default:
          return '/dashboard/notifications';
      }
    }

    if (link.startsWith('/')) {
      return `/dashboard${link}`;
    }

    return `/dashboard/${link}`;
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
        setUnreadNotifications((prev) => Math.max(prev - 1, 0));
      }
    } catch (error) {
      console.error(
        'Erreur lors du marquage de la notification comme lue :',
        error
      );
    }

    const target = resolveNotificationLink(notification);
    if (target) {
      navigate(target);
      setIsNotificationsOpen(false);
    }
  };

  // Charger les notifications au montage
  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      case 'system':
        return faBell;
      case 'content':
        return faPlayCircle;
      case 'chat_group_created':
      case 'chat-group':
        return faUsers;
      default:
        return faCircle;
    }
  };

  // ===========================
  //   SOCKET.IO (NOTIFS TEMPS RÉEL)
  // ===========================

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      if (!notification.read) {
        setUnreadNotifications((prev) => prev + 1);
      }
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket]);


  // ===========================
  //         RECHERCHE
  // ===========================

  const fetchSuggestions = async (value) => {
    if (!value || value.length < 2) {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      return;
    }

    try {
      setIsLoadingSuggestions(true);
      const response = await searchAPI.getSearchSuggestions(value);

      if (response.success) {
        setSuggestions(response.data || []);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        fetchSuggestions(searchTerm);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowClearButton(e.target.value.length > 0);
    setShowSuggestions(e.target.value.length > 0);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setShowClearButton(false);
    setSuggestions([]);
    setShowSuggestions(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setSearchTerm(suggestion.query || suggestion.text);
    setShowSuggestions(false);
    navigate(
      `/dashboard/search?q=${encodeURIComponent(
        suggestion.query || suggestion.text
      )}&type=${suggestion.type !== 'artist' ? suggestion.type : 'videos'}`
    );
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(
        `/dashboard/search?q=${encodeURIComponent(searchTerm.trim())}`
      );
      setShowSuggestions(false);
      if (isMobile) {
        setShowMobileSearch(false);
      }
    }
  };

  // ===========================
  //   NAVIGATION / PROFIL
  // ===========================

  const handleProfileClick = () => {
    navigate('/dashboard/profile');
    setIsDropdownOpen(false);
  };

  const handleSettingsClick = () => {
    navigate('/dashboard/settings');
    setIsDropdownOpen(false);
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
  };

  const handleNotificationsButtonClick = () => {
    const nextOpen = !isNotificationsOpen;
    setIsNotificationsOpen(nextOpen);

    if (nextOpen && unreadNotifications > 0) {
      markAllAsRead();
    }
  };

  const handleMenuButtonClick = () => {
    toggleSidebar();
  };

  const handleCloseMobileSearch = () => {
    setShowMobileSearch(false);
    setShowSuggestions(false);
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        {/* <button
          className={styles.menuButton}
          onClick={handleMenuButtonClick}
          aria-label="Open sidebar"
        >
          <FontAwesomeIcon icon={faBars} />
        </button> */}
        <Link to="/dashboard" className={styles.logoLink}>
          <span className={styles.logoText}>ThrowBack Connect</span>
        </Link>
      </div>

      <div
        className={`${styles.searchContainer} ${
          showMobileSearch ? styles.showMobileSearch : ''
        }`}
      >
        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <div className={styles.searchInputWrapper}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search for music, artists, playlists..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => setShowSuggestions(searchTerm.length > 0)}
            />

            {showClearButton && (
              <button
                type="button"
                className={styles.clearButton}
                onClick={clearSearch}
                aria-label="Clear search"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            )}

            {showSuggestions && (
              <div className={styles.suggestionsList} ref={suggestionsRef}>
                {isLoadingSuggestions ? (
                  <div className={styles.suggestionLoading}>
                    <FontAwesomeIcon icon={faSearch} spin />
                    <span>Searching...</span>
                  </div>
                ) : suggestions.length > 0 ? (
                  suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className={styles.suggestionItem}
                      onClick={() => handleSelectSuggestion(suggestion)}
                    >
                      <FontAwesomeIcon
                        icon={
                          suggestion.type === 'video'
                            ? faVideo
                            : suggestion.type === 'playlist'
                            ? faList
                            : suggestion.type === 'podcast'
                            ? faMicrophone
                            : suggestion.type === 'artist'
                            ? faMusic
                            : faSearch
                        }
                        className={styles.suggestionIcon}
                      />
                      <span className={styles.suggestionText}>
                        {suggestion.text}
                      </span>
                      <span className={styles.suggestionType}>
                        {suggestion.type}
                      </span>
                    </div>
                  ))
                ) : searchTerm.length >= 2 ? (
                  <div className={styles.noSuggestions}>
                    <span>No suggestions found</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <button
            type="submit"
            className={styles.searchButton}
            aria-label="Search"
          >
            <FontAwesomeIcon icon={faSearch} />
          </button>

          {isMobile && (
            <button
              type="button"
              className={styles.mobileCloseButton}
              onClick={handleCloseMobileSearch}
              aria-label="Close search"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </form>
      </div>

      {isMobile && (
        <button
          className={styles.mobileSearchButton}
          onClick={() => setShowMobileSearch(!showMobileSearch)}
          aria-label="Search"
        >
          <FontAwesomeIcon icon={faSearch} />
        </button>
      )}

      <div className={styles.headerRight}>
        {/* Centre de notifications */}
        <div className={styles.notificationContainer} ref={notificationsRef}>
          <button
            className={styles.notificationButton}
            onClick={handleNotificationsButtonClick}
            aria-label="Notifications"
          >
            <FontAwesomeIcon icon={faBell} />
            {unreadNotifications > 0 && (
              <span className={styles.notificationBadge}>
                {unreadNotifications}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div
              className={`${styles.dropdown} ${styles.notificationDropdown}`}
            >
              <div className={styles.notificationHeader}>
                <span className={styles.notificationTitle}>Notifications</span>
                {unreadNotifications === 0 ? (
                  <span className={styles.notificationStatus}>
                    All caught up
                  </span>
                ) : (
                  <button
                    type="button"
                    className={styles.markAllReadButton}
                    onClick={markAllAsRead}
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className={styles.notificationBody}>
                {isLoadingNotifications ? (
                  <div className={styles.notificationEmpty}>
                    <FontAwesomeIcon
                      icon={faBell}
                      className={styles.notificationEmptyIcon}
                    />
                    <span>Loading notifications...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className={styles.notificationEmpty}>
                    <FontAwesomeIcon
                      icon={faBell}
                      className={styles.notificationEmptyIcon}
                    />
                    <span>No notifications yet</span>
                    <p>We’ll let you know when something happens.</p>
                  </div>
                ) : (
                  <div className={styles.notificationList}>
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        className={`${styles.notificationItem} ${
                          !notification.read
                            ? styles.notificationItemUnread
                            : ''
                        }`}
                        onClick={() =>
                          handleNotificationClick(notification)
                        }
                      >
                        <div className={styles.notificationIconWrapper}>
                          <FontAwesomeIcon
                            icon={getNotificationIcon(notification)}
                            className={styles.notificationIcon}
                          />
                          {!notification.read && (
                            <span className={styles.notificationUnreadDot} />
                          )}
                        </div>
                        <div className={styles.notificationContent}>
                          <span className={styles.notificationItemTitle}>
                            {notification.title}
                          </span>
                          <span className={styles.notificationMessage}>
                            {notification.message}
                          </span>
                          <span className={styles.notificationMeta}>
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.notificationFooter}>
                <button
                  type="button"
                  className={styles.viewAllNotificationsButton}
                  onClick={() => {
                    setIsNotificationsOpen(false);
                    navigate('/dashboard/notifications');
                  }}
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.profileContainer} ref={profileDropdownRef}>
          <button
            className={styles.profileButton}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-label="Profile menu"
          >
            <img
              src={getImageUrl(user?.photo_profil)}
              alt="Profile"
              className={styles.profileImage}
              crossOrigin="anonymous"
            />
          </button>

          {isDropdownOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <img
                  src={getImageUrl(user?.photo_profil)}
                  alt="Profile"
                  className={styles.dropdownProfileImage}
                  crossOrigin="anonymous"
                />
                <div className={styles.dropdownUserInfo}>
                  <span className={styles.dropdownUserName}>
                    {user?.prenom || 'Guest'} {user?.nom || 'User'}
                  </span>
                  <span className={styles.dropdownUserEmail}>
                    {user?.email || 'guest@example.com'}
                  </span>
                </div>
              </div>

              <div className={styles.dropdownBody}>
                <button
                  className={styles.dropdownItem}
                  onClick={handleProfileClick}
                >
                  <FontAwesomeIcon
                    icon={faUser}
                    className={styles.dropdownIcon}
                  />
                  <span>Your Profile</span>
                </button>

                <button
                  className={styles.dropdownItem}
                  onClick={() =>
                    navigate('/dashboard/playlists')
                  }
                >
                  <FontAwesomeIcon
                    icon={faMusic}
                    className={styles.dropdownIcon}
                  />
                  <span>Your Playlists</span>
                </button>

                <div className={styles.dropdownDivider}></div>

                <button
                  className={styles.dropdownItem}
                  onClick={handleSettingsClick}
                >
                  <FontAwesomeIcon
                    icon={faCog}
                    className={styles.dropdownIcon}
                  />
                  <span>Settings</span>
                </button>

                <button
                  className={styles.dropdownItem}
                  onClick={handleLogoutClick}
                >
                  <FontAwesomeIcon
                    icon={faSignOutAlt}
                    className={styles.dropdownIcon}
                  />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
