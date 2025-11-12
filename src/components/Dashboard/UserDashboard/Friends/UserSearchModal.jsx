// src/components/Dashboard/UserDashboard/Friends/UserSearchModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import styles from './Friends.module.css';
import { friendsAPI } from '../../../../utils/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faMagnifyingGlass,
  faUserPlus,
  faSpinner,
  faMusic,
  faLocationDot
} from '@fortawesome/free-solid-svg-icons';

const UserSearchModal = ({ onClose, onSendRequest, currentUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debounceTimeout, setDebounceTimeout] = useState(null);

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/150';
    if (path.startsWith('http')) return path;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const backendUrl = process.env.REACT_APP_API_URL || 'https://api.throwback-connect.com';
    return `${backendUrl}${normalizedPath}`;
  };

  const searchUsers = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await friendsAPI.searchUsers(query);
      
      if (response.success) {
        // Filtrer pour exclure admin, superadmin et l'utilisateur courant
        const filteredUsers = response.data.filter(user => {
          // Exclure l'utilisateur courant
          if (user._id === currentUser?.id) return false;
          
          // Exclure admin et superadmin
          const userRole = user.role || (user.roles && user.roles[0]?.libelle_role);
          if (userRole === 'admin' || userRole === 'superadmin') return false;
          
          return true;
        });

        const enrichedUsers = filteredUsers.map(user => ({
          id: user._id,
          name: `${user.prenom} ${user.nom}`,
          username: `@${user.email.split('@')[0]}`,
          avatar: getImageUrl(user.photo_profil),
          location: user.ville || 'Unknown',
          bio: user.bio || '',
          mutualFriends: 0,
          favoriteGenres: [],
          isFriend: user.isFriend || false,
          requestSent: user.requestSent || false
        }));

        setSearchResults(enrichedUsers);
      } else {
        setError(response.message || 'Failed to search users');
      }
    } catch (err) {
      console.error('Error searching users:', err);
      setError('An error occurred while searching');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    // Debounce search
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      searchUsers(searchQuery);
    }, 500);

    setDebounceTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [searchQuery, searchUsers]);

  const handleSendRequest = async (userId) => {
    await onSendRequest(userId);
    // Mettre à jour l'état local
    setSearchResults(prev => 
      prev.map(user => 
        user.id === userId 
          ? { ...user, requestSent: true } 
          : user
      )
    );
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: 24 }} />
            Search Users
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} style={{ fontSize: 24 }} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Search Input */}
          <div className={styles.searchInputWrapper}>
            <FontAwesomeIcon 
              icon={faMagnifyingGlass} 
              style={{ fontSize: 20, color: '#9ca3af' }} 
            />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.modalSearchInput}
              autoFocus
            />
          </div>

          {/* Results */}
          <div className={styles.searchResults}>
            {loading && (
              <div className={styles.searchLoading}>
                <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: 32, color: '#b31217' }} />
                <p>Searching...</p>
              </div>
            )}

            {error && (
              <div className={styles.searchError}>
                <p>⚠️ {error}</p>
              </div>
            )}

            {!loading && !error && searchQuery.length >= 2 && searchResults.length === 0 && (
              <div className={styles.searchEmpty}>
                <p>No users found for "{searchQuery}"</p>
              </div>
            )}

            {!loading && searchResults.length > 0 && (
              <div className={styles.userSearchList}>
                {searchResults.map(user => (
                  <div key={user.id} className={styles.userSearchItem}>
                    <div className={styles.userSearchInfo}>
                      <div className={styles.avatar}>
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className={styles.avatarImg} />
                        ) : (
                          <div className={styles.avatarPlaceholder}>
                            {getInitials(user.name)}
                          </div>
                        )}
                      </div>
                      <div className={styles.userSearchDetails}>
                        <h3 className={styles.userSearchName}>{user.name}</h3>
                        <p className={styles.userSearchUsername}>{user.username}</p>
                        {user.location && (
                          <p className={styles.userSearchLocation}>
                            <FontAwesomeIcon icon={faLocationDot} style={{ fontSize: 12 }} />
                            {user.location}
                          </p>
                        )}
                        {user.bio && (
                          <p className={styles.userSearchBio}>{user.bio}</p>
                        )}
                      </div>
                    </div>
                    <div className={styles.userSearchAction}>
                      {user.isFriend ? (
                        <button className={styles.alreadyFriendButton} disabled>
                          ✓ Friends
                        </button>
                      ) : user.requestSent ? (
                        <button className={styles.requestSentButton} disabled>
                          ✓ Request Sent
                        </button>
                      ) : (
                        <button 
                          className={styles.addFriendButton}
                          onClick={() => handleSendRequest(user.id)}
                        >
                          <FontAwesomeIcon icon={faUserPlus} style={{ fontSize: 16 }} />
                          Add Friend
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && searchQuery.length < 2 && (
              <div className={styles.searchHint}>
                <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: 48, color: '#e5e7eb' }} />
                <p>Type at least 2 characters to search</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSearchModal;