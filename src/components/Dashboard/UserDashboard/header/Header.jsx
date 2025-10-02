// Header.jsx
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
  faMusic,
  faVideo,
  faList,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../../contexts/AuthContext';
import { searchAPI } from '../../../../utils/api';
import { getAvatarUrl } from '../../../../utils/imageUrl'; // ✅ centralisé

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
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false);
  const [showClearButton, setShowClearButton] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 480 : false);

  // Auto-complétion
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const createDropdownRef = useRef(null);
  const suggestionsRef = useRef(null);
  const navigate = useNavigate();

  // Détecter la taille de l'écran
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 480);
      if (window.innerWidth > 480) setShowMobileSearch(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Detect clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (createDropdownRef.current && !createDropdownRef.current.contains(event.target)) {
        setIsCreateDropdownOpen(false);
      }
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
        searchInputRef.current && !searchInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus sur l'input quand la recherche mobile est activée
  useEffect(() => {
    if (showMobileSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showMobileSearch]);

  // Récupérer les suggestions
  const fetchSuggestions = async (value) => {
    if (!value || value.length < 2) {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      return;
    }
    try {
      setIsLoadingSuggestions(true);
      const response = await searchAPI.getSearchSuggestions(value);
      setSuggestions(response.success ? (response.data || []) : []);
    } catch (error) {
      console.error('Erreur lors de la récupération des suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Debounce suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) fetchSuggestions(searchTerm);
      else setSuggestions([]);
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
    searchInputRef.current?.focus();
  };

  const handleSelectSuggestion = (suggestion) => {
    setSearchTerm(suggestion.query || suggestion.text);
    setShowSuggestions(false);
    navigate(`/dashboard/search?q=${encodeURIComponent(suggestion.query || suggestion.text)}&type=${suggestion.type !== 'artist' ? suggestion.type : 'videos'}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/dashboard/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setShowSuggestions(false);
      if (isMobile) setShowMobileSearch(false);
    }
  };

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
  const handleNotificationsClick = () => {
    navigate('/dashboard/notifications', { state: { title: 'Notifications' } });
  };
  const handleMenuButtonClick = () => {
    toggleSidebar();
  };
  const handleCloseMobileSearch = () => {
    setShowMobileSearch(false);
    setShowSuggestions(false);
  };

  const avatarSrc = getAvatarUrl(user); // ✅ URL corrigée/normalisée (id toujours cohérent)

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <button
          className={styles.menuButton}
          onClick={handleMenuButtonClick}
          aria-label="Menu"
        >
          {/* Optionnel: icône 'burger' si tu en as une dans le design */}
        </button>

        <Link to="/dashboard" className={styles.logoLink}>
          <span className={styles.logoText}>ThrowBack Connect</span>
        </Link>
      </div>

      <div className={`${styles.searchContainer} ${showMobileSearch ? styles.showMobileSearch : ''}`}>
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
                          suggestion.type === 'video' ? faVideo :
                          suggestion.type === 'playlist' ? faList :
                          suggestion.type === 'podcast' ? faMicrophone :
                          suggestion.type === 'artist' ? faMusic :
                          faSearch
                        }
                        className={styles.suggestionIcon}
                      />
                      <span className={styles.suggestionText}>{suggestion.text}</span>
                      <span className={styles.suggestionType}>{suggestion.type}</span>
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

          <button type="submit" className={styles.searchButton} aria-label="Search">
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
        <button
          className={styles.notificationButton}
          onClick={handleNotificationsClick}
          aria-label="Notifications"
        >
          <FontAwesomeIcon icon={faBell} />
          {unreadNotifications > 0 && (
            <span className={styles.notificationBadge}>{unreadNotifications}</span>
          )}
          <span style={{
            ...comingSoonStyle,
            position: 'absolute',
            bottom: '-18px',
            left: '50%',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap'
          }}>Coming Soon</span>
        </button>

        <div className={styles.profileContainer} ref={dropdownRef}>
          <button
            className={styles.profileButton}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-label="Profile menu"
          >
            <img
              src={avatarSrc}
              alt="Profile"
              className={styles.profileImage}
              crossOrigin="anonymous"
              onError={(e) => { e.currentTarget.src = '/images/default-avatar.png'; }}
            />
          </button>

          {isDropdownOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <img
                  src={avatarSrc}
                  alt="Profile"
                  className={styles.dropdownProfileImage}
                  crossOrigin="anonymous"
                  onError={(e) => { e.currentTarget.src = '/images/default-avatar.png'; }}
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
                <button className={styles.dropdownItem} onClick={handleProfileClick}>
                  <FontAwesomeIcon icon={faUser} className={styles.dropdownIcon} />
                  <span>Your Profile</span>
                </button>

                <button className={styles.dropdownItem} onClick={() => navigate('/dashboard/playlists')}>
                  <FontAwesomeIcon icon={faMusic} className={styles.dropdownIcon} />
                  <span>Your Playlists</span>
                </button>

                <div className={styles.dropdownDivider}></div>

                <button className={styles.dropdownItem} onClick={handleSettingsClick}>
                  <FontAwesomeIcon icon={faCog} className={styles.dropdownIcon} />
                  <span>Settings</span>
                </button>

                <button className={styles.dropdownItem} onClick={handleLogoutClick}>
                  <FontAwesomeIcon icon={faSignOutAlt} className={styles.dropdownIcon} />
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
