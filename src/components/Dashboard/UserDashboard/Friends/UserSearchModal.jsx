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
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/150';
    if (path.startsWith('http')) return path;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const backendUrl = process.env.REACT_APP_API_URL || 'https://api.throwback-connect.com';
    return `${backendUrl}${normalizedPath}`;
  };

  const searchUsers = useCallback(
    async (query) => {
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
          const filteredUsers = response.data.filter((user) => {
            // Exclure l'utilisateur courant
            if (user._id === currentUser?.id) return false;

            // Exclure admin et superadmin
            const userRole = user.role || (user.roles && user.roles[0]?.libelle_role);
            if (userRole === 'admin' || userRole === 'superadmin') return false;

            return true;
          });

          const enrichedUsers = filteredUsers.map((user) => ({
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
    },
    [currentUser]
  );

  useEffect(() => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchUsers(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);

    setDebounceTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [searchQuery, searchUsers]);

  const handleSendRequest = async (userId) => {
    await onSendRequest(userId);
    // Mettre à jour l'état local (optimiste)
    setSearchResults((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, requestSent: true } : user
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
          <div className={styles.searchInputWrapper}>
            <FontAwesomeIcon icon={faMagnifyingGlass} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.resultsContainer}>
            {loading && (
              <div className={styles.loadingState}>
                <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: 32 }} />
                <p>Searching users...</p>
              </div>
            )}

            {!loading && error && (
              <div className={styles.errorState}>
                <p>{error}</p>
              </div>
            )}

            {!loading && !error && searchResults.length === 0 && searchQuery.length >= 2 && (
              <div className={styles.emptyState}>
                <p>No users found for “{searchQuery}”.</p>
              </div>
            )}

            {!loading && !error && searchResults.length > 0 && (
              <div className={styles.resultsList}>
                {searchResults.map((user) => (
                  <div key={user.id} className={styles.userCard}>
                    <div className={styles.userAvatar}>
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} />
                      ) : (
                        <span>{getInitials(user.name)}</span>
                      )}
                    </div>

                    <div className={styles.userInfo}>
                      <h3 className={styles.userName}>{user.name}</h3>
                      <p className={styles.userUsername}>{user.username}</p>
                      <div className={styles.userMeta}>
                        <span>
                          <FontAwesomeIcon icon={faLocationDot} /> {user.location}
                        </span>
                        <span>
                          <FontAwesomeIcon icon={faMusic} /> {user.favoriteGenres.length}{' '}
                          genres
                        </span>
                      </div>
                    </div>

                    <div className={styles.userActions}>
                      <button
                        className={styles.addButton}
                        onClick={() => handleSendRequest(user.id)}
                        disabled={user.requestSent}
                      >
                        <FontAwesomeIcon icon={faUserPlus} style={{ fontSize: 18 }} />
                        {user.requestSent ? 'Request Sent' : 'Add Friend'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && searchQuery.length < 2 && (
              <div className={styles.searchHint}>
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  style={{ fontSize: 48, color: '#e5e7eb' }}
                />
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
